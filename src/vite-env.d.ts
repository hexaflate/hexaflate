interface ImportMetaEnv {
  // Base VITE_ variables (fallback for unmatched domains)
  readonly VITE_API_ENDPOINTS: string;
  readonly VITE_X_TOKEN_VALUE: string;
  readonly VITE_WS_BACKEND_HOST: string;
  readonly VITE_WEB_TITLE: string;
  readonly VITE_WEB_FAVICON: string;
  readonly VITE_WEBREPORT_THEME_COLOR: string;
  readonly VITE_WEBREPORT_THEME_COLOR_LIGHT: string;
  
  // _DEV suffixed (localhost:4000, web.hexaloom.com)
  readonly VITE_API_ENDPOINTS_DEV: string;
  readonly VITE_X_TOKEN_VALUE_DEV: string;
  readonly VITE_WS_BACKEND_HOST_DEV: string;
  readonly VITE_WEB_TITLE_DEV: string;
  readonly VITE_WEB_FAVICON_DEV: string;
  readonly VITE_WEBREPORT_THEME_COLOR_DEV: string;
  readonly VITE_WEBREPORT_THEME_COLOR_LIGHT_DEV: string;
  
  // Add more suffixed variables here for other domains:
  // readonly VITE_API_ENDPOINTS_STAGING: string;
  // readonly VITE_API_ENDPOINTS_PROD: string;
  
  // Allow dynamic access with string index
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
