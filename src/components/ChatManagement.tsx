import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  MessageSquare,
  Send,
  User,
  XCircle,
  MessageCircle,
  Paperclip,
  Search,
  Music,
  Upload,
  Play,
  Video,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import {
  getApiUrl,
  X_TOKEN_VALUE,
  getApiEndpoint,
  API_ENDPOINTS,
} from "../config/api";
import { domainConfig } from "../config/domainConfig";
import { useWebSocket } from "../hooks/useWebSocket";
import UserAvatar from "./UserAvatar";
import { getCachedConversations, getCachedMessages, setCachedConversations, setCachedMessages, mergeConversations, mergeMessages, getCachedLicenseStatus, setCachedLicenseStatus } from "../utils/chatCache";
import { useToast } from "./Toast";
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  withOpacity,
} from "../utils/themeColors";

interface ChatManagementProps {
  authSeed: string;
  onConversationChange?: (conversation: ChatConversation | null) => void;
  onConnectionStatusChange?: (status: string) => void;
}

export interface ChatManagementRef {
  selectedConversation: ChatConversation | null;
  resolveConversation: (
    conversationId: string,
    resolved: boolean,
  ) => Promise<void>;
  showNotificationSettings: () => void;
  connectionStatus: string;
  unreadCount: number;
}

interface ChatLicenseStatus {
  is_licensed: boolean;
  server_name: string;
}

interface ChatConversation {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  assigned_admin_id?: string;
  assigned_admin_name?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  unread_count_user: number;
  unread_count_admin: number;
  last_message?: string;
  last_message_sender?: string;
  resolved: number;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string;
  sender_name: string;
  message: string;
  message_type: string;
  attachment_url?: string;
  is_read: number;
  created_at: string;
  is_admin_note?: boolean;
  admin_note?: string;
  // Optimistic UI states
  isPending?: boolean;
  isFailed?: boolean;
  tempId?: string; // For tracking optimistic messages
}

interface NotificationSettings {
  desktopNotifications: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notificationTypes: {
    newMessage: boolean;
    conversationUpdate: boolean;
    assignment: boolean;
  };
}

interface ChatConcept {
  id: string;
  keyword: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Media content component with proper URL handling
const MediaContent: React.FC<{
  message: ChatMessage;
  onImageClick?: (url: string) => void;
}> = ({ message, onImageClick }) => {
  const [mediaUrl, setMediaUrl] = React.useState<string>("");

  React.useEffect(() => {
    const constructMediaUrl = async () => {
      if (!message.attachment_url) return;

      if (message.attachment_url.startsWith("http")) {
        setMediaUrl(message.attachment_url);
      } else {
        try {
          const apiEndpoint = await getApiEndpoint();
          setMediaUrl(`${apiEndpoint}${message.attachment_url}`);
        } catch (error) {
          // Use the first available endpoint as fallback
          const fallbackEndpoint = API_ENDPOINTS[0] || "";
          setMediaUrl(`${fallbackEndpoint}${message.attachment_url}`);
        }
      }
    };

    constructMediaUrl();
  }, [message.attachment_url]);

  if (!mediaUrl) return null;

  if (message.message_type === "image") {
    return (
      <img
        src={mediaUrl}
        alt="Shared image"
        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        style={{ maxHeight: "200px" }}
        onClick={() => onImageClick?.(mediaUrl)}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const errorDiv = document.createElement("div");
          errorDiv.className =
            "flex items-center text-xs text-gray-500 p-2 bg-gray-100 rounded";
          errorDiv.innerHTML = "<span>Failed to load image</span>";
          target.parentNode?.appendChild(errorDiv);
        }}
      />
    );
  } else if (message.message_type === "audio") {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
        <button
          onClick={() => {
            const audio = new Audio(mediaUrl);
            audio.play().catch(() => {});
          }}
          className="flex items-center justify-center w-8 h-8 rounded-full text-white transition-colors"
          style={{ backgroundColor: THEME_COLOR }}
        >
          <Play className="h-4 w-4 ml-0.5" />
        </button>
        <div className="flex items-center space-x-1">
          <Music className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">Voice Note</span>
        </div>
      </div>
    );
  } else if (message.message_type === "video") {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg max-w-xs">
        <button
          onClick={() => {
            window.open(mediaUrl, "_blank");
          }}
          className="flex items-center justify-center w-8 h-8 bg-success-500 hover:bg-success-600 rounded-full text-white transition-colors"
        >
          <Play className="h-4 w-4 ml-0.5" />
        </button>
        <div className="flex items-center space-x-1">
          <Video className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700 font-medium">Video</span>
        </div>
        <ExternalLink className="h-3 w-3 text-gray-500" />
      </div>
    );
  } else {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs underline"
      >
        <Paperclip className="h-3 w-3 mr-1" />
        Attachment
      </a>
    );
  }
};

const renderMarkdown = (content: string) => {
  if (!content.trim()) {
    return { __html: '' };
  }

  let html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-5 mb-3">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm my-2" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 hover:text-primary-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-3 italic my-2 text-gray-700">$1</blockquote>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>');

  html = '<p class="mb-2">' + html + '</p>';

  html = html.replace(/(<li class="ml-4">.*?<\/li>)/g, (match) => {
    return '<ul class="list-disc list-inside mb-2">' + match + '</ul>';
  });

  html = html
    .replace(/<p class="mb-2"><\/p>/g, '')
    .replace(/<p class="mb-2"><ul/g, '<ul')
    .replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p class="mb-2"><h/g, '<h')
    .replace(/<\/h[1-6]><\/p>/g, (match) => match.replace('</p>', ''));

  return { __html: html };
};

const ChatManagement = forwardRef<ChatManagementRef, ChatManagementProps>(
  ({ authSeed, onConversationChange, onConnectionStatusChange }, ref) => {
    const { showToast } = useToast();
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedConversation, setSelectedConversation] =
      useState<ChatConversation | null>(null);

    // License status state
    const [licenseStatus, setLicenseStatus] =
      useState<ChatLicenseStatus | null>(null);
    const [licenseError, setLicenseError] = useState<string | null>(null);

    const onConversationChangeRef = useRef(onConversationChange);
    const onConnectionStatusChangeRef = useRef(onConnectionStatusChange);

    useEffect(() => {
      onConversationChangeRef.current = onConversationChange;
    }, [onConversationChange]);

    useEffect(() => {
      onConnectionStatusChangeRef.current = onConnectionStatusChange;
    }, [onConnectionStatusChange]);

    useEffect(() => {
      selectedConversationRef.current = selectedConversation;
      if (onConversationChangeRef.current) {
        onConversationChangeRef.current(selectedConversation);
      }
    }, [selectedConversation]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [pendingMessages, setPendingMessages] = useState<
      Map<string, ChatMessage>
    >(new Map());
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isMobile, setIsMobile] = useState(false);
    const [showConversationList, setShowConversationList] = useState(true);
    const [webSocketUrl, setWebSocketUrl] = useState<string>("");

    // Pagination state for conversations
    const [conversationPage, setConversationPage] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
    const CONVERSATIONS_PER_PAGE = 15;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const selectedConversationRef = useRef<ChatConversation | null>(null);
    const conversationListEndRef = useRef<HTMLDivElement>(null);

    const [showNotificationSettings, setShowNotificationSettings] =
      useState(false);
    const [notificationSettings, setNotificationSettings] =
      useState<NotificationSettings>({
        desktopNotifications: true,
        soundEnabled: true,
        soundVolume: 1.0,
        notificationTypes: {
          newMessage: true,
          conversationUpdate: true,
          assignment: true,
        },
      });
    const [notificationPermission, setNotificationPermission] =
      useState<NotificationPermission>("default");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Chat concepts state
    const [concepts, setConcepts] = useState<ChatConcept[]>([]);
    const [showConcepts, setShowConcepts] = useState(false);
    const [conceptSearch, setConceptSearch] = useState("");
    const [selectedConceptIndex, setSelectedConceptIndex] = useState(-1);

    // Image viewer state
    const [viewedImageUrl, setViewedImageUrl] = useState<string | null>(null);

    // Notification state
    const [notification, setNotification] = useState<{
      show: boolean;
      type: "success" | "error" | "info";
      title: string;
      message: string;
    }>({
      show: false,
      type: "info",
      title: "",
      message: "",
    });

    const getWebSocketUrl = () => {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey || !authSeed) {
        return null;
      }

      const backendHost = domainConfig.wsBackendHost;
      if (!backendHost) {
        return null;
      }

      const protocol =
        backendHost.includes("localhost") || backendHost.includes("127.0.0.1")
          ? "ws:"
          : "wss:";
      return `${protocol}//${backendHost}/ws/chat?session_key=${encodeURIComponent(sessionKey)}&auth_seed=${encodeURIComponent(authSeed)}`;
    };

    const handleWebSocketMessage = (message: any) => {
      const currentSelectedConversation = selectedConversationRef.current;

      switch (message.message_type) {
        case "new_message":
          const newMsg = message.data;

          // Always update conversations list to show new message and unresolve if resolved
          setConversations((prev) => {
            const updated = prev.map((conv) =>
              conv.id === newMsg.conversation_id
                ? {
                    ...conv,
                    last_message: newMsg.message,
                    last_message_sender: newMsg.sender_name,
                    last_message_at: newMsg.created_at,
                    unread_count_admin:
                      newMsg.sender_type === "user"
                        ? conv.unread_count_admin + 1
                        : conv.unread_count_admin,
                    // Unresolve conversation when user sends a new message
                    resolved: newMsg.sender_type === "user" ? 0 : conv.resolved,
                  }
                : conv,
            );

            // Update cache
            setCachedConversations(updated);

            // Show notification for new user messages
            if (newMsg.sender_type === "user") {
              const conversation = updated.find(
                (conv) => conv.id === newMsg.conversation_id,
              );
              if (conversation) {
                showNotification(
                  `New message from ${conversation.user_name}`,
                  newMsg.message.length > 50
                    ? newMsg.message.substring(0, 50) + "..."
                    : newMsg.message,
                  "newMessage",
                );
              }
            }

            return updated;
          });

          // Add message to current conversation if it's the selected one
          if (
            currentSelectedConversation &&
            newMsg.conversation_id === currentSelectedConversation.id
          ) {
            if (newMsg.sender_type === "user") {
              setSelectedConversation((prev) =>
                prev ? { ...prev, resolved: 0 } : null,
              );
            }

            setMessages((prev) => {
              const optimisticIndex = prev.findIndex(
                (msg) =>
                  msg.tempId &&
                  msg.message === newMsg.message &&
                  msg.sender_type === newMsg.sender_type &&
                  msg.conversation_id === newMsg.conversation_id &&
                  Math.abs(
                    new Date(msg.created_at).getTime() -
                      new Date(newMsg.created_at).getTime(),
                  ) < 10000,
              );

              if (optimisticIndex !== -1) {
                const newMessages = [...prev];
                newMessages[optimisticIndex] = newMsg;
                return newMessages;
              }

              if (prev.some((msg) => msg.id === newMsg.id)) {
                return prev;
              }

              return [...prev, newMsg].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );
            });
          }
          break;
        case "conversation_update":
          const updatedConv = message.data;
          let isNewConversation = false;

          setConversations((prev) => {
            const exists = prev.some((conv) => conv.id === updatedConv.id);

            let result;
            if (!exists) {
              isNewConversation = true;
              const newConv: ChatConversation = {
                id: updatedConv.id,
                user_id: updatedConv.user_id,
                user_name: updatedConv.user_name,
                status: updatedConv.status,
                assigned_admin_id: updatedConv.assigned_admin_id,
                assigned_admin_name: updatedConv.assigned_admin_name,
                created_at: updatedConv.updated_at, // Use updated_at as created_at fallback
                updated_at: updatedConv.updated_at,
                last_message_at: updatedConv.updated_at,
                unread_count_user: 0,
                unread_count_admin: updatedConv.unread_count_admin || 0,
                last_message: updatedConv.last_message,
                last_message_sender: updatedConv.last_message_sender,
                resolved: updatedConv.resolved || 0,
              };
              result = [newConv, ...prev];
            } else {
              // Update existing conversation
              result = prev.map((conv) =>
                conv.id === updatedConv.id
                  ? {
                      ...conv,
                      ...updatedConv,
                      // Preserve existing last_message and last_message_sender if not provided in update
                      last_message:
                        updatedConv.last_message || conv.last_message,
                      last_message_sender:
                        updatedConv.last_message_sender ||
                        conv.last_message_sender,
                    }
                  : conv,
              );
            }

            // Update cache
            setCachedConversations(result);
            return result;
          });

          if (isNewConversation) {
            const notificationBody = updatedConv.last_message
              ? updatedConv.last_message.length > 50
                ? updatedConv.last_message.substring(0, 50) + "..."
                : updatedConv.last_message
              : "New conversation started";
            showNotification(
              `New conversation from ${updatedConv.user_name}`,
              notificationBody,
              "conversationUpdate",
              true,
            );
          }

          // Update selected conversation if it's the one being updated
          if (
            currentSelectedConversation &&
            currentSelectedConversation.id === updatedConv.id
          ) {
            setSelectedConversation((prev) =>
              prev ? { ...prev, ...updatedConv } : null,
            );
          }
          break;
        case "connection_established":
          break;
        case "subscription_confirmed":
          break;
        case "existing_message":
          // Handle existing messages (sent when subscribing to a conversation)
          const existingMsg = message.data;
          if (
            currentSelectedConversation &&
            existingMsg.conversation_id === currentSelectedConversation.id
          ) {
            setMessages((prev) => {
              // Check if message already exists to avoid duplicates
              const messageExists = prev.some(
                (msg) => msg.id === existingMsg.id,
              );
              if (messageExists) {
                return prev;
              }
              // Sort messages by created_at to maintain chronological order
              const newMessages = [...prev, existingMsg].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );
              return newMessages;
            });
          }
          break;
        case "pong":
          break;
        case "error":
          break;
        default:
          break;
      }
    };

    useEffect(() => {
      // Set WebSocket URL immediately to connect right away
      const url = getWebSocketUrl();
      setWebSocketUrl(url || "");
    }, [authSeed]);

    const {
      isConnected,
      connectionStatus,
      sendMessage: sendWebSocketMessage,
    } = useWebSocket({
      url: webSocketUrl && authSeed ? webSocketUrl : "", // Connect if we have both URL and authSeed
      onMessage: handleWebSocketMessage,
      onOpen: () => {
        if (selectedConversation) {
          setTimeout(() => {
            sendWebSocketMessage({
              message_type: "subscribe_conversation",
              conversation_id: selectedConversation.id,
            });
          }, 1000);
        }
      },
      onClose: () => {},
      onError: (error) => {
      },
    });

    // Calculate unread count
    const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count_admin, 0);

    // Expose selectedConversation and functions to parent (after connectionStatus is defined)
    useImperativeHandle(ref, () => ({
      selectedConversation,
      resolveConversation,
      showNotificationSettings: () => setShowNotificationSettings(true),
      connectionStatus,
      unreadCount,
    }));

    useEffect(() => {
      if (onConnectionStatusChangeRef.current) {
        onConnectionStatusChangeRef.current(connectionStatus);
      }
    }, [connectionStatus]);

    // Load chat license status from existing license status API
    const loadChatLicenseStatus = async () => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setLicenseError("No session key found");
          return;
        }

        // Use the existing license status API which now includes chat management status
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

        const data = await response.json();
        if (data.success && data.license_status) {
          const newLicenseStatus = {
            is_licensed: data.license_status.chat_management_licensed || false,
            server_name: "server", // We don't have server name in this response
          };
          setLicenseStatus(newLicenseStatus);
          // Update cache
          setCachedLicenseStatus(newLicenseStatus);
        } else {
          setLicenseError(data.message || "Failed to load license status");
        }
      } catch (error) {
        setLicenseError("Failed to load license status");
      }
    };

    useEffect(() => {
      // Load from cache immediately
      const cachedConversations = getCachedConversations();
      if (cachedConversations) {
        setConversations(cachedConversations);
        if (cachedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(cachedConversations[0]);
        }
      }

      // Load license status from cache immediately
      const cachedLicense = getCachedLicenseStatus();
      if (cachedLicense) {
        setLicenseStatus(cachedLicense);
      }

      // Fetch fresh data in background
      loadChatLicenseStatus();
      loadConversations();
      loadNotificationSettings();
      requestNotificationPermission();
    }, []);

    // Infinite scroll for conversations using IntersectionObserver
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const target = entries[0];
          if (target.isIntersecting && hasMoreConversations && !isLoadingMoreConversations) {
            loadConversations(true);
          }
        },
        {
          root: null,
          rootMargin: '100px',
          threshold: 0.1,
        }
      );

      if (conversationListEndRef.current) {
        observer.observe(conversationListEndRef.current);
      }

      return () => {
        if (conversationListEndRef.current) {
          observer.unobserve(conversationListEndRef.current);
        }
      };
    }, [hasMoreConversations, isLoadingMoreConversations, conversationPage]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl+Enter or Cmd+Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          if (selectedConversation && newMessage.trim() && !sendingMessage) {
            sendMessage();
          }
        }

        // Ctrl+K or Cmd+K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          const searchInput = document.querySelector(
            'input[placeholder="Search conversations..."]',
          ) as HTMLInputElement;
          searchInput?.focus();
        }

        // Escape to close modals
        if (e.key === "Escape") {
          setShowNotificationSettings(false);
          setViewedImageUrl(null);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [selectedConversation, newMessage, sendingMessage]);

    // Notification permission and settings
    const requestNotificationPermission = async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      }
    };

    const loadNotificationSettings = () => {
      const saved = localStorage.getItem("chatNotificationSettings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure max volume and all notifications are enabled
          setNotificationSettings({
            ...parsed,
            desktopNotifications: true,
            soundEnabled: true,
            soundVolume: 1.0,
            notificationTypes: {
              newMessage: true,
              conversationUpdate: true,
              assignment: true,
              ...parsed.notificationTypes,
            },
          });
        } catch (error) {
          // Use defaults with max volume
          setNotificationSettings({
            desktopNotifications: true,
            soundEnabled: true,
            soundVolume: 1.0,
            notificationTypes: {
              newMessage: true,
              conversationUpdate: true,
              assignment: true,
            },
          });
        }
      } else {
        // No saved settings, use defaults with max volume
        setNotificationSettings({
          desktopNotifications: true,
          soundEnabled: true,
          soundVolume: 1.0,
          notificationTypes: {
            newMessage: true,
            conversationUpdate: true,
            assignment: true,
          },
        });
      }
    };

    const saveNotificationSettings = (settings: NotificationSettings) => {
      // Always enforce max volume and all notifications enabled
      const enforcedSettings = {
        ...settings,
        desktopNotifications: true,
        soundEnabled: true,
        soundVolume: 1.0,
        notificationTypes: {
          newMessage: true,
          conversationUpdate: true,
          assignment: true,
        },
      };
      setNotificationSettings(enforcedSettings);
      localStorage.setItem(
        "chatNotificationSettings",
        JSON.stringify(enforcedSettings),
      );
    };

    const playNotificationSound = () => {
      if (notificationSettings.soundEnabled) {
        // Try to use audio file first if available
        if (audioRef.current) {
          const audio = audioRef.current;
          audio.volume = notificationSettings.soundVolume;
          audio.currentTime = 0; // Reset to start

          // Try to play the audio file
          const playPromise = audio.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Audio file played successfully
              })
              .catch(() => {
                // Audio file failed (404 or other error), fall back to Web Audio API
                playWebAudioSound();
              });
          } else {
            // If play() returns undefined, try Web Audio API
            playWebAudioSound();
          }
          return;
        }
        // Fallback to Web Audio API if no audio element
        playWebAudioSound();
      }
    };

    const playWebAudioSound = () => {
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          notificationSettings.soundVolume * 0.3,
          audioContext.currentTime + 0.01,
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.3,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
      }
    };

    // Parse admin note from message starting with @
    const parseAdminNote = (message: string) => {
      if (message.startsWith("@")) {
        const noteContent = message.substring(1).trim();
        return {
          isAdminNote: true,
          adminNote: noteContent,
          publicMessage: `[Admin Note] ${noteContent}`,
        };
      }
      return {
        isAdminNote: false,
        adminNote: "",
        publicMessage: message,
      };
    };

    const loadConcepts = async (search: string = "") => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) return;

        const apiUrl = await getApiUrl("/chat/concepts");
        const params = new URLSearchParams({
          session_key: sessionKey,
          auth_seed: authSeed,
          ...(search && { search }),
        });

        const response = await fetch(`${apiUrl}?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
        });

        const data = await response.json();
        if (data.success) {
          setConcepts(data.concepts || []);
          setSelectedConceptIndex(data.concepts?.length > 0 ? 0 : -1);
        }
      } catch (error) {
      }
    };

    // Handle concept selection
    const selectConcept = (concept: ChatConcept) => {
      setNewMessage(concept.content);
      setShowConcepts(false);
      setConceptSearch("");
      setSelectedConceptIndex(-1);

      // Focus input after selecting concept
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    };

    // Handle keyboard navigation for concept selection
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showConcepts && concepts.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedConceptIndex((prev) => {
              const newIndex = prev < concepts.length - 1 ? prev + 1 : 0;
              // Scroll to keep selected item visible
              setTimeout(() => scrollToSelectedItem(newIndex), 0);
              return newIndex;
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedConceptIndex((prev) => {
              const newIndex = prev > 0 ? prev - 1 : concepts.length - 1;
              // Scroll to keep selected item visible
              setTimeout(() => scrollToSelectedItem(newIndex), 0);
              return newIndex;
            });
            break;
          case "Enter":
            e.preventDefault();
            if (
              selectedConceptIndex >= 0 &&
              selectedConceptIndex < concepts.length
            ) {
              selectConcept(concepts[selectedConceptIndex]);
            }
            break;
          case "Escape":
            e.preventDefault();
            setShowConcepts(false);
            setSelectedConceptIndex(-1);
            break;
        }
      }
    };

    // Scroll to keep selected item visible
    const scrollToSelectedItem = (index: number) => {
      const dropdown = document.querySelector(".concept-dropdown");
      const selectedItem = document.querySelector(
        `[data-concept-index="${index}"]`,
      );

      if (dropdown && selectedItem) {
        const dropdownRect = dropdown.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();

        // Check if item is above visible area
        if (itemRect.top < dropdownRect.top) {
          selectedItem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Check if item is below visible area
        else if (itemRect.bottom > dropdownRect.bottom) {
          selectedItem.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }
    };

    // Handle input change for concept detection
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNewMessage(value);

      // Check for ! prefix for concept selection
      if (value.startsWith("!")) {
        const searchTerm = value.substring(1);
        setConceptSearch(searchTerm);
        setShowConcepts(true);
        setSelectedConceptIndex(-1);
        loadConcepts(searchTerm);
      } else {
        setShowConcepts(false);
        setSelectedConceptIndex(-1);
      }
    };

    // Show notification function
    const showNotificationModal = (
      type: "success" | "error" | "info",
      title: string,
      message: string,
    ) => {
      setNotification({
        show: true,
        type,
        title,
        message,
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 5000);
    };

    // Show concept feedback function using Toast
    const showConceptFeedback = (
      type: "success" | "error",
      message: string,
    ) => {
      showToast(message, type);
    };

    const handleConceptCreation = async () => {
      if (!newMessage.trim() || !newMessage.startsWith("+")) {
        return;
      }

      const parts = newMessage.substring(1).split(" ");
      const keyword = parts[0];
      const content = parts.slice(1).join(" ");

      if (!keyword || !content) {
        showConceptFeedback("error", "Invalid format: +keyword content");
        return;
      }

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) return;

        const apiUrl = await getApiUrl("/chat/concepts");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            keyword: keyword.trim(),
            title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          showConceptFeedback("error", "Failed to save concept");
          return;
        }

        const data = await response.json();
        if (data.success === true) {
          setNewMessage("");
          loadConcepts(conceptSearch);
          showConceptFeedback("success", "Concept saved successfully");
          if (messageInputRef.current) {
            messageInputRef.current.focus();
          }
        } else {
          showConceptFeedback("error", "Failed to save concept");
        }
      } catch (error) {
        showConceptFeedback("error", "Failed to save concept");
      }
    };

    const showNotification = (
      title: string,
      body: string,
      type: "newMessage" | "conversationUpdate" | "assignment" = "newMessage",
      showWhenFocused: boolean = false,
    ) => {
      // Sound is handled by global WebSocket hook in AdminDashboard
      // Only show desktop notification if needed
      if (
        !notificationSettings.desktopNotifications ||
        !notificationSettings.notificationTypes[type]
      ) {
        return;
      }

      if (!showWhenFocused && document.hasFocus()) {
        return;
      }

      if (notificationPermission === "granted") {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          tag: "chat-notification",
        });
      }
    };

    // Load messages when conversation is selected
    useEffect(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, [selectedConversation]);

    // Mobile detection and responsive behavior
    useEffect(() => {
      const checkMobile = () => {
        const mobile = window.innerWidth < 768; // md breakpoint
        setIsMobile(mobile);
        if (mobile && selectedConversation) {
          setShowConversationList(false); // Hide conversation list on mobile when viewing chat
        } else {
          setShowConversationList(true); // Show conversation list on desktop
        }
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, [selectedConversation]);

    useEffect(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, [selectedConversation?.id]);

    useEffect(() => {
      if (selectedConversation && isConnected) {
        const timer = setTimeout(() => {
          sendWebSocketMessage({
            message_type: "subscribe_conversation",
            conversation_id: selectedConversation.id,
          });
        }, 1000);

        return () => {
          clearTimeout(timer);
          sendWebSocketMessage({
            message_type: "unsubscribe_conversation",
            conversation_id: selectedConversation.id,
          });
        };
      }
    }, [selectedConversation?.id, isConnected, sendWebSocketMessage]);

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadConversations = async (loadMore: boolean = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) return;

        if (loadMore) {
          setIsLoadingMoreConversations(true);
        }

        const currentPage = loadMore ? conversationPage + 1 : 0;
        const offset = currentPage * CONVERSATIONS_PER_PAGE;

        const apiUrl = await getApiUrl("/admin/chat/conversations");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            limit: CONVERSATIONS_PER_PAGE,
            offset: offset,
          }),
        });

        const data = await response.json();
        if (data.success) {
          const newConversations = data.conversations || [];

          // Check if there are more conversations to load
          setHasMoreConversations(newConversations.length === CONVERSATIONS_PER_PAGE);
          setConversationPage(currentPage);

          if (loadMore) {
            // Append new conversations to existing list
            setConversations(prev => {
              const merged = mergeConversations(prev, newConversations);
              setCachedConversations(merged);
              return merged;
            });
          } else {
            // Initial load - replace conversations
            setConversations(prev => {
              const merged = mergeConversations(prev, newConversations);
              return merged;
            });

            // Update cache
            setCachedConversations(newConversations);
          }

          // Update selected conversation if it still exists
          if (selectedConversation) {
            const allConversations = loadMore 
              ? [...conversations, ...newConversations]
              : newConversations;
            const stillExists = allConversations.some(
              (conv: ChatConversation) => conv.id === selectedConversation.id,
            );
            if (!stillExists && !loadMore) {
              setSelectedConversation(null);
            } else {
              const updated = allConversations.find(
                (conv: ChatConversation) => conv.id === selectedConversation.id,
              );
              if (updated) {
                setSelectedConversation(updated);
              }
            }
          }

          if (newConversations.length > 0 && !selectedConversation && !loadMore) {
            setSelectedConversation(newConversations[0]);
          }
        }
      } catch (error) {
      } finally {
        setIsLoadingMoreConversations(false);
      }
    };

    const resolveConversation = async (
      conversationId: string,
      resolved: boolean,
    ) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) return;

        const apiUrl = await getApiUrl("/admin/chat/resolve");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            conversation_id: conversationId,
            resolved: resolved,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Update the conversation in the local state
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId
                ? { ...conv, resolved: resolved ? 1 : 0 }
                : conv,
            ),
          );

          // Update selected conversation if it's the one being resolved
          if (selectedConversation?.id === conversationId) {
            setSelectedConversation((prev) =>
              prev ? { ...prev, resolved: resolved ? 1 : 0 } : null,
            );
          }

          // Notification removed - resolve action happens silently
        } else {
        }
      } catch (error) {
      }
    };

    const loadMessages = async (conversationId: string) => {
      // Load from cache immediately
      const cached = getCachedMessages(conversationId);
      if (cached) {
        setMessages(cached);
      }

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) return;

        const apiUrl = await getApiUrl("/admin/chat/messages");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            conversation_id: conversationId,
            limit: 100,
            offset: 0,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Reverse messages to show oldest first
          const newMessages = (data.messages || []).reverse();

          // Merge/update messages without rebuilding components
          setMessages(prev => {
            const merged = mergeMessages(prev, newMessages);
            return merged;
          });

          // Update cache
          setCachedMessages(conversationId, newMessages);

          // Clear unread count for this conversation in the conversations list
          setConversations((prev) => {
            const updated = prev.map((conv) =>
              conv.id === conversationId
                ? { ...conv, unread_count_admin: 0 }
                : conv,
            );
            // Update cache
            setCachedConversations(updated);
            return updated;
          });
        }
      } catch (error) {
      }
    };

    // Generate temporary ID for optimistic messages
    const generateTempId = () =>
      `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add optimistic message to UI immediately
    const addOptimisticMessage = (
      message: string,
      isAdminNote: boolean,
      adminNote: string,
    ) => {
      const tempId = generateTempId();
      const now = new Date().toISOString();

      const optimisticMessage: ChatMessage = {
        id: tempId,
        conversation_id: selectedConversation!.id,
        sender_type: "admin",
        sender_id: "admin",
        sender_name: "Admin",
        message: message,
        message_type: "text",
        is_read: 0,
        created_at: now,
        is_admin_note: isAdminNote,
        admin_note: adminNote,
        isPending: true,
        tempId: tempId,
      };

      // Add to messages immediately for instant UI update
      setMessages((prev) => [...prev, optimisticMessage]);

      // Store in pending messages for tracking
      setPendingMessages(
        (prev) => new Map(prev.set(tempId, optimisticMessage)),
      );

      // Set a cleanup timeout to remove optimistic message if not replaced within 10 seconds
      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
        setPendingMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempId);
          return newMap;
        });
      }, 10000);

      return tempId;
    };

    // Update message status (pending -> sent/failed)
    const updateMessageStatus = (
      tempId: string,
      success: boolean,
      realMessage?: ChatMessage,
    ) => {
      if (success && realMessage) {
        // Replace optimistic message with real message
        setMessages((prev) =>
          prev.map((msg) => (msg.tempId === tempId ? realMessage : msg)),
        );
      } else if (success) {
        // Mark as sent (WebSocket will handle the real message replacement)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, isPending: false, isFailed: false }
              : msg,
          ),
        );
      } else {
        // Mark as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, isPending: false, isFailed: true }
              : msg,
          ),
        );
      }

      // Remove from pending messages
      setPendingMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(tempId);
        return newMap;
      });
    };

    // Retry sending a failed message
    const retryMessage = async (tempId: string) => {
      const pendingMessage = pendingMessages.get(tempId);
      if (!pendingMessage) return;

      // Mark as pending again
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, isPending: true, isFailed: false }
            : msg,
        ),
      );

      // Retry sending
      await sendMessageOptimistic(
        pendingMessage.message,
        pendingMessage.is_admin_note || false,
        pendingMessage.admin_note || "",
        tempId,
      );
    };

    const sendMessage = async () => {
      if (!selectedConversation || !newMessage.trim() || sendingMessage) return;

      // Parse admin note if message starts with @
      const { isAdminNote, adminNote, publicMessage } = parseAdminNote(
        newMessage.trim(),
      );

      // Clear input immediately
      setNewMessage("");

      // Focus input immediately after clearing
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }

      // Add optimistic message
      const tempId = addOptimisticMessage(
        publicMessage,
        isAdminNote,
        adminNote,
      );

      // Clear unread count for this conversation when admin sends a message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, unread_count_admin: 0 }
            : conv,
        ),
      );

      // Send message in background
      await sendMessageOptimistic(
        publicMessage,
        isAdminNote,
        adminNote,
        tempId,
      );
    };

    const sendMessageOptimistic = async (
      message: string,
      isAdminNote: boolean,
      adminNote: string,
      tempId: string,
    ) => {
      setSendingMessage(true);
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          updateMessageStatus(tempId, false);
          return;
        }

        const apiUrl = await getApiUrl("/admin/chat/send");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            conversation_id: selectedConversation!.id,
            message: message,
            message_type: "text",
            is_admin_note: isAdminNote,
            admin_note: isAdminNote ? adminNote : undefined,
          }),
        });

        const data = await response.json();
        if (data.success) {
          updateMessageStatus(tempId, true);
        } else {
          updateMessageStatus(tempId, false);
        }
      } catch (error) {
        updateMessageStatus(tempId, false);
      } finally {
        setSendingMessage(false);
      }
    };

    const uploadAndSendMedia = async (file: File) => {
      if (!selectedConversation || uploadingFile) return;

      setUploadingFile(true);
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) return;

        // First upload the file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("session_key", sessionKey);
        formData.append("auth_seed", authSeed);

        const uploadUrl = await getApiUrl("/admin/chat/upload");
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) {
          showNotificationModal("error", "Upload Failed", uploadData.message);
          return;
        }

        // Then send the message with the file URL
        const messageType = uploadData.file_type || "image";
        const messageText =
          messageType === "image"
            ? "📷 Image"
            : messageType === "video"
              ? "🎬 Video"
              : "🎤 Voice Note";

        const apiUrl = await getApiUrl("/admin/chat/send");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            conversation_id: selectedConversation.id,
            message: messageText,
            message_type: messageType,
            attachment_url: uploadData.file_url,
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Clear unread count for this conversation when admin sends media
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedConversation.id
                ? { ...conv, unread_count_admin: 0 }
                : conv,
            ),
          );

          // WebSocket handles real-time updates
        } else {
          showNotificationModal("error", "Send Failed", data.message);
        }
      } catch (error) {
        showNotificationModal("error", "Error", "Failed to send media");
      } finally {
        setUploadingFile(false);
      }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        const isImage = file.type.startsWith("image/");
        const isAudio = file.type.startsWith("audio/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isAudio && !isVideo) {
          showNotificationModal(
            "error",
            "Invalid File Type",
            "Only image, audio, and video files are supported",
          );
          return;
        }

        // Validate file size (500MB for videos, 10MB for images/audio)
        const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
        const limitStr = isVideo ? "500MB" : "10MB";

        if (file.size > maxSize) {
          showNotificationModal(
            "error",
            "File Too Large",
            `File size must be less than ${limitStr}`,
          );
          return;
        }

        uploadAndSendMedia(file);
      }

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const filteredConversations = conversations.filter((conv) => {
      const matchesSearch =
        conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = (() => {
        if (statusFilter === "all") return true;
        if (statusFilter === "resolved") return conv.resolved === 1;
        if (statusFilter === "unresolved") return conv.resolved === 0;
        return true;
      })();
      return matchesSearch && matchesStatus;
    });

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    const getResolvedColor = (resolved: number) => {
      return resolved === 1
        ? "bg-success-100 text-success-800"
        : "bg-danger-100 text-danger-800";
    };

    // Show license error if failed to load
    if (licenseError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="p-4 bg-danger-50 rounded-2xl inline-block mb-4">
              <XCircle className="h-10 w-10 text-danger-500" />
            </div>
            <div className="text-danger-600 text-lg font-semibold mb-2">
              License Check Failed
            </div>
            <p className="text-neutral-600 mb-4">{licenseError}</p>
            <button
              onClick={loadChatLicenseStatus}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 font-medium shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Show blank screen if not licensed
    if (!licenseStatus?.is_licensed) {
      return <div></div>;
    }

    return (
      <div className="h-full flex bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 overflow-hidden">
        {/* Mobile overlay */}
        {isMobile && showConversationList && (
          <div
            className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
            onClick={() => setShowConversationList(false)}
          />
        )}

        {/* Conversations List */}
        <div
          className={`${
            isMobile
              ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
                  showConversationList ? "translate-x-0" : "-translate-x-full"
                }`
              : "w-72"
          } border-r border-neutral-100/80 flex flex-col bg-gradient-to-b from-neutral-50/90 to-white/90 backdrop-blur-sm`}
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-100/80 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {isMobile && (
                  <button
                    onClick={() => setShowConversationList(false)}
                    className="mr-3 p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-sm shadow-sm transition-all duration-200 placeholder:text-neutral-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 text-sm shadow-sm transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <div className="p-4 bg-neutral-100/50 rounded-2xl inline-block mb-3">
                  <MessageCircle className="h-10 w-10 text-neutral-300" />
                </div>
                <p className="text-sm font-medium">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    setConversations((prev) =>
                      prev.map((conv) =>
                        conv.id === conversation.id
                          ? { ...conv, unread_count_admin: 0 }
                          : conv,
                      ),
                    );
                    if (isMobile) {
                      setShowConversationList(false);
                    }
                  }}
                  className={`mb-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedConversation?.id === conversation.id
                      ? "bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200/80 shadow-sm"
                      : "bg-white/60 border border-transparent hover:bg-white hover:border-neutral-200/80 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserAvatar userId={conversation.user_id} userName={conversation.user_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 truncate">
                            {conversation.user_name}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {conversation.user_id}
                          </p>
                        </div>
                        {conversation.unread_count_admin > 0 && (
                          <span className="flex-shrink-0 bg-gradient-to-r from-danger-500 to-danger-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-sm">
                            {conversation.unread_count_admin}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        {conversation.last_message && (
                          <p className="text-xs text-neutral-600 truncate flex-1">
                            {conversation.last_message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0 ${
                            conversation.resolved === 1
                              ? "bg-gradient-to-r from-success-50 to-success-100/80 text-success-700 border border-success-200/50"
                              : "bg-gradient-to-r from-danger-50 to-danger-100/80 text-danger-700 border border-danger-200/50"
                          }`}
                        >
                          {conversation.resolved === 1 ? (
                            <>
                              <svg
                                className="h-2.5 w-2.5 mr-0.5"
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
                              Resolved
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-2.5 w-2.5 mr-0.5"
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
                              Unresolved
                            </>
                          )}
                        </span>
                        <p className="text-xs font-medium text-neutral-400">
                          {formatTime(conversation.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator for infinite scroll */}
            {isLoadingMoreConversations && (
              <div className="flex justify-center py-4">
                <div className="flex items-center space-x-2 text-neutral-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                  <span className="text-xs">Loading more...</span>
                </div>
              </div>
            )}

            {/* Sentinel element for IntersectionObserver */}
            {hasMoreConversations && !isLoadingMoreConversations && filteredConversations.length > 0 && (
              <div ref={conversationListEndRef} className="h-4" />
            )}

            {/* End of list indicator */}
            {!hasMoreConversations && filteredConversations.length > CONVERSATIONS_PER_PAGE && (
              <div className="text-center py-3 text-xs text-neutral-400">
                No more conversations
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-neutral-50/50 to-white">
          {selectedConversation ? (
            <>
              {/* Mobile back button */}
              {isMobile && (
                <div className="p-2 border-b border-neutral-100/80 bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setShowConversationList(true)}
                    className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        message.sender_type === "admin"
                          ? message.is_admin_note
                            ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-400/50"
                            : "text-white"
                          : "bg-white/90 backdrop-blur-sm text-neutral-800 border border-neutral-100/80"
                      }`}
                      style={message.sender_type === "admin" && !message.is_admin_note ? {
                        background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})`
                      } : undefined}
                    >
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-medium">
                          {message.sender_name}
                          {message.is_admin_note && (
                            <span className="ml-2 text-xs bg-amber-500 px-2 py-0.5 rounded-full">
                              Admin Note
                            </span>
                          )}
                        </span>
                        <span className="text-xs opacity-75 ml-2">
                          {formatTime(message.created_at)}
                        </span>
                        {/* Message status indicators */}
                        {message.sender_type === "admin" && message.tempId && (
                          <div className="ml-2 flex items-center">
                            {message.isPending && (
                              <div className="flex items-center text-xs opacity-75">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                                Sending...
                              </div>
                            )}
                            {message.isFailed && (
                              <div className="flex items-center text-xs text-red-300">
                                <span className="mr-1">⚠️</span>
                                Failed
                                <button
                                  onClick={() => retryMessage(message.tempId!)}
                                  className="ml-2 px-2 py-0.5 bg-danger-500 hover:bg-danger-600 rounded text-xs"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                            {!message.isPending &&
                              !message.isFailed &&
                              message.tempId && (
                                <div className="flex items-center text-xs opacity-75">
                                  <span className="mr-1">✓</span>
                                  Sent
                                </div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Media content */}
                      {message.attachment_url && (
                        <div className="mb-2">
                          <MediaContent
                            message={message}
                            onImageClick={setViewedImageUrl}
                          />
                        </div>
                      )}

                      {/* Text message */}
                      {message.message &&
                        message.message !== "📷 Image" &&
                        message.message !== "🎤 Voice Note" &&
                        message.message !== "🎬 Video" && (
                          <div>
                            {message.is_admin_note ? (
                              <div>
                                <p className="text-sm font-semibold mb-1">
                                  📝 {message.admin_note}
                                </p>
                              </div>
                            ) : (
                              <div 
                                className="text-sm prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={renderMarkdown(message.message)}
                              />
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-neutral-100/80 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,audio/*,video/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="inline-flex items-center p-2.5 border border-neutral-200/80 text-sm font-medium rounded-xl text-neutral-600 bg-white/80 hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="Upload image, audio, or video"
                  >
                    {uploadingFile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-600"></div>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={handleMessageChange}
                      onKeyDown={handleKeyDown}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (showConcepts && selectedConceptIndex >= 0) {
                            // Handle concept selection via Enter
                            return;
                          } else if (newMessage.startsWith("+")) {
                            handleConceptCreation();
                          } else {
                            sendMessage();
                          }
                        }
                      }}
                      placeholder="Ketik chat di sini... (@ untuk catatan admin, ! untuk konsep pesan, +keyword untuk menambahkan konsep)"
                      className="w-full px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-200 resize-none placeholder:text-neutral-400"
                      disabled={uploadingFile}
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                      }}
                    />

                    {/* Concept Selection Dropdown */}
                    {showConcepts && (
                      <div
                        className="concept-dropdown absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-sm border border-neutral-200/80 rounded-xl shadow-lg z-50 overflow-hidden"
                        style={{ maxHeight: "160px" }}
                      >
                        <div className="overflow-y-auto max-h-40">
                          {concepts.length === 0 ? (
                            <div className="p-3 text-xs text-neutral-500 text-center">
                              No concepts found
                            </div>
                          ) : (
                            concepts.map((concept, index) => (
                              <button
                                key={concept.id}
                                data-concept-index={index}
                                onClick={() => selectConcept(concept)}
                                className={`w-full text-left px-3 py-2.5 text-sm border-b border-neutral-100/80 last:border-b-0 transition-colors duration-150 ${
                                  index === selectedConceptIndex
                                    ? "bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-800"
                                    : "hover:bg-neutral-50 text-neutral-700"
                                }`}
                              >
                                <span className="font-semibold">
                                  {concept.keyword}
                                </span>
                                <span className="ml-2 text-neutral-500 truncate">
                                  {concept.content}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={
                      newMessage.startsWith("+")
                        ? handleConceptCreation
                        : sendMessage
                    }
                    disabled={!newMessage.trim() || uploadingFile}
                    className="inline-flex items-center p-2.5 border border-transparent text-sm font-medium rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                    style={{ background: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_DARK})` }}
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="p-5 bg-gradient-to-br from-neutral-100/50 to-neutral-200/30 rounded-2xl inline-block mb-4">
                  <MessageSquare className="h-12 w-12 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  Select a conversation
                </h3>
                <p className="text-neutral-500 max-w-xs">
                  Choose a conversation from the list to start chatting with
                  customers
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audio element for notifications */}
        <audio
          ref={audioRef}
          preload="auto"
          onError={() => {
            // Silently handle errors - will fall back to Web Audio API
          }}
        >
          <source src="/notification-sound.mp3" type="audio/mpeg" />
          <source src="/notification-sound.wav" type="audio/wav" />
        </audio>

        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
              onClick={() => setShowNotificationSettings(false)}
            />
            <div className="relative mx-auto mt-16 max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-100/80">
              <div className="px-6 py-4 border-b border-neutral-100/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-800">
                    Notification Settings
                  </h3>
                  <button
                    onClick={() => setShowNotificationSettings(false)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl">
                  <span className="text-sm font-medium text-neutral-700">
                    Desktop notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationSettings.desktopNotifications}
                    onChange={(e) =>
                      saveNotificationSettings({
                        ...notificationSettings,
                        desktopNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500/20 border-neutral-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl">
                  <span className="text-sm font-medium text-neutral-700">
                    Sound notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) =>
                      saveNotificationSettings({
                        ...notificationSettings,
                        soundEnabled: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500/20 border-neutral-300 rounded"
                  />
                </div>

                {notificationSettings.soundEnabled && (
                  <div className="p-3 bg-neutral-50/50 rounded-xl">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Sound volume
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={notificationSettings.soundVolume}
                      onChange={(e) =>
                        saveNotificationSettings({
                          ...notificationSettings,
                          soundVolume: parseFloat(e.target.value),
                        })
                      }
                      className="w-full mb-3"
                    />
                    <button
                      onClick={playNotificationSound}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-sm"
                    >
                      Test Sound
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <span className="text-sm font-semibold text-neutral-700">
                    Notification types:
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl">
                      <span className="text-sm text-neutral-700">
                        New messages
                      </span>
                      <input
                        type="checkbox"
                        checked={
                          notificationSettings.notificationTypes.newMessage
                        }
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            notificationTypes: {
                              ...notificationSettings.notificationTypes,
                              newMessage: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500/20 border-neutral-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl">
                      <span className="text-sm text-neutral-700">
                        Conversation updates
                      </span>
                      <input
                        type="checkbox"
                        checked={
                          notificationSettings.notificationTypes
                            .conversationUpdate
                        }
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            notificationTypes: {
                              ...notificationSettings.notificationTypes,
                              conversationUpdate: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500/20 border-neutral-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl">
                      <span className="text-sm text-neutral-700">Assignments</span>
                      <input
                        type="checkbox"
                        checked={
                          notificationSettings.notificationTypes.assignment
                        }
                        onChange={(e) =>
                          saveNotificationSettings({
                            ...notificationSettings,
                            notificationTypes: {
                              ...notificationSettings.notificationTypes,
                              assignment: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500/20 border-neutral-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                {notificationPermission === "denied" && (
                  <div className="bg-danger-50 border border-danger-200/50 rounded-xl p-4">
                    <p className="text-sm text-danger-700">
                      Notifications are blocked. Please enable them in your
                      browser settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Notification Modal */}
        {notification.show && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-600 bg-opacity-75"
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
            />
            <div className="relative mx-auto mt-16 max-w-md bg-white rounded-lg shadow-xl">
              <div
                className={`px-6 py-4 border-b ${
                  notification.type === "success"
                    ? "border-success-200 bg-success-50"
                    : notification.type === "error"
                      ? "border-danger-200 bg-danger-50"
                      : "border-primary-200 bg-primary-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {notification.type === "success" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-success-600"
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
                        </div>
                      </div>
                    )}
                    {notification.type === "error" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-danger-600"
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
                        </div>
                      </div>
                    )}
                    {notification.type === "info" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-primary-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="ml-3">
                      <h3
                        className={`text-lg font-medium ${
                          notification.type === "success"
                            ? "text-green-900"
                            : notification.type === "error"
                              ? "text-red-900"
                              : "text-blue-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setNotification((prev) => ({ ...prev, show: false }))
                    }
                    className={`text-gray-400 hover:text-gray-600 ${
                      notification.type === "success"
                        ? "hover:text-success-600"
                        : notification.type === "error"
                          ? "hover:text-danger-600"
                          : "hover:text-primary-600"
                    }`}
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <p
                  className={`text-sm ${
                    notification.type === "success"
                      ? "text-success-700"
                      : notification.type === "error"
                        ? "text-danger-700"
                        : "text-primary-700"
                  }`}
                >
                  {notification.message}
                </p>
              </div>

              <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      setNotification((prev) => ({ ...prev, show: false }))
                    }
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      notification.type === "success"
                        ? "bg-success-600 text-white hover:bg-success-700"
                        : notification.type === "error"
                          ? "bg-danger-600 text-white hover:bg-danger-700"
                          : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {viewedImageUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={() => setViewedImageUrl(null)}
          >
            <button
              onClick={() => setViewedImageUrl(null)}
              className="fixed top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all"
              aria-label="Close image viewer"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
              <img
                src={viewedImageUrl}
                alt="Full size image"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);

ChatManagement.displayName = "ChatManagement";

export default ChatManagement;
