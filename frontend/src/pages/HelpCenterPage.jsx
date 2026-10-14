import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HelpCircle, Search, BookOpen, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';

const FALLBACK_ARTICLES = [
  {
    id: 1,
    title: 'Guía de Recepción de Mercadería y Control de Remitos',
    category: 'Manual de Usuario',
    excerpt:
      'Pasos obligatorios para cotejar las cantidades físicas recibidas contra el remito del proveedor antes de confirmar la entrada en el sistema StockMaster.',
    content:
      'Toda entrada de mercadería debe contar con un número de remito o factura físico. El operario debe verificar el estado del embalaje y contar individualmente las piezas. Una vez confirmada la operación en el sistema, el stock se incrementará automáticamente.',
  },
  {
    id: 2,
    title: 'Política de Stock de Seguridad y Punto de Reorden',
    category: 'Buenas Prácticas',
    excerpt:
      'Cómo se calcula el stock mínimo y por qué el sistema activa alertas automáticas cuando las existencias descienden por debajo de este límite.',
    content:
      'El stock de seguridad previene el desabastecimiento provocado por demoras imprevistas del proveedor o picos inusuales de demanda. En StockMaster, el cálculo se evalúa en cada salida; si el stock resultante es menor o igual al mínimo, se genera una alerta inmediata.',
  },
  {
    id: 3,
    title: 'Procedimiento de Auditoría para Ajustes de Inventario Físico',
    category: 'Auditoría',
    excerpt:
      'Condiciones y autorizaciones requeridas para que un Administrador registre ajustes por diferencias de conteo o mermas.',
    content:
      'Los ajustes no pueden ser ejecutados por el personal operario. Requieren autorización del Administrador general y la justificación obligatoria de un motivo en el sistema. Los ajustes generan registros inmutables en StockMovements y AuditLogs.',
  },
  {
    id: 4,
    title: 'Preguntas Frecuentes: ¿Por qué no puedo editar el stock directamente en el producto?',
    category: 'FAQ',
    excerpt:
      'Explicación técnica de la regla de inmutabilidad y consistencia (ADR-002) del inventario.',
    content:
      'Para evitar discrepancias contables y fraudes, StockMaster prohíbe la modificación arbitraria de existencias desde la ficha del producto. Cualquier cambio en las unidades físicas debe sustentarse mediante una Entrada, Salida o Ajuste con fecha, usuario y motivo.',
  },
];

export const HelpCenterPage = () => {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sourceStatus, setSourceStatus] = useState('loading'); // 'wordpress' | 'fallback' | 'loading'

  const fetchArticles = async () => {
    setSourceStatus('loading');
    const wpUrl = import.meta.env.VITE_WORDPRESS_API_URL || 'http://localhost:8080/wp-json/wp/v2';

    try {
      // Intentar consumir WordPress Headless
      const res = await axios.get(`${wpUrl}/posts?_embed`, { timeout: 3000 });
      if (res.data && res.data.length > 0) {
        const wpArticles = res.data.map((post) => ({
          id: post.id,
          title: post.title.rendered,
          category: 'WordPress CMS',
          excerpt: post.excerpt.rendered.replace(/<[^>]+>/g, ''),
          content: post.content.rendered.replace(/<[^>]+>/g, ''),
        }));
        setArticles(wpArticles);
        setSourceStatus('wordpress');
        return;
      }
    } catch (err) {
      // Si WordPress no está activo todavía, activar estrategia de resiliencia
      console.info('[HelpCenter] WordPress no disponible. Utilizando contenido de respaldo local.');
    }

    setArticles(FALLBACK_ARTICLES);
    setSourceStatus('fallback');
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-600" />
            <span>Centro de Ayuda y Manuales de Depósito</span>
          </h1>
          <p className="text-sm text-slate-500">
            Documentación técnica, procedimientos operativos y buenas prácticas de inventario alimentadas por WordPress Headless.
          </p>
        </div>

        {/* Indicador de Origen de Datos (Demuestra el patrón Headless) */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white dark:bg-slate-800">
          <span
            className={`h-2 w-2 rounded-full ${
              sourceStatus === 'wordpress' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          ></span>
          <span className="text-slate-600 dark:text-slate-300">
            {sourceStatus === 'wordpress'
              ? 'Conectado a WordPress Headless REST API'
              : 'Modo Resiliente (Contenido Local en Caché)'}
          </span>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar guías, manuales o preguntas frecuentes..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border rounded-lg"
        >
          <option value="">Todas las Categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Artículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-brand-300 transition flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 mb-2">
                {art.category}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {art.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {art.content}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-right">
              <span className="text-[11px] text-slate-400 font-medium">Procedimiento Oficial</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
