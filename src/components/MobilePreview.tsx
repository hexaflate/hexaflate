import React from "react";
import { ScreenConfig, ContentSection, NavigationConfig } from "../types";
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
import {
  Copy,
  Trash2,
  GripVertical,
  Bell,
  HelpCircle,
  Settings,
  Home,
  User,
  Mail,
  Menu,
  ArrowLeft,
  X,
  Check,
  Info,
  Wallet,
  CreditCard,
  Phone,
  MessageSquare,
  Headphones,
  Store,
  ShoppingCart,
  ShoppingBag,
  Tag,
  Gift,
  Truck,
  QrCode,
  Plane,
  Car,
  Train,
  Bus,
  Hotel,
  UtensilsCrossed,
  Film,
  Music,
  Gamepad2,
  Tv,
  Radio,
  Calendar,
  History,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  PieChart,
  LineChart,
  Plus,
  Edit,
  Trash,
  Search,
  Filter,
  Download,
  Upload,
  Share,
  Heart,
  Bookmark,
  Printer,
  Save,
  Eye,
  EyeOff,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  MapPin,
  Navigation,
} from "lucide-react";
import MobileWidgetPreview from "./MobileWidgetPreview";
import IconRenderer from "./IconRenderer";
import { THEME_COLOR } from "../utils/themeColors";

// Map Material icon names to lucide-react components
const MATERIAL_TO_LUCIDE: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  // Navigation
  home_outlined: Home,
  home: Home,
  dashboard_outlined: BarChart2,
  dashboard: BarChart2,
  person_outline: User,
  person: User,
  account_circle_outlined: User,
  account_circle: User,
  notifications_outlined: Bell,
  notifications: Bell,
  mail_outlined: Mail,
  mail: Mail,
  settings_outlined: Settings,
  settings: Settings,
  apps_rounded: Menu,
  menu: Menu,
  arrow_back: ArrowLeft,
  close: X,
  check: Check,
  info_outline: Info,
  info: Info,
  help_outline: HelpCircle,
  help: HelpCircle,
  // Financial
  account_balance_wallet_outlined: Wallet,
  account_balance_wallet: Wallet,
  payment: CreditCard,
  credit_card_outlined: CreditCard,
  credit_card: CreditCard,
  account_balance: Store,
  account_balance_outlined: Store,
  receipt_long: Calendar,
  receipt: Calendar,
  savings: Wallet,
  // Communication
  phone_outlined: Phone,
  phone: Phone,
  phone_android_outlined: Phone,
  phone_android: Phone,
  message_outlined: MessageSquare,
  message: MessageSquare,
  chat_outlined: MessageSquare,
  chat: MessageSquare,
  support_agent: Headphones,
  headset_mic_outlined: Headphones,
  headset_mic: Headphones,
  email_outlined: Mail,
  email: Mail,
  sms_outlined: MessageSquare,
  sms: MessageSquare,
  // Shopping
  store: Store,
  storefront: Store,
  shopping_cart: ShoppingCart,
  shopping_bag_outlined: ShoppingBag,
  shopping_bag: ShoppingBag,
  local_offer_outlined: Tag,
  local_offer: Tag,
  card_giftcard: Gift,
  local_shipping_outlined: Truck,
  local_shipping: Truck,
  qr_code_2: QrCode,
  qr_code_scanner: QrCode,
  // Travel
  flight: Plane,
  directions_car_outlined: Car,
  directions_car: Car,
  train: Train,
  directions_bus_outlined: Bus,
  directions_bus: Bus,
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  local_taxi: Car,
  // Entertainment
  movie: Film,
  music_note: Music,
  games: Gamepad2,
  sports_esports: Gamepad2,
  live_tv: Tv,
  radio: Radio,
  theaters: Film,
  event: Calendar,
  // History & Time
  history: History,
  schedule: Clock,
  access_time: Clock,
  restore: RefreshCw,
  timeline: History,
  update: RefreshCw,
  calendar_today: Calendar,
  date_range: Calendar,
  today: Calendar,
  // Analytics
  trending_up_outlined: TrendingUp,
  trending_up: TrendingUp,
  trending_down_outlined: TrendingDown,
  trending_down: TrendingDown,
  trending_flat_outlined: Minus,
  trending_flat: Minus,
  analytics_outlined: BarChart2,
  analytics: BarChart2,
  bar_chart: BarChart2,
  show_chart: LineChart,
  pie_chart: PieChart,
  // Actions
  add: Plus,
  edit: Edit,
  delete_outline: Trash,
  delete: Trash,
  search: Search,
  filter_list: Filter,
  sort: Filter,
  refresh: RefreshCw,
  download: Download,
  upload: Upload,
  share: Share,
  favorite_outline: Heart,
  favorite: Heart,
  bookmark_outline: Bookmark,
  bookmark: Bookmark,
  print: Printer,
  save: Save,
  visibility_outlined: Eye,
  visibility: Eye,
  visibility_off_outlined: EyeOff,
  visibility_off: EyeOff,
  lock_outline: Lock,
  lock: Lock,
  security: Shield,
  // Status
  check_circle_outline: CheckCircle,
  check_circle: CheckCircle,
  error_outline: AlertCircle,
  error: AlertCircle,
  warning_outlined: AlertTriangle,
  warning: AlertTriangle,
  done: Check,
  pending: Clock,
  location_on_outlined: MapPin,
  location_on: MapPin,
  gps_fixed: Navigation,
};

const getIconComponent = (
  iconName: string,
): React.ComponentType<{ size?: number; className?: string }> | null => {
  return MATERIAL_TO_LUCIDE[iconName] || null;
};

interface MobilePreviewProps {
  screen: ScreenConfig;
  selectedWidget: ContentSection | null;
  onWidgetSelect: (widget: ContentSection | null) => void;
  onDeleteWidget: (widgetId: string) => void;
  onDuplicateWidget: (widget: ContentSection) => void;
  onReorderWidgets: (newOrder: ContentSection[]) => void;
  containerBorderRadius?: number;
  navigation?: NavigationConfig;
}

// Header Balance Card with all variants (for header display area)
const HeaderBalanceCard: React.FC<{ variant: number }> = ({ variant }) => {
  const PointsBadge = ({ small = false }: { small?: boolean }) => (
    <span
      className={`inline-flex items-center text-white ${small ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"} rounded-full gap-0.5`}
      style={{ backgroundColor: THEME_COLOR }}
    >
      <span className="text-yellow-300">★</span> ****
    </span>
  );

  const ActionButtons = ({
    size = "normal",
  }: {
    size?: "small" | "normal";
  }) => {
    const btnSize =
      size === "small" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
    return (
      <div className="flex gap-1.5">
        <div
          className={`${btnSize} rounded-full bg-white/20 flex items-center justify-center text-white`}
        >
          👁
        </div>
        <div
          className={`${btnSize} rounded-full bg-white/20 flex items-center justify-center text-white`}
        >
          +
        </div>
        <div
          className={`${btnSize} rounded-full bg-white/20 flex items-center justify-center text-white`}
        >
          ↔
        </div>
      </div>
    );
  };

  const renderVariant = () => {
    switch (variant) {
      case 2: // Vertical centered
        return (
          <div className="text-center">
            <p className="text-white/70 text-sm mb-1">Saldo Tersedia</p>
            <p className="text-white font-bold text-xl mb-2">Rp ****</p>
            <div className="flex justify-center items-center gap-4">
              <PointsBadge />
              <ActionButtons size="small" />
            </div>
          </div>
        );

      case 3: // Compact horizontal
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div>
                <p className="text-white/70 text-xs">Saldo</p>
                <p className="text-white font-bold text-base">Rp ****</p>
              </div>
              <PointsBadge small />
            </div>
            <ActionButtons size="small" />
          </div>
        );

      case 4: // Split card
        return (
          <div className="flex gap-2.5">
            <div className="flex-1 p-2.5 rounded-lg bg-white/10">
              <p className="text-white/70 text-xs">Saldo</p>
              <p className="text-white font-bold text-base">Rp ****</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white/10 flex flex-col items-center gap-1.5">
              <PointsBadge small />
              <div className="flex gap-1">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px]">
                  👁
                </div>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-[10px]">
                  +
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Minimalist floating
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Saldo Tersedia</p>
              <p className="text-white font-bold text-lg mb-1">Rp ****</p>
              <PointsBadge small />
            </div>
            <div className="flex gap-1.5">
              {["👁", "+", "↔"].map((icon, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-white text-base"
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        );

      case 6: // Bottom action bar
        return (
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <div>
                <p className="text-white/70 text-sm">Saldo Tersedia</p>
                <p className="text-white font-bold text-lg">Rp ****</p>
              </div>
              <PointsBadge />
            </div>
            <div className="flex justify-around pt-2.5 border-t border-white/20">
              {[
                { icon: "👁", label: "Lihat" },
                { icon: "+", label: "Top Up" },
                { icon: "↔", label: "Transfer" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[11px] text-white"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 7: // Modern with action row
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-white/70 text-sm">Saldo Tersedia</p>
                <p className="text-white font-bold text-lg">Rp ****</p>
              </div>
              <PointsBadge />
            </div>
            <div className="flex gap-1.5">
              {["👁", "+", "↔"].map((icon, i) => (
                <div
                  key={i}
                  className="flex-1 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white text-base"
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>
        );

      case 8: // Full width with buttons
        return (
          <div>
            <div className="flex justify-between items-start mb-1.5">
              <p className="text-white/70 text-sm">Saldo Tersedia</p>
              <span className="text-white text-base">👁</span>
            </div>
            <p className="text-white font-bold text-xl mb-1">Rp ****</p>
            <PointsBadge small />
            <div className="flex gap-2.5 mt-4">
              <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/25 text-white flex items-center justify-center gap-1">
                + Deposit
              </button>
              <button className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/25 text-white flex items-center justify-center gap-1">
                ↔ Transfer
              </button>
            </div>
          </div>
        );

      default: // Variant 1: Original horizontal
        return (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/70 text-sm">Saldo Tersedia</p>
              <p className="text-white font-bold text-xl">Rp ****</p>
              <PointsBadge small />
            </div>
            <ActionButtons />
          </div>
        );
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
      {renderVariant()}
    </div>
  );
};

// Sortable Widget for Mobile Preview
const SortableMobileWidget: React.FC<{
  widget: ContentSection;
  isSelected: boolean;
  onSelect: (widget: ContentSection) => void;
  onDuplicate: (widget: ContentSection) => void;
  onDelete: (widgetId: string) => void;
}> = ({ widget, isSelected, onSelect, onDuplicate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Widget Actions */}
      <div className="absolute -top-2.5 -right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(widget);
          }}
          className="w-6 h-6 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
          style={{ backgroundColor: THEME_COLOR }}
          title="Duplicate"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(widget.instanceId);
          }}
          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-2.5 -left-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
      >
        <div className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center shadow-md">
          <GripVertical size={12} />
        </div>
      </div>

      {/* Widget Preview */}
      <div
        onClick={() => onSelect(widget)}
        className={`cursor-pointer transition-all duration-200 ${isSelected ? "ring-2 ring-offset-1 rounded-xl" : ""}`}
        style={
          isSelected
            ? ({ "--tw-ring-color": THEME_COLOR } as React.CSSProperties)
            : undefined
        }
      >
        <MobileWidgetPreview widget={widget} />
      </div>
    </div>
  );
};

const MobilePreview: React.FC<MobilePreviewProps> = ({
  screen,
  selectedWidget,
  onWidgetSelect,
  onDeleteWidget,
  onDuplicateWidget,
  onReorderWidgets,
  containerBorderRadius = 24,
  navigation,
}) => {
  const widgets = screen?.content || [];
  const headerStyle = screen?.header_style || "greeting_name";
  const headerDisplayType =
    screen?.header_display_type ||
    (screen?.balance_card ? "balance_cards" : "none");
  const actionButtons = screen?.action_buttons || [];
  const headerBackgrounds = screen?.headerBackgroundUrl || {};
  const showDragHandle = screen?.show_drag_handle !== false;
  const headerFade = screen?.headerFade !== false;
  const carouselHeight = screen?.carouselHeight || 180;

  // Navigation config
  const navConfig = navigation || {
    menuStyle: 2,
    mainMenu: [],
    moreMenu: { icon: "", label: "Lainnya", active: false, items: [] },
  };
  const activeNavItems = navConfig.mainMenu.filter((item) => item.active);
  const showMoreMenu = navConfig.moreMenu.active;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.instanceId === active.id);
      const newIndex = widgets.findIndex((w) => w.instanceId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderWidgets(arrayMove(widgets, oldIndex, newIndex));
      }
    }
  };

  // Get header display text based on header_style
  const getHeaderContent = () => {
    const greeting = "Selamat Pagi";
    const userName = "Nama User";
    const appTitle = "Nama App";

    switch (headerStyle) {
      case "name":
        return { topText: null, mainText: userName };
      case "title":
        return { topText: null, mainText: appTitle };
      case "app_title":
        return { topText: null, mainText: appTitle };
      case "greeting_name":
        return { topText: greeting, mainText: userName };
      case "greeting_title":
        return { topText: greeting, mainText: appTitle };
      case "greeting_app_title":
        return { topText: greeting, mainText: appTitle };
      case "greeting_balance":
        return { topText: greeting, mainText: null, showBalance: true };
      case "app_title_name":
        return { topText: appTitle, mainText: userName };
      case "app_title_balance":
        return { topText: appTitle, mainText: null, showBalance: true };
      case "name_balance":
        return { topText: userName, mainText: null, showBalance: true };
      case "title_balance":
        return { topText: appTitle, mainText: null, showBalance: true };
      default:
        return { topText: greeting, mainText: userName };
    }
  };

  const headerContent = getHeaderContent();

  // Get first header background image
  const headerBgImage = Object.values(headerBackgrounds)[0]?.imageUrl;

  return (
    <div className="flex justify-center items-start py-8 pb-24">
      {/* Phone Frame */}
      <div
        className="relative bg-white rounded-[40px] shadow-lg overflow-hidden border-[6px] border-gray-800 flex-shrink-0"
        style={{ width: "364px", height: "676px" }}
      >
        {/* Phone Screen */}
        <div className="relative h-full flex flex-col bg-white">
          {/* Header background with configurable height */}
          <div
            className="absolute left-0 right-0 top-0"
            style={{ height: `${Math.min(carouselHeight, 300)}px` }}
          >
            {headerBgImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${headerBgImage})` }}
              >
                {/* Header fade - gradient overlay for text readability */}
                {headerFade && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 80%)",
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
            )}
          </div>

          {/* Status Bar - transparent to allow header image edge-to-edge */}
          <div className="flex justify-between items-center px-5 py-3 text-sm text-white relative z-30">
            <span className="font-medium">9:41</span>
            <div className="flex gap-1.5">
              <div className="w-5 h-2.5 bg-white/80 rounded-sm"></div>
              <div className="w-5 h-2.5 bg-white/80 rounded-sm"></div>
              <div className="w-6 h-2.5 bg-white/80 rounded-sm"></div>
            </div>
          </div>

          {/* Header Content Area (on gradient) */}
          <div className="relative z-10 px-5 pt-3">
            {/* Top Row: Greeting/Name + Action Buttons */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {headerContent.topText && (
                  <p className="text-white/80 text-sm mb-1">
                    {headerContent.topText}
                  </p>
                )}
                {headerContent.mainText && (
                  <h1 className="text-white font-bold text-xl leading-tight">
                    {headerContent.mainText}
                  </h1>
                )}
                {headerContent.showBalance && (
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="text-white font-bold text-xl">
                      Rp ****
                    </span>
                    <span className="bg-white/20 text-white text-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="text-yellow-400">★</span> ****
                    </span>
                    <span className="text-white/80 text-lg">👁</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {actionButtons.slice(0, 2).map((btn, i) => {
                  const IconComponent = btn.icon
                    ? getIconComponent(btn.icon)
                    : null;
                  return (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      title={btn.tooltip}
                    >
                      {btn.type === "notification" ? (
                        <div className="relative">
                          {IconComponent ? (
                            <IconComponent size={22} />
                          ) : (
                            <Bell size={22} />
                          )}
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                            3
                          </span>
                        </div>
                      ) : IconComponent ? (
                        <IconComponent size={22} />
                      ) : (
                        <Settings size={22} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Header Display Area (Balance Cards / Menu Icons) - Inside gradient */}
            {headerDisplayType !== "none" && (
              <div className="mt-4">
                {headerDisplayType === "balance_cards" && (
                  <HeaderBalanceCard
                    variant={screen?.balance_card_variant || 1}
                  />
                )}

                {headerDisplayType === "menu_icons" &&
                  screen?.header_menu_icons && (
                    <div className="flex justify-around py-3">
                      {screen.header_menu_icons.slice(0, 4).map((item, i) => (
                        <div key={i} className="text-center">
                          <div className="w-12 h-12 mx-auto mb-1.5">
                            <IconRenderer iconUrl={item.iconUrl} size="md" />
                          </div>
                          <span className="text-white text-sm">
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Content Area - White Rounded Container */}
          <div
            className="relative z-10 bg-white flex-1 mt-4 overflow-hidden flex flex-col"
            style={{
              borderTopLeftRadius: `${containerBorderRadius}px`,
              borderTopRightRadius: `${containerBorderRadius}px`,
            }}
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Drag Handle - inside scrollable area */}
              {showDragHandle && (
                <div className="flex justify-center py-4 -mx-4 sticky top-0 bg-white">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
              )}
              {widgets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🧩</div>
                  <h3 className="text-base font-medium text-gray-600 mb-1">
                    Kanvas Kosong
                  </h3>
                  <p className="text-sm text-gray-400">
                    Drag widget dari sidebar
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={widgets.map((w) => w.instanceId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {widgets.map((widget) => (
                        <SortableMobileWidget
                          key={widget.instanceId}
                          widget={widget}
                          isSelected={
                            selectedWidget?.instanceId === widget.instanceId
                          }
                          onSelect={onWidgetSelect}
                          onDuplicate={onDuplicateWidget}
                          onDelete={onDeleteWidget}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Bottom Navigation Preview - styled based on navigation config */}
          {navConfig.menuStyle === 1 ? (
            // Style 1: Floating Dock
            <div className="bg-white px-4 py-3">
              <div className="flex justify-center">
                <div className="bg-white shadow-lg rounded-full px-5 py-2.5 flex items-center gap-5 border border-gray-200">
                  {activeNavItems.length > 0 ? (
                    <>
                      {activeNavItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1"
                        >
                          {item.icon ? (
                            <img
                              src={item.icon}
                              alt={item.label}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded bg-gray-300" />
                          )}
                          <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                            {item.label}
                          </span>
                        </div>
                      ))}
                      {showMoreMenu && (
                        <div className="flex flex-col items-center gap-1">
                          {navConfig.moreMenu.icon ? (
                            <img
                              src={navConfig.moreMenu.icon}
                              alt={navConfig.moreMenu.label}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded bg-gray-300" />
                          )}
                          <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                            {navConfig.moreMenu.label}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback placeholder
                    <>
                      {["Home", "Menu", "History", "Profile"].map(
                        (label, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center gap-1"
                          >
                            <div
                              className={`w-6 h-6 rounded ${idx === 0 ? "" : "bg-gray-300"}`}
                              style={
                                idx === 0
                                  ? { backgroundColor: THEME_COLOR }
                                  : undefined
                              }
                            />
                            <span
                              className={`text-[10px] truncate ${idx === 0 ? "" : "text-gray-400"}`}
                              style={
                                idx === 0 ? { color: THEME_COLOR } : undefined
                              }
                            >
                              {label}
                            </span>
                          </div>
                        ),
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : navConfig.menuStyle === 3 ? (
            // Style 3: Bar Bawah Geser (with drag handle, no more menu)
            <div className="bg-white border-t border-gray-200 px-4 pt-2 pb-3">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <div className="flex items-center justify-around">
                {activeNavItems.length > 0
                  ? activeNavItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1"
                      >
                        {item.icon ? (
                          <img
                            src={item.icon}
                            alt={item.label}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-300" />
                        )}
                        <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                          {item.label}
                        </span>
                      </div>
                    ))
                  : ["Home", "Menu", "History", "Profile"].map((label, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className={`w-6 h-6 rounded ${idx === 0 ? "" : "bg-gray-300"}`}
                          style={
                            idx === 0
                              ? { backgroundColor: THEME_COLOR }
                              : undefined
                          }
                        />
                        <span
                          className={`text-[10px] truncate ${idx === 0 ? "" : "text-gray-400"}`}
                          style={idx === 0 ? { color: THEME_COLOR } : undefined}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
              </div>
            </div>
          ) : navConfig.menuStyle === 4 ? (
            // Style 4: Bar Tengah Menonjol (emphasized center)
            <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-end justify-around relative">
              {activeNavItems.length > 0
                ? activeNavItems.map((item, idx) => {
                    const centerIndex = Math.floor(activeNavItems.length / 2);
                    if (idx === centerIndex) {
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center -mt-5"
                        >
                          <div
                            className="rounded-full p-3.5 shadow-lg border-4 border-white"
                            style={{ backgroundColor: THEME_COLOR }}
                          >
                            {item.icon ? (
                              <img
                                src={item.icon}
                                alt={item.label}
                                className="w-7 h-7 object-contain brightness-0 invert"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="w-7 h-7 bg-white/50 rounded" />
                            )}
                          </div>
                          <span
                            className="text-[10px] font-medium truncate max-w-[52px] mt-1"
                            style={{ color: THEME_COLOR }}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1"
                      >
                        {item.icon ? (
                          <img
                            src={item.icon}
                            alt={item.label}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-gray-300" />
                        )}
                        <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                          {item.label}
                        </span>
                      </div>
                    );
                  })
                : ["Home", "Menu", "Scan", "History", "Profile"].map(
                    (label, idx) => {
                      if (idx === 2) {
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center -mt-5"
                          >
                            <div
                              className="rounded-full p-3.5 shadow-lg border-4 border-white"
                              style={{ backgroundColor: THEME_COLOR }}
                            >
                              <div className="w-7 h-7 bg-white/50 rounded" />
                            </div>
                            <span
                              className="text-[10px] font-medium truncate max-w-[52px] mt-1"
                              style={{ color: THEME_COLOR }}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="w-6 h-6 rounded bg-gray-300" />
                          <span className="text-[10px] text-gray-400 truncate">
                            {label}
                          </span>
                        </div>
                      );
                    },
                  )}
              {showMoreMenu && (
                <div className="flex flex-col items-center gap-1">
                  {navConfig.moreMenu.icon ? (
                    <img
                      src={navConfig.moreMenu.icon}
                      alt={navConfig.moreMenu.label}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-300" />
                  )}
                  <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                    {navConfig.moreMenu.label}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Style 2 (default): Bar Bawah Statis
            <div className="bg-white border-t border-gray-200 flex items-center justify-around px-5 py-3">
              {activeNavItems.length > 0 ? (
                <>
                  {activeNavItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.label}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-300" />
                      )}
                      <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                        {item.label}
                      </span>
                    </div>
                  ))}
                  {showMoreMenu && (
                    <div className="flex flex-col items-center gap-1">
                      {navConfig.moreMenu.icon ? (
                        <img
                          src={navConfig.moreMenu.icon}
                          alt={navConfig.moreMenu.label}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-300" />
                      )}
                      <span className="text-[10px] text-gray-600 truncate max-w-[52px]">
                        {navConfig.moreMenu.label}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                // Fallback placeholder when no navigation configured
                <>
                  {["Home", "Menu", "History", "Profile"].map((label, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded ${idx === 0 ? "" : "bg-gray-300"}`}
                        style={
                          idx === 0
                            ? { backgroundColor: THEME_COLOR }
                            : undefined
                        }
                      />
                      <span
                        className={`text-[10px] truncate ${idx === 0 ? "" : "text-gray-400"}`}
                        style={idx === 0 ? { color: THEME_COLOR } : undefined}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Home indicator */}
          <div className="bg-white pb-3 pt-1.5">
            <div className="flex justify-center">
              <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;
