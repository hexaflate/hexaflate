import React from 'react';
import { MenuItem, RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import IconRenderer from './IconRenderer';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface MenuItemComponentProps {
  item: MenuItem;
  className?: string;
  onClick?: (item: MenuItem) => void;
  onNavigationError?: (error: string) => void;
  showValidationErrors?: boolean;
  compact?: boolean;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  className = '',
  onClick,
  onNavigationError,
  showValidationErrors = false,
  compact = false
}) => {
  // Create navigation configuration using RouteArgsManager
  const navigationConfig = RouteArgsManager.createNavigationConfig({
    route: item.route,
    url: item.url,
    title: item.title,
    sourceData: item.routeArgs?._bannerData,
    fromWebView: item.routeArgs?.__fromWebView || false,
    customArgs: item.routeArgs
  });

  // Validate navigation configuration
  const validation = RouteArgsManager.validateNavigationConfig(navigationConfig);
  const hasValidationErrors = !validation.isValid;

  // Handle click
  const handleClick = () => {
    if (hasValidationErrors) {
      const errorMessage = `Menu item validation failed: ${validation.errors.join(', ')}`;
      onNavigationError?.(errorMessage);
      return;
    }

    onClick?.(item);

    // In a real mobile app, this would trigger navigation

  };

  // Check if this is a submenu
  const isSubmenu = !!(item.submenu || item.submenuTitle || item.submenuStyle || item.submenuLayout);

  return (
    <div
      className={`
        flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200
        ${hasValidationErrors && showValidationErrors 
          ? 'border border-danger-300 bg-danger-50 hover:bg-danger-100' 
          : 'bg-white/80 backdrop-blur-sm hover:bg-neutral-50 border border-neutral-200/80 hover:border-primary-300 hover:shadow-sm'
        }
        ${compact ? 'p-2.5' : 'p-3.5'}
        ${className}
      `}
      onClick={handleClick}
      title={hasValidationErrors && showValidationErrors 
        ? `Validation errors: ${validation.errors.join(', ')}` 
        : item.title
      }
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <IconRenderer iconUrl={item.iconUrl} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div 
          className="font-semibold text-neutral-800 truncate"
          style={{
            fontSize: `${item.textSize || 11}px`,
            color: item.textColor || '#000000'
          }}
        >
          {item.title}
        </div>

        {/* Show route/URL info */}
        {!isSubmenu && (navigationConfig.route || navigationConfig.url) && (
          <div className="text-xs text-neutral-500 mt-1">
            {navigationConfig.route && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                {navigationConfig.route}
                {navigationConfig.routeArgs && Object.keys(navigationConfig.routeArgs).length > 0 && (
                  <span className="text-neutral-400">(args)</span>
                )}
              </span>
            )}
            {navigationConfig.url && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-success-400 rounded-full"></span>
                External URL
              </span>
            )}
          </div>
        )}

        {/* Show submenu info */}
        {isSubmenu && (
          <div className="text-xs text-primary-600 mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
              Submenu ({item.submenu?.submenuLayout || item.submenuLayout || 'grid'})
            </span>
          </div>
        )}

        {/* Show validation errors */}
        {hasValidationErrors && showValidationErrors && (
          <div className="text-xs text-danger-600 mt-1">
            {validation.errors.join(', ')}
          </div>
        )}
      </div>

      {/* Submenu indicator */}
      {isSubmenu && (
        <div className="flex-shrink-0 text-neutral-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MenuItemComponent;
