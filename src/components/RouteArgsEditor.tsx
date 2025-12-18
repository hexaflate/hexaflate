import React, { useState, useEffect } from 'react';
import { RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import { getRoutesByCategory } from '../data/routeConfig';
import RouteArgsConfig from './RouteArgsConfig';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface RouteArgsEditorProps {
  route?: string;
  url?: string;
  routeArgs?: RouteArgs;
  onChange: (config: { route?: string; url?: string; routeArgs?: RouteArgs }) => void;
  className?: string;
  showValidation?: boolean;
  allowUrlMode?: boolean;
  allowRouteMode?: boolean;
}

const RouteArgsEditor: React.FC<RouteArgsEditorProps> = ({
  route,
  url,
  routeArgs,
  onChange,
  className = '',
  showValidation = true,
  allowUrlMode = true,
  allowRouteMode = true
}) => {
  const [navigationType, setNavigationType] = useState<'route' | 'url' | 'none'>('none');
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: []
  });
  const [showArgs, setShowArgs] = useState(false);

  // Determine initial navigation type
  useEffect(() => {
    if (route) {
      setNavigationType('route');
    } else if (url) {
      setNavigationType('url');
    } else {
      setNavigationType('none');
    }
  }, [route, url]);

  // Validate navigation configuration
  useEffect(() => {
    if (showValidation && navigationType !== 'none') {
      const config = { route, url, routeArgs };
      const validationResult = RouteArgsManager.validateNavigationConfig(config);
      setValidation(validationResult);
    } else if (navigationType === 'none') {
      // No validation needed when no navigation is selected
      setValidation({ isValid: true, errors: [] });
    }
  }, [route, url, routeArgs, showValidation, navigationType]);

  // Handle navigation type change
  const handleNavigationTypeChange = (type: 'route' | 'url' | 'none') => {
    setNavigationType(type);
    
    if (type === 'route') {
      onChange({
        route: route || '/product',
        url: undefined,
        routeArgs: routeArgs || {}
      });
    } else if (type === 'url') {
      onChange({
        route: undefined,
        url: url || 'https://example.com',
        routeArgs: undefined // External URLs don't need route arguments
      });
    } else {
      onChange({
        route: undefined,
        url: undefined,
        routeArgs: undefined
      });
    }
  };

  // Handle route change
  const handleRouteChange = (newRoute: string) => {
    const defaultArgs = RouteArgsManager.getDefaultArgsForRoute(newRoute);
    onChange({
      route: newRoute,
      url: undefined,
      routeArgs: defaultArgs || {}
    });
  };

  // Handle URL change
  const handleUrlChange = (newUrl: string) => {
    onChange({
      route: undefined,
      url: newUrl,
      routeArgs: undefined // External URLs don't need route arguments
    });
  };

  // Handle route args change
  const handleRouteArgsChange = (newRouteArgs: RouteArgs | undefined) => {
    onChange({
      route,
      url,
      routeArgs: newRouteArgs
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Navigation Type Toggle Buttons */}
      <div className="flex gap-1.5">
        {allowRouteMode && (
          <button
            type="button"
            onClick={() => handleNavigationTypeChange('route')}
            className={`flex-1 px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
              navigationType === 'route' 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm' 
                : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80'
            }`}
          >
            Rute
          </button>
        )}
        {allowUrlMode && (
          <button
            type="button"
            onClick={() => handleNavigationTypeChange('url')}
            className={`flex-1 px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
              navigationType === 'url' 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm' 
                : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80'
            }`}
          >
            URL
          </button>
        )}
        <button
          type="button"
          onClick={() => handleNavigationTypeChange('none')}
          className={`flex-1 px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
            navigationType === 'none' 
              ? 'bg-gradient-to-r from-neutral-500 to-neutral-600 text-white shadow-sm' 
              : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/80'
          }`}
        >
          Tidak Ada
        </button>
      </div>

      {/* Route Selection */}
      {navigationType === 'route' && (
        <div>
          <label className="text-xs font-medium text-neutral-600 block mb-1.5">Rute</label>
          <select
            className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 backdrop-blur-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            value={route || ''}
            onChange={(e) => handleRouteChange(e.target.value)}
          >
            <option value="">Pilih rute...</option>
            {Object.entries(getRoutesByCategory()).map(([category, routes]) => (
              <optgroup key={category} label={category}>
                {routes.map(routeInfo => (
                  <option key={routeInfo.value} value={routeInfo.value}>
                    {routeInfo.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* URL Input */}
      {navigationType === 'url' && (
        <div>
          <label className="text-xs font-medium text-neutral-600 block mb-1.5">URL Eksternal</label>
          <input
            type="text"
            className="w-full px-3 py-2 text-sm border border-neutral-200/80 rounded-xl bg-white/80 backdrop-blur-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-neutral-400"
            value={url || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      )}

      {/* Route Arguments Configuration - collapsible (only for /product and /webview) */}
      {navigationType === 'route' && routeArgs && (route === '/product' || route === '/webview') && (
        <div>
          <button
            type="button"
            onClick={() => setShowArgs(!showArgs)}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium transition-colors"
          >
            {showArgs ? '▼' : '▶'} Argumen {route && `(${route})`}
          </button>
          {showArgs && (
            <div className="mt-2 p-3 bg-neutral-50/50 rounded-xl border border-neutral-100 text-sm">
              <RouteArgsConfig
                route={route || '/webview'}
                routeArgs={routeArgs}
                onChange={handleRouteArgsChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Compact Validation Status */}
      {showValidation && navigationType !== 'none' && (
        <div className={`flex items-center gap-1 text-xs ${
          validation.isValid ? 'text-success-600' : 'text-danger-600'
        }`}>
          {validation.isValid ? (
            <>
              <CheckCircle size={14} />
              <span>Valid</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              <span>{validation.errors[0]}</span>
            </>
          )}
        </div>
      )}

      {/* No Navigation - compact info */}
      {navigationType === 'none' && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Info size={14} />
          <span>Tidak ada navigasi</span>
        </div>
      )}

      {/* Dynamic Variables Help - collapsed by default */}
      <details className="text-xs mt-2">
        <summary className="font-medium text-primary-600 cursor-pointer hover:text-primary-800">
          📝 Variabel Dinamis
        </summary>
        <div className="mt-2 p-3 bg-primary-50 rounded text-primary-700 space-y-2">
          <p className="text-xs">Gunakan variabel berikut dalam teks untuk menampilkan data pengguna:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span><code className="bg-primary-100 px-1 rounded">{'{{nama}}'}</code> - Nama</span>
            <span><code className="bg-primary-100 px-1 rounded">{'{{email}}'}</code> - Email</span>
            <span><code className="bg-primary-100 px-1 rounded">{'{{kode}}'}</code> - Kode</span>
            <span><code className="bg-primary-100 px-1 rounded">{'{{saldo}}'}</code> - Saldo</span>
            <span><code className="bg-primary-100 px-1 rounded">{'{{komisi}}'}</code> - Komisi</span>
            <span><code className="bg-primary-100 px-1 rounded">{'{{poin}}'}</code> - Poin</span>
          </div>
        </div>
      </details>
    </div>
  );
};

export default RouteArgsEditor;
