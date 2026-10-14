import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Plus, Search, Edit2, Trash2, X, Phone, Mail, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'La razón social es obligatoria').trim(),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const SuppliersPage = () => {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
  });

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/suppliers?search=${encodeURIComponent(search)}`);
      setSuppliers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSuppliers(), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setErrorMessage('');
    reset({ name: '', taxId: '', phone: '', email: '', address: '', status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (sup) => {
    setEditingSupplier(sup);
    setErrorMessage('');
    reset({
      name: sup.name,
      taxId: sup.taxId || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      status: sup.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setErrorMessage('');
    try {
      if (editingSupplier) {
        await apiClient.patch(`/suppliers/${editingSupplier._id}`, data);
      } else {
        await apiClient.post('/suppliers', data);
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al guardar proveedor');
    }
  };

  const handleDelete = async (sup) => {
    if (!window.confirm(`¿Desea eliminar o dar de baja al proveedor '${sup.name}'?`)) return;

    try {
      await apiClient.delete(`/suppliers/${sup._id}`);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar proveedor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proveedores del Almacén</h1>
          <p className="text-sm text-slate-500">
            Registro de fabricantes, distribuidores e importadores para la recepción de compras.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Proveedor</span>
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RUC/CUIT o correo..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border">
            <Truck className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm">No se encontraron proveedores registrados.</p>
          </div>
        ) : (
          suppliers.map((s) => (
            <div
              key={s._id}
              className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                {s.taxId && (
                  <p className="text-xs font-mono text-slate-500 mb-2">ID Fiscal: {s.taxId}</p>
                )}

                <div className="space-y-1 text-xs text-slate-500 mt-3">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Proveedor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Proveedor'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="my-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Razón Social / Nombre *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    RUC / CUIT
                  </label>
                  <input
                    type="text"
                    {...register('taxId')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Dirección del Depósito / Oficina
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
