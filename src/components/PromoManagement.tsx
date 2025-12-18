import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tag, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';
import { X_TOKEN_VALUE, getApiUrl } from '../config/api';
import { useToast } from './Toast';
import { getCachedPromoConfig, setCachedPromoConfig, mergePromoConfig } from '../utils/promoCache';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

// Types for promo management
interface PromoItem {
  code: string;
  value: PromoValue;
}

type PromoValue = 
  | { type: 'price_cut'; amount: number }
  | { type: 'new_product'; isNew: boolean };

interface PromoMetadata {
  total_promos: number;
  price_cut_promos: number;
  new_product_promos: number;
  tanggal_update: string;
  versi: string;
}

interface PromoConfig {
  promos: PromoItem[];
  metadata: PromoMetadata;
}

interface PromoManagementProps {
  authSeed: string;
  onStatsChange?: (total: number) => void;
}

export interface PromoManagementRef {
  saveAllConfigurations: () => Promise<void>;
  openAddPromoModal: () => void;
}

const PromoManagement = forwardRef<PromoManagementRef, PromoManagementProps>(({ authSeed, onStatsChange }, ref) => {
    const { showToast } = useToast();
const [promoConfig, setPromoConfig] = useState<PromoConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<PromoItem>>({
    code: '',
    value: { type: 'price_cut', amount: 100 }
  });

  const hasLoadedRef = useRef(false);
  const prevPromoConfigRef = useRef<PromoConfig | null>(null);

  const loadPromoConfig = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        if (!background) {
          showToast('No admin session found', 'error');
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/promo-config');
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
          // Convert the backend format to frontend format
          const convertedConfig = convertBackendToFrontend(data.config);
          setPromoConfig(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(convertedConfig)) {
              return prev;
            }
            return mergePromoConfig(prev, convertedConfig);
          });
        } else {
          if (!background) {
            showToast(data.message || 'Failed to load promo configuration', 'error');
          }
        }
      } else {
        if (!background) {
          showToast('Failed to load promo configuration', 'error');
        }
      }
    } catch (error) {
      if (!background) {
        showToast('Error loading promo configuration', 'error');
      }
    }
  }, [authSeed]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load from cache immediately
    const cached = getCachedPromoConfig();
    if (cached) {
      prevPromoConfigRef.current = cached;
      setPromoConfig(cached);
    }

    // Fetch from API in background
    loadPromoConfig(true);
  }, [loadPromoConfig]);

  // Update cache when promoConfig changes (but not if it's the same as previous)
  useEffect(() => {
    if (promoConfig && prevPromoConfigRef.current !== promoConfig) {
      // Only update cache if config actually changed
      if (!prevPromoConfigRef.current || 
          JSON.stringify(prevPromoConfigRef.current) !== JSON.stringify(promoConfig)) {
        setCachedPromoConfig(promoConfig);
        prevPromoConfigRef.current = promoConfig;
      }
    }
  }, [promoConfig]);

  // Notify parent when promoConfig changes
  useEffect(() => {
    if (onStatsChange && promoConfig) {
      onStatsChange(promoConfig.metadata.total_promos || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoConfig?.metadata.total_promos]);

  const convertBackendToFrontend = (backendConfig: any): PromoConfig => {
    const convertedPromos = backendConfig.promos.map((promo: any) => {
      let value: PromoValue;
      if (promo.value.PriceCut !== undefined) {
        value = { type: 'price_cut', amount: promo.value.PriceCut };
      } else if (promo.value.NewProduct !== undefined) {
        value = { type: 'new_product', isNew: promo.value.NewProduct };
      } else {
        // Fallback
        value = { type: 'price_cut', amount: 100 };
      }

      return {
        code: promo.code,
        value
      };
    });

    return {
      promos: convertedPromos,
      metadata: backendConfig.metadata
    };
  };

  const convertFrontendToBackend = (frontendConfig: PromoConfig): any => {
    const convertedPromos = frontendConfig.promos.map((promo) => {
      let value: any;
      if (promo.value.type === 'price_cut') {
        value = { PriceCut: promo.value.amount };
      } else {
        value = { NewProduct: promo.value.isNew };
      }

      return {
        code: promo.code,
        value
      };
    });

    return {
      promos: convertedPromos,
      metadata: frontendConfig.metadata
    };
  };

  const savePromoConfig = async () => {
    if (!promoConfig) return;

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/promo-config/save');
      const backendConfig = convertFrontendToBackend(promoConfig);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          config: backendConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('Promo configuration saved successfully!', 'success');
        } else {
          showToast(data.message || 'Failed to save promo configuration', 'error');
        }
      } else {
        showToast('Failed to save promo configuration', 'error');
      }
    } catch (error) {
      showToast('Error saving promo configuration', 'error');
    }
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    saveAllConfigurations: savePromoConfig,
    openAddPromoModal: () => setShowAddPromoModal(true)
  }));

  const updatePromo = (code: string, field: keyof PromoItem, value: any) => {
    if (!promoConfig) return;

    setPromoConfig(prev => {
      if (!prev) return prev;
      const newPromos = prev.promos.map(p => 
        p.code === code ? { ...p, [field]: value } : p
      );
      return { ...prev, promos: newPromos };
    });
  };

  const addNewPromo = () => {
    if (!promoConfig || !newPromo.code) return;

    // Check if code already exists
    if (promoConfig.promos.some(p => p.code === newPromo.code)) {
      showToast('Promo code already exists', 'error');
      return;
    }

    const newPromoItem: PromoItem = {
      code: newPromo.code,
      value: newPromo.value || { type: 'price_cut', amount: 100 }
    };

    setPromoConfig(prev => {
      if (!prev) return prev;
      const newPromos = [...prev.promos, newPromoItem];
      const priceCutCount = newPromos.filter(p => p.value.type === 'price_cut').length;
      const newProductCount = newPromos.filter(p => p.value.type === 'new_product').length;

      const newMetadata = {
        ...prev.metadata,
        total_promos: newPromos.length,
        price_cut_promos: priceCutCount,
        new_product_promos: newProductCount,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, promos: newPromos, metadata: newMetadata };
    });

    // Reset new promo form and close modal
    setNewPromo({
      code: '',
      value: { type: 'price_cut', amount: 100 }
    });
    setShowAddPromoModal(false);
  };

  const removePromo = (code: string) => {
    if (!promoConfig) return;

    setPromoConfig(prev => {
      if (!prev) return prev;
      const newPromos = prev.promos.filter(p => p.code !== code);
      const priceCutCount = newPromos.filter(p => p.value.type === 'price_cut').length;
      const newProductCount = newPromos.filter(p => p.value.type === 'new_product').length;

      const newMetadata = {
        ...prev.metadata,
        total_promos: newPromos.length,
        price_cut_promos: priceCutCount,
        new_product_promos: newProductCount,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, promos: newPromos, metadata: newMetadata };
    });
  };

  const renderPromoRow = (promo: PromoItem) => {
    return (
      <div
        key={promo.code}
        className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
      >
        {/* Code */}
        <div className="flex-shrink-0 w-1/4 flex items-start">
          <input
            type="text"
            value={promo.code}
            onChange={(e) => updatePromo(promo.code, 'code', e.target.value)}
            className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
            placeholder="Kode promo"
          />
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Type */}
        <div className="flex-shrink-0 w-1/4 flex items-start">
          <select
            value={promo.value.type}
            onChange={(e) => {
              const type = e.target.value as 'price_cut' | 'new_product';
              const newValue = type === 'price_cut' 
                ? { type: 'price_cut', amount: promo.value.type === 'price_cut' ? promo.value.amount : 100 }
                : { type: 'new_product', isNew: true };
              updatePromo(promo.code, 'value', newValue);
            }}
            className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
          >
            <option value="price_cut">Price Cut</option>
            <option value="new_product">New Product</option>
          </select>
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Value */}
        <div className="flex-1 min-w-0 flex items-start">
          {promo.value.type === 'price_cut' ? (
            <input
              type="number"
              value={promo.value.amount}
              onChange={(e) => updatePromo(promo.code, 'value', { 
                type: 'price_cut', 
                amount: parseInt(e.target.value) || 0 
              })}
              className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              min="1"
              placeholder="Jumlah diskon"
            />
          ) : (
            <div className="px-2 py-1 text-sm text-gray-600">
              Produk Baru
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

        {/* Actions */}
        <div className="flex-shrink-0 w-20 flex items-start">
          <button
            onClick={() => removePromo(promo.code)}
            className="px-2 py-1 text-xs bg-danger-600 text-white rounded hover:bg-danger-700 transition-colors"
            title="Hapus promo"
          >
            Hapus
          </button>
        </div>
      </div>
    );
  };

  const filteredPromos = promoConfig?.promos.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'price_cut' && promo.value.type === 'price_cut') ||
                       (filterType === 'new_product' && promo.value.type === 'new_product');
    return matchesSearch && matchesType;
  }) || [];

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
                placeholder="Cari promo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300 transition-all duration-200 text-sm cursor-pointer"
            >
              <option value="all">Semua Tipe</option>
              <option value="price_cut">Price Cut</option>
              <option value="new_product">New Product</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add New Promo Modal */}
      {showAddPromoModal && createPortal(
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200/50">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 rounded-lg">
                  <Plus className="h-4 w-4 text-primary-600" />
                </div>
                Tambah Promo Baru
              </h3>
              <button
                onClick={() => setShowAddPromoModal(false)}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Kode Promo:</label>
                  <input
                    type="text"
                    value={newPromo.code || ''}
                    onChange={(e) => setNewPromo(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Kode promo"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Tipe Promo:</label>
                  <select
                    value={newPromo.value?.type || 'price_cut'}
                    onChange={(e) => {
                      const type = e.target.value as 'price_cut' | 'new_product';
                      setNewPromo(prev => ({
                        ...prev,
                        value: type === 'price_cut' 
                          ? { type: 'price_cut', amount: 100 }
                          : { type: 'new_product', isNew: true }
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="price_cut">Price Cut</option>
                    <option value="new_product">New Product</option>
                  </select>
                </div>
                {newPromo.value?.type === 'price_cut' && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-700">Jumlah Diskon (Rp):</label>
                    <input
                      type="number"
                      value={newPromo.value?.type === 'price_cut' ? newPromo.value.amount : 100}
                      onChange={(e) => setNewPromo(prev => ({
                        ...prev,
                        value: { type: 'price_cut', amount: parseInt(e.target.value) || 100 }
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="1"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddPromoModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={addNewPromo}
                  className="px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Promo</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Promo List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
        <div className="p-4">
          <div className="border border-neutral-200/80 rounded-xl p-4 bg-white/50">
            <div className="mb-3 pb-2 border-b border-neutral-100/80">
              <div className="flex items-center gap-3 text-sm font-semibold text-neutral-600">
                <div className="flex-shrink-0 w-1/4">Kode Promo</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-1/4">Tipe Promo</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-1 min-w-0">Nilai</div>
                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                <div className="flex-shrink-0 w-20">Aksi</div>
              </div>
            </div>
            <div className="space-y-2">
              {filteredPromos.map((promo) => renderPromoRow(promo))}
            </div>
          </div>
        </div>
      </div>

      {filteredPromos.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Promo</h3>
          <p className="text-gray-600">Tidak ada promo yang sesuai dengan filter pencarian</p>
        </div>
      )}
    </div>
  );
});

PromoManagement.displayName = 'PromoManagement';

export default PromoManagement;
