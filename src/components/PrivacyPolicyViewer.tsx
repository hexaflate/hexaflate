import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { decryptAppName } from "../utils/encryption";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import { renderMarkdownToHtml } from "../utils/markdownRenderer";

const PrivacyPolicyViewer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState<string>("");
  const [appName, setAppName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const encryptedName = searchParams.get("name");

    if (encryptedName) {
      const decryptedName = decryptAppName(encryptedName);
      setAppName(decryptedName);
    } else {
      setAppName("Unknown App");
    }

    loadPrivacyPolicy();
  }, [searchParams]);

  const loadPrivacyPolicy = async () => {
    setLoading(true);
    setError("");

    try {
      const apiUrl = await getApiUrl("/privacy-policy");
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
          setError("Privacy policy not found");
        }
      } else {
        setError("Failed to load privacy policy");
      }
    } catch (err) {
      setError("Error loading privacy policy");
    } finally {
      setLoading(false);
    }
  };

  const processContent = (rawContent: string): string => {
    // Replace [[app_name]] placeholder with the actual app name
    return rawContent.replace(/\[\[app_name\]\]/g, appName);
  };

  const getRenderedHtml = () => {
    const processedContent = processContent(content);
    return { __html: renderMarkdownToHtml(processedContent) };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading privacy policy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Privacy Policy
                </h1>
                <p className="text-sm text-gray-600">{appName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={getRenderedHtml()}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <p className="text-sm text-gray-500 text-center">
            This privacy policy is for {appName}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyViewer;

