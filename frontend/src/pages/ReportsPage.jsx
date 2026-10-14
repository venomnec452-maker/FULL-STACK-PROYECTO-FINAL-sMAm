import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { FileBarChart, Download, DollarSign, TrendingUp, Package, RefreshCw } from 'lucide-react';

export const ReportsPage = () => {
  const [stockReport, setStockReport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStockReport = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/reports/stock');
      setStockReport(res.data.data);
    } catch (err) {
      console.error('Error al cargar reporte de stock', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockReport();
  }, []);

  const totalCost = stockReport.reduce((acc, p) => acc + (p.valuationCost || 0), 0);
  const totalSale = stockReport.reduce((acc, p) => acc + (p.valuationSale || 0), 0);
  const potentialProfit = totalSale - totalCost;

  const exportToCSV = () => {
    const headers = [
      'SKU',
      'Producto',
      'Categoria',
      'Stock Actual',
      'Stock Minimo',
      'Unidad',
      'Precio Costo',
      'Precio Venta',
      'Margen %',
      'Valor Costo Total',
      'Valor Venta Total',
    ];

    const rows = stockReport.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.currentStock,
      p.minStock,
      p.unit,
      p.costPrice,
      p.salePrice,
      p.marginPercent,
      p.valuationCost,
      p.valuationSale,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockMaster_Reporte_Inventario_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(
      val || 0
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reporte Financiero y Valorización de Inventario
          </h1>
          <p className="text-sm text-slate-500">
            Cálculo de márgenes de ganancia, inversión en almacén y exportación de datos contables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStockReport}
            className="p-2.5 bg-white dark:bg-slate-800 border rounded-xl text-slate-700 hover:bg-slate-50"
            title="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Capital Inmovilizado (Costo)
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalCost)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Costo total de adquisición de las existencias</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recupero Proyectado (Venta)
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalSale)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Ingreso bruto esperado por ventas</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Margen Bruto Proyectado
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <FileBarChart className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(potentialProfit)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Ganancia neta esperada al realizar el stock</p>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold">Categoría</th>
                  <th className="px-5 py-3 font-semibold text-center">Stock</th>
                  <th className="px-5 py-3 font-semibold text-right">Costo Unit.</th>
                  <th className="px-5 py-3 font-semibold text-right">Venta Unit.</th>
                  <th className="px-5 py-3 font-semibold text-center">Margen %</th>
                  <th className="px-5 py-3 font-semibold text-right">Val. Costo</th>
                  <th className="px-5 py-3 font-semibold text-right">Val. Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {stockReport.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {p.sku}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{p.category}</td>
                    <td className="px-5 py-3.5 text-center font-bold">
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">${p.costPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900 dark:text-slate-100">
                      ${p.salePrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">
                      +{p.marginPercent}%
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700 font-medium">
                      ${p.valuationCost.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                      ${p.valuationSale.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
