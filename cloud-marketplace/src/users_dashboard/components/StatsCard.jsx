import React from 'react';

const StatsCard = ({ title, value, change, icon, gradient }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        {change && (
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <svg className={`w-3 h-3 ${change >= 0 ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
};

export default StatsCard;
