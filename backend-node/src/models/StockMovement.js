import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['entry', 'exit', 'adjustment'],
        message: 'El tipo de movimiento debe ser: entry, exit o adjustment',
      },
      required: [true, 'El tipo de movimiento es obligatorio'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser mayor o igual a 1'],
    },
    previousStock: {
      type: Number,
      required: [true, 'El stock anterior es obligatorio para trazabilidad'],
      min: [0, 'El stock anterior no puede ser negativo'],
    },
    subsequentStock: {
      type: Number,
      required: [true, 'El stock posterior es obligatorio para trazabilidad'],
      min: [0, 'El stock posterior no puede ser negativo'],
    },
    reason: {
      type: String,
      required: [true, 'El motivo del movimiento es obligatorio'],
      trim: true,
      maxlength: [200, 'El motivo no puede exceder los 200 caracteres'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario responsable es obligatorio'],
      index: true,
    },
    documentReference: {
      type: String,
      trim: true,
      default: '', // Ej: Remito R-0012, Orden Compra OC-455
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

// Índices compuestos para consultas rápidas por producto y fecha
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
