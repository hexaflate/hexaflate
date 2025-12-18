import React, { useState, useEffect } from 'react';
import { Users, Search, User } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import {
  THEME_COLOR,
  THEME_COLOR_DARK,
  withOpacity,
} from '../utils/themeColors';

interface DownlineViewProps {
  authSeed: string;
}

interface Downline {
  kode: string;
  nama: string;
  email?: string;
  alamat?: string;
  saldo?: number;
  tgl_daftar?: string;
  status?: number;
}

const DownlineView: React.FC<DownlineViewProps> = ({ authSeed }) => {
  const [downlines, setDownlines] = useState<Downline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDownlines();
  }, [authSeed]);

  const fetchDownlines = async () => {
    try {
      setIsLoading(true);
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setError('Session tidak valid');
        return;
      }

      const apiUrl = await getApiUrl('/listDownline');
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
        if (Array.isArray(data)) {
          setDownlines(data);
        } else if (data.success && data.downlines) {
          setDownlines(data.downlines);
        } else if (data.downlines) {
          setDownlines(data.downlines);
        } else {
          setDownlines([]);
        }
      } else {
        setError('Gagal memuat daftar downline');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDownlines = downlines.filter(downline => {
    const matchesSearch = !searchTerm || 
      downline.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      downline.kode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      downline.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Summary Card */}
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
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium" style={{ color: THEME_COLOR }}>Total Downline</p>
            <p className="text-2xl font-bold text-neutral-800">{downlines.length}</p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card p-6 border border-neutral-100/80">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Cari downline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-success-500/20 focus:border-success-400 transition-all duration-200 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* Downline List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card overflow-hidden border border-neutral-100/80">
        <div className="px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50/50 to-white">
          <h3 className="text-lg font-semibold text-neutral-800">
            Daftar Downline ({filteredDownlines.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: THEME_COLOR }}></div>
              <p className="mt-4 text-gray-600">Memuat daftar downline...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
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
          </div>
        ) : filteredDownlines.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada downline</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Tidak ada downline yang sesuai dengan pencarian.'
                : 'Belum ada downline untuk ditampilkan.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDownlines.map((downline, index) => (
              <div key={downline.kode || index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: withOpacity(THEME_COLOR, 0.15) }}
                  >
                    <User className="w-5 h-5" style={{ color: THEME_COLOR }} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{downline.nama || '-'}</h4>
                    <p className="text-sm text-gray-500">Kode: {downline.kode}</p>
                    {downline.email && (
                      <p className="text-sm text-gray-500">{downline.email}</p>
                    )}
                  </div>
                  {downline.saldo !== undefined && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Saldo</p>
                      <p className="text-lg font-semibold text-success-600">
                        Rp {downline.saldo.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownlineView;
