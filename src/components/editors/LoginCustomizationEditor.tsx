import React, { useState, useRef, useEffect } from "react";
import { GlobalTheming } from "../../types";
import {
  LogIn,
  Info,
  Image,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
  Type,
  Palette,
  ChevronDown,
  ChevronUp,
  Headphones,
} from "lucide-react";
import { getApiUrl, X_TOKEN_VALUE } from "../../config/api";
import AssetsManager from "../AssetsManager";
import ImageHoverPreview from "../ImageHoverPreview";
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../../utils/themeColors';

interface NativeColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const NativeColorPicker: React.FC<NativeColorPickerProps> = ({
  color,
  onChange,
}) => {
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

interface LoginCustomizationEditorProps {
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
  // Remove file extension if present
  return selectedMenu.replace(/\.json$/, "");
};

const LoginCustomizationEditor: React.FC<LoginCustomizationEditorProps> = ({
  globalConfig,
  onUpdate,
  selectedMenu,
  authSeed = "",
}) => {
  const distroSuffix = getDistroSuffix(selectedMenu);
  const isDistro = distroSuffix !== "";

  // Keys with distro suffix
  const markdownKey = `loginMarkdownUrl${distroSuffix}` as keyof GlobalTheming;
  const backgroundKey =
    `loginBackgroundImageUrl${distroSuffix}` as keyof GlobalTheming;

  // Text color keys with distro suffix
  const logoTextColorKey =
    `loginLogoTextColor${distroSuffix}` as keyof GlobalTheming;
  const titleColorKey = `loginTitleColor${distroSuffix}` as keyof GlobalTheming;
  const subtitleColorKey =
    `loginSubtitleColor${distroSuffix}` as keyof GlobalTheming;
  const paragraphColorKey =
    `loginParagraphColor${distroSuffix}` as keyof GlobalTheming;

  // Markdown color keys with distro suffix
  const mdH1ColorKey =
    `loginMarkdownH1Color${distroSuffix}` as keyof GlobalTheming;
  const mdH2ColorKey =
    `loginMarkdownH2Color${distroSuffix}` as keyof GlobalTheming;
  const mdH3ColorKey =
    `loginMarkdownH3Color${distroSuffix}` as keyof GlobalTheming;
  const mdH4ColorKey =
    `loginMarkdownH4Color${distroSuffix}` as keyof GlobalTheming;
  const mdH5ColorKey =
    `loginMarkdownH5Color${distroSuffix}` as keyof GlobalTheming;
  const mdH6ColorKey =
    `loginMarkdownH6Color${distroSuffix}` as keyof GlobalTheming;
  const mdParagraphColorKey =
    `loginMarkdownParagraphColor${distroSuffix}` as keyof GlobalTheming;
  const mdBoldColorKey =
    `loginMarkdownBoldColor${distroSuffix}` as keyof GlobalTheming;

  // Customer service button keys with distro suffix
  const csButtonEnabledKey =
    `loginCustomerServiceButtonEnabled${distroSuffix}` as keyof GlobalTheming;
  const csButtonPositionKey =
    `loginCustomerServiceButtonPosition${distroSuffix}` as keyof GlobalTheming;

  // Login text content keys with distro suffix
  const loginSubtitleKey =
    `loginSubtitle${distroSuffix}` as keyof GlobalTheming;
  const loginDescriptionKey =
    `loginDescription${distroSuffix}` as keyof GlobalTheming;

  // Get values using dynamic keys (cast to any for dynamic access)
  const configAny = globalConfig as
    | Record<string, string | undefined>
    | undefined;
  const loginMarkdownUrl = configAny?.[markdownKey] || "";
  const loginBackgroundImageUrl = configAny?.[backgroundKey] || "";

  // Login text content values
  const loginSubtitle =
    configAny?.[loginSubtitleKey] || "Masukkan Nomor Handphone";
  const loginDescription =
    configAny?.[loginDescriptionKey] ||
    "Masukkan atau daftar dengan nomor handphone Anda untuk mengakses penuh ke beragam layanan kami seperti Jual Pulsa, Token Listrik, PPOB, dan lainnya.";

  // Text color values
  const loginLogoTextColor = configAny?.[logoTextColorKey] || "";
  const loginTitleColor = configAny?.[titleColorKey] || "";
  const loginSubtitleColor = configAny?.[subtitleColorKey] || "";
  const loginParagraphColor = configAny?.[paragraphColorKey] || "";

  // Markdown color values
  const loginMarkdownH1Color = configAny?.[mdH1ColorKey] || "";
  const loginMarkdownH2Color = configAny?.[mdH2ColorKey] || "";
  const loginMarkdownH3Color = configAny?.[mdH3ColorKey] || "";
  const loginMarkdownH4Color = configAny?.[mdH4ColorKey] || "";
  const loginMarkdownH5Color = configAny?.[mdH5ColorKey] || "";
  const loginMarkdownH6Color = configAny?.[mdH6ColorKey] || "";
  const loginMarkdownParagraphColor = configAny?.[mdParagraphColorKey] || "";
  const loginMarkdownBoldColor = configAny?.[mdBoldColorKey] || "";

  // Customer service button values (default: enabled, top-right)
  // Note: stored as boolean in globalConfig, will be converted to string when synced to app_rules
  const configAnyBool = globalConfig as
    | Record<string, string | boolean | undefined>
    | undefined;
  const csButtonEnabledRaw = configAnyBool?.[csButtonEnabledKey];
  const csButtonEnabled =
    csButtonEnabledRaw === undefined
      ? true
      : csButtonEnabledRaw !== false && csButtonEnabledRaw !== "false";
  const csButtonPosition =
    (configAny?.[csButtonPositionKey] as string) || "top-right";

  // Expanded section state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Markdown preview state
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [markdownLoading, setMarkdownLoading] = useState(false);

  // Fetch markdown content when URL changes
  useEffect(() => {
    if (!loginMarkdownUrl) {
      setMarkdownContent("");
      return;
    }

    const fetchMarkdown = async () => {
      setMarkdownLoading(true);
      try {
        const response = await fetch(loginMarkdownUrl);
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
  }, [loginMarkdownUrl]);

  // Render markdown to HTML with proper scaling for preview
  const renderMarkdownPreview = (content: string) => {
    if (!content.trim()) {
      return { __html: "" };
    }

    // Store images and links temporarily to prevent HTML escaping
    const images: string[] = [];
    const links: string[] = [];

    let html = content
      // Store images first (before HTML escaping)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
        images.push(
          `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto; display: block;" />`,
        );
        return `__IMG_${images.length - 1}__`;
      })
      // Store links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
        links.push(
          `<a href="${href}" class="text-primary-500 underline text-[8px]">${text}</a>`,
        );
        return `__LINK_${links.length - 1}__`;
      });

    // Escape HTML
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Apply markdown formatting with scaled fonts
    html = html
      // Headings - scaled for preview (H1 largest to H6 smallest)
      .replace(
        /^###### (.*$)/gim,
        `<h6 class="text-[10px] font-medium my-1" style="color: ${loginMarkdownH6Color || "#4B5563"}">$1</h6>`,
      )
      .replace(
        /^##### (.*$)/gim,
        `<h5 class="text-[11px] font-medium my-1" style="color: ${loginMarkdownH5Color || "#4B5563"}">$1</h5>`,
      )
      .replace(
        /^#### (.*$)/gim,
        `<h4 class="text-xs font-semibold my-1" style="color: ${loginMarkdownH4Color || "#374151"}">$1</h4>`,
      )
      .replace(
        /^### (.*$)/gim,
        `<h3 class="text-[13px] font-semibold my-1" style="color: ${loginMarkdownH3Color || "#374151"}">$1</h3>`,
      )
      .replace(
        /^## (.*$)/gim,
        `<h2 class="text-sm font-semibold my-1.5" style="color: ${loginMarkdownH2Color || "#1F2937"}">$1</h2>`,
      )
      .replace(
        /^# (.*$)/gim,
        `<h1 class="text-base font-bold my-2" style="color: ${loginMarkdownH1Color || "#111827"}">$1</h1>`,
      )
      // Text formatting
      .replace(
        /\*\*(.*?)\*\*/g,
        `<strong class="font-bold" style="color: ${loginMarkdownBoldColor || "inherit"}">$1</strong>`,
      )
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-200 px-1 rounded text-[8px] font-mono">$1</code>',
      )
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-3 text-[9px] list-disc">$1</li>')
      .replace(
        /^\d+\. (.*$)/gim,
        '<li class="ml-3 text-[9px] list-decimal">$1</li>',
      )
      // Blockquotes
      .replace(
        /^&gt; (.*$)/gim,
        '<blockquote class="border-l-2 border-gray-300 pl-2 italic text-[9px] text-gray-600 my-1">$1</blockquote>',
      )
      // Paragraphs
      .replace(
        /\n\n/g,
        `</p><p class="text-[9px] my-1" style="color: ${loginMarkdownParagraphColor || "#6B7280"}">`,
      )
      .replace(/\n/g, "<br>");

    // Restore images and links
    images.forEach((img, i) => {
      html = html.replace(`__IMG_${i}__`, img);
    });
    links.forEach((link, i) => {
      html = html.replace(`__LINK_${i}__`, link);
    });

    // Wrap in paragraph
    html =
      `<p class="text-[9px]" style="color: ${loginMarkdownParagraphColor || "#6B7280"}">` +
      html +
      "</p>";

    // Clean up empty paragraphs
    html = html
      .replace(/<p[^>]*><\/p>/g, "")
      .replace(/<p[^>]*>(<h[1-6])/g, "$1")
      .replace(/(<\/h[1-6]>)<\/p>/g, "$1")
      .replace(/<p[^>]*>(<img)/g, "$1")
      .replace(/(\/?>)<\/p>/g, "$1");

    return { __html: html };
  };

  const handleMarkdownChange = (value: string) => {
    onUpdate({
      ...globalConfig,
      [markdownKey]: value,
    } as GlobalTheming);
  };

  const handleBackgroundChange = (value: string) => {
    onUpdate({
      ...globalConfig,
      [backgroundKey]: value,
    } as GlobalTheming);
  };

  // Color change handlers
  const handleColorChange = (key: keyof GlobalTheming, value: string) => {
    onUpdate({
      ...globalConfig,
      [key]: value || undefined,
    } as GlobalTheming);
  };

  const handleClearColor = (key: keyof GlobalTheming) => {
    const newConfig = { ...globalConfig } as Record<string, unknown>;
    delete newConfig[key];
    onUpdate(newConfig as GlobalTheming);
  };

  // Customer service button handlers
  const handleCsButtonEnabledChange = (enabled: boolean) => {
    onUpdate({
      ...globalConfig,
      [csButtonEnabledKey]: enabled,
    } as GlobalTheming);
  };

  const handleCsButtonPositionChange = (position: string) => {
    onUpdate({
      ...globalConfig,
      [csButtonPositionKey]: position,
    } as GlobalTheming);
  };

  // Helper function to get public URL for assets
  const getPublicUrl = async (filename: string) => {
    const cleanFilename = filename
      .replace(/^\/assets\//, "")
      .replace(/^\//, "");
    const apiUrl = await getApiUrl("");
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  // Handle file upload for background image
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
          setAssetsRefreshTrigger((prev) => prev + 1);
          return publicUrl;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Handle file selection for background image
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);
    if (url) {
      handleBackgroundChange(url);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle asset selection from picker
  const handleAssetSelect = (url: string) => {
    if (url) {
      handleBackgroundChange(url);
      setShowAssetPicker(false);
    }
  };

  // Render login preview
  const renderLoginPreview = () => {
    const csPositionClasses: Record<string, string> = {
      "top-left": "top-8 left-3",
      "top-right": "top-8 right-3",
      "bottom-left": "bottom-44 left-3",
      "bottom-right": "bottom-44 right-3",
    };

    return (
      <div className="rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
          Pratinjau Login
        </h3>
        <div
          className="relative bg-white rounded-3xl shadow-lg overflow-hidden mx-auto border-4 border-gray-800"
          style={{ width: 280, height: 560 }}
        >
          {/* Background Image */}
          {loginBackgroundImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${loginBackgroundImageUrl})` }}
            />
          )}

          {/* Content overlay */}
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

            {/* Customer Service Button */}
            {csButtonEnabled && (
              <div
                className={`absolute ${csPositionClasses[csButtonPosition] || "top-2 right-2"} z-10`}
              >
                <div className="bg-white rounded-full px-2.5 py-1.5 shadow-sm border border-gray-200 flex items-center gap-1.5">
                  <Headphones size={10} className="text-primary-500" />
                  <span className="text-[8px] text-gray-700">
                    Customer Service
                  </span>
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
              {loginMarkdownUrl ? (
                /* Markdown content - replaces logo, title, subtitle, paragraph */
                <div
                  className="w-full h-full flex items-center justify-center overflow-y-auto scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {markdownLoading ? (
                    <div className="text-[8px] text-gray-400 text-center">
                      Loading...
                    </div>
                  ) : markdownContent ? (
                    <div
                      className="text-center px-2"
                      dangerouslySetInnerHTML={renderMarkdownPreview(
                        markdownContent,
                      )}
                    />
                  ) : (
                    <div className="text-[8px] text-gray-400 text-center italic">
                      Tidak dapat memuat markdown
                    </div>
                  )}
                </div>
              ) : (
                /* Default content - logo, title, subtitle, paragraph */
                <>
                  {/* Logo placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl mb-3 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">H</span>
                  </div>

                  {/* Logo text - uses Title color */}
                  <span
                    className="text-lg font-bold mb-4"
                    style={{ color: loginTitleColor || "#0EA5E9" }}
                  >
                    App Name
                  </span>

                  {/* Subtitle - "Masukkan Nomor Handphone" uses Subtitle color */}
                  <span
                    className="text-sm font-semibold text-center mb-2"
                    style={{ color: loginSubtitleColor || "#1F2937" }}
                  >
                    {loginSubtitle}
                  </span>

                  {/* Description/Paragraph */}
                  <p
                    className={`text-center leading-relaxed px-3 ${
                      loginDescription.length > 150
                        ? "text-[7px]"
                        : loginDescription.length > 100
                          ? "text-[8px]"
                          : loginDescription.length > 60
                            ? "text-[9px]"
                            : "text-[10px]"
                    }`}
                    style={{ color: loginParagraphColor || "#6B7280" }}
                  >
                    {loginDescription}
                  </p>
                </>
              )}
            </div>

            {/* Bottom form mockup */}
            <div className="bg-white rounded-t-3xl shadow-inner p-4 space-y-3">
              {/* Phone input */}
              <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl">
                <div className="w-4 h-4 text-gray-400">📞</div>
                <span className="text-[10px] text-gray-400">
                  Nomor Handphone
                </span>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-2">
                <div className="w-3.5 h-3.5 border border-gray-300 rounded mt-0.5"></div>
                <span className="text-[9px] text-gray-500">
                  Saya menyetujui Kebijakan Privasi
                </span>
              </div>

              {/* Button */}
              <div className="bg-gray-200 rounded-xl py-2.5 text-center">
                <span className="text-xs text-gray-500 font-medium">Masuk</span>
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pt-1">
                <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Preview menggunakan warna yang dikonfigurasi
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
            {renderLoginPreview()}
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
                    Konfigurasi login ini akan disimpan dengan suffix{" "}
                    <code className="bg-indigo-100 px-1 rounded">
                      {distroSuffix}
                    </code>{" "}
                    dan hanya berlaku untuk aplikasi distro tersebut.
                  </p>
                </div>
              </div>
            )}

            {/* Login Text Content Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("textContent")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Type size={18} className="text-cyan-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Teks Konten Login
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">
                      Subtitle dan deskripsi
                    </p>
                  </div>
                </div>
                {expandedSection === "textContent" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "textContent" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  {/* Login Subtitle */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Subtitle Login
                    </label>
                    <input
                      type="text"
                      value={loginSubtitle}
                      onChange={(e) =>
                        onUpdate({
                          ...globalConfig,
                          [loginSubtitleKey]: e.target.value,
                        } as GlobalTheming)
                      }
                      placeholder="Masukkan Nomor Handphone"
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Teks yang ditampilkan di bawah logo (contoh: "Masukkan Nomor Handphone")
                    </p>
                  </div>

                  {/* Login Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Deskripsi Login
                    </label>
                    <textarea
                      value={loginDescription}
                      onChange={(e) =>
                        onUpdate({
                          ...globalConfig,
                          [loginDescriptionKey]: e.target.value,
                        } as GlobalTheming)
                      }
                      placeholder="Masukkan atau daftar dengan nomor handphone Anda untuk mengakses penuh ke beragam layanan kami..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Paragraf deskripsi di bawah subtitle
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Background Image Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("background")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Image size={18} className="text-purple-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Background Login
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">
                      {loginBackgroundImageUrl
                        ? "Gambar aktif"
                        : "Belum dikonfigurasi"}
                    </p>
                  </div>
                </div>
                {expandedSection === "background" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "background" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      URL Gambar Background (Opsional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={loginBackgroundImageUrl}
                        onChange={(e) => handleBackgroundChange(e.target.value)}
                        placeholder="https://example.com/background.jpg"
                        className="flex-1 px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {loginBackgroundImageUrl && (
                        <ImageHoverPreview
                          src={loginBackgroundImageUrl}
                          alt="Login background preview"
                          thumbnailClassName="flex-shrink-0 w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-100"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                        title="Upload gambar"
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAssetPicker(true)}
                        className="px-2 py-1.5 bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
                        title="Pilih dari assets"
                      >
                        <ImageIcon size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Gambar akan ditampilkan sebagai latar belakang penuh pada
                      halaman login.
                    </p>
                  </div>

                  {loginBackgroundImageUrl && (
                    <div className="space-y-2">
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded flex items-start gap-2">
                        <Info
                          size={14}
                          className="text-purple-600 mt-0.5 flex-shrink-0"
                        />
                        <div className="text-xs text-purple-700">
                          <strong>Aktif:</strong> Gambar background akan
                          ditampilkan.
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded overflow-hidden">
                        <img
                          src={loginBackgroundImageUrl}
                          alt="Preview background"
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Markdown Content Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("markdown")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogIn size={18} className="text-green-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Konten Markdown
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">
                      {loginMarkdownUrl ? "URL aktif" : "Belum dikonfigurasi"}
                    </p>
                  </div>
                </div>
                {expandedSection === "markdown" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "markdown" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      URL Markdown Login (Opsional)
                    </label>
                    <input
                      type="url"
                      value={loginMarkdownUrl}
                      onChange={(e) => handleMarkdownChange(e.target.value)}
                      placeholder="https://example.com/login-content.md"
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Jika diisi, konten markdown akan ditampilkan di atas form
                      login.
                    </p>
                  </div>

                  {loginMarkdownUrl && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                      <Info
                        size={14}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-xs text-green-700">
                        <strong>Aktif:</strong> Markdown akan ditampilkan.
                        <br />
                        <span className="text-xs text-green-600 truncate block max-w-[300px]">
                          {loginMarkdownUrl}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Default Login Text Colors Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("textColors")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Type size={18} className="text-blue-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Warna Teks Login Default
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {loginTitleColor && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: loginTitleColor }}
                        />
                      )}
                      {loginSubtitleColor && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: loginSubtitleColor }}
                        />
                      )}
                      {loginParagraphColor && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: loginParagraphColor }}
                        />
                      )}
                      {!loginTitleColor &&
                        !loginSubtitleColor &&
                        !loginParagraphColor && (
                          <p className="text-xs text-gray-500">Default</p>
                        )}
                    </div>
                  </div>
                </div>
                {expandedSection === "textColors" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "textColors" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  {/* Title Color (also used for Logo Text) */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm text-gray-700">Warna Judul</span>
                      <p className="text-xs text-gray-400">Digunakan untuk teks logo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <NativeColorPicker
                        color={loginTitleColor || "#000000"}
                        onChange={(color) =>
                          handleColorChange(titleColorKey, color)
                        }
                      />
                      {loginTitleColor && (
                        <button
                          type="button"
                          onClick={() => handleClearColor(titleColorKey)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtitle Color (used for "Masukkan Nomor Handphone") */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm text-gray-700">Warna Subtitle</span>
                      <p className="text-xs text-gray-400">Teks "Masukkan Nomor Handphone"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <NativeColorPicker
                        color={loginSubtitleColor || "#666666"}
                        onChange={(color) =>
                          handleColorChange(subtitleColorKey, color)
                        }
                      />
                      {loginSubtitleColor && (
                        <button
                          type="button"
                          onClick={() => handleClearColor(subtitleColorKey)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Paragraph Color */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm text-gray-700">Warna Paragraf</span>
                      <p className="text-xs text-gray-400">Teks deskripsi</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <NativeColorPicker
                        color={loginParagraphColor || "#666666"}
                        onChange={(color) =>
                          handleColorChange(paragraphColorKey, color)
                        }
                      />
                      {loginParagraphColor && (
                        <button
                          type="button"
                          onClick={() => handleClearColor(paragraphColorKey)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Markdown Text Colors Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("markdownColors")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Palette size={18} className="text-pink-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Warna Teks Markdown
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {loginMarkdownH1Color && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: loginMarkdownH1Color }}
                        />
                      )}
                      {loginMarkdownH2Color && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: loginMarkdownH2Color }}
                        />
                      )}
                      {loginMarkdownParagraphColor && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{
                            backgroundColor: loginMarkdownParagraphColor,
                          }}
                        />
                      )}
                      {!loginMarkdownH1Color &&
                        !loginMarkdownH2Color &&
                        !loginMarkdownParagraphColor && (
                          <p className="text-xs text-gray-500">Default</p>
                        )}
                    </div>
                  </div>
                </div>
                {expandedSection === "markdownColors" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "markdownColors" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  {/* Heading Colors Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* H1 Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">H1</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownH1Color || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdH1ColorKey, color)
                          }
                        />
                        {loginMarkdownH1Color && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdH1ColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* H2 Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">H2</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownH2Color || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdH2ColorKey, color)
                          }
                        />
                        {loginMarkdownH2Color && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdH2ColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* H3 Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">H3</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownH3Color || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdH3ColorKey, color)
                          }
                        />
                        {loginMarkdownH3Color && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdH3ColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* H4 Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">H4</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownH4Color || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdH4ColorKey, color)
                          }
                        />
                        {loginMarkdownH4Color && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdH4ColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* H5 Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">H5</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownH5Color || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdH5ColorKey, color)
                          }
                        />
                        {loginMarkdownH5Color && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdH5ColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* H6 Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">H6</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownH6Color || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdH6ColorKey, color)
                          }
                        />
                        {loginMarkdownH6Color && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdH6ColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Paragraph and Bold Colors */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    {/* Markdown Paragraph Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Paragraf</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownParagraphColor || "#666666"}
                          onChange={(color) =>
                            handleColorChange(mdParagraphColorKey, color)
                          }
                        />
                        {loginMarkdownParagraphColor && (
                          <button
                            type="button"
                            onClick={() =>
                              handleClearColor(mdParagraphColorKey)
                            }
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bold Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Bold</span>
                      <div className="flex items-center gap-2">
                        <NativeColorPicker
                          color={loginMarkdownBoldColor || "#000000"}
                          onChange={(color) =>
                            handleColorChange(mdBoldColorKey, color)
                          }
                        />
                        {loginMarkdownBoldColor && (
                          <button
                            type="button"
                            onClick={() => handleClearColor(mdBoldColorKey)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Service Button Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection("customerService")}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Headphones size={18} className="text-orange-500" />
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">
                      Tombol Customer Service
                    </h3>
                    <p className="text-xs text-gray-500">
                      {csButtonEnabled
                        ? `Aktif (${csButtonPosition})`
                        : "Nonaktif"}
                    </p>
                  </div>
                </div>
                {expandedSection === "customerService" ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {expandedSection === "customerService" && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-3">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Tampilkan Tombol
                      </span>
                      <p className="text-xs text-gray-500">
                        Aktifkan atau nonaktifkan tombol customer service
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={csButtonEnabled}
                        onChange={(e) =>
                          handleCsButtonEnabledChange(e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  {/* Position Selector */}
                  {csButtonEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Posisi Tombol
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "top-left", label: "Kiri Atas" },
                          { value: "top-right", label: "Kanan Atas" },
                          { value: "bottom-left", label: "Kiri Bawah" },
                          { value: "bottom-right", label: "Kanan Bawah" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleCsButtonPositionChange(option.value)
                            }
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              csButtonPosition === option.value
                                ? "bg-primary-500 text-white border-primary-500"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!csButtonEnabled && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                      <Info
                        size={14}
                        className="text-amber-600 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-xs text-amber-700">
                        Tombol customer service tidak akan ditampilkan di
                        halaman login.
                      </div>
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
                <li>
                  File gambar dan markdown harus dapat diakses publik (tanpa
                  autentikasi)
                </li>
                <li>Gunakan Assets Manager untuk upload file</li>
                <li>
                  Background akan mengisi seluruh layar login dengan mode cover
                </li>
                <li>
                  Kosongkan URL untuk mengembalikan ke tampilan login default
                </li>
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

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Pilih atau Upload Asset
              </h3>
              <button
                onClick={() => setShowAssetPicker(false)}
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
                <p className="text-sm text-primary-800 mb-2">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk
                  memilih dan menerapkan ke field URL Background secara
                  otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginCustomizationEditor;
