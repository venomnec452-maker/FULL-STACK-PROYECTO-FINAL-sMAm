import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre del producto es obligatorio' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(150, 'El nombre no puede superar 150 caracteres')
      .trim(),
    description: z
      .string()
      .max(500, 'La descripción no puede superar 500 caracteres')
      .trim()
      .optional()
      .default(''),
    sku: z
      .string({ required_error: 'El SKU es obligatorio' })
      .min(3, 'El SKU debe contener al menos 3 caracteres')
      .toUpperCase()
      .trim(),
    barcode: z.string().trim().optional().default(''),
    category: z.string({ required_error: 'La categoría es obligatoria' }),
    unit: z
      .enum(['unidad', 'kg', 'litro', 'metro', 'caja', 'paquete'], {
        errorMap: () => ({ message: 'Unidad de medida no válida' }),
      })
      .optional()
      .default('unidad'),
    costPrice: z
      .number({ required_error: 'El precio de costo es obligatorio' })
      .min(0, 'El precio de costo no puede ser negativo'),
    salePrice: z
      .number({ required_error: 'El precio de venta es obligatorio' })
      .min(0, 'El precio de venta no puede ser negativo'),
    minStock: z
      .number()
      .min(0, 'El stock mínimo no puede ser negativo')
      .optional()
      .default(5),
    location: z.string().trim().optional().default('Depósito Principal'),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'El estado debe ser: active o inactive' }),
      })
      .optional()
      .default('active'),
  }),
});

export const updateProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(150).trim().optional(),
      description: z.string().max(500).trim().optional(),
      sku: z.string().min(3).toUpperCase().trim().optional(),
      barcode: z.string().trim().optional(),
      category: z.string().optional(),
      unit: z.enum(['unidad', 'kg', 'litro', 'metro', 'caja', 'paquete']).optional(),
      costPrice: z.number().min(0).optional(),
      salePrice: z.number().min(0).optional(),
      minStock: z.number().min(0).optional(),
      location: z.string().trim().optional(),
      status: z.enum(['active', 'inactive']).optional(),
      // Regla de Negocio Crítica: Bloquear edición arbitraria de currentStock
      currentStock: z.any().optional(),
    })
    .refine((data) => data.currentStock === undefined, {
      message:
        'No está permitido modificar el stock directamente mediante edición de producto. Utilice los endpoints de Entradas, Salidas o Ajustes de Inventario.',
      path: ['currentStock'],
    }),
});
