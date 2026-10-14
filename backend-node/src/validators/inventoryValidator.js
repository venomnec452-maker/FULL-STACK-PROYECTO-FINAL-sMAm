import { z } from 'zod';

export const stockEntrySchema = z.object({
  body: z.object({
    product: z.string({ required_error: 'El ID del producto es obligatorio' }),
    quantity: z
      .number({ required_error: 'La cantidad a ingresar es obligatoria' })
      .int('La cantidad debe ser un número entero')
      .min(1, 'La cantidad debe ser al menos 1 unidad'),
    supplier: z.string().optional().nullable(),
    documentReference: z
      .string()
      .trim()
      .optional()
      .default(''),
    reason: z
      .string({ required_error: 'El motivo de la entrada es obligatorio' })
      .min(3, 'El motivo debe contener al menos 3 caracteres')
      .trim(),
    notes: z.string().trim().optional().default(''),
  }),
});

export const stockExitSchema = z.object({
  body: z.object({
    product: z.string({ required_error: 'El ID del producto es obligatorio' }),
    quantity: z
      .number({ required_error: 'La cantidad a despachar es obligatoria' })
      .int('La cantidad debe ser un número entero')
      .min(1, 'La cantidad debe ser al menos 1 unidad'),
    documentReference: z
      .string()
      .trim()
      .optional()
      .default(''),
    reason: z
      .string({ required_error: 'El motivo de la salida es obligatorio' })
      .min(3, 'El motivo debe contener al menos 3 caracteres')
      .trim(),
    notes: z.string().trim().optional().default(''),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    product: z.string({ required_error: 'El ID del producto es obligatorio' }),
    newStock: z
      .number({ required_error: 'El nuevo stock físico es obligatorio' })
      .int('El nuevo stock debe ser un número entero')
      .min(0, 'El stock físico no puede ser negativo'),
    reason: z
      .string({ required_error: 'El motivo del ajuste es obligatorio' })
      .min(5, 'Debe especificar un motivo detallado para el ajuste de auditoría (mínimo 5 caracteres)')
      .trim(),
    documentReference: z.string().trim().optional().default(''),
    notes: z.string().trim().optional().default(''),
  }),
});
