import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  User, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { useToast } from './Toast';
import { getCachedFeedback, setCachedFeedback, mergeFeedback, removeCachedFeedbackItem } from '../utils/feedbackCache';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface FeedbackItem {
  id: number;
  user_id: string;
  name: string;
  feedback: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface FeedbackListResponse {
  success: boolean;
  message: string;
  feedback: FeedbackItem[];
  total: number;
}

interface DeleteFeedbackResponse {
  success: boolean;
  message: string;
}

interface FeedbackViewerProps {
  authSeed: string;
  onNavigate: (section: string) => void;
  onStatsChange?: (total: number) => void;
}

export interface FeedbackViewerRef {
  refresh: () => void;
  toggleTechnicalDetails: () => void;
  showTechnicalDetails: boolean;
}

const FeedbackViewer = forwardRef<FeedbackViewerRef, FeedbackViewerProps>(({ authSeed, onStatsChange }, ref) => {
    const { showToast } = useToast();
const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const itemsPerPage = 10;
  const prevFeedbackRef = useRef<FeedbackItem[]>([]);
  const lastFiltersRef = useRef<{ page: number; searchTerm: string } | null>(null);

  const loadFeedback = useCallback(async (page: number = 1, search: string = '', background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        if (!background) {
          showToast('No admin session found', 'error');
        }
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search })
      });

      const apiUrl = await getApiUrl(`/admin/feedback?${params}`);
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
        const data: FeedbackListResponse = await response.json();
        if (data.success) {
          setFeedback(prev => {
            if (prev.length === 0) {
              return data.feedback;
            }
            return mergeFeedback(prev, data.feedback);
          });
          setTotalCount(data.total);
          setCurrentPage(page);
          setCachedFeedback({ page, searchTerm: search }, data.feedback, data.total);
        } else {
          if (!background) {
            showToast(data.message || 'Failed to load feedback', 'error');
          }
        }
      } else {
        if (!background) {
          showToast('Failed to load feedback', 'error');
        }
      }
    } catch (error) {
      if (!background) {
        showToast('Error loading feedback', 'error');
      }
    }
  }, [authSeed, itemsPerPage]);

  useEffect(() => {
    const filters = { page: currentPage, searchTerm };
    const filtersChanged = 
      !lastFiltersRef.current ||
      lastFiltersRef.current.page !== currentPage || 
      lastFiltersRef.current.searchTerm !== searchTerm;

    if (filtersChanged) {
      lastFiltersRef.current = filters;
      const cached = getCachedFeedback(filters);
      if (cached) {
        prevFeedbackRef.current = cached.feedback;
        setFeedback(cached.feedback);
        setTotalCount(cached.total);
      } else {
        setFeedback([]);
        setTotalCount(0);
      }
      loadFeedback(currentPage, searchTerm, true);
    }
  }, [loadFeedback, currentPage, searchTerm]);

  useEffect(() => {
    if (feedback.length > 0 && prevFeedbackRef.current !== feedback) {
      if (JSON.stringify(prevFeedbackRef.current) !== JSON.stringify(feedback)) {
        const filters = { page: currentPage, searchTerm };
        setCachedFeedback(filters, feedback, totalCount);
        prevFeedbackRef.current = feedback;
      }
    }
  }, [feedback, currentPage, searchTerm, totalCount]);

  // Notify parent when totalCount changes
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(totalCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);

  const refreshData = () => {
    loadFeedback(currentPage, searchTerm, false);
  };

  const toggleTechnicalDetailsHandler = () => {
    setShowTechnicalDetails(!showTechnicalDetails);
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshData,
    toggleTechnicalDetails: toggleTechnicalDetailsHandler,
    showTechnicalDetails,
  }));

  const deleteFeedback = async (id: number) => {
    try {
      setDeleting(id);
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/feedback/delete');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        const data: DeleteFeedbackResponse = await response.json();
        if (data.success) {
          showToast('Feedback deleted successfully', 'success');
          // Remove from state and cache
          setFeedback(prev => {
            const updated = prev.filter(f => f.id !== id);
            removeCachedFeedbackItem(id, { page: currentPage, searchTerm });
            return updated;
          });
          setTotalCount(prev => prev - 1);
        } else {
          showToast(data.message || 'Failed to delete feedback', 'error');
        }
      } else {
        showToast('Failed to delete feedback', 'error');
      }
    } catch (error) {
      showToast('Error deleting feedback', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-neutral-50/50 to-white">
      {/* Search and Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-100/80 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan user ID, nama, atau feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 w-80 transition-all duration-200 placeholder:text-neutral-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 text-sm bg-gradient-to-r from-neutral-600 to-neutral-700 text-white rounded-xl hover:from-neutral-700 hover:to-neutral-800 transition-all duration-200 font-medium shadow-sm"
            >
              Cari
            </button>
          </div>
          <div className="text-sm text-neutral-600">
            Total: <span className="font-semibold text-neutral-800">{totalCount}</span> feedback
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-neutral-100/50 rounded-2xl inline-block mb-4">
              <MessageSquare className="h-12 w-12 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Tidak ada feedback</h3>
            <p className="text-neutral-500">
              {searchTerm ? 'Tidak ada feedback yang sesuai dengan pencarian Anda.' : 'Belum ada feedback dari pengguna.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-neutral-100 rounded-lg">
                            <User className="h-3.5 w-3.5 text-neutral-500" />
                          </div>
                          <span className="text-sm font-semibold text-neutral-800">{item.name}</span>
                          <span className="text-xs text-neutral-500">({item.user_id})</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 mb-3">
                        {expandedItems.has(item.id) ? (
                          <div className="whitespace-pre-wrap">{item.feedback}</div>
                        ) : (
                          <div className="line-clamp-3">
                            {item.feedback.length > 200 
                              ? `${item.feedback.substring(0, 200)}...` 
                              : item.feedback
                            }
                          </div>
                        )}
                      </div>

                      {item.feedback.length > 200 && (
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {expandedItems.has(item.id) ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
                        </button>
                      )}

                      {showTechnicalDetails && (item.ip_address || item.user_agent) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 space-y-1">
                            {item.ip_address && (
                              <div><strong>IP:</strong> {item.ip_address}</div>
                            )}
                            {item.user_agent && (
                              <div><strong>User Agent:</strong> {item.user_agent}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => deleteFeedback(item.id)}
                        disabled={deleting === item.id}
                        className="p-2 text-danger-600 hover:text-danger-800 hover:bg-danger-50 rounded-md transition-colors disabled:opacity-50"
                        title="Hapus feedback"
                      >
                        {deleting === item.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

FeedbackViewer.displayName = 'FeedbackViewer';

export default FeedbackViewer;
