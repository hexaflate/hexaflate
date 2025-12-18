import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
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

interface MemberOtpInputProps {
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

const MemberOtpInput: React.FC<MemberOtpInputProps> = ({ sessionKey, onOtpSuccess, onBack }) => {
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
      const apiUrl = await getApiUrl('/authenticate');
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
        localStorage.setItem('memberSessionKey', sessionKey);
        localStorage.setItem('memberAuthSeed', data.auth_seed);

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
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.3)}, ${withOpacity(THEME_COLOR_LIGHT, 0.2)})`
          }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `linear-gradient(to top right, ${withOpacity(THEME_COLOR_LIGHT, 0.3)}, ${withOpacity(THEME_COLOR, 0.2)})`
          }}
        />
      </div>

      <div 
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10"
        style={{ borderColor: withOpacity(THEME_COLOR, 0.3), borderWidth: '1px', borderStyle: 'solid' }}
      >
        <div className="text-center mb-8">
          <div 
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
            style={{
              background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`
            }}
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Verifikasi OTP</h1>
          <p className="text-neutral-500">Masukkan kode OTP yang dikirim ke nomor Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="otp" className="block text-sm font-semibold text-neutral-700 mb-2">
              Kode OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="block w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl transition-all duration-200 text-center text-lg tracking-widest font-mono placeholder:text-neutral-400"
              onFocus={(e) => {
                e.target.style.borderColor = THEME_COLOR_LIGHT;
                e.target.style.boxShadow = `0 0 0 2px ${withOpacity(THEME_COLOR, 0.2)}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }}
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-danger-600 bg-danger-50/80 backdrop-blur-sm p-3.5 rounded-xl border border-danger-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div 
              className="flex items-center space-x-2 backdrop-blur-sm p-3.5 rounded-xl"
              style={{
                color: THEME_COLOR_DARK,
                backgroundColor: withOpacity(THEME_COLOR_VERY_LIGHT, 0.8),
                borderColor: withOpacity(THEME_COLOR, 0.3),
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
            {isLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center space-x-2 text-neutral-600 hover:text-neutral-800 transition-colors py-2 rounded-xl hover:bg-neutral-100/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke input nomor</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-500">
            Tidak menerima OTP?{' '}
            <button 
              className="font-semibold transition-colors"
              style={{ color: THEME_COLOR }}
              onMouseEnter={(e) => { e.currentTarget.style.color = THEME_COLOR_DARK; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = THEME_COLOR; }}
            >
              Kirim ulang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberOtpInput;
