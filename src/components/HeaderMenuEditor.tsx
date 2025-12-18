import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  AlertTriangle,
  Copy,
  Upload,
  Image as ImageIcon,
  Type,
  Navigation,
  Palette
} from 'lucide-react';
import { useToast } from './Toast';
import { HeaderMenuItem } from '../types';
import IconRenderer from './IconRenderer';
import RouteArgsEditor from './RouteArgsEditor';
import AssetsManager from './AssetsManager';
import ImageHoverPreview from './ImageHoverPreview';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  dragOverPosition: 'before' | 'after' | null;
}

interface HeaderMenuEditorProps {
  items: HeaderMenuItem[];
  onSave: (items: HeaderMenuItem[]) => void;
  onClose: () => void;
  authSeed?: string;
}

const CollapsibleSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, subtitle, isExpanded, onToggle, children, className = '' }) => (
  <div className={`border-b border-neutral-100 last:border-b-0 ${className}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 py-2.5 px-2 hover:bg-primary-50/30 transition-all duration-200 rounded-lg"
    >
      <span className="text-neutral-400 p-1 bg-neutral-100 rounded-lg">{icon}</span>
      <div className="flex-1 text-left">
        <span className="text-xs font-medium text-neutral-700">{title}</span>
        {!isExpanded && subtitle && (
          <span className="text-[11px] text-neutral-400 ml-2 truncate">{subtitle}</span>
        )}
      </div>
      {isExpanded ? (
        <ChevronDown size={12} className="text-primary-500" />
      ) : (
        <ChevronRight size={12} className="text-neutral-400" />
      )}
    </button>
    {isExpanded && <div className="pb-3 px-2 space-y-2">{children}</div>}
  </div>
);

export default function HeaderMenuEditor({ items, onSave, onClose, authSeed = '' }: HeaderMenuEditorProps) {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState<HeaderMenuItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItemData, setEditingItemData] = useState<HeaderMenuItem | null>(null);
  const [menuItemColors, setMenuItemColors] = useState<string[]>([]);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    dragOverIndex: null,
    dragOverPosition: null
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const originalItemsRef = useRef<HeaderMenuItem[]>(items);

  const [editModalHasChanges, setEditModalHasChanges] = useState(false);
  const [showEditModalUnsavedDialog, setShowEditModalUnsavedDialog] = useState(false);
  const originalEditDataRef = useRef<HeaderMenuItem | null>(null);

  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editModalSection, setEditModalSection] = useState<string | null>('identity');
  const toggleEditSection = (section: string) => {
    setEditModalSection(editModalSection === section ? null : section);
  };

  useEffect(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    setMenuItemColors(shuffledColors);
  }, []);

  useEffect(() => {
    setMenuItems([...items]);
  }, [items]);

  useEffect(() => {
    const hasChanges = JSON.stringify(menuItems) !== JSON.stringify(originalItemsRef.current);
    setHasUnsavedChanges(hasChanges);
  }, [menuItems]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDragState({
      isDragging: true,
      draggedIndex: index,
      dragOverIndex: null,
      dragOverPosition: null
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragState.isDragging || dragState.draggedIndex === index) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const position: 'before' | 'after' = y < rect.height / 2 ? 'before' : 'after';

    setDragState(prev => ({
      ...prev,
      dragOverIndex: index,
      dragOverPosition: position
    }));
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragState.draggedIndex === null || dragState.draggedIndex === targetIndex) return;

    const newItems = [...menuItems];
    const [draggedItem] = newItems.splice(dragState.draggedIndex, 1);

    let insertIndex = targetIndex;
    if (dragState.dragOverPosition === 'after') {
      insertIndex = dragState.draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    } else {
      insertIndex = dragState.draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    }

    newItems.splice(insertIndex, 0, draggedItem);
    setMenuItems(newItems);

    setDragState({
      isDragging: false,
      draggedIndex: null,
      dragOverIndex: null,
      dragOverPosition: null
    });
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedIndex: null,
      dragOverIndex: null,
      dragOverPosition: null
    });
  };

  const addMenuItem = () => {
    const newItem: HeaderMenuItem = {
      iconUrl: '📱',
      title: 'Menu Baru',
      textSize: 11.0,
      route: '/product',
      routeArgs: {
        operators: ['TSELREG'],
        hintText: 'Nomor HP Pelanggan'
      }
    };
    setMenuItems([...menuItems, newItem]);
  };

  const duplicateItem = (index: number) => {
    const itemToDuplicate = menuItems[index];
    const newItem: HeaderMenuItem = {
      ...itemToDuplicate,
      title: `${itemToDuplicate.title} (Copy)`
    };
    const newItems = [...menuItems];
    newItems.splice(index + 1, 0, newItem);
    setMenuItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = menuItems.filter((_, i) => i !== index);
    setMenuItems(newItems);
  };

  const openEditModal = (index: number) => {
    setEditingItemData({ ...menuItems[index] });
    setEditingIndex(index);
    setShowEditModal(true);
    setEditModalHasChanges(false);
    originalEditDataRef.current = { ...menuItems[index] };
  };

  const updateNode = (updates: Partial<HeaderMenuItem>) => {
    if (editingItemData === null || editingIndex === null) return;

    const updatedData = { ...editingItemData, ...updates };
    setEditingItemData(updatedData);

    if (originalEditDataRef.current) {
      const hasChanges = JSON.stringify(updatedData) !== JSON.stringify(originalEditDataRef.current);
      setEditModalHasChanges(hasChanges);
    }

    const newItems = [...menuItems];
    newItems[editingIndex] = updatedData;
    setMenuItems(newItems);
  };

  const saveEditModal = () => {
    setShowEditModal(false);
    setEditingItemData(null);
    setEditingIndex(null);
    setEditModalHasChanges(false);
    originalEditDataRef.current = null;
  };

  const closeEditModal = () => {
    if (editModalHasChanges) {
      setShowEditModalUnsavedDialog(true);
    } else {
      setShowEditModal(false);
      setEditingItemData(null);
      setEditingIndex(null);
      setEditModalHasChanges(false);
      originalEditDataRef.current = null;
    }
  };

  const confirmEditModalClose = () => {
    if (originalEditDataRef.current && editingIndex !== null) {
      const newItems = [...menuItems];
      newItems[editingIndex] = originalEditDataRef.current;
      setMenuItems(newItems);
    }
    setShowEditModalUnsavedDialog(false);
    setShowEditModal(false);
    setEditingItemData(null);
    setEditingIndex(null);
    setEditModalHasChanges(false);
    originalEditDataRef.current = null;
  };

  const cancelEditModalClose = () => {
    setShowEditModalUnsavedDialog(false);
  };

  const getPublicUrl = async (filename: string) => {
    const cleanFilename = filename.replace(/^\/assets\//, '').replace(/^\//, '');
    const apiUrl = await getApiUrl('');
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  const handleUploadFile = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) return null;

      const formData = new FormData();
      formData.append('session_key', sessionKey);
      formData.append('auth_seed', authSeed || localStorage.getItem('adminAuthSeed') || '');
      formData.append('file', file);

      const apiUrl = await getApiUrl('/admin/assets/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'X-Token': X_TOKEN_VALUE },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        let publicUrl = data.public_url || data.asset?.public_url || data.file_url;
        if (publicUrl && publicUrl.startsWith('/')) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}${publicUrl}`;
        }
        if (!publicUrl && (data.filename || data.asset?.filename)) {
          publicUrl = await getPublicUrl(data.filename || data.asset.filename);
        }
        if (publicUrl) {
          setAssetsRefreshTrigger(prev => prev + 1);
          return publicUrl;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || editingItemData === null || editingIndex === null) return;

    const url = await handleUploadFile(file);
    if (url) {
      updateNode({ iconUrl: url });
      setEditingItemData(prev => prev ? { ...prev, iconUrl: url } : prev);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAssetSelect = (url: string) => {
    if (url && editingItemData) {
      updateNode({ iconUrl: url });
      setEditingItemData(prev => prev ? { ...prev, iconUrl: url } : prev);
      setShowAssetPicker(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  const confirmAction = () => {
    setShowUnsavedChangesDialog(false);
    onClose();
  };

  const cancelAction = () => {
    setShowUnsavedChangesDialog(false);
  };

  const saveChanges = () => {
    onSave(menuItems);
    originalItemsRef.current = menuItems;
    setHasUnsavedChanges(false);
    showToast('Perubahan menu header berhasil disimpan. Jangan lupa Publish!', 'success');
  };

  const getMenuItemColor = (index: number) => {
    return menuItemColors[index % menuItemColors.length] || '#E5E7EB';
  };

  const renderItem = (item: HeaderMenuItem, index: number) => {
    const isDragOver = dragState.dragOverIndex === index;
    const isDragging = dragState.isDragging && dragState.draggedIndex === index;

    return (
      <div key={index} className="mb-0.5">
        <div 
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded border transition-all duration-200 select-none cursor-pointer hover:bg-gray-50 ${
            isDragOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
          } ${isDragging ? 'opacity-50' : ''}`}
          style={{ backgroundColor: getMenuItemColor(index) + '15' }}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical size={12} />
          </div>

          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: getMenuItemColor(index) }}
          />

          <IconRenderer iconUrl={item.iconUrl} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs font-medium text-gray-800 truncate">{item.title}</span>
            </div>
            <div className="text-[11px] text-gray-400 truncate">
              {item.route && <span>{item.route}</span>}
              {item.url && <span>URL: {item.url.substring(0, 30)}...</span>}
            </div>
          </div>

          <div className="flex gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); openEditModal(index); }}
              className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
              title="Edit"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); duplicateItem(index); }}
              className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
              title="Duplikat"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteItem(index); }}
              className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded"
              title="Hapus"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {isDragOver && dragState.dragOverPosition && (
          <div className="h-1 mx-2 rounded-full" style={{ backgroundColor: THEME_COLOR }} />
        )}
      </div>
    );
  };

  const renderEditModal = () => {
    if (!showEditModal || !editingItemData) return null;

    return (
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Edit Item Menu Header</h3>
              {editModalHasChanges && (
                <div className="flex items-center gap-1 text-[11px] text-orange-600">
                  <AlertTriangle size={10} />
                  <span>Ada perubahan belum disimpan</span>
                </div>
              )}
            </div>
            <button
              onClick={closeEditModal}
              className={`p-1 rounded transition-colors ${
                editModalHasChanges ? 'text-orange-600 hover:bg-orange-100' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3">
            <CollapsibleSection
              icon={<Type size={12} />}
              title="Identitas"
              subtitle={editingItemData.title || 'Belum diisi'}
              isExpanded={editModalSection === 'identity'}
              onToggle={() => toggleEditSection('identity')}
            >
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">Judul</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                    value={editingItemData.title || ''}
                    onChange={(e) => updateNode({ title: e.target.value })}
                    placeholder="Judul Item Menu"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">Ikon</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                      value={editingItemData.iconUrl || ''}
                      onChange={(e) => updateNode({ iconUrl: e.target.value })}
                      placeholder="📱 atau URL"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {editingItemData.iconUrl && editingItemData.iconUrl.startsWith('http') && (
                      <ImageHoverPreview
                        src={editingItemData.iconUrl}
                        alt="Icon preview"
                        thumbnailClassName="flex-shrink-0 w-7 h-7 rounded border border-gray-200 overflow-hidden bg-gray-100"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-1.5 py-1 text-white rounded"
                      style={{ backgroundColor: THEME_COLOR }}
                      title="Upload"
                    >
                      <Upload size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssetPicker(true)}
                      className="px-1.5 py-1 bg-success-500 text-white rounded hover:bg-success-600"
                      title="Assets"
                    >
                      <ImageIcon size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              icon={<Palette size={12} />}
              title="Tampilan"
              subtitle={`Ukuran: ${editingItemData.textSize ?? 11}`}
              isExpanded={editModalSection === 'appearance'}
              onToggle={() => toggleEditSection('appearance')}
            >
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">
                    Ukuran Teks ({editingItemData.textSize ?? 11})
                  </label>
                  <input
                    type="range"
                    className="w-full h-1.5 accent-blue-500"
                    value={editingItemData.textSize ?? 11}
                    onChange={(e) => updateNode({ textSize: parseFloat(e.target.value) })}
                    min="8"
                    max="20"
                    step="0.5"
                  />
                </div>
                <div className="p-2 bg-gray-50 rounded border text-center">
                  <div className="inline-flex items-center gap-2">
                    <IconRenderer iconUrl={editingItemData.iconUrl} size="md" />
                    <span style={{ fontSize: `${editingItemData.textSize ?? 11}px` }}>{editingItemData.title || 'Preview'}</span>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              icon={<Navigation size={12} />}
              title="Navigasi"
              subtitle={editingItemData.route || editingItemData.url || 'Tidak diatur'}
              isExpanded={editModalSection === 'navigation'}
              onToggle={() => toggleEditSection('navigation')}
            >
              <div className="p-2 bg-gray-50 rounded">
                <RouteArgsEditor
                  route={editingItemData.route}
                  url={editingItemData.url}
                  routeArgs={editingItemData.routeArgs}
                  onChange={(config) => {
                    updateNode({
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
            </CollapsibleSection>

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={closeEditModal}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveEditModal}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  editModalHasChanges 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-white'
                }`}
                style={!editModalHasChanges ? { backgroundColor: THEME_COLOR } : undefined}
              >
                {editModalHasChanges ? 'Simpan*' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-[85vw] max-w-3xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Editor Menu Header</h2>
            <p className="text-[11px] text-gray-500">Menu icons untuk ditampilkan di area header (tanpa frame/padding/shadow/border)</p>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 text-[11px] text-orange-600">
                <AlertTriangle size={10} />
                <span>Ada perubahan belum disimpan</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={saveChanges}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'text-white'
              }`}
              style={!hasUnsavedChanges ? { backgroundColor: THEME_COLOR } : undefined}
            >
              <Save size={12} />
              {hasUnsavedChanges ? 'Simpan*' : 'Simpan'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-y-auto">
          <div className="mb-2">
            <button
              onClick={addMenuItem}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
            >
              <Plus size={12} />
              Tambah Item
            </button>
          </div>

          <div className="space-y-2">
            {menuItems.map((item, index) => renderItem(item, index))}
          </div>

          {menuItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Item Menu</h3>
              <p className="text-sm text-gray-500 mb-4">Tambahkan item menu untuk ditampilkan di header</p>
              <button
                onClick={addMenuItem}
                className="flex items-center gap-2 px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors mx-auto"
              >
                <Plus size={16} />
                Tambah Item Pertama
              </button>
            </div>
          )}
        </div>
      </div>

      {renderEditModal()}

      {showUnsavedChangesDialog && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-96 max-w-[90vw] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Perubahan Belum Disimpan</h3>
                <p className="text-sm text-gray-600">Anda memiliki perubahan yang belum disimpan.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Lanjutkan Mengedit
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Buang Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModalUnsavedDialog && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-96 max-w-[90vw] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Perubahan Belum Disimpan</h3>
                <p className="text-sm text-gray-600">Ada perubahan yang belum disimpan di modal edit.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelEditModalClose}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={confirmEditModalClose}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Buang Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssetPicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih atau Upload Asset</h3>
              <button
                onClick={() => setShowAssetPicker(false)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
