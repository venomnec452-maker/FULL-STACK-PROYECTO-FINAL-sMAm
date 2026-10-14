import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre completo es obligatorio' })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim(),
    email: z
      .string({ required_error: 'El correo electrónico es obligatorio' })
      .email('El formato del correo electrónico no es válido')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener un mínimo de 8 caracteres')
      .regex(/[A-Za-z]/, 'La contraseña debe contener al menos una letra')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    // Por regla de seguridad (Sección 5), el registro público NO puede asignarse rol admin
    role: z
      .enum(['operario'], {
        errorMap: () => ({ message: 'El registro público solo permite el rol de operario' }),
      })
      .optional()
      .default('operario'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El correo electrónico es obligatorio' })
      .email('El formato del correo electrónico no es válido')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(1, 'Debe ingresar su contraseña'),
  }),
});
