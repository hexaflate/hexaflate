import React, { useState, useRef } from "react";
import { ContentSection, MenuItem, ScreenConfig } from "../types";
import {
  Trees,
  Image,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Settings,
  Type,
  ImageIcon,
  CreditCard,
  History,
  LayoutList,
  Wallet,
  Upload,
  X,
} from "lucide-react";
import MenuEditor from "./MenuEditor";
import BannerEditor from "./BannerEditor";
import CardsEditor from "./CardsEditor";
import AssetsManager from "./AssetsManager";
import ImageHoverPreview from "./ImageHoverPreview";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface PropertyPanelProps {
  widget: ContentSection | null;
  onUpdateWidget: (
    instanceId: string,
    updates: Partial<ContentSection>,
  ) => void;
  screen?: ScreenConfig; // Current screen data to access menu items
  authSeed?: string;
}

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  expandedSection: string | null;
  onToggle: (id: string) => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  subtitle,
  icon,
  children,
  expandedSection,
  onToggle,
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-neutral-100/80 overflow-hidden mb-3 shadow-sm hover:shadow-md transition-all duration-200">
    <button
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-neutral-100 rounded-lg">{icon}</div>
        <div className="text-left">
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div
        className={`p-1 rounded-lg transition-all duration-200 ${expandedSection === id ? "" : "text-neutral-400"}`}
        style={expandedSection === id ? { backgroundColor: withOpacity(THEME_COLOR, 0.1), color: THEME_COLOR } : undefined}
      >
        {expandedSection === id ? (
          <ChevronUp size={16} />
        ) : (
          <ChevronDown size={16} />
        )}
      </div>
    </button>
    {expandedSection === id && (
      <div className="px-4 pb-4 border-t border-neutral-100/80 pt-4 animate-fade-in">
        {children}
      </div>
    )}
  </div>
);

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  widget,
  onUpdateWidget,
  screen,
  authSeed = "",
}) => {
  const [showMenuEditor, setShowMenuEditor] = useState(false);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [showCardsEditor, setShowCardsEditor] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Asset picker/uploader state for balance card
  const [showBalanceAssetPicker, setShowBalanceAssetPicker] = useState(false);
  const [balanceAssetsRefreshTrigger, setBalanceAssetsRefreshTrigger] =
    useState(0);
  const balanceFileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Helper function to get public URL for assets
  const getPublicUrl = async (filename: string) => {
    const cleanFilename = filename
      .replace(/^\/assets\//, "")
      .replace(/^\//, "");
    const apiUrl = await getApiUrl("");
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  // Handle file upload for balance card image
  const handleBalanceUploadFile = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return null;
      }

      const formData = new FormData();
      formData.append("session_key", sessionKey);
      formData.append(
        "auth_seed",
        authSeed || localStorage.getItem("adminAuthSeed") || "",
      );
      formData.append("file", file);

      const apiUrl = await getApiUrl("/admin/assets/upload");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "X-Token": X_TOKEN_VALUE,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        let filename = null;
        let publicUrl = null;

        if (data.filename) {
          filename = data.filename;
        } else if (data.asset?.filename) {
          filename = data.asset.filename;
        } else if (data.file_url) {
          const urlParts = data.file_url.split("/");
          filename = urlParts[urlParts.length - 1];
        }

        if (data.public_url) {
          publicUrl = data.public_url;
        } else if (data.asset?.public_url) {
          publicUrl = data.asset.public_url;
        } else if (data.file_url) {
          publicUrl = data.file_url;
        }

        if (publicUrl && publicUrl.startsWith("/")) {
          const baseUrl = await getApiUrl("");
          publicUrl = `${baseUrl}${publicUrl}`;
        }

        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }

        if (publicUrl) {
          setBalanceAssetsRefreshTrigger((prev) => prev + 1);
          return publicUrl;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Handle file selection for balance card image
  const handleBalanceFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !widget) return;

    const url = await handleBalanceUploadFile(file);
    if (url) {
      onUpdateWidget(widget.instanceId!, { balance_card_image: url });
    }

    if (balanceFileInputRef.current) {
      balanceFileInputRef.current.value = "";
    }
  };

  // Handle asset selection from picker for balance card
  const handleBalanceAssetSelect = (url: string) => {
    if (url && widget) {
      onUpdateWidget(widget.instanceId!, { balance_card_image: url });
      setShowBalanceAssetPicker(false);
    }
  };

  if (!widget) {
    return (
      <div className="h-full bg-gradient-to-b from-white/90 to-neutral-50/90 backdrop-blur-sm border-l border-neutral-200/60 p-6">
        <div className="text-center text-neutral-500 flex flex-col items-center justify-center h-full">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
            style={{ background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.15)}, ${withOpacity(THEME_COLOR, 0.1)})` }}
          >
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">
            Tidak Ada Widget Dipilih
          </h3>
          <p className="text-sm text-neutral-500">
            Pilih widget untuk mengedit propertinya
          </p>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<ContentSection>) => {
    onUpdateWidget(widget.instanceId, updates);
  };

  // Get all menu items from the current screen for cloning
  const getAllMenuItems = (): MenuItem[] => {
    if (!screen?.content) return [];

    const menuItems: MenuItem[] = [];

    const extractMenuItems = (items: MenuItem[]) => {
      items.forEach((item) => {
        menuItems.push(item);
        if (item.submenu?.items) {
          extractMenuItems(item.submenu.items);
        }
      });
    };

    screen.content.forEach((widget) => {
      if (widget.items) {
        extractMenuItems(widget.items);
      }
    });

    return menuItems;
  };

  const renderGeneralProperties = () => (
    <CollapsibleSection
      id="general"
      title="Properti Umum"
      subtitle={widget.id}
      icon={<Settings size={16} className="text-gray-500" />}
      expandedSection={expandedSection}
      onToggle={toggleSection}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Jenis Widget
          </label>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded"
            value={widget.id}
            disabled
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Instance ID
          </label>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-200 rounded"
            value={widget.instanceId}
            disabled
          />
        </div>
      </div>
    </CollapsibleSection>
  );

  const renderMenuGroupProperties = () => (
    <>
      {/* Frame Configuration */}
      <CollapsibleSection
        id="frame"
        title="Konfigurasi Frame"
        subtitle={
          widget.frame
            ? `${widget.frame.width}×${widget.frame.height}px`
            : "Nonaktif"
        }
        icon={<LayoutList size={16} className="text-purple-500" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Aktifkan Frame</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!widget.frame}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleUpdate({
                      frame: {
                        width: 60,
                        height: 60,
                        borderRadius: 20,
                        borderLine: true,
                        shadow: true,
                        padding: { top: 8, bottom: 8, left: 8, right: 8 },
                      },
                    });
                  } else {
                    handleUpdate({ frame: undefined });
                  }
                }}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {widget.frame && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lebar
                  </label>
                  <input
                    type="number"
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                    value={widget.frame?.width ?? 60}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          width: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="20"
                    max="200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tinggi
                  </label>
                  <input
                    type="number"
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                    value={widget.frame?.height ?? 60}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          height: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="20"
                    max="200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Border Radius
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    className="flex-1"
                    value={widget.frame?.borderRadius ?? 20}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          borderRadius: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <span className="text-sm text-gray-500 w-8">
                    {widget.frame?.borderRadius ?? 20}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={widget.frame?.borderLine || false}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          borderLine: e.target.checked,
                        },
                      })
                    }
                  />
                  Border
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={widget.frame?.shadow || false}
                    onChange={(e) =>
                      handleUpdate({
                        frame: { ...widget.frame!, shadow: e.target.checked },
                      })
                    }
                  />
                  Shadow
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Padding
                </label>
                <div className="grid grid-cols-4 gap-1">
                  <input
                    type="number"
                    className="w-full px-1 py-1.5 text-sm border border-gray-200 rounded text-center"
                    placeholder="T"
                    value={widget.frame?.padding?.top ?? 8}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          padding: {
                            ...widget.frame?.padding,
                            top: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    className="w-full px-1 py-1.5 text-sm border border-gray-200 rounded text-center"
                    placeholder="B"
                    value={widget.frame?.padding?.bottom ?? 8}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          padding: {
                            ...widget.frame?.padding,
                            bottom: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    className="w-full px-1 py-1.5 text-sm border border-gray-200 rounded text-center"
                    placeholder="L"
                    value={widget.frame?.padding?.left ?? 8}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          padding: {
                            ...widget.frame?.padding,
                            left: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    className="w-full px-1 py-1.5 text-sm border border-gray-200 rounded text-center"
                    placeholder="R"
                    value={widget.frame?.padding?.right ?? 8}
                    onChange={(e) =>
                      handleUpdate({
                        frame: {
                          ...widget.frame!,
                          padding: {
                            ...widget.frame?.padding,
                            right: parseFloat(e.target.value),
                          },
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Menu Editor */}
      <CollapsibleSection
        id="menu"
        title="Item Menu"
        subtitle={`${widget.items?.length || 0} item`}
        icon={<Trees size={16} className="text-success-500" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <button
            onClick={() => setShowMenuEditor(true)}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-white rounded transition-colors text-sm"
            style={{ backgroundColor: THEME_COLOR }}
          >
            <Trees size={14} />
            Buka Editor Menu
          </button>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• {widget.items?.length || 0} menu utama</div>
            <div>
              • {widget.items?.filter((item) => item.submenu).length || 0}{" "}
              dengan submenu
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );

  const renderTitleProperties = () => (
    <CollapsibleSection
      id="title"
      title="Properti Judul"
      subtitle={widget.title?.text || "Belum diatur"}
      icon={<Type size={16} style={{ color: THEME_COLOR }} />}
      expandedSection={expandedSection}
      onToggle={toggleSection}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Teks
          </label>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
            value={widget.title?.text || ""}
            onChange={(e) =>
              handleUpdate({
                title: {
                  ...widget.title,
                  text: e.target.value,
                  type: widget.title?.type || "h6",
                  display: widget.title?.display || "left",
                  color: widget.title?.color || "#000000",
                  darkModeColor: widget.title?.darkModeColor || "#ffffff",
                },
              })
            }
            placeholder="Masukkan teks"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Jenis
            </label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
              value={widget.title?.type || "h6"}
              onChange={(e) =>
                handleUpdate({
                  title: {
                    text: widget.title?.text || "Judul",
                    type: e.target.value as any,
                    display: widget.title?.display || "left",
                    color: widget.title?.color || "#000000",
                    darkModeColor: widget.title?.darkModeColor || "#ffffff",
                  },
                })
              }
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Posisi
            </label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
              value={widget.title?.display || "left"}
              onChange={(e) =>
                handleUpdate({
                  title: {
                    text: widget.title?.text || "Judul",
                    type: widget.title?.type || "h6",
                    display: e.target.value as any,
                    color: widget.title?.color || "#000000",
                    darkModeColor: widget.title?.darkModeColor || "#ffffff",
                  },
                })
              }
            >
              <option value="left">Kiri</option>
              <option value="center">Tengah</option>
              <option value="right">Kanan</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Warna Terang
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-8 h-8 flex-shrink-0 rounded border cursor-pointer"
                value={widget.title?.color || "#000000"}
                onChange={(e) =>
                  handleUpdate({
                    title: { ...widget.title!, color: e.target.value },
                  })
                }
              />
              <input
                type="text"
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                value={widget.title?.color || "#000000"}
                onChange={(e) =>
                  handleUpdate({
                    title: { ...widget.title!, color: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Warna Gelap
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-8 h-8 flex-shrink-0 rounded border cursor-pointer"
                value={widget.title?.darkModeColor || "#ffffff"}
                onChange={(e) =>
                  handleUpdate({
                    title: { ...widget.title!, darkModeColor: e.target.value },
                  })
                }
              />
              <input
                type="text"
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                value={widget.title?.darkModeColor || "#ffffff"}
                onChange={(e) =>
                  handleUpdate({
                    title: { ...widget.title!, darkModeColor: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );

  const renderBannerSliderProperties = () => (
    <>
      {/* Layout & Dimensions */}
      <CollapsibleSection
        id="banner-layout"
        title="Layout & Dimensi"
        subtitle={`${widget.layoutVariant || "default"} - ${widget.height || 200}px`}
        icon={<ImageIcon size={16} className="text-orange-500" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Varian
            </label>
            <select
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
              value={widget.layoutVariant || "default"}
              onChange={(e) =>
                handleUpdate({ layoutVariant: e.target.value as any })
              }
            >
              <option value="default">Default</option>
              <option value="monocle">Monocle</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tinggi
              </label>
              <input
                type="number"
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                value={widget.height ?? 200}
                onChange={(e) =>
                  handleUpdate({ height: parseFloat(e.target.value) })
                }
                min="100"
                max="500"
              />
            </div>
            {widget.layoutVariant === "monocle" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Lebar
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                  value={widget.width ?? 150}
                  onChange={(e) =>
                    handleUpdate({ width: parseFloat(e.target.value) })
                  }
                  min="100"
                  max="300"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Jarak
              </label>
              <input
                type="number"
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                value={widget.spacing ?? 16}
                onChange={(e) =>
                  handleUpdate({ spacing: parseFloat(e.target.value) })
                }
                min="0"
                max="50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Border Radius
              </label>
              <input
                type="number"
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                value={widget.borderRadius ?? 12}
                onChange={(e) =>
                  handleUpdate({ borderRadius: parseFloat(e.target.value) })
                }
                min="0"
                max="50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Warna Background
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-8 h-8 flex-shrink-0 rounded border cursor-pointer"
                value={widget.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  handleUpdate({ backgroundColor: e.target.value })
                }
              />
              <input
                type="text"
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                value={widget.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  handleUpdate({ backgroundColor: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Options */}
      <CollapsibleSection
        id="banner-options"
        title="Opsi Banner"
        subtitle={widget.autoSlide ? "Auto-slide aktif" : "Manual"}
        icon={<Settings size={16} className="text-gray-500" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          {widget.layoutVariant !== "monocle" && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Geser Otomatis</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={widget.autoSlide || false}
                    onChange={(e) =>
                      handleUpdate({ autoSlide: e.target.checked })
                    }
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              {widget.autoSlide && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Interval (detik)
                  </label>
                  <input
                    type="number"
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                    value={widget.autoSlideInterval ?? 5}
                    onChange={(e) =>
                      handleUpdate({
                        autoSlideInterval: parseFloat(e.target.value),
                      })
                    }
                    min="1"
                    max="30"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* Banner Items */}
      <CollapsibleSection
        id="banner-items"
        title="Item Banner"
        subtitle={`${widget.banners?.length || 0} banner`}
        icon={<Image size={16} className="text-success-500" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <button
            onClick={() => setShowBannerEditor(true)}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-white rounded transition-colors text-sm"
            style={{ backgroundColor: THEME_COLOR }}
          >
            <Image size={14} />
            Kelola Banner
          </button>
          <div className="text-xs text-gray-500">
            {widget.banners?.length || 0} banner terdaftar
          </div>
        </div>
      </CollapsibleSection>
    </>
  );

  const renderHistoryProperties = () => (
    <CollapsibleSection
      id="history"
      title="Properti Riwayat"
      subtitle={`${widget.count ?? 3} transaksi`}
      icon={<History size={16} style={{ color: THEME_COLOR }} />}
      expandedSection={expandedSection}
      onToggle={toggleSection}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Jumlah Transaksi
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="flex-1"
              value={widget.count ?? 3}
              onChange={(e) =>
                handleUpdate({ count: parseInt(e.target.value) || 3 })
              }
              min="1"
              max="20"
            />
            <span className="text-sm text-gray-500 w-6">
              {widget.count ?? 3}
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Menampilkan transaksi terbaru secara otomatis
        </div>
      </div>
    </CollapsibleSection>
  );

  const renderCardsProperties = () => {
    const cards = widget.cards || [];

    return (
      <CollapsibleSection
        id="cards"
        title="Properti Kartu"
        subtitle={`${cards.length} kartu - ${widget.gridColumns || 2} kolom`}
        icon={<CreditCard size={16} className="text-pink-500" />}
        expandedSection={expandedSection}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <button
            onClick={() => setShowCardsEditor(true)}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-white rounded transition-colors text-sm"
            style={{ backgroundColor: THEME_COLOR }}
          >
            <LayoutGrid size={14} />
            Kelola Kartu
          </button>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• {cards.length} kartu</div>
            <div>• Grid: {widget.gridColumns || 2} kolom</div>
            <div>• Jarak: {widget.spacing || 12}px</div>
          </div>
        </div>
      </CollapsibleSection>
    );
  };

  const renderBalanceCardProperties = () => {
    const backgroundType = widget.balance_card_background || "none";
    const variant = widget.balance_card_variant || 1;

    return (
      <>
        {/* Layout */}
        <CollapsibleSection
          id="balance-layout"
          title="Layout & Style"
          subtitle={`Varian ${variant} - ${widget.borderRadius ?? 16}px radius`}
          icon={<Wallet size={16} className="text-emerald-500" />}
          expandedSection={expandedSection}
          onToggle={toggleSection}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Varian
              </label>
              <select
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                value={variant}
                onChange={(e) =>
                  handleUpdate({
                    balance_card_variant: parseInt(e.target.value),
                  })
                }
              >
                <option value={1}>1 - Horizontal</option>
                <option value={2}>2 - Centered</option>
                <option value={3}>3 - Compact</option>
                <option value={4}>4 - Split Card</option>
                <option value={5}>5 - Floating</option>
                <option value={6}>6 - Bottom Bar</option>
                <option value={7}>7 - Modern Box</option>
                <option value={8}>8 - Full Width</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Border Radius
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  className="flex-1"
                  value={widget.borderRadius ?? 16}
                  onChange={(e) =>
                    handleUpdate({
                      borderRadius: parseInt(e.target.value) || 16,
                    })
                  }
                  min="0"
                  max="50"
                />
                <span className="text-sm text-gray-500 w-6">
                  {widget.borderRadius ?? 16}
                </span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Background */}
        <CollapsibleSection
          id="balance-bg"
          title="Background"
          subtitle={backgroundType === "none" ? "Tema Adaptif" : backgroundType}
          icon={<Settings size={16} className="text-gray-500" />}
          expandedSection={expandedSection}
          onToggle={toggleSection}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tipe
              </label>
              <select
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                value={backgroundType}
                onChange={(e) =>
                  handleUpdate({
                    balance_card_background: e.target.value as any,
                  })
                }
              >
                <option value="none">Tema Adaptif</option>
                <option value="solid">Warna Solid</option>
                <option value="gradient">Gradient</option>
                <option value="image">Gambar</option>
              </select>
            </div>

            {backgroundType === "solid" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Warna
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 flex-shrink-0 rounded border cursor-pointer"
                    value={widget.balance_card_color || "#4A90D9"}
                    onChange={(e) =>
                      handleUpdate({ balance_card_color: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                    value={widget.balance_card_color || "#4A90D9"}
                    onChange={(e) =>
                      handleUpdate({ balance_card_color: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {backgroundType === "gradient" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Warna 1
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-8 h-8 flex-shrink-0 rounded border cursor-pointer"
                        value={
                          widget.balance_card_gradient?.colors?.[0] || "#4A90D9"
                        }
                        onChange={(e) => {
                          const colors = widget.balance_card_gradient
                            ?.colors || ["#4A90D9", "#50C878"];
                          handleUpdate({
                            balance_card_gradient: {
                              ...widget.balance_card_gradient,
                              colors: [e.target.value, colors[1]],
                              begin:
                                widget.balance_card_gradient?.begin ||
                                "topLeft",
                              end:
                                widget.balance_card_gradient?.end ||
                                "bottomRight",
                            },
                          });
                        }}
                      />
                      <input
                        type="text"
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 rounded"
                        value={
                          widget.balance_card_gradient?.colors?.[0] || "#4A90D9"
                        }
                        onChange={(e) => {
                          const colors = widget.balance_card_gradient
                            ?.colors || ["#4A90D9", "#50C878"];
                          handleUpdate({
                            balance_card_gradient: {
                              ...widget.balance_card_gradient,
                              colors: [e.target.value, colors[1]],
                              begin:
                                widget.balance_card_gradient?.begin ||
                                "topLeft",
                              end:
                                widget.balance_card_gradient?.end ||
                                "bottomRight",
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Warna 2
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-8 h-8 flex-shrink-0 rounded border cursor-pointer"
                        value={
                          widget.balance_card_gradient?.colors?.[1] || "#50C878"
                        }
                        onChange={(e) => {
                          const colors = widget.balance_card_gradient
                            ?.colors || ["#4A90D9", "#50C878"];
                          handleUpdate({
                            balance_card_gradient: {
                              ...widget.balance_card_gradient,
                              colors: [colors[0], e.target.value],
                              begin:
                                widget.balance_card_gradient?.begin ||
                                "topLeft",
                              end:
                                widget.balance_card_gradient?.end ||
                                "bottomRight",
                            },
                          });
                        }}
                      />
                      <input
                        type="text"
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 rounded"
                        value={
                          widget.balance_card_gradient?.colors?.[1] || "#50C878"
                        }
                        onChange={(e) => {
                          const colors = widget.balance_card_gradient
                            ?.colors || ["#4A90D9", "#50C878"];
                          handleUpdate({
                            balance_card_gradient: {
                              ...widget.balance_card_gradient,
                              colors: [colors[0], e.target.value],
                              begin:
                                widget.balance_card_gradient?.begin ||
                                "topLeft",
                              end:
                                widget.balance_card_gradient?.end ||
                                "bottomRight",
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Arah
                  </label>
                  <select
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                    value={`${widget.balance_card_gradient?.begin || "topLeft"}-${widget.balance_card_gradient?.end || "bottomRight"}`}
                    onChange={(e) => {
                      const [begin, end] = e.target.value.split("-");
                      handleUpdate({
                        balance_card_gradient: {
                          ...widget.balance_card_gradient,
                          colors: widget.balance_card_gradient?.colors || [
                            "#4A90D9",
                            "#50C878",
                          ],
                          begin,
                          end,
                        },
                      });
                    }}
                  >
                    <option value="topLeft-bottomRight">
                      ↘ Kiri Atas → Kanan Bawah
                    </option>
                    <option value="topRight-bottomLeft">
                      ↙ Kanan Atas → Kiri Bawah
                    </option>
                    <option value="topCenter-bottomCenter">
                      ↓ Atas → Bawah
                    </option>
                    <option value="centerLeft-centerRight">
                      → Kiri → Kanan
                    </option>
                  </select>
                </div>
              </>
            )}

            {backgroundType === "image" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  URL Gambar
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="min-w-0 flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded"
                    value={widget.balance_card_image || ""}
                    onChange={(e) =>
                      handleUpdate({ balance_card_image: e.target.value })
                    }
                    placeholder="https://..."
                  />
                  <input
                    ref={balanceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBalanceFileSelect}
                    className="hidden"
                  />
                  {widget.balance_card_image && (
                    <ImageHoverPreview
                      src={widget.balance_card_image}
                      alt="Balance card preview"
                      thumbnailClassName="flex-shrink-0 w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-100"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => balanceFileInputRef.current?.click()}
                    className="flex-shrink-0 px-2 py-1.5 text-white rounded transition-colors"
                    style={{ backgroundColor: THEME_COLOR }}
                    title="Upload gambar"
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBalanceAssetPicker(true)}
                    className="flex-shrink-0 px-2 py-1.5 bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
                    title="Pilih dari assets"
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </>
    );
  };

  const getPropertyEditor = () => {
    switch (widget.id) {
      case "title":
        return renderTitleProperties();
      case "banner_slider":
        return renderBannerSliderProperties();
      case "history":
        return renderHistoryProperties();
      case "cards":
        return renderCardsProperties();
      case "balance_card":
        return renderBalanceCardProperties();
      default:
        if (widget.items) {
          return renderMenuGroupProperties();
        }
        return (
          <CollapsibleSection
            id="default"
            title="Properti Widget"
            subtitle="Tidak ada properti khusus"
            icon={<Settings size={16} className="text-gray-400" />}
            expandedSection={expandedSection}
            onToggle={toggleSection}
          >
            <div className="text-xs text-gray-500">
              Tidak ada properti khusus untuk widget ini.
            </div>
          </CollapsibleSection>
        );
    }
  };

  return (
    <>
      <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col w-64">
        {/* Header */}
        <div className="flex-shrink-0 px-3 py-3 border-b border-gray-200 bg-white">
          <h2 className="text-sm font-semibold text-gray-800">Properti</h2>
          <p className="text-xs text-gray-500">{widget.id}</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-2 property-panel-scrollable overflow-x-hidden">
          {renderGeneralProperties()}
          {getPropertyEditor()}
        </div>
      </div>

      {/* Menu Editor Modal */}
      {showMenuEditor && (
        <MenuEditor
          items={widget.items || []}
          onSave={(items) => {

            handleUpdate({ items });
            setShowMenuEditor(false);
          }}
          onClose={() => setShowMenuEditor(false)}
        />
      )}

      {/* Banner Editor Modal */}
      {showBannerEditor && (
        <BannerEditor
          widget={widget}
          menuItems={getAllMenuItems()}
          onSave={(updates) => {

            handleUpdate(updates);
            setShowBannerEditor(false);
          }}
          onClose={() => setShowBannerEditor(false)}
        />
      )}

      {/* Cards Editor Modal */}
      {showCardsEditor && (
        <CardsEditor
          widget={widget}
          onSave={(updates) => {

            handleUpdate(updates);
            setShowCardsEditor(false);
          }}
          onClose={() => setShowCardsEditor(false)}
        />
      )}

      {/* Balance Card Asset Picker Modal */}
      {showBalanceAssetPicker && (
        <AssetsManager
          isEmbedded={true}
          onAssetSelect={handleBalanceAssetSelect}
          onClose={() => setShowBalanceAssetPicker(false)}
          refreshTrigger={balanceAssetsRefreshTrigger}
        />
      )}
    </>
  );
};

export default PropertyPanel;
