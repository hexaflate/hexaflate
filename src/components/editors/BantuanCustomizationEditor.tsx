import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  GripVertical,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Globe,
  X,
  Check,
  Pencil,
  MessageCircle,
} from "lucide-react";
import { THEME_COLOR, withOpacity } from "../../utils/themeColors";
import { X_TOKEN_VALUE, getApiUrl } from "../../config/api";
import ImageHoverPreview from "../ImageHoverPreview";
import AssetsManager from "../AssetsManager";
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

// Types
interface TopicCard {
  id: string;
  icon: string;
  title: string;
  desc: string;
  url?: string;
  route?: string;
  routeArgs?: {
    url: string;
  };
}

// Generate unique ID
const generateId = () => `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface BantuanConfig {
  mainCard: string;
  mainCardContent: string;
  topicTitle: string;
  topicCards: TopicCard[];
}

interface BantuanCustomizationEditorProps {
  authSeed: string;
}

export interface BantuanCustomizationEditorRef {
  save: () => Promise<void>;
}

// Sortable Topic Card Component
const SortableTopicCard: React.FC<{
  card: TopicCard;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}> = ({ card, index, onEdit, onRemove }) => {
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
      className={`flex items-center gap-2 p-3 bg-white rounded-lg border ${
        isDragging ? "border-primary-400 ring-2 ring-primary-200" : "border-gray-200"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={14} />
      </div>

      {/* Icon preview */}
      {card.icon && card.icon.startsWith('http') ? (
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={card.icon} alt="" className="w-6 h-6 object-contain" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <HelpCircle size={16} className="text-primary-600" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{card.title || `Kartu ${index + 1}`}</p>
        <p className="text-xs text-gray-500 truncate">{card.desc || "Belum ada deskripsi"}</p>
      </div>

      <div className="flex items-center gap-1">
        {card.url ? (
          <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">URL</span>
        ) : card.route ? (
          <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded">WebView</span>
        ) : null}

        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// Topic Card Edit Modal
const TopicCardModal: React.FC<{
  isOpen: boolean;
  card: TopicCard | null;
  index: number;
  onSave: (index: number, card: TopicCard) => void;
  onClose: () => void;
  authSeed: string;
}> = ({ isOpen, card, index, onSave, onClose, authSeed }) => {
  const [formData, setFormData] = useState<TopicCard | null>(null);
  const [linkType, setLinkType] = useState<"url" | "route">("url");
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card) {
      setFormData({ ...card });
      setLinkType(card.route ? "route" : "url");
    }
  }, [card]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
      // Clean up based on link type
      const cleanedCard = { ...formData };
      if (linkType === "url") {
        delete cleanedCard.route;
        delete cleanedCard.routeArgs;
      } else {
        delete cleanedCard.url;
        cleanedCard.route = "/webview";
        cleanedCard.routeArgs = { url: formData.routeArgs?.url || "" };
      }
      onSave(index, cleanedCard);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFileUpload = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) return;

      const formDataUpload = new FormData();
      formDataUpload.append("session_key", sessionKey);
      formDataUpload.append("auth_seed", authSeed);
      formDataUpload.append("file", file);

      const apiUrl = await getApiUrl("/admin/assets/upload");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "X-Token": X_TOKEN_VALUE },
        body: formDataUpload,
      });

      const data = await response.json();
      if (data.success) {
        let publicUrl = data.public_url || data.asset?.public_url || data.file_url;
        if (publicUrl?.startsWith("/")) {
          const baseUrl = await getApiUrl("");
          publicUrl = `${baseUrl}${publicUrl}`;
        }
        if (publicUrl) {
          setFormData(prev => prev ? { ...prev, icon: publicUrl } : null);
        }
      }
    } catch (error) {
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAssetSelect = (url: string) => {
    setFormData(prev => prev ? { ...prev, icon: url } : null);
    setShowAssetPicker(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 animate-fade-in"
        onClick={handleOverlayClick}
      >
        <div className="w-11/12 max-w-lg p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-xl border border-neutral-100 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                <HelpCircle size={18} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">
                Edit Kartu Topik
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-neutral-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Icon URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, icon: e.target.value } : null)}
                  className="flex-1 px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {formData.icon && formData.icon.startsWith('http') && (
                  <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img src={formData.icon} alt="" className="w-8 h-8 object-contain" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 text-white rounded-xl transition-colors"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  <Upload size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssetPicker(true)}
                  className="px-3 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  <ImageIcon size={16} />
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Judul</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Judul kartu topik"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Deskripsi</label>
              <textarea
                value={formData.desc}
                onChange={(e) => setFormData(prev => prev ? { ...prev, desc: e.target.value } : null)}
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Deskripsi singkat"
              />
            </div>

            {/* Link Type */}
            <div className="p-4 bg-neutral-50 rounded-xl">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tipe Link</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={linkType === "url"}
                    onChange={() => setLinkType("url")}
                    className="text-primary-500"
                  />
                  <Globe size={14} />
                  <span className="text-sm">URL Langsung</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={linkType === "route"}
                    onChange={() => setLinkType("route")}
                    className="text-primary-500"
                  />
                  <ExternalLink size={14} />
                  <span className="text-sm">WebView</span>
                </label>
              </div>

              {linkType === "url" ? (
                <input
                  type="text"
                  value={formData.url || ""}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, url: e.target.value } : null)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="https://example.com"
                />
              ) : (
                <input
                  type="text"
                  value={formData.routeArgs?.url || ""}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, routeArgs: { url: e.target.value } } : null)}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  placeholder="URL untuk WebView"
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-sm font-medium text-white rounded-xl"
              style={{ backgroundColor: THEME_COLOR }}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssetPicker(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Pilih Asset</h3>
              <button onClick={() => setShowAssetPicker(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <AssetsManager
                authSeed={authSeed}
                onAssetSelect={handleAssetSelect}
                selectionMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const BantuanCustomizationEditor = forwardRef<BantuanCustomizationEditorRef, BantuanCustomizationEditorProps>(({
  authSeed,
}, ref) => {
  const [bantuanConfig, setBantuanConfig] = useState<BantuanConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number>(-1);
  const [editingCard, setEditingCard] = useState<TopicCard | null>(null);
  const bantuanConfigRef = useRef<BantuanConfig | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    bantuanConfigRef.current = bantuanConfig;
  }, [bantuanConfig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Default bantuan config
  const getDefaultBantuanConfig = (): BantuanConfig => ({
    mainCard: "Butuh Bantuan?",
    mainCardContent: "Pusat bantuan kami siap membantu Anda. Temukan jawaban dari pertanyaan umum atau hubungi tim support kami.",
    topicTitle: "Topik Populer",
    topicCards: [
      {
        id: generateId(),
        icon: "https://www.svgrepo.com/download/529282/user-hand-up.svg",
        title: "Akun & Profile",
        desc: "Cara mengelola akun dan memperbarui profil.",
        url: "https://google.com",
      },
      {
        id: generateId(),
        icon: "https://www.svgrepo.com/download/529011/heart-unlock.svg",
        title: "Keamanan",
        desc: "Tips menjaga keamanan akun dan transaksi",
        route: "/webview",
        routeArgs: { url: "https://google.com" },
      },
    ],
  });

  // Ensure all topic cards have IDs (for backward compatibility)
  const ensureTopicCardIds = (config: BantuanConfig): BantuanConfig => ({
    ...config,
    topicCards: config.topicCards.map(card => ({
      ...card,
      id: card.id || generateId(),
    })),
  });

  // Load bantuan config from API
  useEffect(() => {
    const loadBantuanConfig = async () => {
      try {
        setLoading(true);
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setBantuanConfig(getDefaultBantuanConfig());
          return;
        }

        const apiUrl = await getApiUrl("/admin/bantuan-config");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setBantuanConfig(ensureTopicCardIds(data.config));
          } else {
            setBantuanConfig(getDefaultBantuanConfig());
          }
        } else {
          setBantuanConfig(getDefaultBantuanConfig());
        }
      } catch (error) {
        setBantuanConfig(getDefaultBantuanConfig());
      } finally {
        setLoading(false);
      }
    };

    loadBantuanConfig();
  }, [authSeed]);

  // Save bantuan config to API
  const saveBantuanConfig = async (newConfig: BantuanConfig) => {
    try {
      setSaving(true);
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) return;

      const apiUrl = await getApiUrl("/admin/bantuan-config/save");
      await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
          "Session-Key": sessionKey,
          "Auth-Seed": authSeed,
        },
        body: JSON.stringify({ config: newConfig }),
      });
    } catch (error) {
    } finally {
      setSaving(false);
    }
  };

  // Expose save function to parent via ref
  useImperativeHandle(ref, () => ({
    save: async () => {
      if (bantuanConfigRef.current) {
        await saveBantuanConfig(bantuanConfigRef.current);
      }
    },
  }));

  const handleUpdate = (newConfig: BantuanConfig) => {
    setBantuanConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-500">Memuat konfigurasi bantuan...</p>
      </div>
    );
  }

  if (!bantuanConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Gagal memuat konfigurasi bantuan</p>
      </div>
    );
  }

  const handleUpdateField = (field: keyof BantuanConfig, value: string) => {
    handleUpdate({ ...bantuanConfig, [field]: value });
  };

  const handleAddTopicCard = () => {
    const newCard: TopicCard = {
      id: generateId(),
      icon: "https://www.svgrepo.com/download/529282/user-hand-up.svg",
      title: "Topik Baru",
      desc: "Deskripsi topik baru",
      url: "https://example.com",
    };
    setEditingCard(newCard);
    setEditingCardIndex(bantuanConfig.topicCards.length);
    setModalOpen(true);
  };

  const handleEditTopicCard = (index: number) => {
    setEditingCard({ ...bantuanConfig.topicCards[index] });
    setEditingCardIndex(index);
    setModalOpen(true);
  };

  const handleSaveTopicCard = (index: number, card: TopicCard) => {
    const newCards = [...bantuanConfig.topicCards];
    if (index >= newCards.length) {
      newCards.push(card);
    } else {
      newCards[index] = card;
    }
    handleUpdate({ ...bantuanConfig, topicCards: newCards });
  };

  const handleRemoveTopicCard = (index: number) => {
    const newCards = bantuanConfig.topicCards.filter((_, i) => i !== index);
    handleUpdate({ ...bantuanConfig, topicCards: newCards });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = bantuanConfig.topicCards.findIndex((card) => card.id === active.id);
      const newIndex = bantuanConfig.topicCards.findIndex((card) => card.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(bantuanConfig.topicCards, oldIndex, newIndex);
        handleUpdate({ ...bantuanConfig, topicCards: reordered });
      }
    }
  };

  // Mobile Preview Component
  const renderMobilePreview = () => (
    <div className="rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
        Pratinjau Pusat Bantuan
      </h3>
      <div
        className="relative bg-white rounded-3xl shadow-lg overflow-hidden mx-auto border-4 border-gray-800"
        style={{ width: 280, height: 520 }}
      >
        <div className="relative h-full flex flex-col">
          {/* Status bar */}
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
              <span className="text-sm font-semibold text-gray-800">Pusat Bantuan</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-gray-50 p-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {/* Main Card */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4">
              <div className="flex items-start gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: withOpacity(THEME_COLOR, 0.1) }}
                >
                  <HelpCircle size={14} style={{ color: THEME_COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-800 mb-1">
                    {bantuanConfig.mainCard || "Butuh Bantuan?"}
                  </p>
                  <p className="text-[8px] text-gray-500 leading-relaxed line-clamp-3">
                    {bantuanConfig.mainCardContent || "Pusat bantuan kami siap membantu Anda."}
                  </p>
                </div>
                <div className="w-3 h-3 bg-gray-200 rounded flex-shrink-0 mt-1"></div>
              </div>
            </div>

            {/* Topic Title */}
            <p className="text-[10px] font-semibold text-gray-700 mb-2 px-1">
              {bantuanConfig.topicTitle || "Topik Populer"}
            </p>

            {/* Topic Cards */}
            <div className="space-y-2">
              {bantuanConfig.topicCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-2.5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {card.icon && card.icon.startsWith('http') ? (
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100">
                        <img src={card.icon} alt="" className="w-4 h-4 object-contain" />
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: withOpacity(THEME_COLOR, 0.1) }}
                      >
                        <HelpCircle size={10} style={{ color: THEME_COLOR }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-gray-800 truncate">
                        {card.title}
                      </p>
                      <p className="text-[7px] text-gray-500 truncate">
                        {card.desc}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-gray-200 rounded flex-shrink-0"></div>
                  </div>
                </div>
              ))}
            </div>
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

  return (
    <div className="h-full overflow-hidden p-4">
      <div className="max-w-5xl mx-auto h-full">
        <div className="flex gap-6 h-full">
          {/* Left side - Preview (Static) */}
          <div className="flex-shrink-0 w-80 hidden lg:block overflow-hidden">
            {renderMobilePreview()}
          </div>

          {/* Right side - Settings (Scrollable) */}
          <div className="flex-1 space-y-4 min-w-0 overflow-y-auto pr-2">
            {/* Global Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Globe size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  Konfigurasi Global
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Pengaturan bantuan ini berlaku untuk <strong>semua aplikasi distro</strong>. 
                  Perubahan akan mempengaruhi tampilan Pusat Bantuan di semua versi aplikasi.
                </p>
              </div>
            </div>

            {/* Main Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle size={18} style={{ color: THEME_COLOR }} />
                <h3 className="text-sm font-medium text-gray-900">Konfigurasi Utama</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Judul Kartu Utama
                  </label>
                  <input
                    type="text"
                    value={bantuanConfig.mainCard}
                    onChange={(e) => handleUpdateField("mainCard", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Butuh Bantuan?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Konten Kartu Utama
                  </label>
                  <textarea
                    value={bantuanConfig.mainCardContent}
                    onChange={(e) => handleUpdateField("mainCardContent", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Deskripsi bantuan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Judul Bagian Topik
                  </label>
                  <input
                    type="text"
                    value={bantuanConfig.topicTitle}
                    onChange={(e) => handleUpdateField("topicTitle", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Topik Populer"
                  />
                </div>
              </div>
            </div>

            {/* Topic Cards */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-purple-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Kartu Topik</h3>
                    <p className="text-xs text-gray-500">{bantuanConfig.topicCards.length} topik</p>
                  </div>
                </div>
                <button
                  onClick={handleAddTopicCard}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-lg flex items-center gap-1"
                  style={{ backgroundColor: THEME_COLOR }}
                >
                  <Plus size={14} />
                  Tambah Topik
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={bantuanConfig.topicCards.map((card) => card.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {bantuanConfig.topicCards.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Belum ada kartu topik</p>
                        <p className="text-xs">Klik "Tambah Topik" untuk menambahkan</p>
                      </div>
                    ) : (
                      bantuanConfig.topicCards.map((card, index) => (
                        <SortableTopicCard
                          key={card.id}
                          card={card}
                          index={index}
                          onEdit={() => handleEditTopicCard(index)}
                          onRemove={() => handleRemoveTopicCard(index)}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Panduan Penggunaan
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Drag kartu topik untuk mengubah urutan tampilan</li>
                <li>Klik ikon pensil untuk mengedit detail kartu</li>
                <li>Gunakan URL langsung untuk membuka browser eksternal</li>
                <li>Gunakan WebView untuk membuka dalam aplikasi</li>
                <li>Upload icon atau pilih dari asset yang tersedia</li>
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

      {/* Edit Modal */}
      <TopicCardModal
        isOpen={modalOpen}
        card={editingCard}
        index={editingCardIndex}
        onSave={handleSaveTopicCard}
        onClose={() => {
          setModalOpen(false);
          setEditingCard(null);
          setEditingCardIndex(-1);
        }}
        authSeed={authSeed}
      />
    </div>
  );
});

export default BantuanCustomizationEditor;
