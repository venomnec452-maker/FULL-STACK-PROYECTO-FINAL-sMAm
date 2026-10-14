import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  description: z.string().optional(),
  sku: z.string().min(3, 'El SKU debe tener al menos 3 caracteres').toUpperCase().trim(),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Seleccione una categoría'),
  unit: z.enum(['unidad', 'kg', 'litro', 'metro', 'caja', 'paquete']),
  costPrice: z.coerce.number().min(0, 'El precio de costo no puede ser negativo'),
  salePrice: z.coerce.number().min(0, 'El precio de venta no puede ser negativo'),
  minStock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo'),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const ProductsPage = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal de Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      unit: 'unidad',
      costPrice: 0,
      salePrice: 0,
      minStock: 5,
      status: 'active',
      location: 'Depósito Principal',
    },
  });

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories?limit=100');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Error al cargar categorías', err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (statusFilter) params.append('status', statusFilter);
      if (lowStockFilter) params.append('lowStock', 'true');

      const res = await apiClient.get(`/products?${params.toString()}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error('Error al cargar productos', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, statusFilter, lowStockFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormError('');
    reset({
      name: '',
      description: '',
      sku: '',
      barcode: '',
      category: categories[0]?._id || '',
      unit: 'unidad',
      costPrice: 0,
      salePrice: 0,
      minStock: 5,
      location: 'Depósito Principal',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormError('');
    reset({
      name: prod.name,
      description: prod.description || '',
      sku: prod.sku,
      barcode: prod.barcode || '',
      category: prod.category?._id || prod.category,
      unit: prod.unit,
      costPrice: prod.costPrice,
      salePrice: prod.salePrice,
      minStock: prod.minStock,
      location: prod.location || 'Depósito Principal',
      status: prod.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setFormError('');
    try {
      if (editingProduct) {
        await apiClient.patch(`/products/${editingProduct._id}`, data);
      } else {
        await apiClient.post('/products', data);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Error al procesar la operación en el producto'
      );
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`¿Está seguro de eliminar o desactivar el producto '${prod.name}'?`)) {
      return;
    }

    try {
      const res = await apiClient.delete(`/products/${prod._id}`);
      alert(res.data.message || 'Operación completada');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar producto');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Botón de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogo de Productos</h1>
          <p className="text-sm text-slate-500">
            Administración centralizada de artículos, existencias, precios y ubicaciones físicas.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o código..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filtro Categoría */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-300"
        >
          <option value="">Todas las Categorías</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Filtro Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 dark:text-slate-300"
        >
          <option value="">Todos los Estados</option>
          <option value="active">Solo Activos</option>
          <option value="inactive">Solo Inactivos</option>
        </select>

        {/* Toggle Stock Bajo */}
        <button
          type="button"
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
            lowStockFilter
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Solo Stock Bajo</span>
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium">No se encontraron productos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold">Categoría</th>
                  <th className="px-5 py-3 font-semibold text-center">Stock Actual</th>
                  <th className="px-5 py-3 font-semibold text-center">Stock Mínimo</th>
                  <th className="px-5 py-3 font-semibold text-right">Precio Venta</th>
                  <th className="px-5 py-3 font-semibold text-center">Estado</th>
                  {isAdmin && <th className="px-5 py-3 font-semibold text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minStock;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {p.sku}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.location || 'Depósito'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {p.category?.name || 'General'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLow
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                          {isLow && <AlertTriangle className="h-3 w-3" />}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-500 font-medium">
                        {p.minStock} {p.unit}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100">
                        ${p.salePrice?.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            p.status === 'active'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {p.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Desactivar o Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Crear / Editar Producto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="my-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Código SKU (Único) *
                  </label>
                  <input
                    type="text"
                    {...register('sku')}
                    placeholder="EJ: TAL-001"
                    className="w-full px-3 py-2 text-sm uppercase font-mono bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Seleccione Categoría</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    {...register('unit')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Precio Costo ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('costPrice')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Precio Venta ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('salePrice')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Stock Mínimo (Alerta) *
                  </label>
                  <input
                    type="number"
                    {...register('minStock')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Ubicación Física en Almacén
                </label>
                <input
                  type="text"
                  {...register('location')}
                  placeholder="Ej: Pasillo 3, Estante B-2"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>

              {!editingProduct && (
                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200">
                  ℹ <strong>Nota de Auditoría de Depósito:</strong> Por regla de negocio (ADR-002), el
                  producto nace con stock inicial en 0. Toda existencia física se añade mediante un
                  remito registrado en el módulo de <strong>Movimientos de Inventario</strong>.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
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
                  {isSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
