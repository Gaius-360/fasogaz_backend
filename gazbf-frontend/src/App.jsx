// ==========================================
// FICHIER: src/App.jsx
// ==========================================
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

import ProtectedRoute from './components/common/ProtectedRoute';
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute';

// Layouts
import ClientLayout from './components/layout/ClientLayout';
import SellerLayout from './components/layout/SellerLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages publiques
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';
import AdminSellers from './pages/admin/AdminSellers';
import AdminSellerDetail from './pages/admin/AdminSellerDetail';
import AdminPendingSellers from './pages/admin/AdminPendingSellers';
import AdminClients from './pages/admin/AdminClients';
import AdminClientDetail from './pages/admin/AdminClientDetail';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminWallet from './pages/admin/AdminWallet';
import AdminSettings from './pages/admin/AdminSettings';

// Pages Client
import MapPage from './pages/client/MapPage';
import ClientOrders from './pages/client/Orders';
import NewOrder from './pages/client/NewOrder';
import ProfileComplete from './pages/client/ProfileComplete';
import ManageAddresses from './pages/client/ManageAddresses';
import SubscriptionComplete from './pages/client/SubscriptionComplete';
import Reviews from './pages/client/Reviews';
import Settings from './pages/client/Settings';

// Pages Revendeur
import SellerDashboard from './pages/seller/Dashboard';
import SellerOrders from './pages/seller/Orders';
import Products from './pages/seller/Products';
import Customers from './pages/seller/Customers';
import SellerReviews from './pages/seller/Reviews';
import SellerProfile from './pages/seller/Profile';
import SellerSettings from './pages/seller/Settings';
import SellerSubscription from './pages/seller/Subscription';

function App() {
  const { isAuthenticated, user, initAuth } = useAuthStore();

  // 🔄 Restaurer session au démarrage
  useEffect(() => {
    console.log('🚀 Initialisation App...');
    initAuth();
  }, [initAuth]);

  // Log pour debug
  useEffect(() => {
    console.log('📊 Auth State:', { 
      isAuthenticated, 
      role: user?.role,
      username: user?.username || user?.phone 
    });
  }, [isAuthenticated, user]);

  return (
    <Router>
      <Routes>

        {/* RACINE */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : user?.role === 'client' ? (
              <Navigate to="/client/map" replace />
            ) : user?.role === 'revendeur' ? (
              <Navigate to="/seller/dashboard" replace />
            ) : user?.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* CLIENT */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route path="map" element={<MapPage />} />
          <Route path="orders" element={<ClientOrders />} />
          <Route path="order/new" element={<NewOrder />} />
          <Route path="profile" element={<ProfileComplete />} />
          <Route path="addresses" element={<ManageAddresses />} />
          <Route path="subscription" element={<SubscriptionComplete />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* REVENDEUR */}
        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={['revendeur']}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reviews" element={<SellerReviews />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="subscription" element={<SellerSubscription />} />
        </Route>

        {/* ADMIN ✅ */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="sellers/pending" element={<AdminPendingSellers />} />
          <Route path="sellers/:id" element={<AdminSellerDetail />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;