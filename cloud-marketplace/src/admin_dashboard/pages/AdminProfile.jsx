import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../users_dashboard/components/Navbar';
import { getCurrentUser } from '../../services/authService';

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleResetPassword = () => {
    navigate('/forgot-password');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email ? user.email[0].toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar userRole="admin" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Profile</h1>
          <p className="text-slate-600">Manage your administrator account settings</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-bold mb-4 ring-4 ring-indigo-100">
                {initials}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{user?.name || user?.username || 'Admin'}</h2>
              <p className="text-sm text-slate-600 mb-4">{user?.email}</p>
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold inline-flex">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Administrator
              </div>
            </div>

            {/* Profile Information */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Account Information</h3>
              <div className="space-y-4">
                {user?.name && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <div className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                      {user.name}
                    </div>
                  </div>
                )}

                {user?.username && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Username
                    </label>
                    <div className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                      {user.username}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Account Type
                  </label>
                  <div className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-600">
                    Administrator
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Security</h3>
              <button 
                onClick={handleResetPassword}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 rounded-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span className="font-medium text-slate-700">Reset Password</span>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
