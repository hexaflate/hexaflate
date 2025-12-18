import React, { useState, useEffect } from 'react';
import { Star, Gift, ArrowRight } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface PoinViewProps {
  authSeed: string;
}

interface PoinInfo {
  poin: number;
  nilai_tukar?: number;
  min_tukar?: number;
}

interface Hadiah {
  id: number;
  nama: string;
  poin: number;
  kategori?: string;
  deskripsi?: string;
  image_url?: string;
  status?: string;
}

const PoinView: React.FC<PoinViewProps> = ({ authSeed }) => {
  const [poinInfo, setPoinInfo] = useState<PoinInfo | null>(null);
  const [hadiahList, setHadiahList] = useState<Hadiah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPoinInfo();
    fetchHadiahList();
  }, [authSeed]);

  const fetchPoinInfo = async () => {
    try {
      setIsLoading(true);
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setError('Session tidak valid');
        return;
      }

      const apiUrl = await getApiUrl('/poinid');
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
        if (data.success && data.poin_info) {
          setPoinInfo(data.poin_info);
        } else if (data.poin !== undefined) {
          setPoinInfo(data);
        } else {
          setPoinInfo({ poin: 0 });
        }
      } else {
        setError('Gagal memuat informasi poin');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHadiahList = async () => {
    try {
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) return;

      const apiUrl = await getApiUrl('/list_hadiah');
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
          setHadiahList(data);
        } else if (data.success && data.hadiah) {
          setHadiahList(data.hadiah);
        } else if (data.hadiah) {
          setHadiahList(data.hadiah);
        }
      }
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      {/* Poin Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl shadow-card p-6 border border-yellow-100/80">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-sm">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Total Poin</p>
              <p className="text-2xl font-bold text-neutral-800">
                {isLoading ? '...' : (poinInfo?.poin?.toLocaleString('id-ID') || '0')}
              </p>
            </div>
          </div>
        </div>

        {poinInfo?.nilai_tukar !== undefined && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl shadow-card p-6 border border-orange-100/80">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Nilai Tukar</p>
                <p className="text-2xl font-bold text-neutral-800">
                  Rp {poinInfo.nilai_tukar.toLocaleString('id-ID')} / poin
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

      {/* Hadiah List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card overflow-hidden border border-neutral-100/80">
        <div className="px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50/50 to-white">
          <h3 className="text-lg font-semibold text-neutral-800">
            Katalog Hadiah ({hadiahList.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat katalog hadiah...</p>
            </div>
          </div>
        ) : hadiahList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hadiah</h3>
            <p className="text-gray-500">Belum ada katalog hadiah untuk ditampilkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {hadiahList.map((hadiah) => (
              <div 
                key={hadiah.id} 
                className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{hadiah.nama}</h4>
                  </div>
                </div>
                {hadiah.deskripsi && (
                  <p className="text-xs text-gray-500 mb-3">{hadiah.deskripsi}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-yellow-600">
                    {hadiah.poin?.toLocaleString('id-ID') || '0'} Poin
                  </span>
                  {hadiah.kategori && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {hadiah.kategori}
                    </span>
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

export default PoinView;
