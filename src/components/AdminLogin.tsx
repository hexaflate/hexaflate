import React, { useState, useEffect } from 'react';
import { Shield, Phone, AlertCircle, Clock } from 'lucide-react';
import AdminOtpInput from './AdminOtpInput';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  THEME_COLOR_DARKER,
  THEME_COLOR_VERY_LIGHT,
  THEME_COLOR_LIGHT_VERY_LIGHT,
  THEME_COLOR_LIGHT_DARK,
  withOpacity,
} from '../utils/themeColors';

interface AdminLoginProps {
  onLoginSuccess: (authSeed: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  session_key?: string;
  registered: boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  const ATTEMPT_WINDOW = 60 * 1000; // 1 minute window for counting attempts

  // Check rate limiting on component mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  // Countdown timer for rate limiting
  useEffect(() => {
    let interval: number;
    if (isRateLimited && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRateLimited, remainingTime]);

  const checkRateLimit = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('adminLoginAttempts') || '[]');

    // Filter attempts within the window
    const recentAttempts = attempts.filter((attempt: number) => now - attempt < ATTEMPT_WINDOW);

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const lockoutEnd = oldestAttempt + LOCKOUT_DURATION;

      if (now < lockoutEnd) {
        setIsRateLimited(true);
        setRemainingTime(lockoutEnd - now);
        return true;
      } else {
        // Lockout period expired, clear old attempts
        localStorage.setItem('adminLoginAttempts', JSON.stringify([]));
      }
    }

    setIsRateLimited(false);
    setRemainingTime(0);
    return false;
  };

  const recordFailedAttempt = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('adminLoginAttempts') || '[]');

    // Add current attempt
    attempts.push(now);

    // Keep only recent attempts
    const recentAttempts = attempts.filter((attempt: number) => now - attempt < ATTEMPT_WINDOW);

    localStorage.setItem('adminLoginAttempts', JSON.stringify(recentAttempts));

    // Check if we should be rate limited
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      setIsRateLimited(true);
      setRemainingTime(LOCKOUT_DURATION);
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem('adminLoginAttempts');
    setIsRateLimited(false);
    setRemainingTime(0);
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if rate limited
    if (isRateLimited) {
      setError(`Terlalu banyak percobaan login. Silakan tunggu ${formatTime(remainingTime)} sebelum mencoba lagi.`);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = await getApiUrl('/adminlogin');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          number: phoneNumber,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Server error: ${response.status} - ${errorText}`);
        return;
      }

      // Check if response has content
      const responseText = await response.text();

      if (!responseText.trim()) {
        setError('Server returned empty response');
        return;
      }

      let data: LoginResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        setError(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (data.success && data.session_key) {
        setSuccess('OTP berhasil dikirim! Silakan periksa telepon Anda.');
        setSessionKey(data.session_key);
        setShowOtpInput(true);
        // Clear failed attempts on successful login
        clearFailedAttempts();
      } else {
        setError(data.message || 'Login failed');
        // Record failed attempt
        recordFailedAttempt();
      }
    } catch (err) {
      setError('Kesalahan jaringan. Silakan periksa koneksi Anda.');
      // Record failed attempt for network errors too
      recordFailedAttempt();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSuccess = (authSeed: string) => {
    onLoginSuccess(authSeed);
  };

  const handleBackToPhone = () => {
    setShowOtpInput(false);
    setSessionKey('');
    setError('');
    setSuccess('');
  };

  // Show OTP input if we have a session key
  if (showOtpInput && sessionKey) {
    return (
      <AdminOtpInput
        sessionKey={sessionKey}
        onOtpSuccess={handleOtpSuccess}
        onBack={handleBackToPhone}
      />
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${THEME_COLOR_VERY_LIGHT}, white, ${withOpacity(THEME_COLOR_LIGHT_VERY_LIGHT, 0.5)})`
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.3)}, ${withOpacity(THEME_COLOR_LIGHT, 0.3)})` }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR_LIGHT, 0.3)}, ${withOpacity(THEME_COLOR, 0.3)})` }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.2)}, ${withOpacity(THEME_COLOR_LIGHT, 0.2)})` }}
        ></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center animate-slide-up">
          <div 
            className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-glow transform hover:scale-105 transition-transform duration-300"
            style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})` }}
          >
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 
            className="mt-6 text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(to right, ${THEME_COLOR_DARK}, ${THEME_COLOR_LIGHT_DARK})`, WebkitBackgroundClip: 'text' }}
          >
            Login Admin
          </h2>
          <p className="mt-3 text-sm text-neutral-500">
            Masukkan nomor telepon Anda untuk menerima OTP
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-card border border-white/50 animate-scale-in" onSubmit={handlePhoneSubmit}>
          <div className="space-y-5">
            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-neutral-700 mb-2">
                Nomor Telepon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Phone className="h-5 w-5" style={{ color: THEME_COLOR }} />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-neutral-400 focus:outline-none transition-all duration-300 hover:border-neutral-300 text-neutral-900"
                  onFocus={(e) => {
                    e.target.style.borderColor = THEME_COLOR_LIGHT;
                    e.target.style.boxShadow = `0 0 0 2px ${withOpacity(THEME_COLOR, 0.2)}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '';
                    e.target.style.boxShadow = '';
                  }}
                  placeholder="Masukkan nomor telepon Anda"
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500 pl-1">
                Format: 08xxxxxxxxx atau +62xxxxxxxxx
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-gradient-to-r from-danger-50 to-danger-100/50 border border-danger-200/50 rounded-xl animate-slide-in">
              <div className="p-1.5 bg-danger-500 rounded-lg mr-3">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-danger-700 font-medium">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div 
              className="flex items-center p-4 rounded-xl animate-slide-in"
              style={{
                background: `linear-gradient(to right, ${withOpacity(THEME_COLOR_VERY_LIGHT, 0.8)}, ${withOpacity(THEME_COLOR_LIGHT_VERY_LIGHT, 0.5)})`,
                borderColor: withOpacity(THEME_COLOR, 0.3),
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <div 
                className="p-1.5 rounded-lg mr-3"
                style={{ background: THEME_COLOR }}
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: THEME_COLOR_DARK }}>{success}</span>
            </div>
          )}

          {/* Rate Limiting Warning */}
          {isRateLimited && (
            <div className="flex items-center p-4 bg-gradient-to-r from-warning-50 to-warning-100/50 border border-warning-200/50 rounded-xl animate-slide-in">
              <div className="p-1.5 bg-warning-500 rounded-lg mr-3">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-warning-700 font-medium">
                Terlalu banyak percobaan. Tunggu {formatTime(remainingTime)}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isRateLimited}
            className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !isRateLimited) {
                e.currentTarget.style.background = `linear-gradient(to right, ${THEME_COLOR_DARK}, ${THEME_COLOR_LIGHT_DARK})`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`;
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 2px white, 0 0 0 4px ${withOpacity(THEME_COLOR, 0.3)}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mengirim OTP...
              </div>
            ) : isRateLimited ? (
              `Tunggu ${formatTime(remainingTime)}`
            ) : (
              'Kirim OTP'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center animate-fade-in">
          <p className="text-xs text-neutral-400">
            Hanya pengguna terdaftar dengan hak akses admin yang dapat mengakses sistem ini
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
