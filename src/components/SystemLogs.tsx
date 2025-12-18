import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { 
  RefreshCw, 
  Activity, 
  Shield, 
  UserCheck, 
  Settings, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  X
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { getCachedSystemLogs, setCachedSystemLogs, getCachedUniqueValues, mergeSystemLogs } from '../utils/systemLogsCache';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface SystemLogsProps {
  authSeed: string;
  onStatsChange?: (total: number) => void;
}

export interface SystemLogsRef {
  refresh: () => void;
  toggleFilter: () => void;
  showFilters: boolean;
}

interface AdminActivityLog {
  id: number;
  admin_id: string;
  admin_username: string;
  action_type: string;
  action_description: string;
  target_type?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

interface AdminActivityResponse {
  success: boolean;
  message: string;
  activities?: AdminActivityLog[];
}

interface FilterState {
  searchTerm: string;
  actionType: string;
  adminUser: string;
  dateFrom: string;
  dateTo: string;
  showFilters: boolean;
}

const SystemLogs = forwardRef<SystemLogsRef, SystemLogsProps>(({ authSeed, onStatsChange }, ref) => {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const prevActivitiesRef = useRef<AdminActivityLog[]>([]);
  const lastFiltersRef = useRef<FilterState | null>(null);

  // Pagination state for infinite scroll
  const [logsPage, setLogsPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [isLoadingMoreLogs, setIsLoadingMoreLogs] = useState(false);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const LOGS_PER_PAGE = 20;
  const logsListEndRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    actionType: '',
    adminUser: '',
    dateFrom: '',
    dateTo: '',
    showFilters: false
  });

  const fetchRecentActivities = useCallback(async (background = false, loadMore = false) => {
    if (!background && !loadMore) {
      setError(null);
    }

    if (loadMore) {
      setIsLoadingMoreLogs(true);
    }

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setError('Kunci sesi tidak ditemukan. Silakan login lagi.');
        }
        return;
      }

      const filterParams = {
        searchTerm: filters.searchTerm,
        actionType: filters.actionType,
        adminUser: filters.adminUser,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      const currentPage = loadMore ? logsPage + 1 : 0;
      const offset = currentPage * LOGS_PER_PAGE;

      // Use the filtered endpoint with current filter state
      const apiUrl = await getApiUrl('/admin/activities/filtered');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          search_term: filterParams.searchTerm || null,
          action_type: filterParams.actionType || null,
          admin_user: filterParams.adminUser || null,
          date_from: filterParams.dateFrom || null,
          date_to: filterParams.dateTo || null,
          limit: LOGS_PER_PAGE,
          offset: offset,
        }),
      });

      const data: AdminActivityResponse = await response.json();

      if (data.success && data.activities) {
        const newActivities = data.activities || [];

        // Check if there are more logs to load
        setHasMoreLogs(newActivities.length === LOGS_PER_PAGE);
        setLogsPage(currentPage);

        // Update total count if provided by API
        if ((data as any).total) {
          setTotalLogsCount((data as any).total);
        }

        if (loadMore) {
          // Append new activities to existing list
          setActivities(prev => {
            const merged = mergeSystemLogs(prev, newActivities);
            return merged;
          });
        } else {
          // Initial load or filter change - replace activities
          setActivities(prev => {
            if (prev.length === 0) {
              return newActivities;
            }
            return mergeSystemLogs(prev, newActivities);
          });

          // Update cache for initial load
          const uniqueValues = getCachedUniqueValues();
          setCachedSystemLogs(
            filterParams,
            newActivities,
            uniqueValues?.uniqueActionTypes || [],
            uniqueValues?.uniqueAdminUsers || []
          );
        }
      } else {
        if (!background) {
          setError(data.message || 'Gagal memuat aktivitas admin');
        }
      }
    } catch (err) {
      if (!background) {
        setError('Gagal memuat aktivitas admin dari backend');
      }
    } finally {
      setIsLoadingMoreLogs(false);
    }
  }, [authSeed, filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo, logsPage]);

  useEffect(() => {
    const currentFilters = {
      searchTerm: filters.searchTerm,
      actionType: filters.actionType,
      adminUser: filters.adminUser,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };

    const filtersChanged = 
      !lastFiltersRef.current ||
      lastFiltersRef.current.searchTerm !== currentFilters.searchTerm ||
      lastFiltersRef.current.actionType !== currentFilters.actionType ||
      lastFiltersRef.current.adminUser !== currentFilters.adminUser ||
      lastFiltersRef.current.dateFrom !== currentFilters.dateFrom ||
      lastFiltersRef.current.dateTo !== currentFilters.dateTo;

    if (filtersChanged) {
      lastFiltersRef.current = { ...filters };
      // Reset pagination when filters change
      setLogsPage(0);
      setHasMoreLogs(true);

      const cached = getCachedSystemLogs(currentFilters);
      if (cached) {
        prevActivitiesRef.current = cached;
        setActivities(cached);
      } else {
        setActivities([]);
      }
      fetchRecentActivities(true, false);
    }
  }, [fetchRecentActivities, filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    if (activities.length > 0 && prevActivitiesRef.current !== activities) {
      if (JSON.stringify(prevActivitiesRef.current) !== JSON.stringify(activities)) {
        const currentFilters = {
          searchTerm: filters.searchTerm,
          actionType: filters.actionType,
          adminUser: filters.adminUser,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        };
        const uniqueValues = getCachedUniqueValues();
        setCachedSystemLogs(
          currentFilters,
          activities,
          uniqueValues?.uniqueActionTypes || [],
          uniqueValues?.uniqueAdminUsers || []
        );
        prevActivitiesRef.current = activities;
      }
    }
  }, [activities, filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo]);

  // Infinite scroll for logs using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreLogs && !isLoadingMoreLogs) {
          fetchRecentActivities(true, true);
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    if (logsListEndRef.current) {
      observer.observe(logsListEndRef.current);
    }

    return () => {
      if (logsListEndRef.current) {
        observer.unobserve(logsListEndRef.current);
      }
    };
  }, [hasMoreLogs, isLoadingMoreLogs, fetchRecentActivities]);

  // Notify parent when activities change
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(activities.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.length]);

  const refreshData = () => {
    fetchRecentActivities(false);
  };

  const toggleFilterHandler = () => {
    setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }));
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshData,
    toggleFilter: toggleFilterHandler,
    showFilters: filters.showFilters,
  }));

  const applyFilters = () => {
    lastFiltersRef.current = null;
    fetchRecentActivities(false);
  };

  // Since we're doing server-side filtering and pagination, activities are already filtered
  const filteredActivities = activities;

  // Get unique values for filter dropdowns - fetch from unfiltered data
  const [uniqueActionTypes, setUniqueActionTypes] = useState<string[]>([]);
  const [uniqueAdminUsers, setUniqueAdminUsers] = useState<string[]>([]);

  const fetchUniqueValues = useCallback(async () => {
    try {
      const cached = getCachedUniqueValues();
      if (cached) {
        setUniqueActionTypes(cached.uniqueActionTypes);
        setUniqueAdminUsers(cached.uniqueAdminUsers);
      }

      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) return;

      // Fetch unfiltered data to get unique values for dropdowns
      const apiUrl = await getApiUrl('/admin/activities');
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

      const data: AdminActivityResponse = await response.json();
      if (data.success && data.activities) {
        const types = [...new Set(data.activities.map(a => a.action_type))].sort();
        const users = [...new Set(data.activities.map(a => a.admin_username))].sort();
        setUniqueActionTypes(types);
        setUniqueAdminUsers(users);

        // Update cache
        localStorage.setItem('systemLogsUniqueValuesCache', JSON.stringify({
          uniqueActionTypes: types,
          uniqueAdminUsers: users,
          timestamp: Date.now(),
        }));
      }
    } catch (err) {
    }
  }, [authSeed]);

  useEffect(() => {
    fetchUniqueValues();
  }, [fetchUniqueValues]);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      actionType: '',
      adminUser: '',
      dateFrom: '',
      dateTo: '',
      showFilters: false
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.actionType || filters.adminUser || filters.dateFrom || filters.dateTo;

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'login':
        return <UserCheck className="h-4 w-4 text-primary-600" />;
      case 'verification':
        return <Shield className="h-4 w-4 text-success-600" />;
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'unsafe':
        return <AlertTriangle className="h-4 w-4 text-danger-600" />;
      case 'config':
        return <Settings className="h-4 w-4 text-purple-600" />;
      case 'admin':
        return <Users className="h-4 w-4 text-primary-600" />;
      case 'transaction':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    // Parse the UTC timestamp - JavaScript Date automatically converts to local time
    const date = new Date(timestamp);
    const now = new Date();

    // Calculate difference in minutes
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;

    // For older dates, show the local time in Indonesian format
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-danger-600 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Gagal Memuat Log</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Panel - Compact */}
      {filters.showFilters && (
        <div className="bg-white/80 backdrop-blur-sm p-4 border border-neutral-100/80 rounded-xl shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-800">Filter</h3>
            <button
              onClick={() => updateFilter('showFilters', false)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Pencarian</label>
              <input
                type="text"
                placeholder="Cari..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Tipe</label>
              <select
                value={filters.actionType}
                onChange={(e) => updateFilter('actionType', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
              >
                <option value="">Semua</option>
                {uniqueActionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Admin</label>
              <select
                value={filters.adminUser}
                onChange={(e) => updateFilter('adminUser', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
              >
                <option value="">Semua</option>
                {uniqueAdminUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Dari</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Sampai</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Hapus Filter
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => updateFilter('showFilters', false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-1.5 text-xs bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-sm"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Statistics - Compact */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 p-3 border border-neutral-100/80 rounded-xl text-center shadow-sm">
          <p className="text-xs font-medium text-neutral-500">Total</p>
          <p className="text-xl font-bold text-neutral-800">{filteredActivities.length}</p>
        </div>
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 border border-primary-100/80 rounded-xl text-center shadow-sm">
          <p className="text-xs font-medium text-primary-600">Login</p>
          <p className="text-xl font-bold text-primary-700">
            {filteredActivities.filter(a => a.action_type.toLowerCase() === 'login').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 border border-purple-100/80 rounded-xl text-center shadow-sm">
          <p className="text-xs font-medium text-purple-600">Config</p>
          <p className="text-xl font-bold text-purple-700">
            {filteredActivities.filter(a => a.action_type.toLowerCase() === 'config').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-success-50 to-success-100/50 p-3 border border-success-100/80 rounded-xl text-center shadow-sm">
          <p className="text-xs font-medium text-success-600">Verify</p>
          <p className="text-xl font-bold text-success-700">
            {filteredActivities.filter(a => a.action_type.toLowerCase() === 'verification').length}
          </p>
        </div>
      </div>

      {/* Activity Logs - Compact */}
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-100/80 rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-neutral-50/50 to-white">
          <h3 className="text-sm font-semibold text-neutral-800">Log Aktivitas</h3>
          {hasActiveFilters && (
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">{filteredActivities.length} log</span>
          )}
        </div>
        <div className="divide-y divide-neutral-100">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-sm text-neutral-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              {hasActiveFilters ? 'Tidak ada log yang sesuai' : 'Tidak ada log'}
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="px-4 py-3 hover:bg-primary-50/30 transition-colors duration-150">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 p-1.5 bg-neutral-100 rounded-lg">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-neutral-800 flex-1">
                        {activity.action_description}
                      </p>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-500">
                      <span className="font-medium">{activity.admin_username}</span>
                      {activity.target_type && (
                        <span className="bg-neutral-100 px-1.5 py-0.5 rounded">{activity.target_type}: {activity.target_id || 'N/A'}</span>
                      )}
                      {activity.ip_address && (
                        <span className="text-neutral-400">{activity.ip_address}</span>
                      )}
                    </div>
                    {activity.details && (
                      <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 bg-neutral-50/50 p-2 rounded-lg">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator for infinite scroll */}
          {isLoadingMoreLogs && (
            <div className="flex justify-center py-4 border-t border-neutral-100">
              <div className="flex items-center space-x-2 text-neutral-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                <span className="text-xs">Memuat lebih banyak...</span>
              </div>
            </div>
          )}

          {/* Sentinel element for IntersectionObserver */}
          {hasMoreLogs && !isLoadingMoreLogs && filteredActivities.length > 0 && (
            <div ref={logsListEndRef} className="h-4" />
          )}

          {/* End of list indicator */}
          {!hasMoreLogs && filteredActivities.length >= LOGS_PER_PAGE && (
            <div className="text-center py-3 text-xs text-neutral-400 border-t border-neutral-100">
              Tidak ada log lagi
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SystemLogs.displayName = 'SystemLogs';

export default SystemLogs;
