const MAX_SVG_LENGTH = 20_000;

const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'mask',
  'title',
  'desc',
]);

const ALLOWED_ATTRS = new Set([
  'xmlns',
  'viewbox',
  'width',
  'height',
  'x',
  'y',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x1',
  'y1',
  'x2',
  'y2',
  'd',
  'points',
  'transform',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'clip-path',
  'clip-rule',
  'mask',
  'opacity',
  'id',
  'class',
  'version',
  'preserveaspectratio',
  'gradientunits',
  'gradienttransform',
  'offset',
  'stop-color',
  'stop-opacity',
  'p-id',
  't',
]);

const isSafeValue = (name: string, value: string): boolean => {
  const normalized = value.trim();
  const lowered = normalized.toLowerCase();

  if (
    lowered.includes('javascript:') ||
    lowered.includes('vbscript:') ||
    lowered.includes('data:') ||
    lowered.includes('<') ||
    lowered.includes('>')
  ) {
    return false;
  }

  if (normalized.includes('&')) {
    return false;
  }

  if (
    ['fill', 'stroke', 'clip-path', 'mask'].includes(name) &&
    /url\s*\(/i.test(normalized)
  ) {
    return /^url\(\s*#[\w-]+\s*\)$/i.test(normalized);
  }

  return true;
};

const sanitizeElement = (element: Element): void => {
  const tag = element.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    element.remove();
    return;
  }

  for (const attr of [...element.attributes]) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith('on') || name === 'style') {
      element.removeAttribute(attr.name);
      continue;
    }

    if (name === 'href' || name === 'xlink:href') {
      element.removeAttribute(attr.name);
      continue;
    }

    if (!ALLOWED_ATTRS.has(name) || !isSafeValue(name, value)) {
      element.removeAttribute(attr.name);
    }
  }

  for (const child of [...element.children]) {
    sanitizeElement(child);
  }
};

export const sanitizeSvgMarkup = (raw: string): string | undefined => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_SVG_LENGTH) {
    return undefined;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, 'image/svg+xml');

  if (doc.querySelector('parsererror')) {
    return undefined;
  }

  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    return undefined;
  }

  sanitizeElement(root);

  if (!root.getAttribute('xmlns')) {
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const serialized = new XMLSerializer().serializeToString(root);
  if (!serialized.toLowerCase().startsWith('<svg')) {
    return undefined;
  }

  return serialized;
};

export const toSvgDataUri = (svgMarkup: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
};

const iconUriCache = new Map<string, string | null>();

export const getSafeSvgDataUri = (raw?: string): string | undefined => {
  if (!raw?.trim()) {
    return undefined;
  }

  const cached = iconUriCache.get(raw);
  if (cached !== undefined) {
    return cached ?? undefined;
  }

  const sanitized = sanitizeSvgMarkup(raw);
  if (!sanitized) {
    iconUriCache.set(raw, null);
    return undefined;
  }

  const uri = toSvgDataUri(sanitized);
  iconUriCache.set(raw, uri);
  return uri;
};
