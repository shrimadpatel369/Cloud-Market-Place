import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import VMCard from '../components/VMCard';
import TerminalModal from '../components/TerminalModal';
import { getMyVMs } from '../../services/vmService';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [selectedVM, setSelectedVM] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVMs();
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchVMs(true); // Silent refresh
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchVMs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      const data = await getMyVMs();
      console.log('Fetched VMs - Full Response:', data);
      console.log('Fetched VMs - Array:', data.vms || data);
      if (data.vms && data.vms.length > 0) {
        console.log('First VM structure:', data.vms[0]);
      }
      setVms(data.vms || data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching VMs:', err);
      if (!silent) {
        setError('Failed to load VMs');
        setVms([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartVM = (vm) => {
    setSelectedVM(vm);
    setShowTerminal(true);
  };

  const stats = {
    totalVMs: vms.length,
    runningVMs: vms.filter(vm => vm.status === 'running').length,
    totalCPU: vms.reduce((sum, vm) => sum + (parseInt(vm.cpu) || 0), 0),
    totalMemory: vms.reduce((sum, vm) => {
      const memory = vm.memory || vm.ram || '0';
      return sum + parseInt(memory.toString().replace(/[^0-9]/g, ''));
    }, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar userRole="user" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-800">User Dashboard</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-300">
                👤 User Panel
              </span>
            </div>
            <button
              onClick={() => fetchVMs()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <p className="text-slate-600">Manage and monitor your virtual machines</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total VMs"
              value={stats.totalVMs}
              gradient="from-indigo-500 to-purple-500"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatsCard
              title="Running VMs"
              value={stats.runningVMs}
              gradient="from-green-500 to-emerald-500"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatsCard
              title="Total CPU Cores"
              value={stats.totalCPU}
              gradient="from-purple-500 to-pink-500"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              }
            />
            <StatsCard
              title="Total Memory"
              value={`${stats.totalMemory} GB`}
              gradient="from-pink-500 to-rose-500"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
          </div>
        )}

        {/* VMs Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Your Virtual Machines</h2>
          <button
            onClick={() => navigate('/user/create-vm')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium text-sm hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New VM
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : vms.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Virtual Machines</h3>
            <p className="text-slate-600 mb-6">Get started by creating your first VM</p>
            <button 
              onClick={() => navigate('/user/create-vm')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50"
            >
              Create Your First VM
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vms.map((vm) => (
              <VMCard key={vm.vmId || vm.id} vm={vm} onStart={handleStartVM} onRefresh={fetchVMs} />
            ))}
          </div>
        )}
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

export default UserDashboard;
