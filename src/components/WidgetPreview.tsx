import React from 'react';
import { ContentSection } from '../types';
import IconRenderer from './IconRenderer';
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT_DARK,
  withOpacity,
} from '../utils/themeColors';

interface WidgetPreviewProps {
  widget: ContentSection;
  isSelected: boolean;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ widget, isSelected }) => {
  const renderTitleWidget = () => (
    <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-3 text-center">
      <div 
        className={`font-semibold text-gray-800 ${
          widget.title?.type === 'h1' ? 'text-xl' :
          widget.title?.type === 'h2' ? 'text-lg' :
          widget.title?.type === 'h3' ? 'text-base' :
          widget.title?.type === 'h4' ? 'text-sm' :
          widget.title?.type === 'h5' ? 'text-xs' : 'text-sm'
        }`}
        style={{ 
          textAlign: widget.title?.display as any || 'left',
          color: widget.title?.color || '#000000'
        }}
      >
                 {widget.title?.text || 'Teks Judul'}
      </div>
    </div>
  );

  const renderBannerSlider = () => {
    const banners = widget.banners || [];
    const displayBanners = banners.length > 0 ? banners : [];
    
    // Placeholder images for preview when no banners configured
    // Use theme colors for placeholder gradients
    const placeholderGradients = [
      `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`,
      `linear-gradient(to right, ${THEME_COLOR_DARK}, ${THEME_COLOR})`,
      `linear-gradient(to right, ${THEME_COLOR_LIGHT}, ${THEME_COLOR_LIGHT_DARK})`
    ];
    const thumbnailWidth = 80;
    const thumbnailHeight = 60;
    
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-3 overflow-hidden">
        <div className="text-xs font-medium text-gray-600 mb-2 flex items-center justify-between">
          <span>Banner Slider</span>
          <span className="text-gray-400">
            {widget.layoutVariant === 'monocle' ? 'Monocle' : 'Default'} • {banners.length} banner
          </span>
        </div>
        
        {/* Monocle-style preview - horizontal overflow hidden */}
        <div className="relative overflow-hidden rounded-lg">
          <div className="flex gap-2 items-center px-1">
            {displayBanners.length > 0 ? (
              displayBanners.map((banner, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 rounded-lg overflow-hidden shadow-sm"
                  style={{
                    width: `${thumbnailWidth}px`,
                    height: `${thumbnailHeight}px`,
                  }}
                >
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || `Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: placeholderGradients[index % 3] }}
                    >
                      <span className="text-white text-xs font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Show placeholder banners when none configured
              [0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="flex-shrink-0 rounded-lg overflow-hidden shadow-sm"
                  style={{
                    width: `${thumbnailWidth}px`,
                    height: `${thumbnailHeight}px`,
                  }}
                >
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: placeholderGradients[index] }}
                  >
                    <span className="text-white text-xs font-medium">{index + 1}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Fade edge on right for monocle overflow effect */}
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/90 to-transparent pointer-events-none" />
        </div>
        
        {/* Dots indicator */}
        <div className="flex justify-center gap-1 mt-2">
          {(displayBanners.length > 0 ? displayBanners : [0, 1, 2]).slice(0, 5).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i === 0 ? '' : 'bg-gray-300'}`}
              style={i === 0 ? { backgroundColor: THEME_COLOR } : undefined}
            />
          ))}
          {(displayBanners.length > 0 ? displayBanners.length : 3) > 5 && (
            <span className="text-xs text-gray-400">+{(displayBanners.length > 0 ? displayBanners.length : 3) - 5}</span>
          )}
        </div>
        
        {widget.autoSlide && (
          <div className="text-xs text-gray-400 text-center mt-1">
            Auto-slide: {widget.autoSlideInterval || 5}s
          </div>
        )}
      </div>
    );
  };

  const renderMenuGroup = () => {
    const frameStyle = widget.frame ? {
      width: `${widget.frame.width}px`,
      height: `${widget.frame.height}px`,
      borderRadius: `${widget.frame.borderRadius}px`,
      border: widget.frame.borderLine ? '1px solid #e5e7eb' : 'none',
      boxShadow: widget.frame.shadow ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
      padding: `${widget.frame.padding?.top || 0}px ${widget.frame.padding?.right || 0}px ${widget.frame.padding?.bottom || 0}px ${widget.frame.padding?.left || 0}px`,
    } : {};

    return (
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Grup Menu</div>
        <div className="grid grid-cols-4 gap-2">
          {widget.items?.slice(0, 16).map((item, index) => (
            <div key={index} className="text-center p-2 bg-gray-50 rounded">
              <div className="mb-1 flex justify-center">
                {widget.frame ? (
                  <div 
                    className="flex items-center justify-center bg-white"
                    style={frameStyle}
                  >
                    <IconRenderer iconUrl={item.iconUrl} size="sm" />
                  </div>
                ) : (
                  <IconRenderer iconUrl={item.iconUrl} size="sm" />
                )}
              </div>
              <div className="text-xs text-gray-700 truncate">{item.title}</div>
              {item.submenu && <div className="text-xs mt-1" style={{ color: THEME_COLOR }}>▶</div>}
            </div>
          ))}
          {(!widget.items || widget.items.length === 0) && (
            <div className="col-span-4 text-center text-gray-500 py-4">
              Tidak ada item menu
            </div>
          )}
        </div>
        {widget.items && widget.items.length > 16 && (
          <div className="text-xs text-gray-500 text-center py-2 mt-2 border-t">
            +{widget.items.length - 16} item lainnya
          </div>
        )}
        {widget.frame && (
          <div 
            className="text-xs text-center py-2 mt-2 border-t rounded"
            style={{ 
              color: THEME_COLOR,
              borderColor: withOpacity(THEME_COLOR, 0.3),
              backgroundColor: withOpacity(THEME_COLOR, 0.05)
            }}
          >
            🖼️ Frame: {widget.frame.width}×{widget.frame.height}px
          </div>
        )}
      </div>
    );
  };

  const renderHistoryWidget = () => {
    const count = widget.count || 3;
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Riwayat ({count} items)</div>
        <div className="space-y-2">
          {Array.from({ length: count }, (_, i) => i + 1).map((i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-600 flex-1">Transaksi #{i}</span>
              <span className="text-xs text-success-600">+$10</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCardsWidget = () => {
    const cards = widget.cards || [];
    const gridColumns = widget.gridColumns || 2;
    const spacing = widget.spacing || 12;
    
    // Helper to determine if color is light
    const isLightColor = (hexColor: string): boolean => {
      const hex = hexColor.replace('#', '');
      if (hex.length !== 6) return false;
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    };
    
    if (cards.length === 0) {
      return (
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-4">
          <div className="text-sm font-medium text-gray-800 mb-2">Widget Kartu</div>
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">🃏</div>
            <div className="text-xs">Belum ada kartu</div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-3">
        <div className="text-sm font-medium text-gray-800 mb-2">
          Widget Kartu ({cards.length} kartu, {gridColumns} kolom)
        </div>
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gap: `${Math.min(spacing, 8)}px`
          }}
        >
          {cards.slice(0, 4).map((card, index) => {
            const bgColor = card.backgroundColor || '#4A90D9';
            const textColor = isLightColor(bgColor) ? '#000000' : '#ffffff';
            const hasImage = card.imageUrl && card.imageUrl.length > 0;
            
            return (
              <div 
                key={card.id || index}
                className="relative overflow-hidden"
                style={{
                  backgroundColor: bgColor,
                  borderRadius: `${Math.min(card.borderRadius || 12, 12)}px`,
                  height: `${Math.min(card.height || 120, 80)}px`,
                  backgroundImage: hasImage ? `url(${card.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div 
                  className="absolute inset-0 flex flex-col justify-end p-2"
                  style={{
                    background: hasImage 
                      ? 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)' 
                      : undefined
                  }}
                >
                  {card.title && (
                    <div 
                      className="text-xs font-bold truncate"
                      style={{ color: hasImage ? '#ffffff' : textColor }}
                    >
                      {card.title}
                    </div>
                  )}
                  {card.subtitle && (
                    <div 
                      className="text-xs truncate opacity-80"
                      style={{ color: hasImage ? '#ffffff' : textColor }}
                    >
                      {card.subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {cards.length > 4 && (
          <div className="text-xs text-gray-500 text-center py-2 mt-2 border-t">
            +{cards.length - 4} kartu lainnya
          </div>
        )}
      </div>
    );
  };

  const renderBalanceCardWidget = () => {
    const backgroundType = widget.balance_card_background || 'none';
    const borderRadius = widget.borderRadius || 16;
    
    let backgroundStyle: React.CSSProperties = {};
    let textColor = '#374151'; // Default gray-700
    
    if (backgroundType === 'solid') {
      backgroundStyle = { backgroundColor: widget.balance_card_color || '#4A90D9' };
      textColor = '#ffffff';
    } else if (backgroundType === 'gradient') {
      const colors = widget.balance_card_gradient?.colors || ['#4A90D9', '#50C878'];
      backgroundStyle = {
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
      };
      textColor = '#ffffff';
    } else if (backgroundType === 'image') {
      backgroundStyle = {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${widget.balance_card_image || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
      textColor = '#ffffff';
    }
    
    return (
      <div 
        className="border border-gray-200 p-4"
        style={{ 
          borderRadius: `${borderRadius}px`,
          ...backgroundStyle
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs mb-1" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
            <div className="text-lg font-bold" style={{ color: textColor }}>Rp ****</div>
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${textColor}20` }}>
              <span style={{ color: textColor, fontSize: '12px' }}>👁</span>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${textColor}20` }}>
              <span style={{ color: textColor, fontSize: '12px' }}>+</span>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${textColor}20` }}>
              <span style={{ color: textColor, fontSize: '12px' }}>↔</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDefaultWidget = () => (
    <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl p-4">
      <div className="text-center">
        <div className="text-lg font-bold text-gray-800 mb-2">
          {widget.id}
        </div>
        <div className="text-sm text-gray-600">
          Jenis Widget: {widget.id}
        </div>
      </div>
    </div>
  );

  const getWidgetPreview = () => {
    switch (widget.id) {
      case 'title':
        return renderTitleWidget();
      case 'banner_slider':
        return renderBannerSlider();
      case 'history':
        return renderHistoryWidget();
      case 'cards':
        return renderCardsWidget();
      case 'balance_card':
        return renderBalanceCardWidget();
      default:
        if (widget.items) {
          return renderMenuGroup();
        }
        return renderDefaultWidget();
    }
  };

  return (
    <div 
      className={`${isSelected ? 'ring-2 ring-offset-2' : ''} transition-all duration-200`}
      style={isSelected ? { '--tw-ring-color': THEME_COLOR } as React.CSSProperties : undefined}
    >
      {getWidgetPreview()}
    </div>
  );
};

export default WidgetPreview;
