import { categoryService } from '../services/categoryService.js';
import { successResponse } from '../utils/apiResponse.js';

class CategoryController {
  async getAll(req, res, next) {
    try {
      const { search, status, page, limit } = req.query;
      const { categories, meta } = await categoryService.getAll({ search, status, page, limit });
      return successResponse(res, { data: categories, meta });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await categoryService.getById(req.params.id);
      return successResponse(res, { data: category });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body, req.user?.id);
      return successResponse(res, {
        statusCode: 201,
        message: 'Categoría creada exitosamente',
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body, req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Categoría actualizada exitosamente',
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const category = await categoryService.delete(req.params.id, req.user?.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Categoría eliminada exitosamente',
        data: category,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
