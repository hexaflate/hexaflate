import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Package } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { getCachedAnalytics, setCachedAnalytics, mergeTrendsData, mergeProductTrendsData } from '../utils/analyticsCache';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface AnalyticsDashboardProps {
  authSeed: string;
}

export interface AnalyticsDashboardRef {
  refresh: () => void;
}

interface DailyTransactionData {
  date: string;
  total_transactions: number;
  success_count: number;
  failed_count: number;
}

interface TransactionTrends {
  total_7_days: number;
  success_rate: number;
  failure_rate: number;
  avg_daily_transactions: number;
  daily_data: DailyTransactionData[];
}

interface ProductData {
  kode_produk: string;
  nama_produk: string;
  total_transactions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
}

interface ProductTrends {
  total_products: number;
  top_products: ProductData[];
  product_categories: ProductCategoryData[];
}

interface ProductCategoryData {
  category: string;
  total_transactions: number;
  percentage: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1'];

const AnalyticsDashboard = forwardRef<AnalyticsDashboardRef, AnalyticsDashboardProps>(({ authSeed }, ref) => {
  const [trendsData, setTrendsData] = useState<TransactionTrends | null>(null);
  const [productTrendsData, setProductTrendsData] = useState<ProductTrends | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAnalyticsData = async (background = false) => {
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

      const apiUrl = await getApiUrl('/admin/transactions/trends');
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
        // Merge/update trends data without rebuilding components
        setTrendsData(prev => {
          const merged = mergeTrendsData(prev, data.analytics);

          // Update cache with merged data
          const cached = getCachedAnalytics();
          const currentProductTrends = cached?.productTrendsData || null;
          setCachedAnalytics(merged, currentProductTrends);

          return merged;
        });
      } else {
        if (!background) {
          setError(data.message || 'Gagal memuat data analitik');
        }
      }
    } catch (err) {
      if (!background) {
        setError('Gagal memuat data analitik dari backend');
      }
    }
  };

  const fetchProductAnalyticsData = async (_background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions/product-trends');
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
        // Validate and transform data
        const validatedData = {
          ...data.analytics,
          top_products: data.analytics.top_products.map((product: any) => ({
            ...product,
            total_transactions: Number(product.total_transactions) || 0,
            success_count: Number(product.success_count) || 0,
            failed_count: Number(product.failed_count) || 0,
            success_rate: Number(product.success_rate) || 0,
          }))
        };

        // Merge/update product trends data without rebuilding components
        setProductTrendsData(prev => {
          const merged = mergeProductTrendsData(prev, validatedData);

          // Update cache with merged data
          const cached = getCachedAnalytics();
          const currentTrends = cached?.trendsData || null;
          setCachedAnalytics(currentTrends, merged);

          return merged;
        });
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    // Load from cache immediately on mount
    const cached = getCachedAnalytics();
    if (cached) {
      setTrendsData(cached.trendsData);
      setProductTrendsData(cached.productTrendsData);
    }

    // Fetch fresh data in background
    fetchAnalyticsData(true);
    fetchProductAnalyticsData(true);
  }, []);

  useEffect(() => {
    // Fetch fresh data when refresh is triggered
    if (refreshKey > 0) {
      fetchAnalyticsData(false);
      fetchProductAnalyticsData(false);
    }
  }, [refreshKey]);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshData,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-xl border border-neutral-100/80">
          <div className="w-16 h-16 bg-gradient-to-br from-danger-100 to-danger-200/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Activity className="h-8 w-8 text-danger-500" />
          </div>
          <p className="text-lg font-semibold text-neutral-700 mb-2">Gagal Memuat Data</p>
          <p className="text-neutral-500 mb-6">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!trendsData) {
    return (
      <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-xl border border-neutral-100/80">
        <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Activity className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium">Tidak ada data analitik yang tersedia</p>
      </div>
    );
  }

  // Prepare data for charts
  const chartData = trendsData.daily_data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  const pieData = [
    { name: 'Sukses', value: trendsData.daily_data.reduce((sum, item) => sum + item.success_count, 0), color: '#10B981' },
    { name: 'Gagal', value: trendsData.daily_data.reduce((sum, item) => sum + item.failed_count, 0), color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200/50 rounded-xl shadow-sm">
              <Activity className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Total Transaksi</p>
              <p className="text-2xl font-bold text-neutral-800">{trendsData.total_7_days.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-success-100 to-success-200/50 rounded-xl shadow-sm">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Tingkat Sukses</p>
              <p className="text-2xl font-bold text-success-600">{trendsData.success_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80 hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-danger-100 to-danger-200/50 rounded-xl shadow-sm">
              <TrendingDown className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Tingkat Kegagalan</p>
              <p className="text-2xl font-bold text-danger-600">{trendsData.failure_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-primary-100 rounded-lg">
              <Activity className="h-4 w-4 text-primary-600" />
            </div>
            Volume Transaksi Harian
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  value.toLocaleString(), 
                  name === 'total_transactions' ? 'Total Transaksi' : 
                  name === 'success_count' ? 'Sukses' : 
                  name === 'failed_count' ? 'Gagal' : name
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_transactions" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Total Transaksi"
              />
              <Line 
                type="monotone" 
                dataKey="success_count" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Sukses"
              />
              <Line 
                type="monotone" 
                dataKey="failed_count" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Gagal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-success-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-success-600" />
            </div>
            Distribusi Status Transaksi
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Jumlah']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Trends Charts */}
      {productTrendsData && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200/50 rounded-xl shadow-sm">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-800">Analitik Tren Produk</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Bar Chart */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80">
              <h4 className="text-lg font-semibold text-neutral-800 mb-4">Top 10 Produk Berdasarkan Volume Transaksi</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={productTrendsData.top_products.slice(0, 10)} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nama_produk" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      value.toLocaleString(), 
                      name === 'total_transactions' ? 'Total Transaksi' : 
                      name === 'success_count' ? 'Sukses' : 
                      name === 'failed_count' ? 'Gagal' : name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="total_transactions" fill="#3B82F6" name="Total Transaksi" />
                  <Bar dataKey="success_count" fill="#10B981" name="Sukses" />
                  <Bar dataKey="failed_count" fill="#EF4444" name="Gagal" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product Success Rate Pie Chart */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80">
              <h4 className="text-lg font-semibold text-neutral-800 mb-4">Distribusi Produk Berdasarkan Volume Transaksi</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productTrendsData.top_products.slice(0, 8).map((product, index) => ({
                      name: product.nama_produk.length > 20 
                        ? product.nama_produk.substring(0, 20) + '...' 
                        : product.nama_produk,
                      value: product.total_transactions,
                      color: COLORS[index % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productTrendsData.top_products.slice(0, 8).map((_product, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Jumlah Transaksi']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
            <h4 className="text-lg font-semibold text-neutral-800 mb-4">Performa Produk Detail</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Transaksi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sukses</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Gagal</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tingkat Sukses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100/80">
                  {productTrendsData.top_products.map((product, index) => (
                    <tr key={index} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">
                        {product.nama_produk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 font-medium">
                        {product.total_transactions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-semibold">
                        {product.success_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-danger-600 font-semibold">
                        {product.failed_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-primary-50 to-primary-100/80 text-primary-700 border border-primary-200/50">
                          {product.success_rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Data Table */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Data Detail Harian</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sukses</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Gagal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/80">
              {trendsData.daily_data.map((item, index) => (
                <tr key={index} className="hover:bg-primary-50/30 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 font-medium">
                    {item.total_transactions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-semibold">
                    {item.success_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-danger-600 font-semibold">
                    {item.failed_count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

export default AnalyticsDashboard;
