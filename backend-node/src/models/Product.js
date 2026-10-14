import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [150, 'El nombre no puede superar los 150 caracteres'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
      default: '',
    },
    sku: {
      type: String,
      required: [true, 'El código SKU es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria'],
      index: true,
    },
    unit: {
      type: String,
      enum: {
        values: ['unidad', 'kg', 'litro', 'metro', 'caja', 'paquete'],
        message: 'Unidad de medida no válida',
      },
      default: 'unidad',
    },
    costPrice: {
      type: Number,
      required: [true, 'El precio de costo es obligatorio'],
      min: [0, 'El precio de costo no puede ser negativo'],
      default: 0,
    },
    salePrice: {
      type: Number,
      required: [true, 'El precio de venta es obligatorio'],
      min: [0, 'El precio de venta no puede ser negativo'],
      default: 0,
    },
    currentStock: {
      type: Number,
      required: true,
      min: [0, 'El stock actual no puede ser inferior a 0'],
      default: 0,
      index: true,
    },
    minStock: {
      type: Number,
      required: true,
      min: [0, 'El stock mínimo no puede ser negativo'],
      default: 5,
    },
    location: {
      type: String,
      trim: true,
      default: 'Depósito Principal',
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
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índice de texto compuesto para búsquedas rápidas en el catálogo
productSchema.index({ name: 'text', sku: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
