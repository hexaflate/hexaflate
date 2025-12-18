import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import {
  getCachedClasses,
  setCachedClasses,
  mergeClasses,
} from "../utils/broadcastCache";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import AssetsManager from "./AssetsManager";
import ImageHoverPreview from "./ImageHoverPreview";
import {
  THEME_COLOR,
  THEME_COLOR_DARK,
  withOpacity,
} from "../utils/themeColors";

type NavigationType = "none" | "webview" | "url";

interface BroadcastCenterProps {
  authSeed: string;
  onStateChange?: (canSend: boolean, isSending: boolean) => void;
}

export interface BroadcastCenterRef {
  sendBroadcast: () => Promise<void>;
  isSending: boolean;
  canSend: boolean;
}

interface BroadcastResult {
  success: boolean;
  message: string;
  sent_tokens?: number;
  failed_tokens?: number;
  failed_token_list?: string[];
}

const BroadcastCenter = forwardRef<BroadcastCenterRef, BroadcastCenterProps>(
  ({ authSeed, onStateChange }, ref) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    // Simplified navigation state for broadcast
    const [navigationType, setNavigationType] =
      useState<NavigationType>("none");
    const [webviewUrl, setWebviewUrl] = useState("");
    const [webviewTitle, setWebviewTitle] = useState("");
    const [externalUrl, setExternalUrl] = useState("");
    const [buttonText, setButtonText] = useState("");
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<BroadcastResult | null>(null);

    // Asset picker/uploader state
    const [showAssetPicker, setShowAssetPicker] = useState(false);
    const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSend = Boolean(title.trim() && message.trim() && !isSending);

    const loadAvailableClasses = async () => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          return;
        }

        const apiUrl = await getApiUrl("/admin/reseller-classes");
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
        });

        const data = await response.json();
        if (data.success && data.classes) {
          // Merge/update classes without rebuilding components
          setAvailableClasses((prev) => {
            const merged = mergeClasses(prev, data.classes || []);
            return merged;
          });

          // Update cache
          setCachedClasses(data.classes);
        }
      } catch (error) {
      }
    };

    useImperativeHandle(ref, () => ({
      sendBroadcast: handleSendBroadcast,
      isSending,
      canSend,
    }));

    useEffect(() => {
      // Load from cache immediately on mount
      const cached = getCachedClasses();
      if (cached) {
        setAvailableClasses(cached);
      }

      // Fetch fresh data in background
      loadAvailableClasses();
    }, []);

    // Notify parent component of state changes
    useEffect(() => {
      if (onStateChange) {
        onStateChange(canSend, isSending);
      }
    }, [canSend, isSending, onStateChange]);

    const handleClassToggle = (className: string) => {
      setSelectedClasses((prev) =>
        prev.includes(className)
          ? prev.filter((c) => c !== className)
          : [...prev, className],
      );
    };

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
        formData.append("auth_seed", authSeed);
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
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const url = await handleUploadFile(file);

      if (url) {
        setImageUrl(url);
      } else {
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleAssetSelect = (url: string) => {
      if (url) {
        setImageUrl(url);
        setShowAssetPicker(false);
      }
    };

    const handleSendBroadcast = async () => {
      if (!title.trim() || !message.trim()) {
        setResult({
          success: false,
          message: "Judul dan pesan harus diisi",
        });
        return;
      }

      setIsSending(true);
      setResult(null);

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setResult({
            success: false,
            message: "Kunci sesi tidak ditemukan",
          });
          return;
        }

        const apiUrl = await getApiUrl("/admin/message/broadcast");

        const requestBody: any = {
          title: title.trim(),
          message: message.trim(),
          class: selectedClasses.length > 0 ? selectedClasses : null,
          image_url: imageUrl.trim() || null,
          session_key: sessionKey,
          auth_seed: authSeed,
        };

        // Add navigation based on type
        if (navigationType === "webview" && webviewUrl.trim()) {
          requestBody.route = "/webview";
          requestBody.route_args = {
            url: webviewUrl.trim(),
            title: webviewTitle.trim() || undefined,
          };
        } else if (navigationType === "url" && externalUrl.trim()) {
          requestBody.url = externalUrl.trim();
        }

        // Add button text if provided
        if (buttonText.trim()) {
          requestBody.button_text = buttonText.trim();
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify(requestBody),
        });

        let data;
        try {
          const responseText = await response.text();

          if (!responseText.trim()) {
            throw new Error("Empty response from server");
          }
          data = JSON.parse(responseText);
        } catch (parseError) {
          setResult({
            success: false,
            message: `Error server: ${response.status} ${response.statusText}. Silakan periksa apakah endpoint broadcast tersedia.`,
          });
          return;
        }

        setResult(data);

        if (data.success) {
          setTitle("");
          setMessage("");
          setImageUrl("");
          setNavigationType("none");
          setWebviewUrl("");
          setWebviewTitle("");
          setExternalUrl("");
          setButtonText("");
          setSelectedClasses([]);
        }
      } catch (error) {
        let errorMessage = "Gagal mengirim broadcast. Silakan coba lagi.";

        if (error instanceof TypeError && error.message.includes("fetch")) {
          errorMessage =
            "Error jaringan: Tidak dapat terhubung ke server. Silakan periksa koneksi Anda.";
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        setResult({
          success: false,
          message: errorMessage,
        });
      } finally {
        setIsSending(false);
      }
    };

    return (
      <div className="h-full w-full flex flex-col">
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-card border border-neutral-100/80 flex-1 flex flex-col">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Broadcast Content & Dynamic Variables */}
            <div className="flex flex-col space-y-4">
              {/* Title Input */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-semibold text-neutral-700 mb-1.5"
                >
                  Judul *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200 placeholder:text-neutral-400"
                  placeholder="judul notifikasi"
                  maxLength={100}
                />
              </div>

              {/* Message Input */}
              <div className="flex-1 flex flex-col">
                <label
                  htmlFor="message"
                  className="block text-xs font-semibold text-neutral-700 mb-1.5"
                >
                  Pesan *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full flex-1 px-3 py-2 text-sm bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200 placeholder:text-neutral-400 resize-none"
                  placeholder="masukkan pesan notifikasi"
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {message.length}/500 karakter
                </p>
              </div>

              {/* Dynamic Variables Help Section */}
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <h4 className="text-xs font-semibold text-primary-800 mb-2">
                  📝 Variabel Dinamis
                </h4>
                <p className="text-xs text-primary-700 mb-2">
                  Gunakan variabel berikut di pesan untuk menampilkan data
                  pengguna secara dinamis:
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div className="text-primary-800">
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{name}}"}
                    </span>{" "}
                    atau{" "}
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{nama}}"}
                    </span>
                    <span className="text-primary-600 ml-1">- Nama</span>
                  </div>
                  <div className="text-primary-800">
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{email}}"}
                    </span>
                    <span className="text-primary-600 ml-1">- Email</span>
                  </div>
                  <div className="text-primary-800">
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{saldo}}"}
                    </span>{" "}
                    atau{" "}
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{balance}}"}
                    </span>
                    <span className="text-primary-600 ml-1">- Saldo (Rp)</span>
                  </div>
                  <div className="text-primary-800">
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{komisi}}"}
                    </span>{" "}
                    atau{" "}
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{commission}}"}
                    </span>
                    <span className="text-primary-600 ml-1">- Komisi (Rp)</span>
                  </div>
                  <div className="text-primary-800">
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{poin}}"}
                    </span>{" "}
                    atau{" "}
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{points}}"}
                    </span>
                    <span className="text-primary-600 ml-1">- Poin</span>
                  </div>
                  <div className="text-primary-800">
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{kode}}"}
                    </span>{" "}
                    atau{" "}
                    <span className="font-mono bg-primary-100 px-1 rounded">
                      {"{{code}}"}
                    </span>
                    <span className="text-primary-600 ml-1">- Kode</span>
                  </div>
                </div>
                <p className="text-xs text-primary-600 mt-2 italic">
                  Contoh: "Hai {"{{nama}}"}, saldo Anda: {"{{saldo}}"}"
                </p>
              </div>
            </div>

            {/* Right Column: Config (Image, Navigation, Target) */}
            <div className="flex flex-col space-y-4">
              {/* Image URL Input */}
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-xs font-semibold text-neutral-700 mb-1.5"
                >
                  URL Gambar (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200 placeholder:text-neutral-400"
                    placeholder="https://example.com/image.jpg"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {imageUrl && (
                    <ImageHoverPreview
                      src={imageUrl}
                      alt="Broadcast image preview"
                      thumbnailClassName="flex-shrink-0 w-8 h-8 rounded-lg border border-neutral-200/80 overflow-hidden bg-neutral-100"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center gap-1 shadow-sm"
                    title="Upload image"
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssetPicker(true)}
                    className="px-3 py-2 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl hover:from-success-600 hover:to-success-700 transition-all duration-200 flex items-center gap-1 shadow-sm"
                    title="Select from assets"
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1.5">
                  URL yang dapat diakses publik, maksimal 1MB, format: JPEG,
                  PNG, BMP, WebP
                </p>
                <p className="text-xs text-warning-600 mt-1">
                  ⚠️ Gambar lebih dari 1MB tidak akan ditampilkan dalam
                  notifikasi
                </p>
              </div>

              {/* Simplified Navigation Configuration for Broadcast */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-700">
                  Konfigurasi Navigasi (Opsional)
                </label>

                {/* Navigation Type Toggle */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNavigationType("webview")}
                    className={`flex-1 px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                      navigationType === "webview"
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm"
                        : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80"
                    }`}
                  >
                    WebView
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavigationType("url")}
                    className={`flex-1 px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                      navigationType === "url"
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm"
                        : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80"
                    }`}
                  >
                    URL Eksternal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNavigationType("none")}
                    className={`flex-1 px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                      navigationType === "none"
                        ? "bg-gradient-to-r from-neutral-500 to-neutral-600 text-white shadow-sm"
                        : "bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80"
                    }`}
                  >
                    Tidak Ada
                  </button>
                </div>

                {/* WebView Configuration */}
                {navigationType === "webview" && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label className="text-xs font-medium text-neutral-600 block mb-1">
                        URL WebView *
                      </label>
                      <input
                        type="url"
                        value={webviewUrl}
                        onChange={(e) => setWebviewUrl(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-neutral-400"
                        placeholder="https://example.com/page"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600 block mb-1">
                        Judul Halaman (Opsional)
                      </label>
                      <input
                        type="text"
                        value={webviewTitle}
                        onChange={(e) => setWebviewTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-neutral-400"
                        placeholder="Judul yang ditampilkan di app bar"
                      />
                    </div>
                  </div>
                )}

                {/* External URL Configuration */}
                {navigationType === "url" && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-xs font-medium text-neutral-600 block mb-1">
                      URL Eksternal *
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-neutral-400"
                      placeholder="https://example.com"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      URL akan dibuka di browser eksternal
                    </p>
                  </div>
                )}

                {/* Button Text (shown when navigation is enabled) */}
                {navigationType !== "none" && (
                  <div>
                    <label className="text-xs font-medium text-neutral-600 block mb-1">
                      Teks Tombol (Opsional)
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-neutral-400"
                      placeholder={
                        navigationType === "url" ? "Buka Link" : "Buka"
                      }
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Teks yang ditampilkan di tombol aksi notifikasi
                    </p>
                  </div>
                )}
              </div>

              {/* Kode Level Reseller Selection */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target Kode Level Reseller (Opsional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Pilih kode level reseller tertentu, atau kosongkan untuk
                  mengirim ke semua reseller
                </p>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {availableClasses.map((className) => (
                    <label
                      key={className}
                      className="flex items-center space-x-1.5 px-2 py-1.5 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(className)}
                        onChange={() => handleClassToggle(className)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3 flex-shrink-0"
                      />
                      <span className="text-gray-700 truncate">
                        {className}
                      </span>
                    </label>
                  ))}
                </div>

                {selectedClasses.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      Terpilih: {selectedClasses.join(", ")}
                    </p>
                  </div>
                )}

                {availableClasses.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                    <p className="text-xs text-yellow-700">
                      Tidak ada kode level reseller ditemukan. Broadcast akan
                      dikirim ke semua reseller.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`p-3 rounded ${
              result.success
                ? "bg-success-50 border border-success-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg
                    className="h-4 w-4 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-2">
                <h3
                  className={`text-xs font-medium ${
                    result.success ? "text-success-800" : "text-warning-800"
                  }`}
                >
                  {result.success
                    ? "Broadcast Terkirim"
                    : "Broadcast Sebagian Terkirim"}
                </h3>

                <div
                  className={`mt-1 text-xs ${
                    result.success ? "text-success-700" : "text-yellow-700"
                  }`}
                >
                  <p>{result.message}</p>

                  {result.sent_tokens !== undefined && (
                    <p className="mt-1 font-medium">
                      Broadcast sent to {result.sent_tokens} recipients.
                      {result.failed_tokens && result.failed_tokens > 0
                        ? ` ${result.failed_tokens} failed to deliver.`
                        : ""}
                      {result.total_resellers !== undefined &&
                        ` (Processed ${result.total_resellers} resellers with tokens)`}
                    </p>
                  )}
                </div>
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
                  onClick={() => setShowAssetPicker(false)}
                  className="p-1 text-gray-600 hover:text-gray-800 rounded"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <AssetsManager
                  authSeed={authSeed}
                  refreshTrigger={assetsRefreshTrigger}
                  onAssetSelect={handleAssetSelect}
                />
                <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-sm text-primary-800 mb-2">
                    <strong>Petunjuk:</strong> Klik langsung pada gambar untuk
                    memilih dan menerapkan ke field URL Gambar secara otomatis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

BroadcastCenter.displayName = "BroadcastCenter";

export default BroadcastCenter;
