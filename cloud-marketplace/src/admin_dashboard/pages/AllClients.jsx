import React, { useState, useEffect } from 'react';
import Navbar from '../../users_dashboard/components/Navbar';
import PCCard from '../components/PCCard';
import { getAllClients, getAllVMs } from '../../services/adminService';

const AllClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsData, vmsData] = await Promise.all([
          getAllClients(),
          getAllVMs()
        ]);
        console.log('All Clients fetched:', clientsData);
        console.log('VMs for count:', vmsData);
        
        const vmsList = vmsData.vms || [];
        
        // Enrich clients with VM count and status
        const now = Date.now();
        const FIVE_MIN = 5 * 60 * 1000;
        const enrichedClients = (clientsData.clients || []).map(client => {
          const clientId = client.clientId || client.id || client._id;
          const clientVMs = vmsList.filter(vm => vm.clientId === clientId);

          // Determine online status from lastSeen (ms) or lastStats.timestamp
          let isOnline = false;
          if (client.lastSeen) {
            isOnline = (now - Number(client.lastSeen)) < FIVE_MIN;
          } else if (client.lastStats?.timestamp) {
            const ts = Date.parse(client.lastStats.timestamp);
            if (!Number.isNaN(ts)) isOnline = (now - ts) < FIVE_MIN;
          }

          return {
            ...client,
            vmsCount: clientVMs.length,
            status: isOnline ? 'online' : 'offline'
          };
        });
        
        setClients(enrichedClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError(error.response?.data?.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = {
    total: clients.length,
    online: clients.filter(c => c.status === 'online').length,
    offline: clients.filter(c => c.status === 'offline').length,
    totalVMs: clients.reduce((sum, c) => sum + (c.vmsCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading clients...</p>
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">All Clients (PCs)</h1>
          <p className="text-slate-600">View and manage all connected physical computers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Clients</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Offline</p>
                <p className="text-2xl font-bold text-slate-600">{stats.offline}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total VMs</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalVMs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Connected Clients</h2>
            <input
              type="search"
              placeholder="Search clients..."
              className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <PCCard key={client.clientId || client.id} pc={client} />
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No clients connected yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllClients;
