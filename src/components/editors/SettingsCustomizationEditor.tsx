import React, { useState, useEffect } from "react";
import { GlobalTheming } from "../../types";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Shield,
  Bell,
  Palette,
  User,
  HelpCircle,
  Eye,
  EyeOff,
  GripVertical,
  Move,
  Fingerprint,
  Lock,
  Key,
  Moon,
  UserCog,
  UserX,
  MessageSquare,
  FileText,
  Info,
  LogOut,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Link,
  Send,
} from "lucide-react";
import { THEME_COLOR, withOpacity } from "../../utils/themeColors";
import { getIconsByCategory } from "../../data/actionButtonIcons";
import { getRoutesByCategory, AVAILABLE_ROUTES } from "../../data/routeConfig";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SettingsCustomizationEditorProps {
  globalConfig?: GlobalTheming;
  onUpdate: (config: GlobalTheming) => void;
  selectedMenu?: string;
  authSeed?: string;
}

// Settings item interface
interface SettingsItem {
  id: string;
  key: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  enabled: boolean;
  section: string;
  // Custom item properties
  isCustom?: boolean;
  title?: string;
  subtitle?: string;
  route?: string;
  url?: string;
  routeArgs?: Record<string, unknown>;
}

// Section config interface
interface SectionConfig {
  id: string;
  label: string;
  icon: string;
}

// Default settings items configuration
const DEFAULT_SETTINGS_ITEMS: SettingsItem[] = [
  { id: "biometric", key: "biometric", titleKey: "settingsBiometricTitle", subtitleKey: "settingsBiometricSubtitle", icon: "fingerprint", enabled: true, section: "security" },
  { id: "change_pin", key: "changePin", titleKey: "settingsChangePinTitle", subtitleKey: "settingsChangePinSubtitle", icon: "lock", enabled: true, section: "security" },
  { id: "forgot_pin", key: "forgotPin", titleKey: "settingsForgotPinTitle", subtitleKey: "settingsForgotPinSubtitle", icon: "key", enabled: true, section: "security" },
  { id: "push_notifications", key: "pushNotifications", titleKey: "settingsPushNotificationsTitle", subtitleKey: "settingsPushNotificationsSubtitle", icon: "bell", enabled: true, section: "notifications" },
  { id: "theme", key: "theme", titleKey: "settingsThemeTitle", subtitleKey: "settingsThemeSubtitle", icon: "moon", enabled: true, section: "appearance" },
  { id: "personal_info", key: "personalInfo", titleKey: "settingsPersonalInfoTitle", subtitleKey: "settingsPersonalInfoSubtitle", icon: "user", enabled: true, section: "account" },
  { id: "deactivate_account", key: "deactivateAccount", titleKey: "settingsDeactivateAccountTitle", subtitleKey: "settingsDeactivateAccountSubtitle", icon: "user_x", enabled: true, section: "account" },
  { id: "list_sender", key: "listSender", titleKey: "settingsListSenderTitle", subtitleKey: "settingsListSenderSubtitle", icon: "send", enabled: true, section: "account" },
  { id: "help_center", key: "helpCenter", titleKey: "settingsHelpCenterTitle", subtitleKey: "settingsHelpCenterSubtitle", icon: "help", enabled: true, section: "support" },
  { id: "send_feedback", key: "sendFeedback", titleKey: "settingsSendFeedbackTitle", subtitleKey: "settingsSendFeedbackSubtitle", icon: "message", enabled: true, section: "support" },
  { id: "privacy_policy", key: "privacyPolicy", titleKey: "settingsPrivacyPolicyTitle", subtitleKey: "settingsPrivacyPolicySubtitle", icon: "file", enabled: true, section: "support" },
  { id: "about", key: "about", titleKey: "settingsAboutTitle", subtitleKey: "settingsAboutSubtitle", icon: "info", enabled: true, section: "support" },
];

// Default section configurations
const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "security", label: "Keamanan", icon: "shield" },
  { id: "notifications", label: "Notifikasi", icon: "bell" },
  { id: "appearance", label: "Tampilan", icon: "palette" },
  { id: "account", label: "Akun", icon: "user" },
  { id: "support", label: "Dukungan", icon: "help" },
];

// Helper to get distro suffix from menu name
const getDistroSuffix = (selectedMenu?: string): string => {
  if (!selectedMenu || selectedMenu === "Aplikasi Utama") {
    return "";
  }
  return selectedMenu.replace(/\.json$/, "");
};

// Icon mapping for preview
const getIconComponent = (iconName: string, size: number = 14) => {
  const iconMap: Record<string, React.ReactNode> = {
    fingerprint: <Fingerprint size={size} />,
    lock: <Lock size={size} />,
    key: <Key size={size} />,
    bell: <Bell size={size} />,
    moon: <Moon size={size} />,
    user: <UserCog size={size} />,
    user_x: <UserX size={size} />,
    help: <HelpCircle size={size} />,
    message: <MessageSquare size={size} />,
    file: <FileText size={size} />,
    info: <Info size={size} />,
    shield: <Shield size={size} />,
    palette: <Palette size={size} />,
    send: <Send size={size} />,
  };
  return iconMap[iconName] || <Settings size={size} />;
};

// Sortable Settings Item Component
const SortableSettingsItem: React.FC<{
  item: SettingsItem;
  onToggle: (id: string) => void;
  onEdit?: (item: SettingsItem) => void;
  onRemove?: (id: string) => void;
  isDragOverlay?: boolean;
}> = ({ item, onToggle, onEdit, onRemove, isDragOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  if (isDragOverlay) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white border-primary-300 shadow-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1 text-gray-400 flex-shrink-0">
            <GripVertical size={14} />
          </div>
          <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: withOpacity(THEME_COLOR, 0.1) }}>
            {getIconComponent(item.icon, 12)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm block truncate text-gray-700">
              {item.isCustom ? item.title : item.titleKey.replace('settings', '').replace('Title', '')}
            </span>
            {item.isCustom && (
              <span className="text-xs text-blue-500 block">Custom</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2.5 rounded-lg border ${
        item.enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
      } ${isDragging ? "ring-2 ring-primary-300" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <GripVertical size={14} />
        </div>
        <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: withOpacity(THEME_COLOR, 0.1) }}>
          {getIconComponent(item.icon, 12)}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-sm block truncate ${item.enabled ? "text-gray-700" : "text-gray-400"}`}>
            {item.isCustom ? item.title : item.titleKey.replace('settings', '').replace('Title', '')}
          </span>
          {item.isCustom && (
            <span className="text-xs text-blue-500 block">Custom</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.isCustom && onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            title="Edit custom item"
          >
            <Pencil size={14} />
          </button>
        )}
        {item.isCustom && onRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
            title="Remove custom item"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={() => onToggle(item.id)}
          className={`p-1.5 rounded ${
            item.enabled
              ? "text-green-600 hover:bg-green-50"
              : "text-gray-400 hover:bg-gray-100"
          }`}
        >
          {item.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
    </div>
  );
};

// Droppable Section Component
const DroppableSection: React.FC<{
  section: SectionConfig;
  items: SettingsItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (id: string) => void;
  onRenameSection: (id: string, newLabel: string) => void;
  onAddCustomItem: (sectionId: string) => void;
  onEditCustomItem: (item: SettingsItem) => void;
  onRemoveCustomItem: (id: string) => void;
  isOver: boolean;
}> = ({ section, items, isExpanded, onToggleExpand, onToggleItem, onRenameSection, onAddCustomItem, onEditCustomItem, onRemoveCustomItem, isOver }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(section.label);
  const { setNodeRef } = useDroppable({ id: `section-${section.id}` });

  const enabledCount = items.filter(i => i.enabled).length;

  const handleSave = () => {
    if (editLabel.trim()) {
      onRenameSection(section.id, editLabel.trim());
    } else {
      setEditLabel(section.label);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(section.label);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-colors ${
        isOver ? "border-primary-400 ring-2 ring-primary-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          <div className="text-gray-500">{getIconComponent(section.icon, 16)}</div>
          
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">{section.label}</h3>
                <p className="text-xs text-gray-500">{enabledCount}/{items.length} aktif</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Rename section"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={onToggleExpand}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
            <Move size={12} />
            Drag item ke seksi lain untuk memindahkan
          </p>
          <SortableContext
            items={items.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5 min-h-[40px]">
              {items.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                  Drop item di sini
                </div>
              ) : (
                items.map((item) => (
                  <SortableSettingsItem
                    key={item.id}
                    item={item}
                    onToggle={onToggleItem}
                    onEdit={onEditCustomItem}
                    onRemove={onRemoveCustomItem}
                  />
                ))
              )}
            </div>
          </SortableContext>
          {/* Add Custom Item Button */}
          <button
            onClick={() => onAddCustomItem(section.id)}
            className="w-full mt-2 py-1.5 text-xs font-medium border border-dashed rounded-lg transition-colors flex items-center justify-center gap-1 text-gray-500 border-gray-300 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50"
          >
            <Plus size={12} />
            Tambah Custom Item
          </button>
        </div>
      )}
    </div>
  );
};

// Sortable Section Wrapper
const SortableSectionWrapper: React.FC<{
  section: SectionConfig;
  items: SettingsItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (id: string) => void;
  onRenameSection: (id: string, newLabel: string) => void;
  onAddCustomItem: (sectionId: string) => void;
  onEditCustomItem: (item: SettingsItem) => void;
  onRemoveCustomItem: (id: string) => void;
  isOverSection: string | null;
}> = ({ section, items, isExpanded, onToggleExpand, onToggleItem, onRenameSection, onAddCustomItem, onEditCustomItem, onRemoveCustomItem, isOverSection }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-order-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 self-start mt-3"
      >
        <GripVertical size={16} />
      </div>
      <div className="flex-1">
        <DroppableSection
          section={section}
          items={items}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onToggleItem={onToggleItem}
          onRenameSection={onRenameSection}
          onAddCustomItem={onAddCustomItem}
          onEditCustomItem={onEditCustomItem}
          onRemoveCustomItem={onRemoveCustomItem}
          isOver={isOverSection === section.id}
        />
      </div>
    </div>
  );
};

// Custom Item Edit Modal Component
const CustomItemModal: React.FC<{
  isOpen: boolean;
  item: SettingsItem | null;
  sections: SectionConfig[];
  onSave: (item: SettingsItem) => void;
  onClose: () => void;
}> = ({ isOpen, item, sections, onSave, onClose }) => {
  const [formData, setFormData] = useState<SettingsItem | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const updateField = (field: keyof SettingsItem, value: unknown) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Filter out /product route
  const filteredRoutes = AVAILABLE_ROUTES.filter(r => r.value !== "/product");
  const groupedRoutes: Record<string, typeof filteredRoutes> = {};
  filteredRoutes.forEach(r => {
    if (!groupedRoutes[r.category]) groupedRoutes[r.category] = [];
    groupedRoutes[r.category].push(r);
  });

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 animate-fade-in"
      onClick={handleOverlayClick}
    >
      {/* Modal */}
      <div className="w-11/12 max-w-md p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-xl border border-neutral-100 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-600">
              <Settings size={18} />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              {item?.id?.startsWith('custom_') && !sections.some(s => s.id === item.section) ? 'Tambah' : 'Edit'} Custom Setting
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 focus:outline-none p-2 hover:bg-neutral-100 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {/* Icon & Section Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => updateField('icon', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">Pilih Icon</option>
                {Object.entries(getIconsByCategory()).map(([cat, icons]) => (
                  <optgroup key={cat} label={cat}>
                    {icons.map((icon) => (
                      <option key={icon.name} value={icon.name}>
                        {icon.displayName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Section</label>
              <select
                value={formData.section}
                onChange={(e) => updateField('section', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Judul</label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              placeholder="Judul item"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Deskripsi</label>
            <input
              type="text"
              value={formData.subtitle || ""}
              onChange={(e) => updateField('subtitle', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              placeholder="Deskripsi singkat"
            />
          </div>

          {/* Route or URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Route</label>
              <select
                value={formData.route || ""}
                onChange={(e) => updateField('route', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">Pilih Route</option>
                {Object.entries(groupedRoutes).map(([cat, routes]) => (
                  <optgroup key={cat} label={cat}>
                    {routes.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">atau URL</label>
              <input
                type="text"
                value={formData.url || ""}
                onChange={(e) => {
                  updateField('url', e.target.value);
                  if (e.target.value) updateField('route', '');
                }}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* WebView URL (conditional) */}
          {formData.route === "/webview" && (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">WebView URL</label>
              <input
                type="text"
                value={(formData.routeArgs?.url as string) || ""}
                onChange={(e) => updateField('routeArgs', { ...formData.routeArgs, url: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                placeholder="URL untuk WebView"
              />
            </div>
          )}

          {/* Enable Toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-neutral-50 rounded-xl">
            <span className="text-sm font-medium text-neutral-700">Aktifkan Item</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => updateField('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all duration-200"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: THEME_COLOR }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsCustomizationEditor: React.FC<SettingsCustomizationEditorProps> = ({
  globalConfig,
  onUpdate,
  selectedMenu,
}) => {
  const distroSuffix = getDistroSuffix(selectedMenu);
  const isDistro = distroSuffix !== "";

  // Keys with distro suffix
  const settingsItemsKey = `settingsItems${distroSuffix}` as keyof GlobalTheming;
  const settingsShowLogoutKey = `settingsShowLogout${distroSuffix}` as keyof GlobalTheming;
  const settingsSectionsKey = `settingsSections${distroSuffix}` as keyof GlobalTheming;

  // Get values using dynamic keys
  const configAny = globalConfig as Record<string, string | boolean | undefined> | undefined;

  // Parse settings items from JSON string or use default
  const parseSettingsItems = (): SettingsItem[] => {
    const stored = configAny?.[settingsItemsKey] as string;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_SETTINGS_ITEMS;
      }
    }
    return DEFAULT_SETTINGS_ITEMS;
  };

  // Parse sections config
  const parseSections = (): SectionConfig[] => {
    const stored = configAny?.[settingsSectionsKey] as string;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_SECTIONS;
      }
    }
    return DEFAULT_SECTIONS;
  };

  const [settingsItems, setSettingsItems] = useState<SettingsItem[]>(parseSettingsItems());
  const [sections, setSections] = useState<SectionConfig[]>(parseSections());
  const showLogout = configAny?.[settingsShowLogoutKey] !== "false";

  // Update local state when config changes
  useEffect(() => {
    setSettingsItems(parseSettingsItems());
    setSections(parseSections());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configAny?.[settingsItemsKey], configAny?.[settingsSectionsKey]]);

  // Expanded section state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overSectionId, setOverSectionId] = useState<string | null>(null);
  
  // Modal state for custom item editing
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingsItem | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize default values on mount if not already set
  useEffect(() => {
    const needsInit =
      configAny?.[settingsItemsKey] === undefined ||
      configAny?.[settingsShowLogoutKey] === undefined ||
      configAny?.[settingsSectionsKey] === undefined;

    if (needsInit) {
      onUpdate({
        ...globalConfig,
        [settingsItemsKey]: configAny?.[settingsItemsKey] ?? JSON.stringify(DEFAULT_SETTINGS_ITEMS),
        [settingsShowLogoutKey]: configAny?.[settingsShowLogoutKey] ?? "true",
        [settingsSectionsKey]: configAny?.[settingsSectionsKey] ?? JSON.stringify(DEFAULT_SECTIONS),
      } as GlobalTheming);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distroSuffix]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Update handlers
  const handleShowLogoutChange = (show: boolean) => {
    onUpdate({
      ...globalConfig,
      [settingsShowLogoutKey]: show ? "true" : "false",
    } as GlobalTheming);
  };

  const handleItemToggle = (itemId: string) => {
    const updated = settingsItems.map(item =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    setSettingsItems(updated);
    onUpdate({
      ...globalConfig,
      [settingsItemsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  const handleRenameSection = (sectionId: string, newLabel: string) => {
    const updated = sections.map(sec =>
      sec.id === sectionId ? { ...sec, label: newLabel } : sec
    );
    setSections(updated);
    onUpdate({
      ...globalConfig,
      [settingsSectionsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  // Custom item handlers
  const handleAddCustomItem = (sectionId: string) => {
    const newItem: SettingsItem = {
      id: `custom_${Date.now()}`,
      key: `custom_${Date.now()}`,
      titleKey: "",
      subtitleKey: "",
      icon: "settings_outlined",
      enabled: true,
      section: sectionId,
      isCustom: true,
      title: "Custom Setting",
      subtitle: "Description",
      route: "",
      url: "",
      routeArgs: {},
    };
    setEditingItem(newItem);
    setModalOpen(true);
  };

  const handleEditCustomItem = (item: SettingsItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveCustomItem = (item: SettingsItem) => {
    const exists = settingsItems.some(i => i.id === item.id);
    let updated: SettingsItem[];
    if (exists) {
      updated = settingsItems.map(i => i.id === item.id ? item : i);
    } else {
      updated = [...settingsItems, item];
    }
    setSettingsItems(updated);
    onUpdate({
      ...globalConfig,
      [settingsItemsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  const handleRemoveCustomItem = (itemId: string) => {
    const updated = settingsItems.filter(item => item.id !== itemId);
    setSettingsItems(updated);
    onUpdate({
      ...globalConfig,
      [settingsItemsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  // Get items by section in current order
  const getItemsBySection = (sectionId: string) => {
    return settingsItems.filter(item => item.section === sectionId);
  };

  // Find which section an item belongs to
  const findSectionByItemId = (itemId: string): string | null => {
    const item = settingsItems.find(i => i.id === itemId);
    return item?.section || null;
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverSectionId(null);
      return;
    }

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Check if dragging a section (section reorder)
    if (activeIdStr.startsWith('section-order-')) {
      setOverSectionId(null);
      return;
    }

    // Dragging an item
    let targetSection: string | null = null;

    if (overIdStr.startsWith('section-')) {
      // Over a section drop zone
      targetSection = overIdStr.replace('section-', '');
    } else {
      // Over another item - find its section
      targetSection = findSectionByItemId(overIdStr);
    }

    setOverSectionId(targetSection);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverSectionId(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Handle section reorder
    if (activeIdStr.startsWith('section-order-') && overIdStr.startsWith('section-order-')) {
      const activeSectionId = activeIdStr.replace('section-order-', '');
      const overSectionId = overIdStr.replace('section-order-', '');
      
      if (activeSectionId !== overSectionId) {
        const oldIndex = sections.findIndex(s => s.id === activeSectionId);
        const newIndex = sections.findIndex(s => s.id === overSectionId);
        const reordered = arrayMove(sections, oldIndex, newIndex);
        setSections(reordered);
        onUpdate({
          ...globalConfig,
          [settingsSectionsKey]: JSON.stringify(reordered),
        } as GlobalTheming);
      }
      return;
    }

    // Handle item drag
    if (!activeIdStr.startsWith('section-order-')) {
      const activeItem = settingsItems.find(i => i.id === activeIdStr);
      if (!activeItem) return;

      let targetSection: string;
      let targetIndex: number = -1;

      if (overIdStr.startsWith('section-')) {
        // Dropped on a section - add to end
        targetSection = overIdStr.replace('section-', '');
        const sectionItems = getItemsBySection(targetSection);
        targetIndex = sectionItems.length;
      } else {
        // Dropped on an item
        const overItem = settingsItems.find(i => i.id === overIdStr);
        if (!overItem) return;
        targetSection = overItem.section;
        
        // Find position within section
        const sectionItems = getItemsBySection(targetSection);
        targetIndex = sectionItems.findIndex(i => i.id === overIdStr);
      }

      // If same section, just reorder
      if (activeItem.section === targetSection) {
        const sectionItems = getItemsBySection(targetSection);
        const oldIndex = sectionItems.findIndex(i => i.id === activeIdStr);
        
        if (oldIndex !== targetIndex && targetIndex >= 0) {
          const reorderedSection = arrayMove(sectionItems, oldIndex, targetIndex);
          
          // Rebuild full items list
          const newItems = sections.flatMap(sec => {
            if (sec.id === targetSection) {
              return reorderedSection;
            }
            return getItemsBySection(sec.id);
          });
          
          setSettingsItems(newItems);
          onUpdate({
            ...globalConfig,
            [settingsItemsKey]: JSON.stringify(newItems),
          } as GlobalTheming);
        }
      } else {
        // Moving to different section
        const updatedItem = { ...activeItem, section: targetSection };
        
        // Remove from old section
        const itemsWithoutActive = settingsItems.filter(i => i.id !== activeIdStr);
        
        // Insert into new section at correct position
        const newItems: SettingsItem[] = [];
        let inserted = false;
        
        sections.forEach(sec => {
          const sectionItems = itemsWithoutActive.filter(i => i.section === sec.id);
          
          if (sec.id === targetSection) {
            if (targetIndex >= 0 && targetIndex < sectionItems.length) {
              // Insert at specific position
              sectionItems.forEach((item, idx) => {
                if (idx === targetIndex && !inserted) {
                  newItems.push(updatedItem);
                  inserted = true;
                }
                newItems.push(item);
              });
              if (!inserted) {
                newItems.push(updatedItem);
              }
            } else {
              // Add to end
              newItems.push(...sectionItems, updatedItem);
            }
          } else {
            newItems.push(...sectionItems);
          }
        });
        
        setSettingsItems(newItems);
        onUpdate({
          ...globalConfig,
          [settingsItemsKey]: JSON.stringify(newItems),
        } as GlobalTheming);
      }
    }
  };

  // Get active item for drag overlay
  const activeItem = activeId ? settingsItems.find(i => i.id === activeId) : null;

  // Render settings screen preview
  const renderSettingsPreview = () => {
    return (
      <div className="rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
          Pratinjau Halaman Pengaturan
        </h3>
        <div
          className="relative bg-white rounded-3xl shadow-lg overflow-hidden mx-auto border-4 border-gray-800"
          style={{ width: 280, height: 560 }}
        >
          <div className="relative h-full flex flex-col">
            {/* Status bar mockup */}
            <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-600 bg-white">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-gray-400 rounded-sm"></div>
                <div className="w-4 h-2 bg-gray-400 rounded-sm"></div>
                <div className="w-5 h-2 bg-gray-400 rounded-sm"></div>
              </div>
            </div>

            {/* App bar */}
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-gray-200"></div>
                <span className="text-sm font-semibold text-gray-800">Pengaturan</span>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 bg-gray-50 p-3 overflow-y-auto space-y-3" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {sections.map((section) => {
                const sectionItems = getItemsBySection(section.id);
                const enabledItems = sectionItems.filter(i => i.enabled);
                
                if (enabledItems.length === 0) return null;

                return (
                  <div key={section.id}>
                    {/* Section Header */}
                    <div className="text-[10px] font-semibold text-gray-600 mb-1.5 px-1">
                      {section.label}
                    </div>
                    
                    {/* Section Items */}
                    <div className="space-y-1">
                      {enabledItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100"
                        >
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: withOpacity(THEME_COLOR, 0.1) }}
                          >
                            {getIconComponent(item.icon, 10)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-medium text-gray-800 block truncate">
                              {item.isCustom ? item.title : item.titleKey.replace('settings', '').replace('Title', '')}
                            </span>
                            {item.isCustom && item.subtitle && (
                              <span className="text-[7px] text-gray-500 block truncate">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                          <div className="w-3 h-3 bg-gray-200 rounded flex-shrink-0"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Logout Button */}
              {showLogout && (
                <div className="mt-2">
                  <div className="flex items-center justify-center gap-1.5 p-2 bg-red-500 rounded-lg">
                    <LogOut size={10} className="text-white" />
                    <span className="text-[9px] font-medium text-white">Keluar</span>
                  </div>
                </div>
              )}
            </div>

            {/* Home indicator */}
            <div className="bg-white pb-2 pt-1">
              <div className="flex justify-center">
                <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Preview menggunakan konfigurasi saat ini
        </p>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden p-4">
      <div className="max-w-5xl mx-auto h-full">
        <div className="flex gap-6 h-full">
          {/* Left side - Preview (Static) */}
          <div className="flex-shrink-0 w-80 hidden lg:block overflow-hidden">
            {renderSettingsPreview()}
          </div>

          {/* Right side - Settings (Scrollable) */}
          <div className="flex-1 space-y-4 min-w-0 overflow-y-auto pr-2">
            {/* Distro indicator */}
            {isDistro && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-indigo-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h4 className="text-sm font-medium text-indigo-800">
                    Mode Distro: {distroSuffix}
                  </h4>
                  <p className="text-sm text-indigo-700 mt-1">
                    Konfigurasi pengaturan ini akan disimpan dengan suffix{" "}
                    <code className="bg-indigo-100 px-1 rounded">
                      {distroSuffix}
                    </code>{" "}
                    dan hanya berlaku untuk aplikasi distro tersebut.
                  </p>
                </div>
              </div>
            )}

            {/* Section Order Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={18} style={{ color: THEME_COLOR }} />
                <h3 className="text-sm font-medium text-gray-900">Urutan & Pengaturan Seksi</h3>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                <Move size={12} />
                Drag seksi untuk mengubah urutan, drag item antar seksi untuk memindahkan, klik pensil untuk rename
              </p>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map(s => `section-order-${s.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <SortableSectionWrapper
                        key={section.id}
                        section={section}
                        items={getItemsBySection(section.id)}
                        isExpanded={expandedSection === section.id}
                        onToggleExpand={() => toggleSection(section.id)}
                        onToggleItem={handleItemToggle}
                        onRenameSection={handleRenameSection}
                        onAddCustomItem={handleAddCustomItem}
                        onEditCustomItem={handleEditCustomItem}
                        onRemoveCustomItem={handleRemoveCustomItem}
                        isOverSection={overSectionId}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeItem ? (
                    <SortableSettingsItem
                      item={activeItem}
                      onToggle={() => {}}
                      isDragOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Logout Button Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-red-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Tombol Logout
                    </h3>
                    <p className="text-xs text-gray-500">
                      Tampilkan tombol logout di bawah pengaturan
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogout}
                    onChange={(e) => handleShowLogoutChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Panduan Penggunaan
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Drag pegangan di kiri seksi untuk mengubah urutan seksi</li>
                <li>Klik ikon pensil untuk mengubah nama seksi</li>
                <li>Drag item antar seksi untuk memindahkan ke grup lain</li>
                <li>Gunakan ikon mata untuk mengaktifkan/menonaktifkan item</li>
                <li>Klik "Tambah Custom Item" di seksi untuk menambah item kustom</li>
                <li>Klik ikon pensil pada item custom untuk mengedit</li>
                <li>Pengaturan akan disinkronkan ke app_rules dengan suffix distro</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700">
                <strong>Catatan:</strong> Perubahan akan terjadi pada cycle
                cache update. Hapus cache aplikasi untuk update manual.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Item Edit Modal */}
      <CustomItemModal
        isOpen={modalOpen}
        item={editingItem}
        sections={sections}
        onSave={handleSaveCustomItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
};

export default SettingsCustomizationEditor;
