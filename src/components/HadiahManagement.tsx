import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { 
  Gift, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  Search,
  Upload,
  Image as ImageIcon,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { X_TOKEN_VALUE, getApiUrl } from '../config/api';
import { useToast } from './Toast';
import { getCachedHadiahConfig, setCachedHadiahConfig, mergeHadiahConfig } from '../utils/hadiahCache';
import AssetsManager from './AssetsManager';
import ImageHoverPreview from './ImageHoverPreview';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

// Types for hadiah management
interface Hadiah {
  id: number;
  nama: string;
  poin: number;
  kategori: string;
  deskripsi: string;
  image_url: string;
  status: string;
}

interface HadiahMetadata {
  total_hadiah: number;
  kategori_tersedia: string[];
  poin_minimum: number;
  poin_maksimum: number;
  tanggal_update: string;
  versi: string;
}

interface HadiahConfig {
  hadiah: Hadiah[];
  metadata: HadiahMetadata;
}

interface HadiahManagementProps {
  authSeed: string;
  onStatsChange?: (total: number) => void;
}

export interface HadiahManagementRef {
  saveAllConfigurations: () => Promise<void>;
  openAddHadiahModal: () => void;
}

const HadiahManagement = forwardRef<HadiahManagementRef, HadiahManagementProps>(({ authSeed, onStatsChange }, ref) => {
    const { showToast } = useToast();
const [hadiahConfig, setHadiahConfig] = useState<HadiahConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [showAddHadiahModal, setShowAddHadiahModal] = useState(false);
  const [newHadiah, setNewHadiah] = useState<Partial<Hadiah>>({
    nama: '',
    poin: 100,
    kategori: 'pulsa',
    deskripsi: '',
    image_url: 'https://pixabay.com/images/download/gift-1420830_640.jpg',
    status: 'aktif'
  });
  const [imagePreview, setImagePreview] = useState<{ [key: number]: string }>({});
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentHadiahId, setCurrentHadiahId] = useState<number | 'new' | null>(null);
  const [isAddingNewKategori, setIsAddingNewKategori] = useState(false);
  const [newKategoriName, setNewKategoriName] = useState('');
  const [editingKategoriForId, setEditingKategoriForId] = useState<number | null>(null);
  const [editingKategoriName, setEditingKategoriName] = useState('');
  const fileInputRefs = useRef<Record<number | 'new', HTMLInputElement | null>>({});
  const hasLoadedRef = useRef(false);

  const loadHadiahConfig = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        if (!background) {
          showToast('No admin session found', 'error');
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/hadiah-config');
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

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setHadiahConfig(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(data.config)) {
              return prev;
            }
            return mergeHadiahConfig(prev, data.config);
          });
        } else {
          if (!background) {
            showToast(data.message || 'Failed to load hadiah configuration', 'error');
          }
        }
      } else {
        if (!background) {
          showToast('Failed to load hadiah configuration', 'error');
        }
      }
    } catch (error) {
      if (!background) {
        showToast('Error loading hadiah configuration', 'error');
      }
    }
  }, [authSeed]);

  const prevHadiahConfigRef = useRef<HadiahConfig | null>(null);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load from cache immediately
    const cached = getCachedHadiahConfig();
    if (cached) {
      prevHadiahConfigRef.current = cached;
      setHadiahConfig(cached);
    }

    // Fetch from API in background
    loadHadiahConfig(true);
  }, [loadHadiahConfig]);

  // Update cache when hadiahConfig changes (but not if it's the same as previous)
  useEffect(() => {
    if (hadiahConfig && prevHadiahConfigRef.current !== hadiahConfig) {
      // Only update cache if config actually changed
      if (!prevHadiahConfigRef.current || 
          JSON.stringify(prevHadiahConfigRef.current) !== JSON.stringify(hadiahConfig)) {
        setCachedHadiahConfig(hadiahConfig);
        prevHadiahConfigRef.current = hadiahConfig;
      }
    }
  }, [hadiahConfig]);

  // Notify parent when hadiahConfig changes
  useEffect(() => {
    if (onStatsChange && hadiahConfig) {
      onStatsChange(hadiahConfig.metadata.total_hadiah || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadiahConfig?.metadata.total_hadiah]);

  const saveHadiahConfig = async () => {
    if (!hadiahConfig) return;

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/hadiah-config/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          config: hadiahConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('Hadiah configuration saved successfully!', 'success');
        } else {
          showToast(data.message || 'Failed to save hadiah configuration', 'error');
        }
      } else {
        showToast('Failed to save hadiah configuration', 'error');
      }
    } catch (error) {
      showToast('Error saving hadiah configuration', 'error');
    }
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    saveAllConfigurations: saveHadiahConfig,
    openAddHadiahModal: () => setShowAddHadiahModal(true)
  }));

  const updateHadiah = (id: number, field: keyof Hadiah, value: any) => {
    if (!hadiahConfig) return;

    setHadiahConfig(prev => {
      if (!prev) return prev;
      const newHadiah = prev.hadiah.map(h => 
        h.id === id ? { ...h, [field]: value } : h
      );
      return { ...prev, hadiah: newHadiah };
    });
  };

  const addNewKategori = (kategoriName: string) => {
    if (!hadiahConfig || !kategoriName.trim()) return false;

    const normalizedName = kategoriName.trim().toLowerCase();
    if (hadiahConfig.metadata.kategori_tersedia.includes(normalizedName)) {
      showToast('Kategori sudah ada', 'error');
      return false;
    }

    setHadiahConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          kategori_tersedia: [...prev.metadata.kategori_tersedia, normalizedName],
          tanggal_update: new Date().toISOString().split('T')[0]
        }
      };
    });
    return true;
  };

  const addNewHadiah = () => {
    if (!hadiahConfig) return;

    const maxId = Math.max(...hadiahConfig.hadiah.map(h => h.id), 0);
    const newHadiahItem: Hadiah = {
      id: maxId + 1,
      nama: newHadiah.nama || 'Hadiah Baru',
      poin: newHadiah.poin || 100,
      kategori: newHadiah.kategori || 'pulsa',
      deskripsi: newHadiah.deskripsi || '',
      image_url: newHadiah.image_url || 'https://pixabay.com/images/download/gift-1420830_640.jpg',
      status: newHadiah.status || 'aktif'
    };

    setHadiahConfig(prev => {
      if (!prev) return prev;
      const newHadiah = [...prev.hadiah, newHadiahItem];
      const newMetadata = {
        ...prev.metadata,
        total_hadiah: newHadiah.length,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, hadiah: newHadiah, metadata: newMetadata };
    });

    // Reset new hadiah form and close modal
    setNewHadiah({
      nama: '',
      poin: 100,
      kategori: 'pulsa',
      deskripsi: '',
      image_url: 'https://pixabay.com/images/download/gift-1420830_640.jpg',
      status: 'aktif'
    });
    setShowAddHadiahModal(false);
  };

  const removeHadiah = (id: number) => {
    if (!hadiahConfig) return;

    setHadiahConfig(prev => {
      if (!prev) return prev;
      const newHadiah = prev.hadiah.filter(h => h.id !== id);
      const newMetadata = {
        ...prev.metadata,
        total_hadiah: newHadiah.length,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, hadiah: newHadiah, metadata: newMetadata };
    });
  };

  const renderHadiahRow = (hadiah: Hadiah) => {
    return (
      <div
        key={hadiah.id}
        className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
      >
        {/* Nama */}
        <div className="flex-shrink-0 w-1/6 flex items-start">
          <input
            type="text"
            value={hadiah.nama}
            onChange={(e) => updateHadiah(hadiah.id, 'nama', e.target.value)}
            className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
            placeholder="Nama hadiah"
          />
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Poin */}
        <div className="flex-shrink-0 w-20 flex items-start">
          <input
            type="number"
            value={hadiah.poin}
            onChange={(e) => updateHadiah(hadiah.id, 'poin', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
            min="1"
          />
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Kategori */}
        <div className="flex-shrink-0 w-32 flex items-start">
          {editingKategoriForId === hadiah.id ? (
            <div className="flex gap-1 w-full">
              <input
                type="text"
                value={editingKategoriName}
                onChange={(e) => setEditingKategoriName(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
                placeholder="Kategori baru"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (addNewKategori(editingKategoriName)) {
                    updateHadiah(hadiah.id, 'kategori', editingKategoriName.trim().toLowerCase());
                    setEditingKategoriName('');
                    setEditingKategoriForId(null);
                  }
                }}
                className="px-1.5 py-1 bg-success-500 text-white rounded hover:bg-success-600 transition-colors flex items-center"
              >
                <CheckCircle size={12} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingKategoriName('');
                  setEditingKategoriForId(null);
                }}
                className="px-1.5 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex gap-1 w-full">
              <select
                value={hadiah.kategori}
                onChange={(e) => updateHadiah(hadiah.id, 'kategori', e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              >
                {kategoriOptions.map(kategori => (
                  <option key={kategori} value={kategori}>
                    {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setEditingKategoriForId(hadiah.id)}
                className="px-1.5 py-1 text-white rounded transition-colors flex items-center flex-shrink-0"
                style={{ backgroundColor: THEME_COLOR }}
                title="Tambah kategori baru"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Deskripsi */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={hadiah.deskripsi}
            onChange={(e) => updateHadiah(hadiah.id, 'deskripsi', e.target.value)}
            className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
            placeholder="Deskripsi"
          />
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Image */}
        <div className="flex-shrink-0 w-48 flex items-start">
          <div className="w-full space-y-1">
            <div className="flex gap-1">
              <input
                type="url"
                value={imagePreview[hadiah.id] || hadiah.image_url}
                onChange={(e) => updateHadiah(hadiah.id, 'image_url', e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
                placeholder="Image URL"
              />
              <input
                ref={(el) => { fileInputRefs.current[hadiah.id] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, hadiah.id)}
              />
              {(imagePreview[hadiah.id] || hadiah.image_url) && (
                <ImageHoverPreview
                  src={imagePreview[hadiah.id] || hadiah.image_url}
                  alt="Hadiah preview"
                  thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                />
              )}
              <button
                type="button"
                onClick={() => fileInputRefs.current[hadiah.id]?.click()}
                className="px-1.5 py-1 text-white rounded transition-colors flex items-center flex-shrink-0"
                style={{ backgroundColor: THEME_COLOR }}
                title="Upload image"
              >
                <Upload size={12} />
              </button>
              <button
                type="button"
                onClick={() => openAssetPicker(hadiah.id)}
                className="px-1.5 py-1 bg-success-500 text-white rounded hover:bg-success-600 transition-colors flex items-center flex-shrink-0"
                title="Select from assets"
              >
                <ImageIcon size={12} />
              </button>
            </div>
            {uploadingImage === hadiah.id && (
              <div className="text-xs text-gray-600 text-center">
                Uploading...
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Status */}
        <div className="flex-shrink-0 w-8 flex items-start justify-center">
          <button
            onClick={() => updateHadiah(hadiah.id, 'status', hadiah.status === 'aktif' ? 'tidak aktif' : 'aktif')}
            className="flex items-center"
            title={hadiah.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
          >
            {hadiah.status === 'aktif' ? (
              <ToggleRight className="h-6 w-6 text-success-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </button>
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Actions */}
        <div className="flex-shrink-0 w-10 flex items-start">
          <button
            onClick={() => removeHadiah(hadiah.id)}
            className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
            title="Hapus hadiah"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const filteredHadiah = hadiahConfig?.hadiah.filter(hadiah => {
    const matchesSearch = hadiah.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hadiah.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = filterKategori === 'all' || hadiah.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  }) || [];

  const kategoriOptions = hadiahConfig?.metadata.kategori_tersedia || [];

  const getPublicUrl = async (filename: string) => {
    // Strip any leading /assets/ or / from the filename
    const cleanFilename = filename.replace(/^\/assets\//, '').replace(/^\//, '');
    const apiUrl = await getApiUrl('');
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  const handleUploadFile = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        return null;
      }

      const formData = new FormData();
      formData.append('session_key', sessionKey);
      formData.append('auth_seed', authSeed);
      formData.append('file', file);

      const apiUrl = await getApiUrl('/admin/assets/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-Token': X_TOKEN_VALUE,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Try different response formats
        let filename = null;
        let publicUrl = null;

        // Check for filename in various places
        if (data.filename) {
          filename = data.filename;
        } else if (data.asset?.filename) {
          filename = data.asset.filename;
        } else if (data.file_url) {
          // Extract filename from file_url
          const urlParts = data.file_url.split('/');
          filename = urlParts[urlParts.length - 1];
        }

        // Check for public_url or file_url (might be full URL or relative)
        if (data.public_url) {
          publicUrl = data.public_url;
        } else if (data.asset?.public_url) {
          publicUrl = data.asset.public_url;
        } else if (data.file_url) {
          publicUrl = data.file_url;
        }

        // If we have a URL but it's relative (starts with /), make it absolute
        if (publicUrl && publicUrl.startsWith('/')) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}${publicUrl}`;
        }

        // If we still don't have a URL but have a filename, construct it
        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }

        if (publicUrl) {
          setAssetsRefreshTrigger(prev => prev + 1);
          return publicUrl;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const handleImageUpload = async (file: File, hadiahId: number | 'new') => {
    if (hadiahId === 'new') {
      setUploadingImage(-1);
    } else {
      setUploadingImage(hadiahId);
    }

    try {
      const url = await handleUploadFile(file);

      if (url) {
        if (hadiahId === 'new') {
          setNewHadiah(prev => ({ ...prev, image_url: url }));
        } else {
          updateHadiah(hadiahId, 'image_url', url);
        }
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (error) {
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, hadiahId: number | 'new') => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleImageUpload(file, hadiahId);

    const ref = fileInputRefs.current[hadiahId];
    if (ref) {
      ref.value = '';
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url && currentHadiahId !== null) {
      if (currentHadiahId === 'new') {
        setNewHadiah(prev => ({ ...prev, image_url: url }));
      } else {
        updateHadiah(currentHadiahId, 'image_url', url);
      }
      setShowAssetPicker(false);
      setCurrentHadiahId(null);
    }
  };

  const openAssetPicker = (hadiahId: number | 'new') => {
    setCurrentHadiahId(hadiahId);
    setShowAssetPicker(true);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-card border border-neutral-100/80">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari hadiah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {kategoriOptions.map(kategori => (
                <option key={kategori} value={kategori}>
                  {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add New Hadiah Modal */}
      {showAddHadiahModal && createPortal(
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200/50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 rounded-lg">
                  <Plus className="h-4 w-4 text-primary-600" />
                </div>
                Tambah Hadiah Baru
              </h3>
              <button
                onClick={() => setShowAddHadiahModal(false)}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Nama Hadiah:</label>
                  <input
                    type="text"
                    value={newHadiah.nama || ''}
                    onChange={(e) => setNewHadiah(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nama hadiah"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Poin:</label>
                  <input
                    type="number"
                    value={newHadiah.poin || 100}
                    onChange={(e) => setNewHadiah(prev => ({ ...prev, poin: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Kategori:</label>
                  {isAddingNewKategori ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKategoriName}
                        onChange={(e) => setNewKategoriName(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Nama kategori baru"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (addNewKategori(newKategoriName)) {
                            setNewHadiah(prev => ({ ...prev, kategori: newKategoriName.trim().toLowerCase() }));
                            setNewKategoriName('');
                            setIsAddingNewKategori(false);
                          }
                        }}
                        className="px-3 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewKategoriName('');
                          setIsAddingNewKategori(false);
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={newHadiah.kategori || 'pulsa'}
                        onChange={(e) => setNewHadiah(prev => ({ ...prev, kategori: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {kategoriOptions.map(kategori => (
                          <option key={kategori} value={kategori}>
                            {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewKategori(true)}
                        className="px-3 py-2 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                        style={{ backgroundColor: THEME_COLOR }}
                        title="Tambah kategori baru"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                    Status:
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewHadiah(prev => ({ ...prev, status: (prev.status || 'aktif') === 'aktif' ? 'tidak aktif' : 'aktif' }))}
                    className="flex items-center gap-2 mt-1"
                  >
                    {(newHadiah.status || 'aktif') === 'aktif' ? (
                      <ToggleRight className="h-6 w-6 text-success-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700">{(newHadiah.status || 'aktif') === 'aktif' ? 'Aktif' : 'Tidak Aktif'}</span>
                  </button>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Deskripsi:</label>
                  <input
                    type="text"
                    value={newHadiah.deskripsi || ''}
                    onChange={(e) => setNewHadiah(prev => ({ ...prev, deskripsi: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Deskripsi hadiah"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Image URL:</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="url"
                      value={newHadiah.image_url || ''}
                      onChange={(e) => setNewHadiah(prev => ({ ...prev, image_url: e.target.value }))}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Image URL"
                    />
                    <input
                      ref={(el) => { fileInputRefs.current['new'] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'new')}
                    />
                    {newHadiah.image_url && (
                      <ImageHoverPreview
                        src={newHadiah.image_url}
                        alt="New hadiah preview"
                        thumbnailClassName="flex-shrink-0 w-9 h-9 rounded border border-gray-200 overflow-hidden bg-gray-100"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current['new']?.click()}
                      className="px-3 py-2 text-white rounded-lg transition-colors flex items-center gap-1"
                      style={{ backgroundColor: THEME_COLOR }}
                      title="Upload image"
                    >
                      <Upload size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('new')}
                      className="px-3 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors flex items-center gap-1"
                      title="Select from assets"
                    >
                      <ImageIcon size={14} />
                    </button>
                  </div>
                  {uploadingImage === -1 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Uploading...
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddHadiahModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={addNewHadiah}
                  className="px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Hadiah</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hadiah List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80">
        <div className="p-4">
          <div className="border border-neutral-200/80 rounded-xl p-4 bg-white/50">
            <div className="mb-3 pb-2 border-b border-neutral-100/80">
              <div className="flex items-center gap-3 text-sm font-semibold text-neutral-600">
                <div className="flex-shrink-0 w-1/6">Nama</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-20">Poin</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-32">Kategori</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-1 min-w-0">Deskripsi</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-48">Image</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-8">Aktif</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-10">Aksi</div>
              </div>
            </div>
            <div className="space-y-2">
              {filteredHadiah.map((hadiah) => renderHadiahRow(hadiah))}
            </div>
          </div>
        </div>
      </div>

      {filteredHadiah.length === 0 && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-xl border border-neutral-100/80">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Gift className="h-8 w-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">Tidak Ada Hadiah</h3>
          <p className="text-neutral-500">Tidak ada hadiah yang sesuai dengan filter pencarian</p>
        </div>
      )}

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih atau Upload Asset</h3>
              <button
                onClick={() => {
                  setShowAssetPicker(false);
                  setCurrentHadiahId(null);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager 
                authSeed={authSeed}
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleAssetSelect}
              />
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800 mb-2">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk memilih dan menerapkan ke field Image URL secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

HadiahManagement.displayName = 'HadiahManagement';

export default HadiahManagement;
