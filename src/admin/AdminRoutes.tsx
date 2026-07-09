import { Route, Routes } from 'react-router-dom';
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
import { ComingSoon } from './pages/ComingSoon';
import { Roadmap } from './pages/Roadmap';

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
          <Route path="clientes" element={<Customers />} />
          <Route path="mensagens" element={<Mensagens />} />
          <Route path="definicoes" element={<Settings />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="analytics" element={<ComingSoon />} />
          <Route path="marketing" element={<ComingSoon />} />
          <Route path="meta-ads" element={<ComingSoon />} />
          <Route path="inventario" element={<ComingSoon />} />
          <Route path="automacao" element={<ComingSoon />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
