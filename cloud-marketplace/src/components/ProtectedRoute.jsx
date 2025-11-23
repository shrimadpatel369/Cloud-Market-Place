import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin, getCurrentUser } from '../services/authService';

export const ProtectedRoute = ({ children }) => {
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated());
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AdminRoute = ({ children }) => {
  console.log('AdminRoute - isAuthenticated:', isAuthenticated());
  console.log('AdminRoute - isAdmin:', isAdmin());
  console.log('AdminRoute - currentUser:', getCurrentUser());
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    console.log('Not admin, redirecting to /user/dashboard');
    return <Navigate to="/user/dashboard" replace />;
  }
  return children;
};

export const PublicRoute = ({ children }) => {
  console.log('PublicRoute - isAuthenticated:', isAuthenticated());
  if (isAuthenticated()) {
    if (isAdmin()) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }
  return children;
};
