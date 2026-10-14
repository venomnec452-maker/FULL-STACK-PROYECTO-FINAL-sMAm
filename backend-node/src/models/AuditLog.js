import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario que ejecutó la acción es obligatorio'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'La acción es obligatoria'],
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: [true, 'El recurso afectado es obligatorio'],
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // En auditoría no se actualiza, solo se crea
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índice descendente por fecha para consultas de auditoría
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
