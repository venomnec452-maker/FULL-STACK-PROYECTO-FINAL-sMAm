import { Category, Product, AuditLog } from '../models/index.js';
import { NotFoundError, ConflictError } from '../utils/appError.js';

class CategoryService {
  async getAll({ search = '', status = '', page = 1, limit = 50 }) {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [categories, total] = await Promise.all([
      Category.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit, 10)),
      Category.countDocuments(query),
    ]);

    return {
      categories,
      meta: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async getById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError(`Categoría con ID '${id}' no encontrada`);
    }
    return category;
  }

  async create(data, userId) {
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      throw new ConflictError(`Ya existe una categoría con el nombre '${data.name}'`);
    }

    const category = await Category.create(data);

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'CREATE_CATEGORY',
        resource: 'Categories',
        resourceId: category._id.toString(),
        details: { name: category.name },
      });
    }

    return category;
  }

  async update(id, data, userId) {
    if (data.name) {
      const existing = await Category.findOne({ name: data.name, _id: { $ne: id } });
      if (existing) {
        throw new ConflictError(`Ya existe otra categoría con el nombre '${data.name}'`);
      }
    }

    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new NotFoundError(`Categoría con ID '${id}' no encontrada`);
    }

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'UPDATE_CATEGORY',
        resource: 'Categories',
        resourceId: category._id.toString(),
        details: data,
      });
    }

    return category;
  }

  async delete(id, userId) {
    // Regla de Integridad Referencial: Verificar que no existan productos asignados a la categoría
    const productsUsingCategory = await Product.countDocuments({ category: id });
    if (productsUsingCategory > 0) {
      throw new ConflictError(
        `No es posible eliminar la categoría porque tiene ${productsUsingCategory} producto(s) vinculado(s). Desactívela o reasigne los productos primero.`
      );
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundError(`Categoría con ID '${id}' no encontrada`);
    }

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'DELETE_CATEGORY',
        resource: 'Categories',
        resourceId: id,
        details: { name: category.name },
      });
    }

    return category;
  }
}

export const categoryService = new CategoryService();
