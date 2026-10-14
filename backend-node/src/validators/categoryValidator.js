import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre de la categoría es obligatorio' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'El nombre no puede exceder 80 caracteres')
      .trim(),
    description: z
      .string()
      .max(255, 'La descripción no puede exceder 255 caracteres')
      .trim()
      .optional()
      .default(''),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'El estado debe ser: active o inactive' }),
      })
      .optional()
      .default('active'),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'El nombre no puede exceder 80 caracteres')
      .trim()
      .optional(),
    description: z
      .string()
      .max(255, 'La descripción no puede exceder 255 caracteres')
      .trim()
      .optional(),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'El estado debe ser: active o inactive' }),
      })
      .optional(),
  }),
});
