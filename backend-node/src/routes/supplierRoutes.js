import { Router } from 'express';
import { supplierController } from '../controllers/supplierController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplierValidator.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);

// Rutas exclusivas de administración
router.post(
  '/',
  authorize('admin'),
  validateRequest(createSupplierSchema),
  supplierController.create
);

router.patch(
  '/:id',
  authorize('admin'),
  validateRequest(updateSupplierSchema),
  supplierController.update
);

router.delete('/:id', authorize('admin'), supplierController.delete);

export default router;
