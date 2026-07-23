import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuthContext';
import { AdminLayout } from './AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Products } from './pages/Products';
import { ProductEditor } from './pages/ProductEditor';
import { Customers } from './pages/Customers';
import { Mensagens } from './pages/Mensagens';
import { Settings } from './pages/Settings';
import { Roadmap } from './pages/Roadmap';
import { AdminTranslationBoundary } from './AdminTranslation';

export function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <AdminTranslationBoundary><Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="encomendas" element={<Orders />} />
          <Route path="encomendas/:id" element={<OrderDetail />} />
          <Route path="produtos" element={<Products />} />
          <Route path="produtos/:id" element={<ProductEditor />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="mensagens" element={<Mensagens />} />
          <Route path="definicoes" element={<Settings />} />
          <Route path="roadmap" element={<Roadmap />} />
          {['analytics', 'marketing', 'meta-ads', 'inventario', 'automacao'].map((path) => (
            <Route key={path} path={path} element={<Navigate to="/admin/roadmap" replace />} />
          ))}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes></AdminTranslationBoundary>
    </AdminAuthProvider>
  );
}
