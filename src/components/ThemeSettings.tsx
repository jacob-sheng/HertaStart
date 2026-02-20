
import React from 'react';
import { CheckIcon } from './Icons';
import type { UserSettings, Language, UpdateSettings } from '../types';
import { THEMES } from '../constants';
import { useTranslation } from '../i18n';

interface ThemeSettingsProps {
  settings: UserSettings;
  onUpdateSettings: UpdateSettings;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ settings, onUpdateSettings }) => {
  const { t } = useTranslation();

  const toggleSeconds = () => {
    onUpdateSettings({ showSeconds: !settings.showSeconds });
  };

  const toggleMaskBlur = () => {
    onUpdateSettings({ enableMaskBlur: !settings.enableMaskBlur });
  };

  const toggle24Hour = () => {
    onUpdateSettings({ use24HourFormat: !settings.use24HourFormat });
  };

  const toggleSearchHistory = () => {
    onUpdateSettings({ enableSearchHistory: !settings.enableSearchHistory });
  };

  const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ backgroundBlur: Number(e.target.value) });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ searchOpacity: Number(e.target.value) });
  };

  const handleMaskOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ maskOpacity: Number(e.target.value) });
  };

  const handleThemeChange = (colorHex: string) => {
    onUpdateSettings({ themeColor: colorHex });
  };

  const handleLanguageChange = (lang: Language) => {
    onUpdateSettings({ language: lang });
  };

  return (
    <div className="space-y-5">
      {/* Language Selection */}
      <div className="space-y-4">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">{t.language}</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`
              flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${settings.language === 'en'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
            `}
          >
            {t.english}
          </button>
          <button
            onClick={() => handleLanguageChange('zh')}
            className={`
              flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
              ${settings.language === 'zh'
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
            `}
          >
            {t.chinese}
          </button>
        </div>
      </div>

      {/* Theme color */}
      <div className="space-y-4">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider block">{t.themeColor}</span>
        <div className="flex flex-wrap gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.hex}
              onClick={() => handleThemeChange(theme.hex)}
              className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                ${settings.themeColor === theme.hex ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-80 hover:opacity-100'}
              `}
              style={{ backgroundColor: theme.hex }}
              title={theme.name}
            >
              {settings.themeColor === theme.hex && (
                <CheckIcon className="w-4 h-4 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{t.showSeconds}</span>
          <button
            onClick={toggleSeconds}
            className="w-10 h-5 rounded-full transition-colors duration-300 relative bg-white/10"
            style={{ backgroundColor: settings.showSeconds ? settings.themeColor : undefined }}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-md ${settings.showSeconds ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{t.use24HourFormat}</span>
          <button
            onClick={toggle24Hour}
            className="w-10 h-5 rounded-full transition-colors duration-300 relative bg-white/10"
            style={{ backgroundColor: settings.use24HourFormat ? settings.themeColor : undefined }}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-md ${settings.use24HourFormat ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{t.maskBlurEffect}</span>
          <button
            onClick={toggleMaskBlur}
            className="w-10 h-5 rounded-full transition-colors duration-300 relative bg-white/10"
            style={{ backgroundColor: settings.enableMaskBlur ? settings.themeColor : undefined }}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-md ${settings.enableMaskBlur ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{t.searchHistory}</span>
          <button
            onClick={toggleSearchHistory}
            className="w-10 h-5 rounded-full transition-colors duration-300 relative bg-white/10"
            style={{ backgroundColor: settings.enableSearchHistory ? settings.themeColor : undefined }}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 shadow-md ${settings.enableSearchHistory ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Background blur slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-white/50 font-medium uppercase tracking-wider">
          <span>{t.backgroundBlur}</span>
          <span>{settings.backgroundBlur}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={settings.backgroundBlur}
          onChange={handleBlurChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
        />
      </div>

      {/* Search box opacity slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-white/50 font-medium uppercase tracking-wider">
          <span>{t.searchBoxOpacity}</span>
          <span>{Math.round(settings.searchOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={settings.searchOpacity}
          onChange={handleOpacityChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
        />
      </div>

      {/* Mask opacity slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-white/50 font-medium uppercase tracking-wider">
          <span>{t.maskOpacity}</span>
          <span>{Math.round(settings.maskOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.maskOpacity}
          onChange={handleMaskOpacityChange}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
        />
      </div>
    </div>
  );
};

export default ThemeSettings;
