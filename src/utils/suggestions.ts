import {
  getSearchEngineConfig,
  buildJsonpUrl,
  type SearchEngineType
} from '@/config/searchEngines';

let callbackCount = 0;

/**
 * Fetch search suggestions (supports hybrid JSONP and Fetch mode)
 */
export const fetchSuggestions = (engine: string, query: string): Promise<string[]> => {
  return new Promise((resolve) => {
    if (!query || !query.trim()) {
      resolve([]);
      return;
    }

    const config = getSearchEngineConfig(engine as SearchEngineType);
    if (!config) {
      resolve([]);
      return;
    }

    // Bilibili uses fetch (via Vite proxy in dev, Vercel Function in production)
    if (engine === 'Bilibili') {
      const url = `/api/bilibili?term=${encodeURIComponent(query)}`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          try {
            const suggestions = config.parseResponse(data);
            resolve(suggestions);
          } catch (e) {
            resolve([]);
          }
        })
        .catch(() => {
          resolve([]);
        });
      return;
    }

    // Other engines use JSONP
    const callbackName = `jsonp_cb_${Date.now()}_${callbackCount++}`;
    const script = document.createElement('script');
    let timeoutId: any;

    const cleanup = () => {
      if ((window as any)[callbackName]) delete (window as any)[callbackName];
      if (document.body.contains(script)) document.body.removeChild(script);
      if (timeoutId) clearTimeout(timeoutId);
    };

    // 3 seconds timeout
    timeoutId = setTimeout(() => {
      cleanup();
      resolve([]);
    }, 3000);

    // Set global callback function
    (window as any)[callbackName] = (data: any) => {
      cleanup();
      try {
        const suggestions = config.parseResponse(data);
        resolve(suggestions);
      } catch (e) {
        resolve([]);
      }
    };

    // Build URL and make request
    script.src = buildJsonpUrl(config, query, callbackName);
    script.onerror = () => {
      cleanup();
      resolve([]);
    };
    document.body.appendChild(script);
  });
};