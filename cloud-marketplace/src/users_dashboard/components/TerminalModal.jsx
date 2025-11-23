import React, { useState, useEffect, useRef } from 'react';
import { executeInVM } from '../../services/vmService';

const TerminalModal = ({ vm, isOpen, onClose }) => {
  const [clientId, setClientId] = useState('');
  const [command, setCommand] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const outputRef = useRef(null);

  const vmId = vm?.vmId || vm?.id || vm?.containerId || '';
  const vmName = vm?.name || `VM-${vmId.substring(0, 8)}`;
  const vmClientId = vm?.clientId || '';

  useEffect(() => {
    if (isOpen && vm) {
      // Auto-fill clientId from VM data
      setClientId(vmClientId);
      setTerminalOutput([
        { type: 'system', text: `Connected to VM: ${vmName}` },
        { type: 'system', text: `VM ID: ${vmId}` },
        { type: 'system', text: `Client ID: ${vmClientId || 'Not set'}` },
        { type: 'system', text: 'Ready to execute commands...' }
      ]);
    }
  }, [isOpen, vm, vmId, vmName, vmClientId]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const executeCommand = async (e) => {
    e.preventDefault();
    
    if (!clientId || !vmId || !command) {
      setTerminalOutput(prev => [...prev, 
        { type: 'error', text: 'Error: Client ID and command are required' }
      ]);
      return;
    }

    // Add command to output
    setTerminalOutput(prev => [...prev, 
      { type: 'input', text: `$ ${command}` },
      { type: 'system', text: 'Executing...' }
    ]);

    setLoading(true);
    try {
      const response = await executeInVM(clientId, vmId, command);
      console.log('Command execution response:', response);
      
      // Handle nested output object structure
      let output;
      if (typeof response.output === 'object' && response.output !== null) {
        // Backend returns {vmId, output, exitCode, serverJobId}
        output = response.output.output || JSON.stringify(response.output, null, 2);
      } else {
        output = response.output || response.result || 'Command executed successfully';
      }
      
      setTerminalOutput(prev => [
        ...prev.slice(0, -1), // Remove 'Executing...' message
        { type: 'output', text: String(output) }
      ]);
    } catch (error) {
      console.error('Execute command error:', error);
      const errorMsg = error.message || error.response?.data?.message || 'Command execution failed';
      setTerminalOutput(prev => [
        ...prev.slice(0, -1), // Remove 'Executing...' message
        { type: 'error', text: `Error: ${errorMsg}` }
      ]);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const clearTerminal = () => {
    setTerminalOutput([
      { type: 'system', text: `Connected to VM: ${vmName}` },
      { type: 'system', text: `VM ID: ${vmId}` },
      { type: 'system', text: `Client ID: ${clientId || 'Not set'}` },
      { type: 'system', text: 'Ready to execute commands...' }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">VM Terminal</h2>
              <p className="text-sm text-slate-500">{vm?.name || 'Virtual Machine'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Configuration */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client ID {!vmClientId && <span className="text-red-500">*</span>}
              {vmClientId && <span className="text-green-600 text-xs">(Auto-filled)</span>}
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              readOnly={!!vmClientId}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                vmClientId ? 'bg-green-50 border-green-200' : 'border-slate-200'
              }`}
            />
            {!vmClientId && <p className="mt-1 text-xs text-slate-500">Client ID will be available after VM setup</p>}
          </div>
        </div>

        {/* Terminal Output */}
        <div ref={outputRef} className="flex-1 overflow-y-auto p-6 bg-slate-900 font-mono text-sm">
          {terminalOutput.map((line, index) => (
            <div
              key={index}
              className={`mb-2 ${
                line.type === 'input' ? 'text-green-400' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'system' ? 'text-blue-400' :
                'text-slate-300'
              }`}
            >
              {typeof line.text === 'object' ? JSON.stringify(line.text, null, 2) : line.text}
            </div>
          ))}
          <div className="h-4" /> {/* Spacer for auto-scroll */}
        </div>

        {/* Command Input */}
        <div className="p-6 border-t border-slate-200">
          <form onSubmit={executeCommand} className="flex gap-3">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command..."
              disabled={loading || !clientId}
              className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={loading || !clientId || !command}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Executing...' : 'Execute'}
            </button>
            <button
              type="button"
              onClick={clearTerminal}
              className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-all duration-300"
            >
              Clear
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TerminalModal;
