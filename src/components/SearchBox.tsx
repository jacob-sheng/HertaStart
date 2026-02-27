import type {
  FocusEvent,
  KeyboardEvent} from 'react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronDownIcon,
  GlobeIcon,
  HistoryIcon,
  SearchIcon,
  TrashIcon,
} from './Icons';
import type { SearchEngine } from '../types';
import { fetchSuggestions } from '../utils/suggestions';
import { getSafeSvgDataUri } from '../utils/sanitizeSvg';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';

interface SearchBoxProps {
  engines: SearchEngine[];
  selectedEngineName: string;
  onSelectEngine: (name: string) => void;
  themeColor: string;
  opacity: number;
  onInteractionChange?: (isActive: boolean) => void;
  enableHistory: boolean;
  history: string[];
  onUpdateHistory: (history: string[]) => void;
}

const iconPalette = {
  google: 'bg-[#4285F4]/20 text-[#4285F4]',
  baidu: 'bg-[#2319DC]/20 text-[#4f46e5]',
  bing: 'bg-[#0085FF]/20 text-[#38bdf8]',
  duckduckgo: 'bg-[#DE5833]/20 text-[#fb923c]',
  bilibili: 'bg-[#00A1D6]/20 text-[#22d3ee]',
  globe: 'bg-white/10 text-white/70',
} as const;

const SearchEngineBadge = ({ engine }: { engine: SearchEngine }) => {
  const iconDataUri = getSafeSvgDataUri(engine.icon);
  if (iconDataUri) {
    return (
      <img
        src={iconDataUri}
        alt=""
        aria-hidden="true"
        className="w-5 h-5"
        loading="lazy"
      />
    );
  }

  const iconKey = engine.iconKey ?? 'globe';
  const fallbackText = engine.name.slice(0, 1).toUpperCase();

  if (iconKey === 'globe') {
    return (
      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 text-white/70">
        <GlobeIcon className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold tracking-wide ${iconPalette[iconKey]}`}
    >
      {fallbackText}
    </span>
  );
};

const SearchBox: React.FC<SearchBoxProps> = ({
  engines,
  selectedEngineName,
  onSelectEngine,
  themeColor,
  opacity,
  onInteractionChange,
  enableHistory,
  history,
  onUpdateHistory,
}) => {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const { showToast } = useToast();
  const { t } = useTranslation();

  const fallbackEngine = useMemo<SearchEngine>(
    () => ({
      name: 'Search',
      urlPattern: 'https://www.google.com/search?q=%s',
      iconKey: 'globe',
    }),
    []
  );

  const selectedEngine = useMemo(() => {
    return (
      engines.find((engine) => engine.name === selectedEngineName) ??
      engines[0] ??
      fallbackEngine
    );
  }, [engines, fallbackEngine, selectedEngineName]);

  const isActive = isFocused || query.length > 0 || isDropdownOpen;

  useEffect(() => {
    onInteractionChange?.(isActive);
  }, [isActive, onInteractionChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInButton = Boolean(
        dropdownRef.current && dropdownRef.current.contains(target)
      );
      const isClickInMenu = Boolean(menuRef.current && menuRef.current.contains(target));

      if (!isClickInButton && !isClickInMenu) {
        setIsDropdownOpen(false);
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowSuggestions(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const nextQuery = query.trim();
    const requestId = ++requestIdRef.current;

    const timer = setTimeout(() => {
      if (!nextQuery || !selectedEngine) {
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        return;
      }

      fetchSuggestions(selectedEngine.name, nextQuery).then((results) => {
        if (requestIdRef.current !== requestId) {
          return;
        }
        const nextSuggestions = results.slice(0, 8);
        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
        setSelectedIndex(-1);
        setAnimationKey((current) => current + 1);
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [query, selectedEngine]);

  const performSearch = useCallback(
    (text: string) => {
      const normalized = text.trim();
      if (!normalized || !selectedEngine) {
        return;
      }

      if (enableHistory) {
        const nextHistory = [normalized, ...history.filter((entry) => entry !== normalized)].slice(
          0,
          20
        );
        onUpdateHistory(nextHistory);
      }

      let url = selectedEngine.urlPattern;
      if (url.includes('%s')) {
        url = url.replace('%s', encodeURIComponent(normalized));
      } else {
        url = `${url}${encodeURIComponent(normalized)}`;
      }

      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          showToast(t.unsupportedProtocol, 'error');
          return;
        }
        window.location.href = parsed.toString();
      } catch (error) {
        console.error('Invalid search URL:', error);
        showToast(t.invalidSearchUrl, 'error');
      }
    },
    [enableHistory, history, onUpdateHistory, selectedEngine, showToast, t]
  );

  const handleSearch = useCallback(() => {
    performSearch(query);
  }, [performSearch, query]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      performSearch(suggestion);
      setShowSuggestions(false);
    },
    [performSearch]
  );

  const handleClearHistory = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onUpdateHistory([]);
      inputRef.current?.focus();
    },
    [onUpdateHistory]
  );

  const showHistoryDropdown = isFocused && !query && enableHistory && history.length > 0;
  const visibleItems = useMemo(() => {
    if (showSuggestions && suggestions.length > 0) {
      return suggestions;
    }
    if (showHistoryDropdown) {
      return history;
    }
    return [];
  }, [history, showHistoryDropdown, showSuggestions, suggestions]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (selectedIndex >= 0 && visibleItems[selectedIndex]) {
          handleSuggestionClick(visibleItems[selectedIndex]);
        } else {
          handleSearch();
        }
        (event.target as HTMLInputElement).blur();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => (current < visibleItems.length - 1 ? current + 1 : 0));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) => (current > -1 ? current - 1 : visibleItems.length - 1));
        return;
      }

      if (event.key === 'Escape') {
        setShowSuggestions(false);
        (event.target as HTMLInputElement).blur();
      }
    },
    [handleSearch, handleSuggestionClick, selectedIndex, visibleItems]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  const handleBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) {
      setQuery('');
    }
  }, []);

  const handleElementContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xl z-30 group"
      style={{ opacity }}
      onContextMenu={handleElementContextMenu}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)]"
        style={{
          backgroundColor: isActive ? themeColor : 'transparent',
          filter: isActive ? 'blur(45px)' : 'blur(0px)',
          opacity: isActive ? 0.35 : 0,
          transform: isActive ? 'scale(1.15)' : 'scale(0.8)',
          zIndex: 10,
        }}
      />

      <div
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ease-out"
        style={{
          boxShadow: isActive ? `0 0 25px 5px ${themeColor}60` : 'none',
          opacity: isActive ? 0.8 : 0,
          zIndex: 10,
        }}
      />

      <div
        className="
          relative flex items-center w-full px-2 py-1 rounded-full
          backdrop-blur-xl transition-all duration-500 ease-out
        "
        style={{
          backgroundColor: isActive ? 'rgba(10, 10, 10, 0.75)' : 'rgba(0, 0, 0, 0.25)',
          borderColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255, 255, 255, 0.1)',
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: isActive ? `inset 0 0 20px -5px ${themeColor}30` : 'none',
          zIndex: 50,
        }}
      >
        <div
          className="
            overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            flex items-center flex-shrink-0
          "
          style={{
            maxWidth: isActive ? '200px' : '0px',
            opacity: isActive ? 1 : 0,
          }}
        >
          <div className="relative pl-1 pr-2" ref={dropdownRef}>
            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsDropdownOpen((current) => !current)}
              onContextMenu={handleElementContextMenu}
              className={`
                flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full transition-all duration-300
                ${isDropdownOpen ? 'bg-white/10 shadow-inner' : 'hover:bg-white/10'}
              `}
              style={{ color: isDropdownOpen ? themeColor : 'rgba(255,255,255,0.8)' }}
            >
              <SearchEngineBadge engine={selectedEngine} />
              <span className="text-sm font-medium hidden sm:block tracking-wide whitespace-nowrap">
                {selectedEngine.name}
              </span>
              <ChevronDownIcon
                className={`w-3 h-3 opacity-60 transition-transform duration-300 flex-shrink-0 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-white/10 flex-shrink-0" />
        </div>

        {isDropdownOpen && (
          <div
            ref={menuRef}
            className="
              absolute top-full left-4 mt-3 w-48 p-1.5
              rounded-2xl bg-[#121212]/90 backdrop-blur-3xl
              border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]
              animate-in fade-in slide-in-from-top-2 duration-200
              z-[60]
            "
            onMouseDown={(event) => event.preventDefault()}
          >
            {engines.map((engine) => (
              <button
                key={engine.name}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelectEngine(engine.name);
                  setIsDropdownOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                onContextMenu={handleElementContextMenu}
                className={`
                  w-full px-3 py-2.5 text-left text-sm rounded-xl transition-all flex items-center justify-between group
                  ${
                    selectedEngineName === engine.name
                      ? 'bg-white/15 shadow-sm'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }
                `}
                style={{ color: selectedEngineName === engine.name ? themeColor : undefined }}
              >
                <div className="flex items-center gap-2">
                  <SearchEngineBadge engine={engine} />
                  <span className="font-medium tracking-wide">{engine.name}</span>
                </div>
                {selectedEngineName === engine.name && (
                  <div
                    className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    style={{
                      backgroundColor: themeColor,
                      boxShadow: `0 0 8px ${themeColor}`,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isActive ? `${t.searchOn} ${selectedEngine.name}...` : t.search}
          className={`
            flex-1 w-full min-w-0 bg-transparent border-none outline-none text-base placeholder-white/40 font-light px-4
            transition-all duration-500 ease-out
            ${isActive ? 'text-left' : 'text-center placeholder-white/70'}
          `}
          style={{ caretColor: themeColor }}
        />

        <div
          className="
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex items-center flex-shrink-0
          "
          style={{
            maxWidth: isActive ? '60px' : '0px',
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'translateX(0)' : 'translateX(10px)',
          }}
        >
          <button
            onClick={handleSearch}
            onContextMenu={handleElementContextMenu}
            className="p-2 mr-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <SearchIcon
              className="w-6 h-6 transition-colors duration-300"
              style={{ color: isActive ? themeColor : 'white' }}
            />
          </button>
        </div>
      </div>

      {((showSuggestions && suggestions.length > 0) || (showHistoryDropdown && history.length > 0)) && (
        <div
          key={animationKey}
          className="
            absolute top-full left-0 right-0 mt-2
            bg-black/20 backdrop-blur-2xl
            border border-white/10
            rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)]
            overflow-hidden z-40
            origin-top
          "
          style={{
            animation: 'dropdownSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <style>{`
            @keyframes dropdownSlideIn {
              from {
                opacity: 0;
                transform: translateY(-8px) scaleY(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scaleY(1);
              }
            }
            @keyframes itemFadeIn {
              from {
                opacity: 0;
                transform: translateX(-4px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>

          {showSuggestions && suggestions.length > 0 && (
            <div className="flex flex-col gap-0.5 p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${animationKey}-${suggestion}-${index}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onContextMenu={handleElementContextMenu}
                  className={`
                    group relative w-full px-3 py-1 rounded-md text-left flex items-center gap-3 transition-all duration-200 ease-out
                    ${
                      index === selectedIndex
                        ? 'bg-white/10 text-white shadow-sm translate-x-1'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }
                  `}
                  style={{
                    animation: `itemFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards ${
                      index * 0.03
                    }s`,
                    opacity: 0,
                  }}
                >
                  <SearchIcon
                    className="w-4 h-4 transition-all duration-300"
                    style={{
                      color: index === selectedIndex ? themeColor : 'currentColor',
                    }}
                  />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {!showSuggestions && showHistoryDropdown && (
            <div className="flex flex-col">
              <div className="px-4 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                {t.recentSearches}
              </div>
              <div className="flex flex-col gap-0.5 px-2">
                {history.map((item, index) => (
                  <button
                    key={`history-${item}-${index}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionClick(item)}
                    onContextMenu={handleElementContextMenu}
                    className={`
                      group relative w-full px-3 py-1.5 rounded-md text-left flex items-center gap-3 transition-all duration-200 ease-out
                      ${
                        index === selectedIndex
                          ? 'bg-white/10 text-white shadow-sm translate-x-1'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }
                    `}
                    style={{
                      animation: `itemFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards ${
                        index * 0.03
                      }s`,
                      opacity: 0,
                    }}
                  >
                    <HistoryIcon
                      className="w-4 h-4 transition-all duration-300"
                      style={{
                        color: index === selectedIndex ? themeColor : 'currentColor',
                        opacity: index === selectedIndex ? 1 : 0.6,
                      }}
                    />
                    <span className="truncate font-light">{item}</span>
                  </button>
                ))}
              </div>
              <div className="h-[1px] bg-white/5 my-2 mx-2" />
              <div className="px-2 pb-2">
                <button
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleClearHistory}
                  className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs text-white/30 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
                >
                  <TrashIcon className="w-3 h-3" />
                  <span>{t.clearHistory}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox;
