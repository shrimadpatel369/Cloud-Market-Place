import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../users_dashboard/components/Navbar';
import AdminStatsCard from '../components/AdminStatsCard';
import VMCard from '../../users_dashboard/components/VMCard';
import { getUserDetails, getAllVMs } from '../../services/adminService';

const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userVMs, setUserVMs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const [userData, vmsData] = await Promise.all([
          getUserDetails(userId),
          getAllVMs()
        ]);

        const userObj = userData.user || null;
        const allVms = vmsData.vms || [];

        // VMs owned by this user (API uses `owner`)
        const ownedVMs = allVms.filter(vm => vm.owner === userId);

        setUser(userObj);
        setUserVMs(ownedVMs);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar userRole="admin" />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-slate-600">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats from user's VMs
  const stats = {
    totalVMs: userVMs.length,
    totalStorage: userVMs.reduce((sum, vm) => sum + Number(vm.storage || 0), 0)
  };

  // Get user initials safely
  const getUserInitials = () => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar userRole="admin" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-500 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {getUserInitials()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">{user.username || user.name || user.email || 'User'}</h1>
                <p className="text-slate-600">{user.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    active
                  </span>
                  <span className="text-sm text-slate-500">Last active: Recently</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600">{user.email}</span>
              </div>
              {user.username && (
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-slate-600">Username: {user.username}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600">Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AdminStatsCard
                    title="Total VMs"
                    value={stats.totalVMs}
                    subtitle="Active virtual machines"
                    gradient="from-purple-500 to-pink-500"
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                  />
                  <AdminStatsCard
                    title="Total Storage"
                    value={`${stats.totalStorage}GB`}
                    subtitle="Allocated storage"
                    gradient="from-pink-500 to-rose-500"
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    }
                  />
                </div>
          </div>
        </div>

        {/* PCs are shown under All Clients; removed from user details */}

        {/* User's VM List */}
        <div className="mt-10 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">User's Virtual Machines</h2>
          <p className="text-slate-600">Virtual machines owned by this user</p>
        </div>

        {userVMs.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Virtual Machines</h3>
            <p className="text-slate-600">This user doesn't own any VMs yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userVMs.map(vm => (
              <VMCard key={vm._id || vm.vmId} vm={vm} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
