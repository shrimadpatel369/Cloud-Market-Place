import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createVM } from '../../services/vmService';

const CreateVM = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cpu: 2,
    memory: '4GB',
    storage: '20GB',
    os: 'ubuntu:22.04'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Creating VM with config:', formData);
    
    try {
      const response = await createVM(formData);
      console.log('VM created successfully:', response);
      navigate('/user/dashboard');
    } catch (err) {
      console.error('Create VM error:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create VM';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const osOptions = [
    { value: 'ubuntu:22.04', label: 'Ubuntu 22.04 LTS', icon: '🐧' },
    { value: 'ubuntu:20.04', label: 'Ubuntu 20.04 LTS', icon: '🐧' },
    { value: 'centos:8', label: 'CentOS 8', icon: '🔴' },
    { value: 'debian:11', label: 'Debian 11', icon: '🌀' },
    { value: 'alpine:latest', label: 'Alpine Linux', icon: '⛰️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar userRole="user" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-500 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create New Virtual Machine</h1>
          <p className="text-slate-600">Configure your VM specifications</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-200 p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* CPU Cores */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CPU Cores <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[2, 4, 8, 16].map((cores) => (
                  <label
                    key={cores}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.cpu === cores
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cpu"
                      value={cores}
                      checked={formData.cpu === cores}
                      onChange={() => handleChange('cpu', cores)}
                      className="sr-only"
                    />
                    <svg className="w-6 h-6 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    <span className="font-semibold text-slate-800">{cores}</span>
                    <span className="text-xs text-slate-600">Cores</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Memory */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Memory (RAM) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['4GB', '8GB', '16GB', '32GB'].map((memory) => (
                  <label
                    key={memory}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.memory === memory
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="memory"
                      value={memory}
                      checked={formData.memory === memory}
                      onChange={() => handleChange('memory', memory)}
                      className="sr-only"
                    />
                    <svg className="w-6 h-6 text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-semibold text-slate-800">{memory}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Storage */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Storage <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['20GB', '40GB', '80GB', '160GB'].map((storage) => (
                  <label
                    key={storage}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.storage === storage
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-slate-200 hover:border-pink-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="storage"
                      value={storage}
                      checked={formData.storage === storage}
                      onChange={() => handleChange('storage', storage)}
                      className="sr-only"
                    />
                    <svg className="w-6 h-6 text-pink-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <span className="font-semibold text-slate-800">{storage}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operating System */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Operating System <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {osOptions.map((os) => (
                  <label
                    key={os.value}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.os === os.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="os"
                      value={os.value}
                      checked={formData.os === os.value}
                      onChange={() => handleChange('os', os.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-3">{os.icon}</span>
                    <span className="font-semibold text-slate-800">{os.label}</span>
                    {formData.os === os.value && (
                      <svg className="w-5 h-5 text-indigo-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Configuration Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">CPU Cores</p>
                  <p className="text-lg font-semibold text-slate-800">{formData.cpu} Cores</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Memory</p>
                  <p className="text-lg font-semibold text-slate-800">{formData.memory}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Storage</p>
                  <p className="text-lg font-semibold text-slate-800">{formData.storage}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Operating System</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {osOptions.find(os => os.value === formData.os)?.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Virtual Machine'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/user/dashboard')}
                disabled={loading}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVM;
