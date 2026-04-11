/**
 * assetLoader.js
 *
 * Loads and caches furniture asset descriptors (JSON) and images (SVG/PNG).
 * Uses module-level Maps to avoid re-fetching across calls.
 *
 * Base path for all assets: /assets/furniture/
 * Asset index lives at: /src/data/assetIndex.json
 */

const ASSET_BASE_PATH = '/assets/furniture/';

// Module-level caches
const descriptorCache = new Map(); // path -> descriptor object
const imageCache      = new Map(); // path -> HTMLImageElement

/**
 * Load and cache an asset descriptor JSON file.
 * @param {string} path - Relative path from the furniture base, e.g. "sofa/sofa-transitional-01.json"
 * @returns {Promise<Object>} The parsed JSON descriptor
 */
export async function loadAssetDescriptor(path) {
  if (descriptorCache.has(path)) {
    return descriptorCache.get(path);
  }

  const url = `${ASSET_BASE_PATH}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`[assetLoader] Failed to load descriptor: ${url} (${res.status})`);
  }

  const descriptor = await res.json();
  descriptorCache.set(path, descriptor);
  return descriptor;
}

/**
 * Load and cache an asset image (SVG or PNG) as an HTMLImageElement.
 * @param {string} path - Relative path from the furniture base, e.g. "sofa/sofa-transitional-01.svg"
 * @returns {Promise<HTMLImageElement>}
 */
export async function loadAssetImage(path) {
  if (imageCache.has(path)) {
    return imageCache.get(path);
  }

  const url = `${ASSET_BASE_PATH}${path}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(path, img);
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`[assetLoader] Failed to load image: ${url}`));
    };
    img.src = url;
  });
}

/**
 * Load all assets for a given style pack (by styleId).
 * Reads the asset index, finds the matching pack, then loads all descriptors and images in parallel.
 *
 * @param {string} styleId - e.g. "transitional"
 * @returns {Promise<Map<string, { descriptor: Object, image: HTMLImageElement }>>}
 *   A Map keyed by asset id (e.g. "sofa-transitional-01")
 */
export async function loadAssetPack(styleId) {
  // Load the asset index
  let assetIndex;
  try {
    const res = await fetch('/src/data/assetIndex.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    assetIndex = await res.json();
  } catch (err) {
    console.warn('[assetLoader] Could not load assetIndex.json from /src/data/, trying /assets/assetIndex.json');
    // Fallback: try from public root
    const res2 = await fetch('/assetIndex.json');
    if (!res2.ok) throw new Error(`[assetLoader] Failed to load asset index: ${err.message}`);
    assetIndex = await res2.json();
  }

  // Find the best-matching pack — exact style match first, then first pack as fallback
  const pack =
    assetIndex.packs.find((p) => p.id === styleId) ||
    assetIndex.packs.find((p) => p.styles.includes(styleId)) ||
    assetIndex.packs[0];

  if (!pack) {
    throw new Error(`[assetLoader] No asset pack found for style: ${styleId}`);
  }

  // Load all assets in parallel
  const results = await Promise.all(
    pack.assets.map(async (assetPath) => {
      const descriptor = await loadAssetDescriptor(assetPath);

      // Derive the image path: replace .json extension with the actual file extension
      // Descriptor's "file" field gives us the path relative to the furniture base
      const imagePath = descriptor.file;

      let image = null;
      try {
        image = await loadAssetImage(imagePath);
      } catch (err) {
        console.warn(`[assetLoader] Could not load image for ${descriptor.id}: ${err.message}`);
        // image stays null — compositor will skip this asset gracefully
      }

      return { id: descriptor.id, descriptor, image };
    })
  );

  // Build map keyed by asset id
  const assetMap = new Map();
  for (const { id, descriptor, image } of results) {
    if (image) {
      assetMap.set(id, { descriptor, image });
    }
  }

  return assetMap;
}

/**
 * Select the best matching asset for a given slot from the loaded asset map.
 * Filters by category; optionally filters by style compatibility.
 * Returns the first matching asset, or null if none found.
 *
 * @param {Map<string, { descriptor, image }>} assets - Loaded asset pack
 * @param {string} category - e.g. "sofa", "rug", "accent_chair"
 * @param {string[]} styles - e.g. ["transitional", "modern"]
 * @returns {{ descriptor: Object, image: HTMLImageElement } | null}
 */
export function selectAsset(assets, category, styles = []) {
  // First pass: match by category AND style
  for (const [, asset] of assets) {
    if (asset.descriptor.category === category) {
      if (styles.length === 0) return asset;
      // Check if any of the requested styles are in the asset's styles array
      const hasMatchingStyle = asset.descriptor.styles.some((s) => styles.includes(s));
      if (hasMatchingStyle) return asset;
    }
  }

  // Second pass: match by category only (style fallback)
  for (const [, asset] of assets) {
    if (asset.descriptor.category === category) {
      return asset;
    }
  }

  return null;
}
