export interface DynamicScreenConfig {
  globalTheming?: GlobalTheming;
  screens: Record<string, ScreenConfig>;
  navigation?: NavigationConfig;
}

export interface GlobalTheming {
  lightTheme?: ThemeColors;
  darkTheme?: ThemeColors;
  containerBorderRadius?: number;
  welcomePoster?: WelcomePoster;
  loginMarkdownUrl?: string; // Optional markdown URL to replace login screen content
  loginBackgroundImageUrl?: string; // Optional background image URL for login screen
  // Login text content customizations
  loginSubtitle?: string; // Subtitle text (e.g., "Masukkan Nomor Handphone")
  loginDescription?: string; // Description paragraph text
  // Login text color customizations
  loginLogoTextColor?: string;
  loginTitleColor?: string;
  loginSubtitleColor?: string;
  loginParagraphColor?: string;
  // Markdown text color customizations
  loginMarkdownH1Color?: string;
  loginMarkdownH2Color?: string;
  loginMarkdownH3Color?: string;
  loginMarkdownH4Color?: string;
  loginMarkdownH5Color?: string;
  loginMarkdownH6Color?: string;
  loginMarkdownParagraphColor?: string;
  loginMarkdownBoldColor?: string;
  // Customer service button customizations
  loginCustomerServiceButtonEnabled?: boolean;
  loginCustomerServiceButtonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // Menu Deposit customizations
  menuDepositShowBalanceCard?: string; // "true" or "false"
  menuDepositTermsMarkdownUrl?: string; // URL to markdown file for terms
  menuDepositTermsText?: string; // Plain text for terms
  menuDepositNominals?: string; // Comma-separated list of nominals (e.g., "50000,100000,200000")
  // Settings screen customizations
  settingsItems?: string; // JSON array of settings items with enabled/order/section
  settingsShowLogout?: string; // "true" or "false"
  settingsSections?: string; // JSON array of section configs with id, label, icon
  // Allow dynamic keys for distro suffix support
  [key: string]: string | boolean | number | ThemeColors | WelcomePoster | undefined;
}

export interface ThemeColors {
  surfaceColor?: string;
  gradiantButtonTailColor?: string;
  gradiantButtonDisabledColor?: string;
  gradiantButtonDisabledTextColor?: string;
  paragraphTextColor?: string;
}

export interface WelcomePoster {
  imageUrl: string;
  title?: string;
  padding?: Padding;
  borderRadius?: number;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
  clonedFromMenuId?: string; // ID of the menu item this welcome poster is cloned from
  autoDismissSeconds?: number;
}

export interface ScreenConfig {
  screen: string;
  balance_card?: boolean;
  balance_card_variant?: number;
  header_style?: 'greeting_name' | 'greeting_title' | 'greeting_app_title' | 'greeting_balance' | 'name' | 'title' | 'app_title' | 'app_title_name' | 'app_title_title' | 'app_title_balance' | 'name_app_title' | 'name_title' | 'name_balance' | 'title_name' | 'title_app_title' | 'title_balance';
  header_display_type?: 'none' | 'balance_cards' | 'menu_icons'; // Display type for header area
  header_menu_icons?: HeaderMenuItem[]; // Menu icons for header when header_display_type is 'menu_icons'
  show_drag_handle?: boolean; // Show/hide drag handle indicator (default: true)
  action_buttons?: ActionButton[];
  headerBackgroundUrl?: Record<string, HeaderBackground>;
  headerFade?: boolean;
  carouselHeight?: number;
  screenTitle?: string;
  content: ContentSection[];
}

export interface HeaderMenuItem {
  iconUrl: string;
  title: string;
  textSize?: number;
  route?: string;
  routeArgs?: RouteArgs;
  url?: string;
}

export interface ActionButton {
  icon: string;
  route?: string;
  url?: string;
  type?: string;
  tooltip?: string;
  title?: string; // Screen title for products/webview
  routeArgs?: RouteArgs;
}

export interface HeaderBackground {
  imageUrl: string;
  title?: string;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
}

export interface ContentSection {
  id: string; // Widget type identifier (e.g., "title", "banner_slider")
  instanceId: string; // Unique instance identifier for selection
  title?: TitleConfig;
  layoutVariant?: "default" | "monocle";
  height?: number;
  width?: number;
  spacing?: number;
  borderRadius?: number;
  backgroundColor?: string;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  showIndicators?: boolean;
  showFade?: boolean;
  banners?: Banner[];
  items?: MenuItem[];
  url?: string;
  enableJavaScript?: boolean;
  enableScrolling?: boolean;
  showRefreshButton?: boolean;
  padding?: Padding;
  margin?: Margin;
  frame?: Frame; // Frame configuration for icon groups
  count?: number; // Number of items to display (for history widgets)
  cards?: CardItem[]; // Cards widget items
  gridColumns?: number; // Number of columns for cards grid (1 or 2)
  // Balance card widget properties
  balance_card_variant?: number; // Balance card variant (1-7)
  balance_card_background?: 'none' | 'solid' | 'gradient' | 'image'; // Background type
  balance_card_color?: string; // Solid background color
  balance_card_gradient?: GradientConfig; // Gradient configuration
  balance_card_image?: string; // Background image URL
}

export interface TitleConfig {
  text: string;
  type?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  display?: "left" | "center" | "right" | "justify";
  color?: string;
  darkModeColor?: string;
}

export interface MenuItem {
  id?: string; // Menu instance ID
  menu_id?: string; // Menu-specific identifier (e.g., menu_pulsa_123)
  iconUrl: string;
  title: string;
  route?: string;
  routeArgs?: RouteArgs;
  url?: string;
  textSize?: number;
  textColor?: string;
  submenu?: SubmenuConfig;
  submenuStyle?: "fullScreen" | "bottomSheet";
  submenuLayout?: "grid" | "list";
  submenuTitle?: string;
}

export interface SubmenuConfig {
  id: string;
  submenuTitle: string;
  submenuStyle: "fullScreen" | "bottomSheet";
  submenuLayout: "grid" | "list";
  items: MenuItem[];
}

export interface Banner {
  imageUrl: string;
  title?: string;
  titleFontSize?: number;
  titlePosition?: TitlePosition;
  titleTextShadow?: boolean;
  titleTextShadowColor?: string;
  titleTextShadowOpacity?: number;
  padding?: Padding;
  borderRadius?: number;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
  clonedFromMenuId?: string; // ID of the menu item this banner is cloned from
}

export interface TitlePosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  center?: boolean;
}

export interface Padding {
  all?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface Margin {
  all?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface BorderConfig {
  color: string;
  width: number;
}

export interface BoxShadowConfig {
  color: string;
  opacity: number;
  blurRadius: number;
  offsetX: number;
  offsetY: number;
}

export interface Frame {
  width?: number;
  height?: number;
  borderRadius?: number;
  borderLine?: boolean;
  shadow?: boolean;
  padding?: Padding;
}

export interface CardItem {
  id?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;
  height?: number;
  borderRadius?: number;
  padding?: Padding;
  route?: string;
  routeArgs?: RouteArgs;
  url?: string;
  action_buttons?: ActionButton[]; // Up to 3 action buttons for the card
}

export interface GradientConfig {
  colors: string[];
  begin?: string; // e.g., "topLeft", "topCenter", "topRight", "centerLeft", "center", "centerRight", "bottomLeft", "bottomCenter", "bottomRight"
  end?: string;
}

export interface NavigationConfig {
  menuStyle: number;
  mainMenu: NavigationItem[];
  moreMenu: MoreMenu;
}

export interface NavigationItem {
  icon: string;
  label: string;
  dynamic?: string;
  screen?: string;
  route?: string;
  url?: string;
  routeArgs?: RouteArgs;
  active: boolean;
}

export interface MoreMenu {
  icon: string;
  label: string;
  active: boolean;
  items: NavigationItem[];
}

// Centralized Route Arguments Types
export interface RouteArgs {
  // Common properties
  url?: string;
  title?: string;
  headers?: Record<string, string>;
  includeAuth?: boolean;
  
  // WebView specific
  enableJavaScript?: boolean;
  enableScrolling?: boolean;
  webviewBelowButton?: WebViewBelowButtonConfig;
  
  // Product specific
  operators?: string[];
  hintText?: string;
  alphanumeric?: boolean;
  trailingNumbers?: boolean;
  hintLastDestination?: string;
  infoBox?: InfoBoxConfig;
  
  // Payment specific
  productKode?: string;
  operator?: string;
  destUrl?: string;
  
  // Source data
  _bannerData?: Record<string, any>;
  screenTitle?: string;
  __fromWebView?: boolean;
}

export interface InfoBoxConfig {
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface WebViewBelowButtonConfig {
  text: string;
  icon?: string;
  style?: 'gradient' | 'outlined';
  route: string;
  routeArgs?: Record<string, any>;
}

export interface WebViewRouteArgs extends RouteArgs {
  url: string;
  title?: string;
  headers?: Record<string, string>;
  includeAuth?: boolean;
  enableJavaScript?: boolean;
  enableScrolling?: boolean;
  webviewBelowButton?: WebViewBelowButtonConfig;
}

export interface ProductRouteArgs extends RouteArgs {
  operators?: string[];
  hintText?: string;
  alphanumeric?: boolean;
  trailingNumbers?: boolean;
  hintLastDestination?: string;
  infoBox?: InfoBoxConfig;
}

export interface WidgetType {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultConfig: Partial<ContentSection>;
}
