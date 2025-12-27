import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import { renderMarkdownToHtml } from "../utils/markdownRenderer";

const MarkdownContentViewer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const filename = searchParams.get("file");
    if (filename) {
      setTitle(filename.replace(".md", "").replace(/-/g, " "));
      loadMarkdownContent(filename);
    } else {
      setError("No file specified");
      setLoading(false);
    }
  }, [searchParams]);

  const loadMarkdownContent = async (filename: string) => {
    setLoading(true);
    setError("");

    try {
      const apiUrl = await getApiUrl(`/markdown/${filename}`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-Token": X_TOKEN_VALUE,
        },
      });

      if (response.ok) {
        const markdown = await response.text();
        if (markdown && markdown.trim()) {
          setContent(markdown);
        } else {
          setError("Content not found");
        }
      } else {
        setError("Failed to load content");
      }
    } catch (err) {
      setError("Error loading content");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Content</h1>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownContentViewer;

