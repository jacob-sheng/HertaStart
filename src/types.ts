export type SearchEngineIconKey =
  | 'google'
  | 'baidu'
  | 'bing'
  | 'duckduckgo'
  | 'bilibili'
  | 'globe';

export interface SearchEngine {
  name: string;
  urlPattern: string;
  icon?: string;
  iconKey?: SearchEngineIconKey;
}

export type BackgroundType = 'image' | 'video';
export type WallpaperFit = 'cover' | 'contain' | 'fill' | 'repeat' | 'center';
export type Language = 'en' | 'zh';
export type SettingsSection = 'general' | 'wallpaper' | 'search';

export interface PresetWallpaper {
  id?: string;
  name: string;
  type: BackgroundType;
  url: string;
  thumbnail?: string;
  isCustom?: boolean;
}

export interface UserSettings {
  use24HourFormat: boolean;
  showSeconds: boolean;
  backgroundBlur: number;
  searchEngines: SearchEngine[];
  selectedEngine: string;
  themeColor: string;
  searchOpacity: number;
  enableMaskBlur: boolean;
  maskOpacity: number;
  backgroundUrl: string;
  backgroundType: BackgroundType;
  wallpaperFit: WallpaperFit;
  customWallpapers: PresetWallpaper[];
  enableSearchHistory: boolean;
  searchHistory: string[];
  language: Language;
}

export type SettingsPatch =
  | Partial<UserSettings>
  | ((current: UserSettings) => Partial<UserSettings>);

export type UpdateSettings = (patch: SettingsPatch) => void;
