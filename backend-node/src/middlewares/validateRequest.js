import { BadRequestError } from '../utils/appError.js';

/**
 * Middleware de orden superior para validar la solicitud HTTP contra un esquema Zod.
 * Valida de forma declarativa req.body, req.query o req.params.
 *
 * @param {import('zod').ZodSchema} schema - Esquema Zod a validar
 */
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Reasigna los valores ya validados y transformados (ej. trim, lowercase)
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (err) {
    if (err.errors) {
      // Mapea los errores de Zod a un formato legible por campo
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      }));

      return next(new BadRequestError('Error en los datos enviados', formattedErrors));
    }
    next(err);
  }
};
