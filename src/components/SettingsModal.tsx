import React from 'react';
import { XIcon } from './Icons';
import { UserSettings, SettingsSection } from '../types';
import ThemeSettings from './ThemeSettings';
import WallpaperManager from './WallpaperManager';
import SearchEngineManager from './SearchEngineManager';
import { useTranslation } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  section: SettingsSection;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, section }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Handler to block right-click context menu within the settings modal
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getTitle = () => {
    switch (section) {
      case 'general':
        return t.appearance;
      case 'wallpaper':
        return t.wallpaperSettings;
      case 'search':
        return t.searchEngines;
      default:
        return t.settings;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onContextMenu={handleContextMenu}
    >
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="
        relative w-full max-w-md rounded-2xl
        bg-[#1a1a1a]/90 backdrop-blur-xl
        border border-white/10
        shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        text-white animate-in fade-in zoom-in-95 duration-200
        max-h-[85vh] flex flex-col overflow-hidden
      ">
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 z-10">
          <h2 className="text-lg font-medium tracking-wide text-white/90">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          <div className="space-y-8">
            {section === 'general' && (
              <ThemeSettings settings={settings} onUpdateSettings={onUpdateSettings} />
            )}

            {section === 'wallpaper' && (
              <WallpaperManager settings={settings} onUpdateSettings={onUpdateSettings} />
            )}

            {section === 'search' && (
              <SearchEngineManager settings={settings} onUpdateSettings={onUpdateSettings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
