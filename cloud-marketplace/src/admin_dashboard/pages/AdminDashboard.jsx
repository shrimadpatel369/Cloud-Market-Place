import React, { useState, useEffect } from 'react';
import Navbar from '../../users_dashboard/components/Navbar';
import AdminStatsCard from '../components/AdminStatsCard';
import UserCard from '../components/UserCard';
import { getAllUsers, getAllVMs, getAllClients } from '../../services/adminService';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [vms, setVms] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, vmsData, clientsData] = await Promise.all([
          getAllUsers(),
          getAllVMs(),
          getAllClients()
        ]);
        console.log('Admin Dashboard - Users:', usersData);
        console.log('Admin Dashboard - VMs:', vmsData);
        console.log('Admin Dashboard - Clients:', clientsData);
        
        const vmsList = vmsData.vms || [];
        const usersList = usersData.users || [];
        const clientsList = clientsData.clients || [];
        
        // Calculate VM count and storage for each user
        const enrichedUsers = usersList.map(user => {
          const userId = user._id || user.id;
          // VM owner field from API is `owner` (user's _id)
          const userVMs = vmsList.filter(vm => vm.owner === userId || vm.userId === userId);
          // Clients do not always include user mapping; keep defensive fallback
          const userClients = clientsList.filter(client => client.owner === userId || client.userId === userId);
          const totalStorage = userVMs.reduce((sum, vm) => sum + Number(vm.storage || 0), 0);

          return {
            ...user,
            vmsCount: userVMs.length,
            clientsCount: userClients.length || 0,
            totalVMs: userVMs.length,
            pcsConnected: userClients.length || 0,
            totalStorage
          };
        });
        
        // Calculate VM count for each client
        const enrichedClients = clientsList.map(client => {
          const clientId = client.clientId || client.id || client._id;
          const clientVMs = vmsList.filter(vm => vm.clientId === clientId);
          return {
            ...client,
            vmsCount: clientVMs.length
          };
        });
        
        setUsers(enrichedUsers);
        setVms(vmsList);
        setClients(enrichedClients);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = {
    totalUsers: users.length,
    // API doesn't guarantee `status` on users; treat all as active by default
    activeUsers: users.length,
    totalVMs: vms.length,
    totalPCs: clients.length,
    totalStorage: vms.reduce((sum, vm) => sum + Number(vm.storage || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading admin dashboard...</p>
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold border border-red-300 animate-pulse">
              👑 Admin Panel
            </span>
          </div>
          <p className="text-slate-600">Monitor and manage all users and resources</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminStatsCard
            title="Total Users"
            value={stats.totalUsers}
            subtitle={`${stats.activeUsers} active`}
            gradient="from-indigo-500 to-purple-500"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <AdminStatsCard
            title="Total VMs"
            value={stats.totalVMs}
            subtitle="Across all users"
            gradient="from-purple-500 to-pink-500"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <AdminStatsCard
            title="Connected PCs"
            value={stats.totalPCs}
            subtitle="Active devices"
            gradient="from-blue-500 to-cyan-500"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            }
          />
          <AdminStatsCard
            title="Total Storage"
            value={`${stats.totalStorage}GB`}
            subtitle="Used capacity"
            gradient="from-pink-500 to-rose-500"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Running VMs</h3>
                <p className="text-2xl font-bold text-green-600">{vms.filter(vm => vm.status === 'running').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Stopped VMs</h3>
                <p className="text-2xl font-bold text-red-600">{vms.filter(vm => vm.status === 'stopped' || vm.status === 'exited').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">All Users</h2>
          <div className="flex gap-3">
            <input
              type="search"
              placeholder="Search users..."
              className="px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50">
              Add User
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard key={user._id || user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
