import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Rutas de administración (solo rol 'admin')
router.post(
  '/',
  authorize('admin'),
  validateRequest(createCategorySchema),
  categoryController.create
);

router.patch(
  '/:id',
  authorize('admin'),
  validateRequest(updateCategorySchema),
  categoryController.update
);

router.delete('/:id', authorize('admin'), categoryController.delete);

export default router;
