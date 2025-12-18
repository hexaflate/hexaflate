import React, { useState } from 'react';
import { Shield, Key, AlertCircle } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  THEME_COLOR_VERY_LIGHT,
  THEME_COLOR_LIGHT_VERY_LIGHT,
  THEME_COLOR_LIGHT_DARK,
  withOpacity,
} from '../utils/themeColors';

interface AdminOtpInputProps {
  sessionKey: string;
  onOtpSuccess: (authSeed: string) => void;
  onBack: () => void;
}

interface AuthenticateResponse {
  success: boolean;
  message: string;
  auth_seed?: string;
  registered: boolean;
}

const AdminOtpInput: React.FC<AdminOtpInputProps> = ({ sessionKey, onOtpSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = await getApiUrl('/adminauthenticate');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          otp: otp,
          session_key: sessionKey,
          device_model: null,
          imei: null,
          safetycheck: 0,
        }),
      });

      const data: AuthenticateResponse = await response.json();

      if (data.success && data.auth_seed) {
        setSuccess('Autentikasi berhasil! Mengalihkan...');
        // Store both session_key and auth_seed in localStorage for persistence
        localStorage.setItem('adminSessionKey', sessionKey);
        localStorage.setItem('adminAuthSeed', data.auth_seed);

        // Call the success callback
        onOtpSuccess(data.auth_seed);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
              setError('Kesalahan jaringan. Silakan periksa koneksi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Masukkan OTP
          </h2>
          <p className="mt-3 text-sm text-neutral-500">
            Periksa telepon Anda untuk pesan OTP
          </p>
        </div>

        {/* OTP Form */}
        <form className="mt-8 space-y-6 bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-card border border-white/50 animate-scale-in" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="block text-sm font-semibold text-neutral-700 mb-2">
                Kode OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm placeholder-neutral-400 focus:outline-none transition-all duration-300 hover:border-neutral-300 text-neutral-900 text-center text-2xl font-mono tracking-[0.5em]"
                  onFocus={(e) => {
                    e.target.style.borderColor = THEME_COLOR_LIGHT;
                    e.target.style.boxShadow = `0 0 0 2px ${withOpacity(THEME_COLOR, 0.2)}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '';
                    e.target.style.boxShadow = '';
                  }}
                  placeholder="000000"
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500 text-center">
                Masukkan kode 6 digit yang dikirim ke telepon Anda
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

          {/* Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`
              }}
              onMouseEnter={(e) => {
                if (!isLoading && otp.length === 6) {
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
                  Memverifikasi...
                </div>
              ) : (
                'Verifikasi OTP'
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex justify-center py-3.5 px-6 border border-neutral-200 text-sm font-semibold rounded-xl text-neutral-700 bg-white/80 hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 transition-all duration-300"
            >
              Kembali ke Nomor Telepon
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center animate-fade-in">
          <p className="text-xs text-neutral-400">
            OTP berlaku selama 5 menit
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOtpInput;
