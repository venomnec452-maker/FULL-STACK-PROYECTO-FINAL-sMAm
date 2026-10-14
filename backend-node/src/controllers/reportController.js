import { reportService } from '../services/reportService.js';
import { inventoryService } from '../services/inventoryService.js';
import { successResponse } from '../utils/apiResponse.js';

class ReportController {
  async getDashboard(req, res, next) {
    try {
      const data = await reportService.getDashboardData();
      return successResponse(res, {
        message: 'Métricas de dashboard obtenidas exitosamente',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStock(req, res, next) {
    try {
      const data = await reportService.getStockReport();
      return successResponse(res, {
        message: 'Reporte de stock y valorización obtenido exitosamente',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req, res, next) {
    try {
      const data = await reportService.getMonthlyMovementsReport();
      return successResponse(res, {
        message: 'Reporte acumulado de movimientos obtenido exitosamente',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const products = await inventoryService.getLowStockProducts();
      return successResponse(res, {
        message: 'Reporte de productos en stock mínimo obtenido exitosamente',
        data: products,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
