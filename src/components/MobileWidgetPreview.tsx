import React from "react";
import { ContentSection } from "../types";
import IconRenderer from "./IconRenderer";
import {
  THEME_COLOR,
  THEME_COLOR_LIGHT,
  withOpacity,
} from "../utils/themeColors";

interface MobileWidgetPreviewProps {
  widget: ContentSection;
}

const MobileWidgetPreview: React.FC<MobileWidgetPreviewProps> = ({ widget }) => {
  // Title widget - just the text
  const renderTitle = () => {
    const align = widget.title?.display || "left";
    const textSize = 
      widget.title?.type === "h1" ? "text-lg font-bold" :
      widget.title?.type === "h2" ? "text-base font-bold" :
      widget.title?.type === "h3" ? "text-base font-semibold" :
      "text-sm font-medium";
    
    return (
      <div 
        className={`px-4 py-2.5 ${textSize}`}
        style={{ 
          textAlign: align as any,
          color: widget.title?.color || "#1f2937"
        }}
      >
        {widget.title?.text || "Title"}
      </div>
    );
  };

  // Banner slider - actual banners
  const renderBannerSlider = () => {
    const banners = widget.banners || [];
    const height = Math.min(widget.height || 120, 100);
    const isMonocle = widget.layoutVariant === "monocle";
    
    if (banners.length === 0) {
      return (
        <div className="px-4">
          <div 
            className="rounded-2xl flex items-center justify-center"
            style={{ 
              height: `${height}px`,
              background: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})`
            }}
          >
            <span className="text-white text-sm opacity-70">No banners</span>
          </div>
        </div>
      );
    }

    if (isMonocle) {
      return (
        <div className="relative overflow-hidden">
          <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide">
            {banners.map((banner, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-2xl overflow-hidden"
                style={{ 
                  width: "85%",
                  height: `${height}px`
                }}
              >
                {banner.imageUrl ? (
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title || ""} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})` }}
                  >
                    <span className="text-white text-sm">{i + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default: show first banner
    const banner = banners[0];
    return (
      <div className="px-4">
        <div 
          className="rounded-2xl overflow-hidden"
          style={{ height: `${height}px` }}
        >
          {banner.imageUrl ? (
            <img 
              src={banner.imageUrl} 
              alt={banner.title || ""} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(to right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})` }}
            >
              <span className="text-white text-sm">Banner</span>
            </div>
          )}
        </div>
        {banners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2.5">
            {banners.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === 0 ? "" : "bg-gray-300"}`}
                style={i === 0 ? { backgroundColor: THEME_COLOR } : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Menu group - grid of icons
  const renderMenuGroup = () => {
    const items = widget.items || [];
    if (items.length === 0) return null;

    const frame = widget.frame;
    const frameWidth = frame?.width || 40;
    const frameHeight = frame?.height || 40;
    const frameBorderRadius = frame?.borderRadius || 14;
    const frameBorderLine = frame?.borderLine !== false;
    const frameShadow = frame?.shadow !== false;

    return (
      <div className="px-4">
        <div className="grid grid-cols-4 gap-4">
          {items.slice(0, 8).map((item, i) => (
            <div key={i} className="text-center">
              {frame ? (
                // With frame - each icon has its own frame
                <div 
                  className="mx-auto mb-1.5 flex items-center justify-center bg-white"
                  style={{
                    width: `${Math.min(frameWidth, 44)}px`,
                    height: `${Math.min(frameHeight, 44)}px`,
                    borderRadius: `${Math.min(frameBorderRadius, 14)}px`,
                    border: frameBorderLine ? "1px solid rgba(0,0,0,0.08)" : undefined,
                    boxShadow: frameShadow ? "0 1px 3px rgba(0,0,0,0.08)" : undefined,
                  }}
                >
                  <IconRenderer iconUrl={item.iconUrl} size="md" />
                </div>
              ) : (
                // Without frame - just the icon
                <div className="w-10 h-10 mx-auto mb-1.5">
                  <IconRenderer iconUrl={item.iconUrl} size="md" />
                </div>
              )}
              <span className="text-[11px] text-gray-700 leading-tight line-clamp-2">{item.title}</span>
            </div>
          ))}
        </div>
        {items.length > 8 && (
          <div className="text-center mt-2.5">
            <span className="text-[11px] text-gray-400">+{items.length - 8} more</span>
          </div>
        )}
      </div>
    );
  };

  // History widget
  const renderHistory = () => {
    const count = Math.min(widget.count || 3, 3);
    return (
      <div className="px-4 space-y-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: withOpacity(THEME_COLOR, 0.15) }}>
              <span className="text-sm" style={{ color: THEME_COLOR }}>📱</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">Transaction #{i + 1}</div>
              <div className="text-[11px] text-gray-500">Today, 10:00</div>
            </div>
            <span className="text-xs font-medium text-green-600">+Rp 10.000</span>
          </div>
        ))}
      </div>
    );
  };

  // Cards widget
  const renderCards = () => {
    const cards = widget.cards || [];
    const gridColumns = widget.gridColumns || 2;
    
    if (cards.length === 0) {
      return (
        <div className="px-4">
          <div 
            className="rounded-2xl p-4 h-20 flex items-end"
            style={{ background: `linear-gradient(to bottom right, ${THEME_COLOR}, ${THEME_COLOR_LIGHT})` }}
          >
            <span className="text-white text-sm font-medium">Card</span>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4">
        <div 
          className="grid gap-2.5"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
        >
          {cards.slice(0, 4).map((card, i) => {
            const bgColor = card.backgroundColor || "#3b82f6";
            const hasImage = card.imageUrl && card.imageUrl.length > 0;
            const height = Math.min(card.height || 100, 80);
            
            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden relative"
                style={{
                  backgroundColor: bgColor,
                  height: `${height}px`,
                  backgroundImage: hasImage ? `url(${card.imageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div 
                  className="absolute inset-0 flex flex-col justify-end p-2.5"
                  style={{
                    background: hasImage ? "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" : undefined
                  }}
                >
                  {card.title && (
                    <div className="text-xs font-bold text-white truncate">{card.title}</div>
                  )}
                  {card.subtitle && (
                    <div className="text-[10px] text-white/80 truncate">{card.subtitle}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Balance card widget with all variants
  const renderBalanceCard = () => {
    const bgType = widget.balance_card_background || "none";
    const variant = widget.balance_card_variant || 1;
    let bgStyle: React.CSSProperties = { backgroundColor: "#f3f4f6" };
    let textColor = "#374151";

    if (bgType === "solid") {
      bgStyle = { backgroundColor: widget.balance_card_color || "#3b82f6" };
      textColor = "#ffffff";
    } else if (bgType === "gradient") {
      const colors = widget.balance_card_gradient?.colors || ["#3b82f6", "#8b5cf6"];
      bgStyle = { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` };
      textColor = "#ffffff";
    } else if (bgType === "image" && widget.balance_card_image) {
      bgStyle = {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${widget.balance_card_image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
      textColor = "#ffffff";
    }

    const borderRadius = widget.borderRadius || 18;
    const actionBtnStyle = { backgroundColor: `${textColor}20`, color: textColor };

    // Points badge component
    const PointsBadge = ({ small = false }: { small?: boolean }) => (
      <span 
        className={`inline-flex items-center text-white ${small ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'} rounded-full gap-0.5`}
        style={{ backgroundColor: THEME_COLOR }}
      >
        <span className="text-yellow-300">★</span> ****
      </span>
    );

    // Action buttons component
    const ActionButtons = ({ size = "normal" }: { size?: "small" | "normal" }) => {
      const btnSize = size === "small" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
      return (
        <div className="flex gap-1.5">
          <div className={`${btnSize} rounded-full flex items-center justify-center`} style={actionBtnStyle}>👁</div>
          <div className={`${btnSize} rounded-full flex items-center justify-center`} style={actionBtnStyle}>+</div>
          <div className={`${btnSize} rounded-full flex items-center justify-center`} style={actionBtnStyle}>↔</div>
        </div>
      );
    };

    const renderVariant = () => {
      switch (variant) {
        case 2: // Vertical centered
          return (
            <div className="text-center">
              <div className="text-[11px] mb-1" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
              <div className="text-lg font-bold mb-2" style={{ color: textColor }}>Rp ****</div>
              <div className="flex justify-center items-center gap-4">
                <PointsBadge />
                <ActionButtons size="small" />
              </div>
            </div>
          );

        case 3: // Compact horizontal
          return (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <div>
                    <div className="text-[10px]" style={{ color: textColor, opacity: 0.8 }}>Saldo</div>
                    <div className="text-sm font-bold" style={{ color: textColor }}>Rp ****</div>
                  </div>
                  <PointsBadge small />
                </div>
              </div>
              <ActionButtons size="small" />
            </div>
          );

        case 4: // Split card
          return (
            <div className="flex gap-2.5">
              <div 
                className="flex-1 p-2.5 rounded-lg"
                style={{ backgroundColor: `${textColor}15` }}
              >
                <div className="text-[10px]" style={{ color: textColor, opacity: 0.8 }}>Saldo</div>
                <div className="text-base font-bold" style={{ color: textColor }}>Rp ****</div>
              </div>
              <div 
                className="p-2.5 rounded-lg flex flex-col items-center gap-1.5"
                style={{ backgroundColor: `${textColor}15` }}
              >
                <PointsBadge small />
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={actionBtnStyle}>👁</div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={actionBtnStyle}>+</div>
                </div>
              </div>
            </div>
          );

        case 5: // Minimalist floating
          return (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px]" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
                <div className="text-base font-bold mb-1" style={{ color: textColor }}>Rp ****</div>
                <PointsBadge small />
              </div>
              <div className="flex gap-1.5">
                {['👁', '+', '↔'].map((icon, i) => (
                  <div 
                    key={i}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${textColor}30`, color: textColor }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>
          );

        case 6: // Bottom action bar
          return (
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <div>
                  <div className="text-[11px]" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
                  <div className="text-base font-bold" style={{ color: textColor }}>Rp ****</div>
                </div>
                <PointsBadge />
              </div>
              <div 
                className="flex justify-around pt-2.5 border-t"
                style={{ borderColor: `${textColor}30` }}
              >
                {[
                  { icon: '👁', label: 'Lihat' },
                  { icon: '+', label: 'Top Up' },
                  { icon: '↔', label: 'Transfer' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: textColor }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );

        case 7: // Modern with action row
          return (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-[11px]" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
                  <div className="text-base font-bold" style={{ color: textColor }}>Rp ****</div>
                </div>
                <PointsBadge />
              </div>
              <div className="flex gap-1.5">
                {['👁', '+', '↔'].map((icon, i) => (
                  <div 
                    key={i}
                    className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${textColor}20`, color: textColor }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>
          );

        case 8: // Full width with buttons
          return (
            <div>
              <div className="flex justify-between items-start mb-1.5">
                <div className="text-[11px]" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
                <div className="text-xs" style={{ color: textColor }}>👁</div>
              </div>
              <div className="text-lg font-bold mb-1" style={{ color: textColor }}>Rp ****</div>
              <PointsBadge small />
              <div className="flex gap-2.5 mt-4">
                <button 
                  className="flex-1 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"
                  style={{ backgroundColor: `${textColor}25`, color: textColor }}
                >
                  + Deposit
                </button>
                <button 
                  className="flex-1 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"
                  style={{ backgroundColor: `${textColor}25`, color: textColor }}
                >
                  ↔ Transfer
                </button>
              </div>
            </div>
          );

        default: // Variant 1: Original horizontal
          return (
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[11px]" style={{ color: textColor, opacity: 0.8 }}>Saldo Tersedia</div>
                <div className="text-base font-bold mb-1" style={{ color: textColor }}>Rp ****</div>
                <PointsBadge small />
              </div>
              <ActionButtons />
            </div>
          );
      }
    };

    return (
      <div className="px-4">
        <div 
          className="p-4"
          style={{ ...bgStyle, borderRadius: `${borderRadius}px` }}
        >
          {renderVariant()}
        </div>
      </div>
    );
  };

  // Render based on widget type
  switch (widget.id) {
    case "title":
      return renderTitle();
    case "banner_slider":
      return renderBannerSlider();
    case "history":
      return renderHistory();
    case "cards":
      return renderCards();
    case "balance_card":
      return renderBalanceCard();
    default:
      if (widget.items) {
        return renderMenuGroup();
      }
      // Unknown widget - minimal display
      return (
        <div className="px-4">
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <span className="text-xs text-gray-500">{widget.id}</span>
          </div>
        </div>
      );
  }
};

export default MobileWidgetPreview;
