import React, { useState, useRef, useEffect } from 'react';
import { PresetWallpaper } from '../types';
import { PRESET_WALLPAPERS } from '../constants';

interface BackgroundSwitcherProps {
  currentWallpaper: PresetWallpaper | null;
  onSelect: (wallpaper: PresetWallpaper) => void;
  themeColor?: string;
}

export const BackgroundSwitcher: React.FC<BackgroundSwitcherProps> = ({
  currentWallpaper,
  onSelect,
  themeColor = '#3b82f6'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (wallpaper: PresetWallpaper) => {
    onSelect(wallpaper);
    setIsOpen(false);
  };

  return (
    <div className="relative z-20">
      {/* Background Switcher Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="group p-2 rounded-full bg-black/30 hover:bg-white/20 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg"
        aria-label="Switch Background"
        title="Switch Background"
      >
        <svg
          className="w-5 h-5 text-white/70 group-hover:text-white transition-all duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-14 left-0 w-48 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="max-h-96 overflow-y-auto">
            {PRESET_WALLPAPERS.map((wallpaper, index) => (
              <button
                key={`${wallpaper.name}-${index}`}
                onClick={() => handleSelect(wallpaper)}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3 border-b border-white/5 last:border-b-0 ${
                  currentWallpaper?.name === wallpaper.name && currentWallpaper?.url === wallpaper.url
                    ? 'bg-white/20'
                    : ''
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
                  <img
                    src={wallpaper.thumbnail || wallpaper.url}
                    alt={wallpaper.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Wallpaper Name */}
                <div className="flex-1 truncate">
                  <p className="text-white/90 text-sm font-medium truncate">
                    {wallpaper.name}
                  </p>
                  <p className="text-white/50 text-xs">
                    {wallpaper.type === 'video' ? '🎬 Video' : '🖼️ Image'}
                  </p>
                </div>
                {/* Selected Indicator */}
                {currentWallpaper?.name === wallpaper.name && currentWallpaper?.url === wallpaper.url && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: themeColor }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundSwitcher;
