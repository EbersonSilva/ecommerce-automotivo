import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import ClientLayout from './layouts/ClientLayout'
import AdminLayout from './layouts/AdminLayout'

// Client Pages
import Home from './pages/client/Home'
import ProductList from './pages/client/ProductList'
import ProductDetail from './pages/client/ProductDetail'
import Cart from './pages/client/Cart'
import Checkout from './pages/client/Checkout'
import ClientOrders from './pages/client/Orders'
import ClientOrderDetail from './pages/client/OrderDetail'
import Account from './pages/client/Account'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import Customers from './pages/admin/Customers'
import CustomerForm from './pages/admin/CustomerForm'
import CustomerDetail from './pages/admin/CustomerDetail'
import Products from './pages/admin/Products'
import ProductForm from './pages/admin/ProductForm'
import Stock from './pages/admin/Stock'
import AdminOrders from './pages/admin/Orders'
import Exchanges from './pages/admin/Exchanges'
import Reports from './pages/admin/Reports'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client Storefront Routes */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="produtos" element={<ProductList />} />
          <Route path="produtos/:id" element={<ProductDetail />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="pedidos" element={<ClientOrders />} />
          <Route path="pedidos/:id" element={<ClientOrderDetail />} />
          <Route path="minha-conta" element={<Account />} />
        </Route>

        {/* Administrative Backend Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="clientes/novo" element={<CustomerForm />} />
          <Route path="clientes/:id" element={<CustomerDetail />} />
          <Route path="clientes/:id/editar" element={<CustomerForm />} />
          <Route path="produtos" element={<Products />} />
          <Route path="produtos/novo" element={<ProductForm />} />
          <Route path="produtos/:id/editar" element={<ProductForm />} />
          <Route path="estoque" element={<Stock />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="trocas" element={<Exchanges />} />
          <Route path="relatorios" element={<Reports />} />
        </Route>

        {/* Fallback Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
