// ==========================================
// FICHIER: src/components/admin/AdminCharts.jsx
// Composants de graphiques pour le dashboard admin
// ==========================================

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { formatPrice } from '../../utils/helpers';

// Couleurs du thème
const COLORS = {
  primary: '#E85D04',
  secondary: '#DC2F02',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  gray: '#6B7280'
};

// ============================================
// 1. GRAPHIQUE D'ÉVOLUTION DES REVENUS
// ============================================
export const RevenueChart = ({ data }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {payload[0].payload.date}
          </p>
          <p className="text-sm text-blue-600">
            Clients: {formatPrice(payload[0].value)}
          </p>
          <p className="text-sm text-purple-600">
            Revendeurs: {formatPrice(payload[1].value)}
          </p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Total: {formatPrice(payload[0].value + payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Évolution des Revenus (30 derniers jours)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSellers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="clients"
            name="Clients"
            stroke={COLORS.blue}
            fillOpacity={1}
            fill="url(#colorClients)"
          />
          <Area
            type="monotone"
            dataKey="sellers"
            name="Revendeurs"
            stroke={COLORS.purple}
            fillOpacity={1}
            fill="url(#colorSellers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// 2. GRAPHIQUE EN BARRES - COMMANDES PAR JOUR
// ============================================
export const OrdersBarChart = ({ data }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {payload[0].payload.day}
          </p>
          <p className="text-sm text-green-600">
            {payload[0].value} commandes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Commandes par Jour (7 derniers jours)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="day" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="orders" 
            fill={COLORS.green}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// 3. GRAPHIQUE CIRCULAIRE - RÉPARTITION REVENUS
// ============================================
export const RevenuePieChart = ({ data }) => {
  const chartData = [
    { name: 'Clients', value: data.clients, color: COLORS.blue },
    { name: 'Revendeurs', value: data.sellers, color: COLORS.purple }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = data.clients + data.sellers;
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600">
            {formatPrice(payload[0].value)}
          </p>
          <p className="text-sm text-gray-500">
            {percentage}% du total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Répartition des Revenus
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span className="text-sm text-gray-700">
                {value}: {formatPrice(entry.payload.value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// 4. GRAPHIQUE UTILISATEURS - CROISSANCE
// ============================================
export const UserGrowthChart = ({ data }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {payload[0].payload.month}
          </p>
          <p className="text-sm text-blue-600">
            Clients: {payload[0].value}
          </p>
          <p className="text-sm text-purple-600">
            Revendeurs: {payload[1].value}
          </p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Total: {payload[0].value + payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Croissance des Utilisateurs (6 derniers mois)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="clients"
            name="Clients"
            stroke={COLORS.blue}
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="sellers"
            name="Revendeurs"
            stroke={COLORS.purple}
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================
// 5. STATS RAPIDES - CARTES MINI
// ============================================
export const QuickStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90 mb-1">Nouveaux Clients</p>
        <p className="text-3xl font-bold">{stats.newClients}</p>
        <p className="text-xs opacity-75 mt-1">Ce mois</p>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90 mb-1">Nouveaux Revendeurs</p>
        <p className="text-3xl font-bold">{stats.newSellers}</p>
        <p className="text-xs opacity-75 mt-1">Ce mois</p>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90 mb-1">Commandes</p>
        <p className="text-3xl font-bold">{stats.orders}</p>
        <p className="text-xs opacity-75 mt-1">Aujourd'hui</p>
      </div>

      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90 mb-1">Revenus</p>
        <p className="text-3xl font-bold">{formatPrice(stats.revenue)}</p>
        <p className="text-xs opacity-75 mt-1">Aujourd'hui</p>
      </div>
    </div>
  );
};

// ============================================
// 6. TABLEAU DE CLASSEMENT - TOP REVENDEURS
// ============================================
export const TopSellersTable = ({ sellers }) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        🏆 Top 5 Revendeurs du Mois
      </h3>
      <div className="space-y-3">
        {sellers.map((seller, index) => (
          <div 
            key={seller.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-orange-600' :
                'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{seller.name}</p>
                <p className="text-sm text-gray-500">{seller.location}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">{formatPrice(seller.revenue)}</p>
              <p className="text-sm text-gray-500">{seller.orders} commandes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export par défaut
export default {
  RevenueChart,
  OrdersBarChart,
  RevenuePieChart,
  UserGrowthChart,
  QuickStats,
  TopSellersTable
};