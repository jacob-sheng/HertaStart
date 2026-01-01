
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Clock from './components/Clock';
import SearchBox from './components/SearchBox';
import SettingsModal from './components/SettingsModal';
import SettingsMenu from './components/SettingsMenu';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalContextMenu from './components/GlobalContextMenu';
import BackgroundSwitcher from './components/BackgroundSwitcher';
import { SettingsIcon } from './components/Icons';
import { UserSettings, WallpaperFit, SettingsSection } from './types';
import { PRESET_WALLPAPERS, SEARCH_ENGINES, THEMES } from './constants';
import { loadSettings, saveSettings } from './utils/storage';
import { I18nProvider } from './i18n';

// Default settings - moved outside component to avoid recreation on each render
const DEFAULT_SETTINGS: UserSettings = {
  use24HourFormat: true,
  showSeconds: true,
  backgroundBlur: 8,
  searchEngines: [...SEARCH_ENGINES],
  selectedEngine: SEARCH_ENGINES[0].name,
  themeColor: THEMES[0].hex,
  searchOpacity: 0.8,
  enableMaskBlur: false,
  maskOpacity: 0.2,
  backgroundUrl: PRESET_WALLPAPERS[0].url,
  backgroundType: PRESET_WALLPAPERS[0].type,
  wallpaperFit: 'cover',
  customWallpapers: [],
  enableSearchHistory: true,
  searchHistory: [],
  language: 'en'
};

type ViewMode = 'search' | 'dashboard';

// Mobile wallpaper URL
const MOBILE_WALLPAPER = 'https://i.postimg.cc/1z8DSYSY/IMG-20251114-201.jpg';

// Check if device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const App: React.FC = () => {
  // State for settings visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('general');

  // State for view mode (Search Panel vs Dashboard Panel)
  const [viewMode, setViewMode] = useState<ViewMode>('search');

  // State for wallpaper loaded (prevent flash)
  const [bgLoaded, setBgLoaded] = useState(false);

  // State for search box interaction (controls background blur)
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Application Settings - loaded from Local Storage
  const [settings, setSettings] = useState<UserSettings>(() => {
    const loadedSettings = loadSettings(DEFAULT_SETTINGS);
    // Apply mobile wallpaper if on mobile device
    if (isMobileDevice()) {
      loadedSettings.backgroundUrl = MOBILE_WALLPAPER;
      loadedSettings.backgroundType = 'image';
    }
    return loadedSettings;
  });

  // Flag to track if this is the initial mount
  const isInitialMount = useRef(true);

  // Track previous background URL for fade animation
  const prevBgUrlRef = useRef(settings.backgroundUrl);

  // Save settings to Local Storage (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveSettings(settings);
  }, [settings]);

  // Preload background when URL changes
  useEffect(() => {
    // Trigger fade out when background URL changes
    if (prevBgUrlRef.current !== settings.backgroundUrl) {
      setBgLoaded(false);
      prevBgUrlRef.current = settings.backgroundUrl;
    }

    let isMounted = true;

    if (settings.backgroundType === 'image') {
      const img = new Image();
      img.src = settings.backgroundUrl;
      img.onload = () => {
        if (isMounted) {
          // Small delay to ensure smooth fade transition
          setTimeout(() => {
            if (isMounted) {
              setBgLoaded(true);
            }
          }, 50);
        }
      };
      // Handle error case to avoid stuck loading state
      img.onerror = () => {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setBgLoaded(true);
            }
          }, 50);
        }
      };

      // Cleanup function
      return () => {
        isMounted = false;
        // Clean up Image object event handlers
        img.onload = null;
        img.onerror = null;
        // Cancel image loading
        img.src = '';
      };
    } else {
      // For video, we can consider it "loaded" once it starts playing or immediately
      // depending on desired UX. Here we'll set it true immediately to show the video element
      // which handles its own buffering.
      setTimeout(() => {
        if (isMounted) {
          setBgLoaded(true);
        }
      }, 50);
    }
  }, [settings.backgroundUrl, settings.backgroundType]);

  const handleSelectEngine = (name: string) => {
    setSettings(prev => ({ ...prev, selectedEngine: name }));
  };

  const handleUpdateHistory = (newHistory: string[]) => {
    setSettings(prev => ({ ...prev, searchHistory: newHistory }));
  };

  const handleSelectWallpaper = (wallpaper: any) => {
    setSettings(prev => ({
      ...prev,
      backgroundUrl: wallpaper.url,
      backgroundType: wallpaper.type,
    }));
  };

  const getCurrentWallpaper = () => {
    return PRESET_WALLPAPERS.find(
      wp => wp.url === settings.backgroundUrl && wp.type === settings.backgroundType
    );
  };

  const getBackgroundStyle = (fit: WallpaperFit): React.CSSProperties => {
    const baseStyle = { backgroundImage: `url(${settings.backgroundUrl})` };
    switch (fit) {
      case 'contain':
        return { ...baseStyle, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'fill':
        return { ...baseStyle, backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'repeat':
        return { ...baseStyle, backgroundSize: 'auto', backgroundPosition: 'top left', backgroundRepeat: 'repeat' };
      case 'center':
        return { ...baseStyle, backgroundSize: 'auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      case 'cover':
      default:
        return { ...baseStyle, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
    }
  };

  const getVideoClass = (fit: WallpaperFit) => {
    switch (fit) {
      case 'contain': return 'object-contain';
      case 'fill': return 'object-fill';
      case 'center': return 'object-none';
      case 'repeat': return 'object-cover'; // Video tile not supported natively in same way, fallback to cover
      case 'cover':
      default: return 'object-cover';
    }
  };

  // Handle right-click on the background to switch to Dashboard
  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    // If settings modal is open, let standard behavior apply (or it's covered by modal backdrop)
    if (isSettingsOpen) return;

    // We only want to capture clicks on the "background" or general containers.
    // Specific interactive elements (like SearchBox) should stop propagation.
    e.preventDefault();
    if (viewMode === 'search') {
      setViewMode('dashboard');
    }
  };

  // Handle left-click on the dashboard to return to Search
  const handleDashboardClick = (e: React.MouseEvent) => {
    if (viewMode === 'dashboard' && !isSettingsOpen) {
      setViewMode('search');
    }
  };

  const handleLanguageChange = (lang: 'en' | 'zh') => {
    setSettings(prev => ({ ...prev, language: lang }));
  };

  const handleSettingsMenuSelect = (section: SettingsSection) => {
    setActiveSettingsSection(section);
    setIsSettingsMenuOpen(false);
    setIsSettingsOpen(true);
  };

  return (
    <ErrorBoundary>
      <I18nProvider language={settings.language} onLanguageChange={handleLanguageChange}>
        <div
          className="relative w-screen h-screen overflow-hidden bg-black text-white"
          onContextMenu={handleBackgroundContextMenu}
          onClick={handleDashboardClick}
        >
          {/* Context Menu Global Listener */}
          <GlobalContextMenu />

          {/* Background Layer */}
          <div
            className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ease-in-out ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              filter: `blur(${isSearchActive ? settings.backgroundBlur : 0}px)`,
              transform: isSearchActive ? 'scale(1.05)' : 'scale(1)',
              transitionProperty: 'filter, transform, opacity',
              transitionDuration: '700ms, 700ms, 1000ms',
              transitionTimingFunction: 'cubic-bezier(0.25,0.4,0.25,1)',
            }}
          >
            {settings.backgroundType === 'video' ? (
              <video
                key={settings.backgroundUrl}
                className={`absolute inset-0 w-full h-full ${getVideoClass(settings.wallpaperFit)}`}
                src={settings.backgroundUrl}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full"
                style={getBackgroundStyle(settings.wallpaperFit)}
              />
            )}
          </div>

          {/* Overlay to ensure text readability */}
          <div
            className={`
            absolute inset-0 transition-opacity duration-500
            ${settings.enableMaskBlur ? 'backdrop-blur-sm' : ''}
          `}
            style={{
              backgroundColor: `rgba(0, 0, 0, ${settings.maskOpacity})`
            }}
          />

          {/* 
          Main Content Area (Search View) 
          Pointer events are disabled when not visible to prevent interaction with hidden elements
        */}
          <div
            className={`
            absolute inset-0 z-10 flex flex-col items-center pt-[18vh] w-full px-4 space-y-8
            transition-all duration-500 ease-in-out
            ${viewMode === 'search' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          `}
          >
            {/* Clock Component */}
            <ErrorBoundary>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                <Clock
                  showSeconds={settings.showSeconds}
                  use24HourFormat={settings.use24HourFormat}
                />
              </div>
            </ErrorBoundary>

            {/* Search Input Component */}
            <ErrorBoundary>
              <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <SearchBox
                  engines={settings.searchEngines}
                  selectedEngineName={settings.selectedEngine}
                  onSelectEngine={handleSelectEngine}
                  themeColor={settings.themeColor}
                  opacity={settings.searchOpacity}
                  onInteractionChange={setIsSearchActive}
                  enableHistory={settings.enableSearchHistory}
                  history={settings.searchHistory}
                  onUpdateHistory={handleUpdateHistory}
                />
              </div>
            </ErrorBoundary>

            {/* Background Switcher Button - Bottom Left */}
            <div className="absolute bottom-6 left-6 animate-in fade-in slide-in-from-left-4 duration-1000 delay-500">
              <BackgroundSwitcher
                currentWallpaper={getCurrentWallpaper() || null}
                onSelect={handleSelectWallpaper}
                themeColor={settings.themeColor}
              />
            </div>
          </div>

          {/* 
          Dashboard Panel (Under Development) 
          Visible only in dashboard mode
        */}
          <div
            className={`
            absolute inset-0 z-10 flex flex-col items-center justify-center
            transition-all duration-500 ease-in-out
            ${viewMode === 'dashboard' ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}
          `}
          >
            <div className="relative group cursor-default">
              <h1 className="text-4xl md:text-5xl font-extralight tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors duration-500 select-none">
                DASHBOARD
              </h1>
              <div className="absolute -bottom-4 left-0 w-full flex justify-center">
                <span className="text-xs font-mono text-white/20 tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded">
                  Under Construction
                </span>
              </div>
            </div>

            {/* Top Right Settings Button - Only visible in Dashboard */}
            <div className="absolute top-6 right-6 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent clicking dashboard background
                  setIsSettingsMenuOpen(!isSettingsMenuOpen);
                }}
                className={`group p-2 rounded-full bg-black/30 hover:bg-white/20 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg ${isSettingsMenuOpen ? 'bg-white/20 border-white/30' : ''}`}
                aria-label="Settings"
              >
                <SettingsIcon className={`w-5 h-5 text-white/70 group-hover:text-white transition-all duration-500 ${isSettingsMenuOpen ? 'rotate-90 text-white' : ''}`} />
              </button>

              <SettingsMenu
                isOpen={isSettingsMenuOpen}
                onClose={() => setIsSettingsMenuOpen(false)}
                onSelectSection={handleSettingsMenuSelect}
              />
            </div>
          </div>

          {/* Settings Modal */}
          <ErrorBoundary>
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              settings={settings}
              onUpdateSettings={setSettings}
              section={activeSettingsSection}
            />
          </ErrorBoundary>
        </div>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;
