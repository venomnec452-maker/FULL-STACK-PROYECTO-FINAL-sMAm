import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede superar los 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Por favor ingrese un correo electrónico válido',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe contener al menos 8 caracteres'],
      select: false, // Por seguridad no se incluye en las consultas por defecto
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'operario'],
        message: 'El rol debe ser: admin u operario',
      },
      default: 'operario',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'El estado debe ser: active o inactive',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    toJSON: {
      // Oculta la contraseña y el campo __v al convertir a JSON
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Middleware pre-save de Mongoose:
 * Encripta la contraseña con bcrypt antes de persistir, solo si ha sido modificada.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Método de instancia para verificar si la contraseña proporcionada coincide
 * con el hash almacenado en la base de datos.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
