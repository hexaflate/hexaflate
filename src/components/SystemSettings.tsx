import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  GripVertical,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
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
import { X_TOKEN_VALUE, getApiUrl } from "../config/api";
import {
  getCachedSystemSettings,
  setCachedSystemSettings,
} from "../utils/systemSettingsCache";
import { useToast } from "./Toast";
import AssetsManager from "./AssetsManager";
import ImageHoverPreview from "./ImageHoverPreview";
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  withOpacity,
  getActiveTabStyle,
} from "../utils/themeColors";
import { triggerConfigSync, CONFIG_TYPES } from "../utils/configSyncTrigger";

// Dynamic type for any app rules
type AppRules = Record<string, any>;

// Type for info config (message configuration)
type InfoConfig = Record<string, any>;

// Type for tiket regex config
type TiketRegexConfig = Record<string, any>;

// Type for check products config
type CheckProductsConfig = Record<string, string[]>;

// Type for cektagihan config
type CektagihanConfig = Record<string, string>;

// Type for receipt maps config
type ReceiptSource = "sn" | "pesan";

type ReceiptConfig = {
  name: string;
  product_prefixes: string[];
  source: ReceiptSource; // "sn" (default) or "pesan"
  regex: string;
  highlight_key: string;
  dash: boolean;
  receipt_title: string;
  info_text: string;
};

type ReceiptMapsConfig = {
  configs: ReceiptConfig[];
};

// Type for bantuan config
type TopicCard = {
  icon: string;
  title: string;
  desc: string;
  url?: string;
  route?: string;
  routeArgs?: {
    url: string;
  };
};

type BantuanConfig = {
  mainCard: string;
  mainCardContent: string;
  topicTitle: string;
  topicCards: TopicCard[];
};

// Type for app info config
// Removed AppInfoConfig type

interface SystemSettingsProps {
  authSeed: string;
}

export interface SystemSettingsRef {
  saveAllConfigurations: () => Promise<void>;
}

// Sortable Topic Card Wrapper for dnd-kit
interface SortableTopicCardProps {
  id: string;
  card: TopicCard;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}

const SortableTopicCard: React.FC<SortableTopicCardProps> = ({
  id,
  card,
  index,
  isExpanded,
  onToggle,
  onRemove,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-white/80"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/60 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <HelpCircle size={18} className="text-purple-500" />
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-900">
              {card.title || `Kartu ${index + 1}`}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-[300px]">
              {card.desc || "Belum dikonfigurasi"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="px-2 py-1 text-xs bg-danger-100 text-danger-700 rounded hover:bg-danger-200 transition-colors cursor-pointer"
          >
            Hapus
          </span>
          {isExpanded ? (
            <ChevronUp size={18} className="text-gray-400" />
          ) : (
            <ChevronDown size={18} className="text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/30">{children}</div>
      )}
    </div>
  );
};

// Sortable Receipt Config Wrapper for dnd-kit
interface SortableReceiptConfigProps {
  id: string;
  index: number;
  isExpanded: boolean;
  children: React.ReactNode;
}

const SortableReceiptConfig = memo<SortableReceiptConfigProps>(({
  id,
  index,
  isExpanded,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // Memoize style object to prevent unnecessary recalculations
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition, // Disable transition during drag for smoother movement
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  }), [transform, transition, isDragging]);

  // Disable expensive effects during drag
  const containerClassName = useMemo(() => 
    isDragging
      ? "bg-white/70 rounded-xl shadow-lg border border-primary-200 overflow-hidden"
      : "bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden hover:shadow-md",
    [isDragging]
  );

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className={containerClassName}
    >
      <div className="flex items-center">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-3 hover:bg-gray-100 border-r border-white/30"
          title="Drag untuk mengubah prioritas"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        {/* Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
});

const SystemSettings = forwardRef<SystemSettingsRef, SystemSettingsProps>(
  ({ authSeed }, ref) => {
    const [appRules, setAppRules] = useState<AppRules | null>(null);
    const [infoConfig, setInfoConfig] = useState<InfoConfig | null>(null);
    const [tiketRegexConfig, setTiketRegexConfig] =
      useState<TiketRegexConfig | null>(null);
    const [checkProductsConfig, setCheckProductsConfig] =
      useState<CheckProductsConfig | null>(null);
    const [combotrxConfig, setCombotrxConfig] = useState<Record<
      string,
      any
    > | null>(null);
    const [cektagihanConfig, setCektagihanConfig] =
      useState<CektagihanConfig | null>(null);
    const [receiptMapsConfig, setReceiptMapsConfig] =
      useState<ReceiptMapsConfig | null>(null);
    const [bantuanConfig, setBantuanConfig] = useState<BantuanConfig | null>(
      null,
    );
    // Removed appInfoConfig state
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterInputValue, setFilterInputValue] = useState("");
    const [matchedKeys, setMatchedKeys] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<string>("info_config");
    const [expandedReceiptConfigs, setExpandedReceiptConfigs] = useState<
      Set<number>
    >(new Set());
    const [expandedTopicCards, setExpandedTopicCards] = useState<Set<number>>(
      new Set(),
    );

    // dnd-kit sensors with activation constraints for smoother drag
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8, // Require 8px movement before drag starts
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    // Asset picker/uploader state for bantuan topic card icons
    const [showBantuanAssetPicker, setShowBantuanAssetPicker] = useState(false);
    const [bantuanAssetsRefreshTrigger, setBantuanAssetsRefreshTrigger] =
      useState(0);
    const [currentTopicCardIconIndex, setCurrentTopicCardIconIndex] = useState<
      number | null
    >(null);
    const bantuanFileInputRefs = useRef<Record<number, HTMLInputElement | null>>(
      {},
    );
    const [localCektagihanKeys, setLocalCektagihanKeys] = useState<
      Record<string, string>
    >({});
    const [localCombotrxHeaders, setLocalCombotrxHeaders] = useState<
      Record<string, string>
    >({});
    const [infoConfigOrder, setInfoConfigOrder] = useState<string[]>([]);
    const [tiketRegexConfigOrder, setTiketRegexConfigOrder] = useState<
      string[]
    >([]);
    const [checkProductsConfigOrder, setCheckProductsConfigOrder] = useState<
      string[]
    >([]);
    const [combotrxConfigOrder, setCombotrxConfigOrder] = useState<string[]>(
      [],
    );
    const [cektagihanConfigOrder, setCektagihanConfigOrder] = useState<
      string[]
    >([]);
    const [appRulesOrder, setAppRulesOrder] = useState<string[]>([]);

    // Normalize receipt maps config to ensure dash is always boolean and source has default
    const normalizeReceiptMapsConfig = (config: any): ReceiptMapsConfig => {
      return {
        ...config,
        configs: config.configs.map((cfg: any) => ({
          ...cfg,
          source: cfg.source || "sn", // default to "sn" if not specified
          product_prefixes: cfg.product_prefixes || [], // default to empty array
          dash:
            typeof cfg.dash === "string"
              ? cfg.dash.toLowerCase() === "true"
              : (cfg.dash ?? false),
        })),
      };
    };

    useEffect(() => {
      // Load from cache immediately
      const cached = getCachedSystemSettings();
      if (cached) {
        if (cached.appRules) {
          setAppRules(cached.appRules);
          setAppRulesOrder(Object.keys(cached.appRules));
        }
        if (cached.infoConfig) {
          setInfoConfig(cached.infoConfig);
          setInfoConfigOrder(Object.keys(cached.infoConfig));
        }
        if (cached.tiketRegexConfig) {
          setTiketRegexConfig(cached.tiketRegexConfig);
          setTiketRegexConfigOrder(Object.keys(cached.tiketRegexConfig));
        }
        if (cached.checkProductsConfig) {
          setCheckProductsConfig(cached.checkProductsConfig);
          setCheckProductsConfigOrder(Object.keys(cached.checkProductsConfig));
        }
        if (cached.combotrxConfig) {
          setCombotrxConfig(cached.combotrxConfig);
          setCombotrxConfigOrder(Object.keys(cached.combotrxConfig));
        }
        if (cached.cektagihanConfig) {
          setCektagihanConfig(cached.cektagihanConfig);
          setCektagihanConfigOrder(Object.keys(cached.cektagihanConfig));
        }
        if (cached.receiptMapsConfig) {
          setReceiptMapsConfig(
            normalizeReceiptMapsConfig(cached.receiptMapsConfig),
          );
        }
      }

      // Fetch from API in background
      loadAppRules(true);
      loadInfoConfig(true);
      loadTiketRegexConfig(true);
      loadCheckProductsConfig(true);
      loadCombotrxConfig(true);
      loadCektagihanConfig(true);
      loadReceiptMapsConfig(true);
    }, []);

    // Set initial active tab to first available config
    useEffect(() => {
      // Only set if current tab's config doesn't exist
      const currentTabHasConfig =
        (activeTab === "info_config" && infoConfig) ||
        (activeTab === "tiket_regex" && tiketRegexConfig) ||
        (activeTab === "check_products" && checkProductsConfig) ||
        (activeTab === "combotrx_config" && combotrxConfig) ||
        (activeTab === "cektagihan_config" && cektagihanConfig) ||
        (activeTab === "receipt_maps_config" && receiptMapsConfig) ||
        (activeTab === "textEditing" && appRules);

      if (!currentTabHasConfig) {
        // Set to first available tab
        if (infoConfig) setActiveTab("info_config");
        else if (tiketRegexConfig) setActiveTab("tiket_regex");
        else if (checkProductsConfig) setActiveTab("check_products");
        else if (combotrxConfig) setActiveTab("combotrx_config");
        else if (cektagihanConfig) setActiveTab("cektagihan_config");
        else if (receiptMapsConfig) setActiveTab("receipt_maps_config");
        else if (appRules) setActiveTab("textEditing");
      }
    }, [
      infoConfig,
      tiketRegexConfig,
      checkProductsConfig,
      combotrxConfig,
      cektagihanConfig,
      receiptMapsConfig,
      appRules,
      activeTab,
    ]);

    // Synchronize local cektagihan keys with cektagihan config
    useEffect(() => {
      if (cektagihanConfig) {
        const localKeys: Record<string, string> = {};
        Object.keys(cektagihanConfig).forEach((key) => {
          localKeys[key] = key;
        });
        setLocalCektagihanKeys(localKeys);
      }
    }, [cektagihanConfig]);

    const loadAppRules = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!background) {
            showToast("Session tidak valid", "error");
          }
          if (!appRules) {
            setAppRules(getDefaultRules());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/app-rules");
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
          if (data.success && data.rules) {
            setAppRules((prev) => {
              if (prev && JSON.stringify(prev) === JSON.stringify(data.rules)) {
                return prev;
              }
              return data.rules;
            });
            setAppRulesOrder(Object.keys(data.rules));
            setCachedSystemSettings({ appRules: data.rules });
          } else {
            if (!background) {
              showToast(data.message || "Gagal memuat pengaturan", "error");
            }
            if (!appRules) {
              const defaultRules = getDefaultRules();
              setAppRules(defaultRules);
              setAppRulesOrder(Object.keys(defaultRules));
            }
          }
        } else {
          if (!background) {
            showToast("Gagal memuat pengaturan dari server", "error");
          }
          if (!appRules) {
            const defaultRules = getDefaultRules();
            setAppRules(defaultRules);
            setAppRulesOrder(Object.keys(defaultRules));
          }
        }
      } catch (error) {
        if (!background) {
          showToast("Terjadi kesalahan saat memuat pengaturan", "error");
        }
        if (!appRules) {
          const defaultRules = getDefaultRules();
          setAppRules(defaultRules);
          setAppRulesOrder(Object.keys(defaultRules));
        }
      }
    };

    const loadInfoConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!background) {
            showToast("Session tidak valid", "error");
          }
          if (!infoConfig) {
            setInfoConfig(getDefaultInfoConfig());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/info-config");
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
            setInfoConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(data.config)
              ) {
                return prev;
              }
              return data.config;
            });
            setInfoConfigOrder(Object.keys(data.config));
            setCachedSystemSettings({ infoConfig: data.config });
          } else {
            if (!background) {
              showToast(data.message || "Gagal memuat konfigurasi info", "error");
            }
            if (!infoConfig) {
              const defaultConfig = getDefaultInfoConfig();
              setInfoConfig(defaultConfig);
              setInfoConfigOrder(Object.keys(defaultConfig));
            }
          }
        } else {
          if (!background) {
            showToast("Gagal memuat konfigurasi info dari server", "error");
          }
          if (!infoConfig) {
            const defaultConfig = getDefaultInfoConfig();
            setInfoConfig(defaultConfig);
            setInfoConfigOrder(Object.keys(defaultConfig));
          }
        }
      } catch (error) {
        if (!background) {
          showToast("Terjadi kesalahan saat memuat konfigurasi info", "error");
        }
        if (!infoConfig) {
          setInfoConfig(getDefaultInfoConfig());
        }
      }
    };

    const loadTiketRegexConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!background) {
            showToast("Session tidak valid", "error");
          }
          if (!tiketRegexConfig) {
            setTiketRegexConfig(getDefaultTiketRegexConfig());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/tiket-regex");
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
            setTiketRegexConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(data.config)
              ) {
                return prev;
              }
              return data.config;
            });
            setTiketRegexConfigOrder(Object.keys(data.config));
            setCachedSystemSettings({ tiketRegexConfig: data.config });
          } else {
            if (!background) {
              showToast(data.message || "Gagal memuat konfigurasi tiket regex", "error");
            }
            if (!tiketRegexConfig) {
              const defaultConfig = getDefaultTiketRegexConfig();
              setTiketRegexConfig(defaultConfig);
              setTiketRegexConfigOrder(Object.keys(defaultConfig));
            }
          }
        } else {
          if (!background) {
            showToast("Gagal memuat konfigurasi tiket regex dari server", "error");
          }
          if (!tiketRegexConfig) {
            const defaultConfig = getDefaultTiketRegexConfig();
            setTiketRegexConfig(defaultConfig);
            setTiketRegexConfigOrder(Object.keys(defaultConfig));
          }
        }
      } catch (error) {
        if (!background) {
          showToast("Terjadi kesalahan saat memuat konfigurasi tiket regex", "error");
        }
        if (!tiketRegexConfig) {
          setTiketRegexConfig(getDefaultTiketRegexConfig());
        }
      }
    };

    const loadCheckProductsConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!background) {
            showToast("Session tidak valid", "error");
          }
          if (!checkProductsConfig) {
            setCheckProductsConfig(getDefaultCheckProductsConfig());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/check-products");
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
            setCheckProductsConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(data.config)
              ) {
                return prev;
              }
              return data.config;
            });
            setCheckProductsConfigOrder(Object.keys(data.config));
            setCachedSystemSettings({ checkProductsConfig: data.config });
          } else {
            if (!background) {
              showToast(data.message || "Gagal memuat konfigurasi cek produk", "error");
            }
            if (!checkProductsConfig) {
              const defaultConfig = getDefaultCheckProductsConfig();
              setCheckProductsConfig(defaultConfig);
              setCheckProductsConfigOrder(Object.keys(defaultConfig));
            }
          }
        } else {
          if (!background) {
            showToast("Gagal memuat konfigurasi cek produk dari server", "error");
          }
          if (!checkProductsConfig) {
            const defaultConfig = getDefaultCheckProductsConfig();
            setCheckProductsConfig(defaultConfig);
            setCheckProductsConfigOrder(Object.keys(defaultConfig));
          }
        }
      } catch (error) {
        if (!background) {
          showToast("Terjadi kesalahan saat memuat konfigurasi cek produk", "error");
        }
        if (!checkProductsConfig) {
          const defaultConfig = getDefaultCheckProductsConfig();
          setCheckProductsConfig(defaultConfig);
          setCheckProductsConfigOrder(Object.keys(defaultConfig));
        }
      }
    };

    const getDefaultRules = (): AppRules => ({
      // Core system settings
      verificationFeature: true,
      editProfileFeature: true,
      biometrictTrxFeature: true,
      blockNonVerifiedMLM: true,
      blockNonVerifiedTransfer: false,
      exchangePoinToSaldo: true,
      exchangePoinToGift: true,
      permissionIntroFeatureEnabled: false,
      maxTransactionsTotal: 1000000,
      maxTransaction: 250000,
      newUserMarkup: 50,
      maxWelcomePosterPerDay: 5,
      minimumProductPriceToDisplay: 1,
      maximumVoucherActivation: 50,
      cs_phone: "+628123456789",
      cs_whatsapp: "628123456789",
      cs_email: "support@company.com",
      newUserGroup: "X",
      newUserUpline: "",

      // Sample messages (in real implementation, this would load all 900+ fields)
      authBiometricReason: "Autentikasi dengan biometrik",
      authTooManyRetriesMessage:
        "Terlalu banyak percobaan PIN gagal. Anda akan keluar.",
      authBiometricNotSupportedMessage:
        "Fitur biometrik tidak didukung pada perangkat atau sistem operasi ini.",
      authBiometricNotAvailableMessage:
        "Biometrik tidak tersedia di perangkat ini.",
      authBiometricFailedMessage:
        "Autentikasi biometrik gagal atau dibatalkan.",
      authBiometricErrorMessage: "Terjadi kesalahan biometrik.",
      authNoBiometricEnrolledMessage:
        "Tidak ada biometrik yang terdaftar di perangkat ini.",
      authBiometricLockedMessage:
        "Sensor biometrik terkunci. Silakan coba lagi nanti.",
      authBiometricNotAvailableDeviceMessage:
        "Fitur biometrik tidak tersedia di perangkat ini.",
      authPasscodeNotSetMessage:
        "Setel kunci layar perangkat Anda untuk menggunakan biometrik.",
      authGeneralErrorMessage: "Terjadi kesalahan: ",
      authSessionNotFoundMessage: "Session tidak ditemukan.",
      authCannotConnectMessage: "Tidak dapat terhubung ke server.",
      authWrongPinMessage: "PIN salah.",
      authEnterPinMessage: "Masukkan PIN Anda",
      authPinLabel: "PIN",
      authPinValidationMessage: "PIN harus 6 digit",
      authVerifyPinButtonText: "Verifikasi PIN",
      authBackToNumpadButtonText: "Kembali ke Numpad",
    });

    const getDefaultInfoConfig = (): InfoConfig => ({
      message_config: {
        otp_template:
          "Kode OTP Kamu: {}\nJangan berikan kode ini ke siapa pun, termasuk pihak operator/admin.\n Kode berlaku selama 5 menit.",
        user_inactive_message:
          "Akun pengguna tidak aktif. Silakan hubungi Customer Service.",
        user_suspended_message:
          "Akun pengguna disuspend. Silakan hubungi Customer Services.",
        otp_success_message: "OTP Berhasil dikirim",
        auth_success_message: "Otentikasi Login Berhasil",
        auth_invalid_credentials_message:
          "Otentikasi tidak valid, silakan coba clear cache aplikasi, dan coba lagi.",
        auth_otp_expired_message:
          "OTP telah kedaluwarsa, silakan login kembali untuk mendapatkan OTP baru.",
        auth_invalid_otp_message: "Kode OTP tidak valid, silakan coba lagi.",
        cooldown_message: "Mohon tunggu 60 detik sebelum mencoba lagi.",
        attempt_limit_message:
          "Terlalu banyak percobaan login, silakan coba lagi nanti. Hubungi Customer Service jika masalah berlanjut.",
        check_failed_message:
          "Gagal mendapatkan informasi pengguna, silakan coba lagi nanti.",
      },
    });

    const getDefaultTiketRegexConfig = (): TiketRegexConfig => ({
      tiket_regex: {
        regex:
          "(?s).*?Rp\\.\\s*(?P<amount>[\\d.,]+).*?\\n(?P<name>[^\\n\\s]+(?:\\s+[^\\n\\s]+)*)\\s*\\nBRI:\\s*(?P<bank_bri>\\d+)\\s*\\nMANDIRI:\\s*(?P<bank_close_mandiri>\\d+)\\s*\\nBNI:\\s*(?P<bank_bni>\\d+)\\s*\\nBCA:\\s*(?P<bank_bca>\\d+)\\s*\\nBSI:\\s*(?P<bank_bsi>\\d+)\\s*\\n(?P<note>.*)",
      },
    });

    const getDefaultCheckProductsConfig = (): CheckProductsConfig => ({
      CEKDN: ["DN%", "ADN%", "DANA%"],
      CEKGJK: ["GJK%", "GOPAY%"],
      CEKOVO: ["OVO%", "UOVO%"],
      CEKIDPEL: ["PM%", "TOKENP%"],
      "VAL.CEKTSEL": ["TSEL"],
      "INQ.CEKTDC": ["TDC"],
      CPLN: ["BPLN"],
      CEKPDAMPDG: ["PDAMPDG"],
      CEKTDOMQ: ["TDOMQ"],
    });

    // Combotrx Configuration Functions
    const loadCombotrxConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!background) {
            showToast("Session tidak valid", "error");
          }
          if (!combotrxConfig) {
            setCombotrxConfig(getDefaultCombotrxConfig());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/combotrx-config");
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
            setCombotrxConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(data.config)
              ) {
                return prev;
              }
              return data.config;
            });
            setCombotrxConfigOrder(Object.keys(data.config));
            setCachedSystemSettings({ combotrxConfig: data.config });
          } else {
            if (!background) {
              showToast(data.message || "Gagal memuat konfigurasi combotrx", "error");
            }
            if (!combotrxConfig) {
              const defaultConfig = getDefaultCombotrxConfig();
              setCombotrxConfig(defaultConfig);
              setCombotrxConfigOrder(Object.keys(defaultConfig));
            }
          }
        } else {
          if (!background) {
            showToast("Gagal memuat konfigurasi combotrx dari server", "error");
          }
          if (!combotrxConfig) {
            const defaultConfig = getDefaultCombotrxConfig();
            setCombotrxConfig(defaultConfig);
            setCombotrxConfigOrder(Object.keys(defaultConfig));
          }
        }
      } catch (error) {
        if (!background) {
          showToast("Terjadi kesalahan saat memuat konfigurasi combotrx", "error");
        }
        if (!combotrxConfig) {
          const defaultConfig = getDefaultCombotrxConfig();
          setCombotrxConfig(defaultConfig);
          setCombotrxConfigOrder(Object.keys(defaultConfig));
        }
      }
    };

    const getDefaultCombotrxConfig = (): Record<string, any> => ({
      CEKTDC: {
        pattern: "# (?P<kode>\\d+)\\|(?P<nama>[^|]+)\\|(?P<harga_final>\\d+)",
      },
      CEKTDT: {
        pattern: "# (?P<kode>\\d+)\\|(?P<nama>[^|]+)\\|(?P<harga_final>\\d+)",
      },
    });

    const saveCombotrxConfig = async (silent = false) => {
      if (!combotrxConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!silent) showToast("Session tidak valid", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/combotrx-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: combotrxConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast("Konfigurasi combotrx berhasil disimpan", "success");
          } else {
            if (!silent) showToast(data.message || "Gagal menyimpan konfigurasi combotrx", "error");
          }
        } else {
          if (!silent) showToast("Gagal menyimpan konfigurasi combotrx", "error");
        }
      } catch (error) {
        if (!silent) showToast("Gagal menyimpan konfigurasi combotrx", "error");
      }
    };

    const updateCombotrxConfig = (
      header: string,
      field: string,
      value: string,
    ) => {
      if (!combotrxConfig) return;

      setCombotrxConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        if (!newConfig[header]) {
          newConfig[header] = {};
        }
        newConfig[header] = {
          ...newConfig[header],
          [field]: value,
        };
        return newConfig;
      });
    };

    const addNewCombotrxHeader = () => {
      const newHeader = `NEW_HEADER_${Date.now()}`;
      setCombotrxConfig((prev) => ({
        ...prev,
        [newHeader]: {
          pattern: "# (?P<kode>\\d+)\\|(?P<nama>[^|]+)\\|(?P<harga_final>\\d+)",
        },
      }));

      // Add to order array at the end
      setCombotrxConfigOrder((prevOrder) => [...prevOrder, newHeader]);
    };

    const removeCombotrxHeader = (header: string) => {
      setCombotrxConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        delete newConfig[header];
        return newConfig;
      });

      // Remove from order array
      setCombotrxConfigOrder((prevOrder) =>
        prevOrder.filter((h) => h !== header),
      );
    };

    const updateCombotrxHeaderName = (oldHeader: string, newHeader: string) => {
      if (oldHeader === newHeader) return;

      setCombotrxConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        const headerData = newConfig[oldHeader];
        delete newConfig[oldHeader];
        newConfig[newHeader] = headerData;
        return newConfig;
      });

      // Update the order array to maintain position
      setCombotrxConfigOrder((prevOrder) => {
        const newOrder = [...prevOrder];
        const oldIndex = newOrder.indexOf(oldHeader);
        if (oldIndex !== -1) {
          newOrder[oldIndex] = newHeader;
        } else {
          // If old header not in order, add new header at the end
          newOrder.push(newHeader);
        }
        return newOrder;
      });

      // Clear local state for the old header
      setLocalCombotrxHeaders((prev) => {
        const newLocal = { ...prev };
        delete newLocal[oldHeader];
        return newLocal;
      });
    };

    // Cektagihan Configuration Functions
    const loadCektagihanConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!background) {
            showToast("No admin session found", "error");
          }
          if (!cektagihanConfig) {
            setCektagihanConfig(getDefaultCektagihanConfig());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/cektagihan-config");
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
            setCektagihanConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(data.config)
              ) {
                return prev;
              }
              return data.config;
            });
            setCektagihanConfigOrder(Object.keys(data.config));
            setCachedSystemSettings({ cektagihanConfig: data.config });
          } else {
            if (!cektagihanConfig) {
              const defaultConfig = getDefaultCektagihanConfig();
              setCektagihanConfig(defaultConfig);
              setCektagihanConfigOrder(Object.keys(defaultConfig));
            }
          }
        } else {
          if (!cektagihanConfig) {
            const defaultConfig = getDefaultCektagihanConfig();
            setCektagihanConfig(defaultConfig);
            setCektagihanConfigOrder(Object.keys(defaultConfig));
          }
        }
      } catch (error) {
        if (!cektagihanConfig) {
          setCektagihanConfig(getDefaultCektagihanConfig());
        }
      }
    };

    const getDefaultCektagihanConfig = (): CektagihanConfig => {
      return {
        CPLN: "(?P<nama>[^/]+)/TARIFDAYA:(?P<tarif>[^/]+)/(?P<daya>[^/]+)/PERIODE:(?P<periode>[^/]+)/STAND:(?P<stand>[^/]+)/RPTAG:(?P<rp_tag>[^/]+)/DENDA:(?P<denda>[^/]+)/TOTALTAG:(?P<tagihan>.*)",
        CEKTSEL: "(?P<tagihan>[\\d.,]+)",
        CEKGJK: "Nama Nasabah:\\s*(?P<nama_pelanggan>[^/]+?)\\s*/",
        CEKPDAMPDG:
          "(?P<nama>[^/]+)/PERIODE:(?P<periode>[^/]+)/DENDA:(?P<denda>[^/]+)/RP\\.TAGIHAN:(?P<rp_tagihan>[^/]+)/TTL\\.TAGIHAN:(?P<tagihan>.*)",
        CEKTDOMQ: "(?P<tagihan>[\\d.,]+)\\}",
      };
    };

    const saveCektagihanConfig = async (silent = false) => {
      if (!cektagihanConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!silent) showToast("No admin session found", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/cektagihan-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: cektagihanConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast("Cektagihan configuration saved successfully!", "success");
          } else {
            if (!silent) showToast(data.message || "Failed to save cektagihan configuration", "error");
          }
        } else {
          if (!silent) showToast("Failed to save cektagihan configuration", "error");
        }
      } catch (error) {
        if (!silent) showToast("Error saving cektagihan configuration", "error");
      }
    };

    const updateCektagihanConfig = (key: string, value: string) => {
      setCektagihanConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: value,
        };
      });
    };

    const addNewCektagihanKey = () => {
      const newKey = `NEW_KEY_${Date.now()}`;
      setCektagihanConfig((prev) => ({
        ...prev,
        [newKey]: "(?P<tagihan>[\\d.,]+)",
      }));

      // Add to order array at the end
      setCektagihanConfigOrder((prevOrder) => [...prevOrder, newKey]);
    };

    const removeCektagihanKey = (key: string) => {
      setCektagihanConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        delete newConfig[key];
        return newConfig;
      });

      // Remove from order array
      setCektagihanConfigOrder((prevOrder) =>
        prevOrder.filter((k) => k !== key),
      );
    };

    const updateCektagihanKeyName = (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;

      setCektagihanConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        const value = newConfig[oldKey];
        delete newConfig[oldKey];
        newConfig[newKey] = value;
        return newConfig;
      });

      // Update the order array to maintain position
      setCektagihanConfigOrder((prevOrder) => {
        const newOrder = [...prevOrder];
        const oldIndex = newOrder.indexOf(oldKey);
        if (oldIndex !== -1) {
          newOrder[oldIndex] = newKey;
        } else {
          // If old key not in order, add new key at the end
          newOrder.push(newKey);
        }
        return newOrder;
      });
    };

    const handleCektagihanKeyNameChange = (oldKey: string, newKey: string) => {
      setLocalCektagihanKeys((prev) => ({
        ...prev,
        [oldKey]: newKey,
      }));
    };

    const handleCektagihanKeyNameBlur = (oldKey: string) => {
      const newKey = localCektagihanKeys[oldKey];
      if (newKey && newKey !== oldKey) {
        updateCektagihanKeyName(oldKey, newKey);
      }
    };

    const handleCektagihanKeyNameKeyDown = (
      oldKey: string,
      e: React.KeyboardEvent,
    ) => {
      if (e.key === "Enter") {
        const newKey = localCektagihanKeys[oldKey];
        if (newKey && newKey !== oldKey) {
          updateCektagihanKeyName(oldKey, newKey);
        }
      }
    };

    const handleCombotrxHeaderNameChange = (
      oldHeader: string,
      newHeader: string,
    ) => {
      setLocalCombotrxHeaders((prev) => ({
        ...prev,
        [oldHeader]: newHeader,
      }));
    };

    const handleCombotrxHeaderNameBlur = (oldHeader: string) => {
      const newHeader = localCombotrxHeaders[oldHeader];
      if (newHeader && newHeader !== oldHeader) {
        updateCombotrxHeaderName(oldHeader, newHeader);
      }
    };

    const handleCombotrxHeaderNameKeyDown = (
      oldHeader: string,
      e: React.KeyboardEvent,
    ) => {
      if (e.key === "Enter") {
        const newHeader = localCombotrxHeaders[oldHeader];
        if (newHeader && newHeader !== oldHeader) {
          updateCombotrxHeaderName(oldHeader, newHeader);
        }
        (e.currentTarget as HTMLElement).blur();
      }
    };

    // Receipt Maps Configuration Functions
    const loadReceiptMapsConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!background) {
            showToast("No admin session found", "error");
          }
          if (!receiptMapsConfig) {
            setReceiptMapsConfig(getDefaultReceiptMapsConfig());
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/receipt-maps-config");
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
            // Normalize dash field to boolean for backward compatibility
            const normalizedConfig = normalizeReceiptMapsConfig(data.config);
            setReceiptMapsConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(normalizedConfig)
              ) {
                return prev;
              }
              return normalizedConfig;
            });
            setCachedSystemSettings({ receiptMapsConfig: normalizedConfig });
          } else {
            if (!receiptMapsConfig) {
              setReceiptMapsConfig(getDefaultReceiptMapsConfig());
            }
          }
        } else {
          if (!receiptMapsConfig) {
            setReceiptMapsConfig(getDefaultReceiptMapsConfig());
          }
        }
      } catch (error) {
        if (!receiptMapsConfig) {
          setReceiptMapsConfig(getDefaultReceiptMapsConfig());
        }
      }
    };

    const getDefaultReceiptMapsConfig = (): ReceiptMapsConfig => {
      return {
        configs: [
          {
            name: "TEST",
            product_prefixes: ["BPLN", "TEST%"],
            source: "sn",
            regex:
              "^(?P<nama>[^/]+)/TARIFDAYA:(?P<tarifdaya>[^/]+)/(?P<tarifsub>[^/]+)/PERIODE:(?P<periode>[^/]+)/STAND:(?P<stand>[^/]+)/REFF:(?P<ref>[^/]+)/TTL\\.TAGIHAN:(?P<tagihan>[^\\s]+)",
            highlight_key: "ref",
            dash: false,
            receipt_title: "STRUK PEMBAYARAN TAGIHAN PLN PASCABAYAR",
            info_text:
              "Simpan bukti struk ini sebagai bukti pembayaran yang sah.",
          },
          {
            name: "TOKEN",
            product_prefixes: ["PMP%", "PM%", "TOKENP%"],
            source: "sn",
            regex:
              "(?P<token>[\\dO-]+)/(?P<nama_pelanggan>[^/]+(?:/[^/]+)?)/(?P<golongan>[^/]+)/(?P<daya>[O0]*\\d+VA)/(?P<kwh>[\\d,-]+(?:[kK][wW][hH])?)",
            highlight_key: "token",
            dash: true,
            receipt_title: "STRUK PEMBELIAN LISTRIK PRABAYAR",
            info_text: "Info Hubungi Call Center 123 Atau Hubungi PLN Terdekat",
          },
          {
            name: "PDAMPDG",
            product_prefixes: ["PDAMPDG"],
            source: "sn",
            regex:
              "(?P<nama>.*?)/PERIODE:(?P<periode>[^/]+)/DENDA:(?P<denda>[^/]+)/TAGIHAN:(?P<tagihan>[^/]+)/REF:(?P<ref>.*)",
            highlight_key: "ref",
            dash: false,
            receipt_title: "STRUK PEMBBAYARAN TAGIHAN PDAM PRABAYAR",
            info_text: "Info Hubungi Kantor PDAM Terdekat",
          },
        ],
      };
    };

    const saveReceiptMapsConfig = async (silent = false) => {
      if (!receiptMapsConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!silent) showToast("No admin session found", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/receipt-maps-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: receiptMapsConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast("Receipt maps configuration saved successfully!", "success");
            // Trigger config sync to notify mobile apps
            triggerConfigSync(CONFIG_TYPES.RECEIPT_MAPS);
          } else {
            if (!silent) showToast(data.message || "Failed to save receipt maps configuration", "error");
          }
        } else {
          if (!silent) showToast("Failed to save receipt maps configuration", "error");
        }
      } catch (error) {
        if (!silent) showToast("Error saving receipt maps configuration", "error");
      }
    };

    const updateReceiptConfig = (
      index: number,
      field: keyof ReceiptConfig,
      value: any,
    ) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        return { ...prev, configs: newConfigs };
      });
    };

    const addNewReceiptConfig = () => {
      const newConfig: ReceiptConfig = {
        name: `NEW_CONFIG_${Date.now()}`,
        product_prefixes: ["NEW%"],
        source: "sn",
        regex: "(?P<tagihan>[\\d.,]+)",
        highlight_key: "tagihan",
        dash: false,
        receipt_title: "STRUK PEMBAYARAN",
        info_text: "Simpan bukti struk ini sebagai bukti pembayaran yang sah.",
      };

      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs, newConfig];
        const newIndex = newConfigs.length - 1;

        // Auto-expand the new configuration
        setExpandedReceiptConfigs((prevExpanded) => {
          const newExpanded = new Set(prevExpanded);
          newExpanded.add(newIndex);
          return newExpanded;
        });

        return {
          ...prev,
          configs: newConfigs,
        };
      });
    };

    const removeReceiptConfig = (index: number) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = prev.configs.filter((_, i) => i !== index);
        return { ...prev, configs: newConfigs };
      });
    };

    const addProductPrefix = (configIndex: number) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          product_prefixes: [
            ...newConfigs[configIndex].product_prefixes,
            `NEW_PREFIX_${Date.now()}`,
          ],
        };
        return { ...prev, configs: newConfigs };
      });
    };

    const removeProductPrefix = (configIndex: number, prefixIndex: number) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          product_prefixes: newConfigs[configIndex].product_prefixes.filter(
            (_, i) => i !== prefixIndex,
          ),
        };
        return { ...prev, configs: newConfigs };
      });
    };

    const updateProductPrefix = (
      configIndex: number,
      prefixIndex: number,
      value: string,
    ) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        const newPrefixes = [...newConfigs[configIndex].product_prefixes];
        newPrefixes[prefixIndex] = value;
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          product_prefixes: newPrefixes,
        };
        return { ...prev, configs: newConfigs };
      });
    };

    // Bantuan Configuration Functions
    const loadBantuanConfig = async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!background) {
            showToast("No admin session found", "error");
          }
          if (!bantuanConfig) {
            setBantuanConfig(getDefaultBantuanConfig());
          }
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
            setBantuanConfig((prev) => {
              if (
                prev &&
                JSON.stringify(prev) === JSON.stringify(data.config)
              ) {
                return prev;
              }
              return data.config;
            });
            setCachedSystemSettings({ bantuanConfig: data.config });
          } else {
            if (!bantuanConfig) {
              setBantuanConfig(getDefaultBantuanConfig());
            }
          }
        } else {
          if (!bantuanConfig) {
            setBantuanConfig(getDefaultBantuanConfig());
          }
        }
      } catch (error) {
        if (!bantuanConfig) {
          setBantuanConfig(getDefaultBantuanConfig());
        }
      }
    };

    const getDefaultBantuanConfig = (): BantuanConfig => {
      return {
        mainCard: "Butuh Bantuan?",
        mainCardContent:
          "Pusat bantuan kami siap membantu Anda. Temukan jawaban dari pertanyaan umum atau hubungi tim support kami.",
        topicTitle: "Topik Populer",
        topicCards: [
          {
            icon: "https://www.svgrepo.com/download/529282/user-hand-up.svg",
            title: "Akun & Profile",
            desc: "Cara mengelola akun dan memperbarui profil.",
            url: "https://google.com",
          },
          {
            icon: "https://www.svgrepo.com/download/529011/heart-unlock.svg",
            title: "Keamanan",
            desc: "Tips menjaga keamanan akun dan transaksi",
            route: "/webview",
            routeArgs: {
              url: "https://google.com",
            },
          },
        ],
      };
    };

    const saveBantuanConfig = async (silent = false) => {
      if (!bantuanConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!silent) showToast("No admin session found", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/bantuan-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: bantuanConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast("Bantuan configuration saved successfully!", "success");
          } else {
            if (!silent) showToast(data.message || "Failed to save bantuan configuration", "error");
          }
        } else {
          if (!silent) showToast("Failed to save bantuan configuration", "error");
        }
      } catch (error) {
        if (!silent) showToast("Error saving bantuan configuration", "error");
      }
    };

    const updateBantuanConfig = (field: keyof BantuanConfig, value: any) => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    };

    const addNewTopicCard = () => {
      const newCard: TopicCard = {
        icon: "https://www.svgrepo.com/download/529282/user-hand-up.svg",
        title: `New Topic ${Date.now()}`,
        desc: "Description for the new topic",
        url: "https://example.com",
      };

      setBantuanConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topicCards: [...prev.topicCards, newCard],
        };
      });
    };

    const removeTopicCard = (index: number) => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        const newCards = prev.topicCards.filter((_, i) => i !== index);
        return { ...prev, topicCards: newCards };
      });
    };

    const updateTopicCard = (
      index: number,
      field: keyof TopicCard,
      value: any,
    ) => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        const newCards = [...prev.topicCards];
        newCards[index] = { ...newCards[index], [field]: value };
        return { ...prev, topicCards: newCards };
      });
    };

    const getBantuanFieldLabel = (key: string): string => {
      const labels: Record<string, string> = {
        mainCard: "Judul Kartu Utama",
        mainCardContent: "Konten Kartu Utama",
        topicTitle: "Judul Topik",
      };
      return labels[key] || key;
    };

    const getBantuanFieldDescription = (key: string): string => {
      const descriptions: Record<string, string> = {
        mainCard: "Judul utama yang ditampilkan di layar bantuan",
        mainCardContent:
          "Deskripsi atau konten utama yang ditampilkan di layar bantuan",
        topicTitle: "Judul untuk bagian daftar topik bantuan",
      };
      return descriptions[key] || "";
    };

    const renderBantuanRow = (
      key: string,
      value: any,
      onUpdate: (key: string, value: any) => void,
    ) => {
      const label = getBantuanFieldLabel(key);
      const description = getBantuanFieldDescription(key);
      const isLongText = String(value).length > 50;

      return (
        <div
          key={key}
          className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
        >
          {/* Name */}
          <div className="flex-shrink-0 w-1/6 flex items-start">
            <span
              className="text-sm font-medium text-gray-700 truncate block"
              title={label}
            >
              {label}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Description */}
          <div className="flex-1 min-w-0 flex items-start">
            <span
              className="text-xs text-gray-600 block break-words whitespace-normal"
              title={description}
            >
              {description}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Value */}
          <div className="flex-shrink-0 w-1/3 flex items-start">
            {isLongText ? (
              <textarea
                value={value || ""}
                onChange={(e) => onUpdate(key, e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              />
            ) : (
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onUpdate(key, e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              />
            )}
          </div>
        </div>
      );
    };

    const renderTopicCardRow = (
      cardIndex: number,
      field: keyof TopicCard,
      value: any,
      onUpdate: (field: keyof TopicCard, value: any) => void,
    ) => {
      const fieldLabels: Record<keyof TopicCard, string> = {
        icon: "Icon URL",
        title: "Judul",
        desc: "Deskripsi",
        url: "URL",
        route: "Route",
        routeArgs: "Route Args",
      };

      const fieldDescriptions: Record<keyof TopicCard, string> = {
        icon: "URL gambar icon untuk kartu topik",
        title: "Judul yang ditampilkan pada kartu topik",
        desc: "Deskripsi atau penjelasan tentang topik",
        url: "URL langsung ke browser yang akan dibuka saat kartu diklik",
        route: "Route aplikasi yang akan dibuka (misalnya /webview)",
        routeArgs: "Argumen untuk route (berisi URL)",
      };

      const label = fieldLabels[field] || field;
      const description = fieldDescriptions[field] || "";
      const isLongText = field === "desc" || String(value).length > 50;
      const key = `topicCards[${cardIndex}].${field}`;

      return (
        <div
          key={key}
          className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
        >
          {/* Name */}
          <div className="flex-shrink-0 w-1/6 flex items-start">
            <span
              className="text-sm font-medium text-gray-700 truncate block"
              title={label}
            >
              {label}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Description */}
          <div className="flex-1 min-w-0 flex items-start">
            <span
              className="text-xs text-gray-600 block break-words whitespace-normal"
              title={description}
            >
              {description}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Value */}
          <div className="flex-shrink-0 w-1/3 flex items-start">
            {field === "icon" ? (
              <div className="flex gap-1 w-full">
                <input
                  type="text"
                  value={value || ""}
                  onChange={(e) => onUpdate(field, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
                  placeholder="https://..."
                />
                <input
                  ref={(el) => {
                    if (el) bantuanFileInputRefs.current[cardIndex] = el;
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBantuanFileSelect(e, cardIndex)}
                  className="hidden"
                />
                {value && typeof value === 'string' && value.startsWith('http') && (
                  <ImageHoverPreview
                    src={value}
                    alt="Preview"
                    thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                  />
                )}
                <button
                  type="button"
                  onClick={() => bantuanFileInputRefs.current[cardIndex]?.click()}
                  className="px-2 py-1 text-white rounded transition-colors"
                  style={{ backgroundColor: THEME_COLOR }}
                  title="Upload icon"
                >
                  <Upload size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => openBantuanAssetPicker(cardIndex)}
                  className="px-2 py-1 bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
                  title="Select from assets"
                >
                  <ImageIcon size={14} />
                </button>
              </div>
            ) : isLongText ? (
              <textarea
                value={value || ""}
                onChange={(e) => onUpdate(field, e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              />
            ) : (
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onUpdate(field, e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              />
            )}
          </div>
        </div>
      );
    };

    const setTopicCardLinkType = (index: number, type: "url" | "route") => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        const newCards = [...prev.topicCards];
        if (type === "url") {
          newCards[index] = {
            ...newCards[index],
            url: newCards[index].url || "https://example.com",
            route: undefined,
            routeArgs: undefined,
          };
        } else {
          newCards[index] = {
            ...newCards[index],
            url: undefined,
            route: "/webview",
            routeArgs: {
              url: newCards[index].url || "https://example.com",
            },
          };
        }
        return { ...prev, topicCards: newCards };
      });
    };

    const toggleTopicCard = (index: number) => {
      setExpandedTopicCards((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    };

    const handleTopicCardDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = bantuanConfig?.topicCards.findIndex(
          (_, i) => `topicCard_${i}` === active.id,
        );
        const newIndex = bantuanConfig?.topicCards.findIndex(
          (_, i) => `topicCard_${i}` === over.id,
        );
        if (
          oldIndex !== undefined &&
          oldIndex !== -1 &&
          newIndex !== undefined &&
          newIndex !== -1
        ) {
          setBantuanConfig((prev) => {
            if (!prev) return prev;
            const reorderedCards = arrayMove(prev.topicCards, oldIndex, newIndex);
            return { ...prev, topicCards: reorderedCards };
          });

          // Update expanded cards indices
          setExpandedTopicCards((prev) => {
            const newSet = new Set<number>();
            prev.forEach((idx) => {
              if (idx === oldIndex) {
                newSet.add(newIndex);
              } else if (oldIndex < newIndex && idx > oldIndex && idx <= newIndex) {
                newSet.add(idx - 1);
              } else if (oldIndex > newIndex && idx >= newIndex && idx < oldIndex) {
                newSet.add(idx + 1);
              } else {
                newSet.add(idx);
              }
            });
            return newSet;
          });
        }
      }
    };

    const handleReceiptConfigDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = receiptMapsConfig?.configs.findIndex(
          (_, i) => `receiptConfig_${i}` === active.id,
        );
        const newIndex = receiptMapsConfig?.configs.findIndex(
          (_, i) => `receiptConfig_${i}` === over.id,
        );
        if (
          oldIndex !== undefined &&
          oldIndex !== -1 &&
          newIndex !== undefined &&
          newIndex !== -1
        ) {
          setReceiptMapsConfig((prev) => {
            if (!prev) return prev;
            const reorderedConfigs = arrayMove(prev.configs, oldIndex, newIndex);
            return { ...prev, configs: reorderedConfigs };
          });

          // Update expanded configs indices
          setExpandedReceiptConfigs((prev) => {
            const newSet = new Set<number>();
            prev.forEach((idx) => {
              if (idx === oldIndex) {
                newSet.add(newIndex);
              } else if (oldIndex < newIndex && idx > oldIndex && idx <= newIndex) {
                newSet.add(idx - 1);
              } else if (oldIndex > newIndex && idx >= newIndex && idx < oldIndex) {
                newSet.add(idx + 1);
              } else {
                newSet.add(idx);
              }
            });
            return newSet;
          });
        }
      }
    };

    // Helper function to get public URL for assets
    const getBantuanPublicUrl = async (filename: string) => {
      const cleanFilename = filename
        .replace(/^\/assets\//, "")
        .replace(/^\//, "");
      const apiUrl = await getApiUrl("");
      return `${apiUrl}/assets/${cleanFilename}`;
    };

    // Handle file upload for topic card icons
    const handleBantuanUploadFile = async (file: File) => {
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
            publicUrl = await getBantuanPublicUrl(filename);
          }

          if (publicUrl) {
            setBantuanAssetsRefreshTrigger((prev) => prev + 1);
            return publicUrl;
          }
        }
        return null;
      } catch (error) {
        return null;
      }
    };

    // Handle file selection for topic card icon
    const handleBantuanFileSelect = async (
      event: React.ChangeEvent<HTMLInputElement>,
      index: number,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const url = await handleBantuanUploadFile(file);
      if (url) {
        updateTopicCard(index, "icon", url);
      }

      if (bantuanFileInputRefs.current[index]) {
        bantuanFileInputRefs.current[index]!.value = "";
      }
    };

    // Handle asset selection from picker for topic card icon
    const handleBantuanAssetSelect = (url: string) => {
      if (url && currentTopicCardIconIndex !== null) {
        updateTopicCard(currentTopicCardIconIndex, "icon", url);
        setShowBantuanAssetPicker(false);
        setCurrentTopicCardIconIndex(null);
      }
    };

    // Open asset picker for topic card icon
    const openBantuanAssetPicker = (index: number) => {
      setCurrentTopicCardIconIndex(index);
      setShowBantuanAssetPicker(true);
    };

    const getReceiptFieldLabel = (key: keyof ReceiptConfig): string => {
      const labels: Record<keyof ReceiptConfig, string> = {
        name: "Nama",
        product_prefixes: "Produk",
        source: "Sumber Data",
        regex: "Regex Pattern",
        highlight_key: "Highlight Key",
        dash: "Dash",
        receipt_title: "Receipt Title",
        info_text: "Info Text",
      };
      return labels[key] || key;
    };

    const getReceiptFieldDescription = (key: keyof ReceiptConfig): string => {
      const descriptions: Record<keyof ReceiptConfig, string> = {
        name: "Nama konfigurasi struk",
        product_prefixes:
          "Array prefix produk yang menggunakan konfigurasi ini",
        source:
          "Sumber data untuk parsing struk: SN (dari tabel transaksi) atau Pesan (dari tabel inbox)",
        regex:
          "Pattern regex untuk parsing data dari response. Nama group regex (contoh: (?P<nama>...), (?P<tagihan>...)) akan menjadi nama key detail pada struk",
        highlight_key:
          "Key yang akan di-highlight pada struk (harus sesuai dengan nama group regex)",
        dash: "Untuk menambahkan separator (-) pada nilai highlight_key setiap 4 digit. Contoh: 1234-5678-9012-3456",
        receipt_title: "Judul yang ditampilkan di struk",
        info_text: "Teks informasi di bawah struk",
      };
      return descriptions[key] || "";
    };

    const renderReceiptRow = (
      configIndex: number,
      field: keyof ReceiptConfig,
      value: any,
      onUpdate: (field: keyof ReceiptConfig, value: any) => void,
    ) => {
      const label = getReceiptFieldLabel(field);
      const description = getReceiptFieldDescription(field);
      const isLongText =
        field === "regex" || field === "info_text" || String(value).length > 50;

      return (
        <div
          key={field}
          className="flex gap-3 p-3 bg-white/60 rounded-lg border border-white/40 shadow-sm hover:bg-white/80"
        >
          {/* Name */}
          <div className="flex-shrink-0 w-1/6 flex items-start">
            <span
              className="text-sm font-medium text-gray-700 truncate block"
              title={label}
            >
              {label}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Description */}
          <div className="flex-1 min-w-0 flex items-start">
            <span
              className="text-xs text-gray-600 block break-words whitespace-normal"
              title={description}
            >
              {description}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Value */}
          <div className="flex-shrink-0 w-1/3 flex items-start">
            {field === "dash" ? (
              <select
                value={value.toString()}
                onChange={(e) => onUpdate(field, e.target.value === "true")}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              >
                <option value="false">False</option>
                <option value="true">True</option>
              </select>
            ) : isLongText ? (
              <textarea
                value={value || ""}
                onChange={(e) => onUpdate(field, e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            ) : (
              <input
                type="text"
                value={value || ""}
                onChange={(e) => onUpdate(field, e.target.value)}
                className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
              />
            )}
          </div>
        </div>
      );
    };

    // App Info Configuration removed

    const saveAppRules = async (silent = false) => {
      if (!appRules) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!silent) showToast("Session tidak valid", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/app-rules/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            rules: appRules,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast(data.message || "Pengaturan berhasil disimpan!", "success");
            // Trigger config sync to notify mobile apps
            triggerConfigSync(CONFIG_TYPES.APP_RULES);
          } else {
            if (!silent) showToast(data.message || "Gagal menyimpan pengaturan", "error");
          }
        } else {
          if (!silent) showToast("Gagal menyimpan pengaturan ke server", "error");
        }
      } catch (error) {
        if (!silent) showToast("Terjadi kesalahan saat menyimpan", "error");
      }
    };

    const saveInfoConfig = async (silent = false) => {
      if (!infoConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!silent) showToast("Session tidak valid", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/info-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            config: infoConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast(data.message || "Konfigurasi info berhasil disimpan!", "success");
            // Trigger config sync to notify mobile apps
            triggerConfigSync(CONFIG_TYPES.INFO_CONFIG);
          } else {
            if (!silent) showToast(data.message || "Gagal menyimpan konfigurasi info", "error");
          }
        } else {
          if (!silent) showToast("Gagal menyimpan konfigurasi info ke server", "error");
        }
      } catch (error) {
        if (!silent) showToast("Terjadi kesalahan saat menyimpan konfigurasi info", "error");
      }
    };

    const saveTiketRegexConfig = async (silent = false) => {
      if (!tiketRegexConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!silent) showToast("Session tidak valid", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/tiket-regex/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            config: tiketRegexConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast(data.message || "Konfigurasi tiket regex berhasil disimpan!", "success");
          } else {
            if (!silent) showToast(data.message || "Gagal menyimpan konfigurasi tiket regex", "error");
          }
        } else {
          if (!silent) showToast("Gagal menyimpan konfigurasi tiket regex ke server", "error");
        }
      } catch (error) {
        if (!silent) showToast("Terjadi kesalahan saat menyimpan konfigurasi tiket regex", "error");
      }
    };

    const saveCheckProductsConfig = async (silent = false) => {
      if (!checkProductsConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          if (!silent) showToast("Session tidak valid", "error");
          return;
        }

        const apiUrl = await getApiUrl("/admin/check-products/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            config: checkProductsConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!silent) showToast(data.message || "Konfigurasi cek produk berhasil disimpan!", "success");
          } else {
            if (!silent) showToast(data.message || "Gagal menyimpan konfigurasi cek produk", "error");
          }
        } else {
          if (!silent) showToast("Gagal menyimpan konfigurasi cek produk ke server", "error");
        }
      } catch (error) {
        if (!silent) showToast("Terjadi kesalahan saat menyimpan konfigurasi cek produk", "error");
      }
    };

    // Unified save function for all configurations
    const saveAllConfigurations = async () => {

      try {
        // Save all configurations in parallel with silent mode (no individual toasts)
        await Promise.all([
          saveAppRules(true),
          saveInfoConfig(true),
          saveTiketRegexConfig(true),
          saveCheckProductsConfig(true),
          saveCombotrxConfig(true),
          saveCektagihanConfig(true),
          saveReceiptMapsConfig(true),
        ]);

        showToast("Semua konfigurasi berhasil disimpan!", "success");
      } catch (error) {
        showToast("Terjadi kesalahan saat menyimpan konfigurasi", "error");
      }
    };

    // Expose saveAllConfigurations function to parent component
    useImperativeHandle(ref, () => ({
      saveAllConfigurations,
    }));

    const updateRule = (key: string, value: any) => {
      if (!appRules) return;
      setAppRules({ ...appRules, [key]: value });
    };

    const updateInfoConfig = (key: string, value: any) => {
      if (!infoConfig) return;

      // Handle nested updates for message_config
      if (
        infoConfig.message_config &&
        infoConfig.message_config.hasOwnProperty(key)
      ) {
        setInfoConfig({
          ...infoConfig,
          message_config: {
            ...infoConfig.message_config,
            [key]: value,
          },
        });
      } else {
        // Handle top-level updates
        setInfoConfig({ ...infoConfig, [key]: value });
      }
    };

    const updateTiketRegexConfig = (key: string, value: any) => {
      if (!tiketRegexConfig) return;

      // Handle nested updates for tiket_regex
      if (
        tiketRegexConfig.tiket_regex &&
        tiketRegexConfig.tiket_regex.hasOwnProperty(key)
      ) {
        setTiketRegexConfig({
          ...tiketRegexConfig,
          tiket_regex: {
            ...tiketRegexConfig.tiket_regex,
            [key]: value,
          },
        });
      } else {
        // Handle top-level updates
        setTiketRegexConfig({ ...tiketRegexConfig, [key]: value });
      }
    };

    const updateCheckProductsConfig = (key: string, value: string[]) => {
      if (!checkProductsConfig) return;
      setCheckProductsConfig({ ...checkProductsConfig, [key]: value });
    };

    const addNewKey = () => {
      if (!checkProductsConfig) return;
      const newKey = `NEW_KEY_${Date.now()}`;
      setCheckProductsConfig({ ...checkProductsConfig, [newKey]: [""] });

      // Add to order array at the end
      setCheckProductsConfigOrder((prevOrder) => [...prevOrder, newKey]);
    };

    const getFieldLabel = (key: string): string => {
      // Info config labels
      const infoConfigLabels: Record<string, string> = {
        otp_template: "Template OTP",
        user_inactive_message: "Pesan User Tidak Aktif",
        user_suspended_message: "Pesan User Disuspend",
        otp_success_message: "Pesan OTP Berhasil",
        auth_success_message: "Pesan Autentikasi Berhasil",
        auth_invalid_credentials_message: "Pesan Kredensial Tidak Valid",
        auth_otp_expired_message: "Pesan OTP Kedaluwarsa",
        auth_invalid_otp_message: "Pesan OTP Tidak Valid",
        cooldown_message: "Pesan Cooldown",
        attempt_limit_message: "Pesan Batas Percobaan",
        check_failed_message: "Pesan Gagal Cek",
      };

      // Tiket regex labels
      const tiketRegexLabels: Record<string, string> = {
        regex: "Regex Pattern",
      };

      // Return specific label for info config
      if (infoConfigLabels[key]) {
        return infoConfigLabels[key];
      }

      // Return specific label for tiket regex
      if (tiketRegexLabels[key]) {
        return tiketRegexLabels[key];
      }

      // Default label conversion for other settings
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    };

    const EXCLUDED_KEYS = [
      "check_sn_timeout",
      "verificationFeature",
      "exchangePoinToSaldo",
      "permissionIntroFeatureEnabled",
      "blockNonVerifiedMLM",
      "exchangePoinToGift",
      "blockNonVerifiedTransfer",
      "biometrictTrxFeature",
      "editProfileFeature",
      "maximumVoucherActivation",
      "minimumProductPriceToDisplay",
      "cs_email",
      "cs_whatsapp",
      "cs_phone",
      "maxWelcomePosterPerDay",
      "newUserMarkup",
      "newUserGroup",
      "newUserUpline",
      "blockNonVerifiedTransfer",
      "blockNonVerifiedMLM",
      "maxTransaction",
      "maxTransactionsTotal",
      "whatsappHelp",
      "whatsappHelpFormat",
      "liveChatHelpFormat",
    ];

    const shouldShowField = (key: string): boolean => {
      if (EXCLUDED_KEYS.includes(key)) return false;

      if (!searchTerm) return true;

      // If filter is active, check if this key was in the matched set
      // This prevents fields from disappearing when their values are edited
      return matchedKeys.has(key);
    };

    const renderField = (
      key: string,
      value: any,
      updateFunction: (key: string, value: any) => void = updateRule,
    ) => {
      const displayValue =
        value === null || value === undefined ? "" : String(value);

      return (
        <div
          key={key}
          className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
        >
          {/* Key */}
          <div className="flex-shrink-0 w-1/3">
            <span
              className="text-sm font-mono text-gray-700 truncate block"
              title={key}
            >
              {key}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Value */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => updateFunction(key, e.target.value)}
              className="w-full px-2 py-1 text-sm bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
            />
          </div>
        </div>
      );
    };

    // State for managing local input values to prevent focus loss
    const [localInputValues, setLocalInputValues] = useState<
      Record<string, string>
    >({});

    // Sync local input values when checkProductsConfig changes
    useEffect(() => {
      if (checkProductsConfig) {
        const newLocalValues: Record<string, string> = {};
        Object.keys(checkProductsConfig).forEach((key) => {
          const { baseName } = getKeyTypeAndName(key);
          newLocalValues[key] = baseName;
        });
        setLocalInputValues(newLocalValues);
      }
    }, [checkProductsConfig]);

    // Helper function to parse key type and name
    const getKeyTypeAndName = (
      key: string,
    ): { type: "regular" | "val" | "inq"; baseName: string } => {
      if (key.startsWith("VAL.")) {
        return { type: "val", baseName: key.substring(4) };
      } else if (key.startsWith("INQ.")) {
        return { type: "inq", baseName: key.substring(4) };
      } else {
        return { type: "regular", baseName: key };
      }
    };

    // Special render function for check products (key-value pairs with arrays)
    const renderCheckProductField = (
      key: string,
      products: string[],
      updateFunction: (key: string, value: string[]) => void,
    ) => {
      const { type, baseName } = getKeyTypeAndName(key);

      // Get local input value, initialize if not exists
      const localBaseName =
        localInputValues[key] !== undefined ? localInputValues[key] : baseName;

      // Update local input value
      const updateLocalInputValue = (newValue: string) => {
        setLocalInputValues((prev) => ({
          ...prev,
          [key]: newValue,
        }));
      };

      const getKeyDescription = (type: string): string => {
        switch (type) {
          case "val":
            return "Cek tagihan setelah mengisi nominal";
          case "inq":
            return "Query paket tersedia";
          default:
            return "Cek produk reguler";
        }
      };

      const updateKeyType = (
        newType: "regular" | "val" | "inq",
        newBaseName: string,
      ) => {
        let newKey: string;
        switch (newType) {
          case "val":
            newKey = `VAL.${newBaseName}`;
            break;
          case "inq":
            newKey = `INQ.${newBaseName}`;
            break;
          default:
            newKey = newBaseName;
        }

        if (newKey !== key) {
          // Update the key by removing old key and adding new key
          const newConfig = { ...checkProductsConfig };
          delete newConfig[key];
          newConfig[newKey] = products;
          setCheckProductsConfig(newConfig);

          // Update the order array to maintain position
          setCheckProductsConfigOrder((prevOrder) => {
            const newOrder = [...prevOrder];
            const oldIndex = newOrder.indexOf(key);
            if (oldIndex !== -1) {
              newOrder[oldIndex] = newKey;
            } else {
              // If old key not in order, add new key at the end
              newOrder.push(newKey);
            }
            return newOrder;
          });
        }
      };

      return (
        <div
          key={key}
          className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
        >
          {/* Name Column */}
          <div className="flex-shrink-0 w-1/6 flex items-start">
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={localBaseName}
                onChange={(e) => updateLocalInputValue(e.target.value)}
                onBlur={() => updateKeyType(type, localBaseName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateKeyType(type, localBaseName);
                    (e.currentTarget as HTMLElement).blur();
                  }
                }}
                className="text-sm font-medium text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary-500 px-1 py-0.5 w-full"
                placeholder="Nama key"
              />
              <button
                onClick={() => {
                  const newConfig = { ...checkProductsConfig };
                  delete newConfig[key];
                  setCheckProductsConfig(newConfig);
                  setCheckProductsConfigOrder((prevOrder) =>
                    prevOrder.filter((k) => k !== key),
                  );
                }}
                className="text-danger-500 hover:text-danger-700 p-0.5 flex-shrink-0"
                title="Hapus"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Type & Description Column */}
          <div className="flex-1 min-w-0 flex items-start">
            <div className="w-full space-y-1">
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as "regular" | "val" | "inq";
                  updateKeyType(newType, baseName);
                }}
                className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="regular">Regular</option>
                <option value="val">Val</option>
                <option value="inq">Inq</option>
              </select>
              <span className="text-xs text-gray-500 ml-2">{getKeyDescription(type)}</span>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

          {/* Products Column */}
          <div className="flex-shrink-0 w-1/3 flex items-start">
            <div className="w-full">
              <div className="flex flex-wrap gap-1.5 p-1.5 min-h-[32px] border border-gray-300 rounded focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded border border-primary-200 text-xs"
                  >
                    <span>{product}</span>
                    <button
                      onClick={() => {
                        const newProducts = products.filter((_, i) => i !== index);
                        updateFunction(key, newProducts);
                      }}
                      className="hover:bg-primary-100 rounded-full transition-colors"
                      type="button"
                      aria-label={`Remove ${product}`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes(" ")) {
                      const parts = value.split(/\s+/).filter((p) => p.trim() !== "");
                      if (parts.length > 0) {
                        const newProducts = [...products];
                        parts.forEach((part) => {
                          if (part && !newProducts.includes(part)) {
                            newProducts.push(part);
                          }
                        });
                        updateFunction(key, newProducts);
                        e.target.value = "";
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    const input = e.currentTarget;
                    const value = input.value.trim();

                    if (e.key === " " && value) {
                      e.preventDefault();
                      if (!products.includes(value)) {
                        const newProducts = [...products, value];
                        updateFunction(key, newProducts);
                      }
                      input.value = "";
                    } else if (e.key === "Backspace" && !value && products.length > 0) {
                      const newProducts = products.slice(0, -1);
                      updateFunction(key, newProducts);
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      if (value && !products.includes(value)) {
                        const newProducts = [...products, value];
                        updateFunction(key, newProducts);
                      }
                      input.value = "";
                    }
                  }}
                  className="flex-1 min-w-[80px] outline-none text-xs bg-transparent"
                  placeholder={products.length === 0 ? "Ketik, spasi untuk tambah" : ""}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Group fields by category

    const groupFields = (rules: AppRules) => {
      const groups: Record<string, Array<[string, any]>> = {
        textEditing: [], // Single group for ALL fields
      };

      Object.entries(rules).forEach(([key, value]) => {
        // Put ALL fields into the textEditing group
        groups["textEditing"].push([key, value]);
      });

      return groups;
    };

    const toggleReceiptConfig = (configIndex: number) => {
      setExpandedReceiptConfigs((prev) => {
        const newSet = new Set<number>();
        // Only expand if not already expanded (accordion behavior - one at a time)
        if (!prev.has(configIndex)) {
          newSet.add(configIndex);
        }
        return newSet;
      });
    };

    const groupedFields = appRules ? groupFields(appRules) : {};

    // Individual save functions are available for each section

    return (
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80">
          <div className="border-b border-neutral-100/80 overflow-hidden">
            <nav
              className="flex overflow-x-auto px-2 pt-2"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              aria-label="Tabs"
            >
              {infoConfig && (
                <button
                  onClick={() => setActiveTab("info_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "info_config"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Konfigurasi Pesan
                </button>
              )}
              {tiketRegexConfig && (
                <button
                  onClick={() => setActiveTab("tiket_regex")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "tiket_regex"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Regex Tiket Deposit
                </button>
              )}
              {checkProductsConfig && (
                <button
                  onClick={() => setActiveTab("check_products")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "check_products"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Cek Produk
                </button>
              )}
              {combotrxConfig && (
                <button
                  onClick={() => setActiveTab("combotrx_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "combotrx_config"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Regex Paket Combo
                </button>
              )}
              {cektagihanConfig && (
                <button
                  onClick={() => setActiveTab("cektagihan_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "cektagihan_config"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Regex Cek Produk
                </button>
              )}
              {receiptMapsConfig && (
                <button
                  onClick={() => setActiveTab("receipt_maps_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "receipt_maps_config"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Struk
                </button>
              )}

              {appRules && (
                <button
                  onClick={() => setActiveTab("textEditing")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === "textEditing"
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 border-primary-500"
                      : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 border-transparent"
                  }`}
                >
                  Edit Teks & Pesan
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {/* Info Config Section */}
            {infoConfig && activeTab === "info_config" && (
              <div className="px-4 pb-4">
                <div className="space-y-3">
                  {(() => {
                    const order =
                      infoConfigOrder.length > 0
                        ? infoConfigOrder
                        : Object.keys(infoConfig);
                    const allKeys = new Set([
                      ...order,
                      ...Object.keys(infoConfig),
                    ]);
                    return Array.from(allKeys)
                      .map((sectionKey) => {
                        if (!infoConfig[sectionKey]) return null;
                        const sectionValue = infoConfig[sectionKey];
                        if (
                          typeof sectionValue === "object" &&
                          sectionValue !== null
                        ) {
                          return (
                            <div
                              key={sectionKey}
                              className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm"
                            >
                              <h3 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                                {sectionKey.replace(/_/g, " ")}
                              </h3>
                              <div className="space-y-2">
                                {Object.entries(
                                  sectionValue as Record<string, any>,
                                ).map(([key, value]) =>
                                  renderField(key, value, updateInfoConfig),
                                )}
                              </div>
                            </div>
                          );
                        }
                        return renderField(
                          sectionKey,
                          sectionValue,
                          updateInfoConfig,
                        );
                      })
                      .filter(Boolean);
                  })()}
                </div>
              </div>
            )}

            {/* Tiket Regex Config Section */}
            {tiketRegexConfig && activeTab === "tiket_regex" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Regex Pattern:
                  </h3>
                  <ul className="text-xs text-primary-800 space-y-0.5">
                    <li>
                      <strong>Group Name Wajib:</strong>
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;amount&gt;...)</strong> - Capture group
                      untuk nominal deposit (wajib)
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;name&gt;...)</strong> - Capture group untuk
                      nama pengirim (wajib)
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;note&gt;...)</strong> - Capture group untuk
                      catatan/pesan (wajib)
                    </li>
                    <li className="mt-2">
                      <strong>Group Name Bank (opsional):</strong>
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;bank_bankname&gt;...)</strong> - Capture
                      group untuk nomor rekening bank (contoh:{" "}
                      <strong>bank_bri</strong>, <strong>bank_mandiri</strong>,{" "}
                      <strong>bank_bni</strong>, <strong>bank_bca</strong>,{" "}
                      <strong>bank_bsi</strong>)
                    </li>
                    <li className="mt-2">
                      <strong>Bank Tutup:</strong>
                    </li>
                    <li className="ml-4">
                      <strong>bank_close_bankname</strong> - Jika bank tutup,
                      gunakan regex group name dengan pola{" "}
                      <strong>bank_close_bankname</strong> (contoh:{" "}
                      <strong>bank_close_mandiri</strong>,{" "}
                      <strong>bank_close_bri</strong>)
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const order =
                      tiketRegexConfigOrder.length > 0
                        ? tiketRegexConfigOrder
                        : Object.keys(tiketRegexConfig);
                    const allKeys = new Set([
                      ...order,
                      ...Object.keys(tiketRegexConfig),
                    ]);
                    return Array.from(allKeys)
                      .map((sectionKey) => {
                        if (!tiketRegexConfig[sectionKey]) return null;
                        const sectionValue = tiketRegexConfig[sectionKey];
                        if (
                          typeof sectionValue === "object" &&
                          sectionValue !== null
                        ) {
                          return (
                            <div
                              key={sectionKey}
                              className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm"
                            >
                              <h3 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                                {sectionKey.replace(/_/g, " ")}
                              </h3>
                              <div className="space-y-2">
                                {Object.entries(
                                  sectionValue as Record<string, any>,
                                ).map(([key, value]) =>
                                  renderField(
                                    key,
                                    value,
                                    updateTiketRegexConfig,
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        }
                        return renderField(
                          sectionKey,
                          sectionValue,
                          updateTiketRegexConfig,
                        );
                      })
                      .filter(Boolean);
                  })()}
                </div>
              </div>
            )}

            {/* Check Products Config Section */}
            {checkProductsConfig && activeTab === "check_products" && (
              <div className="px-4 pb-4">
                <div className="space-y-6">
                  {/* Section Header */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-sm">
                            CP
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Konfigurasi Cek Produk
                          </h3>
                          <p className="text-sm text-gray-600">
                            Pengaturan produk untuk cek tagihan
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={addNewKey}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
                      >
                        <span>+</span>
                        <span>Tambah Key</span>
                      </button>
                    </div>

                    <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <h3 className="text-xs font-medium text-blue-900 mb-1">
                        Keterangan Tipe Cek:
                      </h3>
                      <ul className="text-xs text-primary-800 space-y-0.5">
                        <li>
                          <strong>Regular Cek</strong> - Cek produk biasa tanpa
                          prefix khusus
                        </li>
                        <li>
                          <strong>Val Cek</strong> - Cek tagihan setelah mengisi
                          nominal (contoh: Pulsa Nominal Bebas)
                        </li>
                        <li>
                          <strong>Inq Cek</strong> - Query paket tersedia (contoh:
                          Combo Sakti, XL Cuan, Only 4u)
                        </li>
                        <li>
                          <strong>%</strong> - Wildcard pattern dalam kode produk,
                          hati-hati produk lain dapat berimbas
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm">
                      <div className="mb-3 pb-2 border-b border-white/40">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                          <div className="flex-shrink-0 w-1/6">Name</div>
                          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                          <div className="flex-1 min-w-0">Type & Descriptions</div>
                          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                          <div className="flex-shrink-0 w-1/3">Products</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const order =
                            checkProductsConfigOrder.length > 0
                              ? checkProductsConfigOrder
                              : Object.keys(checkProductsConfig);
                          const allKeys = new Set([
                            ...order,
                            ...Object.keys(checkProductsConfig),
                          ]);
                          return Array.from(allKeys)
                            .map((key) => {
                              if (!checkProductsConfig[key]) return null;
                              const products = checkProductsConfig[key];
                              return renderCheckProductField(
                                key,
                                products,
                                updateCheckProductsConfig,
                              );
                            })
                            .filter(Boolean);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Combotrx Config Section */}
            {combotrxConfig && activeTab === "combotrx_config" && (
              <div className="px-4 pb-4">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-sm">
                            RC
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Regex Paket Combo
                          </h3>
                          <p className="text-sm text-gray-600">
                            Pengaturan regex untuk parsing paket combo
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={addNewCombotrxHeader}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
                      >
                        <span>+</span>
                        <span>Tambah Header</span>
                      </button>
                    </div>

                    <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <h3 className="text-xs font-medium text-blue-900 mb-1">
                        Keterangan Regex Pattern:
                      </h3>
                      <ul className="text-xs text-primary-800 space-y-0.5">
                        <li>
                          <strong>
                            #
                            (?P&lt;kode&gt;\d+)\|(?P&lt;nama&gt;[^|]+)\|(?P&lt;harga_final&gt;\d+)
                          </strong>{" "}
                          - Pattern untuk parsing kode, nama, dan harga final
                        </li>
                        <li>
                          <strong>(?P&lt;kode&gt;\d+)</strong> - Capture group untuk
                          kode produk (angka)
                        </li>
                        <li>
                          <strong>(?P&lt;nama&gt;[^|]+)</strong> - Capture group
                          untuk nama produk (bukan karakter |)
                        </li>
                        <li>
                          <strong>(?P&lt;harga_final&gt;\d+)</strong> - Capture
                          group untuk harga final (angka)
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm">
                      <div className="mb-3 pb-2 border-b border-white/40">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                          <div className="flex-shrink-0 w-1/6">Name</div>
                          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                          <div className="flex-1 min-w-0">Descriptions</div>
                          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                          <div className="flex-shrink-0 w-1/3">Pattern</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const order =
                            combotrxConfigOrder.length > 0
                              ? combotrxConfigOrder
                              : Object.keys(combotrxConfig);
                          const allKeys = new Set([
                            ...order,
                            ...Object.keys(combotrxConfig),
                          ]);
                          return Array.from(allKeys)
                            .map((header) => {
                              if (!combotrxConfig[header]) return null;
                              const headerData = combotrxConfig[header];
                              return (
                                <div
                                  key={header}
                                  className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
                                >
                                  {/* Name Column */}
                                  <div className="flex-shrink-0 w-1/6 flex items-start">
                                    <div className="flex items-center gap-1 w-full">
                                      <input
                                        type="text"
                                        value={
                                          localCombotrxHeaders[header] !== undefined
                                            ? localCombotrxHeaders[header]
                                            : header
                                        }
                                        onChange={(e) =>
                                          handleCombotrxHeaderNameChange(
                                            header,
                                            e.target.value,
                                          )
                                        }
                                        onBlur={() =>
                                          handleCombotrxHeaderNameBlur(header)
                                        }
                                        onKeyDown={(e) =>
                                          handleCombotrxHeaderNameKeyDown(header, e)
                                        }
                                        className="text-sm font-medium text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary-500 px-1 py-0.5 w-full"
                                        placeholder="Nama header"
                                      />
                                      <button
                                        onClick={() => removeCombotrxHeader(header)}
                                        className="text-danger-500 hover:text-danger-700 p-0.5 flex-shrink-0"
                                        title="Hapus"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

                                  {/* Description Column */}
                                  <div className="flex-1 min-w-0 flex items-start">
                                    <span className="text-xs text-gray-500">
                                      Regex pattern untuk parsing response paket combo
                                    </span>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

                                  {/* Pattern Column */}
                                  <div className="flex-shrink-0 w-1/3 flex items-start">
                                    <div className="w-full space-y-1">
                                      {Object.entries(
                                        headerData as Record<string, any>,
                                      ).map(([field, value]) => (
                                        <input
                                          key={field}
                                          type="text"
                                          value={value as string}
                                          onChange={(e) =>
                                            updateCombotrxConfig(
                                              header,
                                              field,
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-2 py-1 text-xs bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
                                          placeholder={`Masukkan ${field}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                            .filter(Boolean);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cektagihan Config Section */}
            {cektagihanConfig && activeTab === "cektagihan_config" && (
              <div className="px-4 pb-4">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-sm">
                            RCP
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Regex Cek Produk
                          </h3>
                          <p className="text-sm text-gray-600">
                            Pengaturan regex untuk parsing hasil cek produk
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={addNewCektagihanKey}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
                      >
                        <span>+</span>
                        <span>Tambah Key</span>
                      </button>
                    </div>

                    <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <h3 className="text-xs font-medium text-blue-900 mb-1">
                        Keterangan Regex Pattern:
                      </h3>
                      <ul className="text-xs text-primary-800 space-y-0.5">
                        <li>
                          <strong>(?P&lt;tagihan&gt;.*)</strong> - Capture group
                          untuk nominal tagihan (wajib ada)
                        </li>
                        <li>
                          <strong>(?P&lt;nama&gt;[^/]+)</strong> - Capture group
                          untuk nama pelanggan
                        </li>
                        <li>
                          <strong>(?P&lt;periode&gt;[^/]+)</strong> - Capture group
                          untuk periode tagihan
                        </li>
                        <li>
                          <strong>(?P&lt;denda&gt;[^/]+)</strong> - Capture group
                          untuk denda
                        </li>
                        <li>
                          <strong>(?P&lt;custom&gt;[^/]+)</strong> - Capture group
                          untuk custom group (bebas ditambahkan sebagai opsional)
                        </li>
                        <li>
                          Tanpa regex cek produk, cek tetap aktif. Regex cek produk
                          untuk merapihkan hasil cek.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm">
                      <div className="mb-3 pb-2 border-b border-white/40">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                          <div className="flex-shrink-0 w-1/6">Name</div>
                          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                          <div className="flex-1 min-w-0">Descriptions</div>
                          <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                          <div className="flex-shrink-0 w-1/3">Regex Pattern</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(() => {
                          const order =
                            cektagihanConfigOrder.length > 0
                              ? cektagihanConfigOrder
                              : Object.keys(cektagihanConfig);
                          const allKeys = new Set([
                            ...order,
                            ...Object.keys(cektagihanConfig),
                          ]);
                          return Array.from(allKeys)
                            .map((key) => {
                              if (!cektagihanConfig[key]) return null;
                              const value = cektagihanConfig[key];
                              return (
                                <div
                                  key={key}
                                  className="flex gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all duration-200"
                                >
                                  {/* Name Column */}
                                  <div className="flex-shrink-0 w-1/6 flex items-start">
                                    <div className="flex items-center gap-1 w-full">
                                      <input
                                        type="text"
                                        value={localCektagihanKeys[key] || key}
                                        onChange={(e) =>
                                          handleCektagihanKeyNameChange(
                                            key,
                                            e.target.value,
                                          )
                                        }
                                        onBlur={() =>
                                          handleCektagihanKeyNameBlur(key)
                                        }
                                        onKeyDown={(e) =>
                                          handleCektagihanKeyNameKeyDown(key, e)
                                        }
                                        className="text-sm font-medium text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary-500 px-1 py-0.5 w-full"
                                        placeholder="Nama key"
                                      />
                                      <button
                                        onClick={() => removeCektagihanKey(key)}
                                        className="text-danger-500 hover:text-danger-700 p-0.5 flex-shrink-0"
                                        title="Hapus"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

                                  {/* Description Column */}
                                  <div className="flex-1 min-w-0 flex items-start">
                                    <span className="text-xs text-gray-500">
                                      Regex pattern untuk parsing response cek produk
                                    </span>
                                  </div>

                                  {/* Separator */}
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />

                                  {/* Regex Pattern Column */}
                                  <div className="flex-shrink-0 w-1/3 flex items-start">
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) =>
                                        updateCektagihanConfig(key, e.target.value)
                                      }
                                      className="w-full px-2 py-1 text-xs bg-white/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
                                      placeholder="Masukkan regex pattern"
                                    />
                                  </div>
                                </div>
                              );
                            })
                            .filter(Boolean);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Maps Config Section */}
            {receiptMapsConfig && activeTab === "receipt_maps_config" && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">
                        S
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Konfigurasi Struk
                      </h3>
                      <p className="text-sm text-gray-600">
                        Pengaturan struk untuk produk tertentu. Urutan menentukan prioritas (atas = prioritas tertinggi).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={addNewReceiptConfig}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Tambah Konfigurasi</span>
                  </button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleReceiptConfigDragEnd}
                >
                  <SortableContext
                    items={receiptMapsConfig.configs.map((_, i) => `receiptConfig_${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                <div className="space-y-3">
                  {receiptMapsConfig.configs.map((config, index) => (
                    <SortableReceiptConfig
                      key={`receiptConfig_${index}`}
                      id={`receiptConfig_${index}`}
                      index={index}
                      isExpanded={expandedReceiptConfigs.has(index)}
                    >
                      {/* Collapsed Header - Always visible */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/60"
                        onClick={() => toggleReceiptConfig(index)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Priority badge */}
                          <div className="h-6 w-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-700 font-bold text-xs">
                              {index + 1}
                            </span>
                          </div>
                          <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-sm">
                              {config.name?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {config.name || `Konfigurasi ${index + 1}`}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {config.source === "pesan" ? "Global (Pesan)" : `${config.product_prefixes.length} produk`} | {config.receipt_title || "Belum dikonfigurasi"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded ${config.source === "pesan" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                              {config.source === "pesan" ? "Pesan" : "SN"}
                            </span>
                            {config.dash && (
                              <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                                Dash
                              </span>
                            )}
                            {config.source === "sn" && (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {config.product_prefixes.slice(0, 3).map((prefix, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                >
                                  {prefix}
                                </span>
                              ))}
                              {config.product_prefixes.length > 3 && (
                                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                  +{config.product_prefixes.length - 3}
                                </span>
                              )}
                            </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReceiptConfig(index);
                            }}
                            className="p-1 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded transition-colors"
                            title="Hapus konfigurasi"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {expandedReceiptConfigs.has(index) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedReceiptConfigs.has(index) && (
                        <div className="px-4 pb-4 border-t border-white/30">
                          <div className="pt-4">
                            <div className="bg-white/40 border border-white/30 rounded-xl p-4 shadow-sm">
                              <div className="mb-3 pb-2 border-b border-white/40">
                                <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                  <div className="flex-shrink-0 w-1/6">Name</div>
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                                  <div className="flex-1 min-w-0">Descriptions</div>
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                                  <div className="flex-shrink-0 w-1/3">Value</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {renderReceiptRow(
                                  index,
                                  "name",
                                  config.name,
                                  (field, value) =>
                                    updateReceiptConfig(index, field, value),
                                )}

                                {/* Source - Radio buttons for sn/pesan */}
                                <div className="flex gap-3 p-3 bg-white/60 rounded-lg border border-white/40 shadow-sm hover:bg-white/80">
                                  <div className="flex-shrink-0 w-1/6 flex items-start">
                                    <span className="text-sm font-medium text-gray-700 truncate block">
                                      Sumber Data
                                    </span>
                                  </div>
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                                  <div className="flex-1 min-w-0 flex items-start">
                                    <span className="text-xs text-gray-600 block break-words whitespace-normal">
                                      SN: parse dari field sn di tabel transaksi (per produk). Pesan: parse dari field pesan di tabel inbox (global, tidak perlu produk).
                                    </span>
                                  </div>
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                                  <div className="flex-shrink-0 w-1/3 flex items-start">
                                    <div className="flex gap-4">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`source-${index}`}
                                          value="sn"
                                          checked={config.source === "sn"}
                                          onChange={() =>
                                            updateReceiptConfig(index, "source", "sn")
                                          }
                                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">SN</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`source-${index}`}
                                          value="pesan"
                                          checked={config.source === "pesan"}
                                          onChange={() => {
                                            updateReceiptConfig(index, "source", "pesan");
                                            // Clear product_prefixes when switching to pesan
                                            updateReceiptConfig(index, "product_prefixes", []);
                                          }}
                                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">Pesan</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {renderReceiptRow(
                                  index,
                                  "highlight_key",
                                  config.highlight_key,
                                  (field, value) =>
                                    updateReceiptConfig(index, field, value),
                                )}
                                {renderReceiptRow(
                                  index,
                                  "dash",
                                  config.dash,
                                  (field, value) =>
                                    updateReceiptConfig(index, field, value),
                                )}
                                {renderReceiptRow(
                                  index,
                                  "receipt_title",
                                  config.receipt_title,
                                  (field, value) =>
                                    updateReceiptConfig(index, field, value),
                                )}
                                {renderReceiptRow(
                                  index,
                                  "regex",
                                  config.regex,
                                  (field, value) =>
                                    updateReceiptConfig(index, field, value),
                                )}
                                {renderReceiptRow(
                                  index,
                                  "info_text",
                                  config.info_text,
                                  (field, value) =>
                                    updateReceiptConfig(index, field, value),
                                )}

                                {/* Produk - Only show when source is "sn" */}
                                {config.source === "sn" && (
                                <div className="flex gap-3 p-3 bg-white/60 rounded-lg border border-white/40 shadow-sm hover:bg-white/80">
                                  <div className="flex-shrink-0 w-1/6 flex items-start">
                                    <span className="text-sm font-medium text-gray-700 truncate block">
                                      Produk
                                    </span>
                                  </div>
                                  <div className="w-px self-stretch bg-gradient-to-b from-transparent via-gray-300/50 to-transparent" />
                                  <div className="flex-1 min-w-0 flex items-start">
                                    <div className="w-full space-y-2">
                                      <span className="text-xs text-gray-600 block break-words whitespace-normal">
                                        Produk yang menggunakan konfigurasi ini. Ketik
                                        dan pisahkan dengan spasi. Gunakan '%' sebagai
                                        wildcard.
                                      </span>
                                      <div className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white">
                                        {config.product_prefixes.map(
                                          (prefix, prefixIndex) => (
                                            <div
                                              key={prefixIndex}
                                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-md border border-primary-200 text-sm"
                                            >
                                              <span>{prefix}</span>
                                              <button
                                                onClick={() =>
                                                  removeProductPrefix(
                                                    index,
                                                    prefixIndex,
                                                  )
                                                }
                                                className="ml-0.5 hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                                                type="button"
                                                aria-label={`Remove ${prefix}`}
                                              >
                                                <svg
                                                  className="w-3.5 h-3.5"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                  />
                                                </svg>
                                              </button>
                                            </div>
                                          ),
                                        )}
                                        <input
                                          type="text"
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.includes(" ")) {
                                              const parts = value
                                                .split(/\s+/)
                                                .filter((p) => p.trim() !== "");
                                              if (parts.length > 0) {
                                                const newPrefixes = [
                                                  ...config.product_prefixes,
                                                ];
                                                parts.forEach((part) => {
                                                  if (
                                                    part &&
                                                    !newPrefixes.includes(part)
                                                  ) {
                                                    newPrefixes.push(part);
                                                  }
                                                });
                                                updateReceiptConfig(
                                                  index,
                                                  "product_prefixes",
                                                  newPrefixes,
                                                );
                                                e.target.value = "";
                                              }
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            const input = e.currentTarget;
                                            const value = input.value.trim();

                                            if (e.key === " " && value) {
                                              e.preventDefault();
                                              if (
                                                !config.product_prefixes.includes(
                                                  value,
                                                )
                                              ) {
                                                const newPrefixes = [
                                                  ...config.product_prefixes,
                                                  value,
                                                ];
                                                updateReceiptConfig(
                                                  index,
                                                  "product_prefixes",
                                                  newPrefixes,
                                                );
                                              }
                                              input.value = "";
                                            } else if (
                                              e.key === "Backspace" &&
                                              value === "" &&
                                              config.product_prefixes.length > 0
                                            ) {
                                              const newPrefixes =
                                                config.product_prefixes.slice(0, -1);
                                              updateReceiptConfig(
                                                index,
                                                "product_prefixes",
                                                newPrefixes,
                                              );
                                            }
                                          }}
                                          className="flex-1 min-w-[120px] outline-none text-sm"
                                          placeholder="Ketik produk dan tekan spasi"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </SortableReceiptConfig>
                  ))}
                </div>
                  </SortableContext>
                </DndContext>

                {receiptMapsConfig.configs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Belum ada konfigurasi struk. Klik "Tambah Konfigurasi" untuk menambahkan.</p>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Sections (Text Editing) */}
            {Object.entries(groupedFields).map(([section, fields]) => {
              if (activeTab !== section) return null;

              // Sort by ascending alphanumeric order by key for textEditing section
              let orderedFields = fields;
              if (section === "textEditing") {
                orderedFields = [...fields].sort((a, b) =>
                  String(a[0]).localeCompare(String(b[0]), undefined, {
                    numeric: true,
                    sensitivity: "base",
                  }),
                );
              }

              const filteredFields = orderedFields.filter(([key]) =>
                shouldShowField(key),
              );

              return (
                <div key={section} className="px-4 pb-4">
                  {/* Search and Filter - only for textEditing section */}
                  {section === "textEditing" && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Cari pengaturan teks..."
                              value={filterInputValue}
                              onChange={(e) =>
                                setFilterInputValue(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const filterValue = filterInputValue.trim();
                                  if (!filterValue) {
                                    setSearchTerm("");
                                    setMatchedKeys(new Set());
                                    return;
                                  }

                                  // Calculate which keys match the filter
                                  const searchLower = filterValue.toLowerCase();
                                  const newMatchedKeys = new Set<string>();

                                  const textEditingFields =
                                    groupedFields.textEditing || [];
                                  textEditingFields.forEach(([key, value]) => {
                                    if (EXCLUDED_KEYS.includes(key)) return;

                                    if (
                                      key.toLowerCase().includes(searchLower) ||
                                      getFieldLabel(key)
                                        .toLowerCase()
                                        .includes(searchLower) ||
                                      String(value)
                                        .toLowerCase()
                                        .includes(searchLower)
                                    ) {
                                      newMatchedKeys.add(key);
                                    }
                                  });

                                  setMatchedKeys(newMatchedKeys);
                                  setSearchTerm(filterValue);
                                }
                              }}
                              className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const filterValue = filterInputValue.trim();
                              if (!filterValue) {
                                setSearchTerm("");
                                setMatchedKeys(new Set());
                                return;
                              }

                              // Calculate which keys match the filter
                              const searchLower = filterValue.toLowerCase();
                              const newMatchedKeys = new Set<string>();

                              const textEditingFields =
                                groupedFields.textEditing || [];
                              textEditingFields.forEach(([key, value]) => {
                                const excludedKeys = [
                                  "verificationFeature",
                                  "exchangePoinToSaldo",
                                  "permissionIntroFeatureEnabled",
                                  "blockNonVerifiedMLM",
                                  "exchangePoinToGift",
                                  "blockNonVerifiedTransfer",
                                  "biometrictTrxFeature",
                                  "editProfileFeature",
                                  "maximumVoucherActivation",
                                  "minimumProductPriceToDisplay",
                                  "cs_email",
                                  "cs_whatsapp",
                                  "cs_phone",
                                  "maxWelcomePosterPerDay",
                                  "newUserMarkup",
                                  "newUserGroup",
                                  "newUserUpline",
                                  "blockNonVerifiedTransfer",
                                  "blockNonVerifiedMLM",
                                  "maxTransaction",
                                  "maxTransactionsTotal",
                                  "whatsappHelp",
                                  "whatsappHelpFormat",
                                  "liveChatHelpFormat",
                                ];

                                if (excludedKeys.includes(key)) return;

                                if (
                                  key.toLowerCase().includes(searchLower) ||
                                  getFieldLabel(key)
                                    .toLowerCase()
                                    .includes(searchLower) ||
                                  String(value)
                                    .toLowerCase()
                                    .includes(searchLower)
                                ) {
                                  newMatchedKeys.add(key);
                                }
                              });

                              setMatchedKeys(newMatchedKeys);
                              setSearchTerm(filterValue);
                            }}
                            className="px-4 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                          >
                            Filter
                          </button>
                          {searchTerm && (
                            <button
                              onClick={() => {
                                setFilterInputValue("");
                                setSearchTerm("");
                                setMatchedKeys(new Set());
                              }}
                              className="px-4 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredFields.length > 0 ? (
                    <div className="space-y-3">
                      {filteredFields.map(([key, value]) =>
                        renderField(key, value),
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada hasil yang cocok dengan pencarian Anda.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Asset Picker Modal for Bantuan Topic Card Icons */}
        {showBantuanAssetPicker && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Pilih atau Upload Asset
                </h3>
                <button
                  onClick={() => {
                    setShowBantuanAssetPicker(false);
                    setCurrentTopicCardIconIndex(null);
                  }}
                  className="p-1 text-gray-600 hover:text-gray-800 rounded"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <AssetsManager
                  authSeed={authSeed || localStorage.getItem("adminAuthSeed") || ""}
                  refreshTrigger={bantuanAssetsRefreshTrigger}
                  onAssetSelect={handleBantuanAssetSelect}
                />
                <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-sm text-primary-800 mb-2">
                    <strong>Petunjuk:</strong> Klik langsung pada gambar untuk
                    memilih dan menerapkan ke field Icon URL secara otomatis.
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

SystemSettings.displayName = "SystemSettings";

export default SystemSettings;
