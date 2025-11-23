import api from './api';

// Get all users
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// Get user details
export const getUserDetails = async (userId) => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

// Get all clients (PCs)
export const getAllClients = async () => {
  const response = await api.get('/admin/clients');
  return response.data;
};

// Get client details
export const getClientDetails = async (clientId) => {
  const response = await api.get(`/admin/clients/${clientId}`);
  return response.data;
};

// Get all VMs
export const getAllVMs = async () => {
  const response = await api.get('/admin/vms');
  return response.data;
};

// Get particular VM by ID
export const getVMById = async (vmId) => {
  const response = await api.get(`/admin/vms/${vmId}`);
  return response.data;
};

// Get VMs on client
export const getVMsOnClient = async (clientId) => {
  const response = await api.get(`/admin/vms/client/${clientId}`);
  return response.data;
};

// Delete VM
export const deleteVM = async (vmId) => {
  const response = await api.delete(`/admin/vms/${vmId}`);
  return response.data;
};
