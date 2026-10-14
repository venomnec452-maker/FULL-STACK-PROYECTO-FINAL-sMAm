import { Product, StockMovement, AuditLog, Supplier } from '../models/index.js';
import { NotFoundError, BadRequestError } from '../utils/appError.js';

class InventoryService {
  /**
   * Registra una entrada de mercadería al depósito.
   * Incrementa las existencias atómicamente y genera trazabilidad inmutable.
   */
  async recordEntry({
    productId,
    quantity,
    supplierId = null,
    documentReference = '',
    reason,
    notes = '',
    userId,
    ipAddress = '',
  }) {
    if (quantity <= 0) {
      throw new BadRequestError('La cantidad a ingresar debe ser mayor a cero');
    }

    // 1. Verificar existencia y estado del producto
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError(`Producto con ID '${productId}' no encontrado`);
    }
    if (product.status !== 'active') {
      throw new BadRequestError('No se pueden registrar movimientos en un producto inactivo');
    }

    // 2. Si se proporciona proveedor, verificar existencia
    if (supplierId) {
      const supplierExists = await Supplier.findById(supplierId);
      if (!supplierExists) {
        throw new BadRequestError(`El proveedor con ID '${supplierId}' no existe`);
      }
    }

    const previousStock = product.currentStock;
    const subsequentStock = previousStock + quantity;

    // 3. Actualización atómica en base de datos
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { currentStock: quantity } },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    // 4. Registro inmutable del movimiento de stock
    const movement = await StockMovement.create({
      product: productId,
      type: 'entry',
      quantity,
      previousStock,
      subsequentStock,
      reason,
      supplier: supplierId || null,
      user: userId,
      documentReference,
      notes,
    });

    // 5. Auditoría
    await AuditLog.create({
      user: userId,
      action: 'STOCK_ENTRY',
      resource: 'Inventory',
      resourceId: movement._id.toString(),
      details: {
        productSku: product.sku,
        quantity,
        previousStock,
        subsequentStock,
        documentReference,
      },
      ipAddress,
    });

    return {
      movement,
      product: updatedProduct,
    };
  }

  /**
   * Registra una salida / despacho de mercadería del depósito.
   * Aplica control atómico de concurrencia y previene existencias negativas.
   */
  async recordExit({
    productId,
    quantity,
    documentReference = '',
    reason,
    notes = '',
    userId,
    ipAddress = '',
  }) {
    if (quantity <= 0) {
      throw new BadRequestError('La cantidad a despachar debe ser mayor a cero');
    }

    // 1. Operación atómica de decremento condicionada a disponibilidad de stock (currentStock >= quantity)
    // Esto previene condiciones de carrera cuando dos operarios despachan el mismo producto en el mismo milisegundo.
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        currentStock: { $gte: quantity },
        status: 'active',
      },
      {
        $inc: { currentStock: -quantity },
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');

    // 2. Si la actualización no produjo cambios, determinar la causa exacta
    if (!updatedProduct) {
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError(`Producto con ID '${productId}' no encontrado`);
      }
      if (product.status !== 'active') {
        throw new BadRequestError('No se pueden despachar unidades de un producto inactivo');
      }
      if (product.currentStock < quantity) {
        throw new BadRequestError(
          `Stock insuficiente para completar la salida. Stock disponible actual: ${product.currentStock}, cantidad solicitada: ${quantity}`
        );
      }
      throw new BadRequestError('No se pudo procesar la salida de inventario');
    }

    const previousStock = updatedProduct.currentStock + quantity;
    const subsequentStock = updatedProduct.currentStock;

    // 3. Registro inmutable del movimiento de salida
    const movement = await StockMovement.create({
      product: productId,
      type: 'exit',
      quantity,
      previousStock,
      subsequentStock,
      reason,
      supplier: null,
      user: userId,
      documentReference,
      notes,
    });

    // 4. Auditoría
    await AuditLog.create({
      user: userId,
      action: 'STOCK_EXIT',
      resource: 'Inventory',
      resourceId: movement._id.toString(),
      details: {
        productSku: updatedProduct.sku,
        quantity,
        previousStock,
        subsequentStock,
        documentReference,
      },
      ipAddress,
    });

    return {
      movement,
      product: updatedProduct,
    };
  }

  /**
   * Registra un ajuste de inventario (físico vs registrado).
   * Requiere autorización de Administrador y justificación formal.
   */
  async recordAdjustment({
    productId,
    newStock,
    reason,
    documentReference = '',
    notes = '',
    userId,
    ipAddress = '',
  }) {
    if (newStock < 0) {
      throw new BadRequestError('El nuevo stock físico no puede ser negativo');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError(`Producto con ID '${productId}' no encontrado`);
    }

    const previousStock = product.currentStock;
    const subsequentStock = newStock;
    const diff = newStock - previousStock;

    if (diff === 0) {
      throw new BadRequestError('El stock nuevo ingresado es idéntico al actual; no requiere ajuste');
    }

    // Actualizar existencias al valor físico confirmado
    product.currentStock = newStock;
    await product.save();

    // Registro inmutable del ajuste
    const movement = await StockMovement.create({
      product: productId,
      type: 'adjustment',
      quantity: Math.abs(diff),
      previousStock,
      subsequentStock,
      reason: `[AJUSTE AUDITADO: ${diff > 0 ? '+' : ''}${diff}] ${reason}`,
      supplier: null,
      user: userId,
      documentReference: documentReference || 'AJUSTE-MANUAL',
      notes,
    });

    // Auditoría reforzada
    await AuditLog.create({
      user: userId,
      action: 'STOCK_ADJUSTMENT',
      resource: 'Inventory',
      resourceId: movement._id.toString(),
      details: {
        productSku: product.sku,
        previousStock,
        subsequentStock,
        diff,
        reason,
      },
      ipAddress,
    });

    return {
      movement,
      product,
    };
  }

  /**
   * Obtiene la lista de productos que alcanzaron o están por debajo de su stock mínimo.
   */
  async getLowStockProducts() {
    return Product.find({
      $expr: { $lte: ['$currentStock', '$minStock'] },
      status: 'active',
    })
      .populate('category', 'name')
      .sort({ currentStock: 1 });
  }

  /**
   * Obtiene el historial de movimientos de inventario con filtros y paginación.
   */
  async getMovements({
    product = '',
    type = '',
    user = '',
    supplier = '',
    startDate = '',
    endDate = '',
    page = 1,
    limit = 20,
  }) {
    const query = {};

    if (product) query.product = product;
    if (type) query.type = type;
    if (user) query.user = user;
    if (supplier) query.supplier = supplier;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .populate('product', 'name sku unit')
        .populate('user', 'name email role')
        .populate('supplier', 'name taxId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      StockMovement.countDocuments(query),
    ]);

    return {
      movements,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Obtiene el historial de movimientos de un producto específico.
   */
  async getProductMovements(productId, { page = 1, limit = 20 }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [movements, total] = await Promise.all([
      StockMovement.find({ product: productId })
        .populate('user', 'name email')
        .populate('supplier', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      StockMovement.countDocuments({ product: productId }),
    ]);

    return {
      movements,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Resumen general y métricas del inventario.
   */
  async getInventorySummary() {
    const [stats] = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          totalPhysicalItems: { $sum: '$currentStock' },
          totalValuationCost: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
          totalValuationSale: { $sum: { $multiply: ['$currentStock', '$salePrice'] } },
        },
      },
    ]);

    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStock'] },
      status: 'active',
    });

    const totalMovements = await StockMovement.countDocuments();

    return {
      totalProducts: stats ? stats.totalProducts : 0,
      activeProducts: stats ? stats.activeProducts : 0,
      totalPhysicalItems: stats ? stats.totalPhysicalItems : 0,
      totalValuationCost: stats ? Math.round(stats.totalValuationCost * 100) / 100 : 0,
      totalValuationSale: stats ? Math.round(stats.totalValuationSale * 100) / 100 : 0,
      lowStockCount,
      totalMovements,
    };
  }
}

export const inventoryService = new InventoryService();
