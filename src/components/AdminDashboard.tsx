import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Settings,
  User,
  BarChart3,
  Shield,
  Activity,
  LogOut,
  Menu,
  Home,
  Palette,
  Megaphone,
  Upload,
  Download,
  Store,
  MessageSquare,
  Tag,
  CreditCard,
  FileCheck,
  FileText,
  Terminal,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  Save,
  ArrowLeft,
  FilePlus,
} from "lucide-react";
import { DynamicScreenConfig } from "../types";
import { SAMPLE_CONFIG } from "../data/sampleConfig";
import EditorLayout, { EditorLayoutRef } from "./EditorLayout";
import { getApiUrl, apiRequest, X_TOKEN_VALUE, handleUnauthorizedResponse } from "../config/api";
import MemberManagement, { MemberManagementRef } from "./MemberManagement";
import TransactionManagement, {
  TransactionManagementRef,
} from "./TransactionManagement";
import AnalyticsDashboard, {
  AnalyticsDashboardRef,
} from "./AnalyticsDashboard";
import SystemLogs, { SystemLogsRef } from "./SystemLogs";
import SystemSettings, { SystemSettingsRef } from "./SystemSettings";
import PrivacyPolicyEditor from "./PrivacyPolicyEditor";
import FeedbackViewer, { FeedbackViewerRef } from "./FeedbackViewer";
import SecurityManagement from "./SecurityManagement";
import HadiahManagement, { HadiahManagementRef } from "./HadiahManagement";
import PromoManagement, { PromoManagementRef } from "./PromoManagement";
import BroadcastCenter, { BroadcastCenterRef } from "./BroadcastCenter";
import AssetsManager from "./AssetsManager";
import MarkdownEditor, { MarkdownEditorRef } from "./MarkdownEditor";

import ChatManagement, { ChatManagementRef } from "./ChatManagement";
import SessionManager, { SessionManagerRef } from "./SessionManager";
import { formatJSONForExport, formatJSONForAPI } from "../utils/jsonFormatter";
import { preloadMembers } from "../utils/memberCache";
import { preloadTransactions } from "../utils/transactionCache";
import { preloadBroadcastClasses } from "../utils/broadcastCache";
import { preloadChatConversations } from "../utils/chatCache";
import { preloadAnalytics } from "../utils/analyticsCache";
import { preloadSessions } from "../utils/sessionCache";
import { preloadSystemSettings } from "../utils/systemSettingsCache";
import { preloadHadiahConfig } from "../utils/hadiahCache";
import { preloadPromoConfig } from "../utils/promoCache";
import { preloadAssets } from "../utils/assetsCache";
import { preloadMarkdownFiles } from "../utils/markdownCache";
import { preloadPrivacyPolicy } from "../utils/privacyPolicyCache";
import { preloadFeedback } from "../utils/feedbackCache";
import { preloadSystemLogs } from "../utils/systemLogsCache";
import { preloadSecurityManagement } from "../utils/securityManagementCache";
import { useGlobalChatWebSocket } from "../hooks/useGlobalChatWebSocket";
import { getCachedConversations } from "../utils/chatCache";
import {
  getCachedHealthCheck,
  measureHealthCheckResponseTime,
} from "../utils/healthCheckCache";
import { useToast } from "./Toast";
import { AlertDialog } from "../styles";
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  THEME_COLOR_VERY_LIGHT,
  THEME_COLOR_LIGHT_VERY_LIGHT,
  SIDEBAR_BG_FROM,
  SIDEBAR_BG_TO,
  withOpacity,
} from "../utils/themeColors";

interface AdminDashboardProps {
  authSeed: string;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  component?: React.ReactNode;
}

//

interface CurrentAdminInfo {
  id: string;
  name: string;
  admin_type: string;
  is_super_admin: boolean;
  google_photo_url?: string;
}

interface MenuDistro {
  filename: string;
  name: string;
  path: string;
}

interface DistrosResponse {
  distros: MenuDistro[];
  success: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  authSeed,
  onLogout,
}) => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const cached = localStorage.getItem("adminSidebarOpen");
    return cached !== null ? cached === "true" : true;
  });
  const [isMobile, setIsMobile] = useState(false);

  // Cache sidebar state in localStorage
  useEffect(() => {
    localStorage.setItem("adminSidebarOpen", String(sidebarOpen));
  }, [sidebarOpen]);
  const [gridCols, setGridCols] = useState(
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  );
  const statsGridRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<DynamicScreenConfig>(SAMPLE_CONFIG);
  const [selectedScreen, setSelectedScreen] = useState<string>("home");
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentAdminInfo, setCurrentAdminInfo] =
    useState<CurrentAdminInfo | null>(null);

  // Menu selection state
  const [availableMenus, setAvailableMenus] = useState<MenuDistro[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>("home_screen");
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  // Upload functionality
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assets refresh trigger
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);

  // Unified save state for security management
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const securityManagementRef = useRef<any>(null);

  // Unified save state for system settings
  const [isSavingSystemSettings, setIsSavingSystemSettings] = useState(false);
  const systemSettingsRef = useRef<SystemSettingsRef>(null);

  // Editor layout ref for bantuan config save
  const editorLayoutRef = useRef<EditorLayoutRef>(null);

  // Unified save state for hadiah management
  const [isSavingHadiah, setIsSavingHadiah] = useState(false);
  const hadiahManagementRef = useRef<HadiahManagementRef>(null);

  // Unified save state for promo management
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const promoManagementRef = useRef<PromoManagementRef>(null);

  // Broadcast center ref
  const broadcastCenterRef = useRef<BroadcastCenterRef>(null);
  const [canSendBroadcast, setCanSendBroadcast] = useState(false);
  const [isBroadcastSending, setIsBroadcastSending] = useState(false);

  // Member management ref
  const memberManagementRef = useRef<MemberManagementRef>(null);
  const [memberStats, setMemberStats] = useState<{
    total: number;
    loaded: number;
  } | null>(null);

  // Transaction management ref
  const transactionManagementRef = useRef<TransactionManagementRef>(null);
  const [transactionAnalytics, setTransactionAnalytics] = useState<{
    total_today: number;
    success_count: number;
    process_count: number;
    failed_count: number;
  } | null>(null);

  // Chat management ref
  const chatManagementRef = useRef<ChatManagementRef>(null);
  const [chatConversation, setChatConversation] = useState<{
    user_name: string;
    user_id: string;
    status: string;
    resolved: number;
  } | null>(null);
  const [chatConnectionStatus, setChatConnectionStatus] =
    useState<string>("disconnected");
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0);

  // Global chat WebSocket for notifications even when chat screen is not active
  const handleChatConversationUpdate = (conversations: any[]) => {
    // Update unread count from conversations
    const unreadCount = conversations.reduce(
      (total, conv) => total + conv.unread_count_admin,
      0,
    );
    setChatUnreadCount(unreadCount);
  };

  const handleChatUnreadCountChange = (count: number) => {
    setChatUnreadCount(count);
  };

  const globalChatWebSocket = useGlobalChatWebSocket(
    authSeed,
    handleChatUnreadCountChange,
    handleChatConversationUpdate,
  );

  // Analytics dashboard ref
  const analyticsDashboardRef = useRef<AnalyticsDashboardRef>(null);

  // Dashboard overview ref
  const dashboardOverviewRef = useRef<{ refresh: () => void } | null>(null);

  // Session manager ref
  const sessionManagerRef = useRef<SessionManagerRef>(null);
  const [sessionStats, setSessionStats] = useState<{
    total: number;
    displayed: number;
  } | null>(null);

  // Hadiah management stats
  const [hadiahStats, setHadiahStats] = useState<{ total: number } | null>(
    null,
  );

  // Promo management stats
  const [promoStats, setPromoStats] = useState<{ total: number } | null>(null);

  // Feedback viewer ref
  const feedbackViewerRef = useRef<FeedbackViewerRef>(null);
  const [feedbackStats, setFeedbackStats] = useState<{ total: number } | null>(
    null,
  );

  // System logs ref
  const systemLogsRef = useRef<SystemLogsRef>(null);
  const [systemLogsStats, setSystemLogsStats] = useState<{
    total: number;
  } | null>(null);

  // Markdown editor ref
  const markdownEditorRef = useRef<MarkdownEditorRef>(null);
  const [markdownCurrentFile, setMarkdownCurrentFile] = useState<{
    filename: string;
  } | null>(null);

  // Chat license status
  const [chatLicenseStatus, setChatLicenseStatus] = useState<{
    is_licensed: boolean;
    server_name: string;
  } | null>(null);
  const [chatLicenseLoading, setChatLicenseLoading] = useState(true);

  // Alert dialog state for JSON import
  const [showJsonInvalidAlert, setShowJsonInvalidAlert] = useState(false);

  // Handle broadcast state changes
  const handleBroadcastStateChange = (canSend: boolean, isSending: boolean) => {
    setCanSendBroadcast(canSend);
    setIsBroadcastSending(isSending);
  };

  // Load chat license status from existing license status API
  const loadChatLicenseStatus = async () => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        setChatLicenseLoading(false);
        return;
      }

      const apiUrl = await getApiUrl("/admin/license-status");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      if (handleUnauthorizedResponse(response)) return;
      const data = await response.json();
      if (data.success && data.license_status) {
        setChatLicenseStatus({
          is_licensed: data.license_status.chat_management_licensed || false,
          server_name: "server",
        });
      }
    } catch (error) {
    } finally {
      setChatLicenseLoading(false);
    }
  };

  useEffect(() => {
    // Load critical data first (parallel)
    Promise.all([
      loadConfigFromBackend(),
      fetchCurrentAdminInfo(),
      loadAvailableMenus(),
      loadChatLicenseStatus(),
    ]).catch((error) => {
    });

    // Lazy load other data only when section is accessed
    // This reduces initial load time and prevents overwhelming the backend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically refresh license status to check for real-time changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadChatLicenseStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Re-render when license status changes
  useEffect(() => {
    // This will trigger a re-render when chatLicenseStatus changes
  }, [chatLicenseStatus]);

  // Lazy load data when section is accessed
  useEffect(() => {
    if (activeSection === "users") {
      preloadMembers(authSeed, {
        searchTerm: "",
        statusFilter: "all",
        levelFilter: "",
        verificationFilter: "all",
      }).catch(() => {});
    } else {
      setMemberStats(null);
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "transactions") {
      preloadTransactions(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "notifications") {
      preloadBroadcastClasses(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "chat") {
      preloadChatConversations(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "analytics") {
      preloadAnalytics(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "session-manager") {
      preloadSessions(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "system") {
      preloadSystemSettings(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "hadiah") {
      preloadHadiahConfig(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "promo") {
      preloadPromoConfig(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "assets") {
      preloadAssets(authSeed, { page: 1, searchTerm: "" }).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "markdown-editor") {
      preloadMarkdownFiles(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "privacy-policy") {
      preloadPrivacyPolicy(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "feedback-viewer") {
      preloadFeedback(authSeed, { page: 1, searchTerm: "" }).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "logs") {
      preloadSystemLogs(authSeed, {
        searchTerm: "",
        actionType: "",
        adminUser: "",
        dateFrom: "",
        dateTo: "",
      }).catch(() => {});
    }
  }, [activeSection, authSeed]);

  useEffect(() => {
    if (activeSection === "security") {
      preloadSecurityManagement(authSeed).catch(() => {});
    }
  }, [activeSection, authSeed]);

  // Reset member stats when switching away from users section
  useEffect(() => {
    if (activeSection !== "users") {
      setMemberStats(null);
    }
  }, [activeSection]);

  // Reset transaction analytics when switching away from transactions section
  useEffect(() => {
    if (activeSection !== "transactions") {
      setTransactionAnalytics(null);
    }
  }, [activeSection]);

  // Reset chat conversation when switching away from chat section
  useEffect(() => {
    if (activeSection !== "chat") {
      setChatConversation(null);
      setChatConnectionStatus("disconnected");
    }
  }, [activeSection]);

  // Initialize unread count from cache
  useEffect(() => {
    const cached = getCachedConversations();
    if (cached) {
      const unreadCount = cached.reduce(
        (total, conv) => total + conv.unread_count_admin,
        0,
      );
      setChatUnreadCount(unreadCount);
    }
  }, []);

  // Track chat unread count for badge (fallback to ref if global WebSocket not available)
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatManagementRef.current) {
        const refCount = chatManagementRef.current.unreadCount || 0;
        // Only update if it's different to avoid unnecessary re-renders
        if (refCount !== chatUnreadCount) {
          setChatUnreadCount(refCount);
        }
      }
    }, 2000); // Check every 2 seconds as fallback

    return () => clearInterval(interval);
  }, [chatUnreadCount]);

  // Reset session stats when switching away from session-manager section
  useEffect(() => {
    if (activeSection !== "session-manager") {
      setSessionStats(null);
    }
  }, [activeSection]);

  // Reset hadiah stats when switching away from hadiah section
  useEffect(() => {
    if (activeSection !== "hadiah") {
      setHadiahStats(null);
    }
  }, [activeSection]);

  // Reset promo stats when switching away from promo section
  useEffect(() => {
    if (activeSection !== "promo") {
      setPromoStats(null);
    }
  }, [activeSection]);

  // Reset feedback stats when switching away from feedback-viewer section
  useEffect(() => {
    if (activeSection !== "feedback-viewer") {
      setFeedbackStats(null);
    }
  }, [activeSection]);

  // Reset system logs stats when switching away from logs section
  useEffect(() => {
    if (activeSection !== "logs") {
      setSystemLogsStats(null);
    }
  }, [activeSection]);

  // Track markdown editor current file
  useEffect(() => {
    if (activeSection === "markdown-editor" && markdownEditorRef.current) {
      const interval = setInterval(() => {
        const currentFile = markdownEditorRef.current?.currentFile;
        setMarkdownCurrentFile(
          currentFile ? { filename: currentFile.filename } : null,
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setMarkdownCurrentFile(null);
    }
  }, [activeSection]);

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Auto-hide sidebar on mobile
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dynamic grid detection based on available space
  useEffect(() => {
    const updateGridCols = () => {
      const width = window.innerWidth;
      const sidebarWidth = sidebarOpen ? 256 : 64; // w-64 or w-16
      const availableWidth = width - sidebarWidth - 64; // Account for padding
      const cardMinWidth = 320; // Minimum width for a card to display properly without overflow

      if (width < 640) {
        setGridCols("grid-cols-1");
      } else if (width < 1024) {
        setGridCols("grid-cols-1 sm:grid-cols-2");
      } else if (availableWidth < cardMinWidth * 4 + 96) {
        // 4 cards + gaps (24px * 4)
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      } else if (availableWidth < cardMinWidth * 3 + 72) {
        // 3 cards + gaps
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      } else {
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4");
      }
    };

    // Add a small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateGridCols, 100);
    window.addEventListener("resize", updateGridCols);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateGridCols);
    };
  }, [sidebarOpen]);

  // Additional overflow detection after grid is rendered
  useEffect(() => {
    const checkForOverflow = () => {
      if (!statsGridRef.current) return;

      const cards = statsGridRef.current.querySelectorAll("[data-card]");
      let hasOverflow = false;

      cards.forEach((card) => {
        const textElements = card.querySelectorAll("p");
        textElements.forEach((textEl) => {
          if (textEl.scrollWidth > textEl.clientWidth) {
            hasOverflow = true;
          }
        });
      });

      if (hasOverflow && gridCols.includes("grid-cols-4")) {
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      }
    };

    const timeoutId = setTimeout(checkForOverflow, 300);
    return () => clearTimeout(timeoutId);
  }, [gridCols]);

  // Force 2 columns for very long text content
  useEffect(() => {
    const forceTwoColumns = () => {
      const width = window.innerWidth;
      const sidebarWidth = sidebarOpen ? 256 : 64;
      const availableWidth = width - sidebarWidth - 64;

      // Force 2 columns if available width is less than 1400px (4 * 320px + gaps)
      if (availableWidth < 1400 && gridCols.includes("grid-cols-4")) {
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      }
    };

    const timeoutId = setTimeout(forceTwoColumns, 100);
    return () => clearTimeout(timeoutId);
  }, [sidebarOpen, gridCols]);

  const fetchCurrentAdminInfo = async () => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl("/current-admin-info");
      const response = await fetch(apiUrl, {
        headers: {
          "X-Token": X_TOKEN_VALUE,
          "Session-Key": sessionKey,
          "Auth-Seed": authSeed,
        },
      });

      if (handleUnauthorizedResponse(response)) return;
      const data: CurrentAdminInfo = await response.json();

      if (response.ok) {
        // Fetch actual name from /infouser endpoint
        try {
          const infoUserUrl = await getApiUrl("/infouser");
          const infoUserResponse = await fetch(infoUserUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Token": X_TOKEN_VALUE,
              "Session-Key": sessionKey,
              "Auth-Seed": authSeed,
            },
          });

          if (handleUnauthorizedResponse(infoUserResponse)) return;
          const infoUserData = await infoUserResponse.json();
          if (infoUserData.success && infoUserData.user_info?.nama) {
            data.name = infoUserData.user_info.nama;
          }
        } catch (infoError) {
        }

        // Fetch Google account status for admin's avatar
        try {
          const googleAccountUrl = await getApiUrl("/google-account/status");
          const googleAccountResponse = await fetch(googleAccountUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Token": X_TOKEN_VALUE,
              "Session-Key": sessionKey,
              "Auth-Seed": authSeed,
            },
          });

          if (googleAccountResponse.ok) {
            const googleData = await googleAccountResponse.json();
            if (googleData.success && googleData.linked && googleData.google_photo_url) {
              data.google_photo_url = googleData.google_photo_url;
            }
          }
        } catch (googleError) {
        }

        setCurrentAdminInfo(data);
      } else {
      }
    } catch (error) {
    }
  };

  const loadAvailableMenus = async () => {
    setIsLoadingMenus(true);
    try {
      const apiUrl = await getApiUrl("/homescreen/distros");
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
      });

      if (handleUnauthorizedResponse(response)) return;
      const data: DistrosResponse = await response.json();

      if (data.success && data.distros) {
        // Add main home screen as the first option
        const mainHomeScreen: MenuDistro = {
          filename: "main_home_screen.json",
          name: "Aplikasi Utama",
          path: "main_home_screen.json",
        };

        const menusWithMain = [mainHomeScreen, ...data.distros];
        setAvailableMenus(menusWithMain);
        setSelectedMenu("Aplikasi Utama");
      } else {
        // Even if API fails, show main home screen option
        const mainHomeScreen: MenuDistro = {
          filename: "main_home_screen.json",
          name: "Aplikasi Utama",
          path: "main_home_screen.json",
        };
        setAvailableMenus([mainHomeScreen]);
        setSelectedMenu("Aplikasi Utama");
      }
    } catch (err) {
      // Even on error, show main home screen option
      const mainHomeScreen: MenuDistro = {
        filename: "main_home_screen.json",
        name: "Aplikasi Utama",
        path: "main_home_screen.json",
      };
      setAvailableMenus([mainHomeScreen]);
      setSelectedMenu("Aplikasi Utama");
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const loadConfigFromBackend = async (menuName?: string) => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      let apiUrl;

      if (menuName && menuName !== "Aplikasi Utama") {
        // Load specific distro menu
        apiUrl = await getApiUrl(`/homescreen/${menuName}`);
      } else {
        // Load main home screen
        apiUrl = await getApiUrl("/homescreen");
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
      });

      const data = await response.json();

      // Both homescreen endpoints return raw JSON config
      setConfig(data);
      if (data.screens && Object.keys(data.screens).length > 0) {
        setSelectedScreen(Object.keys(data.screens)[0]);
      }
    } catch (err) {
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);

        // Ensure all widgets have unique instanceId values
        const processedConfig = { ...importedConfig };
        if (processedConfig.screens) {
          Object.keys(processedConfig.screens).forEach((screenName) => {
            const screen = processedConfig.screens[screenName];
            if (screen.content) {
              screen.content.forEach((widget: any, index: number) => {
                // Generate unique instanceId if missing or duplicate
                if (
                  !widget.instanceId ||
                  widget.instanceId === "banner_slider_1"
                ) {
                  widget.instanceId = `${widget.id}_${Date.now()}_${index}`;
                }
              });
            }
          });
        }

        setConfig(processedConfig);
      } catch (error) {
        setShowJsonInvalidAlert(true);
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const dataStr = formatJSONForExport(config);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menu_config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      let apiUrl;
      let requestBody = {};
      let method = "POST";

      if (selectedMenu && selectedMenu !== "Aplikasi Utama") {
        // Save specific distro menu - send raw config
        apiUrl = await getApiUrl(`/homescreen/save/${selectedMenu}`);
        requestBody = config;
        method = "PUT";
      } else {
        // Save main home screen - wrap in config field
        apiUrl = await getApiUrl("/config/publish");
        requestBody = { config: config };
        method = "POST";
      }

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
          "Session-Key": sessionKey,
          "Auth-Seed": authSeed,
        },
        body: formatJSONForAPI(requestBody),
      });

      const data: PublishResponse = await response.json();

      if (data.success) {
        // Determine distro suffix for app_rules keys
        const getDistroSuffix = (): string => {
          if (!selectedMenu || selectedMenu === "Aplikasi Utama") {
            return "";
          }
          // Remove file extension if present
          return selectedMenu.replace(/\.json$/, "");
        };
        const distroSuffix = getDistroSuffix();

        // Get the dynamic keys from globalTheming (they may have distro suffix)
        const markdownKey = `loginMarkdownUrl${distroSuffix}`;
        const backgroundKey = `loginBackgroundImageUrl${distroSuffix}`;

        // Login text content keys with distro suffix
        const loginSubtitleKey = `loginSubtitle${distroSuffix}`;
        const loginDescriptionKey = `loginDescription${distroSuffix}`;

        // Text color keys with distro suffix
        const logoTextColorKey = `loginLogoTextColor${distroSuffix}`;
        const titleColorKey = `loginTitleColor${distroSuffix}`;
        const subtitleColorKey = `loginSubtitleColor${distroSuffix}`;
        const paragraphColorKey = `loginParagraphColor${distroSuffix}`;

        // Markdown color keys with distro suffix
        const mdH1ColorKey = `loginMarkdownH1Color${distroSuffix}`;
        const mdH2ColorKey = `loginMarkdownH2Color${distroSuffix}`;
        const mdH3ColorKey = `loginMarkdownH3Color${distroSuffix}`;
        const mdH4ColorKey = `loginMarkdownH4Color${distroSuffix}`;
        const mdH5ColorKey = `loginMarkdownH5Color${distroSuffix}`;
        const mdH6ColorKey = `loginMarkdownH6Color${distroSuffix}`;
        const mdParagraphColorKey = `loginMarkdownParagraphColor${distroSuffix}`;
        const mdBoldColorKey = `loginMarkdownBoldColor${distroSuffix}`;

        // Customer service button keys with distro suffix
        const csButtonEnabledKey = `loginCustomerServiceButtonEnabled${distroSuffix}`;
        const csButtonPositionKey = `loginCustomerServiceButtonPosition${distroSuffix}`;

        const configAny = config.globalTheming as
          | Record<string, string | undefined>
          | undefined;
        const markdownValue = configAny?.[markdownKey];
        const backgroundValue = configAny?.[backgroundKey];

        // Get login text content values
        const loginSubtitleValue = configAny?.[loginSubtitleKey];
        const loginDescriptionValue = configAny?.[loginDescriptionKey];

        // Get text color values
        const logoTextColorValue = configAny?.[logoTextColorKey];
        const titleColorValue = configAny?.[titleColorKey];
        const subtitleColorValue = configAny?.[subtitleColorKey];
        const paragraphColorValue = configAny?.[paragraphColorKey];

        // Get markdown color values
        const mdH1ColorValue = configAny?.[mdH1ColorKey];
        const mdH2ColorValue = configAny?.[mdH2ColorKey];
        const mdH3ColorValue = configAny?.[mdH3ColorKey];
        const mdH4ColorValue = configAny?.[mdH4ColorKey];
        const mdH5ColorValue = configAny?.[mdH5ColorKey];
        const mdH6ColorValue = configAny?.[mdH6ColorKey];
        const mdParagraphColorValue = configAny?.[mdParagraphColorKey];
        const mdBoldColorValue = configAny?.[mdBoldColorKey];

        // Get customer service button values
        const configAnyBool = config.globalTheming as
          | Record<string, string | boolean | undefined>
          | undefined;
        const csButtonEnabledValue = configAnyBool?.[csButtonEnabledKey];
        const csButtonPositionValue = configAny?.[csButtonPositionKey];

        // Check if any login customization value is set
        const hasLoginCustomization =
          markdownValue !== undefined ||
          backgroundValue !== undefined ||
          loginSubtitleValue !== undefined ||
          loginDescriptionValue !== undefined ||
          logoTextColorValue !== undefined ||
          titleColorValue !== undefined ||
          subtitleColorValue !== undefined ||
          paragraphColorValue !== undefined ||
          mdH1ColorValue !== undefined ||
          mdH2ColorValue !== undefined ||
          mdH3ColorValue !== undefined ||
          mdH4ColorValue !== undefined ||
          mdH5ColorValue !== undefined ||
          mdH6ColorValue !== undefined ||
          mdParagraphColorValue !== undefined ||
          mdBoldColorValue !== undefined ||
          csButtonEnabledValue !== undefined ||
          csButtonPositionValue !== undefined;

        // Sync login customization settings to app_rules so login screen can access them without auth
        if (hasLoginCustomization) {
          try {
            // First fetch existing app_rules to merge with
            const fetchRulesUrl = await getApiUrl("/admin/app-rules");
            const existingRulesResponse = await fetch(fetchRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                session_key: sessionKey,
                auth_seed: authSeed,
              }),
            });
            const existingRulesData = await existingRulesResponse.json();
            const existingRules = existingRulesData.success
              ? existingRulesData.rules || {}
              : {};

            // Merge login customization settings with existing rules (using distro-suffixed keys)
            const mergedRules: Record<string, string> = {
              ...existingRules,
            };

            // Only add keys that have values (don't overwrite with empty strings unless explicitly set)
            if (markdownValue !== undefined)
              mergedRules[markdownKey] = markdownValue || "";
            if (backgroundValue !== undefined)
              mergedRules[backgroundKey] = backgroundValue || "";
            // Login text content
            if (loginSubtitleValue !== undefined)
              mergedRules[loginSubtitleKey] = loginSubtitleValue || "";
            if (loginDescriptionValue !== undefined)
              mergedRules[loginDescriptionKey] = loginDescriptionValue || "";
            if (logoTextColorValue !== undefined)
              mergedRules[logoTextColorKey] = logoTextColorValue || "";
            if (titleColorValue !== undefined)
              mergedRules[titleColorKey] = titleColorValue || "";
            if (subtitleColorValue !== undefined)
              mergedRules[subtitleColorKey] = subtitleColorValue || "";
            if (paragraphColorValue !== undefined)
              mergedRules[paragraphColorKey] = paragraphColorValue || "";
            if (mdH1ColorValue !== undefined)
              mergedRules[mdH1ColorKey] = mdH1ColorValue || "";
            if (mdH2ColorValue !== undefined)
              mergedRules[mdH2ColorKey] = mdH2ColorValue || "";
            if (mdH3ColorValue !== undefined)
              mergedRules[mdH3ColorKey] = mdH3ColorValue || "";
            if (mdH4ColorValue !== undefined)
              mergedRules[mdH4ColorKey] = mdH4ColorValue || "";
            if (mdH5ColorValue !== undefined)
              mergedRules[mdH5ColorKey] = mdH5ColorValue || "";
            if (mdH6ColorValue !== undefined)
              mergedRules[mdH6ColorKey] = mdH6ColorValue || "";
            if (mdParagraphColorValue !== undefined)
              mergedRules[mdParagraphColorKey] = mdParagraphColorValue || "";
            if (mdBoldColorValue !== undefined)
              mergedRules[mdBoldColorKey] = mdBoldColorValue || "";
            // Customer service button settings (convert boolean to string for storage)
            if (csButtonEnabledValue !== undefined)
              mergedRules[csButtonEnabledKey] = String(csButtonEnabledValue);
            if (csButtonPositionValue !== undefined)
              mergedRules[csButtonPositionKey] = csButtonPositionValue || "";

            const appRulesUrl = await getApiUrl("/admin/app-rules/save");
            await fetch(appRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                rules: mergedRules,
              }),
            });
          } catch (syncErr) {

          }
        }

        // Menu Deposit customization keys with distro suffix
        const menuDepositShowBalanceCardKey = `menuDepositShowBalanceCard${distroSuffix}`;
        const menuDepositTermsMarkdownUrlKey = `menuDepositTermsMarkdownUrl${distroSuffix}`;
        const menuDepositTermsTextKey = `menuDepositTermsText${distroSuffix}`;
        const menuDepositNominalsKey = `menuDepositNominals${distroSuffix}`;

        const menuDepositShowBalanceCardValue = configAny?.[menuDepositShowBalanceCardKey];
        const menuDepositTermsMarkdownUrlValue = configAny?.[menuDepositTermsMarkdownUrlKey];
        const menuDepositTermsTextValue = configAny?.[menuDepositTermsTextKey];
        const menuDepositNominalsValue = configAny?.[menuDepositNominalsKey];

        const hasMenuDepositCustomization =
          menuDepositShowBalanceCardValue !== undefined ||
          menuDepositTermsMarkdownUrlValue !== undefined ||
          menuDepositTermsTextValue !== undefined ||
          menuDepositNominalsValue !== undefined;

        // Sync menu deposit customization settings to app_rules
        if (hasMenuDepositCustomization) {
          try {
            const fetchRulesUrl = await getApiUrl("/admin/app-rules");
            const existingRulesResponse = await fetch(fetchRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                session_key: sessionKey,
                auth_seed: authSeed,
              }),
            });
            const existingRulesData = await existingRulesResponse.json();
            const existingRules = existingRulesData.success
              ? existingRulesData.rules || {}
              : {};

            const mergedRules: Record<string, string> = {
              ...existingRules,
            };

            if (menuDepositShowBalanceCardValue !== undefined)
              mergedRules[menuDepositShowBalanceCardKey] = String(menuDepositShowBalanceCardValue);

            // For terms URL: if empty, delete the key; otherwise set the value
            if (menuDepositTermsMarkdownUrlValue !== undefined) {
              if (menuDepositTermsMarkdownUrlValue === '' || !menuDepositTermsMarkdownUrlValue) {
                delete mergedRules[menuDepositTermsMarkdownUrlKey];
              } else {
                mergedRules[menuDepositTermsMarkdownUrlKey] = menuDepositTermsMarkdownUrlValue;
              }
            }

            // For terms text: if empty, delete the key; otherwise set the value
            if (menuDepositTermsTextValue !== undefined) {
              if (menuDepositTermsTextValue === '' || !menuDepositTermsTextValue) {
                delete mergedRules[menuDepositTermsTextKey];
              } else {
                mergedRules[menuDepositTermsTextKey] = menuDepositTermsTextValue;
              }
            }

            // For nominals: if empty, delete the key; otherwise set the value
            if (menuDepositNominalsValue !== undefined) {
              if (menuDepositNominalsValue === '' || !menuDepositNominalsValue) {
                delete mergedRules[menuDepositNominalsKey];
              } else {
                mergedRules[menuDepositNominalsKey] = menuDepositNominalsValue;
              }
            }

            const appRulesUrl = await getApiUrl("/admin/app-rules/save");
            await fetch(appRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                rules: mergedRules,
              }),
            });
          } catch (syncErr) {

          }
        }

        // Profile customization keys with distro suffix
        const profileAvatarVariantKey = `profileAvatarVariant${distroSuffix}`;
        const profileAvatarIconKey = `profileAvatarIcon${distroSuffix}`;
        const profileInfoCardsKey = `profileInfoCards${distroSuffix}`;
        const profileShowSettingsKey = `profileShowSettings${distroSuffix}`;
        const profileActionButtonsKey = `profileActionButtons${distroSuffix}`;
        const profileShowNetworkBannerKey = `profileShowNetworkBanner${distroSuffix}`;

        const profileAvatarVariantValue = configAny?.[profileAvatarVariantKey];
        const profileAvatarIconValue = configAny?.[profileAvatarIconKey];
        const profileInfoCardsValue = configAny?.[profileInfoCardsKey];
        const profileShowSettingsValue = configAny?.[profileShowSettingsKey];
        const profileActionButtonsValue = configAny?.[profileActionButtonsKey];
        const profileShowNetworkBannerValue = configAny?.[profileShowNetworkBannerKey];

        const hasProfileCustomization =
          profileAvatarVariantValue !== undefined ||
          profileAvatarIconValue !== undefined ||
          profileInfoCardsValue !== undefined ||
          profileShowSettingsValue !== undefined ||
          profileActionButtonsValue !== undefined ||
          profileShowNetworkBannerValue !== undefined;

        // Sync profile customization settings to app_rules
        if (hasProfileCustomization) {
          try {
            const fetchRulesUrl = await getApiUrl("/admin/app-rules");
            const existingRulesResponse = await fetch(fetchRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                session_key: sessionKey,
                auth_seed: authSeed,
              }),
            });
            const existingRulesData = await existingRulesResponse.json();
            const existingRules = existingRulesData.success
              ? existingRulesData.rules || {}
              : {};

            const mergedRules: Record<string, string> = {
              ...existingRules,
            };

            // Profile customization settings
            if (profileAvatarVariantValue !== undefined)
              mergedRules[profileAvatarVariantKey] = profileAvatarVariantValue;
            if (profileAvatarIconValue !== undefined)
              mergedRules[profileAvatarIconKey] = profileAvatarIconValue;
            if (profileInfoCardsValue !== undefined)
              mergedRules[profileInfoCardsKey] = profileInfoCardsValue;
            if (profileShowSettingsValue !== undefined)
              mergedRules[profileShowSettingsKey] = profileShowSettingsValue;
            if (profileActionButtonsValue !== undefined)
              mergedRules[profileActionButtonsKey] = profileActionButtonsValue;
            if (profileShowNetworkBannerValue !== undefined)
              mergedRules[profileShowNetworkBannerKey] = profileShowNetworkBannerValue;

            const appRulesUrl = await getApiUrl("/admin/app-rules/save");
            await fetch(appRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                rules: mergedRules,
              }),
            });
          } catch (syncErr) {

          }
        }

        // Settings customization keys with distro suffix
        const settingsItemsKey = `settingsItems${distroSuffix}`;
        const settingsShowLogoutKey = `settingsShowLogout${distroSuffix}`;
        const settingsSectionsKey = `settingsSections${distroSuffix}`;

        const settingsItemsValue = configAny?.[settingsItemsKey];
        const settingsShowLogoutValue = configAny?.[settingsShowLogoutKey];
        const settingsSectionsValue = configAny?.[settingsSectionsKey];

        const hasSettingsCustomization =
          settingsItemsValue !== undefined ||
          settingsShowLogoutValue !== undefined ||
          settingsSectionsValue !== undefined;

        // Sync settings customization to app_rules
        if (hasSettingsCustomization) {
          try {
            const fetchRulesUrl = await getApiUrl("/admin/app-rules");
            const existingRulesResponse = await fetch(fetchRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                session_key: sessionKey,
                auth_seed: authSeed,
              }),
            });
            const existingRulesData = await existingRulesResponse.json();
            const existingRules = existingRulesData.success
              ? existingRulesData.rules || {}
              : {};

            const mergedRules: Record<string, string> = {
              ...existingRules,
            };

            // Settings customization
            if (settingsItemsValue !== undefined)
              mergedRules[settingsItemsKey] = settingsItemsValue;
            if (settingsShowLogoutValue !== undefined)
              mergedRules[settingsShowLogoutKey] = settingsShowLogoutValue;
            if (settingsSectionsValue !== undefined)
              mergedRules[settingsSectionsKey] = settingsSectionsValue;

            const appRulesUrl = await getApiUrl("/admin/app-rules/save");
            await fetch(appRulesUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Token": X_TOKEN_VALUE,
                "Session-Key": sessionKey,
                "Auth-Seed": authSeed,
              },
              body: JSON.stringify({
                rules: mergedRules,
              }),
            });
          } catch (syncErr) {

          }
        }

        // Save bantuan config if editor is active
        try {
          if (editorLayoutRef.current) {
            await editorLayoutRef.current.saveBantuanConfig();
          }
        } catch (bantuanErr) {
        }

        showToast(
          `Menu "${selectedMenu || "Aplikasi Utama"}" berhasil dipublikasikan!`,
          "success",
        );
      } else {
        showToast(
          data.message || "Gagal mempublikasikan konfigurasi menu",
          "error",
        );
      }
    } catch (err) {
      showToast("Gagal mempublikasikan konfigurasi menu", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfigChange = (newConfig: DynamicScreenConfig) => {
    setConfig(newConfig);
  };

  // Upload functionality
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      // Automatically start upload
      await handleUpload(files);
    }
  };

  const handleUpload = async (files?: File[]) => {
    const filesToUpload = files || selectedFiles;
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
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
        if (!data.success) {
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      // Clear selected files and reset
      setSelectedFiles([]);
      setUploadProgress(0);

      // Trigger refresh in AssetsManager if it's active
      if (activeSection === "assets") {
        setAssetsRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
    } finally {
      setIsUploading(false);
    }
  };

  // Unified save function for security management
  const handleSaveAllConfigurations = async () => {

    if (!securityManagementRef.current?.saveAllConfigurations) {
      return;
    }

    setIsSavingAll(true);
    try {
      await securityManagementRef.current.saveAllConfigurations();
    } catch (error) {
    } finally {
      setIsSavingAll(false);
    }
  };

  // Restart server function
  const handleRestartServer = async () => {
    setIsRestarting(true);
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        showToast("Session tidak valid. Silakan login ulang.", "error");
        setIsRestarting(false);
        return;
      }

      const apiUrl = await getApiUrl("/admin/restart-server");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Server sedang restart. Mohon tunggu...", "success");
      } else {
        showToast(data.message || "Gagal restart server", "error");
      }
    } catch (error) {
      showToast("Gagal restart server. Network error.", "error");
    } finally {
      setIsRestarting(false);
    }
  };

  // Unified save function for system settings
  const handleSaveAllSystemSettings = async () => {

    if (!systemSettingsRef.current?.saveAllConfigurations) {
      return;
    }

    setIsSavingSystemSettings(true);
    try {
      await systemSettingsRef.current.saveAllConfigurations();
    } catch (error) {
    } finally {
      setIsSavingSystemSettings(false);
    }
  };

  // Unified save function for hadiah management
  const handleSaveAllHadiah = async () => {

    if (!hadiahManagementRef.current?.saveAllConfigurations) {
      return;
    }

    setIsSavingHadiah(true);
    try {
      await hadiahManagementRef.current.saveAllConfigurations();
    } catch (error) {
    } finally {
      setIsSavingHadiah(false);
    }
  };

  // Unified save function for promo management
  const handleSaveAllPromo = async () => {

    if (!promoManagementRef.current?.saveAllConfigurations) {
      return;
    }

    setIsSavingPromo(true);
    try {
      await promoManagementRef.current.saveAllConfigurations();
    } catch (error) {
    } finally {
      setIsSavingPromo(false);
    }
  };

  // Create menu items dynamically based on license status
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dasbor",
      icon: <Home className="h-5 w-5" />,
      description: "Ringkasan dan statistik",
      component: (
        <DashboardOverview
          authSeed={authSeed}
          onNavigate={setActiveSection}
          gridCols={gridCols}
          statsGridRef={statsGridRef}
          ref={dashboardOverviewRef}
        />
      ),
    },
    {
      id: "menu-editor",
      label: "Layout Aplikasi",
      icon: <Palette className="h-5 w-5" />,
      description: "Edit menu dan tata letak aplikasi",
      component: (
        <EditorLayout
          ref={editorLayoutRef}
          config={config}
          selectedScreen={selectedScreen}
          selectedMenu={selectedMenu}
          onConfigChange={handleConfigChange}
          onScreenChange={(name) => setSelectedScreen(name)}
          onImportJSON={handleImportJSON}
          onExportJSON={handleExportJSON}
          authSeed={authSeed}
        />
      ),
    },
    {
      id: "users",
      label: "Manajemen Member",
      icon: <User className="h-5 w-5" />,
      description: "Kelola member dan data mereka",
      component: (
        <MemberManagement
          authSeed={authSeed}
          ref={memberManagementRef}
          onStatsChange={(total, loaded) => setMemberStats({ total, loaded })}
        />
      ),
    },
    {
      id: "transactions",
      label: "Transaksi",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Lihat dan kelola transaksi",
      component: (
        <TransactionManagement
          authSeed={authSeed}
          ref={transactionManagementRef}
          onAnalyticsChange={(analytics) => {
            if (analytics) {
              setTransactionAnalytics({
                total_today: analytics.total_today,
                success_count: analytics.success_count,
                process_count: analytics.process_count,
                failed_count: analytics.failed_count,
              });
            } else {
              setTransactionAnalytics(null);
            }
          }}
        />
      ),
    },
    {
      id: "notifications",
      label: "Broadcast",
      icon: <Megaphone className="h-5 w-5" />,
      description: "Kirim notifikasi push ke reseller",
      component: (
        <BroadcastCenter
          ref={broadcastCenterRef}
          authSeed={authSeed}
          onStateChange={handleBroadcastStateChange}
        />
      ),
    },
    // Only show chat management if licensed
    ...(chatLicenseStatus?.is_licensed
      ? [
          {
            id: "chat",
            label: "Customer Support",
            icon: (
              <div className="relative">
                <MessageSquare className="h-5 w-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </div>
            ),
            description: "Kelola percakapan dengan pelanggan",
            component: (
              <ChatManagement
                authSeed={authSeed}
                ref={chatManagementRef}
                onConversationChange={(conversation) => {
                  if (conversation) {
                    setChatConversation({
                      user_name: conversation.user_name,
                      user_id: conversation.user_id,
                      status: conversation.status,
                      resolved: conversation.resolved,
                    });
                  } else {
                    setChatConversation(null);
                  }
                }}
                onConnectionStatusChange={(status) =>
                  setChatConnectionStatus(status)
                }
              />
            ),
          },
        ]
      : []),
    {
      id: "analytics",
      label: "Analitik",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "Lihat analitik dan laporan aplikasi",
      component: (
        <AnalyticsDashboard authSeed={authSeed} ref={analyticsDashboardRef} />
      ),
    },
    {
      id: "session-manager",
      label: "Manajemen Sesi",
      icon: <Activity className="h-5 w-5" />,
      description: "Kelola semua sesi pengguna",
      component: (
        <SessionManager
          authSeed={authSeed}
          ref={sessionManagerRef}
          onStatsChange={(total, displayed) =>
            setSessionStats({ total, displayed })
          }
        />
      ),
    },
    {
      id: "system",
      label: "Pengaturan Aplikasi",
      icon: <Settings className="h-5 w-5" />,
      description: "Konfigurasi pengaturan aplikasi",
      component: <SystemSettings authSeed={authSeed} ref={systemSettingsRef} />,
    },
    {
      id: "hadiah",
      label: "Manajemen Hadiah",
      icon: <Store className="h-5 w-5" />,
      description: "Kelola daftar hadiah",
      component: (
        <HadiahManagement
          authSeed={authSeed}
          ref={hadiahManagementRef}
          onStatsChange={(total) => setHadiahStats({ total })}
        />
      ),
    },
    {
      id: "promo",
      label: "Manajemen Promo",
      icon: <Tag className="h-5 w-5" />,
      description: "Kelola daftar promo dan diskon",
      component: (
        <PromoManagement
          authSeed={authSeed}
          ref={promoManagementRef}
          onStatsChange={(total) => setPromoStats({ total })}
        />
      ),
    },
    {
      id: "assets",
      label: "Assets Manager",
      icon: <Upload className="h-5 w-5" />,
      description: "Upload dan kelola file untuk aplikasi",
      component: (
        <AssetsManager
          authSeed={authSeed}
          refreshTrigger={assetsRefreshTrigger}
        />
      ),
    },
    {
      id: "markdown-editor",
      label: "Kelola Konten",
      icon: <FileText className="h-5 w-5" />,
      description: "Edit dan kelola file markdown",
      component: (
        <MarkdownEditor
          authSeed={authSeed}
          onNavigate={setActiveSection}
          ref={markdownEditorRef}
        />
      ),
    },

    {
      id: "privacy-policy",
      label: "Privacy Policy",
      icon: <FileCheck className="h-5 w-5" />,
      description: "Edit privacy policy dalam format Markdown",
      component: (
        <PrivacyPolicyEditor
          authSeed={authSeed}
          onNavigate={setActiveSection}
        />
      ),
    },
    {
      id: "feedback-viewer",
      label: "Feedback",
      icon: <MessageSquare className="h-5 w-5" />,
      description: "Lihat dan kelola feedback dari pengguna",
      component: (
        <FeedbackViewer
          authSeed={authSeed}
          onNavigate={setActiveSection}
          ref={feedbackViewerRef}
          onStatsChange={(total) => setFeedbackStats({ total })}
        />
      ),
    },
    {
      id: "logs",
      label: "Log Sistem",
      icon: <Terminal className="h-5 w-5" />,
      description: "Lihat log dan kesalahan sistem",
      component: (
        <SystemLogs
          authSeed={authSeed}
          ref={systemLogsRef}
          onStatsChange={(total) => setSystemLogsStats({ total })}
        />
      ),
    },

  ];

  const activeMenuItem = menuItems.find((item) => item.id === activeSection);

  return (
    <div
      className="h-screen flex"
      style={{
        background: `linear-gradient(to bottom right, ${THEME_COLOR_VERY_LIGHT}, white, ${withOpacity(THEME_COLOR_LIGHT_VERY_LIGHT, 0.5)})`,
      }}
    >
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `${sidebarOpen ? "w-64" : "w-[72px]"} transition-all duration-300`
        } border-r border-white/10 flex flex-col`}
        style={{
          background: `linear-gradient(to bottom, ${SIDEBAR_BG_FROM}, ${SIDEBAR_BG_TO})`,
        }}
      >
        {/* Header */}
        <div className="h-[57px] px-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{
                  background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
                  boxShadow: `0 10px 15px -3px ${withOpacity(THEME_COLOR, 0.2)}`,
                }}
              >
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span
                  className="font-semibold bg-clip-text text-transparent text-sm whitespace-nowrap"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
                    WebkitBackgroundClip: "text",
                  }}
                >
                  Panel Admin
                </span>
                <span className="text-xs text-white/50 whitespace-nowrap">
                  Dashboard
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
                className={`group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden border ${
                  activeSection === item.id
                    ? "bg-white/15 backdrop-blur-md border-white/20 shadow-lg"
                    : "text-white/70 hover:bg-white/10 hover:text-white border-transparent"
                }`}
              >
                <span
                  className="flex-shrink-0 group-hover:text-white transition-colors duration-200"
                  style={
                    activeSection === item.id
                      ? { color: THEME_COLOR }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span
                    className={`ml-3 truncate whitespace-nowrap ${activeSection === item.id ? "bg-clip-text text-transparent font-semibold" : ""}`}
                    style={
                      activeSection === item.id
                        ? {
                            backgroundImage: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
                            WebkitBackgroundClip: "text",
                          }
                        : undefined
                    }
                  >
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && currentAdminInfo && (
            <div className="mb-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {currentAdminInfo.google_photo_url ? (
                    <img
                      src={currentAdminInfo.google_photo_url}
                      alt={currentAdminInfo.name}
                      className="h-9 w-9 rounded-lg object-cover shadow-md"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback to initials on error
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-9 w-9 rounded-lg items-center justify-center text-white font-semibold text-sm shadow-md ${currentAdminInfo.google_photo_url ? 'hidden' : 'flex'}`}
                    style={{
                      background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
                      boxShadow: `0 4px 6px -1px ${withOpacity(THEME_COLOR, 0.2)}`,
                    }}
                  >
                    {currentAdminInfo.name.charAt(0).toUpperCase()}
                  </div>
                  {currentAdminInfo.google_photo_url && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-white rounded-full shadow-sm border border-neutral-200/80 flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate whitespace-nowrap">
                    {currentAdminInfo.name}
                  </p>
                  <p className="text-xs text-white/60 truncate whitespace-nowrap">
                    {currentAdminInfo.admin_type}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Konfigurasi Server - Super Admin Only */}
          {currentAdminInfo?.is_super_admin && (
            <button
              onClick={() => {
                setActiveSection("security");
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center ${sidebarOpen ? "justify-start" : "justify-center"} gap-2 px-3 py-2.5 mb-2 text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden ${
                activeSection === "security"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 border-2 border-amber-400 shadow-lg shadow-amber-500/40 text-white"
                  : "bg-gradient-to-br from-amber-500/40 to-orange-500/30 backdrop-blur-sm border-2 border-amber-400/40 hover:border-amber-400/60 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20"
              }`}
            >
              <Shield
                className={`h-4 w-4 flex-shrink-0 ${activeSection === "security" ? "text-white" : "text-amber-300"}`}
              />
              {sidebarOpen && (
                <span
                  className={`whitespace-nowrap ${
                    activeSection === "security"
                      ? "text-white font-semibold"
                      : "text-amber-300"
                  }`}
                >
                  Konfigurasi Server
                </span>
              )}
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-red-300 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30 rounded-xl transition-all duration-200 overflow-hidden"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap">Keluar</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "ml-0" : ""}`}
      >
        {/* Top Bar */}
        <div
          className="h-[57px] shadow-sm border-b border-white/10 px-4 flex items-center"
          style={{
            background: `linear-gradient(to right, ${SIDEBAR_BG_FROM}, ${SIDEBAR_BG_TO})`,
          }}
        >
          {isMobile ? (
            /* Mobile Layout */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mr-2 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                {(activeMenuItem?.icon || activeSection === "security") && (
                  <div className="flex items-center flex-shrink-0 mr-2 text-white/60">
                    {activeSection === "security" ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      activeMenuItem?.icon
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-semibold text-white truncate">
                    {activeSection === "analytics"
                      ? "Dashboard Analitik"
                      : activeSection === "session-manager"
                        ? "Manajemen Sesi"
                        : activeSection === "hadiah"
                          ? "Manajemen Hadiah"
                          : activeSection === "promo"
                            ? "Manajemen Promo"
                            : activeSection === "feedback-viewer"
                              ? "Feedback"
                              : activeSection === "logs"
                                ? "Log Sistem"
                                : activeSection === "security"
                                  ? "Konfigurasi Server"
                                  : activeSection === "chat" && chatConversation
                                    ? chatConversation.user_name
                                    : activeMenuItem?.label}
                  </h1>
                </div>
              </div>
              {activeSection === "dashboard" &&
                dashboardOverviewRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => dashboardOverviewRef.current?.refresh()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
              {activeSection === "markdown-editor" && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {markdownCurrentFile ? (
                    <>
                      <button
                        onClick={() => markdownEditorRef.current?.backToFiles()}
                        className="inline-flex items-center justify-center w-8 h-8 text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        title="Back to files"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          markdownEditorRef.current?.saveCurrentFile()
                        }
                        disabled={markdownEditorRef.current?.saving}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 rounded-lg transition-colors backdrop-blur-sm"
                        style={{
                          backgroundColor: withOpacity(THEME_COLOR, 0.8),
                          borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                      >
                        {markdownEditorRef.current?.saving ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => markdownEditorRef.current?.refresh()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Refresh</span>
                      </button>
                      <button
                        onClick={() =>
                          markdownEditorRef.current?.showNewFileDialog()
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors backdrop-blur-sm"
                        style={{
                          backgroundColor: withOpacity(THEME_COLOR, 0.8),
                          borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                          borderWidth: "1px",
                          borderStyle: "solid",
                        }}
                      >
                        <FilePlus className="h-3.5 w-3.5" />
                        <span>New</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              {activeSection === "logs" && systemLogsRef.current && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => systemLogsRef.current?.toggleFilter()}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors backdrop-blur-sm ${
                      systemLogsRef.current.showFilters
                        ? "text-white"
                        : "bg-white/10 text-white/90 border border-white/20 hover:bg-white/20"
                    }`}
                    style={
                      systemLogsRef.current.showFilters
                        ? {
                            backgroundColor: withOpacity(THEME_COLOR, 0.8),
                            borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }
                        : undefined
                    }
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </button>
                  <button
                    onClick={() => systemLogsRef.current?.refresh()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
              {activeSection === "feedback-viewer" &&
                feedbackViewerRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() =>
                        feedbackViewerRef.current?.toggleTechnicalDetails()
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 text-white/90 border border-white/20 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Detail Teknis</span>
                    </button>
                    <button
                      onClick={() => feedbackViewerRef.current?.refresh()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
              {activeSection === "analytics" && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => analyticsDashboardRef.current?.refresh()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
              {activeSection === "session-manager" && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => sessionManagerRef.current?.refresh()}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
              {activeSection === "hadiah" && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() =>
                      hadiahManagementRef.current?.openAddHadiahModal()
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors backdrop-blur-sm"
                    style={{
                      backgroundColor: withOpacity(THEME_COLOR, 0.8),
                      borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                    title="Tambah hadiah baru"
                  >
                    <Store className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              )}
              {activeSection === "promo" && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() =>
                      promoManagementRef.current?.openAddPromoModal()
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors backdrop-blur-sm"
                    style={{
                      backgroundColor: withOpacity(THEME_COLOR, 0.8),
                      borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                    title="Tambah promo baru"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              )}
              {activeSection === "chat" &&
                chatConversation &&
                chatManagementRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() =>
                        chatManagementRef.current?.resolveConversation(
                          chatManagementRef.current.selectedConversation!.id,
                          chatConversation.resolved === 0,
                        )
                      }
                      className={`inline-flex items-center justify-center w-8 h-8 border text-xs font-medium rounded transition-colors ${
                        chatConversation.resolved === 1
                          ? "border-success-400/40 text-success-300 bg-success-500/20 hover:bg-success-500/30"
                          : "border-orange-400/40 text-orange-300 bg-orange-500/20 hover:bg-orange-500/30"
                      }`}
                      title={
                        chatConversation.resolved === 1
                          ? "Unresolve conversation"
                          : "Resolve conversation"
                      }
                    >
                      {chatConversation.resolved === 1 ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
            </div>
          ) : (
            /* Desktop Layout */
            <div className="flex items-center justify-between w-full">
              {/* Left: Icon + Title */}
              <div className="flex items-center gap-3 min-w-0">
                {(activeMenuItem?.icon || activeSection === "security") && (
                  <div className="flex items-center text-white/60">
                    {activeSection === "security" ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      activeMenuItem?.icon
                    )}
                  </div>
                )}
                <h1 className="text-base font-semibold text-white truncate">
                  {activeSection === "analytics"
                    ? "Dashboard Analitik"
                    : activeSection === "session-manager"
                      ? "Manajemen Sesi"
                      : activeSection === "hadiah"
                        ? "Manajemen Hadiah"
                        : activeSection === "promo"
                          ? "Manajemen Promo"
                          : activeSection === "feedback-viewer"
                            ? "Feedback"
                            : activeSection === "logs"
                              ? "Log Sistem"
                              : activeSection === "security"
                                ? "Konfigurasi Server"
                                : activeSection === "chat" && chatConversation
                                  ? chatConversation.user_name
                                  : activeMenuItem?.label}
                </h1>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center justify-end gap-2">
                {/* Dashboard Refresh Button - Only show for dashboard section */}
                {activeSection === "dashboard" &&
                  dashboardOverviewRef.current && (
                    <button
                      onClick={() => dashboardOverviewRef.current?.refresh()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh</span>
                    </button>
                  )}

                {/* Member Management Refresh Button - Only show for users section */}
                {activeSection === "users" && (
                  <button
                    onClick={() => memberManagementRef.current?.refresh()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                )}

                {/* Transaction Management Refresh Button - Only show for transactions section */}
                {activeSection === "transactions" && (
                  <button
                    onClick={() => transactionManagementRef.current?.refresh()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                )}

                {/* Chat Management Buttons - Only show for chat section */}
                {activeSection === "chat" &&
                  chatConversation &&
                  chatManagementRef.current && (
                    <>
                      <button
                        onClick={() =>
                          chatManagementRef.current?.resolveConversation(
                            chatManagementRef.current.selectedConversation!.id,
                            chatConversation.resolved === 0,
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors backdrop-blur-sm ${
                          chatConversation.resolved === 1
                            ? "border-success-400/40 text-success-300 bg-success-500/20 hover:bg-success-500/30"
                            : "border-orange-400/40 text-orange-300 bg-orange-500/20 hover:bg-orange-500/30"
                        }`}
                        title={
                          chatConversation.resolved === 1
                            ? "Unresolve conversation"
                            : "Resolve conversation"
                        }
                      >
                        {chatConversation.resolved === 1 ? (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Unresolve</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Resolve</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                {/* Menu Editor Buttons - Only show for menu-editor section */}
                {activeSection === "menu-editor" && (
                  <div className="flex items-center gap-2">
                    {/* Menu Selection Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedMenu}
                        onChange={(e) => {
                          setSelectedMenu(e.target.value);
                          loadConfigFromBackend(e.target.value);
                        }}
                        disabled={isLoadingMenus}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-xs hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-7 backdrop-blur-sm"
                      >
                        {isLoadingMenus ? (
                          <option value="">Loading menus...</option>
                        ) : (
                          availableMenus.map((menu) => (
                            <option key={menu.name} value={menu.name}>
                              {menu.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/60"
                      />
                    </div>

                    {/* Import JSON */}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/90 border border-white/20 rounded-lg text-xs hover:bg-white/20 cursor-pointer transition-colors backdrop-blur-sm">
                      <Upload size={14} />
                      <span>Impor</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </label>

                    {/* Export JSON */}
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/90 rounded-lg text-xs hover:bg-white/20 border border-white/20 transition-colors backdrop-blur-sm"
                    >
                      <Download size={14} />
                      <span>Ekspor</span>
                    </button>

                    {/* Publish */}
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/80 text-white rounded-lg text-xs hover:bg-success-500 border border-success-400/40 disabled:opacity-50 transition-colors backdrop-blur-sm"
                      title="Publish to backend"
                    >
                      {isPublishing ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>Publish</span>
                    </button>
                  </div>
                )}

                {/* Assets Upload Button - Only show for assets section */}
                {activeSection === "assets" && (
                  <div className="flex items-center gap-2">
                    {/* File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                      id="assets-upload"
                    />

                    {/* Upload Button */}
                    <label
                      htmlFor="assets-upload"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors backdrop-blur-sm ${
                        isUploading
                          ? "bg-white/20 cursor-not-allowed text-white/50 border border-white/10"
                          : "text-white cursor-pointer"
                      }`}
                      style={
                        !isUploading
                          ? {
                              backgroundColor: withOpacity(THEME_COLOR, 0.8),
                              borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                              borderWidth: "1px",
                              borderStyle: "solid",
                            }
                          : undefined
                      }
                      title={isUploading ? "Uploading..." : "Upload files"}
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>{isUploading ? "Uploading..." : "Upload"}</span>
                    </label>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-white/20 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${uploadProgress}%`,
                              backgroundColor: THEME_COLOR_LIGHT,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-white/70">
                          {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Management Save Button - Only show for security section */}
                {activeSection === "security" && (
                  <div className="flex items-center gap-2">
                    {/* Restart Server */}
                    <button
                      onClick={handleRestartServer}
                      disabled={isRestarting}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/80 text-white rounded-lg text-xs hover:bg-amber-500 border border-amber-400/40 disabled:opacity-50 transition-colors font-medium backdrop-blur-sm"
                      title="Restart server (Docker will auto-restart)"
                    >
                      {isRestarting ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      <span>Restart Server</span>
                    </button>
                    {/* Save All Configurations */}
                    <button
                      onClick={handleSaveAllConfigurations}
                      disabled={isSavingAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/80 text-white rounded-lg text-xs hover:bg-success-500 border border-success-400/40 disabled:opacity-50 transition-colors font-medium backdrop-blur-sm"
                      title="Save all security configurations"
                    >
                      {isSavingAll ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>Simpan Semua Konfigurasi</span>
                    </button>
                  </div>
                )}

                {/* System Settings Save Button - Only show for system section */}
                {activeSection === "system" && (
                  <div className="flex items-center gap-2">
                    {/* Save All System Settings */}
                    <button
                      onClick={handleSaveAllSystemSettings}
                      disabled={isSavingSystemSettings}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/80 text-white rounded-lg text-xs hover:bg-success-500 border border-success-400/40 disabled:opacity-50 transition-colors font-medium backdrop-blur-sm"
                      title="Save all system settings configurations"
                    >
                      {isSavingSystemSettings ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>Simpan Semua Pengaturan</span>
                    </button>
                  </div>
                )}

                {/* Hadiah Management Buttons - Only show for hadiah section */}
                {activeSection === "hadiah" && (
                  <div className="flex items-center gap-2">
                    {/* Tambah Hadiah Button */}
                    <button
                      onClick={() =>
                        hadiahManagementRef.current?.openAddHadiahModal()
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs transition-colors font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: withOpacity(THEME_COLOR, 0.8),
                        borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                      title="Tambah hadiah baru"
                    >
                      <Store size={14} />
                      <span>Tambah Hadiah</span>
                    </button>
                    {/* Save All Hadiah */}
                    <button
                      onClick={handleSaveAllHadiah}
                      disabled={isSavingHadiah}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/80 text-white rounded-lg text-xs hover:bg-success-500 border border-success-400/40 disabled:opacity-50 transition-colors font-medium backdrop-blur-sm"
                      title="Save all hadiah configurations"
                    >
                      {isSavingHadiah ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>Simpan Semua Hadiah</span>
                    </button>
                  </div>
                )}

                {/* Promo Management Buttons - Only show for promo section */}
                {activeSection === "promo" && (
                  <div className="flex items-center gap-2">
                    {/* Tambah Promo Button */}
                    <button
                      onClick={() =>
                        promoManagementRef.current?.openAddPromoModal()
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs transition-colors font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: withOpacity(THEME_COLOR, 0.8),
                        borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                      title="Tambah promo baru"
                    >
                      <Tag size={14} />
                      <span>Tambah Promo</span>
                    </button>
                    {/* Save All Promo */}
                    <button
                      onClick={handleSaveAllPromo}
                      disabled={isSavingPromo}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/80 text-white rounded-lg text-xs hover:bg-success-500 border border-success-400/40 disabled:opacity-50 transition-colors font-medium backdrop-blur-sm"
                      title="Save all promo configurations"
                    >
                      {isSavingPromo ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>Simpan Semua Promo</span>
                    </button>
                  </div>
                )}

                {/* Broadcast Send Button - Only show for notifications section */}
                {activeSection === "notifications" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        broadcastCenterRef.current?.sendBroadcast()
                      }
                      disabled={!canSendBroadcast}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs disabled:opacity-50 transition-colors font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: withOpacity(THEME_COLOR, 0.8),
                        borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                      title="Send broadcast message"
                    >
                      {isBroadcastSending ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      ) : (
                        <Megaphone size={14} />
                      )}
                      <span>Kirim Broadcast</span>
                    </button>
                  </div>
                )}

                {/* Analytics Refresh Button - Only show for analytics section */}
                {activeSection === "analytics" && (
                  <button
                    onClick={() => analyticsDashboardRef.current?.refresh()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                )}

                {/* Session Manager Refresh Button - Only show for session-manager section */}
                {activeSection === "session-manager" && (
                  <button
                    onClick={() => sessionManagerRef.current?.refresh()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                )}

                {/* Feedback Viewer Buttons - Only show for feedback-viewer section */}
                {activeSection === "feedback-viewer" &&
                  feedbackViewerRef.current && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          feedbackViewerRef.current?.toggleTechnicalDetails()
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 text-white/90 border border-white/20 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detail Teknis</span>
                      </button>
                      <button
                        onClick={() => feedbackViewerRef.current?.refresh()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Refresh</span>
                      </button>
                    </div>
                  )}

                {/* System Logs Buttons - Only show for logs section */}
                {activeSection === "logs" && systemLogsRef.current && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => systemLogsRef.current?.toggleFilter()}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors backdrop-blur-sm ${
                        systemLogsRef.current.showFilters
                          ? "text-white"
                          : "bg-white/10 text-white/90 border border-white/20 hover:bg-white/20"
                      }`}
                      style={
                        systemLogsRef.current.showFilters
                          ? {
                              backgroundColor: withOpacity(THEME_COLOR, 0.8),
                              borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                              borderWidth: "1px",
                              borderStyle: "solid",
                            }
                          : undefined
                      }
                    >
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filter</span>
                    </button>
                    <button
                      onClick={() => systemLogsRef.current?.refresh()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}

                {/* Markdown Editor Buttons - Only show for markdown-editor section */}
                {activeSection === "markdown-editor" && (
                  <div className="flex items-center gap-2">
                    {markdownCurrentFile ? (
                      <>
                        <button
                          onClick={() =>
                            markdownEditorRef.current?.backToFiles()
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          onClick={() =>
                            markdownEditorRef.current?.downloadMarkdown()
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() =>
                            markdownEditorRef.current?.saveCurrentFile()
                          }
                          disabled={markdownEditorRef.current?.saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 rounded-lg transition-colors backdrop-blur-sm"
                          style={{
                            backgroundColor: withOpacity(THEME_COLOR, 0.8),
                            borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }}
                        >
                          {markdownEditorRef.current?.saving ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {markdownEditorRef.current?.saving
                              ? "Saving..."
                              : "Save"}
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => markdownEditorRef.current?.refresh()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors backdrop-blur-sm"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Refresh</span>
                        </button>
                        <button
                          onClick={() =>
                            markdownEditorRef.current?.showNewFileDialog()
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors backdrop-blur-sm"
                          style={{
                            backgroundColor: withOpacity(THEME_COLOR, 0.8),
                            borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
                            borderWidth: "1px",
                            borderStyle: "solid",
                          }}
                        >
                          <FilePlus className="h-3.5 w-3.5" />
                          <span>New File</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 overflow-y-auto ${activeSection === "menu-editor" ? "p-0" : "p-6"}`}
        >
          {activeSection === "security" ? (
            <SecurityManagement
              authSeed={authSeed}
              onNavigate={setActiveSection}
              ref={securityManagementRef}
            />
          ) : (
            activeMenuItem?.component
          )}
        </div>
      </div>

      {/* JSON Invalid Alert Dialog */}
      <AlertDialog
        isOpen={showJsonInvalidAlert}
        onClose={() => setShowJsonInvalidAlert(false)}
        title="File JSON Tidak Valid"
        message="File JSON tidak valid. Silakan periksa formatnya."
        variant="danger"
      />
    </div>
  );
};

// Proper Dashboard Overview Component
const DashboardOverview = forwardRef<
  { refresh: () => void },
  {
    authSeed: string;
    onNavigate: (section: string) => void;
    gridCols: string;
    statsGridRef: React.RefObject<HTMLDivElement>;
  }
>(({ authSeed, onNavigate, gridCols, statsGridRef }, ref) => {
  // Load cached health check data synchronously
  const cachedHealthCheck = getCachedHealthCheck();
  const initialApiResponseTime = cachedHealthCheck?.apiResponseTime || "N/A";

  const [stats, setStats] = useState({
    totalResellers: 0,
    todayTransactions: 0,
    activeSessions: 0,
    systemHealth: "checking",
  });
  const [systemStatus, setSystemStatus] = useState({
    serverStatus: "Checking...",
    databaseStatus: "Checking...",
    apiResponseTime: initialApiResponseTime,
    lastBackup: "N/A",
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    totalRequests: 0,
    monthlyAppSuccessTrx: 0,
  });
  const [licenseStatus, setLicenseStatus] = useState({
    is_valid: false,
    days_remaining: null as number | null,
    is_expired: true,
    status_message: "Checking...",
  });
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    systemStatus: true,
    transactions: true,
    licenseStatus: true,
  });

  const isMountedRef = useRef(true);
  const silentUpdateRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const currentApiResponseTimeRef = useRef<string>(initialApiResponseTime);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const loadDashboardStats = async () => {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        setLoadingStates({
          systemStatus: false,
          stats: false,
          transactions: false,
          licenseStatus: false,
        });
        return;
      }

      const requestBody = {
        session_key: sessionKey,
        auth_seed: authSeed,
      };

      const requestOptions = {
        method: "POST" as const,
        headers: {
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify(requestBody),
      };

      // Parallelize all API calls for faster loading
      const [
        systemStatusRes,
        statsRes,
        analyticsRes,
        licenseRes,
        healthCheckTime,
      ] = await Promise.allSettled([
        apiRequest("/admin/system-status", requestOptions, 1),
        apiRequest("/admin/dashboard-stats", requestOptions, 1),
        apiRequest("/admin/transactions/analytics", requestOptions, 1),
        apiRequest("/admin/license-status", requestOptions, 1),
        measureHealthCheckResponseTime(),
      ]);

      // Get health check response time
      const apiResponseTime =
        healthCheckTime.status === "fulfilled" ? healthCheckTime.value : "N/A";

      // Update ref and state only if value changed
      if (apiResponseTime !== currentApiResponseTimeRef.current) {
        currentApiResponseTimeRef.current = apiResponseTime;
      }

      // Handle system status
      if (systemStatusRes.status === "fulfilled" && systemStatusRes.value.ok) {
        try {
          const data = await systemStatusRes.value.json();
          if (data.success && data.status) {
            const status = data.status;
            setSystemStatus((prev) => {
              // Check if anything actually changed to avoid unnecessary re-renders
              const hasChanges =
                prev.serverStatus !== status.server_status ||
                prev.databaseStatus !== status.database_status ||
                prev.apiResponseTime !== apiResponseTime ||
                prev.lastBackup !==
                  (status.last_backup || "Tidak ada backup") ||
                prev.memoryUsage !== (status.memory_usage || 0) ||
                prev.cpuUsage !== (status.cpu_usage || 0) ||
                prev.activeConnections !== status.active_connections ||
                prev.totalRequests !== status.total_requests ||
                prev.monthlyAppSuccessTrx !==
                  (status.monthly_app_success_trx || 0);

              if (!hasChanges) {
                return prev; // Return same object to prevent re-render
              }

              return {
                serverStatus: status.server_status,
                databaseStatus: status.database_status,
                apiResponseTime: apiResponseTime,
                lastBackup: status.last_backup || "Tidak ada backup",
                memoryUsage: status.memory_usage || 0,
                cpuUsage: status.cpu_usage || 0,
                activeConnections: status.active_connections,
                totalRequests: status.total_requests,
                monthlyAppSuccessTrx: status.monthly_app_success_trx || 0,
              };
            });
            setStats((prevStats) => ({
              ...prevStats,
              systemHealth:
                status.server_status === "Online" ? "healthy" : "critical",
            }));
          } else {
            throw new Error("Invalid response");
          }
        } catch (error) {
          setSystemStatus({
            serverStatus: "Offline",
            databaseStatus: "Unknown",
            apiResponseTime: "N/A",
            lastBackup: "N/A",
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
            totalRequests: 0,
            monthlyAppSuccessTrx: 0,
          });
          setStats((prevStats) => ({
            ...prevStats,
            systemHealth: "critical",
          }));
        }
      } else {
        setSystemStatus({
          serverStatus: "Offline",
          databaseStatus: "Unknown",
          apiResponseTime: "N/A",
          lastBackup: "N/A",
          memoryUsage: 0,
          cpuUsage: 0,
          activeConnections: 0,
          totalRequests: 0,
          monthlyAppSuccessTrx: 0,
        });
        setStats((prevStats) => ({
          ...prevStats,
          systemHealth: "critical",
        }));
      }
      setLoadingStates((prev) => ({ ...prev, systemStatus: false }));

      // Handle dashboard stats
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        try {
          const statsData = await statsRes.value.json();
          if (statsData.success && statsData.stats) {
            const dashboardStats = statsData.stats;
            setStats((prevStats) => ({
              ...prevStats,
              totalResellers: dashboardStats.total_resellers,
              activeSessions: dashboardStats.active_sessions,
            }));
          }
        } catch (error) {
        }
      }
      setLoadingStates((prev) => ({ ...prev, stats: false }));

      // Handle transaction analytics
      if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
        try {
          const analyticsData = await analyticsRes.value.json();
          if (analyticsData.success && analyticsData.analytics) {
            setStats((prevStats) => ({
              ...prevStats,
              todayTransactions: analyticsData.analytics.total_today || 0,
            }));
          }
        } catch (error) {
        }
      }
      setLoadingStates((prev) => ({ ...prev, transactions: false }));

      // Handle license status
      if (licenseRes.status === "fulfilled" && licenseRes.value.ok) {
        try {
          const licenseData = await licenseRes.value.json();
          if (licenseData.success && licenseData.license_status) {
            setLicenseStatus(licenseData.license_status);
          } else {
            setLicenseStatus((prev) => ({
              ...prev,
              status_message: "Failed to load license status",
            }));
          }
        } catch (error) {
          setLicenseStatus((prev) => ({
            ...prev,
            status_message: "Error loading license status",
          }));
        }
      } else {
        setLicenseStatus((prev) => ({
          ...prev,
          status_message: "Error loading license status",
        }));
      }
      setLoadingStates((prev) => ({ ...prev, licenseStatus: false }));

      // Set up periodic silent updates
      if (!silentUpdateRef.current) {
        silentUpdateRef.current = true;

        // Initial silent update after 30 seconds
        timeoutRef.current = setTimeout(async () => {
          if (isMountedRef.current) {
            const updatedTime = await measureHealthCheckResponseTime();
            if (
              isMountedRef.current &&
              updatedTime !== "N/A" &&
              updatedTime !== currentApiResponseTimeRef.current
            ) {
              currentApiResponseTimeRef.current = updatedTime;
              setSystemStatus((prev) => ({
                ...prev,
                apiResponseTime: updatedTime,
              }));
            }
          }
        }, 30000);

        // Periodic updates every 2 minutes
        intervalRef.current = setInterval(async () => {
          if (isMountedRef.current) {
            const updatedTime = await measureHealthCheckResponseTime();
            if (
              isMountedRef.current &&
              updatedTime !== "N/A" &&
              updatedTime !== currentApiResponseTimeRef.current
            ) {
              currentApiResponseTimeRef.current = updatedTime;
              setSystemStatus((prev) => ({
                ...prev,
                apiResponseTime: updatedTime,
              }));
            }
          }
        }, 120000); // Every 2 minutes
      }
    };

    loadDashboardStats();
  }, [authSeed]);

  // Auto-refresh disabled; use manual refresh button instead

  const refreshDashboard = async () => {
    const sessionKey = localStorage.getItem("adminSessionKey");
    if (!sessionKey) {
      return;
    }

    setLoadingStates({
      stats: true,
      systemStatus: true,
      transactions: true,
      licenseStatus: true,
    });

    const requestBody = {
      session_key: sessionKey,
      auth_seed: authSeed,
    };

    const requestOptions = {
      method: "POST" as const,
      headers: {
        "X-Token": X_TOKEN_VALUE,
      },
      body: JSON.stringify(requestBody),
    };

    // Parallelize all API calls for faster refresh
    const [
      systemStatusRes,
      statsRes,
      analyticsRes,
      licenseRes,
      healthCheckTime,
    ] = await Promise.allSettled([
      apiRequest("/admin/system-status", requestOptions, 1),
      apiRequest("/admin/dashboard-stats", requestOptions, 1),
      apiRequest("/admin/transactions/analytics", requestOptions, 1),
      apiRequest("/admin/license-status", requestOptions, 1),
      measureHealthCheckResponseTime(),
    ]);

    // Get health check response time
    const apiResponseTime =
      healthCheckTime.status === "fulfilled" ? healthCheckTime.value : "N/A";

    // Update ref and state only if value changed
    if (apiResponseTime !== currentApiResponseTimeRef.current) {
      currentApiResponseTimeRef.current = apiResponseTime;
    }

    // Handle system status
    if (systemStatusRes.status === "fulfilled" && systemStatusRes.value.ok) {
      try {
        const data = await systemStatusRes.value.json();
        if (data.success && data.status) {
          const status = data.status;
          setSystemStatus((prev) => {
            // Check if anything actually changed to avoid unnecessary re-renders
            const hasChanges =
              prev.serverStatus !== status.server_status ||
              prev.databaseStatus !== status.database_status ||
              prev.apiResponseTime !== apiResponseTime ||
              prev.lastBackup !== (status.last_backup || "Tidak ada backup") ||
              prev.memoryUsage !== (status.memory_usage || 0) ||
              prev.cpuUsage !== (status.cpu_usage || 0) ||
              prev.activeConnections !== status.active_connections ||
              prev.totalRequests !== status.total_requests ||
              prev.monthlyAppSuccessTrx !==
                (status.monthly_app_success_trx || 0);

            if (!hasChanges) {
              return prev; // Return same object to prevent re-render
            }

            return {
              serverStatus: status.server_status,
              databaseStatus: status.database_status,
              apiResponseTime: apiResponseTime,
              lastBackup: status.last_backup || "Tidak ada backup",
              memoryUsage: status.memory_usage || 0,
              cpuUsage: status.cpu_usage || 0,
              activeConnections: status.active_connections,
              totalRequests: status.total_requests,
              monthlyAppSuccessTrx: status.monthly_app_success_trx || 0,
            };
          });
          setStats((prevStats) => ({
            ...prevStats,
            systemHealth:
              status.server_status === "Online" ? "healthy" : "critical",
          }));
        }
      } catch (error) {
      }
    }
    setLoadingStates((prev) => ({ ...prev, systemStatus: false }));

    // Handle dashboard stats
    if (statsRes.status === "fulfilled" && statsRes.value.ok) {
      try {
        const statsData = await statsRes.value.json();
        if (statsData.success && statsData.stats) {
          const dashboardStats = statsData.stats;
          setStats((prevStats) => ({
            ...prevStats,
            totalResellers: dashboardStats.total_resellers,
            activeSessions: dashboardStats.active_sessions,
          }));
        }
      } catch (error) {
      }
    }
    setLoadingStates((prev) => ({ ...prev, stats: false }));

    // Handle transaction analytics
    if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
      try {
        const analyticsData = await analyticsRes.value.json();
        if (analyticsData.success && analyticsData.analytics) {
          setStats((prevStats) => ({
            ...prevStats,
            todayTransactions: analyticsData.analytics.total_today || 0,
          }));
        }
      } catch (error) {
      }
    }
    setLoadingStates((prev) => ({ ...prev, transactions: false }));

    // Handle license status
    if (licenseRes.status === "fulfilled" && licenseRes.value.ok) {
      try {
        const licenseData = await licenseRes.value.json();
        if (licenseData.success && licenseData.license_status) {
          setLicenseStatus(licenseData.license_status);
        } else {
          setLicenseStatus((prev) => ({
            ...prev,
            status_message: "Failed to load license status",
          }));
        }
      } catch (error) {
        setLicenseStatus((prev) => ({
          ...prev,
          status_message: "Error loading license status",
        }));
      }
    } else {
      setLicenseStatus((prev) => ({
        ...prev,
        status_message: "Error loading license status",
      }));
    }
    setLoadingStates((prev) => ({ ...prev, licenseStatus: false }));
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshDashboard,
  }));

  // Skeleton loader component
  const SkeletonLoader = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section - Isometric Card Stack */}
      <div
        className="relative overflow-hidden rounded-lg p-6"
        style={{
          background: `linear-gradient(to bottom right, ${THEME_COLOR_DARK}, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
        }}
      >
        {/* Stacked card illusion layers */}
        <div
          className="absolute -bottom-2 left-4 right-4 h-full rounded-lg transform rotate-1"
          style={{ backgroundColor: withOpacity(THEME_COLOR, 0.4) }}
        ></div>
        <div
          className="absolute -bottom-4 left-8 right-8 h-full rounded-lg transform rotate-2"
          style={{ backgroundColor: withOpacity(THEME_COLOR_LIGHT, 0.2) }}
        ></div>

        {/* Diagonal stripe pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 10px, white 10px, white 12px)`,
          }}
        ></div>

        {/* Corner accent shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-tr-[80px]"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Layered icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-xl transform rotate-6"></div>
              <div className="absolute inset-0 bg-white/10 rounded-xl transform -rotate-3"></div>
              <div className="relative w-14 h-14 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7" style={{ color: THEME_COLOR }} />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Selamat Datang di Panel Admin
              </h1>
              <p className="text-white/80 text-sm">
                Kelola sistem dan pantau aktivitas aplikasi dari sini
              </p>
            </div>
          </div>

          {/* Floating metric pills */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs text-white/90 border border-white/20">
              <span className="inline-block w-1.5 h-1.5 bg-success-400 rounded-full mr-1.5 animate-pulse"></span>
              Sistem Aktif
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div ref={statsGridRef} className={`grid ${gridCols} gap-4 lg:gap-6`}>
        <div
          data-card
          className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 lg:p-6 rounded-xl shadow-card border border-orange-100/80"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex-shrink-0 shadow-sm">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-600 whitespace-nowrap">
                Total Reseller
              </p>
              {loadingStates.stats ? (
                <SkeletonLoader className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-neutral-800">
                  {stats.totalResellers.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          data-card
          className="bg-gradient-to-br from-success-50 to-success-100/50 p-4 lg:p-6 rounded-xl shadow-card border border-success-100/80"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex-shrink-0 shadow-sm">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-success-600 whitespace-nowrap">
                Transaksi Hari Ini
              </p>
              {loadingStates.transactions ? (
                <SkeletonLoader className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-neutral-800">
                  {stats.todayTransactions.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          data-card
          className="bg-gradient-to-br from-warning-50 to-warning-100/50 p-4 lg:p-6 rounded-xl shadow-card border border-warning-100/80"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex-shrink-0 shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-warning-600 whitespace-nowrap">
                Total Sesi Member
              </p>
              {loadingStates.stats ? (
                <SkeletonLoader className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-neutral-800">
                  {stats.activeSessions}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          data-card
          className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 lg:p-6 rounded-xl shadow-card border border-purple-100/80"
        >
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex-shrink-0 shadow-sm">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-purple-600 whitespace-nowrap">
                Status Sistem
              </p>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-8 w-20 mt-1" />
              ) : (
                <p
                  className="text-2xl font-bold capitalize"
                  style={{
                    color:
                      stats.systemHealth === "healthy"
                        ? "#16a34a"
                        : stats.systemHealth === "warning"
                          ? "#ca8a04"
                          : stats.systemHealth === "checking"
                            ? THEME_COLOR
                            : "#dc2626",
                  }}
                >
                  {stats.systemHealth}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          data-card
          className="bg-white/80 backdrop-blur-sm p-4 lg:p-6 rounded-xl shadow-card border border-neutral-100/80"
        >
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate("users")}
              className="p-4 bg-white/60 border border-neutral-100/80 rounded-xl transition-all duration-200 text-left group hover:shadow-md"
              style={
                {
                  "--hover-bg": withOpacity(THEME_COLOR, 0.1),
                } as React.CSSProperties
              }
            >
              <div className="flex items-center space-x-3">
                <div
                  className="p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
                  style={{
                    background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                  }}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">
                    Kelola Member
                  </p>
                  <p className="text-sm text-neutral-500">
                    Lihat dan edit member
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("transactions")}
              className="p-4 bg-white/60 border border-neutral-100/80 rounded-xl hover:bg-success-50/50 hover:border-success-200/80 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">
                    Lihat Transaksi
                  </p>
                  <p className="text-sm text-neutral-500">Monitor transaksi</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("menu-editor")}
              className="p-4 bg-white/60 border border-neutral-100/80 rounded-xl hover:bg-purple-50/50 hover:border-purple-200/80 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">
                    Edit Layout Aplikasi
                  </p>
                  <p className="text-sm text-neutral-500">
                    Konfigurasi menu & banner aplikasi
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("session-manager")}
              className="p-4 bg-white/60 border border-neutral-100/80 rounded-xl hover:bg-cyan-50/50 hover:border-cyan-200/80 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">
                    Manajemen Sesi
                  </p>
                  <p className="text-sm text-neutral-500">
                    Kelola sesi pengguna
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("notifications")}
              className="p-4 bg-white/60 border border-neutral-100/80 rounded-xl hover:bg-orange-50/50 hover:border-orange-200/80 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <Megaphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">Broadcast</p>
                  <p className="text-sm text-neutral-500">Kirim notifikasi</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("chat")}
              className="p-4 bg-white/60 border border-neutral-100/80 rounded-xl hover:bg-teal-50/50 hover:border-teal-200/80 transition-all duration-200 text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800">
                    Customer Support
                  </p>
                  <p className="text-sm text-neutral-500">Kelola percakapan</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div
          data-card
          className="bg-white/80 backdrop-blur-sm p-4 lg:p-6 rounded-xl shadow-card border border-neutral-100/80"
        >
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            Status Sistem
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-neutral-50/50 rounded-lg">
              <span className="text-sm font-medium text-neutral-600">
                Server Status
              </span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-16" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatus.serverStatus === "Online"
                      ? "bg-success-100 text-success-800"
                      : systemStatus.serverStatus === "Checking..."
                        ? "bg-warning-100 text-warning-800"
                        : "bg-danger-100 text-danger-800"
                  }`}
                >
                  {systemStatus.serverStatus}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-2 bg-neutral-50/50 rounded-lg">
              <span className="text-sm font-medium text-neutral-600">
                Database
              </span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-20" />
              ) : (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor:
                      systemStatus.databaseStatus === "Connected"
                        ? "#dcfce7"
                        : systemStatus.databaseStatus === "SQLite Only" ||
                            systemStatus.databaseStatus === "SQL Server Only"
                          ? "#fef9c3"
                          : systemStatus.databaseStatus === "Checking..."
                            ? withOpacity(THEME_COLOR, 0.2)
                            : "#fee2e2",
                    color:
                      systemStatus.databaseStatus === "Connected"
                        ? "#166534"
                        : systemStatus.databaseStatus === "SQLite Only" ||
                            systemStatus.databaseStatus === "SQL Server Only"
                          ? "#854d0e"
                          : systemStatus.databaseStatus === "Checking..."
                            ? THEME_COLOR_DARK
                            : "#991b1b",
                  }}
                >
                  {systemStatus.databaseStatus}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between p-2 bg-neutral-50/50 rounded-lg">
              <span className="text-sm font-medium text-neutral-600">
                API Response
              </span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-12" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatus.apiResponseTime === "N/A"
                      ? "bg-danger-100 text-danger-800"
                      : "bg-success-100 text-success-800"
                  }`}
                >
                  {systemStatus.apiResponseTime}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">License Status</span>
              {loadingStates.licenseStatus ? (
                <SkeletonLoader className="h-6 w-20" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    licenseStatus.is_valid
                      ? "bg-success-100 text-success-800"
                      : licenseStatus.is_expired
                        ? "bg-danger-100 text-danger-800"
                        : "bg-warning-100 text-warning-800"
                  }`}
                >
                  {licenseStatus.is_valid
                    ? "Valid"
                    : licenseStatus.is_expired
                      ? "Expired"
                      : "Invalid"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Transaksi sukses bulan ini (via app)
              </span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-24" />
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {systemStatus.monthlyAppSuccessTrx.toLocaleString()}
                </span>
              )}
            </div>
            {!loadingStates.licenseStatus &&
              licenseStatus.days_remaining !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining</span>
                  <span
                    className={`text-sm font-medium ${
                      licenseStatus.is_valid
                        ? licenseStatus.days_remaining! <= 30
                          ? "text-yellow-600"
                          : "text-success-600"
                        : "text-danger-600"
                    }`}
                  >
                    {licenseStatus.is_expired
                      ? `${Math.abs(licenseStatus.days_remaining!)} days ago`
                      : `${licenseStatus.days_remaining} days`}
                  </span>
                </div>
              )}
            {!loadingStates.licenseStatus && licenseStatus.status_message && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                {licenseStatus.status_message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardOverview.displayName = "DashboardOverview";

interface PublishResponse {
  success: boolean;
  message: string;
}

// Remove the old UserManagement component since we're using MemberManagement now

export default AdminDashboard;
