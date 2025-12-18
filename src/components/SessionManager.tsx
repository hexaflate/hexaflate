import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner } from '../styles';
import { Search, Shield, XCircle, Calendar, Smartphone, Hash } from 'lucide-react';
import { useToast } from './Toast';
import { getCachedSessions, setCachedSessions, mergeSessions, appendSessions } from '../utils/sessionCache';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface AdminSessionItem {
  session_key: string;
  id?: string;
  number: string;
  device_model?: string;
  imei?: string;
  safetycheck: number;
  created_at: string;
}

interface SessionListResponse {
  success: boolean;
  message: string;
  total: number;
  sessions: AdminSessionItem[];
  has_more: boolean;
  next_cursor?: string;
}

interface SessionManagerProps {
  authSeed: string;
  onStatsChange?: (total: number, displayed: number) => void;
}

export interface SessionManagerRef {
  refresh: () => void;
}

const SessionManager = forwardRef<SessionManagerRef, SessionManagerProps>(({ authSeed, onStatsChange }, ref) => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [safetyFilter, setSafetyFilter] = useState<'all' | 'safe' | 'unsafe'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [limit] = useState(25);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [togglingSafety, setTogglingSafety] = useState<Set<string>>(new Set());
  const [deletingSessions, setDeletingSessions] = useState<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  const cursorRef = useRef<string | undefined>(undefined);
  const fetchSessionsRef = useRef<((isInitial?: boolean, background?: boolean) => Promise<void>) | null>(null);
  
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const fetchSessions = useCallback(async (isInitial = false, background = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current && background) {
      return;
    }
    isFetchingRef.current = true;
    if (!background && isInitial) {
      setIsLoadingMore(false);
    } else if (!isInitial) {
      setIsLoadingMore(true);
    }
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        }
        return;
      }

      const filters = {
        searchTerm,
        safetyFilter,
        fromDate,
        toDate,
        limit,
      };

      const params = new URLSearchParams({
        limit: String(limit),
      });
      if (searchTerm.trim() !== '') params.set('search', searchTerm);
      if (safetyFilter !== 'all') params.set('safety', safetyFilter === 'safe' ? '1' : '0');
      if (fromDate) params.set('from', `${fromDate} 00:00:00`);
      if (toDate) params.set('to', `${toDate} 23:59:59`);
      if (!isInitial && cursorRef.current) params.set('cursor', cursorRef.current);

      const apiUrl = await getApiUrl(`/admin/sessions?${params.toString()}`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: SessionListResponse = await response.json();
      if (data.success) {
        // Frontend safety: hide incomplete rows if backend config changes
        const sanitized = (data.sessions || []).filter(s => s.id && s.device_model && s.imei);
        
        if (isInitial) {
          // Merge/update sessions without rebuilding components
          setSessions(prev => {
            const merged = mergeSessions(prev, sanitized);
            return merged;
          });
        } else {
          // Append for pagination
          setSessions(prev => {
            const appended = appendSessions(prev, sanitized);
            return appended;
          });
        }
        
        setTotal(data.total || 0);
        setHasMore(data.has_more || false);
        setCursor(data.next_cursor);
        
        // Update cache for initial load
        if (isInitial) {
          setCachedSessions(filters, {
            sessions: sanitized,
            total: data.total || 0,
            hasMore: data.has_more || false,
            nextCursor: data.next_cursor,
          });
        }
      } else {
        if (!background) {
          showToast(data.message || 'Gagal memuat sesi', 'error');
        }
      }
    } catch (e) {
      if (!background) {
        showToast('Gagal memuat sesi', 'error');
      }
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [searchTerm, safetyFilter, fromDate, toDate, limit, authSeed]);

  useEffect(() => {
    fetchSessionsRef.current = fetchSessions;
  }, [fetchSessions]);

  const lastFiltersRef = useRef<string>('');
  const isInitialMountRef = useRef(true);
  const filterEffectMountedRef = useRef(false);

  useEffect(() => {
    // Prevent running if already mounted and filters haven't changed
    const filterKey = `${searchTerm}_${safetyFilter}_${fromDate}_${toDate}_${limit}`;
    
    if (filterEffectMountedRef.current && lastFiltersRef.current === filterKey) {
      return;
    }
    
    filterEffectMountedRef.current = true;
    lastFiltersRef.current = filterKey;
    
    const filters = {
      searchTerm,
      safetyFilter,
      fromDate,
      toDate,
      limit,
    };
    
    // Load from cache immediately
    const cached = getCachedSessions(filters);
    if (cached) {
      // Use functional updates to avoid dependency issues
      setSessions(() => cached.sessions);
      setTotal(() => cached.total);
      setHasMore(() => cached.hasMore);
      setCursor(() => cached.nextCursor);
    } else if (!isInitialMountRef.current) {
      // Only clear state if not initial mount (filters changed)
      setSessions(() => []);
      setTotal(() => 0);
      setHasMore(() => false);
      setCursor(() => undefined);
    }
    
    // Fetch fresh data in background - use a longer delay to ensure state is settled
    const delay = isInitialMountRef.current ? 200 : 500;
    const timer = setTimeout(() => {
      if (!isFetchingRef.current && fetchSessionsRef.current) {
        fetchSessionsRef.current(true, true);
      }
    }, delay);
    
    isInitialMountRef.current = false;
    
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, safetyFilter, fromDate, toDate]);


  // Notify parent when sessions or total changes
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(total, sessions.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, sessions.length]);

  const refreshData = () => {
    setCursor(undefined);
    setSessions([]);
    fetchSessions(true, false);
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshData,
  }));

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchSessions(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID');
    } catch {
      return dateString;
    }
  };

  const toggleSafetyCheck = async (sessionKey: string, currentSafety: number) => {
    setTogglingSafety(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKeyAdmin = localStorage.getItem('adminSessionKey');
      if (!sessionKeyAdmin) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/toggle-safety');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKeyAdmin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          safety_status: currentSafety === 1 ? 0 : 1,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local list without refetch
        setSessions(prev => prev.map(s =>
          (s as any).session_key === sessionKey ? { ...s, safetycheck: currentSafety === 1 ? 0 : 1 } : s
        ));
        showToast('Status keamanan berhasil diperbarui', 'success');
      } else {
        showToast(data.message || 'Gagal memperbarui status', 'error');
      }
    } catch (e) {
      showToast('Gagal memperbarui status', 'error');
    } finally {
      setTogglingSafety(prev => { const n = new Set(prev); n.delete(sessionKey); return n; });
    }
  };

  const deleteSession = async (sessionKey: string) => {
    setDeletingSessions(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKeyAdmin = localStorage.getItem('adminSessionKey');
      if (!sessionKeyAdmin) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/delete-session');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKeyAdmin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ session_key: sessionKey }),
      });

      const data = await response.json();
      if (data.success) {
        setSessions(prev => prev.filter(s => (s as any).session_key !== sessionKey));
        setTotal(t => Math.max(0, t - 1));
        showToast('Sesi berhasil dihapus', 'success');
      } else {
        showToast(data.message || 'Gagal menghapus sesi', 'error');
      }
    } catch (e) {
      showToast('Gagal menghapus sesi', 'error');
    } finally {
      setDeletingSessions(prev => { const n = new Set(prev); n.delete(sessionKey); return n; });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSafetyFilter('all');
    setFromDate('');
    setToDate('');
    setCursor(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-card border border-neutral-100/80">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nomor/ perangkat/ IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm"
            />
          </div>

          <select
            value={safetyFilter}
            onChange={(e) => setSafetyFilter(e.target.value as any)}
            className="px-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm cursor-pointer"
          >
            <option value="all">Semua Keamanan</option>
            <option value="safe">Aman</option>
            <option value="unsafe">Tidak Aman</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm"
            />
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-all duration-200 hover:shadow-sm"
          >
            Hapus Filter
          </button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
        <>
            <div className="overflow-x-auto">
              <div>
                {(() => {
                  // Proportional columns that fill available width without horizontal scroll
                  const columnsTemplate = '1fr 1.2fr 1.8fr 1.2fr 0.8fr 1fr 1fr';
                  return (
                    <>
                      <div
                        className="grid bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b border-neutral-200/80 text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                        style={{ gridTemplateColumns: columnsTemplate }}
                      >
                        <div className="px-3 py-3">ID</div>
                        <div className="px-3 py-3">Nomor</div>
                        <div className="px-3 py-3">Perangkat</div>
                        <div className="px-3 py-3">IMEI</div>
                        <div className="px-3 py-3">Keamanan</div>
                        <div className="px-3 py-3">Dibuat</div>
                        <div className="px-3 py-3">Aksi</div>
                      </div>
                      <div>
                        {sessions.map((s) => (
                          <div
                            key={s.session_key}
                            className="grid items-center border-b border-neutral-100/80 hover:bg-primary-50/30 text-xs transition-colors duration-150"
                            style={{ gridTemplateColumns: columnsTemplate }}
                          >
                            <div className="px-3 py-3 text-neutral-700 min-w-0"><span className="truncate block font-mono">{s.id || '-'}</span></div>
                            <div className="px-3 py-3 text-neutral-700 min-w-0 flex items-center">
                              <Hash className="h-3 w-3 text-primary-400 mr-1.5 flex-shrink-0" />
                              <span className="truncate font-medium">{s.number}</span>
                            </div>
                            <div className="px-3 py-3 text-neutral-700 min-w-0 flex items-center">
                              <Smartphone className="h-3 w-3 text-neutral-400 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{s.device_model || '-'}</span>
                            </div>
                            <div className="px-3 py-3 text-neutral-600 min-w-0"><span className="truncate block font-mono text-[10px]">{s.imei || '-'}</span></div>
                            <div className="px-3 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                s.safetycheck === 1 
                                  ? 'bg-gradient-to-r from-success-50 to-success-100/80 text-success-700 border border-success-200/50' 
                                  : 'bg-gradient-to-r from-danger-50 to-danger-100/80 text-danger-700 border border-danger-200/50'
                              }`}>
                                <Shield className="h-3 w-3 mr-1.5" />
                                {s.safetycheck === 1 ? 'Aman' : 'Tidak Aman'}
                              </span>
                            </div>
                            <div className="px-3 py-3 text-neutral-500 min-w-0"><span className="truncate block">{formatDate(s.created_at)}</span></div>
                            <div className="px-3 py-3 font-medium">
                              <div className="flex flex-col space-y-1.5">
                                <button
                                  onClick={() => toggleSafetyCheck(s.session_key, s.safetycheck)}
                                  disabled={togglingSafety.has(s.session_key)}
                                  className={`text-xs px-2 py-1 rounded-lg w-full transition-all duration-200 font-medium ${
                                    s.safetycheck === 1 
                                      ? 'bg-danger-50 text-danger-600 hover:bg-danger-100 border border-danger-200/50' 
                                      : 'bg-success-50 text-success-600 hover:bg-success-100 border border-success-200/50'
                                  }`}
                                >
                                  {togglingSafety.has(s.session_key) ? (
                                    <Spinner size="sm" color="secondary" />
                                  ) : s.safetycheck === 1 ? (
                                    'Tandai Tidak Aman'
                                  ) : (
                                    'Tandai Aman'
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteSession(s.session_key)}
                                  disabled={deletingSessions.has(s.session_key)}
                                  className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-danger-50 hover:text-danger-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full border border-neutral-200/50"
                                >
                                  {deletingSessions.has(s.session_key) ? (
                                    <Spinner size="sm" color="secondary" />
                                  ) : (
                                    <div className="flex items-center justify-center font-medium"><XCircle className="h-3 w-3 mr-1" /> Keluar</div>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="bg-gradient-to-r from-neutral-50/50 to-neutral-100/50 px-6 py-4 flex items-center justify-center border-t border-neutral-100/80">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="relative inline-flex items-center px-6 py-2.5 border border-neutral-200 text-sm font-semibold rounded-xl text-neutral-700 bg-white/80 backdrop-blur-sm hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-sm disabled:opacity-50 min-w-[180px] justify-center transition-all duration-200"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" color="primary" />
                      <span>Memuat...</span>
                    </div>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </button>
              </div>
            )}
        </>
      </div>
    </div>
  );
});

SessionManager.displayName = 'SessionManager';

export default SessionManager;


