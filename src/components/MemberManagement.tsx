import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  User,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner } from '../styles';
import VerificationImage from './VerificationImage';
import UserAvatar from './UserAvatar';
import { useToast } from './Toast';
import { getCachedMembers, setCachedMembers, updateCachedMembers, mergeMembers } from '../utils/memberCache';
import {
  THEME_COLOR,
  THEME_COLOR_DARK,
  withOpacity,
} from '../utils/themeColors';

interface Member {
  kode: string;
  nama: string;
  saldo: number;
  alamat?: string;
  aktif: boolean;
  kode_upline?: string;
  kode_level?: string;
  tgl_daftar?: string;
  tgl_aktivitas?: string;
  nama_pemilik?: string;
  markup?: number;
  verification: UserVerification[];
}

interface UserSession {
  session_key: string;
  number: string;
  device_model?: string;
  imei?: string;
  safetycheck: number;
  created_at: string;
  last_activity?: string;
}

interface UserVerification {
  id: string;
  type_: string;
  status: string;
  image_url?: string;
}

interface UserReferral {
  id: string;
  referral: string;
  markup: number;
}

interface EnhancedMemberDetail {
  member: Member;
  sessions: UserSession[];
  verification: UserVerification[];
  referrals: UserReferral[];
  is_admin: boolean;
  total_sessions: number;
  active_sessions: number;
}

interface MemberListResponse {
  success: boolean;
  message: string;
  members: Member[];
  total: number;
  limit: number;
  has_more: boolean;
  next_cursor?: string;
}

interface MemberDetailResponse {
  success: boolean;
  message: string;
  member?: Member;
  enhanced_detail?: EnhancedMemberDetail;
}

interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

interface ToggleSafetyResponse {
  success: boolean;
  message: string;
}

interface AddToAdminResponse {
  success: boolean;
  message: string;
}

interface CurrentAdminInfo {
  id: string;
  name: string;
  admin_type: string;
  is_super_admin: boolean;
}

interface MemberManagementProps {
  authSeed: string;
  onStatsChange?: (totalMembers: number, loadedMembers: number) => void;
}

export interface MemberManagementRef {
  totalMembers: number;
  loadedMembers: number;
  refresh: () => void;
}

const MemberManagement = forwardRef<MemberManagementRef, MemberManagementProps>(({ authSeed, onStatsChange }, ref) => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [totalMembers, setTotalMembers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [enhancedMemberDetail, setEnhancedMemberDetail] = useState<EnhancedMemberDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingMemberKode, setLoadingMemberKode] = useState<string | null>(null);
  const [updatingVerification, setUpdatingVerification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'verification' | 'referrals'>('details');
  const [imageOverlay, setImageOverlay] = useState<{ url: string; type: string } | null>(null);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<CurrentAdminInfo | null>(null);

  // New loading states for individual actions
  const [deletingSessions, setDeletingSessions] = useState<Set<string>>(new Set());
  const [togglingSafety, setTogglingSafety] = useState<Set<string>>(new Set());
  const [addingToAdmin, setAddingToAdmin] = useState<string | null>(null);

  const limit = 10;

  const fetchMembers = async (isLoadMore = false, background = false) => {
    if (!background) {
      setIsLoadingMore(isLoadMore);
    }

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const filters = {
        searchTerm,
        statusFilter,
        levelFilter,
        verificationFilter,
      };

      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(levelFilter && { level: levelFilter }),
        ...(verificationFilter !== 'all' && { verification: verificationFilter }),
        ...(nextCursor && nextCursor.trim() !== '' && { cursor: nextCursor }),
      });

      const apiUrl = await getApiUrl(`/members?${params}`);
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: MemberListResponse = await response.json();

      if (data.success) {
        // Update cache
        if (isLoadMore) {
          updateCachedMembers(filters, data.members, data.total, data.has_more, data.next_cursor, true);
        } else {
          setCachedMembers(filters, data);
        }

        // Merge/update members without rebuilding components
        if (isLoadMore) {
          setMembers(prev => {
            const merged = mergeMembers(prev, data.members, true);
            return merged;
          });
        } else {
          setMembers(prev => {
            // Merge existing with new to preserve component state
            const merged = mergeMembers(prev, data.members, false);
            return merged;
          });
        }

        setHasMore(data.has_more);
        setNextCursor(data.next_cursor);
        setTotalMembers(data.total);
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      if (!background) {
        showToast('Gagal memuat member', 'error');
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Expose stats and refresh function to parent
  useImperativeHandle(ref, () => ({
    totalMembers,
    loadedMembers: members.length,
    refresh: () => fetchMembers(false)
  }));

  // Use ref to avoid infinite loop when onStatsChange changes on every render
  const onStatsChangeRef = useRef(onStatsChange);
  onStatsChangeRef.current = onStatsChange;

  // Notify parent when stats change
  useEffect(() => {
    if (onStatsChangeRef.current) {
      onStatsChangeRef.current(totalMembers, members.length);
    }
  }, [totalMembers, members.length]);

  // Handle escape key to close image overlay
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageOverlay) {
        setImageOverlay(null);
      }
    };

    if (imageOverlay) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageOverlay]);

  // Cleanup blob URLs when image overlay is closed
  useEffect(() => {
    return () => {
      if (imageOverlay?.url && imageOverlay.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageOverlay.url);
      }
    };
  }, [imageOverlay]);

  useEffect(() => {
    // Fetch current admin info when component loads
    fetchCurrentAdminInfo();

    // Load from cache immediately on mount
    const filters = {
      searchTerm: '',
      statusFilter: 'all',
      levelFilter: '',
      verificationFilter: 'all',
    };

    const cached = getCachedMembers(filters);
    if (cached && cached.success) {
      setMembers(cached.members);
      setTotalMembers(cached.total);
      setHasMore(cached.has_more);
      setNextCursor(cached.next_cursor);
    }

    // Fetch fresh data in background
    fetchMembers(false, true);
  }, []);

  useEffect(() => {
    // Load from cache immediately
    const filters = {
      searchTerm,
      statusFilter,
      levelFilter,
      verificationFilter,
    };

    const cached = getCachedMembers(filters);
    if (cached && cached.success) {
      setMembers(cached.members);
      setTotalMembers(cached.total);
      setHasMore(cached.has_more);
      setNextCursor(cached.next_cursor);
    } else {
      // Reset cursor when filters change and no cache available
      setNextCursor(undefined);
    }

    // Add a small delay for search term to prevent too many API calls
    const timeoutId = setTimeout(() => {
      // Reset cursor before fetching fresh data
      setNextCursor(undefined);
      fetchMembers(false, true);
    }, searchTerm ? 300 : 0); // 300ms delay only for search term changes

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, levelFilter, verificationFilter]);

  const handleLoadMore = () => {
    fetchMembers(true, false);
  };

  const fetchCurrentAdminInfo = async () => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/current-admin-info');
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: CurrentAdminInfo = await response.json();

      if (response.ok) {
        setCurrentAdminInfo(data);
      } else {
      }
    } catch (error) {
    }
  };

  const fetchMemberDetail = async (kode: string) => {
    setLoadingMemberKode(kode);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl(`/members/enhanced-detail?kode=${kode}`);
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: MemberDetailResponse = await response.json();

      if (data.success && data.enhanced_detail) {
        setSelectedMember(data.enhanced_detail.member);
        setEnhancedMemberDetail(data.enhanced_detail);
        setShowDetailModal(true);
        setActiveTab('details');
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Gagal memuat detail member', 'error');
    } finally {
      setLoadingMemberKode(null);
    }
  };

  const deleteSession = async (sessionKey: string) => {
    setDeletingSessions(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/delete-session');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ session_key: sessionKey }),
      });

      const data: DeleteSessionResponse = await response.json();

      if (data.success) {
        showToast('Sesi berhasil dihapus', 'success');
        // Update only the sessions data instead of refreshing everything
        if (enhancedMemberDetail) {
          const updatedSessions = enhancedMemberDetail.sessions.filter(s => s.session_key !== sessionKey);
          const updatedActiveSessions = updatedSessions.filter(s => s.safetycheck === 1).length;
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            sessions: updatedSessions,
            active_sessions: updatedActiveSessions,
            total_sessions: updatedSessions.length
          });
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Gagal menghapus sesi', 'error');
    } finally {
      setDeletingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionKey);
        return newSet;
      });
    }
  };

  const toggleSafetyCheck = async (sessionKey: string, currentSafety: number) => {
    setTogglingSafety(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/toggle-safety');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ 
          session_key: sessionKey,
          safety_status: currentSafety === 1 ? 0 : 1
        }),
      });

      const data: ToggleSafetyResponse = await response.json();

      if (data.success) {
        showToast('Status keamanan berhasil diperbarui', 'success');
        // Update only the specific session data instead of refreshing everything
        if (enhancedMemberDetail) {
          const updatedSessions = enhancedMemberDetail.sessions.map(s => 
            s.session_key === sessionKey 
              ? { ...s, safetycheck: currentSafety === 1 ? 0 : 1 }
              : s
          );
          const updatedActiveSessions = updatedSessions.filter(s => s.safetycheck === 1).length;
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            sessions: updatedSessions,
            active_sessions: updatedActiveSessions
          });
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Gagal mengubah status keamanan', 'error');
    } finally {
      setTogglingSafety(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionKey);
        return newSet;
      });
    }
  };

  const addToAdmin = async (kode: string) => {
    setAddingToAdmin(kode);
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/add-admin');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ kode }),
      });

      const data: AddToAdminResponse = await response.json();

      if (data.success) {
        showToast('Pengguna berhasil ditambahkan ke admin', 'success');
        // Update only the admin status instead of refreshing everything
        if (enhancedMemberDetail) {
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            is_admin: true
          });
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch (error) {
      showToast('Gagal menambahkan ke admin', 'error');
    } finally {
      setAddingToAdmin(null);
    }
  };

  const updateVerificationStatus = async (id: string, type: string, status: string) => {
    const updateKey = `${id}_${type}`;
    setUpdatingVerification(updateKey);

    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        showToast('Kunci sesi tidak ditemukan. Silakan login lagi.', 'error');
        return;
      }

      const apiUrl = await getApiUrl(`/admin/verify?ID=${encodeURIComponent(id)}&Type=${encodeURIComponent(type)}&Status=${encodeURIComponent(status)}`);
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Status verifikasi berhasil diperbarui ke "${status}"`, 'success');
        // Update only the verification data instead of refreshing everything
        if (enhancedMemberDetail) {
          const updatedVerification = enhancedMemberDetail.verification.map(v => 
            v.id === id && v.type_ === type 
              ? { ...v, status }
              : v
          );
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            verification: updatedVerification
          });
        }
      } else {
        showToast(data.message || 'Gagal memperbarui status verifikasi', 'error');
      }
    } catch (error) {
      showToast('Gagal memperbarui status verifikasi', 'error');
    } finally {
      setUpdatingVerification(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVerificationStatusStyle = (status: string) => {
    switch (status) {
      case 'Terverifikasi':
        return 'bg-success-100 text-success-800';
      case 'Dalam Proses':
        return 'bg-primary-100 text-primary-800';
      case 'Perbaiki Verifikasi':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'Terverifikasi':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Dalam Proses':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'Perbaiki Verifikasi':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-card border border-neutral-100/80">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200 placeholder:text-neutral-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>

          {/* Level Filter */}
          <input
            type="text"
            placeholder="Filter berdasarkan level..."
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200 placeholder:text-neutral-400"
          />

          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200"
          >
            <option value="all">Semua Verifikasi</option>
            <option value="none">Tidak Ada Verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Perbaiki Verifikasi">Perbaiki Verifikasi</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setLevelFilter('');
              setVerificationFilter('all');
              setNextCursor(undefined);
            }}
            className="px-3 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100/80 hover:bg-neutral-200/80 rounded-xl transition-all duration-200"
          >
            Hapus Filter
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
        <div className="overflow-x-auto">
              <table className="w-full table-fixed" style={{ minWidth: '1000px' }}>
                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                  <tr>
                    <th className="w-1/3 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="w-1/8 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="w-1/8 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-1/12 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="w-1/6 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Verifikasi
                    </th>
                    <th className="w-1/8 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Daftar
                    </th>
                    <th className="w-1/12 px-3 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100/80">
                  {members.map((member) => (
                    <tr key={member.kode} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-3 py-3">
                        <div className="flex items-center min-w-0">
                          <UserAvatar userId={member.kode} userName={member.nama} size="sm" className="flex-shrink-0" />
                          <div className="ml-2.5 min-w-0 flex-1">
                            <div className="text-xs font-semibold text-neutral-800 truncate">{member.nama}</div>
                            <div className="text-xs text-neutral-500 truncate">{member.kode}</div>
                            {member.alamat && (
                              <div className="flex items-center text-xs text-neutral-400 truncate">
                                <MapPin className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                                <span className="truncate">{member.alamat}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs font-semibold text-neutral-800 truncate">
                          {formatCurrency(member.saldo)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                          member.aktif
                            ? 'bg-gradient-to-r from-success-50 to-success-100/80 text-success-700 border border-success-200/50'
                            : 'bg-gradient-to-r from-danger-50 to-danger-100/80 text-danger-700 border border-danger-200/50'
                        }`}>
                          {member.aktif ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-neutral-700 truncate">
                        {member.kode_level || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col space-y-1">
                          {member.verification && member.verification.length > 0 ? (
                            member.verification.slice(0, 2).map((verif) => (
                              <span key={verif.id} className={`inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs font-medium ${getVerificationStatusStyle(verif.status)}`}>
                                {getVerificationStatusIcon(verif.status)}
                                <span className="truncate">{verif.type_}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-400">-</span>
                          )}
                          {member.verification && member.verification.length > 2 && (
                            <span className="text-xs text-neutral-400">+{member.verification.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-neutral-500">
                        {formatDate(member.tgl_daftar) || '-'}
                      </td>
                      <td className="px-3 py-3 text-xs font-medium">
                        <div className="flex items-center">
                          <button
                            onClick={() => fetchMemberDetail(member.kode)}
                            disabled={loadingMemberKode === member.kode}
                            className="text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-lg border border-primary-200/80 hover:bg-primary-50 transition-all duration-200 w-full flex items-center justify-center text-xs font-semibold"
                            title="Lihat Detail"
                          >
                            {loadingMemberKode === member.kode ? (
                              <Spinner size="sm" color="primary" />
                            ) : (
                              'Detail'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="bg-white/50 px-4 py-4 flex items-center justify-center border-t border-neutral-100/80">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="relative inline-flex items-center px-5 py-2.5 border border-neutral-200/80 text-sm font-medium rounded-xl text-neutral-700 bg-white/80 hover:bg-neutral-50 disabled:opacity-50 min-w-[140px] justify-center transition-all duration-200"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" color="secondary" />
                      <span>Memuat...</span>
                    </div>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </button>
              </div>
            )}
        </div>

      {/* Enhanced Member Detail Modal */}
      {showDetailModal && selectedMember && enhancedMemberDetail && createPortal(
        <div 
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-[1200px] h-[85vh] max-h-[750px] rounded-3xl overflow-hidden shadow-2xl">
            {/* Glassmorphism background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-neutral-50/95 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5" />
            <div className="absolute inset-0 border border-white/50 rounded-3xl" />

            {/* Content */}
            <div className="relative h-full flex flex-col p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <UserAvatar userId={selectedMember.kode} userName={selectedMember.nama} size="lg" className="shadow-lg shadow-primary-500/25" />
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-800">{selectedMember.nama}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-neutral-500 font-mono bg-neutral-100/80 px-2 py-0.5 rounded-lg">{selectedMember.kode}</span>
                      {enhancedMemberDetail.is_admin && (
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-700 text-xs rounded-full font-semibold border border-purple-200/50 backdrop-blur-sm">
                          Admin
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedMember.aktif
                          ? 'bg-gradient-to-r from-success-500/10 to-success-600/10 text-success-700 border border-success-200/50'
                          : 'bg-gradient-to-r from-danger-500/10 to-danger-600/10 text-danger-700 border border-danger-200/50'
                      }`}>
                        {selectedMember.aktif ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!enhancedMemberDetail.is_admin && currentAdminInfo?.is_super_admin && (
                    <button
                      onClick={() => addToAdmin(selectedMember.kode)}
                      disabled={addingToAdmin === selectedMember.kode}
                      className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 font-semibold"
                    >
                      {addingToAdmin === selectedMember.kode ? (
                        <div className="flex items-center gap-2">
                          <Spinner size="sm" color="white" />
                          <span>Menambahkan...</span>
                        </div>
                      ) : (
                        'Tambah ke Admin'
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2.5 text-neutral-400 hover:text-neutral-600 bg-white/60 hover:bg-white/90 rounded-xl border border-neutral-200/50 transition-all duration-200 backdrop-blur-sm"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              {(() => {
                const visibleSessionsCount = enhancedMemberDetail.sessions.filter(s => s.imei && s.device_model).length;
                return (
              <div className="mb-6">
                <div className="inline-flex bg-neutral-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-neutral-200/50">
                  {[
                    { id: 'details', label: 'Detail', icon: User },
                    { id: 'sessions', label: `Sesi (${visibleSessionsCount})`, icon: Clock },
                    { id: 'verification', label: 'Verifikasi', icon: CheckCircle },
                    { id: 'referrals', label: 'Referral', icon: User }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-white text-primary-700 shadow-md border border-neutral-100/80'
                          : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
                );
              })()}

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Info Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg shadow-neutral-200/20">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-100/80">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200/50 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-neutral-800">Informasi Pribadi</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-neutral-100/50">
                        <span className="text-sm text-neutral-500">Nama</span>
                        <span className="text-sm font-semibold text-neutral-800">{selectedMember.nama}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-neutral-100/50">
                        <span className="text-sm text-neutral-500">Kode</span>
                        <span className="text-sm font-mono bg-neutral-100/80 px-2 py-1 rounded-lg text-neutral-700">{selectedMember.kode}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-neutral-100/50">
                        <span className="text-sm text-neutral-500">Nama Pemilik</span>
                        <span className="text-sm font-medium text-neutral-800">{selectedMember.nama_pemilik || '-'}</span>
                      </div>
                      <div className="flex items-start justify-between py-2">
                        <span className="text-sm text-neutral-500">Alamat</span>
                        <span className="text-sm text-neutral-800 text-right max-w-[60%]">{selectedMember.alamat || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Info Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg shadow-neutral-200/20">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-100/80">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success-100 to-success-200/50 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-success-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-neutral-800">Informasi Akun</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-neutral-100/50">
                        <span className="text-sm text-neutral-500">Saldo</span>
                        <span className="text-sm font-bold text-success-600">{formatCurrency(selectedMember.saldo)}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-neutral-100/50">
                        <span className="text-sm text-neutral-500">Level</span>
                        <span className="text-sm font-semibold text-neutral-800 bg-primary-100/50 px-3 py-1 rounded-lg">{selectedMember.kode_level || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-neutral-100/50">
                        <span className="text-sm text-neutral-500">Upline</span>
                        <span className="text-sm font-mono text-neutral-700">{selectedMember.kode_upline || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-neutral-500">Markup</span>
                        <span className="text-sm font-semibold text-neutral-800">{selectedMember.markup ? `${selectedMember.markup}%` : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Info Card */}
                  {(() => {
                    const visibleSessions = enhancedMemberDetail.sessions.filter(s => s.imei && s.device_model);
                    const visibleActiveSessions = visibleSessions.filter(s => s.safetycheck === 1).length;
                    return (
                  <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg shadow-neutral-200/20">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-100/80">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200/50 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-neutral-800">Aktivitas</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-4 border border-neutral-100/50">
                        <span className="text-xs text-neutral-500 block mb-1">Tanggal Daftar</span>
                        <span className="text-sm font-semibold text-neutral-800">{formatDate(selectedMember.tgl_daftar)}</span>
                      </div>
                      <div className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-4 border border-neutral-100/50">
                        <span className="text-xs text-neutral-500 block mb-1">Aktivitas Terakhir</span>
                        <span className="text-sm font-semibold text-neutral-800">{formatDate(selectedMember.tgl_aktivitas)}</span>
                      </div>
                      <div className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-4 border border-neutral-100/50">
                        <span className="text-xs text-neutral-500 block mb-1">Total Sesi</span>
                        <span className="text-sm font-semibold text-neutral-800">{visibleSessions.length}</span>
                      </div>
                      <div className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-4 border border-neutral-100/50">
                        <span className="text-xs text-neutral-500 block mb-1">Sesi Aktif</span>
                        <span className="text-sm font-semibold text-success-600">{visibleActiveSessions}</span>
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'sessions' && (() => {
                const filteredSessions = enhancedMemberDetail.sessions.filter(
                  session => session.imei && session.device_model
                );
                const filteredActiveSessions = filteredSessions.filter(s => s.safetycheck === 1).length;
                const filteredTotalSessions = filteredSessions.length;

                return (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg shadow-neutral-200/20">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100/80">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200/50 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-800">Sesi Perangkat</h4>
                        <p className="text-sm text-neutral-500">{filteredActiveSessions} aktif dari {filteredTotalSessions} total</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-gradient-to-r from-success-500/10 to-success-600/10 text-success-700 text-xs rounded-full font-semibold border border-success-200/50">
                        {filteredActiveSessions} Aktif
                      </span>
                    </div>
                  </div>

                  {filteredSessions.length > 0 ? (
                      <div className="space-y-3">
                        {filteredSessions.map((session) => (
                          <div 
                            key={session.session_key} 
                            className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-4 border border-neutral-100/50 hover:border-neutral-200/80 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-xs text-neutral-500 block mb-1">Telepon</span>
                                  <span className="text-sm font-semibold text-neutral-800">{session.number}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-neutral-500 block mb-1">Perangkat</span>
                                  <span className="text-sm font-medium text-neutral-700">{session.device_model || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-neutral-500 block mb-1">IMEI</span>
                                  <span className="text-xs font-mono text-neutral-600 bg-neutral-100/80 px-2 py-0.5 rounded">{session.imei || '-'}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-neutral-500 block mb-1">Dibuat</span>
                                  <span className="text-sm text-neutral-700">{formatDate(session.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  session.safetycheck === 1
                                    ? 'bg-gradient-to-r from-success-500/10 to-success-600/10 text-success-700 border border-success-200/50'
                                    : 'bg-gradient-to-r from-danger-500/10 to-danger-600/10 text-danger-700 border border-danger-200/50'
                                }`}>
                                  {session.safetycheck === 1 ? 'Aman' : 'Tidak Aman'}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleSafetyCheck(session.session_key, session.safetycheck)}
                                    disabled={togglingSafety.has(session.session_key)}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                                      session.safetycheck === 1
                                        ? 'bg-amber-100/80 text-amber-700 hover:bg-amber-200/80 border border-amber-200/50'
                                        : 'bg-success-100/80 text-success-700 hover:bg-success-200/80 border border-success-200/50'
                                    }`}
                                  >
                                    {togglingSafety.has(session.session_key) ? (
                                      <Spinner size="sm" color="secondary" />
                                    ) : (
                                      session.safetycheck === 1 ? 'Tandai Tidak Aman' : 'Tandai Aman'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteSession(session.session_key)}
                                    disabled={deletingSessions.has(session.session_key)}
                                    className="text-xs px-3 py-1.5 bg-danger-100/80 text-danger-700 rounded-lg hover:bg-danger-200/80 border border-danger-200/50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingSessions.has(session.session_key) ? (
                                      <Spinner size="sm" color="secondary" />
                                    ) : (
                                      'Keluar'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="h-16 w-16 rounded-2xl bg-neutral-100/80 flex items-center justify-center mx-auto mb-4">
                          <Clock className="h-8 w-8 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 font-medium">Tidak ada sesi aktif ditemukan</p>
                        <p className="text-sm text-neutral-400 mt-1">Member belum memiliki sesi perangkat</p>
                      </div>
                    )}
                </div>
                );
              })()}

              {activeTab === 'verification' && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg shadow-neutral-200/20">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100/80">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200/50 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-neutral-800">Status Verifikasi</h4>
                      <p className="text-sm text-neutral-500">{enhancedMemberDetail.verification.length} dokumen verifikasi</p>
                    </div>
                  </div>

                  {enhancedMemberDetail.verification.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {enhancedMemberDetail.verification.map((verif) => (
                        <div 
                          key={verif.id} 
                          className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-5 border border-neutral-100/50 hover:border-neutral-200/80 transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            {/* Image Preview */}
                            <div className="flex-shrink-0">
                              {verif.image_url ? (
                                <div className="relative group cursor-pointer" onClick={() => verif.image_url && setImageOverlay({ url: verif.image_url, type: verif.type_ })}>
                                  <VerificationImage 
                                    imageUrl={verif.image_url} 
                                    type={verif.type_}
                                    onImageClick={(url, type) => setImageOverlay({ url, type })}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center">
                                    <span className="text-white/0 group-hover:text-white text-xs font-medium">Perbesar</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-20 w-20 rounded-xl bg-neutral-100/80 flex items-center justify-center">
                                  <AlertCircle className="h-8 w-8 text-neutral-300" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-neutral-800">{verif.type_}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  verif.status === 'Terverifikasi'
                                    ? 'bg-gradient-to-r from-success-500/10 to-success-600/10 text-success-700 border border-success-200/50'
                                    : verif.status === 'Dalam Proses'
                                    ? 'bg-gradient-to-r from-primary-500/10 to-primary-600/10 text-primary-700 border border-primary-200/50'
                                    : 'bg-gradient-to-r from-danger-500/10 to-danger-600/10 text-danger-700 border border-danger-200/50'
                                }`}>
                                  {getVerificationStatusIcon(verif.status)}
                                  {verif.status}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mb-3 font-mono truncate">ID: {verif.id}</p>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => updateVerificationStatus(verif.id, verif.type_, 'Terverifikasi')}
                                  disabled={verif.status === 'Terverifikasi' || updatingVerification === `${verif.id}_${verif.type_}`}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                                    verif.status === 'Terverifikasi'
                                      ? 'bg-success-100/50 text-success-400 cursor-not-allowed'
                                      : updatingVerification === `${verif.id}_${verif.type_}`
                                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                      : 'bg-success-500 text-white hover:bg-success-600 shadow-sm'
                                  }`}
                                >
                                  {updatingVerification === `${verif.id}_${verif.type_}` ? (
                                    <Spinner size="sm" color="white" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      Verifikasi
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => updateVerificationStatus(verif.id, verif.type_, 'Dalam Proses')}
                                  disabled={verif.status === 'Dalam Proses' || updatingVerification === `${verif.id}_${verif.type_}`}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                                    verif.status === 'Dalam Proses'
                                      ? 'cursor-not-allowed'
                                      : updatingVerification === `${verif.id}_${verif.type_}`
                                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                      : 'text-white shadow-sm'
                                  }`}
                                  style={
                                    verif.status === 'Dalam Proses'
                                      ? { backgroundColor: withOpacity(THEME_COLOR, 0.15), color: withOpacity(THEME_COLOR, 0.5) }
                                      : verif.status !== 'Dalam Proses' && updatingVerification !== `${verif.id}_${verif.type_}`
                                      ? { backgroundColor: THEME_COLOR }
                                      : undefined
                                  }
                                >
                                  {updatingVerification === `${verif.id}_${verif.type_}` ? (
                                    <Spinner size="sm" color="white" />
                                  ) : (
                                    <>
                                      <Clock className="h-3.5 w-3.5" />
                                      Proses
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => updateVerificationStatus(verif.id, verif.type_, 'Perbaiki Verifikasi')}
                                  disabled={verif.status === 'Perbaiki Verifikasi' || updatingVerification === `${verif.id}_${verif.type_}`}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 ${
                                    verif.status === 'Perbaiki Verifikasi'
                                      ? 'bg-danger-100/50 text-danger-400 cursor-not-allowed'
                                      : updatingVerification === `${verif.id}_${verif.type_}`
                                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                      : 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm'
                                  }`}
                                >
                                  {updatingVerification === `${verif.id}_${verif.type_}` ? (
                                    <Spinner size="sm" color="white" />
                                  ) : (
                                    <>
                                      <XCircle className="h-3.5 w-3.5" />
                                      Tolak
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-neutral-100/80 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 font-medium">Tidak ada verifikasi ditemukan</p>
                      <p className="text-sm text-neutral-400 mt-1">Member belum mengajukan verifikasi</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg shadow-neutral-200/20">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100/80">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200/50 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-neutral-800">Kode Referral</h4>
                      <p className="text-sm text-neutral-500">{enhancedMemberDetail.referrals.length} referral aktif</p>
                    </div>
                  </div>

                  {enhancedMemberDetail.referrals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {enhancedMemberDetail.referrals.map((referral) => (
                        <div 
                          key={referral.id} 
                          className="bg-gradient-to-br from-neutral-50/80 to-white/50 rounded-xl p-5 border border-neutral-100/50 hover:border-neutral-200/80 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-neutral-500 font-mono truncate max-w-[60%]">ID: {referral.id}</span>
                            <span className="px-3 py-1 bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-700 text-xs rounded-full font-semibold border border-orange-200/50">
                              {referral.markup}% Markup
                            </span>
                          </div>
                          <div className="bg-white/80 rounded-lg p-3 border border-neutral-100/50">
                            <span className="text-xs text-neutral-500 block mb-1">Kode Referral</span>
                            <span className="text-sm font-bold text-neutral-800 font-mono">{referral.referral}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-2xl bg-neutral-100/80 flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-500 font-medium">Tidak ada referral ditemukan</p>
                      <p className="text-sm text-neutral-400 mt-1">Member belum memiliki kode referral</p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>,
      document.body
      )}

      {/* Image Overlay Modal */}
      {imageOverlay && (
        <div 
          className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4"
          onClick={() => setImageOverlay(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/50">
              <div className="flex items-center justify-between p-5 border-b border-neutral-100/80 bg-gradient-to-r from-neutral-50/50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200/50 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800">
                      {imageOverlay.type.charAt(0).toUpperCase() + imageOverlay.type.slice(1)}
                    </h3>
                    <p className="text-sm text-neutral-500">Gambar Verifikasi</p>
                  </div>
                </div>
                <button
                  onClick={() => setImageOverlay(null)}
                  className="p-2.5 text-neutral-400 hover:text-neutral-600 bg-white/60 hover:bg-white/90 rounded-xl border border-neutral-200/50 transition-all duration-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 bg-gradient-to-br from-neutral-50/50 to-white">
                <img
                  src={imageOverlay.url}
                  alt={`${imageOverlay.type} verification`}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-center text-neutral-500 py-12';
                    errorDiv.textContent = 'Gambar tidak dapat dimuat';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MemberManagement.displayName = 'MemberManagement';

export default MemberManagement;
