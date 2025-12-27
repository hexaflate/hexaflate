import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Eye, 
  Edit3, 
  FileText, 
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Trash2,
  Search,
  Copy,
  ExternalLink,
  Image,
  Upload,
  X,
  Check,
  Link2,
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { useToast } from './Toast';
import { getCachedMarkdownFiles, setCachedMarkdownFiles, getCachedMarkdownFile, setCachedMarkdownFile, removeCachedMarkdownFile, mergeMarkdownFiles } from '../utils/markdownCache';
import AssetsManager from './AssetsManager';
import { ConfirmDialog } from '../styles';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface MarkdownEditorProps {
  authSeed: string;
  onNavigate: (screen: string) => void;
}

export interface MarkdownEditorRef {
  refresh: () => void;
  showNewFileDialog: () => void;
  saveCurrentFile: () => void;
  downloadMarkdown: () => void;
  backToFiles: () => void;
  openLinkModal: () => void;
  currentFile: MarkdownFile | null;
  saving: boolean;
}

interface MarkdownFile {
  filename: string;
  title: string;
  content: string;
  created_at?: string;
  modified_at?: string;
  size: number;
}

const MarkdownEditor = React.forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({ authSeed }, ref) => {
    const { showToast } = useToast();
const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [currentFile, setCurrentFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showToolbar] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => ({
    refresh: loadMarkdownFiles,
    showNewFileDialog: () => setShowNewFileDialog(true),
    saveCurrentFile,
    downloadMarkdown,
    backToFiles: handleBackToFiles,
    openLinkModal: handleOpenLinkModal,
    currentFile,
    saving,
  }));

  const loadMarkdownFiles = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        if (!background) {
          showToast('No admin session found', 'error');
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFiles(prev => {
            if (prev.length === 0) {
              return data.files || [];
            }
            return mergeMarkdownFiles(prev, data.files || []);
          });
          setCachedMarkdownFiles(data.files || []);
        } else {
          if (!background) {
            showToast(data.message || 'Failed to load markdown files', 'error');
          }
        }
      } else {
        if (!background) {
          showToast('Failed to load markdown files', 'error');
        }
      }
    } catch (error) {
      if (!background) {
        showToast('Error loading markdown files', 'error');
      }
    }
  }, [authSeed]);

  useEffect(() => {
    // Load from cache immediately
    const cached = getCachedMarkdownFiles();
    if (cached) {
      setFiles(cached);
    }

    // Fetch from API in background
    loadMarkdownFiles(true);

    // Get the base URL for raw markdown links
    getApiUrl('/').then(url => {
      setBaseUrl(url.replace(/\/$/, '')); // Remove trailing slash
    });
  }, [loadMarkdownFiles]);

  const loadFile = async (filename: string) => {
    // Load from cache immediately
    const cached = getCachedMarkdownFile(filename);
    if (cached) {
      setCurrentFile(cached);
      setContent(cached.content);
    }

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/get');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.file) {
          setCurrentFile(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(data.file)) {
              return prev;
            }
            return data.file;
          });
          setContent(data.file.content);
          setCachedMarkdownFile(filename, data.file);
        } else {
          showToast(data.message || 'Failed to load file', 'error');
        }
      } else {
        showToast('Failed to load file', 'error');
      }
    } catch (error) {
      showToast('Error loading file', 'error');
    }
  };

  const saveCurrentFile = async () => {
    if (!currentFile) return;

    setSaving(true);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ 
          filename: currentFile.filename,
          content 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('File saved successfully!', 'success');
          setLastSaved(new Date());
          // Update the current file with new data
          if (data.file) {
            const updatedFile = { ...data.file, content };
            setCurrentFile(updatedFile);
            setCachedMarkdownFile(currentFile.filename, updatedFile);

            // Update file in files list
            setFiles(prev => {
              const updated = prev.map(f => 
                f.filename === currentFile.filename ? updatedFile : f
              );
              setCachedMarkdownFiles(updated);
              return updated;
            });
          }
        } else {
          showToast(data.message || 'Failed to save file', 'error');
        }
      } else {
        showToast('Failed to save file', 'error');
      }
    } catch (error) {
      showToast('Error saving file', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createNewFile = async () => {
    if (!newFileName.trim()) return;

    const filename = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const newContent = `# ${newFileName.replace('.md', '').replace(/[-_]/g, ' ')}\n\nStart writing your content here...\n`;

    setSaving(true);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ 
          filename,
          content: newContent
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('New file created successfully!', 'success');
          setNewFileName('');
          setShowNewFileDialog(false);
          // Load the new file
          if (data.file) {
            setCurrentFile(data.file);
            setContent(data.file.content);
            setCachedMarkdownFile(data.file.filename, data.file);

            // Add to files list
            setFiles(prev => {
              const updated = [...prev, data.file];
              setCachedMarkdownFiles(updated);
              return updated;
            });
          }
        } else {
          showToast(data.message || 'Failed to create file', 'error');
        }
      } else {
        showToast('Failed to create file', 'error');
      }
    } catch (error) {
      showToast('Error creating file', 'error');
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteFile = (filename: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFileToDelete(filename);
    setShowDeleteConfirm(true);
  };

  const deleteFile = async (filename: string) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');

      if (!sessionKey) {
        showToast('No admin session found', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/markdowns/delete');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast('File deleted successfully!', 'success');
          // If we deleted the current file, clear it
          if (currentFile && currentFile.filename === filename) {
            setCurrentFile(null);
            setContent('');
          }
          // Remove from files list and cache
          setFiles(prev => {
            const updated = prev.filter(f => f.filename !== filename);
            setCachedMarkdownFiles(updated);
            return updated;
          });
          removeCachedMarkdownFile(filename);
        } else {
          showToast(data.message || 'Failed to delete file', 'error');
        }
      } else {
        showToast('Failed to delete file', 'error');
      }
    } catch (error) {
      showToast('Error deleting file', 'error');
    }
  };

  const handleBackToFiles = () => {
    setCurrentFile(null);
    setContent('');
  };

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + text + content.substring(start);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const downloadMarkdown = () => {
    if (!currentFile) return;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenLinkModal = () => {
    if (!currentFile) {
      showToast('Please select a file first', 'error');
      return;
    }
    const link = `${window.location.origin}/content?file=${encodeURIComponent(currentFile.filename)}`;
    setGeneratedLink(link);
    setCopied(false);
    setShowLinkModal(true);
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      showToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      showToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyRawUrl = (filename: string) => {
    const rawUrl = `${baseUrl}/markdown/${filename}`;
    navigator.clipboard.writeText(rawUrl);
    showToast('Raw URL copied to clipboard!', 'success');
  };

  const openRawUrl = (filename: string) => {
    const rawUrl = `${baseUrl}/markdown/${filename}`;
    window.open(rawUrl, '_blank');
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  const handleImageInsert = () => {
    if (!imageUrl.trim()) return;

    const altText = imageAlt.trim() || 'Image';
    const imageMarkdown = `![${altText}](${imageUrl})`;
    insertAtCursor(imageMarkdown);

    // Reset form
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
  };

  const cancelImageInsert = () => {
    setImageUrl('');
    setImageAlt('');
    setShowImageDialog(false);
  };

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
      formData.append('auth_seed', authSeed);
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

  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await handleUploadFile(file);

    if (url) {
      setImageUrl(url);
    } else {
    }

    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

  const handleImageAssetSelect = (url: string) => {
    if (url) {
      setImageUrl(url);
      setShowAssetPicker(false);
    }
  };

  const renderPreview = () => {
    if (!content.trim()) {
      return { __html: '<p class="text-gray-500 italic">Start typing to see preview...</p>' };
    }

    // Process tables first (before other transformations)
    let processedContent = content.replace(/^(\|.+\|)\r?\n(\|[-:| ]+\|)\r?\n((?:\|.+\|\r?\n?)+)/gm, (match, headerRow, separatorRow, bodyRows) => {
      const headers = headerRow.split('|').filter((cell: string) => cell.trim() !== '').map((cell: string) => cell.trim());
      const alignments = separatorRow.split('|').filter((cell: string) => cell.trim() !== '').map((cell: string) => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left';
      });
      const rows = bodyRows.trim().split('\n').map((row: string) => 
        row.split('|').filter((cell: string) => cell.trim() !== '').map((cell: string) => cell.trim())
      );

      let tableHtml = '<table class="min-w-full border-collapse border border-gray-300 my-4"><thead><tr>';
      headers.forEach((header: string, i: number) => {
        tableHtml += `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-${alignments[i] || 'left'}">${header}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      rows.forEach((row: string[]) => {
        tableHtml += '<tr>';
        row.forEach((cell: string, i: number) => {
          tableHtml += `<td class="border border-gray-300 px-4 py-2 text-${alignments[i] || 'left'}">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';
      return tableHtml;
    });

    // Enhanced markdown to HTML conversion
    let html = processedContent
      // Code blocks (must be processed first to avoid conflicts)
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">$2</code></pre>')
      // Horizontal rules
      .replace(/^(-{3,}|_{3,}|\*{3,})$/gim, '<hr class="border-t border-gray-300 my-6" />')
      // Headers (must be processed in order from h6 to h1)
      .replace(/^###### (.*$)/gim, '<h6 class="text-xs font-semibold mt-3 mb-1 text-gray-600">$1</h6>')
      .replace(/^##### (.*$)/gim, '<h5 class="text-sm font-semibold mt-3 mb-1 text-gray-700">$1</h5>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold mt-3 mb-2">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>')
      // Bold and italic (process bold first to avoid conflicts)
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-semibold"><em class="italic">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Images (must be processed before links to avoid conflicts)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm my-4" loading="lazy" />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary-600 hover:text-primary-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2">$1</blockquote>')
      // Task lists
      .replace(/^- \[x\] (.*$)/gim, '<li class="ml-4 list-none"><input type="checkbox" checked disabled class="mr-2" />$1</li>')
      .replace(/^- \[ \] (.*$)/gim, '<li class="ml-4 list-none"><input type="checkbox" disabled class="mr-2" />$1</li>')
      // Lists - unordered
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Lists - ordered
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');

    // Wrap content in paragraphs
    html = '<p class="mb-3">' + html + '</p>';

    // Process lists properly
    html = html.replace(/(<li class="ml-4">.*?<\/li>)/g, (match) => {
      return '<ul class="list-disc list-inside mb-3">' + match + '</ul>';
    });

    // Clean up empty paragraphs and fix list formatting
    html = html
      .replace(/<p class="mb-3"><\/p>/g, '')
      .replace(/<p class="mb-3"><ul/g, '<ul')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p class="mb-3"><h/g, '<h')
      .replace(/<\/h[1-6]><\/p>/g, (match) => match.replace('</p>', ''))
      .replace(/<p class="mb-3"><hr/g, '<hr')
      .replace(/\/><\/p>/g, '/>')
      .replace(/<p class="mb-3"><pre/g, '<pre')
      .replace(/<\/pre><\/p>/g, '</pre>')
      .replace(/<p class="mb-3"><table/g, '<table')
      .replace(/<\/table><\/p>/g, '</table>');

    return { __html: html };
  };

  const filteredFiles = files.filter(file => 
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {currentFile ? (
        <>
          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
              {showToolbar && (
                <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* View Mode Toggle */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewMode('edit')}
                          className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${
                            viewMode === 'edit' 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${
                            viewMode === 'preview' 
                              ? 'bg-primary-100 text-primary-700' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview</span>
                        </button>
                      </div>

                      {/* Markdown Tools */}
                      {viewMode === 'edit' && (
                        <div className="flex items-center space-x-1 border-l border-gray-300 pl-4">
                          <button
                            onClick={() => insertMarkdown('**', '**')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Bold"
                          >
                            <Bold className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('*', '*')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Italic"
                          >
                            <Italic className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('`', '`')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Code"
                          >
                            <Code className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('# ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Heading 1"
                          >
                            <Heading1 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('## ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Heading 2"
                          >
                            <Heading2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('### ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Heading 3"
                          >
                            <Heading3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('- ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Bullet List"
                          >
                            <List className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertAtCursor('> ')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Quote"
                          >
                            <Quote className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => insertMarkdown('[', '](url)')}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Link"
                          >
                            <Link className="h-4 w-4" />
                          </button>
                          <button
                            onClick={insertImage}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                            title="Image"
                          >
                            <Image className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Editor Settings */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Font Size:</label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value={12}>12px</option>
                          <option value={14}>14px</option>
                          <option value={16}>16px</option>
                          <option value={18}>18px</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor Content */}
              <div className="flex-1 flex flex-col p-3 min-h-0">
                <div className="w-full flex-1 flex flex-col min-h-0">
                  {viewMode === 'edit' ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 flex-1 flex flex-col min-h-0">
                      <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full flex-1 p-4 border-0 resize-none focus:outline-none font-mono overflow-auto min-h-0 bg-transparent rounded-xl placeholder:text-neutral-400"
                        style={{
                          fontSize: `${fontSize}px`,
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}
                        placeholder="Start writing your markdown content..."
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 flex-1 flex flex-col min-h-0">
                      <div className="p-4 flex-1 overflow-auto min-h-0">
                        {content.trim() ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={renderPreview()}
                          />
                        ) : (
                          <div className="text-neutral-500 italic text-center py-8">
                            Start typing in edit mode to see the preview...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Variables Help Section */}
              <div className="bg-primary-50 border-t border-primary-200 px-6 py-2 flex-shrink-0">
                <details className="text-xs">
                  <summary className="font-semibold text-primary-800 cursor-pointer hover:text-blue-900">
                    📝 Variabel Dinamis (klik untuk melihat)
                  </summary>
                  <div className="mt-2 text-primary-700">
                    <p className="mb-1">Gunakan variabel berikut untuk menampilkan data pengguna secara dinamis:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      <div>
                        <span className="font-mono bg-primary-100 px-1 rounded">{'{{name}}'}</span> / <span className="font-mono bg-primary-100 px-1 rounded">{'{{nama}}'}</span>
                        <span className="text-primary-600 ml-1">- Nama</span>
                      </div>
                      <div>
                        <span className="font-mono bg-primary-100 px-1 rounded">{'{{email}}'}</span>
                        <span className="text-primary-600 ml-1">- Email</span>
                      </div>
                      <div>
                        <span className="font-mono bg-primary-100 px-1 rounded">{'{{kode}}'}</span> / <span className="font-mono bg-primary-100 px-1 rounded">{'{{code}}'}</span>
                        <span className="text-primary-600 ml-1">- Kode</span>
                      </div>
                      <div>
                        <span className="font-mono bg-primary-100 px-1 rounded">{'{{saldo}}'}</span> / <span className="font-mono bg-primary-100 px-1 rounded">{'{{balance}}'}</span>
                        <span className="text-primary-600 ml-1">- Saldo (Rp)</span>
                      </div>
                      <div>
                        <span className="font-mono bg-primary-100 px-1 rounded">{'{{komisi}}'}</span> / <span className="font-mono bg-primary-100 px-1 rounded">{'{{commission}}'}</span>
                        <span className="text-primary-600 ml-1">- Komisi (Rp)</span>
                      </div>
                      <div>
                        <span className="font-mono bg-primary-100 px-1 rounded">{'{{poin}}'}</span> / <span className="font-mono bg-primary-100 px-1 rounded">{'{{points}}'}</span>
                        <span className="text-primary-600 ml-1">- Poin</span>
                      </div>
                    </div>
                    <p className="mt-1 italic text-primary-600">Contoh: "Hai {'{{nama}}'}, saldo Anda: {'{{saldo}}'}"</p>
                  </div>
                </details>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-gray-200 px-6 py-2 flex-shrink-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>File: {currentFile.filename}</span>
                    {lastSaved && (
                      <span>Last saved: {lastSaved.toLocaleString()}</span>
                    )}
                    {baseUrl && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Raw URL:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {baseUrl}/markdown/{currentFile.filename}
                        </span>
                        <button
                          onClick={() => copyRawUrl(currentFile.filename)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy raw URL"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openRawUrl(currentFile.filename)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Open raw URL"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Characters: {content.length}</span>
                    <span>Lines: {content.split('\n').length}</span>
                    <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
                  </div>
                </div>
              </div>
          </div>
        </>
      ) : (
        <>
          {/* File List View */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* File Grid */}
            {filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No files found' : 'No markdown files'}
                  </h3>
                  {!searchQuery && (
                    <p className="text-gray-500 mb-4">Create your first markdown file to get started</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file.filename}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 p-5 cursor-pointer hover:shadow-lg hover:border-primary-200/80 transition-all duration-200 group"
                    onClick={() => loadFile(file.filename)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-800 truncate mb-1">
                          {file.title}
                        </h3>
                        <p className="text-sm text-neutral-500 truncate mb-2">
                          {file.filename}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-neutral-400">
                          <span>{file.size} bytes</span>
                          {file.modified_at && (
                            <span>• {new Date(file.modified_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => promptDeleteFile(file.filename, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-200"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {baseUrl && (
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-600 font-mono truncate flex-1">
                            {baseUrl}/markdown/{file.filename}
                          </span>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyRawUrl(file.filename);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Copy raw URL"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRawUrl(file.filename);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Open raw URL"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New File</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-document.md"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewFileDialog(false);
                  setNewFileName('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                disabled={!newFileName.trim() || saving}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insert Image</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                {imageUrl && (
                  <div className="flex-shrink-0 w-9 h-9 rounded border border-gray-200 overflow-hidden bg-gray-100">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="px-3 py-2 text-white rounded-md transition-colors flex items-center gap-1"
                  style={{ backgroundColor: THEME_COLOR }}
                  title="Upload image"
                >
                  <Upload size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssetPicker(true)}
                  className="px-3 py-2 bg-success-500 text-white rounded-md hover:bg-success-600 transition-colors flex items-center gap-1"
                  title="Select from assets"
                >
                  <Image size={14} />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Text (optional)
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description of the image"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelImageInsert}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImageInsert}
                disabled={!imageUrl.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
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
                authSeed={authSeed}
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleImageAssetSelect}
              />
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800 mb-2">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk memilih dan menerapkan ke field Image URL secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setFileToDelete(null);
        }}
        onConfirm={() => {
          if (fileToDelete) {
            deleteFile(fileToDelete);
          }
          setShowDeleteConfirm(false);
          setFileToDelete(null);
        }}
        title="Hapus File"
        message={`Apakah Anda yakin ingin menghapus "${fileToDelete}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />

      {/* Generate Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Rendered Content Link</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Share this link to view the rendered markdown content for <strong>{currentFile?.filename}</strong>
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={() => window.open(generatedLink, '_blank')}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
