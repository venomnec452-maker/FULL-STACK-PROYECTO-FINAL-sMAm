import { Supplier, StockMovement, AuditLog } from '../models/index.js';
import { NotFoundError, ConflictError } from '../utils/appError.js';

class SupplierService {
  async getAll({ search = '', status = '', page = 1, limit = 50 }) {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { taxId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit, 10)),
      Supplier.countDocuments(query),
    ]);

    return {
      suppliers,
      meta: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  async getById(id) {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw new NotFoundError(`Proveedor con ID '${id}' no encontrado`);
    }
    return supplier;
  }

  async create(data, userId) {
    const supplier = await Supplier.create(data);

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'CREATE_SUPPLIER',
        resource: 'Suppliers',
        resourceId: supplier._id.toString(),
        details: { name: supplier.name, taxId: supplier.taxId },
      });
    }

    return supplier;
  }

  async update(id, data, userId) {
    const supplier = await Supplier.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      throw new NotFoundError(`Proveedor con ID '${id}' no encontrado`);
    }

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'UPDATE_SUPPLIER',
        resource: 'Suppliers',
        resourceId: supplier._id.toString(),
        details: data,
      });
    }

    return supplier;
  }

  async delete(id, userId) {
    // Si tiene movimientos históricos de entrada, no borrar físicamente; desactivar para no romper trazabilidad
    const movementsWithSupplier = await StockMovement.countDocuments({ supplier: id });
    if (movementsWithSupplier > 0) {
      throw new ConflictError(
        `El proveedor registra ${movementsWithSupplier} remitos o movimientos históricos. Por razones de auditoría, desactívelo en lugar de eliminarlo.`
      );
    }

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      throw new NotFoundError(`Proveedor con ID '${id}' no encontrado`);
    }

    if (userId) {
      await AuditLog.create({
        user: userId,
        action: 'DELETE_SUPPLIER',
        resource: 'Suppliers',
        resourceId: id,
        details: { name: supplier.name },
      });
    }

    return supplier;
  }
}

export const supplierService = new SupplierService();
