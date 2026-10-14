/**
 * Respuestas HTTP estandarizadas para toda la API REST de StockMaster.
 * Garantiza coherencia en el frontend y facilita la documentación Swagger.
 */

export const successResponse = (res, { data = null, message = 'Operación exitosa', statusCode = 200, meta = null }) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta; // Para paginación: { page, limit, total, totalPages }
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (res, { message = 'Ocurrió un error en el servidor', statusCode = 500, errors = null }) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors; // Para detalles de validación Zod o campos duplicados
  }

  return res.status(statusCode).json(response);
};
