import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createProductSchema, updateProductSchema } from '../validators/productValidator.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Consulta de productos (disponible para admin y operario)
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

// Creación, edición y eliminación (exclusivo para rol admin)
router.post(
  '/',
  authorize('admin'),
  validateRequest(createProductSchema),
  productController.create
);

router.patch(
  '/:id',
  authorize('admin'),
  validateRequest(updateProductSchema),
  productController.update
);

router.delete('/:id', authorize('admin'), productController.delete);

export default router;
