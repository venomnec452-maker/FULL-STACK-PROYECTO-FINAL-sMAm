import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'La razón social o nombre es obligatorio' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120, 'El nombre no puede exceder 120 caracteres')
      .trim(),
    taxId: z
      .string()
      .trim()
      .optional()
      .default(''),
    phone: z
      .string()
      .trim()
      .optional()
      .default(''),
    email: z
      .string()
      .email('El formato del correo electrónico no es válido')
      .optional()
      .or(z.literal('')),
    address: z
      .string()
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

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120, 'El nombre no puede exceder 120 caracteres')
      .trim()
      .optional(),
    taxId: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().email('El formato del correo electrónico no es válido').optional().or(z.literal('')),
    address: z.string().trim().optional(),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'El estado debe ser: active o inactive' }),
      })
      .optional(),
  }),
});
