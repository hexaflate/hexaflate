import React from 'react';
import { RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface NavigationButtonProps {
  // Navigation configuration
  route?: string;
  url?: string;
  routeArgs?: RouteArgs;

  // UI properties
  icon?: string;
  title?: string;
  textSize?: number;
  textColor?: string;
  className?: string;
  disabled?: boolean;

  // Source data for tracking
  sourceData?: Record<string, any>;
  fromWebView?: boolean;

  // Event handlers
  onClick?: () => void;
  onNavigationError?: (error: string) => void;

  // Validation
  validateOnMount?: boolean;
  showValidationErrors?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  route,
  url,
  routeArgs,
  icon,
  title = 'Button',
  textSize = 11,
  textColor = '#000000',
  className = '',
  disabled = false,
  sourceData,
  fromWebView = false,
  onClick,
  onNavigationError,
  validateOnMount = true,
  showValidationErrors = false
}) => {
  // Create navigation configuration using RouteArgsManager
  const navigationConfig = RouteArgsManager.createNavigationConfig({
    route,
    url,
    title,
    sourceData,
    fromWebView,
    customArgs: routeArgs
  });

  // Validate navigation configuration
  const validation = RouteArgsManager.validateNavigationConfig(navigationConfig);
  const hasValidationErrors = !validation.isValid;

  // Handle click with validation
  const handleClick = () => {
    if (disabled) return;

    if (hasValidationErrors) {
      const errorMessage = `Navigation validation failed: ${validation.errors.join(', ')}`;
      onNavigationError?.(errorMessage);
      return;
    }

    // Call custom onClick handler if provided
    onClick?.();

    // In a real mobile app, this would trigger navigation
    // For now, we just log the navigation configuration

  };

  // Render icon if provided
  const renderIcon = () => {
    if (!icon) return null;

    // Handle emoji icons
    if (icon.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
      return <span className="text-lg">{icon}</span>;
    }

    // Handle URL icons
    if (icon.startsWith('http')) {
      return <img src={icon} alt={title} className="w-4 h-4" />;
    }

    // Handle other text icons
    return <span className="text-sm">{icon}</span>;
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200
        ${disabled 
          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
          : 'bg-white/80 backdrop-blur-sm hover:bg-neutral-50 border border-neutral-200/80 hover:border-primary-300 hover:shadow-sm'
        }
        ${hasValidationErrors && showValidationErrors 
          ? 'border-danger-300 bg-danger-50' 
          : ''
        }
        ${className}
      `}
      style={{
        fontSize: `${textSize}px`,
        color: textColor
      }}
      title={hasValidationErrors && showValidationErrors 
        ? `Validation errors: ${validation.errors.join(', ')}` 
        : title
      }
    >
      {renderIcon()}
      <span className="truncate">{title}</span>

      {/* Show validation indicator */}
      {hasValidationErrors && showValidationErrors && (
        <span className="text-danger-500 text-xs" title={validation.errors.join(', ')}>
          ⚠️
        </span>
      )}
    </button>
  );
};

export default NavigationButton;
