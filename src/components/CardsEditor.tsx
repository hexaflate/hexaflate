import React, { useState, useEffect, useRef } from "react";
import { ContentSection, CardItem, ActionButton } from "../types";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  AlertTriangle,
  Copy,
  Upload,
  Image as ImageIcon,
  X,
  GripVertical,
  Bell,
  Type,
  Palette,
  Navigation,
  MousePointer,
  LayoutGrid,
  HelpCircle,
} from "lucide-react";
import AssetsManager from "./AssetsManager";
import ImageHoverPreview from "./ImageHoverPreview";
import RouteArgsEditor from "./RouteArgsEditor";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import { getIconsByCategory } from "../data/actionButtonIcons";
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface CardsEditorProps {
  widget: ContentSection;
  onSave: (updates: Partial<ContentSection>) => void;
  onClose: () => void;
  authSeed?: string;
}

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, isExpanded, onToggle, children }) => (
  <div className="border-b border-neutral-100 last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 py-2.5 px-2 hover:bg-primary-50/30 transition-all duration-200 rounded-lg"
    >
      <span className="text-neutral-400 p-1 bg-neutral-100 rounded-lg">{icon}</span>
      <div className="flex-1 text-left">
        <span className="text-xs font-medium text-neutral-700">{title}</span>
        {!isExpanded && subtitle && (
          <span className="text-[11px] text-neutral-400 ml-2">{subtitle}</span>
        )}
      </div>
      {isExpanded ? (
        <ChevronDown size={12} className="text-primary-500" />
      ) : (
        <ChevronRight size={12} className="text-neutral-400" />
      )}
    </button>
    {isExpanded && <div className="pb-3 px-2 space-y-2">{children}</div>}
  </div>
);

const CardsEditor: React.FC<CardsEditorProps> = ({
  widget,
  onSave,
  onClose,
  authSeed = "",
}) => {
  const [localWidget, setLocalWidget] = useState<ContentSection>(widget);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("content");
  const [cardColors, setCardColors] = useState<string[]>([]);

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const [pendingAction, setPendingAction] = useState<"close" | null>(null);
  const originalWidgetRef = useRef<ContentSection>(widget);

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Generate random colors for cards
  useEffect(() => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D7BDE2",
    ];

    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    setCardColors(shuffledColors);
  }, []);

  // Check if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const hasChanges =
      JSON.stringify(localWidget) !== JSON.stringify(originalWidgetRef.current);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };

  // Check for changes whenever localWidget changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [localWidget]);

  // Handle beforeunload event (tab/browser close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleCardExpansion = (index: number) => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
      setExpandedSection("content");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const addCard = () => {
    const newCard: CardItem = {
      id: `card_${Date.now()}`,
      backgroundColor: "#4A90D9",
      height: 120,
    };

    const newCards = [...(localWidget.cards || []), newCard];
    setLocalWidget({ ...localWidget, cards: newCards });
    setExpandedCard(newCards.length - 1);
    setExpandedSection("content");
  };

  const duplicateCard = (index: number) => {
    const cards = localWidget.cards || [];
    const cardToDuplicate = cards[index];

    const duplicatedCard: CardItem = {
      ...cardToDuplicate,
      id: `card_${Date.now()}`,
      title: cardToDuplicate.title
        ? `${cardToDuplicate.title} (Copy)`
        : undefined,
    };

    const newCards = [...cards];
    newCards.splice(index + 1, 0, duplicatedCard);
    setLocalWidget({ ...localWidget, cards: newCards });
    setExpandedCard(index + 1);
    setExpandedSection("content");
  };

  const deleteCard = (index: number) => {
    const newCards = (localWidget.cards || []).filter((_, i) => i !== index);
    setLocalWidget({ ...localWidget, cards: newCards });
    setExpandedCard(null);
  };

  const updateCard = (index: number, updates: Partial<CardItem>) => {
    const newCards = [...(localWidget.cards || [])];
    newCards[index] = { ...newCards[index], ...updates };
    setLocalWidget({ ...localWidget, cards: newCards });
  };

  const getCardColor = (index: number) => {
    return cardColors[index % cardColors.length] || "#E5E7EB";
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction("close");
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

  const handleSave = () => {
    onSave({
      cards: localWidget.cards,
      gridColumns: localWidget.gridColumns,
      spacing: localWidget.spacing,
      padding: localWidget.padding,
    });
    originalWidgetRef.current = localWidget;
    setHasUnsavedChanges(false);
  };

  const getPublicUrl = async (filename: string) => {
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
        let filename = data.filename || data.asset?.filename;
        let publicUrl =
          data.public_url || data.asset?.public_url || data.file_url;

        if (publicUrl && publicUrl.startsWith("/")) {
          const baseUrl = await getApiUrl("");
          publicUrl = `${baseUrl}${publicUrl}`;
        }

        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }

        if (publicUrl) {
          setAssetsRefreshTrigger((prev) => prev + 1);
          return publicUrl;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    cardIndex: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);
    if (url) {
      updateCard(cardIndex, { imageUrl: url });
    }

    if (fileInputRefs.current[cardIndex]) {
      fileInputRefs.current[cardIndex]!.value = "";
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url && currentCardIndex !== null) {
      updateCard(currentCardIndex, { imageUrl: url });
      setShowAssetPicker(false);
      setCurrentCardIndex(null);
    }
  };

  const openAssetPicker = (cardIndex: number) => {
    setCurrentCardIndex(cardIndex);
    setShowAssetPicker(true);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-[90vw] max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Cards Editor
            </h2>
            <p className="text-xs text-gray-600">
              Kelola cards widget dengan konfigurasi lengkap
            </p>
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
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                hasUnsavedChanges
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "text-white"
              }`}
              style={!hasUnsavedChanges ? { backgroundColor: THEME_COLOR } : undefined}
            >
              <Save size={16} />
              {hasUnsavedChanges ? "Simpan Perubahan*" : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Grid Configuration - Compact */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">Konfigurasi Grid</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Kolom</label>
                <select
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                  value={localWidget.gridColumns ?? 2}
                  onChange={(e) =>
                    setLocalWidget({
                      ...localWidget,
                      gridColumns: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={1}>1 Kolom</option>
                  <option value={2}>2 Kolom</option>
                  <option value={3}>3 Kolom</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Jarak ({localWidget.spacing ?? 12}px)</label>
                <input
                  type="range"
                  className="w-full h-1.5 accent-blue-500"
                  value={localWidget.spacing ?? 12}
                  onChange={(e) =>
                    setLocalWidget({
                      ...localWidget,
                      spacing: parseFloat(e.target.value),
                    })
                  }
                  min="0"
                  max="32"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Padding (L/R/T/B)</label>
                <div className="grid grid-cols-4 gap-1">
                  <input
                    type="number"
                    className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center"
                    value={localWidget.padding?.left ?? 16}
                    onChange={(e) =>
                      setLocalWidget({
                        ...localWidget,
                        padding: {
                          ...localWidget.padding,
                          left: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center"
                    value={localWidget.padding?.right ?? 16}
                    onChange={(e) =>
                      setLocalWidget({
                        ...localWidget,
                        padding: {
                          ...localWidget.padding,
                          right: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center"
                    value={localWidget.padding?.top ?? 8}
                    onChange={(e) =>
                      setLocalWidget({
                        ...localWidget,
                        padding: {
                          ...localWidget.padding,
                          top: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded text-center"
                    value={localWidget.padding?.bottom ?? 8}
                    onChange={(e) =>
                      setLocalWidget({
                        ...localWidget,
                        padding: {
                          ...localWidget.padding,
                          bottom: parseFloat(e.target.value),
                        },
                      })
                    }
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Card Button */}
          <div className="mb-3">
            <button
              onClick={addCard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
            >
              <Plus size={14} />
              Tambah Card
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-1">
            {(localWidget.cards || []).map((card, index) => {
              const isExpanded = expandedCard === index;

              return (
                <div
                  key={card.id || index}
                  className="border border-gray-200 rounded overflow-hidden"
                  style={{ backgroundColor: getCardColor(index) + "10" }}
                >
                  {/* Card Header */}
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCardExpansion(index)}
                  >
                    <GripVertical size={12} className="text-gray-400" />

                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          card.backgroundColor || getCardColor(index),
                      }}
                    />

                    {isExpanded ? (
                      <ChevronDown size={12} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={12} className="text-gray-400" />
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-800 truncate block">
                        {card.title || `Card ${index + 1}`}
                      </span>
                      {!isExpanded && card.subtitle && (
                        <span className="text-[11px] text-gray-400 truncate block">
                          {card.subtitle}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCard(index);
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Duplikat"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCard(index);
                        }}
                        className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Card Content - Collapsible Sections */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white px-3 py-2">
                      {/* Content Section */}
                      <CollapsibleSection
                        icon={<Type size={12} />}
                        title="Konten"
                        subtitle={card.title || "Belum diisi"}
                        isExpanded={expandedSection === "content"}
                        onToggle={() => toggleSection("content")}
                      >
                        <div className="space-y-2">
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-0.5">Judul</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                              value={card.title || ""}
                              onChange={(e) => updateCard(index, { title: e.target.value })}
                              placeholder="Judul Card"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-0.5">Subtitle</label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                              value={card.subtitle || ""}
                              onChange={(e) => updateCard(index, { subtitle: e.target.value })}
                              placeholder="Contoh: Poin: {{points}}"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 block mb-0.5">Gambar Latar</label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                                value={card.imageUrl || ""}
                                onChange={(e) => updateCard(index, { imageUrl: e.target.value })}
                                placeholder="URL gambar"
                              />
                              <input
                                ref={(el) => (fileInputRefs.current[index] = el)}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, index)}
                                className="hidden"
                              />
                              {card.imageUrl && (
                                <ImageHoverPreview
                                  src={card.imageUrl}
                                  alt="Card image preview"
                                  thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[index]?.click()}
                                className="px-1.5 py-1 text-white rounded"
                                style={{ backgroundColor: THEME_COLOR }}
                                title="Upload"
                              >
                                <Upload size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openAssetPicker(index)}
                                className="px-1.5 py-1 bg-success-500 text-white rounded hover:bg-success-600"
                                title="Assets"
                              >
                                <ImageIcon size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* Styling Section */}
                      <CollapsibleSection
                        icon={<Palette size={12} />}
                        title="Styling"
                        subtitle={card.backgroundGradient ? "Gradient" : card.backgroundColor}
                        isExpanded={expandedSection === "styling"}
                        onToggle={() => toggleSection("styling")}
                      >
                        <div className="space-y-2">
                          {/* Background Type Toggle */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className={`flex-1 px-2 py-1 text-[11px] rounded ${!card.backgroundGradient ? "text-white" : "bg-gray-100 text-gray-600"}`}
                              style={!card.backgroundGradient ? { backgroundColor: THEME_COLOR } : undefined}
                              onClick={() => updateCard(index, { backgroundGradient: undefined })}
                            >
                              Solid
                            </button>
                            <button
                              type="button"
                              className={`flex-1 px-2 py-1 text-[11px] rounded ${card.backgroundGradient ? "text-white" : "bg-gray-100 text-gray-600"}`}
                              style={card.backgroundGradient ? { backgroundColor: THEME_COLOR } : undefined}
                              onClick={() => updateCard(index, {
                                backgroundGradient: {
                                  colors: [card.backgroundColor || "#4A90D9", "#50C878"],
                                  begin: "topLeft",
                                  end: "bottomRight",
                                },
                              })}
                            >
                              Gradient
                            </button>
                          </div>

                          {/* Solid Color */}
                          {!card.backgroundGradient && (
                            <div className="flex gap-1 items-center">
                              <input
                                type="color"
                                className="w-8 h-6 rounded border cursor-pointer"
                                value={card.backgroundColor || "#4A90D9"}
                                onChange={(e) => updateCard(index, { backgroundColor: e.target.value })}
                              />
                              <input
                                type="text"
                                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                                value={card.backgroundColor || "#4A90D9"}
                                onChange={(e) => updateCard(index, { backgroundColor: e.target.value })}
                              />
                            </div>
                          )}

                          {/* Gradient Colors */}
                          {card.backgroundGradient && (
                            <div className="space-y-1.5 p-2 bg-gray-50 rounded">
                              <div className="flex gap-1 items-center">
                                <span className="text-[11px] text-gray-500 w-10">Dari:</span>
                                <input
                                  type="color"
                                  className="w-6 h-5 rounded border cursor-pointer"
                                  value={card.backgroundGradient.colors?.[0] || "#4A90D9"}
                                  onChange={(e) => updateCard(index, {
                                    backgroundGradient: {
                                      ...card.backgroundGradient!,
                                      colors: [e.target.value, card.backgroundGradient?.colors?.[1] || "#50C878"],
                                    },
                                  })}
                                />
                                <input
                                  type="text"
                                  className="flex-1 px-1 py-0.5 text-[11px] border border-gray-200 rounded"
                                  value={card.backgroundGradient.colors?.[0] || "#4A90D9"}
                                  onChange={(e) => updateCard(index, {
                                    backgroundGradient: {
                                      ...card.backgroundGradient!,
                                      colors: [e.target.value, card.backgroundGradient?.colors?.[1] || "#50C878"],
                                    },
                                  })}
                                />
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-[11px] text-gray-500 w-10">Ke:</span>
                                <input
                                  type="color"
                                  className="w-6 h-5 rounded border cursor-pointer"
                                  value={card.backgroundGradient.colors?.[1] || "#50C878"}
                                  onChange={(e) => updateCard(index, {
                                    backgroundGradient: {
                                      ...card.backgroundGradient!,
                                      colors: [card.backgroundGradient?.colors?.[0] || "#4A90D9", e.target.value],
                                    },
                                  })}
                                />
                                <input
                                  type="text"
                                  className="flex-1 px-1 py-0.5 text-[11px] border border-gray-200 rounded"
                                  value={card.backgroundGradient.colors?.[1] || "#50C878"}
                                  onChange={(e) => updateCard(index, {
                                    backgroundGradient: {
                                      ...card.backgroundGradient!,
                                      colors: [card.backgroundGradient?.colors?.[0] || "#4A90D9", e.target.value],
                                    },
                                  })}
                                />
                              </div>
                              <div className="flex gap-1 items-center">
                                <span className="text-[11px] text-gray-500 w-10">Arah:</span>
                                <select
                                  className="flex-1 px-1 py-0.5 text-[11px] border border-gray-200 rounded"
                                  value={`${card.backgroundGradient.begin || "topLeft"}-${card.backgroundGradient.end || "bottomRight"}`}
                                  onChange={(e) => {
                                    const [begin, end] = e.target.value.split("-");
                                    updateCard(index, {
                                      backgroundGradient: { ...card.backgroundGradient!, begin, end },
                                    });
                                  }}
                                >
                                  <option value="topLeft-bottomRight">↘ Diagonal</option>
                                  <option value="topRight-bottomLeft">↙ Diagonal</option>
                                  <option value="topCenter-bottomCenter">↓ Vertikal</option>
                                  <option value="centerLeft-centerRight">→ Horizontal</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Dimensions */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] text-gray-500 block mb-0.5">Tinggi ({card.height ?? 120}px)</label>
                              <input
                                type="range"
                                className="w-full h-1.5 accent-blue-500"
                                value={card.height ?? 120}
                                onChange={(e) => updateCard(index, { height: parseFloat(e.target.value) })}
                                min="60"
                                max="300"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-gray-500 block mb-0.5">Radius ({card.borderRadius ?? 12}px)</label>
                              <input
                                type="range"
                                className="w-full h-1.5 accent-blue-500"
                                value={card.borderRadius ?? 12}
                                onChange={(e) => updateCard(index, { borderRadius: parseFloat(e.target.value) })}
                                min="0"
                                max="50"
                              />
                            </div>
                          </div>

                          {/* Preview */}
                          <div
                            className="relative overflow-hidden"
                            style={{
                              height: Math.min(card.height ?? 120, 80),
                              borderRadius: card.borderRadius ?? 12,
                              backgroundColor: !card.backgroundGradient ? card.backgroundColor || "#4A90D9" : undefined,
                              backgroundImage: card.imageUrl
                                ? `url(${card.imageUrl})`
                                : card.backgroundGradient
                                  ? getGradientCSS(card.backgroundGradient)
                                  : undefined,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            <div
                              className="absolute inset-0 flex flex-col justify-end p-2"
                              style={{ background: card.imageUrl ? "linear-gradient(to bottom, transparent, rgba(0,0,0,0.6))" : undefined }}
                            >
                              <div
                                className="font-bold text-[11px] truncate"
                                style={{
                                  color: card.imageUrl || card.backgroundGradient ? "#fff" : isLightColor(card.backgroundColor || "#4A90D9") ? "#000" : "#fff",
                                }}
                              >
                                {card.title || "Judul Card"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleSection>

                      {/* Navigation Section */}
                      <CollapsibleSection
                        icon={<Navigation size={12} />}
                        title="Navigasi"
                        subtitle={card.route || card.url || "Tidak diatur"}
                        isExpanded={expandedSection === "navigation"}
                        onToggle={() => toggleSection("navigation")}
                      >
                        <div className="p-2 bg-gray-50 rounded">
                          <RouteArgsEditor
                            route={card.route}
                            url={card.url}
                            routeArgs={card.routeArgs}
                            onChange={(config) => {
                              updateCard(index, {
                                route: config.route,
                                url: config.url,
                                routeArgs: config.routeArgs,
                              });
                            }}
                            showValidation={true}
                            allowUrlMode={true}
                            allowRouteMode={true}
                          />
                        </div>
                      </CollapsibleSection>

                      {/* Action Buttons Section */}
                      <CollapsibleSection
                        icon={<MousePointer size={12} />}
                        title="Tombol Aksi"
                        subtitle={`${(card.action_buttons || []).length}/3`}
                        isExpanded={expandedSection === "actions"}
                        onToggle={() => toggleSection("actions")}
                      >
                        <div className="space-y-2">
                          {(card.action_buttons || []).map((button, btnIndex) => (
                            <div key={btnIndex} className="p-2 border border-gray-200 rounded bg-gray-50">
                              <div className="flex items-center gap-2 mb-2">
                                <select
                                  className="flex-1 px-1 py-0.5 text-[11px] border border-gray-200 rounded"
                                  value={button.icon || ""}
                                  onChange={(e) => {
                                    const newButtons = [...(card.action_buttons || [])];
                                    newButtons[btnIndex] = { ...newButtons[btnIndex], icon: e.target.value };
                                    updateCard(index, { action_buttons: newButtons });
                                  }}
                                >
                                  <option value="">Ikon</option>
                                  {Object.entries(getIconsByCategory()).map(([category, icons]) => (
                                    <optgroup key={category} label={category}>
                                      {icons.map((icon) => (
                                        <option key={icon.name} value={icon.name}>{icon.displayName}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                                <select
                                  className="w-20 px-1 py-0.5 text-[11px] border border-gray-200 rounded"
                                  value={button.type || ""}
                                  onChange={(e) => {
                                    const newButtons = [...(card.action_buttons || [])];
                                    newButtons[btnIndex] = { ...newButtons[btnIndex], type: e.target.value || undefined };
                                    updateCard(index, { action_buttons: newButtons });
                                  }}
                                >
                                  <option value="">Normal</option>
                                  <option value="notification">Badge</option>
                                </select>
                                <button
                                  onClick={() => {
                                    const newButtons = (card.action_buttons || []).filter((_, i) => i !== btnIndex);
                                    updateCard(index, { action_buttons: newButtons });
                                  }}
                                  className="p-0.5 text-danger-500 hover:bg-danger-50 rounded"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <input
                                type="text"
                                className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded mb-2"
                                value={button.title || ""}
                                onChange={(e) => {
                                  const newButtons = [...(card.action_buttons || [])];
                                  newButtons[btnIndex] = { ...newButtons[btnIndex], title: e.target.value || undefined };
                                  updateCard(index, { action_buttons: newButtons });
                                }}
                                placeholder="Judul Screen"
                              />
                              <RouteArgsEditor
                                route={button.route}
                                url={button.url}
                                routeArgs={button.routeArgs}
                                onChange={(config) => {
                                  const newButtons = [...(card.action_buttons || [])];
                                  newButtons[btnIndex] = {
                                    ...newButtons[btnIndex],
                                    route: config.route,
                                    url: config.url,
                                    routeArgs: config.routeArgs,
                                  };
                                  updateCard(index, { action_buttons: newButtons });
                                }}
                                showValidation={true}
                                allowUrlMode={true}
                                allowRouteMode={true}
                              />
                            </div>
                          ))}

                          {(card.action_buttons || []).length === 0 && (
                            <div className="text-center py-2 text-[11px] text-gray-400">
                              Belum ada tombol aksi
                            </div>
                          )}

                          <button
                            onClick={() => {
                              const currentButtons = card.action_buttons || [];
                              if (currentButtons.length >= 3) return;
                              const newButton: ActionButton = { icon: "open_in_new" };
                              updateCard(index, { action_buttons: [...currentButtons, newButton] });
                            }}
                            disabled={(card.action_buttons || []).length >= 3}
                            className={`w-full py-1 px-2 text-[11px] font-medium rounded transition-colors ${
                              (card.action_buttons || []).length >= 3
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200"
                            }`}
                          >
                            + Tambah Tombol
                          </button>
                        </div>
                      </CollapsibleSection>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {(!localWidget.cards || localWidget.cards.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🃏</div>
              <p className="text-xs text-gray-500 mb-3">Belum ada kartu</p>
              <button
                onClick={addCard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success-500 text-white rounded hover:bg-success-600 transition-colors mx-auto"
              >
                <Plus size={14} />
                Tambah Kartu
              </button>
            </div>
          )}

          {/* Variables Help Section - Collapsible */}
          <details className="mt-4 bg-primary-50 border border-primary-200 rounded">
            <summary className="flex items-center gap-2 p-2 cursor-pointer text-xs font-medium text-primary-800">
              <HelpCircle size={12} />
              Variabel Dinamis
            </summary>
            <div className="px-2 pb-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{name}}"}</code>
                  <span className="text-primary-600 ml-1">Nama</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{email}}"}</code>
                  <span className="text-primary-600 ml-1">Email</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{saldo}}"}</code>
                  <span className="text-primary-600 ml-1">Saldo (Rp)</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{komisi}}"}</code>
                  <span className="text-primary-600 ml-1">Komisi</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{poin}}"}</code>
                  <span className="text-primary-600 ml-1">Poin</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{kode}}"}</code>
                  <span className="text-primary-600 ml-1">Kode</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{alamat}}"}</code>
                  <span className="text-primary-600 ml-1">Alamat</span>
                </div>
                <div className="text-primary-800">
                  <code className="bg-primary-100 px-0.5 rounded">{"{{tgl_daftar}}"}</code>
                  <span className="text-primary-600 ml-1">Tgl Daftar</span>
                </div>
              </div>
            </div>
          </details>
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
                <h3 className="text-lg font-semibold text-gray-800">
                  Perubahan Belum Disimpan
                </h3>
                <p className="text-sm text-gray-600">
                  Anda memiliki perubahan yang belum disimpan yang akan hilang.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menutup editor? Semua perubahan yang
                belum disimpan akan hilang.
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
              <h3 className="text-lg font-semibold text-gray-800">
                Pilih atau Upload Asset
              </h3>
              <button
                onClick={() => {
                  setShowAssetPicker(false);
                  setCurrentCardIndex(null);
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
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk
                  memilih dan menerapkan ke kartu.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to determine if a color is light
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// Convert gradient config to CSS gradient string
function getGradientCSS(gradient: {
  colors: string[];
  begin?: string;
  end?: string;
}): string {
  const directionMap: Record<string, string> = {
    "topLeft-bottomRight": "to bottom right",
    "topRight-bottomLeft": "to bottom left",
    "topCenter-bottomCenter": "to bottom",
    "centerLeft-centerRight": "to right",
    "bottomLeft-topRight": "to top right",
    "bottomRight-topLeft": "to top left",
  };

  const key = `${gradient.begin || "topLeft"}-${gradient.end || "bottomRight"}`;
  const direction = directionMap[key] || "to bottom right";
  const colors = gradient.colors || ["#4A90D9", "#50C878"];

  return `linear-gradient(${direction}, ${colors.join(", ")})`;
}

export default CardsEditor;
