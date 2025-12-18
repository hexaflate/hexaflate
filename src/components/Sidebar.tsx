import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DynamicScreenConfig } from '../types';
import { WIDGET_TYPES } from '../data/widgetTypes';
import { Plus, Check, ChevronDown, Settings } from 'lucide-react';
import { AlertDialog, InputDialog } from '../styles';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface SidebarProps {
  config: DynamicScreenConfig;
  selectedScreen: string;
  availableScreens: string[];
  onScreenChange: (screenName: string) => void;
  onAddWidgetType: (widgetType: string) => void;
  onOpenScreenConfig?: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  config,
  selectedScreen,
  availableScreens,
  onScreenChange,
  onAddWidgetType,
  onOpenScreenConfig,
  onClose,
}) => {
  const [addedWidget, setAddedWidget] = useState<string | null>(null);
  const [showExistsAlert, setShowExistsAlert] = useState(false);
  const [showNewScreenInput, setShowNewScreenInput] = useState(false);

  const handleCreateNewScreen = () => {
    setShowNewScreenInput(true);
  };

  const handleNewScreenConfirm = (screenName: string) => {
    setShowNewScreenInput(false);
    if (screenName) {
      const newScreenName = screenName.trim();
      if (!config.screens[newScreenName]) {
        const updatedConfig = { ...config };
        updatedConfig.screens[newScreenName] = {
          screen: newScreenName,
          content: [],
        };
        // Update the config (you'll need to implement this)
        onScreenChange(newScreenName);
      } else {
        setShowExistsAlert(true);
      }
    }
  };

  const handleWidgetClick = (widgetType: string) => {
    const widgetName = WIDGET_TYPES.find(w => w.id === widgetType)?.name || widgetType;
    setAddedWidget(widgetName);
    
    // Add the widget
    onAddWidgetType(widgetType);
    
    // Close sidebar on mobile after adding widget
    if (onClose) {
      onClose();
    }
    
    // Show success message for 2 seconds
    setTimeout(() => {
      setAddedWidget(null);
    }, 2000);
  };

  return (
    <>
    <div className="w-64 bg-white/90 backdrop-blur-xl border-r border-neutral-100 flex flex-col h-full shadow-lg">

      {/* Screen Selection */}
      <div className="p-3 border-b border-neutral-100 flex-shrink-0 bg-gradient-to-r from-neutral-50/50 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-800">Layar</h2>
          <button
            onClick={handleCreateNewScreen}
            className="p-2 text-neutral-500 rounded-xl transition-all duration-200"
            style={{ '--hover-color': THEME_COLOR, '--hover-bg': withOpacity(THEME_COLOR, 0.1) } as React.CSSProperties}
            onMouseEnter={(e) => { e.currentTarget.style.color = THEME_COLOR; e.currentTarget.style.backgroundColor = withOpacity(THEME_COLOR, 0.1); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
            title="Buat layar baru"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* Screen Dropdown */}
        <div className="relative">
          <select
            value={selectedScreen}
            onChange={(e) => onScreenChange(e.target.value)}
            className="w-full p-2.5 pr-8 border border-neutral-200 rounded-xl bg-white/80 backdrop-blur-sm text-sm text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:border-transparent appearance-none cursor-pointer transition-all duration-200 hover:border-neutral-300"
            style={{ '--tw-ring-color': withOpacity(THEME_COLOR, 0.5) } as React.CSSProperties}
          >
            {availableScreens.map((screenName) => (
              <option key={screenName} value={screenName}>
                {screenName} ({config.screens[screenName]?.content?.length || 0} widget)
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={16} className="text-neutral-400" />
          </div>
        </div>
        
      </div>

      {/* Widget Palette */}
      <div className="flex-1 p-3 sidebar-scrollable">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-neutral-800">Widget</h2>
        </div>

        {/* Success Message */}
        {addedWidget && (
          <div className="mb-3 p-3 bg-gradient-to-r from-success-50 to-success-100/50 border border-success-200/50 rounded-xl flex items-center gap-2 text-success-700 animate-slide-in">
            <div className="p-1 bg-success-500 rounded-lg">
              <Check size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold">{addedWidget} berhasil ditambahkan!</span>
          </div>
        )}

        {/* Available Widget Types - Now Clickable! */}
        <div className="space-y-2">
          <div className="text-xs text-neutral-500 mb-2 font-medium px-1">
            💡 Klik widget untuk menambahkannya
          </div>
          {WIDGET_TYPES.map((widgetType) => (
            <div
              key={widgetType.id}
              onClick={() => handleWidgetClick(widgetType.id)}
              title={`${widgetType.name}: ${widgetType.description}`}
              className="flex items-center gap-3 p-3 border border-neutral-100 rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer group"
              onMouseEnter={(e) => { 
                e.currentTarget.style.borderColor = withOpacity(THEME_COLOR, 0.3);
                e.currentTarget.style.background = `linear-gradient(to right, ${withOpacity(THEME_COLOR, 0.05)}, ${withOpacity(THEME_COLOR, 0.1)})`;
                const nameEl = e.currentTarget.querySelector('.widget-name') as HTMLElement;
                const descEl = e.currentTarget.querySelector('.widget-desc') as HTMLElement;
                if (nameEl) nameEl.style.color = THEME_COLOR_DARK;
                if (descEl) descEl.style.color = THEME_COLOR;
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
                const nameEl = e.currentTarget.querySelector('.widget-name') as HTMLElement;
                const descEl = e.currentTarget.querySelector('.widget-desc') as HTMLElement;
                if (nameEl) nameEl.style.color = '';
                if (descEl) descEl.style.color = '';
              }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-200">{widgetType.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="widget-name text-sm font-semibold text-neutral-700 transition-colors truncate">{widgetType.name}</div>
                <div className="widget-desc text-xs text-neutral-400 transition-colors truncate">{widgetType.description}</div>
              </div>
              <div 
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg"
                style={{ backgroundColor: THEME_COLOR }}
              >
                <Plus size={12} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>

      {/* Input Dialog for new screen name - rendered via portal to escape sidebar stacking context */}
      {createPortal(
        <InputDialog
          isOpen={showNewScreenInput}
          onClose={() => setShowNewScreenInput(false)}
          onConfirm={handleNewScreenConfirm}
          title="Buat Layar Baru"
          message="Masukkan nama layar:"
          placeholder="Contoh: home, profile, settings"
          confirmText="Buat"
          cancelText="Batal"
        />,
        document.body
      )}

      {/* Alert Dialog for screen already exists - rendered via portal to escape sidebar stacking context */}
      {createPortal(
        <AlertDialog
          isOpen={showExistsAlert}
          onClose={() => setShowExistsAlert(false)}
          title="Layar Sudah Ada"
          message="Nama layar ini sudah digunakan. Silakan pilih nama lain."
          variant="warning"
        />,
        document.body
      )}
    </>
  );
};

export default Sidebar;
