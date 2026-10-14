import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Filter,
  X,
  AlertCircle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const entrySchema = z.object({
  product: z.string().min(1, 'Seleccione un producto'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  supplier: z.string().optional().nullable(),
  documentReference: z.string().min(1, 'Ingrese el remito o comprobante').trim(),
  reason: z.string().min(3, 'El motivo es obligatorio').trim(),
  notes: z.string().optional(),
});

const exitSchema = z.object({
  product: z.string().min(1, 'Seleccione un producto'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  documentReference: z.string().optional(),
  reason: z.string().min(3, 'El motivo es obligatorio (ej. Venta, Despacho)').trim(),
  notes: z.string().optional(),
});

const adjustmentSchema = z.object({
  product: z.string().min(1, 'Seleccione un producto'),
  newStock: z.coerce.number().int().min(0, 'El stock físico no puede ser negativo'),
  reason: z.string().min(5, 'Especifique un motivo detallado de auditoría (mínimo 5 letras)').trim(),
  documentReference: z.string().optional(),
  notes: z.string().optional(),
});

export const MovementsPage = () => {
  const { isAdmin } = useAuth();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  // Modales
  const [activeModal, setActiveModal] = useState(null); // 'entry' | 'exit' | 'adjustment' | null
  const [modalError, setModalError] = useState('');
  const [selectedProductData, setSelectedProductData] = useState(null);

  // Forms
  const entryForm = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: { quantity: 1, reason: 'Recepción de compra' },
  });

  const exitForm = useForm({
    resolver: zodResolver(exitSchema),
    defaultValues: { quantity: 1, reason: 'Despacho a cliente' },
  });

  const adjustmentForm = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { newStock: 0, reason: '' },
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [movsRes, prodsRes, supsRes] = await Promise.all([
        apiClient.get(`/inventory/movements${typeFilter ? `?type=${typeFilter}` : ''}`),
        apiClient.get('/products?limit=100&status=active'),
        apiClient.get('/suppliers?limit=100&status=active'),
      ]);

      setMovements(movsRes.data.data);
      setProducts(prodsRes.data.data);
      setSuppliers(supsRes.data.data);
    } catch (err) {
      console.error('Error al cargar movimientos', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const handleProductSelect = (productId) => {
    const p = products.find((prod) => prod._id === productId);
    setSelectedProductData(p || null);
    if (activeModal === 'adjustment' && p) {
      adjustmentForm.setValue('newStock', p.currentStock);
    }
  };

  const onEntrySubmit = async (data) => {
    setModalError('');
    try {
      await apiClient.post('/inventory/entries', data);
      setActiveModal(null);
      loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error al registrar entrada');
    }
  };

  const onExitSubmit = async (data) => {
    setModalError('');
    try {
      await apiClient.post('/inventory/exits', data);
      setActiveModal(null);
      loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error al registrar salida');
    }
  };

  const onAdjustmentSubmit = async (data) => {
    setModalError('');
    try {
      await apiClient.post('/inventory/adjustments', data);
      setActiveModal(null);
      loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error al registrar ajuste');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Botones de Movimientos */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Movimientos de Almacén
          </h1>
          <p className="text-sm text-slate-500">
            Trazabilidad inmutable de remitos de entrada, despachos de salida y ajustes físicos auditados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Entrada */}
          <button
            onClick={() => {
              setActiveModal('entry');
              setModalError('');
              setSelectedProductData(null);
              entryForm.reset();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium shadow-sm transition"
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>Registrar Entrada</span>
          </button>

          {/* Botón Salida */}
          <button
            onClick={() => {
              setActiveModal('exit');
              setModalError('');
              setSelectedProductData(null);
              exitForm.reset();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium shadow-sm transition"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Registrar Salida</span>
          </button>

          {/* Botón Ajuste (Solo Admin) */}
          {isAdmin && (
            <button
              onClick={() => {
                setActiveModal('adjustment');
                setModalError('');
                setSelectedProductData(null);
                adjustmentForm.reset();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium shadow-sm transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Ajuste de Auditoría</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtro de Tipo */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <Filter className="h-4 w-4 text-slate-400 ml-2" />
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            typeFilter === '' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setTypeFilter('entry')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            typeFilter === 'entry' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Entradas
        </button>
        <button
          onClick={() => setTypeFilter('exit')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            typeFilter === 'exit' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Salidas
        </button>
        <button
          onClick={() => setTypeFilter('adjustment')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            typeFilter === 'adjustment' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Ajustes
        </button>
      </div>

      {/* Tabla del Historial de Movimientos */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ArrowLeftRight className="h-10 w-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium">No se registran movimientos con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">Fecha / Hora</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold text-center">Cantidad</th>
                  <th className="px-5 py-3 font-semibold text-center">Stock Ant.</th>
                  <th className="px-5 py-3 font-semibold text-center">Stock Post.</th>
                  <th className="px-5 py-3 font-semibold">Motivo & Remito</th>
                  <th className="px-5 py-3 font-semibold">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          m.type === 'entry'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'exit'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.type === 'entry' ? (
                          <>
                            <ArrowDownRight className="h-3 w-3" /> Entrada
                          </>
                        ) : m.type === 'exit' ? (
                          <>
                            <ArrowUpRight className="h-3 w-3" /> Salida
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" /> Ajuste
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {m.product?.name || 'Producto'}
                      </div>
                      <div className="text-xs font-mono text-slate-400">{m.product?.sku}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                      {m.type === 'entry' ? '+' : m.type === 'exit' ? '-' : ''}
                      {m.quantity} {m.product?.unit}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500 text-xs">
                      {m.previousStock}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-900 dark:text-slate-100 font-semibold text-xs">
                      {m.subsequentStock}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 dark:text-slate-200 text-xs font-medium">
                        {m.reason}
                      </div>
                      {m.documentReference && (
                        <div className="text-[11px] text-slate-400">Ref: {m.documentReference}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {m.user?.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR ENTRADA */}
      {activeModal === 'entry' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                <span>Recepción de Mercadería (Entrada)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="my-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={entryForm.handleSubmit(onEntrySubmit)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Producto a Ingresar *
                </label>
                <select
                  {...entryForm.register('product')}
                  onChange={(e) => {
                    entryForm.register('product').onChange(e);
                    handleProductSelect(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                >
                  <option value="">Seleccione Producto</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Stock Actual: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
                {entryForm.formState.errors.product && (
                  <p className="text-xs text-red-500 mt-1">
                    {entryForm.formState.errors.product.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Cantidad a Ingresar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...entryForm.register('quantity')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold"
                  />
                  {entryForm.formState.errors.quantity && (
                    <p className="text-xs text-red-500 mt-1">
                      {entryForm.formState.errors.quantity.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Proveedor Asociado
                  </label>
                  <select
                    {...entryForm.register('supplier')}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                  >
                    <option value="">Sin Proveedor / Compra Directa</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  N° de Remito o Factura de Entrada *
                </label>
                <input
                  type="text"
                  placeholder="Ej: REM-004523"
                  {...entryForm.register('documentReference')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg uppercase font-mono"
                />
                {entryForm.formState.errors.documentReference && (
                  <p className="text-xs text-red-500 mt-1">
                    {entryForm.formState.errors.documentReference.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Motivo de la Entrada *
                </label>
                <input
                  type="text"
                  {...entryForm.register('reason')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={entryForm.formState.isSubmitting}
                  className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm"
                >
                  {entryForm.formState.isSubmitting ? 'Confirmando...' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR SALIDA */}
      {activeModal === 'exit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-red-600" />
                <span>Despacho de Mercadería (Salida)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="my-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={exitForm.handleSubmit(onExitSubmit)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Producto a Despachar *
                </label>
                <select
                  {...exitForm.register('product')}
                  onChange={(e) => {
                    exitForm.register('product').onChange(e);
                    handleProductSelect(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                >
                  <option value="">Seleccione Producto</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Stock Actual: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
                {exitForm.formState.errors.product && (
                  <p className="text-xs text-red-500 mt-1">
                    {exitForm.formState.errors.product.message}
                  </p>
                )}
              </div>

              {selectedProductData && (
                <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Existencias Disponibles:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedProductData.currentStock} {selectedProductData.unit}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cantidad a Despachar *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductData?.currentStock || undefined}
                  {...exitForm.register('quantity')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold"
                />
                {exitForm.formState.errors.quantity && (
                  <p className="text-xs text-red-500 mt-1">
                    {exitForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  N° de Pedido, Factura o Remito de Salida
                </label>
                <input
                  type="text"
                  placeholder="Ej: DESP-00891"
                  {...exitForm.register('documentReference')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Motivo del Despacho *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Venta confirmada, Merma o Rotura"
                  {...exitForm.register('reason')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={exitForm.formState.isSubmitting}
                  className="px-5 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium shadow-sm"
                >
                  {exitForm.formState.isSubmitting ? 'Procesando...' : 'Confirmar Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AJUSTE DE AUDITORÍA */}
      {activeModal === 'adjustment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                <span>Ajuste de Inventario Físico (Auditoría)</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="my-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={adjustmentForm.handleSubmit(onAdjustmentSubmit)} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Producto a Ajustar *
                </label>
                <select
                  {...adjustmentForm.register('product')}
                  onChange={(e) => {
                    adjustmentForm.register('product').onChange(e);
                    handleProductSelect(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                >
                  <option value="">Seleccione Producto</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Stock Sistema: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductData && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs space-y-1 border border-amber-200/80">
                  <div className="flex justify-between">
                    <span className="text-amber-800 dark:text-amber-300">Stock registrado en sistema:</span>
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      {selectedProductData.currentStock} {selectedProductData.unit}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nuevo Stock Físico Real Contado *
                </label>
                <input
                  type="number"
                  min="0"
                  {...adjustmentForm.register('newStock')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Motivo Detallado del Ajuste (Obligatorio para Auditoría) *
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej: Diferencia por conteo físico en auditoría trimestral, ajuste por merma..."
                  {...adjustmentForm.register('reason')}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
                ></textarea>
                {adjustmentForm.formState.errors.reason && (
                  <p className="text-xs text-red-500 mt-1">
                    {adjustmentForm.formState.errors.reason.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjustmentForm.formState.isSubmitting}
                  className="px-5 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium shadow-sm"
                >
                  {adjustmentForm.formState.isSubmitting ? 'Guardando Ajuste...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
