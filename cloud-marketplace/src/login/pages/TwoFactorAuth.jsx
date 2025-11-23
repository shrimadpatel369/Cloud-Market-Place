import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { verifyOTP } from '../../services/authService';

const TwoFactorAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { otpId, email } = location.state || {};
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if no otpId
  React.useEffect(() => {
    if (!otpId) {
      navigate('/login');
    }
  }, [otpId, navigate]);

  const handleChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setError('');
    setLoading(true);
    console.log('2FA verification attempt, code length:', verificationCode.length);
    
    try {
      const response = await verifyOTP(otpId, verificationCode);
      console.log('OTP verification successful:', response);
      console.log('User role detected:', response.user?.role);
      console.log('Is admin?', response.user?.role === 'admin');
      
      // Redirect based on user role
      if (response.user && response.user.role === 'admin') {
        console.log('Redirecting to ADMIN dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('Redirecting to USER dashboard');
        navigate('/user/dashboard');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.message || error.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Two-Factor Authentication</h1>
          <p className="text-slate-500">Enter the 6-digit code from your authenticator app</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {email && (
              <div className="mb-4 text-center text-sm text-slate-600">
                Code sent to <span className="font-medium">{email}</span>
              </div>
            )}
            
            <div className="flex justify-center gap-3 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                />
              ))}
            </div>

            <Button type="submit" variant="primary" className="w-full mb-4" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-sm text-slate-600 hover:text-slate-700"
              >
                ← Back to Login
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Having trouble?</p>
                <p className="text-xs text-slate-600">Make sure your device's time is synchronized and you're using the correct authenticator app.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
