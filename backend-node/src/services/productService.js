import { Product, Category, StockMovement, AuditLog } from '../models/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/appError.js';

class ProductService {
  async getAll({
    search = '',
    category = '',
    status = '',
    lowStock = false,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 20,
  }) {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (lowStock === 'true' || lowStock === true) {
      // Regla de Negocio: Productos cuyo stock actual es menor o igual al stock mínimo configurado
      query.$expr = { $lte: ['$currentStock', '$minStock'] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    return {
      products,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async getById(id) {
    const product = await Product.findById(id).populate('category', 'name description');
    if (!product) {
      throw new NotFoundError(`Producto con ID '${id}' no encontrado`);
    }
    return product;
  }

  async create(data, userId) {
    // 1. Validar unicidad del SKU
    const existingSku = await Product.findOne({ sku: data.sku.toUpperCase() });
    if (existingSku) {
      throw new ConflictError(`El código SKU '${data.sku.toUpperCase()}' ya se encuentra registrado`);
    }

    // 2. Validar que la categoría exista
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw new BadRequestError(`La categoría con ID '${data.category}' no existe`);
    }

    // 3. Crear producto con stock inicial en 0 (las existencias se gestionan por movimientos)
    const product = await Product.create({
      ...data,
      sku: data.sku.toUpperCase(),
      currentStock: 0,
    });

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'CREATE_PRODUCT',
        resource: 'Products',
        resourceId: product._id.toString(),
        details: { sku: product.sku, name: product.name, price: product.salePrice },
      });
    }

    return product.populate('category', 'name');
  }

  async update(id, data, userId) {
    // 1. Si se actualiza SKU, verificar que no esté duplicado
    if (data.sku) {
      const existingSku = await Product.findOne({
        sku: data.sku.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingSku) {
        throw new ConflictError(`El código SKU '${data.sku.toUpperCase()}' ya pertenece a otro producto`);
      }
      data.sku = data.sku.toUpperCase();
    }

    // 2. Si se actualiza categoría, verificar que exista
    if (data.category) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        throw new BadRequestError(`La categoría especificada no existe`);
      }
    }

    // 3. Ejecutar actualización sin permitir tocar currentStock
    delete data.currentStock;

    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'name');

    if (!product) {
      throw new NotFoundError(`Producto con ID '${id}' no encontrado`);
    }

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'UPDATE_PRODUCT',
        resource: 'Products',
        resourceId: product._id.toString(),
        details: data,
      });
    }

    return product;
  }

  async delete(id, userId) {
    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError(`Producto con ID '${id}' no encontrado`);
    }

    // Regla de Negocio Crítica (Sección 5):
    // La eliminación física está prohibida si el producto tiene historial de movimientos.
    const movementCount = await StockMovement.countDocuments({ product: id });

    if (movementCount > 0) {
      // Desactivación lógica para preservar la trazabilidad histórica del almacén
      product.status = 'inactive';
      await product.save();

      if (userId) {
        await AuditLog.create({
          user: userId,
          action: 'SOFT_DELETE_PRODUCT',
          resource: 'Products',
          resourceId: id,
          details: {
            reason: `Desactivado lógicamente por contener ${movementCount} movimientos históricos asociados`,
          },
        });
      }

      return {
        product,
        softDeleted: true,
        message: `El producto tiene ${movementCount} movimientos históricos. Fue desactivado lógicamente para no perder trazabilidad.`,
      };
    }

    // Si no registra movimientos históricos, se elimina físicamente
    await Product.findByIdAndDelete(id);

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'DELETE_PRODUCT',
        resource: 'Products',
        resourceId: id,
        details: { sku: product.sku, name: product.name },
      });
    }

    return {
      product,
      softDeleted: false,
      message: 'Producto eliminado físicamente de la base de datos.',
    };
  }
}

export const productService = new ProductService();
