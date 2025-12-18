import React, { useEffect, useState, useRef, useMemo } from 'react';
import { NavigationConfig, NavigationItem, MoreMenu } from '../../types';
import TagInput from '../TagInput';
import { getRoutesByCategory, getDefaultArgsForRoute } from '../../data/routeConfig';
import RouteArgsEditor from '../RouteArgsEditor';
import { Plus, Trash2, Edit, Eye, EyeOff, ChevronDown, ChevronUp, Upload, Image as ImageIcon, X, GripVertical, AlertTriangle } from 'lucide-react';
import AssetsManager from '../AssetsManager';
import ImageHoverPreview from '../ImageHoverPreview';
import { getApiUrl, X_TOKEN_VALUE } from '../../config/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../../utils/themeColors';

interface NavigationEditorProps {
  navigation?: NavigationConfig;
  onUpdate: (navigation: NavigationConfig) => void;
  availableScreens?: string[];
  staticScreenNames?: string[];
  authSeed?: string;
}

// Sortable Navigation Item Wrapper
const SortableNavigationItem: React.FC<{
  id: string;
  item: NavigationItem;
  index: number;
  onUpdate: (index: number, updates: Partial<NavigationItem>) => void;
  onRemove: (index: number) => void;
  title: string;
  availableScreens?: string[];
  staticScreenNames?: string[];
  onOpenAssetPicker?: (index: number) => void;
  onFileSelect?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  fileInputRef?: (el: HTMLInputElement | null) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ id, item, index, onUpdate, onRemove, title, availableScreens = [], staticScreenNames = [], onOpenAssetPicker, onFileSelect, fileInputRef, isExpanded, onToggleExpand }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style as React.CSSProperties}>
      <NavigationItemEditor
        item={item}
        index={index}
        onUpdate={onUpdate}
        onRemove={onRemove}
        title={title}
        availableScreens={availableScreens}
        staticScreenNames={staticScreenNames}
        onOpenAssetPicker={onOpenAssetPicker}
        onFileSelect={onFileSelect}
        fileInputRef={fileInputRef}
        dragHandleProps={{ ...attributes, ...listeners }}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    </div>
  );
};

// Move NavigationItemEditor outside of the main component
const NavigationItemEditor: React.FC<{
  item: NavigationItem;
  index: number;
  onUpdate: (index: number, updates: Partial<NavigationItem>) => void;
  onRemove: (index: number) => void;
  title: string;
  availableScreens?: string[];
  staticScreenNames?: string[];
  onOpenAssetPicker?: (index: number) => void;
  onFileSelect?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  fileInputRef?: (el: HTMLInputElement | null) => void;
  dragHandleProps?: Record<string, any>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ item, index, onUpdate, onRemove, title, availableScreens = [], staticScreenNames = [], onOpenAssetPicker, onFileSelect, fileInputRef, dragHandleProps, isExpanded, onToggleExpand }) => {
  const navType = item.route ? 'route' : item.url ? 'url' : item.screen ? 'screen' : 'dynamic';
  const groupName = `navType_${title.replace(/\s+/g, '_')}_${index}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Collapsed Header - Always visible */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 flex-1">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          {item.icon && (
            <img src={item.icon} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <span className="text-sm font-medium text-gray-900">{item.label || `${title} #${index + 1}`}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${item.active ? 'bg-success-100 text-success-700' : 'bg-gray-200 text-gray-500'}`}>
            {item.active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="text-danger-500 hover:text-danger-700 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">URL Ikon</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={item.icon}
              onChange={(e) => onUpdate(index, { icon: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="https://example.com/icon.svg"
            />
            {onFileSelect && (
              <>
                <input
                  ref={(el) => {
                    localFileInputRef.current = el;
                    if (fileInputRef) fileInputRef(el);
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileSelect(e, index)}
                  className="hidden"
                />
                {item.icon && item.icon.startsWith('http') && (
                  <ImageHoverPreview
                    src={item.icon}
                    alt="Navigation icon preview"
                    thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                  />
                )}
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors flex items-center gap-1"
                  title="Upload icon"
                >
                  <Upload size={12} />
                </button>
                {onOpenAssetPicker && (
                  <button
                    type="button"
                    onClick={() => onOpenAssetPicker(index)}
                    className="px-2 py-1 bg-success-500 text-white rounded hover:bg-success-600 transition-colors flex items-center gap-1"
                    title="Select from assets"
                  >
                    <ImageIcon size={12} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Label Menu"
          />
        </div>
        {/* Navigation type selector */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Navigasi</label>
          <div className="flex gap-3 mb-2">
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="dynamic"
                checked={navType === 'dynamic'}
                onChange={() => onUpdate(index, { dynamic: item.dynamic || 'home', screen: undefined, route: undefined, url: undefined, routeArgs: undefined })}
                className="form-radio"
              />
              <span className="ml-2">Dinamis</span>
            </label>
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="screen"
                checked={navType === 'screen'}
                onChange={() => onUpdate(index, { screen: item.screen || 'history', dynamic: undefined, route: undefined, url: undefined, routeArgs: undefined })}
                className="form-radio"
              />
              <span className="ml-2">Layar</span>
            </label>
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="route"
                checked={navType === 'route'}
                onChange={() => onUpdate(index, { route: item.route || '/product', url: undefined, dynamic: undefined, screen: undefined })}
                className="form-radio"
              />
              <span className="ml-2">Rute</span>
            </label>
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="url"
                checked={navType === 'url'}
                onChange={() => onUpdate(index, { url: item.url || 'https://example.com', route: undefined, dynamic: undefined, screen: undefined, routeArgs: undefined })}
                className="form-radio"
              />
              <span className="ml-2">URL Eksternal</span>
            </label>
          </div>
        </div>

        {/* Dynamic and Screen fields */}
        {/* Dynamic or Static screen input based on navType */}
        {!item.route && !item.url && navType === 'dynamic' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Layar Dinamis</label>
            {availableScreens.length > 0 ? (
              <select
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={item.dynamic || ''}
                onChange={(e) => onUpdate(index, { dynamic: e.target.value || undefined })}
              >
                <option value="">Pilih screen...</option>
                {availableScreens.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={item.dynamic || ''}
                onChange={(e) => onUpdate(index, { dynamic: e.target.value || undefined })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="home, trending, dll."
              />
            )}
          </div>
        )}
        {!item.route && !item.url && navType === 'screen' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Layar</label>
            {staticScreenNames.length > 0 ? (
              <select
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={item.screen || ''}
                onChange={(e) => onUpdate(index, { screen: e.target.value || undefined })}
              >
                <option value="">Pilih screen...</option>
                {staticScreenNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={item.screen || ''}
                onChange={(e) => onUpdate(index, { screen: e.target.value || undefined })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="history, profile, dll."
              />
            )}
          </div>
        )}

        {/* Route and URL configuration */}
        {(item.route !== undefined || item.url !== undefined) && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Konfigurasi Navigasi</label>
            <div className="p-2 bg-gray-50 rounded border">
              <RouteArgsEditor
                route={item.route}
                url={item.url}
                routeArgs={item.routeArgs}
                onChange={(config) => {
                  onUpdate(index, {
                    route: config.route,
                    url: config.url,
                    routeArgs: config.routeArgs
                  });
                }}
                showValidation={true}
                allowUrlMode={true}
                allowRouteMode={true}
              />
            </div>
          </div>
        )}
        <div className="flex items-center">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={item.active}
              onChange={(e) => onUpdate(index, { active: e.target.checked })}
              className="mr-2 h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            Aktif
          </label>
        </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavigationEditor: React.FC<NavigationEditorProps> = ({
  navigation,
  onUpdate,
  availableScreens = [],
  staticScreenNames = [],
  authSeed = ''
}) => {
  const defaultNavigation: NavigationConfig = {
    menuStyle: 3,
    mainMenu: [],
    moreMenu: {
      icon: "https://www.svgrepo.com/download/511077/more-grid-big.svg",
      label: "Lainnya",
      active: true,
      items: []
    }
  };

  const [config, setConfig] = useState<NavigationConfig>(navigation || defaultNavigation);

  // Keep local state in sync with parent-provided navigation from backend
  useEffect(() => {
    setConfig(navigation || defaultNavigation);
  }, [navigation]);

  const [expandedMainMenuItem, setExpandedMainMenuItem] = useState<number | null>(null);
  const [expandedMoreMenuItem, setExpandedMoreMenuItem] = useState<number | null>(null);

  // Refs for more menu header inputs
  const moreMenuIconRef = useRef<HTMLInputElement>(null);
  const moreMenuLabelRef = useRef<HTMLInputElement>(null);

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [currentItemType, setCurrentItemType] = useState<'mainMenu' | 'moreMenu' | 'moreMenuHeader' | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const moreMenuHeaderFileInputRef = useRef<HTMLInputElement>(null);

  // Compute dynamic screens not included in navigation
  const missingScreens = useMemo(() => {
    const usedDynamicScreens = new Set<string>();

    // Collect screens used in mainMenu
    config.mainMenu.forEach(item => {
      if (item.dynamic) usedDynamicScreens.add(item.dynamic);
    });

    // Collect screens used in moreMenu
    config.moreMenu.items.forEach(item => {
      if (item.dynamic) usedDynamicScreens.add(item.dynamic);
    });

    return availableScreens.filter(s => !usedDynamicScreens.has(s));
  }, [config.mainMenu, config.moreMenu.items, availableScreens]);

  const getPublicUrl = async (filename: string) => {
    // Strip any leading /assets/ or / from the filename
    const cleanFilename = filename.replace(/^\/assets\//, '').replace(/^\//, '');
    const apiUrl = await getApiUrl('');
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  const handleUploadFile = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        return null;
      }

      const formData = new FormData();
      formData.append('session_key', sessionKey);
      formData.append('auth_seed', authSeed || localStorage.getItem('adminAuthSeed') || '');
      formData.append('file', file);

      const apiUrl = await getApiUrl('/admin/assets/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-Token': X_TOKEN_VALUE,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Try different response formats
        let filename = null;
        let publicUrl = null;

        // Check for filename in various places
        if (data.filename) {
          filename = data.filename;
        } else if (data.asset?.filename) {
          filename = data.asset.filename;
        } else if (data.file_url) {
          // Extract filename from file_url
          const urlParts = data.file_url.split('/');
          filename = urlParts[urlParts.length - 1];
        }

        // Check for public_url or file_url (might be full URL or relative)
        if (data.public_url) {
          publicUrl = data.public_url;
        } else if (data.asset?.public_url) {
          publicUrl = data.asset.public_url;
        } else if (data.file_url) {
          publicUrl = data.file_url;
        }

        // If we have a URL but it's relative (starts with /), make it absolute
        if (publicUrl && publicUrl.startsWith('/')) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}${publicUrl}`;
        }

        // If we still don't have a URL but have a filename, construct it
        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }

        if (publicUrl) {
          setAssetsRefreshTrigger(prev => prev + 1);
          return publicUrl;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, itemType: 'mainMenu' | 'moreMenu', index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);

    if (url) {
      if (itemType === 'mainMenu') {
        updateMainMenuItem(index, { icon: url });
      } else {
        updateMoreMenuItem(index, { icon: url });
      }
    } else {
    }

    const refKey = `${itemType}_${index}`;
    if (fileInputRefs.current[refKey]) {
      fileInputRefs.current[refKey]!.value = '';
    }
  };

  const handleMoreMenuHeaderFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);

    if (url) {
      updateConfig({ moreMenu: { ...config.moreMenu, icon: url } });
    } else {
    }

    if (moreMenuHeaderFileInputRef.current) {
      moreMenuHeaderFileInputRef.current.value = '';
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url && currentItemIndex !== null && currentItemType) {
      if (currentItemType === 'mainMenu') {
        updateMainMenuItem(currentItemIndex, { icon: url });
      } else if (currentItemType === 'moreMenu') {
        updateMoreMenuItem(currentItemIndex, { icon: url });
      } else if (currentItemType === 'moreMenuHeader') {
        updateConfig({ moreMenu: { ...config.moreMenu, icon: url } });
      }
      setShowAssetPicker(false);
      setCurrentItemIndex(null);
      setCurrentItemType(null);
    }
  };

  const openAssetPicker = (itemType: 'mainMenu' | 'moreMenu' | 'moreMenuHeader', index: number) => {
    setCurrentItemType(itemType);
    setCurrentItemIndex(index);
    setShowAssetPicker(true);
  };

  const updateConfig = (updates: Partial<NavigationConfig>) => {
    const updatedConfig = { ...config, ...updates };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const addMainMenuItem = () => {
    const newItem: NavigationItem = {
      icon: "https://www.svgrepo.com/download/529026/home.svg",
      label: "Item Menu Baru",
      active: true
    };
    const updatedConfig = {
      ...config,
      mainMenu: [...config.mainMenu, newItem]
    };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateMainMenuItem = (index: number, updates: Partial<NavigationItem>) => {
    const updatedMainMenu = [...config.mainMenu];
    updatedMainMenu[index] = { ...updatedMainMenu[index], ...updates };
    const updatedConfig = { ...config, mainMenu: updatedMainMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const removeMainMenuItem = (index: number) => {
    const updatedMainMenu = config.mainMenu.filter((_, i) => i !== index);
    const updatedConfig = { ...config, mainMenu: updatedMainMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const addMoreMenuItem = () => {
    const newItem: NavigationItem = {
      icon: "https://www.svgrepo.com/download/529867/settings.svg",
      label: "Item Lainnya Baru",
      active: true
    };
    const updatedMoreMenu = {
      ...config.moreMenu,
      items: [...config.moreMenu.items, newItem]
    };
    const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateMoreMenuItem = (index: number, updates: Partial<NavigationItem>) => {
    const updatedItems = [...config.moreMenu.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    const updatedMoreMenu = { ...config.moreMenu, items: updatedItems };
    const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const removeMoreMenuItem = (index: number) => {
    const updatedItems = config.moreMenu.items.filter((_, i) => i !== index);
    const updatedMoreMenu = { ...config.moreMenu, items: updatedItems };
    const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle main menu reorder
  const handleMainMenuDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = config.mainMenu.findIndex((_, i) => `mainMenu_${i}` === active.id);
      const newIndex = config.mainMenu.findIndex((_, i) => `mainMenu_${i}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedMenu = arrayMove(config.mainMenu, oldIndex, newIndex);
        const updatedConfig = { ...config, mainMenu: reorderedMenu };
        setConfig(updatedConfig);
        onUpdate(updatedConfig);
      }
    }
  };

  // Handle more menu items reorder
  const handleMoreMenuDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = config.moreMenu.items.findIndex((_, i) => `moreMenu_${i}` === active.id);
      const newIndex = config.moreMenu.items.findIndex((_, i) => `moreMenu_${i}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(config.moreMenu.items, oldIndex, newIndex);
        const updatedMoreMenu = { ...config.moreMenu, items: reorderedItems };
        const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
        setConfig(updatedConfig);
        onUpdate(updatedConfig);
      }
    }
  };

  const renderNavigationPreview = () => {
    const activeItems = config.mainMenu.filter(item => item.active);
    const moreMenuActive = config.moreMenu.active;

    const NavIcon: React.FC<{ item: NavigationItem; size?: number }> = ({ item, size = 20 }) => (
      <div className="flex flex-col items-center gap-0.5">
        {item.icon ? (
          <img src={item.icon} alt={item.label} className="object-contain" style={{ width: size, height: size }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="bg-gray-300 rounded" style={{ width: size, height: size }} />
        )}
        <span className="text-[9px] text-gray-600 truncate max-w-[48px]">{item.label}</span>
      </div>
    );

    switch (config.menuStyle) {
      case 1: // Floating Dock - rounded container
        return (
          <div className="flex justify-center">
            <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-4 border border-gray-200">
              {activeItems.map((item, idx) => (
                <NavIcon key={idx} item={item} size={22} />
              ))}
              {moreMenuActive && (
                <NavIcon item={{ icon: config.moreMenu.icon, label: config.moreMenu.label, active: true }} size={22} />
              )}
            </div>
          </div>
        );

      case 2: // Bar Bawah Statis - square bar/dock
        return (
          <div className="bg-white shadow-md border-t border-gray-200 px-2 py-2 flex items-center justify-around">
            {activeItems.map((item, idx) => (
              <NavIcon key={idx} item={item} size={22} />
            ))}
            {moreMenuActive && (
              <NavIcon item={{ icon: config.moreMenu.icon, label: config.moreMenu.label, active: true }} size={22} />
            )}
          </div>
        );

      case 3: // Bar Bawah Geser - drag handler, no lainnya button
        return (
          <div className="bg-white shadow-md border-t border-gray-200 px-2 pt-1 pb-2">
            {/* Drag handler line on top */}
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex items-center justify-around">
              {activeItems.map((item, idx) => (
                <NavIcon key={idx} item={item} size={22} />
              ))}
            </div>
          </div>
        );

      case 4: // Bar Tengah Menonjol - emphasized center circle
        const centerIndex = Math.floor(activeItems.length / 2);
        return (
          <div className="bg-white shadow-md border-t border-gray-200 px-2 py-2 flex items-end justify-around relative">
            {activeItems.map((item, idx) => {
              if (idx === centerIndex) {
                return (
                  <div key={idx} className="flex flex-col items-center -mt-4">
                    <div className="bg-primary-500 rounded-full p-3 shadow-lg border-4 border-white">
                      {item.icon ? (
                        <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-6 h-6 bg-white/50 rounded" />
                      )}
                    </div>
                    <span className="text-[9px] text-primary-600 font-medium truncate max-w-[48px] mt-0.5">{item.label}</span>
                  </div>
                );
              }
              return <NavIcon key={idx} item={item} size={22} />;
            })}
            {moreMenuActive && (
              <NavIcon item={{ icon: config.moreMenu.icon, label: config.moreMenu.label, active: true }} size={22} />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Navigation Preview - Moved above Gaya Menu */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-200/80 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pratinjau Navigasi</h3>
        <div className="rounded-lg p-4 overflow-hidden">
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden max-w-[512px] mx-auto">
            {/* Phone frame mockup */}
            <div className="h-32 bg-gradient-to-b from-gray-200 to-gray-100 flex items-end">
              <div className="w-full">
                {renderNavigationPreview()}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            Gaya: {config.menuStyle === 1 ? 'Floating Dock' : config.menuStyle === 2 ? 'Bar Bawah Statis' : config.menuStyle === 3 ? 'Bar Bawah Geser' : 'Bar Tengah Menonjol'}
          </div>
        </div>
      </div>

      {/* Menu Style */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-200/80 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gaya Menu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 1, label: 'Floating Dock', description: 'Floating dock dengan sembunyi/tampil' },
            { value: 2, label: 'Bar Bawah Statis', description: 'Navigasi bawah tradisional' },
            { value: 3, label: 'Bar Bawah Geser', description: 'Geser untuk menampilkan menu lebih banyak' },
            { value: 4, label: 'Bar Tengah Menonjol', description: 'Ikon tengah menonjol. Total navigasi harus ganjil.' }
          ].map((style) => (
            <div
              key={style.value}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                config.menuStyle === style.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => updateConfig({ menuStyle: style.value })}
            >
              <div className="font-medium text-sm">{style.label}</div>
              <div className="text-xs text-gray-500 mt-1">{style.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Menu */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-200/80">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Menu Utama</h3>
        </div>
        <div className="px-6 pb-6 space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMainMenuDragEnd}
            >
              <SortableContext
                items={config.mainMenu.map((_, index) => `mainMenu_${index}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {config.mainMenu.map((item, index) => {
                    const refKey = `mainMenu_${index}`;
                    return (
                      <SortableNavigationItem
                        key={`mainMenu_${index}`}
                        id={`mainMenu_${index}`}
                        item={item}
                        index={index}
                        onUpdate={updateMainMenuItem}
                        onRemove={removeMainMenuItem}
                        title="Item Menu Utama"
                        availableScreens={availableScreens}
                        staticScreenNames={staticScreenNames}
                        onOpenAssetPicker={(idx) => openAssetPicker('mainMenu', idx)}
                        onFileSelect={(e, idx) => handleFileSelect(e, 'mainMenu', idx)}
                        fileInputRef={(el) => { fileInputRefs.current[refKey] = el; }}
                        isExpanded={expandedMainMenuItem === index}
                        onToggleExpand={() => setExpandedMainMenuItem(prev => prev === index ? null : index)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          <button
            onClick={addMainMenuItem}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item Menu Utama
          </button>
        </div>
      </div>

      {/* More Menu */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-200/80">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-medium text-gray-900">Menu Lainnya</h3>
        </div>
        <div className="px-6 pb-6 space-y-4">
            {/* More Menu Header */}
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Header Menu Lainnya</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-primary-700 mb-1">URL Ikon</label>
                  <div className="flex gap-2">
                    <input
                      ref={moreMenuIconRef}
                      type="url"
                      value={config.moreMenu.icon}
                      onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, icon: e.target.value } })}
                      className="flex-1 px-2 py-1 text-xs border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <input
                      ref={moreMenuHeaderFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMoreMenuHeaderFileSelect}
                      className="hidden"
                    />
                    {config.moreMenu.icon && config.moreMenu.icon.startsWith('http') && (
                      <ImageHoverPreview
                        src={config.moreMenu.icon}
                        alt="More menu icon preview"
                        thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => moreMenuHeaderFileInputRef.current?.click()}
                      className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors flex items-center gap-1"
                      title="Upload icon"
                    >
                      <Upload size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('moreMenuHeader', 0)}
                      className="px-2 py-1 bg-success-500 text-white rounded hover:bg-success-600 transition-colors flex items-center gap-1"
                      title="Select from assets"
                    >
                      <ImageIcon size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-700 mb-1">Label</label>
                  <input
                    ref={moreMenuLabelRef}
                    type="text"
                    value={config.moreMenu.label}
                    onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, label: e.target.value } })}
                    className="w-full px-2 py-1 text-xs border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center text-xs font-medium text-primary-700">
                    <input
                      type="checkbox"
                      checked={config.moreMenu.active}
                      onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, active: e.target.checked } })}
                      className="mr-2 h-3 w-3 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                    />
                    Aktif
                  </label>
                </div>
              </div>
            </div>

            {/* More Menu Items */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMoreMenuDragEnd}
            >
              <SortableContext
                items={config.moreMenu.items.map((_, index) => `moreMenu_${index}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {config.moreMenu.items.map((item, index) => {
                    const refKey = `moreMenu_${index}`;
                    return (
                      <SortableNavigationItem
                        key={`moreMenu_${index}`}
                        id={`moreMenu_${index}`}
                        item={item}
                        index={index}
                        onUpdate={updateMoreMenuItem}
                        onRemove={removeMoreMenuItem}
                        title="Item Menu Lainnya"
                        availableScreens={availableScreens}
                        staticScreenNames={staticScreenNames}
                        onOpenAssetPicker={(idx) => openAssetPicker('moreMenu', idx)}
                        onFileSelect={(e, idx) => handleFileSelect(e, 'moreMenu', idx)}
                        fileInputRef={(el) => { fileInputRefs.current[refKey] = el; }}
                        isExpanded={expandedMoreMenuItem === index}
                        onToggleExpand={() => setExpandedMoreMenuItem(prev => prev === index ? null : index)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
            <button
              onClick={addMoreMenuItem}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item Menu Lainnya
          </button>
        </div>
      </div>

      {/* Missing Screens Indicator */}
      {missingScreens.length > 0 && (
        <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-orange-800 mb-2">
                Layar Belum Ditambahkan ke Navigasi ({missingScreens.length})
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Layar dinamis berikut ada di konfigurasi tetapi belum ditambahkan ke navigasi:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingScreens.map((screen) => (
                  <span key={screen} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs border border-orange-300">
                    {screen}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-[90vw] max-w-6xl h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih atau Upload Asset</h3>
              <button
                onClick={() => {
                  setShowAssetPicker(false);
                  setCurrentItemIndex(null);
                  setCurrentItemType(null);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager 
                authSeed={authSeed || localStorage.getItem('adminAuthSeed') || ''}
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleAssetSelect}
              />
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800 mb-2">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk memilih dan menerapkan ke field URL Ikon secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationEditor;
