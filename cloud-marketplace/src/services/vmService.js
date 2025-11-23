import api from './api';

// Create VM
export const createVM = async (vmData) => {
  console.log('vmService: Creating VM with data:', vmData);
  try {
    const response = await api.post('/vms/create', vmData);
    console.log('vmService: VM created response:', response.data);
    return response.data;
  } catch (error) {
    console.error('vmService: Create VM error:', error);
    console.error('vmService: Error response:', error.response?.data);
    throw error;
  }
};

// Get my VMs
export const getMyVMs = async () => {
  const response = await api.get('/vms/my');
  return response.data;
};

// Execute command in VM
export const executeInVM = async (clientId, vmId, command) => {
  const response = await api.post('/vms/exec', { clientId, vmId, command });
  return response.data;
};

// Start VM
export const startVM = async (clientId, vmId) => {
  console.log('vmService: Starting VM', { clientId, vmId });
  const response = await api.post(`/vms/start/${vmId}`, { clientId });
  return response.data;
};

// Stop VM
export const stopVM = async (clientId, vmId) => {
  console.log('vmService: Stopping VM', { clientId, vmId });
  const response = await api.post(`/vms/stop/${vmId}`, { clientId });
  return response.data;
};

// Get VM details
export const getVMDetails = async (vmId) => {
  const response = await api.get(`/vms/${vmId}`);
  return response.data;
};
