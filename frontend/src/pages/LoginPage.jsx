import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Boxes, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Por favor ingrese un correo válido').trim(),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Botones de acceso rápido para demostración académica
  const fillCredentials = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Fondo decorativo de malla */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Cabecera del Formulario */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-3">
            <Boxes className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StockMaster</h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistema Integral de Gestión de Depósito e Inventario
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl flex items-center gap-3 text-red-200 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                {...register('email')}
                placeholder="usuario@stockmaster.com"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm transition"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido para Demostración Académica */}
        <div className="mt-8 pt-6 border-t border-slate-700/80 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Cuentas de Prueba para Defensa:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@stockmaster.com', 'Admin1234!')}
              className="px-3 py-2 bg-slate-900/80 hover:bg-slate-700/80 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('operario@stockmaster.com', 'Operario1234!')}
              className="px-3 py-2 bg-slate-900/80 hover:bg-slate-700/80 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Operario Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
