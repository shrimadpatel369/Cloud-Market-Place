import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../users_dashboard/components/Navbar';
import VMCard from '../../users_dashboard/components/VMCard';
import TerminalModal from '../../users_dashboard/components/TerminalModal';
import { getClientDetails, getVMsOnClient, getAllUsers } from '../../services/adminService';

const PCDetails = () => {
  const { userId, clientId } = useParams();
  const navigate = useNavigate();
  const [selectedVM, setSelectedVM] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [pc, setPc] = useState(null);
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientData, vmsData] = await Promise.all([
          getClientDetails(clientId),
          getVMsOnClient(clientId)
        ]);
        console.log('Client details:', clientData);
        console.log('VMs on client:', vmsData);
        const pcObj = clientData.client || {};
        let vmsList = vmsData.vms || [];

        // Fetch users to map owner id -> name/email
        try {
          const usersData = await getAllUsers();
          const users = usersData.users || [];
          const userMap = {};
          users.forEach(u => { userMap[u._id || u.id] = u; });
          vmsList = vmsList.map(vm => {
            const owner = userMap[vm.owner] || userMap[vm.userId];
            return {
              ...vm,
              ownerName: owner?.name || owner?.username || owner?.email || vm.owner
            };
          });
        } catch (e) {
          console.warn('Failed to fetch users for VM owner mapping', e);
        }

        setPc(pcObj);
        setVms(vmsList);
      } catch (error) {
        console.error('Error fetching PC details:', error);
        setError(error.response?.data?.message || 'Failed to load PC details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const oldVms = [
  ];

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
            <p className="mt-4 text-slate-600">Loading PC details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600">{error || 'PC not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Derived display values from API `pc` shape
  const displayName = pc.meta?.hostname || pc.name || pc.hostname || 'PC';
  const clientIdDisplay = pc.id || pc.clientId || pc._id || 'N/A';
  const cpuCores = pc.lastStats?.cpuCores || pc.cpu || pc.cpuCores || 0;
  const totalMemMB = pc.lastStats?.totalMemMB;
  const totalMemoryGB = totalMemMB ? Math.round(totalMemMB / 1024) : (pc.totalMemory || pc.memory || 0);
  const totalStorageGB = pc.lastStats?.disks ? pc.lastStats.disks.reduce((s, d) => s + (d.totalGB || 0), 0) : (pc.totalStorage || pc.storage || 0);
  const lastActive = pc.lastStats?.timestamp || pc.lastSeen || 'Unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar userRole="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/admin/users/${userId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-500 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to User Details
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">{displayName}</h1>
                <p className="text-slate-600">Client ID: {clientIdDisplay}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    pc.status === 'active' || pc.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${pc.status === 'active' || pc.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`} />
                    {pc.status || (pc.lastSeen ? 'online' : 'offline')}
                  </span>
                  <span className="text-sm text-slate-500">Last active: {lastActive}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PC Specifications */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">System Specifications</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span className="text-sm font-medium text-slate-600">CPU Cores</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{cpuCores || 'N/A'}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium text-slate-600">Total Memory</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalMemoryGB || 'N/A'}GB</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span className="text-sm font-medium text-slate-600">Total Storage</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{totalStorageGB || 'N/A'}GB</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-slate-600">Operating System</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{pc.os || pc.platform || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              IP Address: <span className="font-semibold text-slate-800">{pc.ipAddress || pc.ip || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* VMs on this PC */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Virtual Machines on this PC</h2>
          <p className="text-slate-600">{vms.length} VMs hosted on {displayName}</p>
        </div>

        {vms.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Virtual Machines</h3>
            <p className="text-slate-600">This PC doesn't have any VMs configured yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vms.map((vm) => (
              <VMCard key={vm._id || vm.vmId || vm.id} vm={vm} onStart={handleStartVM} />
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

export default PCDetails;
