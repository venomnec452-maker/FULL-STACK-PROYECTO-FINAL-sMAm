import { Product, StockMovement, Category } from '../models/index.js';
import { inventoryService } from './inventoryService.js';

class ReportService {
  /**
   * Métricas y datos para el Dashboard del Frontend (tarjetas de KPI + gráficos de Recharts).
   */
  async getDashboardData() {
    const summary = await inventoryService.getInventorySummary();

    // 1. Obtener los últimos 5 movimientos para la tabla rápida del dashboard
    const recentMovements = await StockMovement.find()
      .populate('product', 'name sku')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 2. Obtener hasta 5 productos con stock crítico
    const criticalProducts = await Product.find({
      $expr: { $lte: ['$currentStock', '$minStock'] },
      status: 'active',
    })
      .populate('category', 'name')
      .sort({ currentStock: 1 })
      .limit(5);

    // 3. Agrupación de movimientos por tipo en los últimos 30 días para gráficos
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movementsByType = await StockMovement.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$type',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Distribución de stock por categoría
    const stockByCategory = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          totalStock: { $sum: '$currentStock' },
          totalProducts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          categoryName: '$categoryInfo.name',
          totalStock: 1,
          totalProducts: 1,
        },
      },
      { $sort: { totalStock: -1 } },
    ]);

    return {
      summary,
      recentMovements,
      criticalProducts,
      movementsByType,
      stockByCategory,
    };
  }

  /**
   * Reporte detallado de existencias con márgenes de ganancia.
   */
  async getStockReport() {
    const products = await Product.find({ status: 'active' })
      .populate('category', 'name')
      .sort({ name: 1 });

    return products.map((p) => {
      const margin = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice) * 100 : 0;
      return {
        id: p._id,
        sku: p.sku,
        name: p.name,
        category: p.category ? p.category.name : 'Sin categoría',
        currentStock: p.currentStock,
        minStock: p.minStock,
        unit: p.unit,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        marginPercent: Math.round(margin * 10) / 10,
        valuationCost: p.currentStock * p.costPrice,
        valuationSale: p.currentStock * p.salePrice,
        isLowStock: p.currentStock <= p.minStock,
      };
    });
  }

  /**
   * Reporte acumulado de movimientos clasificados por día en el mes actual.
   */
  async getMonthlyMovementsReport() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = await StockMovement.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$createdAt' },
            type: '$type',
          },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);

    return stats;
  }
}

export const reportService = new ReportService();
