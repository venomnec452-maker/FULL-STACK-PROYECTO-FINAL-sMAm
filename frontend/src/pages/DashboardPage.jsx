import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  Package,
  Layers,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Boxes,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/reports/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError('No se pudieron cargar las métricas del dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
        <span>{error || 'Error al obtener datos'}</span>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { summary, recentMovements, criticalProducts, stockByCategory, movementsByType } = data;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(
      val || 0
    );

  return (
    <div className="space-y-6">
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Control</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Resumen en tiempo real del estado de existencias, valorización y movimientos del depósito.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Tarjetas de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Productos */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Productos
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.totalProducts}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {summary.activeProducts} activos en catálogo
            </p>
          </div>
        </div>

        {/* Unidades Físicas */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Físico Total
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary.totalPhysicalItems}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Unidades inventariadas
            </p>
          </div>
        </div>

        {/* Valorización Almacén */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Valorización Costo
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary.totalValuationCost)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Venta: {formatCurrency(summary.totalValuationSale)}
            </p>
          </div>
        </div>

        {/* Alerta de Stock Bajo */}
        <Link
          to="/alertas"
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:border-amber-400 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-amber-600 transition">
              Stock Crítico / Mínimo
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary.lowStockCount}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
              <span>Requieren reposición inmediata &rarr;</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Gráficos Estadísticos con Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Stock por Categoría */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Distribución de Stock por Categoría
          </h3>
          <div className="h-64 w-full">
            {stockByCategory && stockByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="totalStock" name="Unidades en Stock" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No hay stock registrado en las categorías
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Actividad de Movimientos por Tipo */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Volumen de Movimientos (Últimos 30 días)
          </h3>
          <div className="h-64 w-full">
            {movementsByType && movementsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={movementsByType.map((m) => ({
                      name: m._id === 'entry' ? 'Entradas' : m._id === 'exit' ? 'Salidas' : 'Ajustes',
                      value: m.totalQuantity,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {movementsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No hay movimientos registrados en los últimos 30 días
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablas Rápidas de Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Movimientos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Últimos Movimientos
            </h3>
            <Link to="/movimientos" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Ver todos &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {recentMovements && recentMovements.length > 0 ? (
              recentMovements.map((m) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        m.type === 'entry'
                          ? 'bg-emerald-100 text-emerald-700'
                          : m.type === 'exit'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {m.type === 'entry' ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : m.type === 'exit' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {m.product?.name || 'Producto'}
                      </p>
                      <p className="text-xs text-slate-500">
                        SKU: {m.product?.sku} &bull; {m.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        m.type === 'entry'
                          ? 'text-emerald-600'
                          : m.type === 'exit'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {m.type === 'entry' ? '+' : m.type === 'exit' ? '-' : ''}
                      {m.quantity}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No hay movimientos recientes.</p>
            )}
          </div>
        </div>

        {/* Productos en Stock Crítico */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Stock Crítico / Alerta
            </h3>
            <Link to="/alertas" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Ver reporte completo &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {criticalProducts && criticalProducts.length > 0 ? (
              criticalProducts.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      SKU: {p.sku} &bull; Mínimo requerido: {p.minStock} {p.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                      {p.currentStock} {p.unit}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500">
                <p className="text-xs">¡Excelente! No hay productos con stock por debajo del mínimo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
