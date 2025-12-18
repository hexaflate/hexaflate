import React, { useState, useEffect } from "react";
import { GlobalTheming } from "../../types";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  CreditCard,
  Settings,
  Bell,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Move,
} from "lucide-react";
import { getIconsByCategory } from "../../data/actionButtonIcons";
import { getActionButtonRoutesByCategory } from "../../data/routeConfig";
import { THEME_COLOR, withOpacity } from "../../utils/themeColors";
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

interface ProfileCustomizationEditorProps {
  globalConfig?: GlobalTheming;
  onUpdate: (config: GlobalTheming) => void;
  selectedMenu?: string;
  authSeed?: string;
}

// Default info cards configuration
const DEFAULT_INFO_CARDS = [
  { id: "verification", label: "Status Verifikasi", icon: "verified_user", enabled: true },
  { id: "email", label: "Email", icon: "email", enabled: true },
  { id: "owner_name", label: "Nama Pemilik", icon: "person", enabled: true },
  { id: "points", label: "Poin", icon: "stars", enabled: true },
  { id: "address", label: "Alamat", icon: "location_on", enabled: true },
  { id: "join_date", label: "Bergabung Sejak", icon: "calendar_today", enabled: true },
  { id: "whatsapp", label: "WhatsApp", icon: "phone", enabled: true },
  { id: "phone", label: "Telepon", icon: "phone", enabled: true },
];

// Avatar layout variants
const AVATAR_LAYOUT_VARIANTS = [
  { id: 1, name: "Center Stack", description: "Avatar di tengah, teks di bawah" },
  { id: 2, name: "Left Aligned", description: "Avatar di kiri, teks di kanan" },
  { id: 3, name: "Right Aligned", description: "Avatar di kanan, teks di kiri" },
  { id: 4, name: "Card Layout", description: "Dalam kartu dengan background" },
];

// Helper to get distro suffix from menu name
const getDistroSuffix = (selectedMenu?: string): string => {
  if (!selectedMenu || selectedMenu === "Aplikasi Utama") {
    return "";
  }
  return selectedMenu.replace(/\.json$/, "");
};

// Sortable Info Card Component
const SortableInfoCard: React.FC<{
  card: { id: string; label: string; icon: string; enabled: boolean };
  onToggle: (id: string) => void;
}> = ({ card, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 rounded-lg border ${
        card.enabled ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={14} />
        </div>
        <span className={`text-sm ${card.enabled ? "text-gray-700" : "text-gray-400"}`}>
          {card.label}
        </span>
      </div>
      <button
        onClick={() => onToggle(card.id)}
        className={`p-1 rounded ${
          card.enabled
            ? "text-green-600 hover:bg-green-50"
            : "text-gray-400 hover:bg-gray-100"
        }`}
      >
        {card.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
};

const ProfileCustomizationEditor: React.FC<ProfileCustomizationEditorProps> = ({
  globalConfig,
  onUpdate,
  selectedMenu,
}) => {
  const distroSuffix = getDistroSuffix(selectedMenu);
  const isDistro = distroSuffix !== "";

  // Keys with distro suffix
  const avatarVariantKey = `profileAvatarVariant${distroSuffix}` as keyof GlobalTheming;
  const avatarIconKey = `profileAvatarIcon${distroSuffix}` as keyof GlobalTheming;
  const infoCardsKey = `profileInfoCards${distroSuffix}` as keyof GlobalTheming;
  const showSettingsKey = `profileShowSettings${distroSuffix}` as keyof GlobalTheming;
  const actionButtonsKey = `profileActionButtons${distroSuffix}` as keyof GlobalTheming;
  const showNetworkBannerKey = `profileShowNetworkBanner${distroSuffix}` as keyof GlobalTheming;

  // Get values using dynamic keys
  const configAny = globalConfig as Record<string, string | boolean | undefined> | undefined;
  
  // Parse values
  const avatarVariant = parseInt(configAny?.[avatarVariantKey] as string || "1", 10) || 1;
  const avatarIcon = (configAny?.[avatarIconKey] as string) || "person";
  const showSettings = configAny?.[showSettingsKey] !== "false";
  const showNetworkBanner = configAny?.[showNetworkBannerKey] !== "false";
  
  // Parse info cards from JSON string or use default
  const parseInfoCards = (): typeof DEFAULT_INFO_CARDS => {
    const stored = configAny?.[infoCardsKey] as string;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_INFO_CARDS;
      }
    }
    return DEFAULT_INFO_CARDS;
  };
  
  // Parse action buttons from JSON string
  const parseActionButtons = (): Array<{ icon: string; route: string; tooltip: string }> => {
    const stored = configAny?.[actionButtonsKey] as string;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  };

  const infoCards = parseInfoCards();
  const actionButtons = parseActionButtons();

  // Expanded section state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showMaxButtonsAlert, setShowMaxButtonsAlert] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize default values on mount if not already set
  useEffect(() => {
    const needsInit = 
      configAny?.[avatarVariantKey] === undefined ||
      configAny?.[avatarIconKey] === undefined ||
      configAny?.[infoCardsKey] === undefined ||
      configAny?.[showSettingsKey] === undefined ||
      configAny?.[actionButtonsKey] === undefined ||
      configAny?.[showNetworkBannerKey] === undefined;

    if (needsInit) {
      onUpdate({
        ...globalConfig,
        [avatarVariantKey]: configAny?.[avatarVariantKey] ?? "1",
        [avatarIconKey]: configAny?.[avatarIconKey] ?? "person",
        [infoCardsKey]: configAny?.[infoCardsKey] ?? JSON.stringify(DEFAULT_INFO_CARDS),
        [showSettingsKey]: configAny?.[showSettingsKey] ?? "true",
        [actionButtonsKey]: configAny?.[actionButtonsKey] ?? "[]",
        [showNetworkBannerKey]: configAny?.[showNetworkBannerKey] ?? "true",
      } as GlobalTheming);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distroSuffix]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Update handlers
  const handleAvatarVariantChange = (variant: number) => {
    onUpdate({
      ...globalConfig,
      [avatarVariantKey]: String(variant),
    } as GlobalTheming);
  };

  const handleAvatarIconChange = (icon: string) => {
    onUpdate({
      ...globalConfig,
      [avatarIconKey]: icon,
    } as GlobalTheming);
  };

  const handleShowSettingsChange = (show: boolean) => {
    onUpdate({
      ...globalConfig,
      [showSettingsKey]: show ? "true" : "false",
    } as GlobalTheming);
  };

  const handleShowNetworkBannerChange = (show: boolean) => {
    onUpdate({
      ...globalConfig,
      [showNetworkBannerKey]: show ? "true" : "false",
    } as GlobalTheming);
  };

  const handleInfoCardToggle = (cardId: string) => {
    const updated = infoCards.map(card =>
      card.id === cardId ? { ...card, enabled: !card.enabled } : card
    );
    onUpdate({
      ...globalConfig,
      [infoCardsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  const handleInfoCardsReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = infoCards.findIndex((c) => c.id === active.id);
      const newIndex = infoCards.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(infoCards, oldIndex, newIndex);
      onUpdate({
        ...globalConfig,
        [infoCardsKey]: JSON.stringify(reordered),
      } as GlobalTheming);
    }
  };

  const addActionButton = () => {
    if (actionButtons.length >= 2) {
      setShowMaxButtonsAlert(true);
      return;
    }
    const newButton = { icon: "help", route: "/pusat_bantuan", tooltip: "Bantuan" };
    onUpdate({
      ...globalConfig,
      [actionButtonsKey]: JSON.stringify([...actionButtons, newButton]),
    } as GlobalTheming);
  };

  const removeActionButton = (index: number) => {
    const updated = actionButtons.filter((_, i) => i !== index);
    onUpdate({
      ...globalConfig,
      [actionButtonsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  const updateActionButton = (index: number, updates: Partial<{ icon: string; route: string; tooltip: string }>) => {
    const updated = [...actionButtons];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({
      ...globalConfig,
      [actionButtonsKey]: JSON.stringify(updated),
    } as GlobalTheming);
  };

  // Render profile screen preview
  const renderProfilePreview = () => {
    // Get enabled info cards for preview
    const enabledCards = infoCards.filter(c => c.enabled);
    
    // Render avatar section based on layout variant
    const renderAvatarSection = () => {
      const avatarElement = (
        <div className="w-14 h-14 bg-white flex items-center justify-center rounded-full shadow-md">
          <User size={24} className="text-gray-400" />
        </div>
      );
      
      const textElement = (
        <div className={avatarVariant === 2 ? "text-left" : avatarVariant === 3 ? "text-right" : "text-center"}>
          <span className="text-white font-medium text-sm block">Nama Pengguna</span>
          <span className="text-white/80 text-xs block">ID: 123456</span>
          <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full inline-block mt-1">
            Member Aktif
          </span>
        </div>
      );
      
      switch (avatarVariant) {
        case 2: // Left Aligned - Avatar left, text right
          return (
            <div className="flex items-center gap-3">
              {avatarElement}
              <div className="flex-1">{textElement}</div>
            </div>
          );
        case 3: // Right Aligned - Avatar right, text left
          return (
            <div className="flex items-center gap-3">
              <div className="flex-1">{textElement}</div>
              {avatarElement}
            </div>
          );
        case 4: // Card Layout - In a card with background
          return (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-3">
                {avatarElement}
                <div className="flex-1 text-left">
                  <span className="text-white font-medium text-sm block">Nama Pengguna</span>
                  <span className="text-white/80 text-xs block">ID: 123456</span>
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full inline-block mt-1">
                    Member Aktif
                  </span>
                </div>
              </div>
            </div>
          );
        default: // Center Stack - Avatar on top, text below
          return (
            <div className="flex flex-col items-center">
              <div className="mb-2">{avatarElement}</div>
              {textElement}
            </div>
          );
      }
    };

    return (
      <div className="rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
          Pratinjau Halaman Profil
        </h3>
        <div
          className="relative bg-white rounded-3xl shadow-lg overflow-hidden mx-auto border-4 border-gray-800"
          style={{ width: 280, height: 560 }}
        >
          <div className="relative h-full flex flex-col">
            {/* Status bar mockup */}
            <div 
              className="flex justify-between items-center px-4 py-2 text-xs text-white"
              style={{ background: `linear-gradient(135deg, ${THEME_COLOR}, ${withOpacity(THEME_COLOR, 0.8)})` }}
            >
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-white/60 rounded-sm"></div>
                <div className="w-4 h-2 bg-white/60 rounded-sm"></div>
                <div className="w-5 h-2 bg-white/60 rounded-sm"></div>
              </div>
            </div>

            {/* Profile header with gradient */}
            <div 
              className="px-4 py-4"
              style={{ background: `linear-gradient(135deg, ${THEME_COLOR}, ${withOpacity(THEME_COLOR, 0.7)})` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">Profil</span>
                <div className="flex gap-1">
                  {/* Additional action buttons */}
                  {actionButtons.map((_, idx) => (
                    <div key={idx} className="w-5 h-5 bg-white/20 rounded-full"></div>
                  ))}
                  {/* Settings button */}
                  {showSettings && (
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <Settings size={10} className="text-white/80" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile avatar section - changes based on layout variant */}
              {renderAvatarSection()}
            </div>

            {/* Content area with rounded container */}
            <div className="flex-1 bg-white rounded-t-3xl -mt-4 p-3 space-y-1.5 overflow-y-auto">
              {/* Render enabled info cards in order */}
              {enabledCards.slice(0, 5).map((card) => (
                <div key={card.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: withOpacity(THEME_COLOR, 0.1) }}
                  >
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: THEME_COLOR }}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-gray-500 block">{card.label}</span>
                    <div className="text-[10px] text-gray-900 truncate">Contoh data</div>
                  </div>
                </div>
              ))}
              
              {/* Show more indicator if there are more cards */}
              {enabledCards.length > 5 && (
                <div className="text-[9px] text-gray-400 text-center py-1">
                  +{enabledCards.length - 5} kartu lainnya
                </div>
              )}

              {/* Network banner - conditionally shown */}
              {showNetworkBanner && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 mt-2">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-medium text-amber-800">Jaringan Anda</span>
                  </div>
                  <div className="w-3 h-3 bg-amber-200 rounded"></div>
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
            {renderProfilePreview()}
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
                    Konfigurasi profil ini akan disimpan dengan suffix{" "}
                    <code className="bg-indigo-100 px-1 rounded">
                      {distroSuffix}
                    </code>{" "}
                    dan hanya berlaku untuk aplikasi distro tersebut.
                  </p>
                </div>
              </div>
            )}

            {/* Avatar Settings Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("avatar")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User size={18} style={{ color: THEME_COLOR }} />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Pengaturan Avatar
                    </h3>
                    <p className="text-xs text-gray-500">
                      Variant {avatarVariant}
                    </p>
                  </div>
                </div>
                {expandedSection === "avatar" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "avatar" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  {/* Avatar Variant */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Layout Avatar
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVATAR_LAYOUT_VARIANTS.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => handleAvatarVariantChange(variant.id)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            avatarVariant === variant.id
                              ? "border-2"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          style={avatarVariant === variant.id ? { 
                            borderColor: THEME_COLOR,
                            backgroundColor: withOpacity(THEME_COLOR, 0.05)
                          } : undefined}
                        >
                          <div className="text-sm font-medium text-gray-800">{variant.name}</div>
                          <div className="text-xs text-gray-500">{variant.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Avatar Icon */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ikon Avatar
                    </label>
                    <select
                      value={avatarIcon}
                      onChange={(e) => handleAvatarIconChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="person">Person (Default)</option>
                      <option value="account_circle">Account Circle</option>
                      <option value="face">Face</option>
                      <option value="badge">Badge</option>
                      <option value="emoji_emotions">Emoji</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Info Cards Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("infoCards")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-green-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Kartu Informasi
                    </h3>
                    <p className="text-xs text-gray-500">
                      {infoCards.filter(c => c.enabled).length}/{infoCards.length} aktif
                    </p>
                  </div>
                </div>
                {expandedSection === "infoCards" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "infoCards" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Move size={12} />
                    Drag untuk mengubah urutan, klik ikon mata untuk show/hide
                  </p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleInfoCardsReorder}
                  >
                    <SortableContext
                      items={infoCards.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {infoCards.map((card) => (
                          <SortableInfoCard
                            key={card.id}
                            card={card}
                            onToggle={handleInfoCardToggle}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

            {/* Action Buttons Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("actionButtons")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-orange-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Action Buttons
                    </h3>
                    <p className="text-xs text-gray-500">
                      {actionButtons.length}/2 tambahan, Settings: {showSettings ? "On" : "Off"}
                    </p>
                  </div>
                </div>
                {expandedSection === "actionButtons" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "actionButtons" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  {/* Settings Icon Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Tombol Settings</span>
                      <p className="text-xs text-gray-500">Tampilkan ikon settings di header profil</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSettings}
                        onChange={(e) => handleShowSettingsChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  {/* Additional Action Buttons */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Tombol Aksi Tambahan (Maks. 2)
                    </label>
                    <div className="space-y-2">
                      {actionButtons.map((button, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={button.icon}
                              onChange={(e) => updateActionButton(index, { icon: e.target.value })}
                              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="">Icon</option>
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
                            <select
                              value={button.route}
                              onChange={(e) => updateActionButton(index, { route: e.target.value })}
                              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="">Route</option>
                              {Object.entries(getActionButtonRoutesByCategory()).map(([cat, routes]) => (
                                <optgroup key={cat} label={cat}>
                                  {routes.map((r) => (
                                    <option key={r.value} value={r.value}>
                                      {r.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={button.tooltip}
                              onChange={(e) => updateActionButton(index, { tooltip: e.target.value })}
                              placeholder="Tooltip"
                              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <button
                            onClick={() => removeActionButton(index)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addActionButton}
                      disabled={actionButtons.length >= 2}
                      className={`w-full mt-2 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                        actionButtons.length >= 2
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border"
                      }`}
                      style={actionButtons.length < 2 ? {
                        backgroundColor: withOpacity(THEME_COLOR, 0.05),
                        color: THEME_COLOR,
                        borderColor: withOpacity(THEME_COLOR, 0.3)
                      } : undefined}
                    >
                      <Plus size={14} />
                      Tambah Action Button
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Options Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("display")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-purple-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Opsi Tampilan
                    </h3>
                    <p className="text-xs text-gray-500">
                      Banner jaringan: {showNetworkBanner ? "On" : "Off"}
                    </p>
                  </div>
                </div>
                {expandedSection === "display" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "display" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  {/* Network Banner Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Banner Jaringan</span>
                      <p className="text-xs text-gray-500">Tampilkan banner jaringan/MLM di profil</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNetworkBanner}
                        onChange={(e) => handleShowNetworkBannerChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Panduan Penggunaan
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Atur variant dan ikon avatar untuk menyesuaikan tampilan profil</li>
                <li>Drag kartu informasi untuk mengubah urutan, klik mata untuk hide/show</li>
                <li>Tambah hingga 2 action button tambahan selain Settings</li>
                <li>Aktifkan/nonaktifkan banner jaringan sesuai kebutuhan</li>
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

      {/* Max Buttons Alert */}
      {showMaxButtonsAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Batas Maksimum</h3>
            <p className="text-sm text-gray-600 mb-4">
              Maksimum 2 action button tambahan yang diperbolehkan.
            </p>
            <button
              onClick={() => setShowMaxButtonsAlert(false)}
              className="w-full py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: THEME_COLOR }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCustomizationEditor;
