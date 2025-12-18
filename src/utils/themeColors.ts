import { domainConfig } from '../config/domainConfig';

// Theme colors from domain config with fallback
export const THEME_COLOR = domainConfig.themeColor;
export const THEME_COLOR_LIGHT = domainConfig.themeColorLight;

// Color utility functions (must be defined before injectThemeStyles)
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const adjustColor = (hex: string, percent: number) => {
  const rgb = hexToRgb(hex);
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  const r = clamp(percent > 0 ? rgb.r + (255 - rgb.r) * (percent / 100) : rgb.r * (1 + percent / 100));
  const g = clamp(percent > 0 ? rgb.g + (255 - rgb.g) * (percent / 100) : rgb.g * (1 + percent / 100));
  const b = clamp(percent > 0 ? rgb.b + (255 - rgb.b) * (percent / 100) : rgb.b * (1 + percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const darkenColor = (hex: string, percent: number) => adjustColor(hex, -percent);
export const lightenColor = (hex: string, percent: number) => adjustColor(hex, percent);

export const withOpacity = (hex: string, opacity: number) => {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Derived theme colors
export const THEME_COLOR_DARK = darkenColor(THEME_COLOR, 15);
export const THEME_COLOR_DARKER = darkenColor(THEME_COLOR, 25);
export const THEME_COLOR_VERY_LIGHT = lightenColor(THEME_COLOR, 85);
export const THEME_COLOR_LIGHT_VERY_LIGHT = lightenColor(THEME_COLOR_LIGHT, 85);
export const THEME_COLOR_LIGHT_DARK = darkenColor(THEME_COLOR_LIGHT, 15);
export const THEME_COLOR_LIGHT_BG = lightenColor(THEME_COLOR, 95);

// For sidebar backgrounds (darker versions)
export const SIDEBAR_BG_FROM = darkenColor(THEME_COLOR, 70);
export const SIDEBAR_BG_TO = darkenColor(THEME_COLOR, 55);

// Inject CSS custom properties for theme colors
export const injectThemeStyles = () => {
  const styleId = 'theme-colors-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  const rgb = hexToRgb(THEME_COLOR);
  const rgbLight = hexToRgb(THEME_COLOR_LIGHT);
  const darkColor = darkenColor(THEME_COLOR, 15);
  const darkerColor = darkenColor(THEME_COLOR, 25);
  
  styleEl.textContent = `
    :root {
      --theme-color: ${THEME_COLOR};
      --theme-color-light: ${THEME_COLOR_LIGHT};
      --theme-color-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
      --theme-color-light-rgb: ${rgbLight.r}, ${rgbLight.g}, ${rgbLight.b};
      --gradient-success: linear-gradient(135deg, ${THEME_COLOR} 0%, ${darkColor} 100%);
      --color-success: ${THEME_COLOR};
    }
    
    /* Override btn-success */
    .btn-success {
      background: linear-gradient(135deg, ${THEME_COLOR} 0%, ${darkColor} 100%) !important;
    }
    .btn-success:hover {
      background: linear-gradient(135deg, ${darkColor} 0%, ${darkerColor} 100%) !important;
    }
    
    /* Override Tailwind primary colors with theme colors */
    .bg-primary-500, .bg-primary-600 {
      background-color: ${THEME_COLOR} !important;
    }
    /* Toggle switches - peer-checked state */
    .peer:checked ~ .peer-checked\\:bg-primary-600,
    .peer:checked ~ .peer-checked\\:bg-primary-500 {
      background-color: ${THEME_COLOR} !important;
    }
    .bg-primary-50, .bg-primary-100 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .bg-primary-200 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .bg-primary-300, .bg-primary-400 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6) !important;
    }
    .bg-primary-700, .bg-primary-800 {
      background-color: ${darkColor} !important;
    }
    .text-primary-500, .text-primary-600 {
      color: ${THEME_COLOR} !important;
    }
    .text-primary-700, .text-primary-800, .text-primary-900 {
      color: ${darkColor} !important;
    }
    .text-primary-400 {
      color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7) !important;
    }
    .border-primary-200 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .border-primary-300, .border-primary-400 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }
    .border-primary-500, .border-primary-600 {
      border-color: ${THEME_COLOR} !important;
    }
    .ring-primary-200, .ring-primary-100 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .ring-primary-300 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .ring-primary-400, .ring-primary-500 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .focus\\:ring-primary-500:focus, .focus\\:ring-primary-400:focus {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .focus\\:ring-primary-400\\/50:focus {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) !important;
    }
    .focus\\:ring-primary-100:focus, .focus\\:ring-primary-200:focus, .focus\\:ring-primary-300:focus {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .peer-focus\\:ring-primary-300 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .focus\\:border-primary-400:focus, .focus\\:border-primary-500:focus {
      border-color: ${THEME_COLOR} !important;
    }
    .hover\\:bg-primary-50:hover {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important;
    }
    .hover\\:bg-primary-100:hover {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .hover\\:bg-primary-200:hover {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .hover\\:bg-primary-600:hover, .hover\\:bg-primary-700:hover {
      background-color: ${darkColor} !important;
    }
    .hover\\:text-primary-600:hover, .hover\\:text-primary-700:hover, .hover\\:text-primary-800:hover {
      color: ${darkColor} !important;
    }
    .hover\\:border-primary-300:hover, .hover\\:border-primary-400:hover {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .from-primary-500, .from-primary-600 {
      --tw-gradient-from: ${THEME_COLOR} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .from-primary-50, .from-primary-100 {
      --tw-gradient-from: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .from-primary-400 {
      --tw-gradient-from: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8) var(--tw-gradient-from-position) !important;
    }
    .to-primary-600, .to-primary-700 {
      --tw-gradient-to: ${darkColor} var(--tw-gradient-to-position) !important;
    }
    .to-primary-100, .to-primary-200 {
      --tw-gradient-to: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) var(--tw-gradient-to-position) !important;
    }
    .hover\\:from-primary-600:hover {
      --tw-gradient-from: ${darkColor} var(--tw-gradient-from-position) !important;
    }
    .hover\\:to-primary-700:hover {
      --tw-gradient-to: ${darkerColor} var(--tw-gradient-to-position) !important;
    }
    
    /* Blue color overrides */
    .bg-blue-500, .bg-blue-600 {
      background-color: ${THEME_COLOR} !important;
    }
    .bg-blue-50, .bg-blue-100 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .text-blue-500, .text-blue-600, .text-blue-700, .text-blue-800, .text-blue-900 {
      color: ${THEME_COLOR} !important;
    }
    .border-blue-200, .border-blue-300, .border-blue-400 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .border-blue-500, .border-blue-600 {
      border-color: ${THEME_COLOR} !important;
    }
    .ring-blue-400, .ring-blue-500 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .hover\\:border-blue-400:hover {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .from-blue-600, .from-blue-800 {
      --tw-gradient-from: ${THEME_COLOR} var(--tw-gradient-from-position) !important;
    }
    .to-blue-800 {
      --tw-gradient-to: ${darkerColor} var(--tw-gradient-to-position) !important;
    }
    
    /* Accent color overrides to use theme light color */
    .from-accent-100, .to-accent-100 {
      --tw-gradient-from: rgba(${rgbLight.r}, ${rgbLight.g}, ${rgbLight.b}, 0.15) var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgba(${rgbLight.r}, ${rgbLight.g}, ${rgbLight.b}, 0.15) var(--tw-gradient-to-position) !important;
    }
    
    /* Green color overrides */
    .bg-green-400, .bg-green-500, .bg-green-600 {
      background-color: ${THEME_COLOR} !important;
    }
    .bg-green-50 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important;
    }
    .bg-green-100 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .bg-green-200 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .text-green-400, .text-green-500, .text-green-600 {
      color: ${THEME_COLOR} !important;
    }
    .text-green-700, .text-green-800, .text-green-900 {
      color: ${darkColor} !important;
    }
    .border-green-200 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .border-green-300, .border-green-400 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }
    .border-green-500, .border-green-600 {
      border-color: ${THEME_COLOR} !important;
    }
    .border-b-green-600 {
      border-bottom-color: ${THEME_COLOR} !important;
    }
    .ring-green-400, .ring-green-500 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .focus\\:ring-green-500:focus {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
    }
    .focus\\:border-green-500:focus {
      border-color: ${THEME_COLOR} !important;
    }
    
    /* Emerald color overrides */
    .bg-emerald-500, .bg-emerald-600 {
      background-color: ${THEME_COLOR} !important;
    }
    .bg-emerald-50 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important;
    }
    .bg-emerald-100 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .bg-emerald-200, .bg-emerald-200\\/50 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .text-emerald-500, .text-emerald-600 {
      color: ${THEME_COLOR} !important;
    }
    .text-emerald-700, .text-emerald-800, .text-emerald-900 {
      color: ${darkColor} !important;
    }
    .border-emerald-200 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .border-emerald-500, .border-emerald-600 {
      border-color: ${THEME_COLOR} !important;
    }
    .from-emerald-100 {
      --tw-gradient-from: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) var(--tw-gradient-from-position) !important;
    }
    .to-emerald-200, .to-emerald-200\\/50 {
      --tw-gradient-to: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) var(--tw-gradient-to-position) !important;
    }
    
    /* Success color overrides (custom Tailwind colors) */
    .bg-success-500, .bg-success-600 {
      background-color: ${THEME_COLOR} !important;
    }
    .bg-success-400 {
      background-color: ${THEME_COLOR_LIGHT} !important;
    }
    .bg-success-700 {
      background-color: ${darkColor} !important;
    }
    .bg-success-50 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important;
    }
    .bg-success-100, .bg-success-100\\/80, .bg-success-100\\/50 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .bg-success-200, .bg-success-200\\/50, .bg-success-200\\/80 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .bg-success-500\\/10, .bg-success-500\\/20, .bg-success-500\\/30, .bg-success-500\\/80 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .bg-success-600\\/10 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .bg-success-50\\/30, .bg-success-50\\/50, .bg-success-50\\/80 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important;
    }
    .text-success-300, .text-success-400 {
      color: ${THEME_COLOR_LIGHT} !important;
    }
    .text-success-500, .text-success-600 {
      color: ${THEME_COLOR} !important;
    }
    .text-success-700, .text-success-800 {
      color: ${darkColor} !important;
    }
    .border-success-100, .border-success-100\\/80 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important;
    }
    .border-success-200, .border-success-200\\/50, .border-success-200\\/80 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .border-success-300 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .border-success-400, .border-success-400\\/40 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }
    .border-success-500, .border-success-600 {
      border-color: ${THEME_COLOR} !important;
    }
    .border-b-success-600 {
      border-bottom-color: ${THEME_COLOR} !important;
    }
    .ring-success-200 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important;
    }
    .ring-success-400, .ring-success-400\\/50, .ring-success-500, .ring-success-500\\/20, .ring-success-500\\/30 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }
    .focus\\:ring-success-400:focus, .focus\\:ring-success-400\\/50:focus, .focus\\:ring-success-500:focus, .focus\\:ring-success-500\\/20:focus, .focus\\:ring-success-500\\/30:focus {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }
    .focus\\:border-success-400:focus, .focus\\:border-success-500:focus {
      border-color: ${THEME_COLOR} !important;
    }
    .from-success-50, .from-success-100 {
      --tw-gradient-from: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .from-success-500, .from-success-600 {
      --tw-gradient-from: ${THEME_COLOR} var(--tw-gradient-from-position) !important;
      --tw-gradient-to: rgb(255 255 255 / 0) var(--tw-gradient-to-position) !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .from-success-500\\/10, .from-success-600\\/10 {
      --tw-gradient-from: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) var(--tw-gradient-from-position) !important;
    }
    .to-success-50, .to-success-100, .to-success-100\\/50, .to-success-100\\/80 {
      --tw-gradient-to: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) var(--tw-gradient-to-position) !important;
    }
    .to-success-200, .to-success-200\\/50 {
      --tw-gradient-to: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) var(--tw-gradient-to-position) !important;
    }
    .to-success-600, .to-success-700 {
      --tw-gradient-to: ${darkColor} var(--tw-gradient-to-position) !important;
    }
    .to-success-600\\/10 {
      --tw-gradient-to: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) var(--tw-gradient-to-position) !important;
    }
    .hover\\:bg-success-50:hover, .hover\\:bg-success-50\\/50:hover {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important;
    }
    .hover\\:bg-success-100:hover, .hover\\:bg-success-200\\/80:hover {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important;
    }
    .hover\\:bg-success-500:hover, .hover\\:bg-success-500\\/30:hover {
      background-color: ${THEME_COLOR} !important;
    }
    .hover\\:bg-success-600:hover, .hover\\:bg-success-700:hover {
      background-color: ${darkColor} !important;
    }
    .hover\\:text-success-600:hover, .hover\\:text-success-700:hover {
      color: ${darkColor} !important;
    }
    .hover\\:border-success-200\\/80:hover, .hover\\:border-success-300:hover {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .hover\\:from-success-600:hover {
      --tw-gradient-from: ${darkColor} var(--tw-gradient-from-position) !important;
    }
    .hover\\:to-success-700:hover {
      --tw-gradient-to: ${darkerColor} var(--tw-gradient-to-position) !important;
    }
  `;
};

// Common style generators for buttons, inputs, badges, etc.
export const getButtonStyle = (opacity = 0.8) => ({
  backgroundColor: withOpacity(THEME_COLOR, opacity),
  borderColor: withOpacity(THEME_COLOR_LIGHT, 0.4),
  borderWidth: '1px',
  borderStyle: 'solid' as const
});

export const getGradientStyle = (direction = 'to right') => ({
  background: `linear-gradient(${direction}, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`
});

export const getGradientDarkStyle = (direction = 'to bottom right') => ({
  background: `linear-gradient(${direction}, ${THEME_COLOR_DARK}, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`
});

export const getFocusRingStyle = () => ({
  '--tw-ring-color': withOpacity(THEME_COLOR, 0.3),
  borderColor: THEME_COLOR_LIGHT
});

export const getBadgeStyle = (isActive = true) => isActive ? ({
  backgroundColor: withOpacity(THEME_COLOR, 0.1),
  color: THEME_COLOR_DARK,
  borderColor: withOpacity(THEME_COLOR, 0.2)
}) : {};

export const getActiveTabStyle = () => ({
  background: `linear-gradient(to right, ${withOpacity(THEME_COLOR, 0.1)}, ${withOpacity(THEME_COLOR_LIGHT, 0.1)})`,
  color: THEME_COLOR_DARK,
  borderBottomColor: THEME_COLOR,
  borderBottomWidth: '2px'
});

export const getIconContainerStyle = () => ({
  background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})`
});

export const getCardBgStyle = () => ({
  background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.05)}, ${withOpacity(THEME_COLOR_LIGHT, 0.1)})`
});
