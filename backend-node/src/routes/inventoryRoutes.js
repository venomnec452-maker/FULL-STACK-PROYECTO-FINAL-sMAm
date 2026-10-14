import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  stockEntrySchema,
  stockExitSchema,
  stockAdjustmentSchema,
} from '../validators/inventoryValidator.js';
import {
  authenticate,
  authorize,
  authenticateOrM2M,
} from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Consultas de inventario
router.get('/', authenticate, inventoryController.getSummary);
router.get('/low-stock', authenticate, inventoryController.getLowStock);
router.get('/movements', authenticate, inventoryController.getMovements);
router.get('/products/:id/movements', authenticate, inventoryController.getProductMovements);

// 2. Entradas de mercadería (Permite usuarios autenticados Y llamadas M2M de Laravel)
router.post(
  '/entries',
  authenticateOrM2M,
  validateRequest(stockEntrySchema),
  inventoryController.recordEntry
);

// 3. Salidas / Despachos de mercadería (Operarios y Administradores)
router.post(
  '/exits',
  authenticate,
  validateRequest(stockExitSchema),
  inventoryController.recordExit
);

// 4. Ajustes de inventario físico (Exclusivo para rol 'admin')
router.post(
  '/adjustments',
  authenticate,
  authorize('admin'),
  validateRequest(stockAdjustmentSchema),
  inventoryController.recordAdjustment
);

export default router;
