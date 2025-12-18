import React, { useState, useEffect, useRef } from "react";
import { RouteArgs } from "../types";
import { RouteArgsManager } from "../utils/routeArgsManager";
import { AVAILABLE_ROUTES } from "../data/routeConfig";
import TagInput from "./TagInput";
import {
  THEME_COLOR,
  THEME_COLOR_DARK,
  withOpacity,
} from "../utils/themeColors";

interface CustomHeadersTextareaProps {
  headers: Record<string, string> | undefined;
  onChange: (headers: Record<string, string> | undefined) => void;
}

const CustomHeadersTextarea: React.FC<CustomHeadersTextareaProps> = ({
  headers,
  onChange,
}) => {
  const [text, setText] = useState(() =>
    headers ? JSON.stringify(headers, null, 2) : "",
  );
  const [isValid, setIsValid] = useState(true);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const newText = headers ? JSON.stringify(headers, null, 2) : "";
    setText(newText);
    setIsValid(true);
  }, [headers]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    try {
      const parsed = value.trim() ? JSON.parse(value) : undefined;
      setIsValid(true);
      isInternalChange.current = true;
      onChange(parsed);
    } catch {
      setIsValid(false);
    }
  };

  return (
    <textarea
      className={`w-full px-2 py-1.5 text-sm border rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all font-mono ${
        isValid ? "border-neutral-200/80" : "border-red-400"
      }`}
      value={text}
      onChange={handleChange}
      placeholder='{"X-Custom-Header": "{{user_id}}"}'
      rows={3}
    />
  );
};

interface RouteArgsConfigProps {
  route: string;
  routeArgs: RouteArgs | undefined;
  onChange: (routeArgs: RouteArgs | undefined) => void;
  className?: string;
}

const RouteArgsConfig: React.FC<RouteArgsConfigProps> = ({
  route,
  routeArgs,
  onChange,
  className = "",
}) => {
  const currentArgs = routeArgs || ({} as RouteArgs);

  // Check if the current URL is a markdown file
  const isMarkdownUrl =
    (currentArgs as any).url?.toLowerCase().endsWith(".md") || false;

  // Helper function to get routes for webview below button (include product, exclude webview)
  const getWebViewBelowButtonRoutes = () => {
    const filtered = AVAILABLE_ROUTES.filter(
      (route) => route.value !== "/webview",
    );
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach((route) => {
      if (!grouped[route.category]) {
        grouped[route.category] = [];
      }
      grouped[route.category].push(route);
    });
    return grouped;
  };

  const handleProductArgsChange = (updates: Partial<RouteArgs>) => {
    const newArgs = RouteArgsManager.createProductArgs({
      ...currentArgs,
      ...updates,
    });
    onChange(newArgs);
  };

  const handleWebViewArgsChange = (updates: Partial<RouteArgs>) => {
    const newArgs = RouteArgsManager.createWebViewArgs({
      url: currentArgs.url || "",
      title: currentArgs.title,
      headers: currentArgs.headers,
      includeAuth: currentArgs.includeAuth,
      enableJavaScript: currentArgs.enableJavaScript,
      enableScrolling: currentArgs.enableScrolling,
      ...updates,
    });
    onChange(newArgs);
  };

  const handleGenericArgsChange = (updates: Partial<RouteArgs>) => {
    const newArgs = {
      ...currentArgs,
      ...updates,
    };
    onChange(newArgs);
  };

  const handleWebViewBelowButtonRouteArgsChange = (
    updates: Record<string, any>,
  ) => {
    const currentRouteArgs =
      (currentArgs as any).webviewBelowButton?.routeArgs || {};
    const newRouteArgs = {
      ...currentRouteArgs,
      ...updates,
    };

    handleGenericArgsChange({
      webviewBelowButton: {
        ...(currentArgs as any).webviewBelowButton,
        routeArgs: newRouteArgs,
      },
    } as any);
  };

  const _renderAdvancedRouteArgs = () => {
    const selectedRoute = (currentArgs as any).webviewBelowButton?.route;
    const routeArgs = (currentArgs as any).webviewBelowButton?.routeArgs || {};

    if (!selectedRoute) {
      return (
        <div className="text-sm text-gray-500 italic">
          Pilih route terlebih dahulu untuk mengkonfigurasi arguments
        </div>
      );
    }

    // Product route specific args
    if (selectedRoute === "/product") {
      return (
        <div className="space-y-3 p-3 bg-primary-50 rounded border border-primary-200">
          <div className="text-sm font-medium text-primary-700">
            Product Route Configuration
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label text-xs">Operators</label>
              <TagInput
                value={routeArgs.operators || []}
                onChange={(operators) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    operators: operators.length > 0 ? operators : undefined,
                  })
                }
                placeholder="Type operator and press space..."
                className="text-sm"
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Hint Text</label>
              <input
                type="text"
                className="form-input text-sm py-1 w-full"
                value={routeArgs.hintText || ""}
                onChange={(e) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    hintText: e.target.value || undefined,
                  })
                }
                placeholder="Nomor HP Pelanggan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label text-xs">Tipe Nomor</label>
              <select
                className="form-input text-sm py-1 w-full"
                value={routeArgs.alphanumeric?.toString() || "false"}
                onChange={(e) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    alphanumeric: e.target.value === "true",
                  })
                }
              >
                <option value="false">Hanya Angka</option>
                <option value="true">Huruf & Angka</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Transaksi Massal</label>
              <select
                className="form-input text-sm py-1 w-full"
                value={routeArgs.trailingNumbers?.toString() || "false"}
                onChange={(e) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    trailingNumbers: e.target.value === "true",
                  })
                }
              >
                <option value="false">Aktif</option>
                <option value="true">Tidak Aktif</option>
              </select>
            </div>
          </div>

          {routeArgs.trailingNumbers && (
            <div className="form-group">
              <label className="form-label text-xs">
                Trailing Numbers Hint Text
              </label>
              <input
                type="text"
                className="form-input text-sm py-1 w-full"
                value={routeArgs.hintLastDestination || ""}
                onChange={(e) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    hintLastDestination: e.target.value || undefined,
                  })
                }
                placeholder="Nomor Voucher Akhir"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label text-xs">Info Box</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="form-input text-sm py-1 w-full"
                value={routeArgs.infoBox?.type || "none"}
                onChange={(e) => {
                  const type =
                    e.target.value === "none" ? undefined : e.target.value;
                  handleWebViewBelowButtonRouteArgsChange({
                    infoBox: type
                      ? {
                          type: type as "info" | "warning" | "error",
                          message: routeArgs.infoBox?.message || "",
                        }
                      : undefined,
                  });
                }}
              >
                <option value="none">Tidak Ada Info Box</option>
                <option value="info">Informasi</option>
                <option value="warning">Peringatan</option>
                <option value="error">Error</option>
              </select>

              <input
                type="text"
                className="form-input text-sm py-1 w-full"
                value={routeArgs.infoBox?.message || ""}
                onChange={(e) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    infoBox: {
                      type: routeArgs.infoBox?.type || "info",
                      message: e.target.value || "",
                    },
                  })
                }
                placeholder="Info message"
                disabled={!routeArgs.infoBox?.type}
              />
            </div>
          </div>
        </div>
      );
    }

    // WebView route specific args
    if (selectedRoute === "/webview") {
      return (
        <div className="space-y-3 p-3 bg-success-50 rounded border border-success-200">
          <div className="text-sm font-medium text-success-700">
            WebView Route Configuration
          </div>

          <div className="form-group">
            <label className="form-label text-xs">WebView URL</label>
            <input
              type="text"
              className="form-input text-sm py-1 w-full"
              value={routeArgs.url || ""}
              onChange={(e) =>
                handleWebViewBelowButtonRouteArgsChange({
                  url: e.target.value || undefined,
                })
              }
              placeholder="https://example.com/webview-content"
            />
          </div>

          <div className="form-group">
            <label className="form-label text-xs">WebView Title</label>
            <input
              type="text"
              className="form-input text-sm py-1 w-full"
              value={routeArgs.title || ""}
              onChange={(e) =>
                handleWebViewBelowButtonRouteArgsChange({
                  title: e.target.value || undefined,
                })
              }
              placeholder="WebView Title"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label text-sm">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={routeArgs.includeAuth || false}
                onChange={(e) =>
                  handleWebViewBelowButtonRouteArgsChange({
                    includeAuth: e.target.checked,
                  })
                }
              />
              <span className="ml-2">Sertakan Header Autentikasi</span>
            </label>
          </div>
        </div>
      );
    }

    // For other routes, return null to hide the section entirely
    return null;
  };

  const renderProductArgs = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-neutral-600 border-b border-neutral-100 pb-1">
        Konfigurasi Produk
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">
            Operators
          </label>
          <TagInput
            value={currentArgs.operators || []}
            onChange={(operators) =>
              handleProductArgsChange({
                operators: operators.length > 0 ? operators : undefined,
              })
            }
            placeholder="Ketik operator..."
            className="text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">
            Hint Text
          </label>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
            value={currentArgs.hintText || ""}
            onChange={(e) =>
              handleProductArgsChange({ hintText: e.target.value || undefined })
            }
            placeholder="Nomor HP"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">
            Tipe Nomor
          </label>
          <select
            className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
            value={currentArgs.alphanumeric?.toString() || "false"}
            onChange={(e) =>
              handleProductArgsChange({
                alphanumeric: e.target.value === "true",
              })
            }
          >
            <option value="false">Hanya Angka</option>
            <option value="true">Huruf & Angka</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">
            Transaksi Massal
          </label>
          <select
            className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
            value={currentArgs.trailingNumbers?.toString() || "false"}
            onChange={(e) =>
              handleProductArgsChange({
                trailingNumbers: e.target.value === "true",
              })
            }
          >
            <option value="false">Aktif</option>
            <option value="true">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {currentArgs.trailingNumbers && (
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">
            Hint Massal
          </label>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
            value={currentArgs.hintLastDestination || ""}
            onChange={(e) =>
              handleProductArgsChange({
                hintLastDestination: e.target.value || undefined,
              })
            }
            placeholder="Nomor Voucher Akhir"
          />
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 block mb-0.5">Info Box</label>
        <div className="grid grid-cols-2 gap-1">
          <select
            className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
            value={currentArgs.infoBox?.type || "none"}
            onChange={(e) => {
              const type =
                e.target.value === "none" ? undefined : e.target.value;
              handleProductArgsChange({
                infoBox: type
                  ? {
                      type: type as "info" | "warning" | "error",
                      message: currentArgs.infoBox?.message || "",
                    }
                  : undefined,
              });
            }}
          >
            <option value="none">Tidak Ada</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <input
            type="text"
            className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
            value={currentArgs.infoBox?.message || ""}
            onChange={(e) =>
              handleProductArgsChange({
                infoBox: {
                  type: currentArgs.infoBox?.type || "info",
                  message: e.target.value || "",
                },
              })
            }
            placeholder="Pesan"
            disabled={!currentArgs.infoBox?.type}
          />
        </div>
      </div>
    </div>
  );

  const renderWebViewArgs = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-neutral-600 border-b border-neutral-100 pb-1">
        Konfigurasi WebView
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-0.5">URL</label>
        <input
          type="text"
          className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
          value={currentArgs.url || ""}
          onChange={(e) =>
            handleWebViewArgsChange({ url: e.target.value || "" })
          }
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-0.5">Judul</label>
        <input
          type="text"
          className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
          value={currentArgs.title || ""}
          onChange={(e) =>
            handleWebViewArgsChange({ title: e.target.value || undefined })
          }
          placeholder="Judul WebView"
        />
      </div>

      {!isMarkdownUrl && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-neutral-300"
            checked={currentArgs.includeAuth || false}
            onChange={(e) =>
              handleWebViewArgsChange({ includeAuth: e.target.checked })
            }
          />
          Sertakan Auth Header
        </label>
      )}

      {!isMarkdownUrl && (
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">
            Custom Headers (JSON)
          </label>
          <CustomHeadersTextarea
            headers={currentArgs.headers}
            onChange={(headers) => handleWebViewArgsChange({ headers })}
          />
          <details className="mt-1">
            <summary className="text-xs text-primary-600 cursor-pointer hover:text-primary-800">
              Variabel yang tersedia
            </summary>
            <div className="mt-1 p-2 bg-primary-50 rounded text-xs text-primary-700 space-y-1">
              <p className="font-medium">
                Gunakan variabel berikut dalam value header (bisa digabung):
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{user_id}}"}
                  </code>{" "}
                  - User ID
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{kode}}"}
                  </code>{" "}
                  - Kode User
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{nama}}"}
                  </code>{" "}
                  - Nama
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{email}}"}
                  </code>{" "}
                  - Email
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{saldo}}"}
                  </code>{" "}
                  - Saldo
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{komisi}}"}
                  </code>{" "}
                  - Komisi
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{poin}}"}
                  </code>{" "}
                  - Poin
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{alamat}}"}
                  </code>{" "}
                  - Alamat
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{session_key}}"}
                  </code>{" "}
                  - Session Key
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{auth_seed}}"}
                  </code>{" "}
                  - Auth Seed
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{app_check_token}}"}
                  </code>{" "}
                  - Firebase App Check
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{x_token}}"}
                  </code>{" "}
                  - X-Token
                </span>
                <span>
                  <code className="bg-primary-100 px-1 rounded">
                    {"{{nama_pemilik}}"}
                  </code>{" "}
                  - Nama Pemilik
                </span>
              </div>
              <p className="text-xs text-primary-600 mt-1">
                Contoh:{" "}
                <code className="bg-primary-100 px-1 rounded">{`{"Auth": "{{session_key}}{{user_id}}"}`}</code>
              </p>
            </div>
          </details>
        </div>
      )}

      {!isMarkdownUrl && (
        <div className="pt-1 border-t border-neutral-100">
          <div className="text-xs font-medium text-primary-600 mb-1">
            Pembayaran (Opsional)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">
                Kode Produk
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
                value={currentArgs.productKode || ""}
                onChange={(e) =>
                  handleGenericArgsChange({
                    productKode: e.target.value || undefined,
                  })
                }
                placeholder="TDOMQ"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-0.5">
                URL Kode Bayar
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
                value={currentArgs.destUrl || ""}
                onChange={(e) =>
                  handleGenericArgsChange({
                    destUrl: e.target.value || undefined,
                  })
                }
                placeholder="https://example.com/{}/success"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Pattern {"{}"} untuk ekstrak nomor
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WebView Below Button Configuration */}
      <div className="pt-1 border-t border-neutral-100">
        <label className="flex items-center gap-2 text-xs text-success-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-neutral-300"
            checked={!!(currentArgs as any).webviewBelowButton}
            onChange={(e) => {
              if (e.target.checked) {
                handleGenericArgsChange({
                  webviewBelowButton: {
                    text: "Action",
                    icon: "arrow_forward",
                    style: "gradient",
                    route: "/home",
                    routeArgs: {},
                    dontShowAgain: false,
                  },
                } as any);
              } else {
                handleGenericArgsChange({
                  webviewBelowButton: undefined,
                } as any);
              }
            }}
          />
          Tombol Aksi Bawah
        </label>

        {(currentArgs as any).webviewBelowButton && (
          <div className="ml-4 mt-1 space-y-1.5 border-l-2 border-success-200 pl-2">
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">
                  Teks
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
                  value={(currentArgs as any).webviewBelowButton?.text || ""}
                  onChange={(e) =>
                    handleGenericArgsChange({
                      webviewBelowButton: {
                        ...(currentArgs as any).webviewBelowButton,
                        text: e.target.value || "Action",
                      },
                    } as any)
                  }
                  placeholder="Action"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">
                  Icon
                </label>
                <select
                  className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
                  value={
                    (currentArgs as any).webviewBelowButton?.icon ||
                    "arrow_forward"
                  }
                  onChange={(e) =>
                    handleGenericArgsChange({
                      webviewBelowButton: {
                        ...(currentArgs as any).webviewBelowButton,
                        icon: e.target.value,
                      },
                    } as any)
                  }
                >
                  <option value="">Tidak Ada</option>
                  <option value="arrow_forward">Arrow Forward</option>
                  <option value="home">Home</option>
                  <option value="settings">Settings</option>
                  <option value="check">Check</option>
                  <option value="send">Send</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">
                  Style
                </label>
                <select
                  className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
                  value={
                    (currentArgs as any).webviewBelowButton?.style || "gradient"
                  }
                  onChange={(e) =>
                    handleGenericArgsChange({
                      webviewBelowButton: {
                        ...(currentArgs as any).webviewBelowButton,
                        style: e.target.value,
                      },
                    } as any)
                  }
                >
                  <option value="gradient">Gradient</option>
                  <option value="outlined">Outlined</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">
                  Route
                </label>
                <select
                  className="w-full px-2 py-1.5 text-sm border border-neutral-200/80 rounded-lg bg-white/80 focus:ring-1 focus:ring-primary-200 transition-all"
                  value={(currentArgs as any).webviewBelowButton?.route || ""}
                  onChange={(e) =>
                    handleGenericArgsChange({
                      webviewBelowButton: {
                        ...(currentArgs as any).webviewBelowButton,
                        route: e.target.value || "/home",
                      },
                    } as any)
                  }
                >
                  <option value="">Pilih...</option>
                  {Object.entries(getWebViewBelowButtonRoutes()).map(
                    ([category, routes]) => (
                      <optgroup key={category} label={category}>
                        {routes.map((route) => (
                          <option key={route.value} value={route.value}>
                            {route.label}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-3 h-3 rounded border-neutral-300"
                checked={
                  (currentArgs as any).webviewBelowButton?.dontShowAgain ||
                  false
                }
                onChange={(e) =>
                  handleGenericArgsChange({
                    webviewBelowButton: {
                      ...(currentArgs as any).webviewBelowButton,
                      dontShowAgain: e.target.checked,
                    },
                  } as any)
                }
              />
              Opsi "Jangan Tampilkan Lagi"
            </label>
            {_renderAdvancedRouteArgs()}
          </div>
        )}
      </div>
    </div>
  );

  const renderGenericArgs = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-neutral-600 border-b border-neutral-100 pb-1">
        Route Arguments
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-0.5">JSON</label>
        <textarea
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded font-mono"
          rows={3}
          value={JSON.stringify(currentArgs, null, 2)}
          onChange={(e) => {
            try {
              const routeArgs = JSON.parse(e.target.value);
              onChange(routeArgs);
            } catch (error) {}
          }}
          placeholder='{"key": "value"}'
        />
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {route === "/product" && renderProductArgs()}
      {route === "/webview" && renderWebViewArgs()}
      {route &&
        route !== "/product" &&
        route !== "/webview" &&
        renderGenericArgs()}
    </div>
  );
};

export default RouteArgsConfig;
