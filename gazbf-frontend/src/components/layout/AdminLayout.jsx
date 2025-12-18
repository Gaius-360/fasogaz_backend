// ==========================================
// FICHIER: src/components/layout/AdminLayout.jsx
// Layout administrateur moderne
// ==========================================
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Shield,
  Bell,
  ChevronDown
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../common/Button';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      badge: null
    },
    {
      path: '/admin/sellers',
      icon: Store,
      label: 'Revendeurs',
      badge: null
    },
    {
      path: '/admin/sellers/pending',
      icon: Clock,
      label: 'En attente',
      badge: '11',
      badgeColor: 'bg-orange-500'
    },
    {
      path: '/admin/clients',
      icon: Users,
      label: 'Clients',
      badge: null
    },
    {
      path: '/admin/transactions',
      icon: CreditCard,
      label: 'Transactions',
      badge: null
    },
    {
      path: '/admin/wallet',
      icon: Wallet,
      label: 'Portefeuille',
      badge: null
    },
    {
      path: '/admin/profile',
      icon: Shield,
      label: 'Mon Profil',
      badge: null
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: 'Paramètres',
      badge: null
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
      navigate('/admin/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
          border-r border-gray-700 shadow-2xl
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">GAZBF</h1>
                  <p className="text-xs text-gray-400">Administration</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors mx-auto"
            >
              <Menu className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                
                {sidebarOpen && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`
                        ml-auto px-2 py-0.5 text-xs font-semibold rounded-full
                        ${item.badgeColor || 'bg-red-600'} text-white
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip pour sidebar réduite */}
                {!sidebarOpen && (
                  <div className="
                    absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm
                    rounded-lg opacity-0 pointer-events-none group-hover:opacity-100
                    transition-opacity whitespace-nowrap shadow-xl border border-gray-700
                  ">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-600 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-700 p-3">
          <div
            className={`
              flex items-center gap-3 p-2 rounded-lg
              hover:bg-gray-800 cursor-pointer transition-colors
              ${!sidebarOpen && 'justify-center'}
            `}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName || user?.username || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Administrateur
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </>
            )}
          </div>

          {/* Menu utilisateur */}
          {showUserMenu && sidebarOpen && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => {
                  navigate('/admin/profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                Mon Profil
              </button>
              <button
                onClick={() => {
                  navigate('/admin/settings');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Paramètres
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                Bienvenue, {user?.firstName || user?.username || 'Admin'} 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>

            {/* User Menu Mobile */}
            <div className="relative lg:hidden">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={() => {
                      navigate('/admin/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Shield className="w-4 h-4" />
                    Mon Profil
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admin/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;