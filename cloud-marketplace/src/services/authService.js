import api from './api';

// Login
export const login = async (email, password) => {
  try {
    console.log('AuthService: Sending login request', { email });
    const response = await api.post('/auth/login', { email, password });
    console.log('AuthService: Login response received', response.data);
    // Response contains: { otpId, message }
    return response.data;
  } catch (error) {
    console.error('AuthService: Login error', error);
    console.error('AuthService: Error response', error.response?.data);
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Register
export const register = async (name, username, email, password) => {
  try {
    const response = await api.post('/auth/register', { name, username, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// OTP Verify
export const verifyOTP = async (otpId, code) => {
  try {
    const response = await api.post('/auth/verify-otp', { otpId, code });
    console.log('OTP Verify - Full Response:', response.data);
    console.log('OTP Verify - User Object:', response.data.user);
    console.log('OTP Verify - User Role:', response.data.user?.role);
    
    // Response contains: { token, user: { id, email, role } }
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('Stored in localStorage - User:', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'OTP verification failed' };
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Check if authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Check if admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};
