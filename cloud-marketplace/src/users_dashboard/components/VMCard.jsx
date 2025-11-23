import React, { useState } from 'react';
import { startVM, stopVM } from '../../services/vmService';

const VMCard = ({ vm, onStart, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Log the raw VM data to see what fields are available
  console.log('VMCard received VM data:', vm);

  // Normalize VM data structure - try multiple possible field names
  const vmId = vm.vmId || vm.id || vm.containerId;
  const clientId = vm.clientId;
  const vmName = vm.name || vm.vmName || `VM-${vmId?.substring(0, 8)}`;
  const vmStatus = vm.status || vm.state || 'unknown';
  
  // Try multiple possible CPU field names
  const vmCPU = vm.cpu || vm.cpuCores || vm.cores || vm.vcpu || vm.cpus || 0;
  
  // Try multiple possible memory field names
  const vmMemoryValue = vm.memory || vm.memoryGB || vm.ram || vm.ramGB || vm.memorySize || 0;
  const vmMemory = typeof vmMemoryValue === 'number' ? `${vmMemoryValue}GB` : vmMemoryValue;
  
  // Try multiple possible storage field names
  const vmStorageValue = vm.storage || vm.storageGB || vm.disk || vm.diskSize || vm.diskGB || 0;
  const vmStorage = typeof vmStorageValue === 'number' ? `${vmStorageValue}GB` : vmStorageValue;
  
  // Try multiple possible OS field names
  const vmOS = vm.os || vm.osType || vm.image || vm.imageName || vm.operatingSystem || 'Unknown';
  
  const createdAt = vm.createdAt ? new Date(vm.createdAt).toLocaleDateString() : 'N/A';

  const handleStartStop = async () => {
    setError('');
    if (!clientId) {
      setError('Client ID not found for this VM');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (vmStatus === 'running') {
        console.log('Stopping VM:', { clientId, vmId });
        await stopVM(clientId, vmId);
      } else {
        console.log('Starting VM:', { clientId, vmId });
        await startVM(clientId, vmId);
      }
      // Immediately refresh the VM list to show updated status
      if (onRefresh) {
        await onRefresh(true); // Silent refresh
      }
    } catch (err) {
      console.error('VM operation error:', err);
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Operation failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    running: 'bg-green-100 text-green-700 border-green-200',
    stopped: 'bg-red-100 text-red-700 border-red-200',
    exited: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unknown: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const statusIcons = {
    running: (
      <span className="flex h-2 w-2 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
    ),
    stopped: <span className="h-2 w-2 rounded-full bg-red-500" />,
    exited: <span className="h-2 w-2 rounded-full bg-red-500" />,
    pending: <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />,
    unknown: <span className="h-2 w-2 rounded-full bg-gray-500" />
  };

  return (
    <div className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-800 truncate" title={vmName}>{vmName}</h3>
                <p className="text-xs text-slate-500 font-mono truncate" title={vmId}>{vmId?.substring(0, 12)}...</p>
                {(vm.ownerName || vm.userName || vm.userEmail || vm.owner) && (
                  <p className="text-xs text-slate-500 mt-1 truncate" title={vm.ownerName || vm.userName || vm.userEmail || vm.owner}>
                    <span className="font-medium text-slate-700">Created by:</span> {vm.ownerName || vm.userName || vm.userEmail || vm.owner}
                  </p>
                )}
            </div>
          </div>
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColors[vmStatus] || statusColors.unknown}`}>
            {statusIcons[vmStatus] || statusIcons.unknown}
            {String(vmStatus).charAt(0).toUpperCase() + String(vmStatus).slice(1)}
          </span>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span className="text-xs font-medium text-slate-600">CPU</span>
            </div>
            <p className="text-base font-bold text-slate-800">{vmCPU} Core{vmCPU !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs font-medium text-slate-600">Memory</span>
            </div>
            <p className="text-base font-bold text-slate-800">{vmMemory}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="text-xs font-medium text-slate-600">Storage</span>
            </div>
            <p className="text-base font-bold text-slate-800">{vmStorage}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-slate-600">OS</span>
            </div>
            <p className="text-sm font-bold text-slate-800 truncate" title={vmOS}>{vmOS}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {vmStatus === 'stopped' || vmStatus === 'exited' ? (
            <button
              onClick={handleStartStop}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {loading ? 'Starting...' : 'Start VM'}
            </button>
          ) : vmStatus === 'running' ? (
            <>
              <button
                onClick={() => onStart && onStart(vm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-sm hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Terminal
              </button>
              <button
                onClick={handleStartStop}
                disabled={loading}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : 'Stop'}
              </button>
            </>
          ) : (
            <button disabled className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-500 rounded-lg font-medium text-sm cursor-not-allowed">
              {vmStatus}
            </button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">Created: {createdAt}</p>
        </div>
      </div>
    </div>
  );
};

export default VMCard;
