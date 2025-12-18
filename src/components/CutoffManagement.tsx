import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { useToast } from './Toast';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface CutoffManagementProps {
  authSeed: string;
  onNavigate: (section: string) => void;
}

interface CurrentAdminInfo {
  id: string;
  name: string;
  admin_type: string;
  is_super_admin: boolean;
}

interface CutoffConfig {
  cutoff_start: string;
  cutoff_end: string;
}

interface CutoffConfigResponse {
  success: boolean;
  message: string;
  config?: CutoffConfig;
}

const CutoffManagement: React.FC<CutoffManagementProps> = ({ authSeed, onNavigate }) => {
    const { showToast } = useToast();
const [config, setConfig] = useState<CutoffConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<CurrentAdminInfo | null>(null);

  useEffect(() => {
    fetchCurrentAdminInfo();
  }, []);

  useEffect(() => {
    if (currentAdminInfo) {
      loadCutoffConfig();
    }
  }, [currentAdminInfo]);

  const fetchCurrentAdminInfo = async () => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        showToast('Session key not found. Please login again.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/current-admin-info');
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: CurrentAdminInfo = await response.json();

      if (response.ok) {
        setCurrentAdminInfo(data);
      } else {
        showToast('Failed to verify admin privileges.', 'error');
      }
    } catch (error) {
      showToast('Failed to verify admin privileges.', 'error');
    }
  };

  const loadCutoffConfig = async () => {
    try {
      setLoading(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        showToast('Session key not found. Please login again.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/cutoff-config');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: CutoffConfigResponse = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        showToast(data.message || 'Failed to load cutoff configuration', 'error');
      }
    } catch (error) {
      showToast('Failed to load cutoff configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveCutoffConfig = async () => {
    if (!config) return;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(config.cutoff_start) || !timeRegex.test(config.cutoff_end)) {
      showToast('Invalid time format. Please use HH:MM format (e.g., 23:45)', 'error');
      return;
    }

    try {
      setSaving(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        showToast('Session key not found. Please login again.', 'error');
        return;
      }

      const apiUrl = await getApiUrl('/admin/cutoff-config/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ config }),
      });

      const data: CutoffConfigResponse = await response.json();

      if (data.success) {
        showToast('Cutoff configuration saved successfully!', 'success');
        // Clear message after 3 seconds
      } else {
        showToast(data.message || 'Failed to save cutoff configuration', 'error');
      }
    } catch (error) {
      showToast('Failed to save cutoff configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CutoffConfig, value: string) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-200/80 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading cutoff configuration...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cutoff Time Management</h1>
              <p className="text-gray-600">Configure system cutoff times for transaction processing</p>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        {currentAdminInfo && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-primary-600" />
              <span className="text-primary-800">
                Logged in as: <strong>{currentAdminInfo.name}</strong> ({currentAdminInfo.admin_type} admin)
              </span>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card border border-neutral-200/80">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cutoff Time Settings</h2>

            {config ? (
              <div className="space-y-6">
                {/* Cutoff Start Time */}
                <div>
                  <label htmlFor="cutoff_start" className="block text-sm font-medium text-gray-700 mb-2">
                    Cutoff Start Time
                  </label>
                  <input
                    type="time"
                    id="cutoff_start"
                    value={config.cutoff_start}
                    onChange={(e) => handleInputChange('cutoff_start', e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                    placeholder="23:45"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Time when the system starts the cutoff period (24-hour format)
                  </p>
                </div>

                {/* Cutoff End Time */}
                <div>
                  <label htmlFor="cutoff_end" className="block text-sm font-medium text-gray-700 mb-2">
                    Cutoff End Time
                  </label>
                  <input
                    type="time"
                    id="cutoff_end"
                    value={config.cutoff_end}
                    onChange={(e) => handleInputChange('cutoff_end', e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-200/80 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                    placeholder="00:15"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Time when the system ends the cutoff period (24-hour format)
                  </p>
                </div>

                {/* Information Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-warning-800">
                      <p className="font-medium mb-1">About Cutoff Times:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>During cutoff period, certain transactions may be restricted or delayed</li>
                        <li>Times are in 24-hour format (HH:MM)</li>
                        <li>Changes take effect immediately after saving</li>
                        <li>Example: 23:45 to 00:15 means cutoff from 11:45 PM to 12:15 AM</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={saveCutoffConfig}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Failed to load cutoff configuration</p>
                <button
                  onClick={loadCutoffConfig}
                  className="mt-4 inline-flex items-center px-4 py-2.5 border border-neutral-200/80 text-sm font-medium rounded-xl text-neutral-700 bg-white/80 hover:bg-neutral-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CutoffManagement;
