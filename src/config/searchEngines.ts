const BUILT_IN_SEARCH_ENGINES = [
  'Google',
  'Baidu',
  'Bing',
  'DuckDuckGo',
  'Bilibili',
] as const;

export type SearchEngineType = (typeof BUILT_IN_SEARCH_ENGINES)[number];
export type RequestMethod = 'jsonp' | 'fetch';

export interface SearchEngineConfig {
  name: SearchEngineType;
  method: RequestMethod;
  urlTemplate?: string;
  proxyPath?: string;
  parseResponse: (data: unknown) => string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object');
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const parseGoogleResponse = (data: unknown): string[] => {
  if (!Array.isArray(data) || !Array.isArray(data[1])) {
    return [];
  }
  return data[1]
    .map((item) => (Array.isArray(item) ? item[0] : item))
    .filter((item): item is string => typeof item === 'string');
};

const parseBaiduResponse = (data: unknown): string[] => {
  if (!isRecord(data)) {
    return [];
  }
  return toStringArray(data.s);
};

const parseBingResponse = (data: unknown): string[] => {
  if (!Array.isArray(data) || !Array.isArray(data[1])) {
    return [];
  }
  return data[1].filter((item): item is string => typeof item === 'string');
};

const parseDuckduckgoResponse = (data: unknown): string[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => (isRecord(item) ? item.phrase : undefined))
    .filter((item): item is string => typeof item === 'string');
};

const parseBilibiliResponse = (data: unknown): string[] => {
  if (!isRecord(data) || data.code !== 0) {
    return [];
  }

  const result = data.result;
  if (!isRecord(result) || !Array.isArray(result.tag)) {
    return [];
  }

  return result.tag
    .map((item) => (isRecord(item) ? item.value : undefined))
    .filter((item): item is string => typeof item === 'string');
};

export const searchEngineConfigs: Record<SearchEngineType, SearchEngineConfig> = {
  Google: {
    name: 'Google',
    method: 'jsonp',
    urlTemplate:
      'https://suggestqueries.google.com/complete/search?client=youtube&q={query}&jsonp={callback}',
    parseResponse: parseGoogleResponse,
  },
  Baidu: {
    name: 'Baidu',
    method: 'jsonp',
    urlTemplate:
      'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd={query}&cb={callback}',
    parseResponse: parseBaiduResponse,
  },
  Bing: {
    name: 'Bing',
    method: 'jsonp',
    urlTemplate:
      'https://api.bing.com/osjson.aspx?query={query}&JsonType=callback&JsonCallback={callback}',
    parseResponse: parseBingResponse,
  },
  DuckDuckGo: {
    name: 'DuckDuckGo',
    method: 'jsonp',
    urlTemplate: 'https://duckduckgo.com/ac/?q={query}&callback={callback}&type=list',
    parseResponse: parseDuckduckgoResponse,
  },
  Bilibili: {
    name: 'Bilibili',
    method: 'fetch',
    proxyPath: '/api/bilibili',
    parseResponse: parseBilibiliResponse,
  },
};

export const isBuiltInSearchEngine = (engine: string): engine is SearchEngineType => {
  return (BUILT_IN_SEARCH_ENGINES as readonly string[]).includes(engine);
};

export const getSearchEngineConfig = (
  engine: string
): SearchEngineConfig | undefined => {
  if (!isBuiltInSearchEngine(engine)) {
    return undefined;
  }
  return searchEngineConfigs[engine];
};

export const buildJsonpUrl = (
  config: SearchEngineConfig,
  query: string,
  callbackName: string
): string => {
  if (!config.urlTemplate) {
    throw new Error(`Engine ${config.name} does not define urlTemplate`);
  }
  return config.urlTemplate
    .replace('{query}', encodeURIComponent(query))
    .replace('{callback}', callbackName);
};

export const buildFetchUrl = (config: SearchEngineConfig, query: string): string => {
  if (!config.proxyPath) {
    throw new Error(`Engine ${config.name} does not define proxyPath`);
  }
  return `${config.proxyPath}?term=${encodeURIComponent(query)}`;
};
