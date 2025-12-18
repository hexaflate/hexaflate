import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner, Button, Table } from '../styles';
import { getCachedTransactions, setCachedTransactions, mergeTransactions } from '../utils/transactionCache';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface TransactionManagementProps {
  authSeed: string;
  onAnalyticsChange?: (analytics: TransactionAnalytics | null) => void;
}

export interface TransactionManagementRef {
  analytics: TransactionAnalytics | null;
  refresh: () => void;
}

interface Transaction {
  kode: string;
  tgl_entri: string;
  kode_produk: string;
  tujuan: string;
  kode_reseller: string;
  harga: number;
  status: string;
}

interface TransactionAnalytics {
  total_today: number;
  success_count: number;
  process_count: number;
  failed_count: number;
}

const TransactionManagement = forwardRef<TransactionManagementRef, TransactionManagementProps>(({ authSeed, onAnalyticsChange }, ref) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use ref to store callback to avoid infinite loops
  const onAnalyticsChangeRef = useRef(onAnalyticsChange);
  onAnalyticsChangeRef.current = onAnalyticsChange;

  // Expose analytics and refresh function to parent
  useImperativeHandle(ref, () => ({
    analytics,
    refresh: () => {
      setRefreshKey(prev => prev + 1);
    }
  }));

  // Notify parent when analytics change
  useEffect(() => {
    if (onAnalyticsChangeRef.current) {
      onAnalyticsChangeRef.current(analytics);
    }
  }, [analytics]);

  const fetchAnalytics = async (background = false) => {
    if (!background) {
      setIsLoadingAnalytics(true);
    }

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions/analytics');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data = await response.json();

      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
        // Update cache with new analytics
        const cached = getCachedTransactions();
        if (cached) {
          setCachedTransactions(cached.transactions, data.analytics);
        }
      }
    } catch (err) {
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchTransactions = async (background = false) => {
    if (!background) {
      setError(null);
    }

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setError('Kunci sesi tidak ditemukan. Silakan login lagi.');
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data = await response.json();

      if (data.success && data.transactions) {
        // Merge/update transactions without rebuilding components
        setTransactions(prev => {
          const merged = mergeTransactions(prev, data.transactions || []);
          return merged;
        });

        // Update cache
        const cached = getCachedTransactions();
        const currentAnalytics = cached?.analytics || analytics;
        setCachedTransactions(data.transactions, currentAnalytics);
      } else {
        if (!background) {
          setError(data.message || 'Gagal memuat data transaksi');
        }
      }
    } catch (err) {
      if (!background) {
        setError('Gagal memuat data transaksi dari backend');
      }
    }
  };

  useEffect(() => {
    // Load from cache immediately on mount
    const cached = getCachedTransactions();
    if (cached) {
      setTransactions(cached.transactions);
      setAnalytics(cached.analytics);
    }

    // Fetch fresh data in background
    fetchTransactions(true);
    fetchAnalytics(true);
  }, []);

  useEffect(() => {
    // Fetch fresh data when refresh is triggered
    if (refreshKey > 0) {
      fetchTransactions(false);
      fetchAnalytics(false);
    }
  }, [refreshKey]);

  const refreshTransactions = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sukses':
        return 'bg-gradient-to-r from-success-50 to-success-100/80 text-success-700 border border-success-200/50';
      case 'Gagal':
        return 'bg-gradient-to-r from-danger-50 to-danger-100/80 text-danger-700 border border-danger-200/50';
      case 'Dalam Proses':
        return 'bg-gradient-to-r from-warning-50 to-warning-100/80 text-warning-700 border border-warning-200/50';
      default:
        return 'bg-neutral-100 text-neutral-700 border border-neutral-200/50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Prepare table data for the Table component
  const tableColumns = [
    { key: 'kode', label: 'Kode', width: '120px' },
    { key: 'tgl_entri', label: 'Tanggal', width: '180px' },
    { key: 'kode_produk', label: 'Produk', width: '120px' },
    { key: 'tujuan', label: 'Tujuan', width: '150px' },
    { key: 'kode_reseller', label: 'Reseller', width: '120px' },
    { key: 'harga', label: 'Harga', width: '120px', align: 'right' as const },
    { key: 'status', label: 'Status', width: '100px' }
  ];

  const tableData = transactions.map(transaction => ({
    kode: transaction.kode,
    tgl_entri: formatDate(transaction.tgl_entri),
    kode_produk: transaction.kode_produk,
    tujuan: transaction.tujuan,
    kode_reseller: transaction.kode_reseller,
    harga: formatCurrency(transaction.harga),
    status: (
      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${getStatusColor(transaction.status)}`}>
        {transaction.status}
      </span>
    )
  }));

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80">
        <div className="text-center py-12">
          <div className="p-4 bg-danger-50 rounded-2xl inline-block mb-4">
            <FileText className="h-12 w-12 text-danger-500" />
          </div>
          <p className="text-lg font-semibold text-danger-600 mb-2">Gagal Memuat Data</p>
          <p className="text-neutral-600 mb-4">{error}</p>
          <Button
            onClick={refreshTransactions}
            variant="primary"
            size="md"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 p-5 rounded-xl border border-primary-200/50 shadow-sm">
            <div className="text-2xl font-bold text-primary-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.total_today || 0
              )}
            </div>
            <div className="text-sm font-medium text-primary-700 mt-1">Total Transaksi Hari Ini</div>
          </div>
          <div className="bg-gradient-to-br from-success-50 to-success-100/50 p-5 rounded-xl border border-success-200/50 shadow-sm">
            <div className="text-2xl font-bold text-success-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.success_count || 0
              )}
            </div>
            <div className="text-sm font-medium text-success-700 mt-1">Sukses Hari Ini</div>
          </div>
          <div className="bg-gradient-to-br from-warning-50 to-warning-100/50 p-5 rounded-xl border border-warning-200/50 shadow-sm">
            <div className="text-2xl font-bold text-warning-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.process_count || 0
              )}
            </div>
            <div className="text-sm font-medium text-warning-700 mt-1">Dalam Proses Hari Ini</div>
          </div>
          <div className="bg-gradient-to-br from-danger-50 to-danger-100/50 p-5 rounded-xl border border-danger-200/50 shadow-sm">
            <div className="text-2xl font-bold text-danger-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.failed_count || 0
              )}
            </div>
            <div className="text-sm font-medium text-danger-700 mt-1">Gagal Hari Ini</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100/80">
          <h4 className="text-lg font-semibold text-neutral-800">Daftar Transaksi Terbaru</h4>
          <p className="text-sm text-neutral-500">Menampilkan 100 transaksi terbaru</p>
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500">
            <div className="p-4 bg-neutral-100/50 rounded-2xl inline-block mb-3">
              <FileText className="h-12 w-12 text-neutral-400" />
            </div>
            <p className="text-lg font-semibold text-neutral-700">Tidak Ada Transaksi</p>
            <p className="text-sm text-neutral-500">Belum ada data transaksi yang tersedia</p>
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={tableData}
            variant="default"
            emptyMessage="Tidak ada transaksi yang tersedia"
          />
        )}
      </div>
    </div>
  );
});

TransactionManagement.displayName = 'TransactionManagement';

export default TransactionManagement;
