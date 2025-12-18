import React, { useState, useEffect } from "react";
import { User, Phone, AlertCircle, Hash, Clock } from "lucide-react";
import MemberOtpInput from "./MemberOtpInput";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  THEME_COLOR_DARKER,
  THEME_COLOR_VERY_LIGHT,
  THEME_COLOR_LIGHT_VERY_LIGHT,
  THEME_COLOR_LIGHT_DARK,
  withOpacity,
} from "../utils/themeColors";

interface MemberLoginProps {
  onLoginSuccess: (authSeed: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  session_key?: string;
  registered: boolean;
}

const MemberLogin: React.FC<MemberLoginProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "[]");

    // Filter attempts within the window
    const recentAttempts = attempts.filter(
      (attempt: number) => now - attempt < ATTEMPT_WINDOW,
    );

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const lockoutEnd = oldestAttempt + LOCKOUT_DURATION;

      if (now < lockoutEnd) {
        setIsRateLimited(true);
        setRemainingTime(lockoutEnd - now);
        return true;
      } else {
        // Lockout period expired, clear old attempts
        localStorage.setItem("loginAttempts", JSON.stringify([]));
      }
    }

    setIsRateLimited(false);
    setRemainingTime(0);
    return false;
  };

  const recordFailedAttempt = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "[]");

    // Add current attempt
    attempts.push(now);

    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      (attempt: number) => now - attempt < ATTEMPT_WINDOW,
    );

    localStorage.setItem("loginAttempts", JSON.stringify(recentAttempts));

    // Check if we should be rate limited
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      setIsRateLimited(true);
      setRemainingTime(LOCKOUT_DURATION);
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem("loginAttempts");
    setIsRateLimited(false);
    setRemainingTime(0);
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if rate limited
    if (isRateLimited) {
      setError(
        `Terlalu banyak percobaan login. Silakan tunggu ${formatTime(remainingTime)} sebelum mencoba lagi.`,
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiUrl = await getApiUrl("/webreport-login");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          id: userId,
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
        setError("Server returned empty response");
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
        setSuccess("OTP berhasil dikirim! Silakan periksa telepon Anda.");
        setSessionKey(data.session_key);
        setShowOtpInput(true);
        // Clear failed attempts on successful login
        clearFailedAttempts();
      } else {
        setError(data.message || "Login failed");
        // Record failed attempt
        recordFailedAttempt();
      }
    } catch (err) {
      setError("Kesalahan jaringan. Silakan periksa koneksi Anda.");
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
    setSessionKey("");
    setError("");
    setSuccess("");
  };

  // Show OTP input if we have a session key
  if (showOtpInput && sessionKey) {
    return (
      <MemberOtpInput
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
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Web Report</h1>
          <p className="text-neutral-500">
            Masuk untuk melihat laporan transaksi Anda
          </p>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-semibold text-neutral-700 mb-2"
            >
              ID Pengguna
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Hash className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl transition-all duration-200 placeholder:text-neutral-400"
                style={{
                  '--tw-ring-color': withOpacity(THEME_COLOR, 0.2),
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.target.style.borderColor = THEME_COLOR_LIGHT;
                  e.target.style.boxShadow = `0 0 0 2px ${withOpacity(THEME_COLOR, 0.2)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                placeholder="Masukkan ID pengguna"
                required
                minLength={3}
                maxLength={20}
                title="Masukkan ID pengguna yang valid"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-semibold text-neutral-700 mb-2"
            >
              Nomor Telepon
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <Phone className="h-5 w-5" style={{ color: THEME_COLOR }} />
              </div>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl transition-all duration-200 placeholder:text-neutral-400"
                onFocus={(e) => {
                  e.target.style.borderColor = THEME_COLOR_LIGHT;
                  e.target.style.boxShadow = `0 0 0 2px ${withOpacity(THEME_COLOR, 0.2)}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
                placeholder="08xxxxxxxxxx"
                required
                pattern="08[0-9]{8,11}"
                title="Masukkan nomor telepon yang valid (08xxxxxxxxxx)"
              />
            </div>
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
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {isRateLimited && (
            <div className="flex items-center space-x-2 text-warning-600 bg-warning-50/80 backdrop-blur-sm p-3.5 rounded-xl border border-warning-100">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                Terlalu banyak percobaan login. Silakan tunggu{" "}
                {formatTime(remainingTime)} sebelum mencoba lagi.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isRateLimited}
            className="w-full text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
            {isLoading
              ? "Mengirim OTP..."
              : isRateLimited
                ? `Tunggu ${formatTime(remainingTime)}`
                : "Kirim OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MemberLogin;
