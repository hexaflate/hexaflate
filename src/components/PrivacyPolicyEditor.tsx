import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Eye,
  Edit3,
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Copy,
  Check,
  X,
} from "lucide-react";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import { useToast } from "./Toast";
import {
  getCachedPrivacyPolicy,
  setCachedPrivacyPolicy,
} from "../utils/privacyPolicyCache";
import { generatePrivacyPolicyLink } from "../utils/encryption";

interface PrivacyPolicyEditorProps {
  authSeed: string;
  onNavigate: (screen: string) => void;
}

export interface PrivacyPolicyEditorRef {
  save: () => Promise<void>;
  refresh: () => void;
  download: () => void;
  uploadFile: () => void;
  openLinkModal: () => void;
  saving: boolean;
}

const PrivacyPolicyEditor = forwardRef<PrivacyPolicyEditorRef, PrivacyPolicyEditorProps>(({
  authSeed,
}, ref) => {
  const { showToast } = useToast();
  const [content, setContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [showToolbar] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [appName, setAppName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    save: savePrivacyPolicy,
    refresh: () => loadPrivacyPolicy(false),
    download: downloadMarkdown,
    uploadFile: () => fileInputRef.current?.click(),
    openLinkModal,
    saving,
  }));

  const loadPrivacyPolicy = useCallback(
    async (background = false) => {
      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          if (!background) {
            showToast("No admin session found", "error");
          }
          return;
        }

        const apiUrl = await getApiUrl("/admin/privacy-policy");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.content) {
            setContent((prev) => {
              if (prev === data.content) {
                return prev;
              }
              return data.content;
            });
            setCachedPrivacyPolicy(data.content);
          } else {
            if (!background) {
              showToast(
                data.message || "Failed to load privacy policy",
                "error",
              );
            }
          }
        } else {
          if (!background) {
            showToast("Failed to load privacy policy", "error");
          }
        }
      } catch (error) {
        if (!background) {
          showToast("Error loading privacy policy", "error");
        }
      }
    },
    [authSeed],
  );

  useEffect(() => {
    // Load from cache immediately
    const cached = getCachedPrivacyPolicy();
    if (cached) {
      setContent(cached);
    }

    // Fetch from API in background
    loadPrivacyPolicy(true);
  }, [loadPrivacyPolicy]);

  const savePrivacyPolicy = async () => {
    setSaving(true);
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");

      if (!sessionKey) {
        showToast("No admin session found", "error");
        return;
      }

      const apiUrl = await getApiUrl("/admin/privacy-policy/save");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
          "Session-Key": sessionKey,
          "Auth-Seed": authSeed,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast("Privacy policy saved successfully!", "success");
          setLastSaved(new Date());
          setCachedPrivacyPolicy(content);
        } else {
          showToast(data.message || "Failed to save privacy policy", "error");
        }
      } else {
        showToast("Failed to save privacy policy", "error");
      }
    } catch (error) {
      showToast("Error saving privacy policy", "error");
    } finally {
      setSaving(false);
    }
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.getElementById(
      "markdown-editor",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;

    const newContent =
      content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      );
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById(
      "markdown-editor",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent =
      content.substring(0, start) + text + content.substring(start);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PRIVACY_POLICY.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadMarkdown = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const renderPreview = () => {
    if (!content.trim()) {
      return {
        __html:
          '<p class="text-gray-500 italic">Start typing to see preview...</p>',
      };
    }

    // Process tables first (before other transformations)
    let processedContent = content.replace(
      /^(\|.+\|)\r?\n(\|[-:| ]+\|)\r?\n((?:\|.+\|\r?\n?)+)/gm,
      (_match, headerRow, separatorRow, bodyRows) => {
        const headers = headerRow
          .split("|")
          .filter((cell: string) => cell.trim() !== "")
          .map((cell: string) => cell.trim());
        const alignments = separatorRow
          .split("|")
          .filter((cell: string) => cell.trim() !== "")
          .map((cell: string) => {
            const trimmed = cell.trim();
            if (trimmed.startsWith(":") && trimmed.endsWith(":"))
              return "center";
            if (trimmed.endsWith(":")) return "right";
            return "left";
          });
        const rows = bodyRows
          .trim()
          .split("\n")
          .map((row: string) =>
            row
              .split("|")
              .filter((cell: string) => cell.trim() !== "")
              .map((cell: string) => cell.trim()),
          );

        let tableHtml =
          '<table class="min-w-full border-collapse border border-gray-300 my-4"><thead><tr>';
        headers.forEach((header: string, i: number) => {
          tableHtml += `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-${alignments[i] || "left"}">${header}</th>`;
        });
        tableHtml += "</tr></thead><tbody>";
        rows.forEach((row: string[]) => {
          tableHtml += "<tr>";
          row.forEach((cell: string, i: number) => {
            tableHtml += `<td class="border border-gray-300 px-4 py-2 text-${alignments[i] || "left"}">${cell}</td>`;
          });
          tableHtml += "</tr>";
        });
        tableHtml += "</tbody></table>";
        return tableHtml;
      },
    );

    // Enhanced markdown to HTML conversion
    let html = processedContent
      // Code blocks (must be processed first to avoid conflicts)
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        '<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">$2</code></pre>',
      )
      // Horizontal rules
      .replace(
        /^(-{3,}|_{3,}|\*{3,})$/gim,
        '<hr class="border-t border-gray-300 my-6" />',
      )
      // Headers (must be processed in order from h6 to h1)
      .replace(
        /^###### (.*$)/gim,
        '<h6 class="text-xs font-semibold mt-3 mb-1 text-gray-600">$1</h6>',
      )
      .replace(
        /^##### (.*$)/gim,
        '<h5 class="text-sm font-semibold mt-3 mb-1 text-gray-700">$1</h5>',
      )
      .replace(
        /^#### (.*$)/gim,
        '<h4 class="text-base font-semibold mt-3 mb-2">$1</h4>',
      )
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>',
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>',
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>',
      )
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>')
      // Bold and italic (process bold first to avoid conflicts)
      .replace(
        /\*\*\*(.*?)\*\*\*/g,
        '<strong class="font-semibold"><em class="italic">$1</em></strong>',
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
      )
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-primary-600 hover:text-primary-800 underline">$1</a>',
      )
      // Blockquotes
      .replace(
        /^> (.*$)/gim,
        '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2">$1</blockquote>',
      )
      // Task lists
      .replace(
        /^- \[x\] (.*$)/gim,
        '<li class="ml-4 list-none"><input type="checkbox" checked disabled class="mr-2" />$1</li>',
      )
      .replace(
        /^- \[ \] (.*$)/gim,
        '<li class="ml-4 list-none"><input type="checkbox" disabled class="mr-2" />$1</li>',
      )
      // Lists - unordered
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Lists - ordered
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, "<br>");

    // Wrap content in paragraphs
    html = '<p class="mb-3">' + html + "</p>";

    // Process lists properly
    html = html.replace(/(<li class="ml-4">.*?<\/li>)/g, (match) => {
      return '<ul class="list-disc list-inside mb-3">' + match + "</ul>";
    });

    // Clean up empty paragraphs and fix list formatting
    html = html
      .replace(/<p class="mb-3"><\/p>/g, "")
      .replace(/<p class="mb-3"><ul/g, "<ul")
      .replace(/<\/ul><\/p>/g, "</ul>")
      .replace(/<p class="mb-3"><h/g, "<h")
      .replace(/<\/h[1-6]><\/p>/g, (match) => match.replace("</p>", ""))
      .replace(/<p class="mb-3"><hr/g, "<hr")
      .replace(/\/><\/p>/g, "/>")
      .replace(/<p class="mb-3"><pre/g, "<pre")
      .replace(/<\/pre><\/p>/g, "</pre>")
      .replace(/<p class="mb-3"><table/g, "<table")
      .replace(/<\/table><\/p>/g, "</table>");

    return { __html: html };
  };

  const handleGenerateLink = () => {
    if (!appName.trim()) {
      showToast("Please enter an app name", "error");
      return;
    }
    const link = generatePrivacyPolicyLink(appName.trim());
    setGeneratedLink(link);
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      showToast("Link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      showToast("Link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openLinkModal = () => {
    setAppName("");
    setGeneratedLink("");
    setCopied(false);
    setShowLinkModal(true);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Hidden file input for upload */}
      <input
        type="file"
        accept=".md,.txt"
        onChange={uploadMarkdown}
        className="hidden"
        ref={fileInputRef}
      />

      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("edit")}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${
                    viewMode === "edit"
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center space-x-2 ${
                    viewMode === "preview"
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </button>
              </div>

              {/* Markdown Tools */}
              {viewMode === "edit" && (
                <div className="flex items-center space-x-1 border-l border-gray-300 pl-4">
                  <button
                    onClick={() => insertMarkdown("**", "**")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("*", "*")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("`", "`")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertAtCursor("# ")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertAtCursor("## ")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertAtCursor("### ")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Heading 3"
                  >
                    <Heading3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertAtCursor("- ")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertAtCursor("> ")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Quote"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("[", "](url)")}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Link"
                  >
                    <Link className="h-4 w-4" />
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div className="w-full flex-1 flex flex-col min-h-0">
          {viewMode === "edit" ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-100/80 flex-1 flex flex-col min-h-0">
              <textarea
                id="markdown-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 p-4 border-0 resize-none focus:outline-none font-mono overflow-auto min-h-0 bg-transparent rounded-xl placeholder:text-neutral-400"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                }}
                placeholder="Start writing your privacy policy in Markdown..."
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

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-neutral-100 px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <div className="flex items-center space-x-4">
            {lastSaved && <span>Last saved: {lastSaved.toLocaleString()}</span>}
          </div>
          <div className="flex items-center space-x-4">
            <span>Characters: {content.length}</span>
            <span>Lines: {content.split("\n").length}</span>
            <span>
              Words:{" "}
              {content.split(/\s+/).filter((word) => word.length > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Generate Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate Privacy Policy Link</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateLink()}
                  placeholder="Enter app name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tambahkan nama app di sini untuk merubah [[app_name]] 
                </p>
              </div>

              <button
                onClick={handleGenerateLink}
                disabled={!appName.trim()}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Link2 className="h-4 w-4" />
                <span>Generate Link</span>
              </button>

              {generatedLink && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Generated Link
                  </label>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PrivacyPolicyEditor;