import React from 'react';
import { Link } from 'react-router-dom';

const PCCard = ({ pc, userId }) => {
  const statusColors = {
    online: 'bg-green-100 text-green-700 border-green-200',
    offline: 'bg-slate-100 text-slate-700 border-slate-200',
    maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  // Safe access to PC data with defaults and API mapping
  const pcStatus = pc.status || (pc.lastSeen ? 'online' : 'offline');
  const pcName = pc.meta?.hostname || pc.name || pc.clientName || pc.clientId || 'Unknown PC';
  const pcId = pc.id || pc.clientId || 'N/A';

  // lastStats contains memory in MB and disks with totalGB
  const totalMemMB = pc.lastStats?.totalMemMB;
  const totalMemoryGB = totalMemMB ? Math.round(totalMemMB / 1024) : (pc.totalMemory || 0);
  const totalStorageGB = pc.lastStats?.disks ? pc.lastStats.disks.reduce((s, d) => s + (d.totalGB || 0), 0) : (pc.totalStorage || 0);
  const cpuCores = pc.lastStats?.cpuCores || pc.cpuCores || 0;

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate" title={pcName}>
              {pcName}
            </h3>
            <p className="text-sm text-slate-500 truncate" title={pcId}>ID: {pcId}</p>
          </div>
        </div>
        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColors[pcStatus] || statusColors.offline}`}>
          <span className={`h-2 w-2 rounded-full ${pcStatus === 'online' ? 'bg-green-500' : pcStatus === 'maintenance' ? 'bg-yellow-500' : 'bg-slate-500'}`} />
          {String(pcStatus).charAt(0).toUpperCase() + String(pcStatus).slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-slate-600">VMs</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{pc.vmsCount || 0}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs font-medium text-slate-600">Memory</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{totalMemoryGB || 0}GB</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="text-xs font-medium text-slate-600">Storage</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{totalStorageGB || 0}GB</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="text-xs font-medium text-slate-600">CPU</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{cpuCores || 0} Cores</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Last Active: {pc.lastStats?.timestamp || (pc.lastActive || 'N/A')}</span>
        <Link to={`/admin/client/${pcId}`} className="flex items-center gap-1 text-indigo-500 font-medium group-hover:gap-2 transition-all">
          View Details
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default PCCard;
