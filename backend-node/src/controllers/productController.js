import { productService } from '../services/productService.js';
import { successResponse } from '../utils/apiResponse.js';

class ProductController {
  async getAll(req, res, next) {
    try {
      const { search, category, status, lowStock, sortBy, sortOrder, page, limit } = req.query;
      const { products, meta } = await productService.getAll({
        search,
        category,
        status,
        lowStock,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return successResponse(res, { data: products, meta });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getById(req.params.id);
      return successResponse(res, { data: product });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.create(req.body, req.user?.id);
      return successResponse(res, {
        statusCode: 201,
        message: 'Producto creado exitosamente con stock inicial en cero',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.update(req.params.id, req.body, req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Producto actualizado exitosamente',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await productService.delete(req.params.id, req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: result.message,
        data: {
          product: result.product,
          softDeleted: result.softDeleted,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
