import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  History, 
  TrendingUp, 
  Package, 
  User, 
  Menu,
  Home,
  CreditCard,
  BarChart3,
  Users,
  Share2,
  Star,
  Coins,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import MutationsView from './MutationsView';
import ProductsView from './ProductsView';
import DownlineView from './DownlineView';
import ReferralView from './ReferralView';
import PoinView from './PoinView';
import KomisiView from './KomisiView';
import { getApiUrl, X_TOKEN_VALUE, handleUnauthorizedResponse } from '../config/api';
import { domainConfig } from '../config/domainConfig';

interface WebReportDashboardProps {
  authSeed: string;
  onLogout: () => void;
}

interface UserInfo {
  kode: string;
  nama: string;
  email: string;
  saldo: number;
  alamat: string;
  poin: number;
  komisi: number;
  tgl_daftar?: string;
  nama_pemilik: string;
}

import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  THEME_COLOR_VERY_LIGHT,
  SIDEBAR_BG_FROM,
  SIDEBAR_BG_TO,
  withOpacity,
  lightenColor,
} from '../utils/themeColors';

const THEME_COLOR_LIGHT_VERY_LIGHT = lightenColor(THEME_COLOR_LIGHT, 85);

const WebReportDashboard: React.FC<WebReportDashboardProps> = ({ authSeed, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const cached = localStorage.getItem('webreportSidebarOpen');
    return cached !== null ? cached === 'true' : true;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('webreportSidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    fetchUserInfo();
  }, [authSeed]);

  const fetchUserInfo = async () => {
    try {
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        onLogout();
        return;
      }

      const apiUrl = await getApiUrl('/infouser');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (handleUnauthorizedResponse(response)) return;
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user_info) {
          setUserInfo(data.user_info);
        } else {
          // Set some default data for testing
          setUserInfo({
            kode: 'TEST001',
            nama: 'Test User',
            email: 'test@example.com',
            saldo: 100000,
            alamat: 'Test Address',
            poin: 50,
            komisi: 5000,
            nama_pemilik: 'Test Owner'
          });
        }
      } else {
        // Set some default data for testing
        setUserInfo({
          kode: 'TEST001',
          nama: 'Test User',
          email: 'test@example.com',
          saldo: 100000,
          alamat: 'Test Address',
          poin: 50,
          komisi: 5000,
          nama_pemilik: 'Test Owner'
        });
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('memberAuthSeed');
    localStorage.removeItem('memberSessionKey');
    onLogout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'Riwayat Transaksi', icon: History },
    { id: 'mutations', label: 'Mutasi Saldo', icon: TrendingUp },
    { id: 'products', label: 'Daftar Harga', icon: Package },
    { id: 'downline', label: 'Daftar Downline', icon: Users },
    { id: 'referral', label: 'Kode Referral', icon: Share2 },
    { id: 'poin', label: 'Poin & Hadiah', icon: Star },
    { id: 'komisi', label: 'Komisi', icon: Coins },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-success-50 to-success-100/50 rounded-xl shadow-card p-6 border border-success-100/80">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-sm">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-success-600">Saldo</p>
                    <p className="text-2xl font-bold text-neutral-800">
                      Rp {userInfo?.saldo?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="rounded-xl shadow-card p-6"
                style={{ 
                  background: `linear-gradient(to bottom right, ${withOpacity(THEME_COLOR, 0.05)}, ${withOpacity(THEME_COLOR, 0.1)})`,
                  borderColor: withOpacity(THEME_COLOR, 0.2),
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                <div className="flex items-center">
                  <div 
                    className="p-3 rounded-xl shadow-sm"
                    style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})` }}
                  >
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: THEME_COLOR }}>Level</p>
                    <p className="text-2xl font-bold text-neutral-800">Member</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl shadow-card p-6 border border-purple-100/80">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Status</p>
                    <p className="text-2xl font-bold text-success-600">Aktif</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-card p-6 border border-neutral-100/80">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Informasi Akun</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50/50 rounded-lg">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Nama</label>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{userInfo?.nama || '-'}</p>
                </div>
                <div className="p-3 bg-neutral-50/50 rounded-lg">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Email</label>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{userInfo?.email || '-'}</p>
                </div>
                <div className="p-3 bg-neutral-50/50 rounded-lg">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Kode Member</label>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{userInfo?.kode || '-'}</p>
                </div>
                <div className="p-3 bg-neutral-50/50 rounded-lg">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Alamat</label>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{userInfo?.alamat || '-'}</p>
                </div>
                <div className="p-3 bg-neutral-50/50 rounded-lg">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Poin</label>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{userInfo?.poin || 0}</p>
                </div>
                <div className="p-3 bg-neutral-50/50 rounded-lg">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">Komisi</label>
                  <p className="mt-1 text-sm font-medium text-neutral-800">Rp {userInfo?.komisi?.toLocaleString('id-ID') || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return <TransactionHistory authSeed={authSeed} />;
      case 'mutations':
        return <MutationsView authSeed={authSeed} />;
      case 'products':
        return <ProductsView authSeed={authSeed} />;
      case 'downline':
        return <DownlineView authSeed={authSeed} />;
      case 'referral':
        return <ReferralView authSeed={authSeed} />;
      case 'poin':
        return <PoinView authSeed={authSeed} />;
      case 'komisi':
        return <KomisiView authSeed={authSeed} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(to bottom right, ${THEME_COLOR_VERY_LIGHT}, white, ${withOpacity(THEME_COLOR_LIGHT_VERY_LIGHT, 0.5)})`
        }}
      >
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: THEME_COLOR }}
          ></div>
          <p className="mt-4 text-neutral-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  const activeMenuItem = menuItems.find(item => item.id === activeTab);

  return (
    <div 
      className="h-screen flex"
      style={{
        background: `linear-gradient(to bottom right, ${THEME_COLOR_VERY_LIGHT}, white, ${withOpacity(THEME_COLOR_LIGHT_VERY_LIGHT, 0.5)})`
      }}
    >
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-all duration-300`
        } border-r border-white/10 flex flex-col`}
        style={{ background: `linear-gradient(to bottom, ${SIDEBAR_BG_FROM}, ${SIDEBAR_BG_TO})` }}
      >
        {/* Header */}
        <div className="h-[57px] px-4 flex items-center justify-between border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-9 w-9 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                {domainConfig.webFavicon ? (
                  <img 
                    src={domainConfig.webFavicon} 
                    alt="Logo" 
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <span className="font-bold text-sm" style={{ color: THEME_COLOR }}>WR</span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span 
                  className="font-semibold bg-clip-text text-transparent text-sm whitespace-nowrap"
                  style={{ backgroundImage: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})` }}
                >
                  Web Report
                </span>
                <span className="text-xs text-white/50 whitespace-nowrap">Member Panel</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden border ${
                    activeTab === item.id
                      ? 'bg-white/15 backdrop-blur-md border-white/20 shadow-lg'
                      : 'text-white/70 hover:bg-white/10 hover:text-white border-transparent'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 ${activeTab === item.id ? '' : 'group-hover:text-white transition-colors duration-200'}`}
                    style={activeTab === item.id ? { color: THEME_COLOR } : undefined}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {sidebarOpen && (
                    <span
                      className={`ml-3 truncate whitespace-nowrap ${activeTab === item.id ? 'bg-clip-text text-transparent font-semibold' : ''}`}
                      style={activeTab === item.id ? { backgroundImage: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})` } : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && userInfo && (
            <div className="mb-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden">
              <div className="flex items-center gap-3">
                <div 
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0"
                  style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})`, boxShadow: `0 4px 6px -1px ${THEME_COLOR}33` }}
                >
                  {userInfo.nama?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate whitespace-nowrap">
                    {userInfo.nama || 'Member'}
                  </p>
                  <p className="text-xs text-white/60 truncate whitespace-nowrap">
                    {userInfo.kode || ''}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-red-300 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30 rounded-xl transition-all duration-200 overflow-hidden"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="whitespace-nowrap">Keluar</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'ml-0' : ''}`}>
        {/* Top Bar */}
        <div 
          className="h-[57px] shadow-sm border-b border-white/10 px-4 flex items-center"
          style={{ background: `linear-gradient(to right, ${SIDEBAR_BG_FROM}, ${SIDEBAR_BG_TO})` }}
        >
          {isMobile ? (
            /* Mobile Layout */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mr-2 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                {activeMenuItem && (
                  <div className="flex items-center flex-shrink-0 mr-2 text-white/60">
                    <activeMenuItem.icon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-semibold text-white truncate">
                    {activeMenuItem?.label || 'Dashboard'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-md"
                  style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})` }}
                >
                  {userInfo?.nama?.charAt(0).toUpperCase() || 'M'}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop Layout */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                {activeMenuItem && (
                  <div className="flex items-center mr-3 text-white/60">
                    <activeMenuItem.icon className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    {activeMenuItem?.label || 'Dashboard'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{userInfo?.nama || 'Member'}</p>
                  <p className="text-xs text-white/60">{userInfo?.email || ''}</p>
                </div>
                <div 
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md"
                  style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_DARK})`, boxShadow: `0 4px 6px -1px ${THEME_COLOR}33` }}
                >
                  {userInfo?.nama?.charAt(0).toUpperCase() || 'M'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default WebReportDashboard;
