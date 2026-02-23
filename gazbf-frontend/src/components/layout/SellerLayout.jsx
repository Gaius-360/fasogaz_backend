// ==========================================
// FICHIER: src/components/layout/SellerLayout.jsx
// ✅ AJOUT: PushNotificationGate — notifications obligatoires
// ==========================================
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Star,
  Store,
  CreditCard,
  User,
  X,
  MoreHorizontal,
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import NotificationBell from '../common/NotificationBell';
import PushNotificationGate from '../common/PushNotificationGate';
import logo from '../../assets/logo_gazbf.png';

const SellerLayout = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    { to: '/seller/dashboard',    icon: LayoutDashboard, label: 'Dashboard'   },
    { to: '/seller/orders',       icon: ShoppingBag,     label: 'Commandes'   },
    { to: '/seller/products',     icon: Package,         label: 'Stock'       },
    { to: '/seller/customers',    icon: Users,           label: 'Clients'     },
    { to: '/seller/reviews',      icon: Star,            label: 'Avis'        },
    { to: '/seller/subscription', icon: CreditCard,      label: 'Abonnement'  },
    { to: '/seller/profile',      icon: User,            label: 'Profil'      },
  ];

  const mainBottomNavItems = navItems.slice(0, 3);
  const moreMenuItems      = navItems.slice(3);

  const handleMoreMenuItemClick = (path) => {
    navigate(path);
    setShowMoreMenu(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ══════════════════════════════════════════
          HEADER — sticky, toujours visible
      ══════════════════════════════════════════ */}
      <header className="bg-white shadow-md border-b-4 border-gradient-gazbf sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              onClick={() => navigate('/seller/dashboard')}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden ring-2 ring-secondary-200 group-hover:ring-secondary-400 transition-all">
                <img
                  src={logo}
                  alt="GAZBF Logo"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold">
                  <span className="text-red-600">F</span>
                  <span className="text-yellow-500">a</span>
                  <span className="text-yellow-500">s</span>
                  <span className="text-green-600">o</span>
                  <span className="text-red-600">G</span>
                  <span className="text-yellow-500">a</span>
                  <span className="text-green-600">z</span>
                </h1>
                {user?.businessName && (
                  <p className="text-xs text-neutral-600 font-medium hidden sm:block truncate max-w-[120px] lg:max-w-[200px]">
                    {user.businessName}
                  </p>
                )}
              </div>
            </div>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-bold shadow-gazbf'
                        : 'text-neutral-700 hover:bg-secondary-50 hover:text-secondary-600 font-medium'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Actions desktop */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              <NotificationBell />
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-neutral-600">{user?.phone}</p>
              </div>
              <div className="w-9 h-9 xl:w-10 xl:h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center ring-2 ring-secondary-200">
                <span className="text-xs xl:text-sm font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="p-2 text-neutral-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                title="Retour à la connexion"
              >
                <ArrowLeftRight className="h-4 w-4 xl:h-5 xl:w-5" />
              </button>
            </div>

            {/* Actions mobile */}
            <div className="lg:hidden flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Profil"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center ring-2 ring-secondary-300 hover:ring-secondary-400 transition-all">
                  <span className="text-sm font-bold text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Menu profil mobile */}
          {showProfileMenu && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="lg:hidden absolute top-16 right-3 w-80 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl z-50 animate-slide-down border-2 border-secondary-200">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-neutral-100">
                    <h3 className="text-lg font-bold text-gray-900">Mon Profil</h3>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-secondary-50 to-primary-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-gray-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {user?.phone}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-3 pt-3 border-t border-secondary-200">
                      {user?.businessName && (
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-secondary-600" />
                          <div>
                            <p className="text-xs text-gray-600">Nom du dépôt</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.businessName}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-secondary-600" />
                        <div>
                          <p className="text-xs text-gray-600">Abonnement</p>
                          <p className="text-sm font-semibold text-green-600">Actif</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => { navigate('/seller/profile'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-secondary-50 hover:text-secondary-600 rounded-xl transition-colors font-medium"
                    >
                      <User className="h-5 w-5" />
                      <span>Modifier le profil</span>
                    </button>
                    <button
                      onClick={() => { navigate('/seller/subscription'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-neutral-700 hover:bg-secondary-50 hover:text-secondary-600 rounded-xl transition-colors font-medium"
                    >
                      <CreditCard className="h-5 w-5" />
                      <span>Mon abonnement</span>
                    </button>
                    <div className="pt-3 mt-1 border-t border-neutral-100">
                      <button
                        onClick={() => { navigate('/login'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 rounded-xl transition-colors font-medium"
                      >
                        <ArrowLeftRight className="h-5 w-5" />
                        <span>Retour à la connexion</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════
          GATE — bloque l'accès si notifications
          pas encore autorisées. Enveloppe TOUT
          le contenu sous le header.
      ══════════════════════════════════════════ */}
      <PushNotificationGate>

        {/* Contenu principal */}
        <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24 lg:pb-6">
          <Outlet />
        </main>

        {/* Menu "Plus" - Modal flottant */}
        {showMoreMenu && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
              onClick={() => setShowMoreMenu(false)}
            />
            <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slide-up border-t-4 border-secondary-500">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-neutral-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MoreHorizontal className="h-5 w-5 text-secondary-600" />
                    Plus d'options
                  </h3>
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-1">
                  {moreMenuItems.map((item) => {
                    const isActive = window.location.pathname === item.to;
                    return (
                      <button
                        key={item.to}
                        onClick={() => handleMoreMenuItemClick(item.to)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white font-bold shadow-lg'
                            : 'text-neutral-700 hover:bg-secondary-50 hover:text-secondary-600 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-base">{item.label}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation mobile bottom */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-neutral-200 shadow-lg z-50 safe-area-bottom">
          <div className="grid grid-cols-4 gap-0.5 sm:gap-1 px-1 sm:px-2 py-1.5 sm:py-2">
            {mainBottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-lg transition-all"
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1 sm:p-1.5 rounded-lg ${isActive ? 'bg-gradient-to-br from-secondary-500 to-primary-500' : ''}`}>
                      <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-[80px] ${isActive ? 'text-secondary-600' : 'text-neutral-500'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Bouton "Plus" */}
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-lg transition-all ${showMoreMenu ? 'bg-secondary-50' : ''}`}
            >
              <div className={`p-1 sm:p-1.5 rounded-lg ${showMoreMenu ? 'bg-gradient-to-br from-secondary-500 to-primary-500' : ''}`}>
                <MoreHorizontal className={`h-5 w-5 sm:h-6 sm:w-6 mb-0.5 sm:mb-1 ${showMoreMenu ? 'text-white' : 'text-neutral-400'}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold ${showMoreMenu ? 'text-secondary-600' : 'text-neutral-500'}`}>
                Plus
              </span>
            </button>
          </div>
        </nav>

      </PushNotificationGate>

      {/* Animations */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-10px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-slide-up   { animation: slide-up   0.3s ease-out; }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
        .animate-fade-in    { animation: fade-in    0.2s ease-out; }
        .safe-area-bottom   { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
};

export default SellerLayout;