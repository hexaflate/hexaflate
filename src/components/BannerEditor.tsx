import React, { useState, useEffect, useRef } from 'react';
import { ContentSection, MenuItem } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, AlertTriangle, Copy, Upload, Image as ImageIcon, X, ImageIcon as BannerIcon, Type, Layout, Navigation, Settings } from 'lucide-react';
import { getRoutesByCategory, getDefaultArgsForRoute } from '../data/routeConfig';
import RouteArgsConfig from './RouteArgsConfig';
import RouteArgsEditor from './RouteArgsEditor';
import AssetsManager from './AssetsManager';
import ImageHoverPreview from './ImageHoverPreview';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface BannerEditorProps {
  widget: ContentSection;
  onSave: (updates: Partial<ContentSection>) => void;
  onClose: () => void;
  menuItems?: MenuItem[]; // Available menu items for cloning
  authSeed?: string;
}

// Collapsible section component - defined outside to prevent re-creation on every render
const CollapsibleSection: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}> = ({ id, title, subtitle, icon, children, isExpanded, onToggle }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-neutral-100/80 overflow-hidden mb-3 shadow-sm">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(id);
      }}
      className="w-full flex items-center justify-between p-3 hover:bg-primary-50/30 transition-all duration-200"
    >
      <div className="flex items-center gap-2.5">
        <span className="p-1.5 bg-neutral-100 rounded-lg">{icon}</span>
        <div className="text-left">
          <h4 className="text-xs font-semibold text-neutral-800">{title}</h4>
          {subtitle && <p className="text-[11px] text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {isExpanded ? <ChevronUp size={14} className="text-primary-500" /> : <ChevronDown size={14} className="text-neutral-400" />}
    </button>
    {isExpanded && (
      <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
        {children}
      </div>
    )}
  </div>
);

const BannerEditor: React.FC<BannerEditorProps> = ({ widget, onSave, onClose, menuItems = [], authSeed = '' }) => {
  const [localWidget, setLocalWidget] = useState<ContentSection>(widget);
  const [expandedBanner, setExpandedBanner] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [bannerColors, setBannerColors] = useState<string[]>([]);
  const [navigationTypes, setNavigationTypes] = useState<Record<number, 'none' | 'internal' | 'external' | 'clone'>>({});

  // Handler for toggling collapsible sections
  const handleSectionToggle = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | null>(null);
  const originalWidgetRef = useRef<ContentSection>(widget);

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Get routes grouped by category for the select dropdown
  const routesByCategory = getRoutesByCategory();

  // Generate random colors for banners
  useEffect(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];

    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    setBannerColors(shuffledColors);
  }, []);

  // Check if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const hasChanges = JSON.stringify(localWidget) !== JSON.stringify(originalWidgetRef.current);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };

  // Check for changes whenever localWidget changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [localWidget]);

  // Auto-sync cloned banners with menu changes
  useEffect(() => {
    if (!localWidget.banners) return;

    const updatedBanners = localWidget.banners.map(banner => {
      if (banner.clonedFromMenuId) {
        const menuItem = findMenuItemById(menuItems, banner.clonedFromMenuId);
        if (menuItem) {
          return {
            ...banner,
            route: menuItem.route,
            routeArgs: menuItem.routeArgs,
            url: menuItem.url
            // Don't sync title - keep banner's own title
          };
        }
      }
      return banner;
    });

    if (JSON.stringify(updatedBanners) !== JSON.stringify(localWidget.banners)) {
      setLocalWidget({ ...localWidget, banners: updatedBanners });
    }
  }, [menuItems, localWidget.banners]);

  // Initialize navigation types when banners are loaded
  useEffect(() => {
    if (localWidget.banners) {
      const initialNavigationTypes: Record<number, 'none' | 'internal' | 'external' | 'clone'> = {};
      localWidget.banners.forEach((banner, index) => {
        if (banner.clonedFromMenuId) {
          initialNavigationTypes[index] = 'clone';
        } else if (banner.url) {
          initialNavigationTypes[index] = 'external';
        } else if (banner.route) {
          initialNavigationTypes[index] = 'internal';
        } else {
          initialNavigationTypes[index] = 'none';
        }
      });
      setNavigationTypes(initialNavigationTypes);
    }
  }, [localWidget.banners]);

  // Handle beforeunload event (tab/browser close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleBannerExpansion = (index: number) => {
    if (expandedBanner === index) {
      setExpandedBanner(null);
      setExpandedSection(null);
    } else {
      setExpandedBanner(index);
      setExpandedSection(null);
    }
  };

  const addBanner = () => {
    const newBanner = {
      imageUrl: 'https://example.com/banner1.jpg',
      title: 'Banner Baru',
      titleFontSize: 14.0,
      titlePosition: { bottom: 8.0, left: 16.0 },
      titleTextShadow: false,
      titleTextShadowColor: '#000000',
      titleTextShadowOpacity: 0.5,
      padding: { top: 8.0, bottom: 60.0, left: 8.0, right: 8.0 },
      borderRadius: 12.0,
      route: '/product',
      routeArgs: getDefaultArgsForRoute('/product') || {
        operators: ['TSELREG'],
        hintText: 'Nomor HP Pelanggan'
      }
    };

    const newBanners = [...(localWidget.banners || []), newBanner];
    setLocalWidget({ ...localWidget, banners: newBanners });

    // Don't auto-expand the new banner - keep it collapsed
  };

  const removeBanner = (index: number) => {
    const newBanners = localWidget.banners?.filter((_, i) => i !== index) || [];
    setLocalWidget({ ...localWidget, banners: newBanners });

    // Clear expansion if removing the expanded banner
    if (expandedBanner === index) {
      setExpandedBanner(null);
      setExpandedSection(null);
    } else if (expandedBanner !== null && expandedBanner > index) {
      setExpandedBanner(expandedBanner - 1);
    }
  };

  const duplicateBanner = (index: number) => {
    const bannerToDuplicate = localWidget.banners?.[index];
    if (!bannerToDuplicate) return;

    // Create a copy of the banner with all its configuration
    const duplicatedBanner = {
      ...bannerToDuplicate,
      title: `${bannerToDuplicate.title || 'Banner'} (Copy)`, // Add "(Copy)" to the title
      // Keep all other properties including route, routeArgs, url, clonedFromMenuId, etc.
    };

    // Insert the duplicated banner right after the original
    const newBanners = [...(localWidget.banners || [])];
    newBanners.splice(index + 1, 0, duplicatedBanner);
    setLocalWidget({ ...localWidget, banners: newBanners });

    // Update navigation types for the new banner
    const newNavigationType = bannerToDuplicate.clonedFromMenuId ? 'clone' : 
                             bannerToDuplicate.url ? 'external' : 
                             bannerToDuplicate.route ? 'internal' : 'none';

    setNavigationTypes(prev => {
      const newTypes = { ...prev };
      // Shift existing navigation types for banners after the insertion point
      Object.keys(newTypes).forEach(key => {
        const idx = parseInt(key);
        if (idx > index) {
          newTypes[idx + 1] = newTypes[idx];
        }
      });
      newTypes[index + 1] = newNavigationType;
      return newTypes;
    });
  };

  const updateBanner = (index: number, updates: any) => {
    const newBanners = [...(localWidget.banners || [])];
    newBanners[index] = { ...newBanners[index], ...updates };
    setLocalWidget({ ...localWidget, banners: newBanners });
  };

  const handleSave = () => {
    onSave(localWidget);
    // Update the original widget reference after successful save
    originalWidgetRef.current = localWidget;
    setHasUnsavedChanges(false);
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction('close');
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Confirm action (discard changes)
  const confirmAction = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
    onClose();
  };

  // Cancel action (stay in editor)
  const cancelAction = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
  };

  const getBannerColor = (index: number) => {
    return bannerColors[index % bannerColors.length] || '#E5E7EB';
  };

  // Find menu item by ID (recursive search)
  const findMenuItemById = (items: MenuItem[], targetId: string): MenuItem | null => {
    for (const item of items) {
      if (item.menu_id === targetId) {
        return item;
      }
      if (item.submenu?.items) {
        const found = findMenuItemById(item.submenu.items, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Clone menu item data to banner
  const cloneMenuItemToBanner = (menuItem: MenuItem) => {
    return {
      route: menuItem.route,
      routeArgs: menuItem.routeArgs,
      url: menuItem.url,
      clonedFromMenuId: menuItem.menu_id // Track the source menu ID
    };
  };

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
      formData.append('auth_seed', authSeed || localStorage.getItem('adminAuthSeed') || '');
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);

    if (url) {
      updateBanner(index, { imageUrl: url });
    } else {
    }

    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url && currentBannerIndex !== null) {
      updateBanner(currentBannerIndex, { imageUrl: url });
      setShowAssetPicker(false);
      setCurrentBannerIndex(null);
    }
  };

  const openAssetPicker = (index: number) => {
    setCurrentBannerIndex(index);
    setShowAssetPicker(true);
  };

  // Handle menu cloning
  const handleMenuClone = (index: number, menuId: string) => {
    const menuItem = findMenuItemById(menuItems, menuId);
    if (menuItem) {
      const clonedData = cloneMenuItemToBanner(menuItem);
      // Merge cloned data with existing banner properties
      updateBanner(index, clonedData);
      // Ensure navigation type is set to clone
      setNavigationTypes(prev => ({ ...prev, [index]: 'clone' }));
    }
  };

  // Handle route change with default args
  const handleRouteChange = (index: number, newRoute: string) => {
    const defaultArgs = getDefaultArgsForRoute(newRoute);
    updateBanner(index, { 
      route: newRoute, 
      routeArgs: defaultArgs || {},
      url: undefined // Clear external URL when setting internal route
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-10/12 max-w-5xl h-4/5 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Kelola Banner</h2>
              <p className="text-sm text-gray-600">Tambah, edit, dan hapus banner individual</p>
              {hasUnsavedChanges && (
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                  <AlertTriangle size={12} />
                  <span>Anda memiliki perubahan yang belum disimpan</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>

              <button
                onClick={handleSave}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  hasUnsavedChanges 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-white'
                }`}
                style={!hasUnsavedChanges ? { backgroundColor: THEME_COLOR } : undefined}
              >
                <Save size={16} className="inline mr-2" />
                {hasUnsavedChanges ? 'Simpan Perubahan*' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-3">
              <button
                onClick={addBanner}
                className="flex items-center gap-1 px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
              >
                <Plus size={16} />
                Tambah Banner
              </button>
            </div>

            {localWidget.banners && localWidget.banners.length > 0 ? (
              <div className="space-y-3">
                {localWidget.banners.map((banner, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Banner Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: getBannerColor(index) + '20' }} // 20% opacity
                      onClick={() => toggleBannerExpansion(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getBannerColor(index) }}
                        ></div>
                        <h4 className="text-sm font-medium text-gray-800">Banner {index + 1}</h4>
                        <span className="text-xs text-gray-500">
                          {banner.title || 'Untitled Banner'}
                          {banner.clonedFromMenuId && (
                            <span className="ml-2 text-primary-600 flex items-center gap-1">
                              <Copy size={10} />
                              <span>Cloned</span>
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBanner(index);
                          }}
                          className="text-primary-500 hover:text-primary-700 p-1 rounded hover:bg-primary-50 transition-colors"
                          title="Duplikat banner"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBanner(index);
                          }}
                          className="text-danger-500 hover:text-danger-700 p-1 rounded hover:bg-danger-50 transition-colors"
                          title="Hapus banner"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedBanner === index ? (
                          <ChevronUp size={16} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Banner Content - Expandable with Collapsible Sections */}
                    {expandedBanner === index && (
                      <div className="p-3 bg-gray-50">
                        {/* Image & Title Section */}
                        <CollapsibleSection
                          id={`banner-${index}-image`}
                          title="Gambar & Judul"
                          subtitle={banner.title || 'Belum diatur'}
                          icon={<BannerIcon size={14} className="text-primary-500" />}
                          isExpanded={expandedSection === `banner-${index}-image`}
                          onToggle={handleSectionToggle}
                        >
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 mb-1">URL Gambar</label>
                              <div className="flex gap-1">
                                <input
                                  type="url"
                                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                                  value={banner.imageUrl || ''}
                                  onChange={(e) => updateBanner(index, { imageUrl: e.target.value })}
                                  placeholder="https://..."
                                />
                                <input
                                  ref={(el) => { if (el) fileInputRefs.current[index] = el; }}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileSelect(e, index)}
                                  className="hidden"
                                />
                                {banner.imageUrl && (
                                  <ImageHoverPreview
                                    src={banner.imageUrl}
                                    alt="Banner preview"
                                    thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                                  />
                                )}
                                <button onClick={() => fileInputRefs.current[index]?.click()} className="px-2 py-1 text-white rounded" style={{ backgroundColor: THEME_COLOR }}>
                                  <Upload size={12} />
                                </button>
                                <button onClick={() => openAssetPicker(index)} className="px-2 py-1 bg-success-500 text-white rounded hover:bg-success-600">
                                  <ImageIcon size={12} />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 mb-1">Judul</label>
                              <textarea
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded resize-none"
                                value={banner.title || ''}
                                onChange={(e) => updateBanner(index, { title: e.target.value })}
                                placeholder="Judul banner"
                                rows={2}
                              />
                            </div>
                          </div>
                        </CollapsibleSection>

                        {/* Title Styling Section */}
                        <CollapsibleSection
                          id={`banner-${index}-style`}
                          title="Styling Judul"
                          subtitle={`${banner.titleFontSize ?? 14}px - radius ${banner.borderRadius ?? 12}px`}
                          icon={<Type size={14} className="text-purple-500" />}
                          isExpanded={expandedSection === `banner-${index}-style`}
                          onToggle={handleSectionToggle}
                        >
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] text-gray-600">Font Size</label>
                                <input type="number" className="w-full px-2 py-1 text-xs border border-gray-200 rounded" value={banner.titleFontSize ?? 14} onChange={(e) => updateBanner(index, { titleFontSize: parseFloat(e.target.value) })} min="8" max="32" />
                              </div>
                              <div>
                                <label className="block text-[11px] text-gray-600">Border Radius</label>
                                <input type="number" className="w-full px-2 py-1 text-xs border border-gray-200 rounded" value={banner.borderRadius ?? 12} onChange={(e) => updateBanner(index, { borderRadius: parseFloat(e.target.value) })} min="0" max="50" />
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <label className="flex items-center gap-1 text-xs">
                                <input type="checkbox" className="w-3 h-3" checked={banner.titleTextShadow || false} onChange={(e) => updateBanner(index, { titleTextShadow: e.target.checked })} />
                                Shadow
                              </label>
                              <label className="flex items-center gap-1 text-xs">
                                <input type="checkbox" className="w-3 h-3" checked={banner.titlePosition?.center || false} onChange={(e) => updateBanner(index, { titlePosition: { ...banner.titlePosition, center: e.target.checked } })} />
                                Center
                              </label>
                            </div>
                            {banner.titleTextShadow && (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                                <div>
                                  <label className="block text-[11px] text-gray-600">Shadow Color</label>
                                  <input type="color" className="w-full h-6 rounded border cursor-pointer" value={banner.titleTextShadowColor || '#000000'} onChange={(e) => updateBanner(index, { titleTextShadowColor: e.target.value })} />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-gray-600">Opacity</label>
                                  <input type="number" className="w-full px-2 py-1 text-xs border border-gray-200 rounded" value={banner.titleTextShadowOpacity ?? 0.5} onChange={(e) => updateBanner(index, { titleTextShadowOpacity: parseFloat(e.target.value) })} min="0" max="1" step="0.1" />
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleSection>

                        {/* Position & Padding Section */}
                        <CollapsibleSection
                          id={`banner-${index}-layout`}
                          title="Posisi & Padding"
                          subtitle="Title position, banner padding"
                          icon={<Layout size={14} className="text-orange-500" />}
                          isExpanded={expandedSection === `banner-${index}-layout`}
                          onToggle={handleSectionToggle}
                        >
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 mb-1">Title Position</label>
                              <div className="grid grid-cols-4 gap-1">
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="T" value={banner.titlePosition?.top ?? ''} onChange={(e) => updateBanner(index, { titlePosition: { ...banner.titlePosition, top: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="B" value={banner.titlePosition?.bottom ?? ''} onChange={(e) => updateBanner(index, { titlePosition: { ...banner.titlePosition, bottom: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="L" value={banner.titlePosition?.left ?? ''} onChange={(e) => updateBanner(index, { titlePosition: { ...banner.titlePosition, left: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="R" value={banner.titlePosition?.right ?? ''} onChange={(e) => updateBanner(index, { titlePosition: { ...banner.titlePosition, right: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-600 mb-1">Banner Padding</label>
                              <div className="grid grid-cols-4 gap-1">
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="T" value={banner.padding?.top ?? ''} onChange={(e) => updateBanner(index, { padding: { ...banner.padding, top: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="B" value={banner.padding?.bottom ?? ''} onChange={(e) => updateBanner(index, { padding: { ...banner.padding, bottom: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="L" value={banner.padding?.left ?? ''} onChange={(e) => updateBanner(index, { padding: { ...banner.padding, left: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                                <input type="number" className="w-full px-1 py-1 text-[11px] border border-gray-200 rounded text-center" placeholder="R" value={banner.padding?.right ?? ''} onChange={(e) => updateBanner(index, { padding: { ...banner.padding, right: e.target.value ? parseFloat(e.target.value) : undefined } })} />
                              </div>
                            </div>
                          </div>
                        </CollapsibleSection>

                        {/* Navigation Section */}
                        <CollapsibleSection
                          id={`banner-${index}-nav`}
                          title="Navigasi"
                          subtitle={banner.route || banner.url || 'Tidak ada'}
                          icon={<Navigation size={14} className="text-success-500" />}
                          isExpanded={expandedSection === `banner-${index}-nav`}
                          onToggle={handleSectionToggle}
                        >
                          <div className="space-y-2">
                            <div className="p-2 bg-gray-50 rounded border text-xs">
                              <RouteArgsEditor
                                route={banner.route}
                                url={banner.url}
                                routeArgs={banner.routeArgs}
                                onChange={(config) => {
                                  updateBanner(index, {
                                    route: config.route,
                                    url: config.url,
                                    routeArgs: config.routeArgs,
                                    clonedFromMenuId: undefined
                                  });
                                }}
                                showValidation={true}
                                allowUrlMode={true}
                                allowRouteMode={true}
                              />
                            </div>
                            {menuItems.length > 0 && (
                              <div>
                                <label className="block text-[11px] text-gray-600 mb-1">Clone dari Menu</label>
                                <select
                                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                                  value={banner.clonedFromMenuId || ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleMenuClone(index, e.target.value);
                                    } else {
                                      updateBanner(index, { clonedFromMenuId: undefined });
                                    }
                                  }}
                                >
                                  <option value="">Tidak ada</option>
                                  {menuItems
                                    .filter(item => item.route && (item.route === '/product' || item.route === '/webview'))
                                    .map((item) => (
                                      <option key={item.menu_id || item.id} value={item.menu_id || item.id}>
                                        {item.title} - {item.route}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </CollapsibleSection>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Banner</h3>
                <p className="text-sm text-gray-500 mb-4">Mulai dengan menambahkan banner pertama</p>
                <button
                  onClick={addBanner}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors mx-auto"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  <Plus size={16} />
                  Tambah Banner Pertama
                </button>
              </div>
            )}
          </div>

          {/* Footer - Removed since buttons are now in header */}
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedChangesDialog && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-96 max-w-[90vw] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Perubahan Belum Disimpan</h3>
                <p className="text-sm text-gray-600">Anda memiliki perubahan yang belum disimpan yang akan hilang.</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menutup editor? Semua perubahan yang belum disimpan akan hilang.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Lanjutkan Mengedit
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Buang Perubahan
              </button>
            </div>
          </div>
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
                  setCurrentBannerIndex(null);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager 
                authSeed={authSeed || localStorage.getItem('adminAuthSeed') || ''}
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleAssetSelect}
              />
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800 mb-2">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk memilih dan menerapkan ke field URL Gambar secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerEditor;
