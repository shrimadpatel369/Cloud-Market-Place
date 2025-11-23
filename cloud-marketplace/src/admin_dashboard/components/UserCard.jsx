import React from 'react';
import { Link } from 'react-router-dom';

const UserCard = ({ user }) => {
  // Handle different field names from API
  const displayName = user.name || user.username || user.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <Link to={`/admin/user/${user._id || user.id}`} className="block">
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {displayName}
            </h3>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          user.status === 'active' || !user.status
            ? 'bg-green-100 text-green-700' 
            : 'bg-slate-100 text-slate-700'
        }`}>
          {user.status || 'active'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-slate-600">VMs</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{user.totalVMs || user.vmsCount || 0}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span className="text-xs font-medium text-slate-600">Storage</span>
          </div>
          <p className="text-base font-bold text-slate-800">{user.totalStorage || 0}GB</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Joined {user.joinedDate || user.createdAt || 'Recently'}</span>
        <span className="flex items-center gap-1 text-indigo-500 font-medium group-hover:gap-2 transition-all">
          View Details
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
    </Link>
  );
};

export default UserCard;
