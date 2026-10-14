import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/reports/dashboard
 * @desc    Métricas agregadas, gráficos y productos críticos para el panel principal
 */
router.get('/dashboard', reportController.getDashboard);

/**
 * @route   GET /api/v1/reports/stock
 * @desc    Reporte detallado de existencias, valorización y márgenes de utilidad
 */
router.get('/stock', reportController.getStock);

/**
 * @route   GET /api/v1/reports/movements
 * @desc    Reporte acumulado de movimientos por día del mes
 */
router.get('/movements', reportController.getMovements);

/**
 * @route   GET /api/v1/reports/low-stock
 * @desc    Reporte de productos en punto de reorden / stock mínimo
 */
router.get('/low-stock', reportController.getLowStock);

export default router;
