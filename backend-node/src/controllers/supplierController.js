import { supplierService } from '../services/supplierService.js';
import { successResponse } from '../utils/apiResponse.js';

class SupplierController {
  async getAll(req, res, next) {
    try {
      const { search, status, page, limit } = req.query;
      const { suppliers, meta } = await supplierService.getAll({ search, status, page, limit });
      return successResponse(res, { data: suppliers, meta });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const supplier = await supplierService.getById(req.params.id);
      return successResponse(res, { data: supplier });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const supplier = await supplierService.create(req.body, req.user?.id);
      return successResponse(res, {
        statusCode: 201,
        message: 'Proveedor registrado exitosamente',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const supplier = await supplierService.update(req.params.id, req.body, req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Proveedor actualizado exitosamente',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const supplier = await supplierService.delete(req.params.id, req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Proveedor eliminado exitosamente',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const supplierController = new SupplierController();
