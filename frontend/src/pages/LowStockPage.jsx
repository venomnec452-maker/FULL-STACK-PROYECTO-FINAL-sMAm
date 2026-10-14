import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { AlertTriangle, Package, ArrowDownRight, RefreshCw } from 'lucide-react';

export const LowStockPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLowStock = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/inventory/low-stock');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Error al cargar alertas de stock bajo', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <span>Alertas de Stock Crítico y Punto de Reorden</span>
          </h1>
          <p className="text-sm text-slate-500">
            Artículos cuyas existencias físicas actuales han alcanzado o descendido por debajo del stock de seguridad.
          </p>
        </div>

        <button
          onClick={fetchLowStock}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm text-slate-700 dark:text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Banner de Estado */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
            {products.length} Producto(s) en Situación de Quiebre de Stock
          </h3>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            Se recomienda emitir solicitudes u órdenes de compra para reabastecer las existencias antes del agotamiento total.
          </p>
        </div>
      </div>

      {/* Tabla de Alertas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ¡Inventario en nivel óptimo!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Ningún producto está por debajo de su umbral de stock mínimo.
            </p>
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
                  <th className="px-5 py-3 font-semibold text-center">Déficit Mínimo</th>
                  <th className="px-5 py-3 font-semibold">Ubicación</th>
                  <th className="px-5 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {products.map((p) => {
                  const deficit = Math.max(0, p.minStock - p.currentStock);

                  return (
                    <tr key={p._id} className="hover:bg-amber-50/30 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {p.sku}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {p.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{p.category?.name || 'General'}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {p.minStock} {p.unit}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-amber-600 dark:text-amber-400">
                        +{deficit} {p.unit}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{p.location || 'Depósito'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to="/movimientos"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm"
                        >
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          <span>Reponer Stock</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
