import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Card, Button, Modal, Alert, Spinner } from '../styles';
import { LogIn, LogOut, Edit2, Key, RefreshCw } from 'lucide-react';

interface ConfigEntry {
  key: string;
  value: string;
}

interface PortalConfigProps {
  authSeed: string;
}

const PortalConfig: React.FC<PortalConfigProps> = ({ authSeed }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [serverName, setServerName] = useState<string | null>(null);
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user?.email) {
        try {
          const { getDoc } = await import('firebase/firestore');
          const userServerDoc = await getDoc(doc(db, 'user_servers', user.email));
          if (userServerDoc.exists()) {
            setServerName(userServerDoc.data().server_name);
          } else {
            setServerName(null);
          }
        } catch (err) {
          setServerName(null);
        }
      } else {
        setServerName(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (serverName) {
      fetchConfigs();
    }
  }, [serverName]);

  const fetchConfigs = async () => {
    if (!serverName) return;

    setConfigLoading(true);
    setError('');

    try {
      const configsRef = collection(db, 'env_configs', serverName, 'configs');
      const snapshot = await getDocs(configsRef);

      const configList: ConfigEntry[] = [];
      snapshot.forEach((doc) => {
        configList.push({
          key: doc.id,
          value: doc.data().value || ''
        });
      });

      configList.sort((a, b) => a.key.localeCompare(b.key));
      setConfigs(configList);
    } catch (err) {
      setError('Gagal memuat konfigurasi');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError('Email dan password harus diisi');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setServerName(null);
      setConfigs([]);
    } catch (err) {
    }
  };

  const openEditModal = (config: ConfigEntry) => {
    setEditKey(config.key);
    setEditValue(config.value);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editKey.trim() || !serverName) {
      setError('Key is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const configRef = doc(db, 'env_configs', serverName, 'configs', editKey.trim());
      await setDoc(configRef, { value: editValue });

      setSuccess(`Konfigurasi "${editKey}" berhasil disimpan`);
      setShowEditModal(false);
      await fetchConfigs();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not logged in to Firebase
  if (!firebaseUser) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-500" />
              Portal Config
            </div>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Login Portal Required</h3>
              <p className="text-neutral-500 mb-6">
                Silakan login dengan akun portal Anda untuk mengakses konfigurasi server.
              </p>
              <Button onClick={() => setShowLoginModal(true)} icon={<LogIn className="h-4 w-4" />}>
                Login ke Portal
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Login Modal */}
        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="Login Portal"
          size="sm"
        >
          <div className="space-y-4">
            {loginError && (
              <Alert variant="danger">{loginError}</Alert>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowLoginModal(false)} fullWidth>
                Batal
              </Button>
              <Button onClick={handleLogin} loading={loginLoading} fullWidth>
                Login
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Logged in but no server assigned
  if (!serverName) {
    return (
      <div className="space-y-6">
        <Card>
          <Card.Header
            action={
              <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />}>
                Logout
              </Button>
            }
          >
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-500" />
              Portal Config
            </div>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-8">
              <Alert variant="warning" title="Server Tidak Ditemukan">
                Tidak ada server yang ditetapkan ke akun Anda ({firebaseUser.email}).
                Silakan hubungi administrator.
              </Alert>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Logged in with server assigned
  return (
    <div className="space-y-6">
      <Card>
        <Card.Header
          action={
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">{firebaseUser.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />}>
                Logout
              </Button>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-500" />
            <span>Portal Config</span>
            <span className="text-sm font-normal text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
              {serverName}
            </span>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4" dismissible onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-4" dismissible onDismiss={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <div className="flex justify-end mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchConfigs}
              loading={configLoading}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
          </div>

          {configLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              Tidak ada konfigurasi ditemukan.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              {configs.map((config, index) => (
                <div
                  key={config.key}
                  className={`flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-colors ${
                    index !== configs.length - 1 ? 'border-b border-neutral-200' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-900">{config.key}</div>
                    <div className="text-sm text-neutral-500 font-mono truncate max-w-md">
                      {config.value || '(kosong)'}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(config)}
                      icon={<Edit2 className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Konfigurasi"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Key</label>
            <input
              type="text"
              value={editKey}
              disabled
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Value</label>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Masukkan nilai konfigurasi..."
              rows={5}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} fullWidth>
              Batal
            </Button>
            <Button onClick={handleSave} loading={saving} fullWidth>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PortalConfig;
