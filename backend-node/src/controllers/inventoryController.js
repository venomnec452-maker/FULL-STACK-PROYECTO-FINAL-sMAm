import { inventoryService } from '../services/inventoryService.js';
import { successResponse } from '../utils/apiResponse.js';

class InventoryController {
  async getSummary(req, res, next) {
    try {
      const summary = await inventoryService.getInventorySummary();
      return successResponse(res, { data: summary });
    } catch (err) {
      next(err);
    }
  }

  async recordEntry(req, res, next) {
    try {
      const { product, quantity, supplier, documentReference, reason, notes } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await inventoryService.recordEntry({
        productId: product,
        quantity,
        supplierId: supplier,
        documentReference,
        reason,
        notes,
        userId: req.user?.id,
        ipAddress,
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'Entrada de mercadería registrada exitosamente',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async recordExit(req, res, next) {
    try {
      const { product, quantity, documentReference, reason, notes } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await inventoryService.recordExit({
        productId: product,
        quantity,
        documentReference,
        reason,
        notes,
        userId: req.user?.id,
        ipAddress,
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'Salida de mercadería registrada exitosamente',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async recordAdjustment(req, res, next) {
    try {
      const { product, newStock, reason, documentReference, notes } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await inventoryService.recordAdjustment({
        productId: product,
        newStock,
        reason,
        documentReference,
        notes,
        userId: req.user?.id,
        ipAddress,
      });

      return successResponse(res, {
        statusCode: 200,
        message: 'Ajuste de inventario físico auditado y registrado exitosamente',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const products = await inventoryService.getLowStockProducts();
      return successResponse(res, {
        message: `Se encontraron ${products.length} productos con stock crítico o mínimo alcanzado`,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req, res, next) {
    try {
      const { product, type, user, supplier, startDate, endDate, page, limit } = req.query;
      const { movements, meta } = await inventoryService.getMovements({
        product,
        type,
        user,
        supplier,
        startDate,
        endDate,
        page,
        limit,
      });

      return successResponse(res, { data: movements, meta });
    } catch (err) {
      next(err);
    }
  }

  async getProductMovements(req, res, next) {
    try {
      const { page, limit } = req.query;
      const { movements, meta } = await inventoryService.getProductMovements(req.params.id, {
        page,
        limit,
      });

      return successResponse(res, { data: movements, meta });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
