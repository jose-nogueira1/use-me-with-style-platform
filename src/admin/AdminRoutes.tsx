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
import { CustomerDetail } from './pages/CustomerDetail';
import { Mensagens } from './pages/Mensagens';
import { Settings } from './pages/Settings';
import { Invoices } from './pages/Invoices';
import { Media } from './pages/Media';
import { Coupons } from './pages/Coupons';
import { Roadmap } from './pages/Roadmap';
import { Articles } from './pages/Articles';

export function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="encomendas" element={<Orders />} />
          <Route path="encomendas/:id" element={<OrderDetail />} />
          <Route path="produtos" element={<Products />} />
          <Route path="produtos/:id" element={<ProductEditor />} />
          <Route path="conteudo" element={<Navigate to="/admin/definicoes?tab=content" replace />} />
          <Route path="artigos" element={<Articles />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="clientes/:id" element={<CustomerDetail />} />
          <Route path="mensagens" element={<Mensagens />} />
          <Route path="definicoes" element={<Settings />} />
          <Route path="faturas" element={<Invoices />} />
          <Route path="media" element={<Media />} />
          <Route path="cupoes" element={<Coupons />} />
          <Route path="roadmap" element={<Roadmap />} />
          {['analytics', 'marketing', 'meta-ads', 'inventario', 'automacao'].map((path) => (
            <Route key={path} path={path} element={<Navigate to="/admin/roadmap" replace />} />
          ))}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
