import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/ProtectedRoute';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg border-2 border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Authentication Pages
import Login from './login/pages/Login';
import Register from './login/pages/Register';
import TwoFactorAuth from './login/pages/TwoFactorAuth';
import ForgotPassword from './login/pages/ForgotPassword';
import ResetPassword from './login/pages/ResetPassword';

// User Dashboard Pages
import UserDashboard from './users_dashboard/pages/UserDashboard';
import CreateVM from './users_dashboard/pages/CreateVM';
import UserProfile from './users_dashboard/pages/UserProfile';

// Admin Dashboard Pages
import AdminDashboard from './admin_dashboard/pages/AdminDashboard';
import UserDetails from './admin_dashboard/pages/UserDetails';
import PCDetails from './admin_dashboard/pages/PCDetails';
import AllVMs from './admin_dashboard/pages/AllVMs';
import AllClients from './admin_dashboard/pages/AllClients';
import AdminProfile from './admin_dashboard/pages/AdminProfile';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* User Routes */}
        <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/create-vm" element={<ProtectedRoute><CreateVM /></ProtectedRoute>} />
        <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/user/:userId" element={<AdminRoute><UserDetails /></AdminRoute>} />
        <Route path="/admin/client/:clientId" element={<AdminRoute><PCDetails /></AdminRoute>} />
        <Route path="/admin/all-vms" element={<AdminRoute><AllVMs /></AdminRoute>} />
        <Route path="/admin/all-clients" element={<AdminRoute><AllClients /></AdminRoute>} />
        <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
