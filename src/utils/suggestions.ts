import type {
  SearchEngineConfig} from '@/config/searchEngines';
import {
  buildFetchUrl,
  buildJsonpUrl,
  getSearchEngineConfig
} from '@/config/searchEngines';

declare global {
  interface Window {
    __AEROSTART_JSONP__?: Record<string, (data: unknown) => void>;
  }
}

let callbackCount = 0;
const REQUEST_TIMEOUT_MS = 3000;

const withTimeout = async <T>(
  promise: Promise<T>,
  timeout = REQUEST_TIMEOUT_MS
): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Suggestions request timed out')), timeout)
    ),
  ]);
};

const fetchWithProxy = async (
  config: SearchEngineConfig,
  query: string
): Promise<string[]> => {
  const response = await withTimeout(fetch(buildFetchUrl(config, query)));
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as unknown;
  return config.parseResponse(data);
};

const fetchWithJsonp = async (
  config: SearchEngineConfig,
  query: string
): Promise<string[]> => {
  return await new Promise<string[]>((resolve) => {
    const callbackRegistry = window as unknown as Record<
      string,
      ((data: unknown) => void) | undefined
    >;
    const callbackName = `jsonp_cb_${Date.now()}_${callbackCount++}`;
    const script = document.createElement('script');
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve([]);
    }, REQUEST_TIMEOUT_MS);

    const cleanup = () => {
      const jsonpCallbacks = window.__AEROSTART_JSONP__;
      if (jsonpCallbacks && jsonpCallbacks[callbackName]) {
        delete jsonpCallbacks[callbackName];
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      window.clearTimeout(timeoutId);
    };

    window.__AEROSTART_JSONP__ = window.__AEROSTART_JSONP__ ?? {};
    window.__AEROSTART_JSONP__[callbackName] = (data: unknown) => {
      cleanup();
      resolve(config.parseResponse(data));
    };

    callbackRegistry[callbackName] = (data: unknown) => {
      const callbacks = window.__AEROSTART_JSONP__;
      if (callbacks && callbacks[callbackName]) {
        callbacks[callbackName](data);
      }
      delete callbackRegistry[callbackName];
    };

    script.src = buildJsonpUrl(config, query, callbackName);
    script.onerror = () => {
      cleanup();
      resolve([]);
    };
    document.body.appendChild(script);
  });
};

export const fetchSuggestions = async (
  engine: string,
  query: string
): Promise<string[]> => {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const config = getSearchEngineConfig(engine);
  if (!config) {
    return [];
  }

  try {
    if (config.method === 'fetch') {
      return await fetchWithProxy(config, normalized);
    }
    return await fetchWithJsonp(config, normalized);
  } catch {
    return [];
  }
};
