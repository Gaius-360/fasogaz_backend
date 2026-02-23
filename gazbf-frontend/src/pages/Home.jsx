// ==========================================
// FICHIER: src/pages/Home.jsx (VERSION ULTRA-RESPONSIVE)
// Page d'accueil optimisée pour tous les écrans, y compris < 400px
// ==========================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ShoppingBag, 
  Store,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  Star,
  Users,
  CheckCircle,
  Zap,
  TrendingUp,
  Shield,
  Smartphone,
  Package,
  Menu,
  X
} from 'lucide-react';

import InstallPWAModal from '../components/common/InstallPWAModal';

const Home = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
       <InstallPWAModal />
      {/* HEADER / NAVIGATION - OPTIMISÉ < 400px */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 xs:h-16 sm:h-20">
            {/* Logo */}
            <div 
              className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-400 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition"></div>
                <img
                  src="/logo_gazbf.png"
                  alt="FasoGaz"
                  className="h-7 xs:h-8 sm:h-10 md:h-12 w-auto object-contain relative z-10"
                />
              </div>
              <div className="flex items-center text-base xs:text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide">
                <span className="text-red-600">F</span>
                <span className="text-yellow-500">a</span>
                <span className="text-yellow-500">s</span>
                <span className="text-green-600">o</span>
                <span className="text-red-600">G</span>
                <span className="text-yellow-500">a</span>
                <span className="text-green-600">z</span>
              </div>
            </div>

            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                Comment ça marche
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                S'inscrire
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 xs:p-2 text-gray-700 hover:text-red-600 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 xs:h-6 xs:w-6" /> : <Menu className="h-5 w-5 xs:h-6 xs:w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100 bg-white">
              <div className="space-y-2">
                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                >
                  Comment ça marche
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                >
                  Connexion
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm rounded-lg font-semibold mt-2"
                >
                  S'inscrire
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION - OPTIMISÉ < 400px */}
      <section className="relative pt-16 xs:pt-20 sm:pt-28 pb-10 xs:pb-12 sm:pb-20 px-3 xs:px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-yellow-50 to-green-50">
          <div className="absolute top-20 left-0 w-32 xs:w-40 sm:w-48 md:w-72 h-32 xs:h-40 sm:h-48 md:h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-0 w-32 xs:w-40 sm:w-48 md:w-72 h-32 xs:h-40 sm:h-48 md:h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-10 w-32 xs:w-40 sm:w-48 md:w-72 h-32 xs:h-40 sm:h-48 md:h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 xs:gap-8 lg:gap-12 items-center">
            {/* Texte Hero */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-3 xs:mb-4 sm:mb-6">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Plateforme 100% burkinabè
                </span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-3 xs:mb-4 sm:mb-6 leading-tight px-2 xs:px-0">
                Votre gaz, <br />
                <span className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  à portée de clic
                </span>
              </h1>

              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 mb-5 xs:mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 xs:px-0">
                Localisez, commandez et recevez votre gaz domestique facilement à Ouagadougou et Bobo-Dioulasso
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 xs:gap-3 sm:gap-4 justify-center lg:justify-start mb-5 xs:mb-6 sm:mb-8 px-2 xs:px-0">
                <button
                  onClick={() => navigate('/register')}
                  className="group px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full font-bold text-sm xs:text-base sm:text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span className="truncate">Commencer gratuitement</span>
                  <ChevronRight className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 bg-white text-gray-800 rounded-full font-bold text-sm xs:text-base sm:text-lg hover:shadow-xl transition-all border-2 border-gray-200 hover:border-red-300"
                >
                  Voir la démo
                </button>
              </div>

              {/* Trust badges - OPTIMISÉ < 400px */}
              <div className="flex flex-wrap items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 justify-center lg:justify-start text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                  <Shield className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">100% sécurisé</span>
                </div>
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                  <CheckCircle className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">Satisfaction max</span>
                </div>
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                  <Zap className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">Service rapide</span>
                </div>
              </div>
            </div>

            {/* Mockup interactif - ULTRA-OPTIMISÉ < 400px */}
            <div className="relative mt-6 xs:mt-8 lg:mt-0 max-w-md mx-auto lg:max-w-none w-full px-2 xs:px-0">
              <div className="relative z-10 bg-white rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl p-3 xs:p-4 sm:p-6 border border-gray-100 transform hover:scale-105 transition-transform duration-500">
                {/* Header mockup */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4 pb-2.5 xs:pb-3 sm:pb-4 border-b">
                  <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 xs:w-20 sm:w-24 mb-1 xs:mb-1.5 sm:mb-2"></div>
                    <div className="h-1.5 sm:h-2 bg-gray-100 rounded w-20 xs:w-24 sm:w-32"></div>
                  </div>
                </div>

                {/* Carte simulée avec animation */}
                <div className="relative h-40 xs:h-48 sm:h-56 md:h-64 lg:h-80 bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden mb-2.5 xs:mb-3 sm:mb-4">
                  {/* Points de localisation animés */}
                  <div className="absolute top-1/4 left-1/4 animate-bounce">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50"></div>
                      <MapPin className="relative h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600 fill-current" />
                    </div>
                  </div>
                  
                  <div className="absolute top-1/3 right-1/4 animate-bounce animation-delay-1000">
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500 rounded-full blur-md opacity-50"></div>
                      <MapPin className="relative h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-orange-600 fill-current" />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-1/4 left-1/3 animate-bounce animation-delay-2000">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-50"></div>
                      <MapPin className="relative h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600 fill-current" />
                    </div>
                  </div>

                  {/* Centre avec icône principale */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <Store className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                {/* Info revendeur mockup - OPTIMISÉ < 400px */}
                <div className="flex items-center gap-2 xs:gap-2 sm:gap-3 md:gap-4 p-2.5 xs:p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg sm:rounded-xl hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <p className="font-bold text-xs xs:text-sm sm:text-base text-gray-900 truncate">Dépôt proche</p>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 fill-gray-300 text-gray-300" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-0.5 xs:gap-1">
                        <MapPin className="h-2.5 w-2.5 xs:h-3 xs:w-3 flex-shrink-0" />
                        500m
                      </span>
                      <span className="flex items-center gap-0.5 xs:gap-1">
                        <Clock className="h-2.5 w-2.5 xs:h-3 xs:w-3 flex-shrink-0" />
                        Ouvert
                      </span>
                    </div>
                  </div>
                  <button className="px-2 xs:px-2.5 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition whitespace-nowrap flex-shrink-0">
                    Commander
                  </button>
                </div>
              </div>

              {/* Décorations flottantes - AJUSTÉES < 400px */}
              <div className="absolute -top-1 -right-1 xs:-top-2 xs:-right-2 sm:-top-4 sm:-right-4 md:-top-6 md:-right-6 w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-yellow-200 rounded-full opacity-50 blur-xl sm:blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 xs:-bottom-2 xs:-left-2 sm:-bottom-4 sm:-left-4 md:-bottom-6 md:-left-6 w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-red-200 rounded-full opacity-50 blur-xl sm:blur-2xl animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIQUES VISUELLES - OPTIMISÉ < 400px */}
      <section className="py-10 xs:py-12 sm:py-16 px-3 xs:px-4 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
            <div className="text-center group cursor-default">
              <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg xs:rounded-xl sm:rounded-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Store className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-600" />
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-1 leading-tight">
                Ouaga & Bobo
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Villes couvertes</p>
            </div>

            <div className="text-center group cursor-default">
              <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg xs:rounded-xl sm:rounded-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-1 leading-tight">
                En ligne
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Commandes faciles</p>
            </div>

            <div className="text-center group cursor-default">
              <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg xs:rounded-xl sm:rounded-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1 leading-tight">
                GPS
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Localisation précise</p>
            </div>

            <div className="text-center group cursor-default">
              <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg xs:rounded-xl sm:rounded-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-600" />
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-1 leading-tight">
                24/7
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Disponible toujours</p>
            </div>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS - OPTIMISÉ < 400px */}
      <section id="features" className="py-12 xs:py-16 sm:py-24 px-3 xs:px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 xs:mb-12 sm:mb-16">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 xs:mb-3 sm:mb-4 px-2">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Une solution complète pour simplifier votre accès au gaz domestique
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-red-200">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <MapPin className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Géolocalisation en temps réel
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Trouvez instantanément les dépôts de gaz les plus proches avec calcul automatique des distances
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <ShoppingBag className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Commande simplifiée
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Commandez en quelques clics avec livraison à domicile ou retrait sur place selon votre préférence
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-yellow-200">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <Clock className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Horaires en direct
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Consultez les heures d'ouverture en temps réel et évitez les déplacements inutiles
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <Star className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Avis clients vérifiés
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Consultez les notes d'autres clients pour choisir le meilleur service
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <Smartphone className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Application mobile-friendly
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Interface optimisée pour mobile, tablette et ordinateur. Utilisez sur n'importe quel appareil
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 xs:mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <Package className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Suivi de commande
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Suivez l'état de vos commandes en temps réel et consultez votre historique complet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE - OPTIMISÉ < 400px */}
      <section id="how-it-works" className="py-12 xs:py-16 sm:py-24 px-3 xs:px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 xs:mb-12 sm:mb-16">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 xs:mb-3 sm:mb-4 px-2">
              Simple comme bonjour
            </h2>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              3 étapes pour commander votre gaz en toute simplicité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 xs:gap-8 sm:gap-12 relative">
            {/* Ligne de connexion (desktop) */}
            <div className="hidden md:block absolute top-24 sm:top-32 left-1/4 right-1/4 h-1 bg-gradient-to-r from-red-300 via-yellow-300 to-green-300 rounded-full"></div>

            {/* Étape 1 */}
            <div className="relative text-center group">
              <div className="relative inline-block mb-3 xs:mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
                <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform">
                  <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white">1</span>
                </div>
              </div>
              <div className="bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg border border-gray-100">
                <MapPin className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-2 xs:mb-3 sm:mb-4" />
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Localisez
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Ouvrez la carte interactive et découvrez tous les dépôts de gaz autour de vous avec leur distance exacte
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="relative text-center group">
              <div className="relative inline-block mb-3 xs:mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
                <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform">
                  <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white">2</span>
                </div>
              </div>
              <div className="bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg border border-gray-100">
                <ShoppingBag className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-yellow-600 mx-auto mb-2 xs:mb-3 sm:mb-4" />
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Commandez
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Sélectionnez votre revendeur, choisissez vos produits et indiquez si vous voulez une livraison ou un retrait
                </p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="relative text-center group">
              <div className="relative inline-block mb-3 xs:mb-4 sm:mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
                <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform">
                  <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white">3</span>
                </div>
              </div>
              <div className="bg-white rounded-lg xs:rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 shadow-lg border border-gray-100">
                <Store className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-2 xs:mb-3 sm:mb-4" />
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Recevez
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Le revendeur vous prépare votre commande et vous livre à domicile ou vous allez le récupérer directement
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POUR LES REVENDEURS - OPTIMISÉ < 400px */}
      <section className="py-12 xs:py-16 sm:py-24 px-3 xs:px-4 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 relative overflow-hidden">
        {/* Décorations de fond */}
        <div className="absolute top-0 left-0 w-40 xs:w-48 sm:w-64 md:w-96 h-40 xs:h-48 sm:h-64 md:h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-40 xs:w-48 sm:w-64 md:w-96 h-40 xs:h-48 sm:h-64 md:h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 xs:gap-8 sm:gap-12 items-center">
            {/* Contenu */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-3 xs:mb-4 sm:mb-6">
                <Store className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Espace professionnel
                </span>
              </div>

              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 xs:mb-4 sm:mb-6 px-2 xs:px-0">
                Développez votre activité avec FasoGaz
              </h2>

              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-600 mb-5 xs:mb-6 sm:mb-8 leading-relaxed px-2 xs:px-0">
                Augmentez votre visibilité et gérez facilement vos commandes avec notre plateforme dédiée aux revendeurs
              </p>

              <div className="space-y-2.5 xs:space-y-3 sm:space-y-4 mb-5 xs:mb-6 sm:mb-8">
                {[
                  { icon: MapPin, text: 'Apparaissez sur la carte pour des milliers de clients' },
                  { icon: ShoppingBag, text: 'Recevez et gérez vos commandes en ligne' },
                  { icon: TrendingUp, text: 'Suivez vos statistiques de vente en temps réel' },
                  { icon: Package, text: 'Outils de gestion de stock intégrés' },
                  { icon: Star, text: 'Collectez des avis pour fidéliser vos clients' },
                  { icon: Users, text: 'Accédez à une base de clients croissante' }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 xs:gap-3 sm:gap-4 group justify-center lg:justify-start">
                    <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                      <benefit.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <span className="text-xs xs:text-sm sm:text-base text-gray-700 font-medium pt-1 xs:pt-1.5 sm:pt-2 text-left">{benefit.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/devenir-revendeur')}
                className="group px-5 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-bold text-sm xs:text-base sm:text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2 mx-auto lg:mx-0"
              >
                <span className="truncate">Devenir revendeur partenaire</span>
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </button>
            </div>

            {/* Illustration avec stats */}
            <div className="relative mt-6 xs:mt-8 lg:mt-0 max-w-md mx-auto lg:max-w-none">
              <div className="bg-white rounded-xl xs:rounded-2xl sm:rounded-3xl shadow-2xl p-4 xs:p-6 sm:p-8 border border-gray-100">
                <div className="grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4 mb-3 xs:mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <TrendingUp className="h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10 text-orange-600 mb-1.5 xs:mb-2 sm:mb-3" />
                    <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Visibilité</p>
                    <p className="text-xs sm:text-sm text-gray-600">accrue en ligne</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <Users className="h-6 w-6 xs:h-8 xs:w-8 sm:h-10 sm:w-10 text-green-600 mb-1.5 xs:mb-2 sm:mb-3" />
                    <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Nouveaux</p>
                    <p className="text-xs sm:text-sm text-gray-600">clients chaque jour</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
                    <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm xs:text-base sm:text-lg">Plateforme fiable</p>
                      <p className="text-xs sm:text-sm text-gray-600">Support technique disponible</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Rejoignez une communauté de revendeurs professionnels et bénéficiez d'outils modernes pour gérer votre activité
                  </p>
                </div>
              </div>

              {/* Décorations */}
              <div className="absolute -top-1 -right-1 xs:-top-2 xs:-right-2 sm:-top-4 sm:-right-4 md:-top-6 md:-right-6 w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-orange-300 rounded-full opacity-30 blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 xs:-bottom-2 xs:-left-2 sm:-bottom-4 sm:-left-4 md:-bottom-6 md:-left-6 w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-red-300 rounded-full opacity-30 blur-2xl animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL - OPTIMISÉ < 400px */}
      <section className="relative py-12 xs:py-16 sm:py-24 px-3 xs:px-4 overflow-hidden">
        {/* Background animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-red-600">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 xs:w-48 sm:w-64 md:w-96 h-40 xs:h-48 sm:h-64 md:h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 right-0 w-40 xs:w-48 sm:w-64 md:w-96 h-40 xs:h-48 sm:h-64 md:h-96 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-40 xs:w-48 sm:w-64 md:w-96 h-40 xs:h-48 sm:h-64 md:h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 xs:mb-4 sm:mb-6 leading-tight px-2">
            Prêt à simplifier votre accès au gaz ?
          </h2>
          <p className="text-sm xs:text-base sm:text-lg md:text-xl text-white/90 mb-6 xs:mb-8 sm:mb-10 leading-relaxed px-4">
            Rejoignez FasoGaz dès aujourd'hui et découvrez une nouvelle façon d'acheter votre gaz
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 xs:gap-3 sm:gap-4 justify-center px-2">
            <button
              onClick={() => navigate('/register')}
              className="px-6 xs:px-8 sm:px-10 py-2.5 xs:py-3 sm:py-5 bg-white text-orange-600 rounded-full font-bold text-sm xs:text-base sm:text-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Créer mon compte gratuit
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 xs:px-8 sm:px-10 py-2.5 xs:py-3 sm:py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-sm xs:text-base sm:text-lg hover:bg-white hover:text-orange-600 transition-all"
            >
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER - OPTIMISÉ < 400px */}
      <footer className="bg-gray-900 text-white py-10 xs:py-12 sm:py-16 px-3 xs:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xs:gap-8 sm:gap-12 mb-6 xs:mb-8 sm:mb-12">
            {/* À propos */}
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4 justify-center sm:justify-start">
                <img src="/logo_gazbf.png" alt="FasoGaz" className="h-9 xs:h-10 sm:h-12 w-auto" />
                <span className="text-base xs:text-lg sm:text-xl font-bold">FasoGaz</span>
              </div>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-2 xs:mb-3 sm:mb-4">
                Plateforme burkinabè de géolocalisation et commande de gaz domestique
              </p>
            </div>

            {/* Navigation */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-2.5 xs:mb-3 sm:mb-4 text-sm xs:text-base sm:text-lg">Navigation</h4>
              <ul className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-sm sm:text-base text-gray-400 hover:text-white transition">
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="text-sm sm:text-base text-gray-400 hover:text-white transition">
                    Comment ça marche
                  </button>
                </li>
              </ul>
            </div>

            {/* Compte */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-2.5 xs:mb-3 sm:mb-4 text-sm xs:text-base sm:text-lg">Compte</h4>
              <ul className="space-y-1.5 xs:space-y-2 sm:space-y-3">
                <li>
                  <button onClick={() => navigate('/register')} className="text-sm sm:text-base text-gray-400 hover:text-white transition">
                    S'inscrire
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="text-sm sm:text-base text-gray-400 hover:text-white transition">
                    Connexion
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-2.5 xs:mb-3 sm:mb-4 text-sm xs:text-base sm:text-lg">Contact</h4>
              <div className="space-y-2 xs:space-y-3">
                <div className="flex items-center gap-2 xs:gap-3 text-gray-400 justify-center sm:justify-start">
                  <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-sm sm:text-base">+226 XX XX XX XX</span>
                </div>
                <div className="flex items-center gap-2 xs:gap-3 text-gray-400 justify-center sm:justify-start">
                  <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-sm sm:text-base break-all">fasogaz26@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-5 xs:pt-6 sm:pt-8 text-center">
            <p className="text-xs xs:text-sm sm:text-base text-gray-400">
              © 2025 FasoGaz. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Home;