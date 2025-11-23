import React from 'react';

const AdminStatsCard = ({ title, value, subtitle, icon, gradient, trend }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend.direction === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <svg className={`w-3 h-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {trend.value}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 mb-2">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

export default AdminStatsCard;
