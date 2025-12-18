import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import {
  THEME_COLOR,
  THEME_COLOR_DARK,
  withOpacity,
} from '../utils/themeColors';

interface KomisiViewProps {
  authSeed: string;
}

interface KomisiInfo {
  komisi: number;
  min_tukar?: number;
  total_komisi_bulan_ini?: number;
}

interface TotalSpent {
  total: number;
  count?: number;
}

const KomisiView: React.FC<KomisiViewProps> = ({ authSeed }) => {
  const [komisiInfo, setKomisiInfo] = useState<KomisiInfo | null>(null);
  const [totalSpent, setTotalSpent] = useState<TotalSpent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKomisiInfo();
    fetchTotalSpent();
  }, [authSeed]);

  const fetchKomisiInfo = async () => {
    try {
      setIsLoading(true);
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setError('Session tidak valid');
        return;
      }

      const apiUrl = await getApiUrl('/komisi');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.komisi_info) {
          setKomisiInfo(data.komisi_info);
        } else if (data.komisi !== undefined) {
          setKomisiInfo(data);
        } else {
          setKomisiInfo({ komisi: 0 });
        }
      } else {
        setError('Gagal memuat informasi komisi');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalSpent = async () => {
    try {
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) return;

      const apiUrl = await getApiUrl('/totalspent');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.total_spent !== undefined) {
          setTotalSpent({ total: data.total_spent, count: data.count });
        } else if (data.total !== undefined) {
          setTotalSpent(data);
        } else if (typeof data === 'number') {
          setTotalSpent({ total: data });
        }
      }
    } catch (error) {
    }
  };

  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Komisi Balance */}
        <div className="bg-gradient-to-br from-success-50 to-success-100/50 rounded-xl shadow-card p-6 border border-success-100/80">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-sm">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-success-600">Saldo Komisi</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoading ? '...' : `Rp ${(komisiInfo?.komisi || 0).toLocaleString('id-ID')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Total Spent Today */}
        <div 
          className="rounded-xl shadow-card p-6"
          style={{ 
            background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.05)}, ${withOpacity(THEME_COLOR, 0.1)})`,
            borderColor: withOpacity(THEME_COLOR, 0.2),
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <div className="flex items-center">
            <div 
              className="p-3 rounded-xl shadow-sm"
              style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})` }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: THEME_COLOR }}>Total Transaksi Hari Ini</p>
              <p className="text-2xl font-bold text-neutral-800">
                {totalSpent ? `Rp ${totalSpent.total.toLocaleString('id-ID')}` : 'Rp 0'}
              </p>
              {totalSpent?.count !== undefined && (
                <p className="text-xs mt-1" style={{ color: THEME_COLOR }}>{totalSpent.count} transaksi</p>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Commission */}
        {komisiInfo?.total_komisi_bulan_ini !== undefined && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl shadow-card p-6 border border-purple-100/80">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Komisi Bulan Ini</p>
                <p className="text-2xl font-bold text-neutral-800">
                  Rp {komisiInfo.total_komisi_bulan_ini.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
                <span className="text-danger-600 text-sm font-medium">!</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800">Error</h3>
              <p className="text-sm text-danger-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Summary Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card p-6 border border-neutral-100/80">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-neutral-100 rounded-lg">
            <Calendar className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-neutral-800">Ringkasan Hari Ini</h3>
            <p className="text-sm text-neutral-500">{today}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50/50 rounded-lg">
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Saldo Komisi Tersedia
              </label>
              <p className="mt-1 text-lg font-medium text-success-600">
                Rp {(komisiInfo?.komisi || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-4 bg-neutral-50/50 rounded-lg">
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Total Pengeluaran Hari Ini
              </label>
              <p className="mt-1 text-lg font-medium" style={{ color: THEME_COLOR }}>
                Rp {(totalSpent?.total || 0).toLocaleString('id-ID')}
              </p>
            </div>
            {komisiInfo?.min_tukar !== undefined && (
              <div className="p-4 bg-neutral-50/50 rounded-lg md:col-span-2">
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Minimum Tukar Komisi
                </label>
                <p className="mt-1 text-lg font-medium text-neutral-800">
                  Rp {komisiInfo.min_tukar.toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KomisiView;
