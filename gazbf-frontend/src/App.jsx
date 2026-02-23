// ==========================================
// FICHIER: src/App.jsx (VERSION COMPLÈTE AVEC AGENTS)
// ==========================================
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { GeolocationProvider } from './contexts/GeolocationContext';

import ProtectedRoute from './components/common/ProtectedRoute';
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute';
import ProtectedAgentRoute from './components/common/ProtectedAgentRoute';

// Layouts
import ClientLayout from './components/layout/ClientLayout';
import SellerLayout from './components/layout/SellerLayout';
import AdminLayout from './components/layout/AdminLayout';
import AgentLayout from './components/layout/AgentLayout';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DevenirRevendeur from './pages/DevenirRevendeur';
import RegisterRevendeur from './pages/RegisterRevendeur';

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
import AdminPricing from './pages/admin/AdminPricing';
import AdminAgents from './pages/admin/AdminAgents';
import AdminInvitations from './pages/admin/AdminInvitations';

// Pages Client
import MapPage from './pages/client/MapPage';
import ClientOrders from './pages/client/OrdersPage';
import CreateOrder from './pages/client/CreateOrder';
import ClientProfile from './pages/client/Profile';
import ManageAddresses from './pages/client/ManageAddresses';
import ClientPaymentHistory from './pages/client/ClientPaymentHistory';
import ClientReviews from './pages/client/Reviews';
import ClientSettings from './pages/client/Settings';
import MyReviews from './pages/client/MyReviews';

// Pages Revendeur
import SellerDashboard from './pages/seller/Dashboard';
import SellerOrders from './pages/seller/Orders';
import Products from './pages/seller/Products';
import Customers from './pages/seller/Customers';
import SellerReviews from './pages/seller/Reviews';
import SellerProfile from './pages/seller/Profile';
import SellerSettings from './pages/seller/Settings';
import SellerSubscription from './pages/seller/Subscription';

// Pages Agent
import AgentLogin from './pages/agent/AgentLogin';
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentInvitations from './pages/agent/AgentInvitations';
import AgentProfile from './pages/agent/AgentProfile';

function App() {
  const { isAuthenticated, user, initAuth } = useAuthStore();

  // Initialisation UNE SEULE FOIS au démarrage
  useEffect(() => {
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router>
      <GeolocationProvider>
        <Routes>

          {/* ========================================= */}
          {/* ROUTES PUBLIQUES */}
          {/* ========================================= */}

          <Route
            path="/"
            element={
              !isAuthenticated ? (
                <Home />
              ) : user?.role === 'client' ? (
                <Navigate to="/client/map" replace />
              ) : user?.role === 'revendeur' ? (
                <Navigate to="/seller/dashboard" replace />
              ) : user?.role === 'admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : user?.role === 'agent' ? (
                <Navigate to="/agent/dashboard" replace />
              ) : (
                <Home />
              )
            }
          />

          {/* Inscription CLIENTS uniquement */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Pages revendeurs */}
          <Route path="/devenir-revendeur" element={<DevenirRevendeur />} />
          <Route path="/register-revendeur" element={<RegisterRevendeur />} />

          {/* ========================================= */}
          {/* 🔐 ADMIN - URL SECRÈTE */}
          {/* ========================================= */}
          <Route 
            path="/secure/admin/3k9f2j8h4n7m/login" 
            element={<AdminLogin />} 
          />

          {/* ========================================= */}
          {/* 🔐 AGENT - URL SECRÈTE */}
          {/* ========================================= */}
          <Route 
            path="/secure/agent/7h3k9m2p5n8q/login" 
            element={<AgentLogin />} 
          />

          {/* ========================================= */}
          {/* ROUTES CLIENT */}
          {/* ========================================= */}
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
            <Route path="order/new" element={<CreateOrder />} />
            <Route path="profile" element={<ClientProfile />} />
            <Route path="addresses" element={<ManageAddresses />} />
            <Route path="my-reviews" element={<MyReviews />} />
            <Route path="payment-history" element={<ClientPaymentHistory />} />
            <Route path="reviews" element={<ClientReviews />} />
            <Route path="settings" element={<ClientSettings />} />
          </Route>

          {/* ========================================= */}
          {/* ROUTES REVENDEUR */}
          {/* ========================================= */}
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

          {/* ========================================= */}
          {/* ROUTES AGENT */}
          {/* ========================================= */}
          <Route
            path="/agent"
            element={
              <ProtectedAgentRoute>
                <AgentLayout />
              </ProtectedAgentRoute>
            }
          >
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="invitations" element={<AgentInvitations />} />
            <Route path="profile" element={<AgentProfile />} />
          </Route>

          {/* ========================================= */}
          {/* ROUTES ADMIN (Protégées) */}
          {/* ========================================= */}
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
            
            {/* Revendeurs */}
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="sellers/pending" element={<AdminPendingSellers />} />
            <Route path="sellers/:id" element={<AdminSellerDetail />} />
            
            {/* Clients */}
            <Route path="clients" element={<AdminClients />} />
            <Route path="clients/:id" element={<AdminClientDetail />} />
            
            {/* Finances */}
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="wallet" element={<AdminWallet />} />
            <Route path="pricing" element={<AdminPricing />} />
            
            {/* Système */}
            <Route path="settings" element={<AdminSettings />} />
            
            {/* Gestion agents et invitations */}
            <Route path="agents" element={<AdminAgents />} />
            <Route path="invitations" element={<AdminInvitations />} />
          </Route>

          {/* ========================================= */}
          {/* 404 - REDIRECTION */}
          {/* ========================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </GeolocationProvider>
    </Router>
  );
}

export default App;