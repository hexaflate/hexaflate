import React, { useState, useEffect } from "react";
import { GlobalTheming } from "../../types";
import {
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Plus,
  X,
  Hash,
} from "lucide-react";
import { THEME_COLOR, THEME_COLOR_LIGHT } from "../../utils/themeColors";

interface MenuDepositCustomizationEditorProps {
  globalConfig?: GlobalTheming;
  onUpdate: (config: GlobalTheming) => void;
  selectedMenu?: string;
  authSeed?: string;
}

// Helper to get distro suffix from menu name
const getDistroSuffix = (selectedMenu?: string): string => {
  if (!selectedMenu || selectedMenu === "Aplikasi Utama") {
    return "";
  }
  return selectedMenu.replace(/\.json$/, "");
};

// Format nominal for display
const formatNominal = (value: number): string => {
  if (value >= 1000000) {
    return `${value / 1000000}JT`;
  } else if (value >= 1000) {
    return `${value / 1000}K`;
  }
  return value.toString();
};

const MenuDepositCustomizationEditor: React.FC<MenuDepositCustomizationEditorProps> = ({
  globalConfig,
  onUpdate,
  selectedMenu,
}) => {
  const distroSuffix = getDistroSuffix(selectedMenu);
  const isDistro = distroSuffix !== "";

  // Keys with distro suffix
  const showBalanceCardKey = `menuDepositShowBalanceCard${distroSuffix}` as keyof GlobalTheming;
  const termsMarkdownUrlKey = `menuDepositTermsMarkdownUrl${distroSuffix}` as keyof GlobalTheming;
  const termsTextKey = `menuDepositTermsText${distroSuffix}` as keyof GlobalTheming;
  const nominalsKey = `menuDepositNominals${distroSuffix}` as keyof GlobalTheming;

  // Get values using dynamic keys
  const configAny = globalConfig as Record<string, string | boolean | undefined> | undefined;

  // Balance card: default to enabled (true) if not set
  const showBalanceCardRaw = configAny?.[showBalanceCardKey];
  const showBalanceCard = showBalanceCardRaw === undefined ? true : 
    (typeof showBalanceCardRaw === 'boolean' ? showBalanceCardRaw : showBalanceCardRaw !== 'false');

  const termsMarkdownUrl = (configAny?.[termsMarkdownUrlKey] as string) || "";
  const termsText = (configAny?.[termsTextKey] as string) || "";
  const nominalsStr = (configAny?.[nominalsKey] as string) || "";

  // Default nominals
  const defaultNominals = [50000, 100000, 200000, 500000, 1000000, 2000000];

  // Parse nominals from string
  const parseNominals = (str: string): number[] => {
    if (!str) return [];
    try {
      return str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
    } catch {
      return [];
    }
  };

  const customNominals = parseNominals(nominalsStr);
  const displayNominals = customNominals.length > 0 ? customNominals : defaultNominals;

  // Expanded section state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Terms content type state
  const [termsContentType, setTermsContentType] = useState<'default' | 'markdown' | 'text'>(
    termsMarkdownUrl ? 'markdown' : (termsText ? 'text' : 'default')
  );

  // New nominal input state
  const [newNominalInput, setNewNominalInput] = useState("");

  // Markdown preview state
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [markdownLoading, setMarkdownLoading] = useState(false);

  // Update terms content type when values change
  useEffect(() => {
    if (termsMarkdownUrl) {
      setTermsContentType('markdown');
    } else if (termsText) {
      setTermsContentType('text');
    } else {
      setTermsContentType('default');
    }
  }, [termsMarkdownUrl, termsText]);

  // Fetch markdown content when URL changes
  useEffect(() => {
    if (!termsMarkdownUrl) {
      setMarkdownContent("");
      return;
    }

    const fetchMarkdown = async () => {
      setMarkdownLoading(true);
      try {
        const response = await fetch(termsMarkdownUrl);
        if (response.ok) {
          const text = await response.text();
          setMarkdownContent(text);
        } else {
          setMarkdownContent("");
        }
      } catch (error) {
        setMarkdownContent("");
      } finally {
        setMarkdownLoading(false);
      }
    };

    fetchMarkdown();
  }, [termsMarkdownUrl]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleShowBalanceCardChange = (enabled: boolean) => {
    onUpdate({
      ...globalConfig,
      [showBalanceCardKey]: enabled ? 'true' : 'false',
    } as GlobalTheming);
  };

  const handleTermsContentTypeChange = (type: 'default' | 'markdown' | 'text') => {
    setTermsContentType(type);

    if (type === 'default') {
      // Set to empty string to explicitly clear the values in backend
      onUpdate({
        ...globalConfig,
        [termsMarkdownUrlKey]: '',
        [termsTextKey]: '',
      } as GlobalTheming);
    } else if (type === 'markdown') {
      // Clear text when switching to markdown
      onUpdate({
        ...globalConfig,
        [termsTextKey]: '',
      } as GlobalTheming);
    } else if (type === 'text') {
      // Clear markdown URL when switching to text
      onUpdate({
        ...globalConfig,
        [termsMarkdownUrlKey]: '',
      } as GlobalTheming);
    }
  };

  const handleTermsMarkdownUrlChange = (value: string) => {
    onUpdate({
      ...globalConfig,
      [termsMarkdownUrlKey]: value || undefined,
    } as GlobalTheming);
  };

  const handleTermsTextChange = (value: string) => {
    onUpdate({
      ...globalConfig,
      [termsTextKey]: value || undefined,
    } as GlobalTheming);
  };

  const handleAddNominal = () => {
    const value = parseInt(newNominalInput.replace(/[^\d]/g, ''), 10);
    if (isNaN(value) || value <= 0) return;

    const currentNominals = customNominals.length > 0 ? customNominals : [...defaultNominals];
    if (currentNominals.includes(value)) {
      setNewNominalInput("");
      return;
    }

    const newNominals = [...currentNominals, value].sort((a, b) => a - b);
    onUpdate({
      ...globalConfig,
      [nominalsKey]: newNominals.join(','),
    } as GlobalTheming);
    setNewNominalInput("");
  };

  const handleRemoveNominal = (value: number) => {
    const currentNominals = customNominals.length > 0 ? customNominals : [...defaultNominals];
    const newNominals = currentNominals.filter(n => n !== value);

    if (newNominals.length === 0) {
      // If all removed, clear the custom nominals (use default)
      const newConfig = { ...globalConfig } as Record<string, unknown>;
      delete newConfig[nominalsKey];
      onUpdate(newConfig as GlobalTheming);
    } else {
      onUpdate({
        ...globalConfig,
        [nominalsKey]: newNominals.join(','),
      } as GlobalTheming);
    }
  };

  const handleResetNominals = () => {
    const newConfig = { ...globalConfig } as Record<string, unknown>;
    delete newConfig[nominalsKey];
    onUpdate(newConfig as GlobalTheming);
  };

  // Render deposit screen preview
  const renderDepositPreview = () => {
    return (
      <div className="rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
          Pratinjau Menu Deposit
        </h3>
        <div
          className="relative bg-white rounded-3xl shadow-lg overflow-hidden mx-auto border-4 border-gray-800"
          style={{ width: 280, height: 560 }}
        >
          <div className="relative h-full flex flex-col">
            {/* Status bar mockup */}
            <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-600">
              <span>9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-gray-400 rounded-sm"></div>
                <div className="w-4 h-2 bg-gray-400 rounded-sm"></div>
                <div className="w-5 h-2 bg-gray-400 rounded-sm"></div>
              </div>
            </div>

            {/* App bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/90">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <span className="text-sm font-medium">Deposit</span>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>

            {/* Content area */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {/* Balance Card - uses THEME_COLOR */}
              {showBalanceCard && (
                <div
                  className="rounded-xl p-4 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
                  }}
                >
                  <div className="space-y-1">
                    <span className="text-xs text-white">Saldo Anda</span>
                    <div className="text-[8px] text-white/80">05 Desember 2024</div>
                    <div className="text-lg font-bold text-white">Rp1.234.567</div>
                  </div>
                </div>
              )}

              {/* Amount input mockup */}
              <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Rp</span>
                <span className="text-[10px] text-gray-400">Masukkan nominal</span>
              </div>

              {/* Nominal chips - uses actual configured nominals */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {displayNominals.map((nom) => (
                  <div
                    key={nom}
                    className="px-2 py-1 bg-gray-100 rounded-full text-[8px] text-gray-600"
                  >
                    Rp{formatNominal(nom)}
                  </div>
                ))}
              </div>

              {/* Terms section mockup */}
              <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                <div className="flex items-center gap-1">
                  <Info size={8} className="text-gray-400" />
                  <span className="text-[8px] font-medium text-gray-600">
                    Syarat & Ketentuan
                  </span>
                </div>
                {termsContentType === 'default' ? (
                  <div className="space-y-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-1">
                        <div className="w-2 h-2 bg-gray-300 rounded mt-0.5"></div>
                        <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : termsContentType === 'markdown' ? (
                  <div className="text-[8px] text-gray-500 italic">
                    {markdownLoading ? 'Loading...' : (markdownContent ? 'Markdown content' : 'No content')}
                  </div>
                ) : (
                  <div className="text-[8px] text-gray-500 italic line-clamp-3">
                    {termsText || 'Custom text content'}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom button */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="bg-gray-200 rounded-xl py-2.5 text-center">
                <span className="text-xs text-gray-500 font-medium">
                  Lanjut ke Pembayaran
                </span>
              </div>
              <div className="flex justify-center pt-2">
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
            {renderDepositPreview()}
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
                    Konfigurasi menu deposit ini akan disimpan dengan suffix{" "}
                    <code className="bg-indigo-100 px-1 rounded">
                      {distroSuffix}
                    </code>{" "}
                    dan hanya berlaku untuk aplikasi distro tersebut.
                  </p>
                </div>
              </div>
            )}

            {/* Balance Card Toggle Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("balanceCard")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-cyan-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Kartu Saldo
                    </h3>
                    <p className="text-xs text-gray-500">
                      {showBalanceCard ? "Ditampilkan" : "Disembunyikan"}
                    </p>
                  </div>
                </div>
                {expandedSection === "balanceCard" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "balanceCard" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Tampilkan Kartu Saldo
                      </span>
                      <p className="text-xs text-gray-500">
                        Kartu yang menampilkan saldo pengguna di bagian atas halaman deposit
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showBalanceCard}
                        onChange={(e) => handleShowBalanceCardChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Nominals Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("nominals")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Hash size={18} className="text-purple-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Nominal Deposit
                    </h3>
                    <p className="text-xs text-gray-500">
                      {customNominals.length > 0 ? `${customNominals.length} nominal kustom` : "Default"}
                    </p>
                  </div>
                </div>
                {expandedSection === "nominals" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "nominals" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  {/* Current nominals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nominal Saat Ini
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {displayNominals.map((nom) => (
                        <div
                          key={nom}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                        >
                          <span>Rp{formatNominal(nom)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNominal(nom)}
                            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add new nominal */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tambah Nominal Baru
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                        <input
                          type="text"
                          value={newNominalInput}
                          onChange={(e) => setNewNominalInput(e.target.value.replace(/[^\d]/g, ''))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNominal()}
                          placeholder="100000"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddNominal}
                        className="px-3 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-1"
                      >
                        <Plus size={16} />
                        <span className="text-sm">Tambah</span>
                      </button>
                    </div>
                  </div>

                  {/* Reset button */}
                  {customNominals.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetNominals}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Reset ke default
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Terms Content Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("terms")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-green-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Syarat & Ketentuan
                    </h3>
                    <p className="text-xs text-gray-500">
                      {termsContentType === 'default' ? 'Default' : 
                       termsContentType === 'markdown' ? 'Custom Markdown' : 'Custom Text'}
                    </p>
                  </div>
                </div>
                {expandedSection === "terms" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "terms" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  {/* Content type selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Konten
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'default', label: 'Default' },
                        { value: 'markdown', label: 'Markdown URL' },
                        { value: 'text', label: 'Teks Kustom' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTermsContentTypeChange(option.value as 'default' | 'markdown' | 'text')}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            termsContentType === option.value
                              ? "bg-primary-500 text-white border-primary-500"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Markdown URL input */}
                  {termsContentType === 'markdown' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        URL Markdown
                      </label>
                      <input
                        type="url"
                        value={termsMarkdownUrl}
                        onChange={(e) => handleTermsMarkdownUrlChange(e.target.value)}
                        placeholder="https://example.com/terms.md"
                        className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        File markdown yang akan menggantikan konten Syarat & Ketentuan default
                      </p>
                      {termsMarkdownUrl && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                          <Info size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-green-700">
                            {markdownLoading ? 'Memuat...' : 
                             markdownContent ? `Markdown berhasil dimuat (${markdownContent.length} karakter)` : 
                             'Gagal memuat markdown'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plain text input */}
                  {termsContentType === 'text' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Teks Kustom
                      </label>
                      <textarea
                        value={termsText}
                        onChange={(e) => handleTermsTextChange(e.target.value)}
                        placeholder="Masukkan teks syarat & ketentuan..."
                        rows={6}
                        className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Teks biasa yang akan menggantikan konten Syarat & Ketentuan default
                      </p>
                    </div>
                  )}

                  {termsContentType === 'default' && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Menggunakan konten Syarat & Ketentuan default dari aplikasi 
                        (waktu pemrosesan, minimal deposit, keamanan, dll.)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Panduan Penggunaan
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Kartu saldo dapat diaktifkan/nonaktifkan sesuai kebutuhan</li>
                <li>Nominal deposit dapat ditambah atau dihapus sesuai kebutuhan</li>
                <li>Syarat & Ketentuan dapat menggunakan default, markdown, atau teks kustom</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDepositCustomizationEditor;
