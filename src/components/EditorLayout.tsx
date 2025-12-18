import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { DynamicScreenConfig, ContentSection, NavigationConfig, GlobalTheming, MenuItem, ScreenConfig } from '../types';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import GlobalConfigEditor from './editors/GlobalConfigEditor';
import NavigationEditor from './editors/NavigationEditor';
import LoginCustomizationEditor from './editors/LoginCustomizationEditor';
import MenuDepositCustomizationEditor from './editors/MenuDepositCustomizationEditor';
import ProfileCustomizationEditor from './editors/ProfileCustomizationEditor';
import SettingsCustomizationEditor from './editors/SettingsCustomizationEditor';
import BantuanCustomizationEditor, { BantuanCustomizationEditorRef } from './editors/BantuanCustomizationEditor';
import { WIDGET_TYPES } from '../data/widgetTypes';
import { Settings, Navigation, Monitor, Menu, X, LogIn, Wallet, User, Cog, HelpCircle } from 'lucide-react';
import { ConfirmDialog } from '../styles';
import { THEME_COLOR, withOpacity } from '../utils/themeColors';

interface EditorLayoutProps {
  config: DynamicScreenConfig;
  selectedScreen: string;
  selectedMenu?: string;
  onConfigChange: (config: DynamicScreenConfig) => void;
  onScreenChange: (screenName: string) => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJSON: () => void;
  authSeed: string;
}

export interface EditorLayoutRef {
  saveBantuanConfig: () => Promise<void>;
}

type EditorTab = 'canvas' | 'global' | 'navigation' | 'login' | 'deposit' | 'profile' | 'settings' | 'bantuan';

const EditorLayout = forwardRef<EditorLayoutRef, EditorLayoutProps>(({
  config,
  selectedScreen,
  selectedMenu,
  onConfigChange,
  onScreenChange,
  authSeed,
}, ref) => {
  const [selectedWidget, setSelectedWidget] = useState<ContentSection | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('canvas');
  const [showScreenConfig, setShowScreenConfig] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteScreenConfirm, setShowDeleteScreenConfirm] = useState(false);

  const bantuanEditorRef = useRef<BantuanCustomizationEditorRef>(null);

  // Expose save function to parent
  useImperativeHandle(ref, () => ({
    saveBantuanConfig: async () => {
      if (bantuanEditorRef.current) {
        await bantuanEditorRef.current.save();
      }
    },
  }));

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint for editor
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Auto-hide sidebar on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedWidget) {
        setSelectedWidget(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidget]);

  const handleAddWidget = (widgetType: string) => {
    const widgetTypeData = WIDGET_TYPES.find(w => w.id === widgetType);
    if (!widgetTypeData) return;

    // Generate unique instanceId for this specific widget instance
    const instanceId = `${widgetType}_${Date.now()}`;

    // Keep the semantic id for widget type identification
    const widgetId = widgetType;

    const newWidget: ContentSection = {
      ...widgetTypeData.defaultConfig,
      id: widgetId, // Widget type (e.g., "title", "banner_slider")
      instanceId: instanceId, // Unique instance identifier
    } as ContentSection;

    const updatedConfig = { ...config };
    if (!updatedConfig.screens[selectedScreen]) {
      updatedConfig.screens[selectedScreen] = {
        screen: selectedScreen,
        content: [],
      };
    }

    updatedConfig.screens[selectedScreen].content = [
      ...(updatedConfig.screens[selectedScreen].content || []),
      newWidget,
    ];

    onConfigChange(updatedConfig);
    setSelectedWidget(newWidget);
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<ContentSection>) => {

    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    // Find widget by instanceId for unique identification
    const widgetIndex = screen.content.findIndex(w => w.instanceId === widgetId);
    if (widgetIndex === -1) return;

    screen.content[widgetIndex] = { ...screen.content[widgetIndex], ...updates };

    onConfigChange(updatedConfig);

    if (selectedWidget?.instanceId === widgetId) {
      setSelectedWidget(screen.content[widgetIndex]);
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    // Delete widget by instanceId
    screen.content = screen.content.filter(w => w.instanceId !== widgetId);

    onConfigChange(updatedConfig);

    if (selectedWidget?.instanceId === widgetId) {
      setSelectedWidget(null);
    }
  };

  const handleReorderWidgets = (newOrder: ContentSection[]) => {
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    screen.content = newOrder;
    onConfigChange(updatedConfig);
  };

  const handleDuplicateWidget = (widget: ContentSection) => {
    const duplicatedWidget: ContentSection = {
      ...widget,
      instanceId: `${widget.id}_copy_${Date.now()}`, // New unique instanceId
    };

    const updatedConfig = { ...config };
    if (!updatedConfig.screens[selectedScreen]) {
      updatedConfig.screens[selectedScreen] = {
        screen: selectedScreen,
        content: [],
      };
    }

    updatedConfig.screens[selectedScreen].content = [
      ...(updatedConfig.screens[selectedScreen].content || []),
      duplicatedWidget,
    ];

    onConfigChange(updatedConfig);
    setSelectedWidget(duplicatedWidget);
  };

  // Extract menu items from all content sections across all screens
  const extractMenuItems = (): MenuItem[] => {
    const menuItems: MenuItem[] = [];

    Object.values(config.screens).forEach(screen => {
      screen.content?.forEach(contentSection => {
        if (contentSection.items && Array.isArray(contentSection.items)) {
          // Recursively extract menu items including submenu items
          const extractItems = (items: MenuItem[]): void => {
            items.forEach(item => {
              // Include items that have either menu_id or route
              if (item.menu_id || item.route) {
                // If no menu_id exists, generate one based on title and route
                const menuItem: MenuItem = {
                  ...item,
                  menu_id: item.menu_id || `${item.title?.toLowerCase().replace(/\s+/g, '_')}_${item.route?.replace('/', '')}_${Date.now()}`
                };
                menuItems.push(menuItem);
              }
              if (item.submenu?.items) {
                extractItems(item.submenu.items);
              }
            });
          };
          extractItems(contentSection.items);
        }
      });
    });

    return menuItems;
  };

  const handleUpdateGlobalConfig = (globalConfig: GlobalTheming) => {
    const updatedConfig = { ...config, globalTheming: globalConfig };
    onConfigChange(updatedConfig);
  };

  const handleUpdateNavigation = (navigation: NavigationConfig) => {
    const updatedConfig = { ...config, navigation };
    onConfigChange(updatedConfig);
  };

  const handleUpdateScreen = (updates: Partial<ScreenConfig>) => {
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    // Create a completely new screen object to ensure React detects the change
    const updatedScreen = { ...screen, ...updates };
    updatedConfig.screens[selectedScreen] = updatedScreen;
    onConfigChange(updatedConfig);
  };

  const handleDeleteScreen = () => {
    if (!currentScreen) return;
    setShowDeleteScreenConfirm(true);
  };

  const confirmDeleteScreen = () => {
    if (!currentScreen) return;

    const updatedConfig = { ...config };
    delete updatedConfig.screens[currentScreen.screen];

    onConfigChange(updatedConfig);

    // Reset to first available screen or show empty state
    const remainingScreens = Object.keys(updatedConfig.screens);
    if (remainingScreens.length > 0) {
      onScreenChange(remainingScreens[0]);
    } else {
      onScreenChange('');
    }

    setShowDeleteScreenConfirm(false);
  };

  const currentScreen = config.screens[selectedScreen];
  const availableScreens = Object.keys(config.screens);

  const tabs = [
    {
      id: 'canvas' as EditorTab,
      name: 'Canvas',
      icon: <Monitor className="h-4 w-4" />,
      description: 'Visual screen editor'
    },

    {
      id: 'global' as EditorTab,
      name: 'Global Config',
      icon: <Settings className="h-4 w-4" />,
      description: 'Global theming and settings'
    },
    {
      id: 'navigation' as EditorTab,
      name: 'Navigation',
      icon: <Navigation className="h-4 w-4" />,
      description: 'Menu and navigation setup'
    },
    {
      id: 'login' as EditorTab,
      name: 'Login',
      icon: <LogIn className="h-4 w-4" />,
      description: 'Login screen customization'
    },
    {
      id: 'deposit' as EditorTab,
      name: 'Deposit',
      icon: <Wallet className="h-4 w-4" />,
      description: 'Menu deposit customization'
    },
    {
      id: 'profile' as EditorTab,
      name: 'Profil',
      icon: <User className="h-4 w-4" />,
      description: 'Profile screen customization'
    },
    {
      id: 'settings' as EditorTab,
      name: 'Settings',
      icon: <Cog className="h-4 w-4" />,
      description: 'Settings screen customization'
    },
    {
      id: 'bantuan' as EditorTab,
      name: 'Bantuan',
      icon: <HelpCircle className="h-4 w-4" />,
      description: 'Help center customization (global)'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'canvas':
        return (
          <div className="flex h-full">
            <Canvas
              screen={currentScreen}
              selectedWidget={selectedWidget}
              onWidgetSelect={setSelectedWidget}
              onUpdateWidget={handleUpdateWidget}
              onDeleteWidget={handleDeleteWidget}
              onDuplicateWidget={handleDuplicateWidget}
              onReorderWidgets={handleReorderWidgets}
              onUpdateScreen={handleUpdateScreen}
              showScreenConfig={showScreenConfig}
              onToggleScreenConfig={setShowScreenConfig}
              onDeleteScreen={handleDeleteScreen}
              globalConfig={config.globalTheming}
              navigation={config.navigation}
            />
            {/* Show PropertyPanel when screen configuration is not active and widget is selected */}
            {!showScreenConfig && selectedWidget && (
              <>
                {/* Desktop PropertyPanel */}
                {!isMobile && (
                  <PropertyPanel
                    widget={selectedWidget}
                    onUpdateWidget={handleUpdateWidget}
                    screen={currentScreen}
                  />
                )}

                {/* Mobile PropertyPanel - Slide up modal */}
                {isMobile && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
                    <div className="bg-white w-full max-h-[80vh] rounded-t-lg shadow-lg">
                      <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Widget Properties</h3>
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                        <PropertyPanel
                          widget={selectedWidget}
                          onUpdateWidget={handleUpdateWidget}
                          screen={currentScreen}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'global':
        return (
          <GlobalConfigEditor
            globalConfig={config.globalTheming}
            onUpdate={handleUpdateGlobalConfig}
            menuItems={extractMenuItems()}
          />
        );

      case 'navigation':
        return (
          <NavigationEditor
            navigation={config.navigation}
            onUpdate={handleUpdateNavigation}
            availableScreens={availableScreens}
            staticScreenNames={[
              'all_senders_screen',
              'deposit_history_screen',
              'downline_list',
              'mutasi',
              'history',
              'profile_screen',
              'profile',
            ]}
          />
        );

      case 'login':
        return (
          <LoginCustomizationEditor
            globalConfig={config.globalTheming}
            onUpdate={handleUpdateGlobalConfig}
            selectedMenu={selectedMenu}
          />
        );

      case 'deposit':
        return (
          <MenuDepositCustomizationEditor
            globalConfig={config.globalTheming}
            onUpdate={handleUpdateGlobalConfig}
            selectedMenu={selectedMenu}
          />
        );

      case 'profile':
        return (
          <ProfileCustomizationEditor
            globalConfig={config.globalTheming}
            onUpdate={handleUpdateGlobalConfig}
            selectedMenu={selectedMenu}
          />
        );

      case 'settings':
        return (
          <SettingsCustomizationEditor
            globalConfig={config.globalTheming}
            onUpdate={handleUpdateGlobalConfig}
            selectedMenu={selectedMenu}
          />
        );

      // bantuan tab is rendered separately to keep it mounted (preloaded)
      case 'bantuan':
        return null;

      default:
        return null;
    }
  };

  return (
    <div 
      className="flex flex-col h-full"
      style={{ background: `linear-gradient(to bottom right, #fafafa, rgba(250,250,250,0.95), ${withOpacity(THEME_COLOR, 0.05)})` }}
    >
      {/* Slim Top Tab Bar (spans full editor) */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-neutral-200/60 shadow-sm">
        <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
          {/* Mobile menu button for canvas tab */}
          {isMobile && activeTab === 'canvas' && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex-shrink-0 p-2 ml-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? ''
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
              style={activeTab === tab.id ? {
                borderColor: THEME_COLOR,
                color: THEME_COLOR,
                backgroundColor: withOpacity(THEME_COLOR, 0.05)
              } : undefined}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && activeTab === 'canvas' && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Editor Body: Sidebar + Content below the tab bar */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Only show for canvas tab */}
        {activeTab === 'canvas' && (
          <div
            className={`${
              isMobile 
                ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out shadow-2xl ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  }`
                : 'flex-shrink-0'
            }`}
          >
            <Sidebar
              config={config}
              selectedScreen={selectedScreen}
              availableScreens={availableScreens}
              onScreenChange={onScreenChange}
              onAddWidgetType={handleAddWidget}
              onOpenScreenConfig={() => setShowScreenConfig(true)}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Tab Content */}
        <div className={`flex-1 overflow-hidden ${isMobile && activeTab === 'canvas' ? 'ml-0' : ''}`}>
          {renderTabContent()}
          {/* Bantuan tab is always mounted to preload data and prevent reloading */}
          <div className={activeTab === 'bantuan' ? 'h-full' : 'hidden'}>
            <BantuanCustomizationEditor
              ref={bantuanEditorRef}
              authSeed={authSeed}
            />
          </div>
        </div>
      </div>

      {/* Delete Screen Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteScreenConfirm}
        onClose={() => setShowDeleteScreenConfirm(false)}
        onConfirm={confirmDeleteScreen}
        title="Hapus Layar"
        message={`Apakah Anda yakin ingin menghapus layar "${currentScreen?.screen}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
});

export default EditorLayout;
