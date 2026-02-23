// ==========================================
// FICHIER: src/pages/DevenirRevendeur.jsx
// Page d'information pour les futurs revendeurs
// ==========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Users,
  TrendingUp,
  Shield,
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Clock,
  MapPin,
  Banknote,
  Package,
  Headphones
} from 'lucide-react';

const DevenirRevendeur = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');

  const advantages = [
    {
      icon: TrendingUp,
      title: 'Revenus attractifs',
      description: 'Gagnez des commissions compétitives sur chaque vente de bouteille de gaz'
    },
    {
      icon: Package,
      title: 'Stock flexible',
      description: 'Gérez votre stock facilement avec notre système de commande simplifié'
    },
    {
      icon: Phone,
      title: 'Plateforme mobile',
      description: 'Application mobile intuitive pour gérer vos ventes en temps réel'
    },
    {
      icon: Headphones,
      title: 'Support dédié',
      description: 'Une équipe à votre écoute pour vous accompagner au quotidien'
    },
    {
      icon: Users,
      title: 'Réseau établi',
      description: 'Rejoignez un réseau de revendeurs actifs à travers le Burkina Faso'
    },
    {
      icon: Shield,
      title: 'Partenariat fiable',
      description: 'Travaillez avec une entreprise reconnue et de confiance'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Contactez notre équipe',
      description: 'Appelez nos agents commerciaux ou visitez notre bureau pour manifester votre intérêt',
      icon: Phone
    },

    {
      number: '2',
      title: 'Recevez votre lien d\'invitation',
      description: 'L\'agent vous enverra un lien sécurisé par SMS ou WhatsApp pour créer votre compte',
      icon: MessageCircle
    },
    {
      number: '3',
      title: 'Complétez votre inscription',
      description: 'Cliquez sur le lien et remplissez le formulaire avec vos informations personnelles et commerciales',
      icon: CheckCircle
    },
    {
      number: '4',
      title: 'Commencez à vendre',
      description: 'Une fois votre compte activé, passez votre première commande et démarrez votre activité',
      icon: ShoppingBag
    }
  ];

  const requirements = [
    'Avoir un local commercial ou un point de vente fixe',
    'Être majeur(e) et résider à Ouagadougou ou Bobo-dioulasso',
    'Disposer d\'un téléphone mobile',
    'Avoir la capacité de gérer un stock de bouteilles de gaz',
    'Être disponible pour une éventuelle conformation initiale'
  ];

  const contactInfo = {
    'Ouagadougou': {
      phones: ['+226 55 54 96 48', '+226 67 20 81 01'],
      address: 'Avenue Kwame N\'Krumah, Zone commerciale',
      hours: 'Lun-Ven: 8h-17h, Sam: 8h-13h'
    },
    'Bobo-Dioulasso': {
      phones: ['+226 55 13 22 55'],
      address: 'Avenue de la République, Centre-ville',
      hours: 'Lun-Ven: 8h-17h, Sam: 8h-13h'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
     {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
          {/* Logo et retour */}
          <div className="flex items-center justify-between mb-6 sm:mb-12">
            <div 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo_gazbf.png"
                alt="FasoGaz Logo"
                className="h-8 sm:h-12 w-auto object-contain bg-white rounded-lg p-1"
              />
              <div className="flex items-center text-sm sm:text-xl md:text-2xl font-extrabold tracking-wide">
                <span className="font-bold">FasoGaz</span>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold py-1.5 px-4 sm:py-2 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
            >
              Retour
            </button>
          </div>

          <div className="text-center max-w-3xl mx-auto mt-12 sm:mt-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Devenez Revendeur FasoGaz
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-orange-100 mb-6 sm:mb-8">
              Rejoignez notre réseau et développez votre activité de distribution de gaz domestique
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                Nous contacter
              </button>
              <button
                onClick={() => document.getElementById('steps-section').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors flex items-center justify-center text-base sm:text-lg"
              >
                Comment ça marche ?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avantages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pourquoi devenir revendeur ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Profitez de nombreux avantages en rejoignant notre réseau de distribution
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {advantage.title}
                </h3>
                <p className="text-gray-600">
                  {advantage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processus d'inscription */}
      <div id="steps-section" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment créer votre compte ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Suivez ces étapes simples pour devenir revendeur FasoGaz
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Ligne de connexion */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-orange-200" />
                  )}

                  <div className="flex gap-4 mb-8 relative">
                    {/* Numéro */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                        {step.number}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start gap-3 mb-2">
                        <Icon className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 ml-9">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note importante */}
          <div className="max-w-3xl mx-auto mt-8 bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex gap-3">
              <Shield className="h-6 w-6 text-orange-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Important : Lien d'invitation sécurisé
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Pour des raisons de sécurité, vous ne pouvez pas créer un compte directement en ligne. 
                  Vous devez obligatoirement recevoir un <strong>lien d'invitation personnalisé</strong> de 
                  la part d'un agent commercial FasoGaz. Ce lien est unique, sécurisé et valable pour une durée limitée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditions requises */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Conditions requises
            </h2>
            <p className="text-lg text-gray-600">
              Assurez-vous de remplir ces critères avant de postuler
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <ul className="space-y-4">
              {requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div id="contact-section" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à nous rejoindre ?
            </h2>
            <p className="text-xl text-gray-300">
              Contactez-nous dès aujourd'hui pour commencer votre parcours
            </p>
          </div>

          {/* Sélection de ville */}
          <div className="max-w-md mx-auto mb-8">
            <label className="block text-sm font-medium mb-3">
              Sélectionnez votre ville
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg border-2 border-gray-300 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Choisir une ville</option>
              <option value="Ouagadougou">Ouagadougou</option>
              <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
            </select>
          </div>

          {/* Informations de contact */}
          {selectedCity && contactInfo[selectedCity] && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Contact / {selectedCity}
                </h3>

                <div className="space-y-6">
                  {/* Téléphones */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Téléphone</h4>
                      {contactInfo[selectedCity].phones.map((phone, index) => (
                        <a
                          key={index}
                          href={`tel:${phone}`}
                          className="block text-orange-300 hover:text-orange-200 mb-1"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Adresse */}
                  {/* <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Adresse</h4>
                      <p className="text-gray-300">
                        {contactInfo[selectedCity].address}
                      </p>
                    </div>
                  </div> */}

                  {/* Horaires */}
                  {/* <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Horaires d'ouverture</h4>
                      <p className="text-gray-300">
                        {contactInfo[selectedCity].hours}
                      </p>
                    </div>
                  </div> */}
                </div>

                {/* Boutons d'action */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a
                    href={`tel:${contactInfo[selectedCity].phones[0]}`}
                    className="flex-1"
                  >
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Phone className="h-5 w-5" />
                      Appeler maintenant
                    </button>
                  </a>
                  <a
                    href={`https://wa.me/${contactInfo[selectedCity].phones[0].replace(/\s/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <button className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp
                    </button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {!selectedCity && (
            <div className="text-center text-gray-400 py-8">
              Sélectionnez une ville pour voir les coordonnées de contact
            </div>
          )}
        </div>
      </div>

      {/* FAQ rapide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
            <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
              <span>Combien coûte l'inscription ?</span>
              <ArrowRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-gray-600 mt-4 leading-relaxed">
              L'inscription en tant que revendeur FasoGaz est gratuite. Vous devez simplement disposer 
              d'un capital initial pour constituer votre premier stock de bouteilles.
            </p>
          </details>

          <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
            <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
              <span>Quel est le délai pour obtenir mon compte ?</span>
              <ArrowRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Une fois que vous avez reçu votre lien d'invitation, vous pouvez 
              créer votre compte immédiatement. L'activation se fait en quelques minutes après validation de votre code OTP.
            </p>
          </details>

          <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
            <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
              <span>Puis-je m'inscrire sans passer par un agent ?</span>
              <ArrowRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-gray-600 mt-4 leading-relaxed">
              Non, pour des raisons de sécurité et de vérification, tous les nouveaux revendeurs doivent 
              obligatoirement être validés par un agent commercial qui leur fournira un lien d'invitation sécurisé.
            </p>
          </details>

          
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à démarrer votre activité ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Rejoignez des centaines de revendeurs qui nous font déjà confiance
          </p>
          <button
            onClick={() => document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-lg mx-auto"
          >
            <Phone className="h-5 w-5" />
            Contactez-nous maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevenirRevendeur;