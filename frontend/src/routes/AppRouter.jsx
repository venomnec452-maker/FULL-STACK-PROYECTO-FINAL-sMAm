import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { SuppliersPage } from '../pages/SuppliersPage';
import { MovementsPage } from '../pages/MovementsPage';
import { LowStockPage } from '../pages/LowStockPage';
import { ReportsPage } from '../pages/ReportsPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';

export const AppRouter = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Ruta Pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas bajo MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="proveedores" element={<SuppliersPage />} />
          <Route path="movimientos" element={<MovementsPage />} />
          <Route path="alertas" element={<LowStockPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="ayuda" element={<HelpCenterPage />} />
        </Route>

        {/* Fallback para cualquier ruta no mapeada */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
