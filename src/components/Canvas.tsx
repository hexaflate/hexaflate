import React, { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ScreenConfig, ContentSection, GlobalTheming, NavigationConfig } from "../types";
import WidgetPreview from "./WidgetPreview";
import MobilePreview from "./MobilePreview";
import {
  Copy,
  Trash2,
  GripVertical,
  X,
  CreditCard,
  Bell,
  HelpCircle,
  Settings,
  Image,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Menu,
  Smartphone,
  LayoutList,
} from "lucide-react";
import { getIconsByCategory } from "../data/actionButtonIcons";
import { getActionButtonRoutesByCategory } from "../data/routeConfig";
import AssetsManager from "./AssetsManager";
import ImageHoverPreview from "./ImageHoverPreview";
import HeaderMenuEditor from "./HeaderMenuEditor";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import { AlertDialog, ConfirmDialog } from "../styles";
import { THEME_COLOR, withOpacity } from "../utils/themeColors";

interface CanvasProps {
  screen: ScreenConfig | undefined;
  selectedWidget: ContentSection | null;
  onWidgetSelect: (widget: ContentSection | null) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<ContentSection>) => void;
  onDeleteWidget: (widgetId: string) => void;
  onDuplicateWidget: (widget: ContentSection) => void;
  onReorderWidgets: (newOrder: ContentSection[]) => void;
  onUpdateScreen?: (updates: Partial<ScreenConfig>) => void;
  showScreenConfig?: boolean;
  onToggleScreenConfig?: (show: boolean) => void;
  onDeleteScreen?: () => void;
  authSeed?: string;
  globalConfig?: GlobalTheming;
  navigation?: NavigationConfig;
}

// Sortable Widget Component
const SortableWidget: React.FC<{
  widget: ContentSection;
  isSelected: boolean;
  onSelect: (widget: ContentSection) => void;
  onDuplicate: (widget: ContentSection) => void;
  onDelete: (widgetId: string) => void;
}> = ({ widget, isSelected, onSelect, onDuplicate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Widget Actions - Only show on hover/selection */}
      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onDuplicate(widget)}
          className="w-6 h-6 text-white rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: THEME_COLOR }}
          title="Duplikat widget"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={() => onDelete(widget.instanceId)}
          className="w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center hover:bg-danger-600 transition-colors"
          title="Hapus widget"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
      >
        <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center">
          <GripVertical size={12} />
        </div>
      </div>

      {/* Widget Preview */}
      <div onClick={() => onSelect(widget)} className="cursor-pointer">
        <WidgetPreview widget={widget} isSelected={isSelected} />
      </div>
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = ({
  screen,
  selectedWidget,
  onWidgetSelect,
  onUpdateWidget,
  onDeleteWidget,
  onDuplicateWidget,
  onReorderWidgets,
  onUpdateScreen,
  showScreenConfig,
  onToggleScreenConfig,
  onDeleteScreen,
  authSeed = "",
  globalConfig,
  navigation,
}) => {
  // Preview mode: 'mobile' for phone preview, 'settings' for config view
  const [previewMode, setPreviewMode] = useState<'mobile' | 'settings'>('mobile');

  // Collapsible section states for inline screen config
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: false,
    display: false,
    actionButtons: false,
    headerBackground: false,
  });

  // Header Menu Editor state
  const [showHeaderMenuEditor, setShowHeaderMenuEditor] = useState(false);

  // Dialog states
  const [showMaxButtonsAlert, setShowMaxButtonsAlert] = useState(false);
  const [showDeleteScreenConfirm, setShowDeleteScreenConfirm] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper functions for screen configuration
  const addActionButton = () => {
    if (!screen) return;
    const currentButtons = screen.action_buttons || [];
    if (currentButtons.length >= 2) {
      setShowMaxButtonsAlert(true);
      return;
    }

    const newButton = {
      icon: "settings",
      route: "/pusat_bantuan",
      type: "standard",
      tooltip: "Help Center",
    };

    // Force a complete screen update to ensure React detects the change
    const updatedScreen = {
      ...screen,
      action_buttons: [...currentButtons, newButton],
    };
    onUpdateScreen?.(updatedScreen);
  };

  const removeActionButton = (index: number) => {
    if (!screen) return;
    const currentButtons = screen.action_buttons || [];
    const newButtons = currentButtons.filter((_, i) => i !== index);

    // Force a complete screen update to ensure React detects the change
    const updatedScreen = {
      ...screen,
      action_buttons: newButtons,
    };
    onUpdateScreen?.(updatedScreen);
  };

  const updateActionButton = (index: number, updates: any) => {
    if (!screen) return;
    const currentButtons = screen.action_buttons || [];
    const newButtons = [...currentButtons];
    newButtons[index] = { ...newButtons[index], ...updates };

    // Force a complete screen update to ensure React detects the change
    const updatedScreen = {
      ...screen,
      action_buttons: newButtons,
    };
    onUpdateScreen?.(updatedScreen);
  };

  const addHeaderBackground = () => {
    if (!screen) return;

    const newKey = "bg_1";
    const newBackground = {
      imageUrl: "",
    };

    onUpdateScreen?.({
      headerBackgroundUrl: { [newKey]: newBackground },
    });
  };

  const removeHeaderBackground = (key: string) => {
    if (!screen) return;
    onUpdateScreen?.({ headerBackgroundUrl: {} });
  };

  const updateHeaderBackground = (key: string, updates: any) => {
    if (!screen) return;
    const currentBackgrounds = screen.headerBackgroundUrl || {};
    const newBackgrounds = { ...currentBackgrounds };
    newBackgrounds[key] = { ...newBackgrounds[key], ...updates };
    onUpdateScreen?.({ headerBackgroundUrl: newBackgrounds });
  };

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentHeaderBgKey, setCurrentHeaderBgKey] = useState<string | null>(
    null,
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getPublicUrl = async (filename: string) => {
    // Strip any leading /assets/ or / from the filename
    const cleanFilename = filename
      .replace(/^\/assets\//, "")
      .replace(/^\//, "");
    const apiUrl = await getApiUrl("");
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  const handleUploadFile = async (file: File) => {
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
          const urlParts = data.file_url.split("/");
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
        if (publicUrl && publicUrl.startsWith("/")) {
          const baseUrl = await getApiUrl("");
          publicUrl = `${baseUrl}${publicUrl}`;
        }

        // If we still don't have a URL but have a filename, construct it
        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }

        if (publicUrl) {
          setAssetsRefreshTrigger((prev) => prev + 1);
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

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);

    if (url) {
      updateHeaderBackground(key, { imageUrl: url });
    } else {
    }

    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url && currentHeaderBgKey) {
      updateHeaderBackground(currentHeaderBgKey, { imageUrl: url });
      setShowAssetPicker(false);
      setCurrentHeaderBgKey(null);
    }
  };

  const openAssetPicker = (key: string) => {
    setCurrentHeaderBgKey(key);
    setShowAssetPicker(true);
  };

  // Get widgets from screen content
  const widgets = screen?.content || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.instanceId === active.id);
      const newIndex = widgets.findIndex((w) => w.instanceId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(widgets, oldIndex, newIndex);
        onReorderWidgets(newOrder);
      }
    }
  };

  if (!screen) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            Tidak Ada Layar Dipilih
          </h2>
          <p className="text-gray-500">
            Pilih layar dari sidebar untuk mulai mengedit
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      {/* Preview Mode Toggle */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {screen?.screenTitle || screen?.screen || "Preview"}
        </span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewMode === 'mobile'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={previewMode === 'mobile' ? { color: THEME_COLOR } : undefined}
          >
            <Smartphone size={14} />
            Mobile
          </button>
          <button
            onClick={() => setPreviewMode('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewMode === 'settings'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={previewMode === 'settings' ? { color: THEME_COLOR } : undefined}
          >
            <LayoutList size={14} />
            Settings
          </button>
        </div>
      </div>

      {/* Mobile Preview Mode */}
      {previewMode === 'mobile' && (
        <div className="h-full overflow-auto bg-gradient-to-br from-gray-100 to-gray-200">
          <MobilePreview
            screen={screen}
            selectedWidget={selectedWidget}
            onWidgetSelect={onWidgetSelect}
            onDeleteWidget={onDeleteWidget}
            onDuplicateWidget={onDuplicateWidget}
            onReorderWidgets={onReorderWidgets}
            containerBorderRadius={globalConfig?.containerBorderRadius}
            navigation={navigation}
          />
        </div>
      )}

      {/* Settings Mode - Unified Canvas with Inline Screen Config */}
      {previewMode === 'settings' && (
      <div className="h-full overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Inline Screen Configuration - Collapsible Sections */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Basic Settings Section */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("basic")}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} style={{ color: THEME_COLOR }} />
                  <span className="text-sm font-medium text-gray-700">
                    Basic Settings
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {screen?.screenTitle || "No title"}
                  </span>
                </div>
                {expandedSections.basic ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {expandedSections.basic && (
                <div className="p-4 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Screen Title
                      </label>
                      <input
                        type="text"
                        value={screen?.screenTitle || ""}
                        onChange={(e) =>
                          onUpdateScreen?.({ screenTitle: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Enter screen title"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Header Style
                      </label>
                      <select
                        value={screen?.header_style || "greeting_name"}
                        onChange={(e) =>
                          onUpdateScreen?.({ header_style: e.target.value })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <optgroup label="Single">
                          <option value="name">Name Only</option>
                          <option value="title">Title Only</option>
                          <option value="app_title">App Title Only</option>
                        </optgroup>
                        <optgroup label="Greeting + ...">
                          <option value="greeting_name">Greeting + Name</option>
                          <option value="greeting_title">
                            Greeting + Title
                          </option>
                          <option value="greeting_app_title">
                            Greeting + App Title
                          </option>
                          <option value="greeting_balance">
                            Greeting + Balance + Points
                          </option>
                        </optgroup>
                        <optgroup label="App Title + ...">
                          <option value="app_title_name">
                            App Title + Name
                          </option>
                          <option value="app_title_title">
                            App Title + Title
                          </option>
                          <option value="app_title_balance">
                            App Title + Balance + Points
                          </option>
                        </optgroup>
                        <optgroup label="Name + ...">
                          <option value="name_app_title">
                            Name + App Title
                          </option>
                          <option value="name_title">Name + Title</option>
                          <option value="name_balance">
                            Name + Balance + Points
                          </option>
                        </optgroup>
                        <optgroup label="Title + ...">
                          <option value="title_name">Title + Name</option>
                          <option value="title_app_title">
                            Title + App Title
                          </option>
                          <option value="title_balance">
                            Title + Balance + Points
                          </option>
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Header Image Height: {screen?.carouselHeight || 300}px
                    </label>
                    <input
                      type="range"
                      value={screen?.carouselHeight || 300}
                      onChange={(e) =>
                        onUpdateScreen?.({
                          carouselHeight: Number(e.target.value),
                        })
                      }
                      className="w-full"
                      min="100"
                      max="500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Display Options Section */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("display")}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-success-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Display Options
                  </span>
                  <span className="text-xs text-gray-400">
                    {screen?.header_display_type === "balance_cards"
                      ? "✓ Balance Cards"
                      : screen?.header_display_type === "menu_icons"
                        ? "✓ Menu Icons"
                        : screen?.balance_card
                          ? "✓ Balance Card (legacy)"
                          : ""}
                  </span>
                </div>
                {expandedSections.display ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {expandedSections.display && (
                <div className="p-4 pt-0 space-y-3">
                  {/* Header Display Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <CreditCard size={12} style={{ color: THEME_COLOR }} />
                      Header Display Type
                    </label>
                    <select
                      value={
                        screen?.header_display_type ||
                        (screen?.balance_card ? "balance_cards" : "none")
                      }
                      onChange={(e) => {
                        const value = e.target.value as
                          | "none"
                          | "balance_cards"
                          | "menu_icons";
                        onUpdateScreen?.({
                          header_display_type: value,
                          balance_card: value === "balance_cards",
                        });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="none">None (No Header Display)</option>
                      <option value="balance_cards">Balance Cards</option>
                      <option value="menu_icons">Menu Icons</option>
                    </select>
                  </div>

                  {/* Balance Card Variant - show when balance_cards is selected */}
                  {(screen?.header_display_type === "balance_cards" ||
                    (!screen?.header_display_type && screen?.balance_card)) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Balance Card Variant
                      </label>
                      <select
                        value={screen?.balance_card_variant || 1}
                        onChange={(e) =>
                          onUpdateScreen?.({
                            balance_card_variant: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                          <option key={v} value={v}>
                            Variant {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Header Menu Icons Editor - show when menu_icons is selected */}
                  {screen?.header_display_type === "menu_icons" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Menu size={12} className="text-success-500" />
                        Header Menu Icons (
                        {(screen?.header_menu_icons || []).length} items)
                      </label>
                      <button
                        onClick={() => setShowHeaderMenuEditor(true)}
                        className="w-full py-2 text-xs font-medium bg-success-50 text-success-600 hover:bg-success-100 border border-success-200 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Menu size={12} />
                        Edit Header Menu Icons
                      </button>
                    </div>
                  )}

                  {/* Other display options */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={screen?.headerFade !== false}
                        onChange={(e) =>
                          onUpdateScreen?.({ headerFade: e.target.checked })
                        }
                        className="h-4 w-4 rounded"
                        style={{ accentColor: THEME_COLOR }}
                      />
                      Header Fade
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={screen?.show_drag_handle !== false}
                        onChange={(e) =>
                          onUpdateScreen?.({
                            show_drag_handle: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded"
                        style={{ accentColor: THEME_COLOR }}
                      />
                      Drag Handle
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Section */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("actionButtons")}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Action Buttons
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {(screen?.action_buttons || []).length}/2
                  </span>
                </div>
                {expandedSections.actionButtons ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {expandedSections.actionButtons && (
                <div className="p-4 pt-0 space-y-3">
                  {(screen?.action_buttons || []).map((button, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg space-y-2"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={button.icon || ""}
                          onChange={(e) =>
                            updateActionButton(index, { icon: e.target.value })
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="">Icon</option>
                          {Object.entries(getIconsByCategory()).map(
                            ([cat, icons]) => (
                              <optgroup key={cat} label={cat}>
                                {icons.map((icon) => (
                                  <option key={icon.name} value={icon.name}>
                                    {icon.displayName}
                                  </option>
                                ))}
                              </optgroup>
                            ),
                          )}
                        </select>
                        <select
                          value={button.route || ""}
                          onChange={(e) =>
                            updateActionButton(index, { route: e.target.value })
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="">Route</option>
                          {Object.entries(
                            getActionButtonRoutesByCategory(),
                          ).map(([cat, routes]) => (
                            <optgroup key={cat} label={cat}>
                              {routes.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <select
                          value={button.type}
                          onChange={(e) =>
                            updateActionButton(index, {
                              type: e.target.value as
                                | "standard"
                                | "notification"
                                | "help",
                            })
                          }
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="standard">Standard</option>
                          <option value="notification">Notification</option>
                          <option value="help">Help</option>
                        </select>
                      </div>
                      <button
                        onClick={() => removeActionButton(index)}
                        className="text-xs text-danger-500 hover:text-danger-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addActionButton}
                    disabled={(screen?.action_buttons || []).length >= 2}
                    className={`w-full py-2 text-xs font-medium rounded transition-colors ${
                      (screen?.action_buttons || []).length >= 2
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border"
                    }`}
                    style={(screen?.action_buttons || []).length < 2 ? {
                      backgroundColor: withOpacity(THEME_COLOR, 0.05),
                      color: THEME_COLOR,
                      borderColor: withOpacity(THEME_COLOR, 0.3)
                    } : undefined}
                  >
                    + Add Action Button
                  </button>
                </div>
              )}
            </div>

            {/* Header Background Section */}
            <div>
              <button
                onClick={() => toggleSection("headerBackground")}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Image size={16} className="text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Header Background
                  </span>
                  <span className="text-xs text-gray-400">
                    {Object.keys(screen?.headerBackgroundUrl || {}).length > 0
                      ? "✓ Set"
                      : "Not set"}
                  </span>
                </div>
                {expandedSections.headerBackground ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {expandedSections.headerBackground && (
                <div className="p-4 pt-0 space-y-3">
                  {Object.entries(screen?.headerBackgroundUrl || {}).map(
                    ([key, bg]) => (
                      <div
                        key={key}
                        className="p-3 bg-gray-50 rounded-lg space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={bg.imageUrl}
                            onChange={(e) =>
                              updateHeaderBackground(key, {
                                imageUrl: e.target.value,
                              })
                            }
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Image URL"
                          />
                          <input
                            ref={(el) => {
                              if (el) fileInputRefs.current[key] = el;
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, key)}
                            className="hidden"
                          />
                          {bg.imageUrl && (
                            <ImageHoverPreview
                              src={bg.imageUrl}
                              alt="Background preview"
                              thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                            />
                          )}
                          <button
                            onClick={() => fileInputRefs.current[key]?.click()}
                            className="px-2 py-1 text-white rounded text-xs"
                            style={{ backgroundColor: THEME_COLOR }}
                          >
                            <Upload size={12} />
                          </button>
                          <button
                            onClick={() => openAssetPicker(key)}
                            className="px-2 py-1 bg-success-500 text-white rounded text-xs hover:bg-success-600"
                          >
                            <ImageIcon size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeHeaderBackground(key)}
                          className="text-xs text-danger-500 hover:text-danger-700"
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                  {Object.keys(screen?.headerBackgroundUrl || {}).length ===
                    0 && (
                    <button
                      onClick={addHeaderBackground}
                      className="w-full py-2 text-xs font-medium border rounded transition-colors"
                      style={{ 
                        backgroundColor: withOpacity(THEME_COLOR, 0.05),
                        color: THEME_COLOR,
                        borderColor: withOpacity(THEME_COLOR, 0.3)
                      }}
                    >
                      + Add Header Background
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Widgets Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Widgets ({widgets.length})
              </h3>
              {onDeleteScreen && (
                <button
                  onClick={() => setShowDeleteScreenConfirm(true)}
                  className="text-xs text-danger-500 hover:text-danger-700 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Delete Screen
                </button>
              )}
            </div>

            {widgets.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🧩</div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Kanvas Kosong
                </h3>
                <p className="text-xs text-gray-400">
                  Gunakan sidebar untuk menambahkan widget
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={widgets.map((w) => w.instanceId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {widgets.map((widget) => (
                      <SortableWidget
                        key={widget.instanceId}
                        widget={widget}
                        isSelected={
                          selectedWidget?.instanceId === widget.instanceId
                        }
                        onSelect={onWidgetSelect}
                        onDuplicate={onDuplicateWidget}
                        onDelete={onDeleteWidget}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Pilih atau Upload Asset
              </h3>
              <button
                onClick={() => {
                  setShowAssetPicker(false);
                  setCurrentHeaderBgKey(null);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager
                authSeed={
                  authSeed || localStorage.getItem("adminAuthSeed") || ""
                }
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleAssetSelect}
              />
              <div 
                className="mt-4 p-4 border rounded-lg"
                style={{ 
                  backgroundColor: withOpacity(THEME_COLOR, 0.05),
                  borderColor: withOpacity(THEME_COLOR, 0.3)
                }}
              >
                <p className="text-sm mb-2" style={{ color: THEME_COLOR_DARK }}>
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk
                  memilih dan menerapkan ke field Image URL secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Menu Editor Modal */}
      {showHeaderMenuEditor && screen && (
        <HeaderMenuEditor
          items={screen.header_menu_icons || []}
          onSave={(items) => {
            onUpdateScreen?.({ header_menu_icons: items });
            setShowHeaderMenuEditor(false);
          }}
          onClose={() => setShowHeaderMenuEditor(false)}
        />
      )}

      {/* Alert Dialog for max action buttons */}
      <AlertDialog
        isOpen={showMaxButtonsAlert}
        onClose={() => setShowMaxButtonsAlert(false)}
        title="Batas Maksimum"
        message="Maksimum 2 action button yang diperbolehkan."
        variant="warning"
      />

      {/* Confirm Dialog for delete screen */}
      <ConfirmDialog
        isOpen={showDeleteScreenConfirm}
        onClose={() => setShowDeleteScreenConfirm(false)}
        onConfirm={() => {
          setShowDeleteScreenConfirm(false);
          onDeleteScreen?.();
        }}
        title="Hapus Layar"
        message="Apakah Anda yakin ingin menghapus layar ini?"
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};

export default Canvas;
