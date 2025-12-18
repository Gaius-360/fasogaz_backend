// ==========================================
// FICHIER: src/components/layout/SellerLayout.jsx
// ==========================================
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Star, LogOut, Store, CreditCard, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';

const SellerLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/orders', icon: ShoppingBag, label: 'Commandes' },
  { to: '/seller/products', icon: Package, label: 'Stock' },
  { to: '/seller/customers', icon: Users, label: 'Clients' },
  { to: '/seller/reviews', icon: Star, label: 'Avis' },
  { to: '/seller/subscription', icon: CreditCard, label: 'Abonnement' },
  { to: '/seller/profile', icon: User, label: 'Profil' }
];

  // Vérifier le statut de validation
  const isPending = user?.validationStatus === 'pending';
  const isRejected = user?.validationStatus === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-secondary-600" />
              <div>
                <h1 className="text-xl font-bold text-secondary-600">GAZBF Revendeur</h1>
                {user?.businessName && (
                  <p className="text-xs text-gray-600">{user.businessName}</p>
                )}
              </div>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-secondary-50 text-secondary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Alertes de validation */}
      {isPending && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <p className="text-sm text-yellow-800">
              ⏳ Votre profil est en cours de validation. Vous recevrez une notification dans les 24-48h.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <p className="text-sm text-red-800">
              ❌ Votre profil a été rejeté. Raison: {user?.rejectionReason || 'Non spécifiée'}. 
              Veuillez corriger les informations et contacter le support.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Navigation mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-secondary-50 text-secondary-600'
                    : 'text-gray-600'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SellerLayout;