import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface ReferralViewProps {
  authSeed: string;
}

interface Referral {
  kode: string;
  referral: string;
  markup: number;
  created_at?: string;
}

const ReferralView: React.FC<ReferralViewProps> = ({ authSeed }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, [authSeed]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setError('Session tidak valid');
        return;
      }

      const apiUrl = await getApiUrl('/referral');
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
          setReferrals(data);
        } else if (data.success && data.referrals) {
          setReferrals(data.referrals);
        } else if (data.referrals) {
          setReferrals(data.referrals);
        } else {
          setReferrals([]);
        }
      } else {
        setError('Gagal memuat daftar referral');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl shadow-card p-6 border border-purple-100/80">
        <div className="flex items-center">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-purple-600">Total Kode Referral</p>
            <p className="text-2xl font-bold text-neutral-800">{referrals.length}</p>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card overflow-hidden border border-neutral-100/80">
        <div className="px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50/50 to-white">
          <h3 className="text-lg font-semibold text-neutral-800">
            Daftar Kode Referral ({referrals.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat daftar referral...</p>
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
        ) : referrals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada kode referral</h3>
            <p className="text-gray-500">Belum ada kode referral untuk ditampilkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {referrals.map((referral, index) => (
              <div key={referral.referral || index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Share2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{referral.referral}</h4>
                        <p className="text-sm text-gray-500">Markup: Rp {referral.markup?.toLocaleString('id-ID') || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(referral.referral)}
                    className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    {copiedCode === referral.referral ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Salin
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralView;
