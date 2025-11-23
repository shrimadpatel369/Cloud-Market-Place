import React, { useState, useEffect } from 'react';
import Navbar from '../../users_dashboard/components/Navbar';
import VMCard from '../../users_dashboard/components/VMCard';
import TerminalModal from '../../users_dashboard/components/TerminalModal';
import { getAllVMs, getAllUsers } from '../../services/adminService';

const AllVMs = () => {
  const [selectedVM, setSelectedVM] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [vms, setVms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vmsData, usersData] = await Promise.all([
          getAllVMs(),
          getAllUsers()
        ]);
        console.log('All VMs fetched:', vmsData);
        console.log('All Users fetched:', usersData);
        
        // Create user lookup map
        const userMap = {};
        (usersData.users || []).forEach(user => {
          userMap[user._id || user.id] = user;
        });

        // Enrich VMs with user information. API uses `owner` for VM owner id.
        const enrichedVMs = (vmsData.vms || []).map(vm => {
          const user = userMap[vm.owner || vm.userId];
          return {
            ...vm,
            userName: user?.username || user?.name || user?.email,
            userEmail: user?.email
          };
        });
        
        setVms(enrichedVMs);
        setUsers(usersData.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Failed to load VMs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const oldVms = [
  ];

  const filteredVMs = filterStatus === 'all' 
    ? vms 
    : vms.filter(vm => vm.status === filterStatus);

  const stats = {
    total: vms.length,
    running: vms.filter(vm => vm.status === 'running').length,
    stopped: vms.filter(vm => vm.status === 'stopped').length,
    pending: vms.filter(vm => vm.status === 'pending').length
  };

  const handleStartVM = (vm) => {
    setSelectedVM(vm);
    setShowTerminal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading VMs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar userRole="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">All Virtual Machines</h1>
          <p className="text-slate-600">View and manage all VMs across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total VMs</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Running</p>
                <p className="text-2xl font-bold text-green-600">{stats.running}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Stopped</p>
                <p className="text-2xl font-bold text-red-600">{stats.stopped}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-indigo-300'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('running')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                filterStatus === 'running'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-green-300'
              }`}
            >
              Running ({stats.running})
            </button>
            <button
              onClick={() => setFilterStatus('stopped')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                filterStatus === 'stopped'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-red-300'
              }`}
            >
              Stopped ({stats.stopped})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                filterStatus === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-yellow-300'
              }`}
            >
              Pending ({stats.pending})
            </button>
          </div>

          <input
            type="search"
            placeholder="Search VMs..."
            className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* VMs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVMs.map((vm) => (
            <div key={vm.id || vm.vmId}>
              <VMCard vm={vm} onStart={handleStartVM} />
              <div className="mt-2 px-4 py-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs gap-2">
                <span className="text-slate-600 truncate" title={vm.userName || vm.user || vm.userEmail || vm.userId}>
                  <span className="font-medium text-slate-700">User:</span> {vm.userName || vm.user || vm.userEmail || vm.userId || 'N/A'}
                </span>
                <span className="text-slate-600 truncate" title={vm.clientName || vm.pcName || vm.clientId}>
                  <span className="font-medium text-slate-700">PC:</span> {vm.clientName || vm.pcName || vm.clientId || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Modal */}
      <TerminalModal
        vm={selectedVM}
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  );
};

export default AllVMs;
