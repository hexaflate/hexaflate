import React, { useState, useRef, useEffect } from "react";
import {
  GlobalTheming,
  ThemeColors,
  WelcomePoster,
  MenuItem,
} from "../../types";
import { ChevronDown, ChevronUp, MapPin, Info, Upload, Image as ImageIcon, X, Palette, Settings, ImageIcon as PosterIcon, Sun, Moon } from "lucide-react";

interface NativeColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const NativeColorPicker: React.FC<NativeColorPickerProps> = ({ color, onChange }) => {
  const [inputValue, setInputValue] = useState(color);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };

  const handleInputBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(color);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 p-0 border border-neutral-200/80 rounded-lg cursor-pointer"
      />
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="w-24 px-2.5 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
        placeholder="#000000"
      />
    </div>
  );
};

interface ColorFieldProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

const ColorField: React.FC<ColorFieldProps> = ({ label, color, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700">{label}</span>
    <NativeColorPicker color={color} onChange={onChange} />
  </div>
);
import {
  getRoutesByCategory,
  getDefaultArgsForRoute,
  doesRouteRequireArgs,
  findRouteByValue,
} from "../../data/routeConfig";
import RouteArgsConfig from "../RouteArgsConfig";
import AssetsManager from "../AssetsManager";
import ImageHoverPreview from "../ImageHoverPreview";
import { getApiUrl, X_TOKEN_VALUE } from "../../config/api";
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../../utils/themeColors';

interface GlobalConfigEditorProps {
  globalConfig?: GlobalTheming;
  onUpdate: (config: GlobalTheming) => void;
  showThemingOnly?: boolean;
  menuItems?: MenuItem[]; // Available menu items for cloning
  authSeed?: string;
}

const GlobalConfigEditor: React.FC<GlobalConfigEditorProps> = ({
  globalConfig,
  onUpdate,
  showThemingOnly = false,
  menuItems = [],
  authSeed = "",
}) => {
  const [config, setConfig] = useState<GlobalTheming>(
    globalConfig ||
      ({
        lightTheme: {
          surfaceColor: "#fafafa",
          gradiantButtonTailColor: "#085EA5",
          gradiantButtonDisabledColor: "#FFE0E0E0",
          gradiantButtonDisabledTextColor: "#FFD3D3D3",
          paragraphTextColor: "#555555",
        },
        darkTheme: {
          surfaceColor: "#191724",
          gradiantButtonTailColor: "#9ccfd8",
          gradiantButtonDisabledColor: "#403d52",
          gradiantButtonDisabledTextColor: "#524f67",
          paragraphTextColor: "#f6c177",
        },
        containerBorderRadius: 30,
        welcomePoster: {
          imageUrl: "",
          title: "Selamat Datang di Aplikasi Kami",
          route: "/product",
          routeArgs: {
            operators: ["TSELREG"],
            hintText: "Nomor HP Pelanggan",
          },
          autoDismissSeconds: 10,
        },
        loginMarkdownUrl: "",
      } as GlobalTheming),
  );

  const updateTheme = (
    theme: "lightTheme" | "darkTheme",
    updates: Partial<ThemeColors>,
  ) => {
    const updatedConfig = {
      ...config,
      [theme]: {
        ...config[theme],
        ...updates,
      },
    };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateWelcomePoster = (updates: Partial<WelcomePoster>) => {
    const updatedConfig = {
      ...config,
      welcomePoster: {
        ...config.welcomePoster,
        ...updates,
      },
    } as GlobalTheming;
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateGlobalSettings = (updates: Partial<GlobalTheming>) => {
    const updatedConfig = { ...config, ...updates };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  // Expanded section state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);

    if (url) {
      updateWelcomePoster({ imageUrl: url });
    } else {
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url) {
      updateWelcomePoster({ imageUrl: url });
      setShowAssetPicker(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-3">
        {!showThemingOnly && (
          <>
            {/* Global Settings - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('global')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-primary-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">Pengaturan Global</h3>
                    <p className="text-xs text-gray-500">Border radius: {config.containerBorderRadius ?? 30}px</p>
                  </div>
                </div>
                {expandedSection === 'global' ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {expandedSection === 'global' && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Radius Batas Container</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={config.containerBorderRadius ?? 30}
                        onChange={(e) => updateGlobalSettings({ containerBorderRadius: Number(e.target.value) })}
                        className="flex-1"
                        min="0"
                        max="50"
                      />
                      <span className="text-sm text-gray-600 w-12 text-right">{config.containerBorderRadius ?? 30}px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Welcome Poster - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('poster')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PosterIcon size={18} className="text-purple-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">Welcome Poster</h3>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                      {config.welcomePoster?.title || 'Belum dikonfigurasi'}
                    </p>
                  </div>
                </div>
                {expandedSection === 'poster' ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {expandedSection === 'poster' && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL Gambar</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={config.welcomePoster?.imageUrl || ""}
                        onChange={(e) => updateWelcomePoster({ imageUrl: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                        className="flex-1 px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                      />
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                      {config.welcomePoster?.imageUrl && (
                        <ImageHoverPreview
                          src={config.welcomePoster.imageUrl}
                          alt="Welcome poster preview"
                          thumbnailClassName="flex-shrink-0 w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-100"
                        />
                      )}
                      <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors">
                        <Upload size={14} />
                      </button>
                      <button onClick={() => setShowAssetPicker(true)} className="px-2 py-1.5 bg-success-500 text-white rounded hover:bg-success-600 transition-colors">
                        <ImageIcon size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
                    <input
                      type="text"
                      value={config.welcomePoster?.title || ""}
                      onChange={(e) => updateWelcomePoster({ title: e.target.value })}
                      placeholder="Selamat Datang"
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                    />
                  </div>

                  {/* Route */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <MapPin className="inline w-3 h-3 mr-1" />
                      Rute
                    </label>
                    <select
                      value={config.welcomePoster?.route || ""}
                      onChange={(e) => {
                        const selectedRoute = e.target.value;
                        const defaultArgs = getDefaultArgsForRoute(selectedRoute);
                        updateWelcomePoster({ route: selectedRoute, routeArgs: defaultArgs || {} });
                      }}
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                    >
                      <option value="">Pilih rute...</option>
                      {Object.entries(getRoutesByCategory()).map(([category, routes]) => (
                        <optgroup key={category} label={category}>
                          {routes.map((route) => (
                            <option key={route.value} value={route.value}>{route.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Route Args */}
                  {config.welcomePoster?.route && (
                    <div className="p-3 bg-gray-50 rounded border text-sm">
                      <RouteArgsConfig
                        route={config.welcomePoster.route}
                        routeArgs={config.welcomePoster.routeArgs}
                        onChange={(routeArgs) => updateWelcomePoster({ routeArgs })}
                      />
                    </div>
                  )}

                  {/* Auto Dismiss */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Otomatis Tutup</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={config.welcomePoster?.autoDismissSeconds || 10}
                        onChange={(e) => updateWelcomePoster({ autoDismissSeconds: Number(e.target.value) })}
                        className="w-20 px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                        min="0"
                        max="60"
                      />
                      <span className="text-xs text-gray-500">detik</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Light Theme - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('light')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sun size={18} className="text-yellow-500" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">Tema Terang</h3>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.lightTheme?.surfaceColor }} />
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.lightTheme?.gradiantButtonTailColor }} />
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.lightTheme?.paragraphTextColor }} />
                </div>
              </div>
            </div>
            {expandedSection === 'light' ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {expandedSection === 'light' && (
            <div className="px-4 pb-4 border-t border-gray-100 divide-y divide-gray-100">
              <ColorField label="Warna Permukaan" color={config.lightTheme?.surfaceColor || "#fafafa"} onChange={(c) => updateTheme('lightTheme', { surfaceColor: c })} />
              <ColorField label="Warna Tombol Gradien" color={config.lightTheme?.gradiantButtonTailColor || "#085EA5"} onChange={(c) => updateTheme('lightTheme', { gradiantButtonTailColor: c })} />
              <ColorField label="Warna Tombol Nonaktif" color={config.lightTheme?.gradiantButtonDisabledColor || "#FFE0E0E0"} onChange={(c) => updateTheme('lightTheme', { gradiantButtonDisabledColor: c })} />
              <ColorField label="Warna Teks Nonaktif" color={config.lightTheme?.gradiantButtonDisabledTextColor || "#FFD3D3D3"} onChange={(c) => updateTheme('lightTheme', { gradiantButtonDisabledTextColor: c })} />
              <ColorField label="Warna Teks Paragraf" color={config.lightTheme?.paragraphTextColor || "#555555"} onChange={(c) => updateTheme('lightTheme', { paragraphTextColor: c })} />
            </div>
          )}
        </div>

        {/* Dark Theme - Collapsible */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('dark')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-primary-500" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">Tema Gelap</h3>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.darkTheme?.surfaceColor }} />
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.darkTheme?.gradiantButtonTailColor }} />
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: config.darkTheme?.paragraphTextColor }} />
                </div>
              </div>
            </div>
            {expandedSection === 'dark' ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {expandedSection === 'dark' && (
            <div className="px-4 pb-4 border-t border-gray-100 divide-y divide-gray-100">
              <ColorField label="Warna Permukaan" color={config.darkTheme?.surfaceColor || "#191724"} onChange={(c) => updateTheme('darkTheme', { surfaceColor: c })} />
              <ColorField label="Warna Tombol Gradien" color={config.darkTheme?.gradiantButtonTailColor || "#9ccfd8"} onChange={(c) => updateTheme('darkTheme', { gradiantButtonTailColor: c })} />
              <ColorField label="Warna Tombol Nonaktif" color={config.darkTheme?.gradiantButtonDisabledColor || "#403d52"} onChange={(c) => updateTheme('darkTheme', { gradiantButtonDisabledColor: c })} />
              <ColorField label="Warna Teks Nonaktif" color={config.darkTheme?.gradiantButtonDisabledTextColor || "#524f67"} onChange={(c) => updateTheme('darkTheme', { gradiantButtonDisabledTextColor: c })} />
              <ColorField label="Warna Teks Paragraf" color={config.darkTheme?.paragraphTextColor || "#f6c177"} onChange={(c) => updateTheme('darkTheme', { paragraphTextColor: c })} />
            </div>
          )}
        </div>

        {/* Theme Preview - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Pratinjau</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Light */}
            <div className="rounded-lg p-3 border" style={{ backgroundColor: config.lightTheme?.surfaceColor }}>
              <p className="text-xs mb-2" style={{ color: config.lightTheme?.paragraphTextColor }}>Terang</p>
              <div className="h-6 rounded" style={{ backgroundColor: config.lightTheme?.gradiantButtonTailColor }} />
              <div className="h-6 rounded mt-1 flex items-center justify-center text-xs" style={{ backgroundColor: config.lightTheme?.gradiantButtonDisabledColor, color: config.lightTheme?.gradiantButtonDisabledTextColor }}>
                Nonaktif
              </div>
            </div>
            {/* Dark */}
            <div className="rounded-lg p-3 border" style={{ backgroundColor: config.darkTheme?.surfaceColor }}>
              <p className="text-xs mb-2" style={{ color: config.darkTheme?.paragraphTextColor }}>Gelap</p>
              <div className="h-6 rounded" style={{ backgroundColor: config.darkTheme?.gradiantButtonTailColor }} />
              <div className="h-6 rounded mt-1 flex items-center justify-center text-xs" style={{ backgroundColor: config.darkTheme?.gradiantButtonDisabledColor, color: config.darkTheme?.gradiantButtonDisabledTextColor }}>
                Nonaktif
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih atau Upload Asset</h3>
              <button onClick={() => setShowAssetPicker(false)} className="p-1 text-gray-600 hover:text-gray-800 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager 
                authSeed={authSeed || localStorage.getItem('adminAuthSeed') || ''}
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleAssetSelect}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalConfigEditor;
