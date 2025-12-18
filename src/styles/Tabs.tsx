import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-xs';
      case 'lg':
        return 'px-6 py-3.5 text-base';
      default:
        return 'px-5 py-2.5 text-sm';
    }
  };

  const getTabClasses = (isActive: boolean, isDisabled: boolean) => {
    const sizeClasses = getSizeClasses();
    const baseClasses = `${sizeClasses} font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:ring-offset-2`;
    
    if (isDisabled) {
      return `${baseClasses} text-neutral-300 cursor-not-allowed`;
    }
    
    switch (variant) {
      case 'pills':
        return `${baseClasses} rounded-xl ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
            : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
        }`;
      case 'underline':
        return `${baseClasses} border-b-2 rounded-none ${
          isActive
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
        }`;
      default:
        return `${baseClasses} rounded-xl ${
          isActive
            ? 'bg-white text-neutral-900 shadow-md border border-neutral-100'
            : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
        }`;
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'pills':
        return 'bg-neutral-100/80 backdrop-blur-sm p-1.5 rounded-2xl inline-flex';
      case 'underline':
        return 'border-b border-neutral-200';
      default:
        return 'bg-neutral-100/50 backdrop-blur-sm p-1 rounded-2xl inline-flex';
    }
  };

  return (
    <div className={`${getContainerClasses()} ${fullWidth ? 'w-full flex' : ''}`}>
      <nav className={`flex ${fullWidth ? 'w-full' : ''} ${variant === 'underline' ? '-mb-px space-x-6' : 'gap-1'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`${getTabClasses(activeTab === tab.id, !!tab.disabled)} ${fullWidth ? 'flex-1' : ''}`}
          >
            <span className="flex items-center justify-center gap-2">
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? variant === 'pills' 
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
