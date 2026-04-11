/**
 * templateEngine.js
 * Loads room layout templates and resolves piece positions into floor coordinates.
 *
 * Templates are imported as ES modules (not fetched) so Vite bundles them.
 * Files in /src/data/ are not served statically — only /public/ is.
 */

import livingRoomTemplate from '@/data/templates/living_room.json';
import bedroomTemplate    from '@/data/templates/bedroom.json';

const TEMPLATES = {
  living_room: livingRoomTemplate,
  bedroom:     bedroomTemplate,
};

/**
 * Load and return the best layout for a given room type and furnishing level.
 * @param {string} roomType        - e.g. 'living_room', 'bedroom'
 * @param {string} furnishingLevel - 'light' | 'medium' | 'full'
 * @returns {Promise<{layout, pieces}>}
 */
export async function resolveTemplate(roomType, furnishingLevel) {
  const template = TEMPLATES[roomType] || TEMPLATES['living_room'];

  // Find the best matching layout for this furnishing level
  // Prefer exact match; fall back to first layout that supports this level
  const layout = template.layouts.find(l =>
    l.furnishing_levels.includes(furnishingLevel)
  ) || template.layouts[0];

  if (!layout) throw new Error(`No layout found for ${roomType} / ${furnishingLevel}`);

  // Filter pieces by furnishing level
  const pieces = layout.pieces.filter(piece => {
    if (!piece.furnishing_level_min) return true;
    const levels = ['light', 'medium', 'full'];
    return levels.indexOf(furnishingLevel) >= levels.indexOf(piece.furnishing_level_min);
  });

  // Sort by z_layer so compositor renders in correct order
  pieces.sort((a, b) => (a.z_layer ?? 0) - (b.z_layer ?? 0));

  return { layout, pieces };
}

/**
 * Named anchor positions → floor plane (u, v) coordinates.
 *
 * u: 0 = left edge, 1 = right edge, 0.5 = center
 * v: 0 = back wall (far), 1 = foreground (near)
 *
 * resolvedPieces is a Map<slot, {u, v, anchorX, anchorY, width, height}>
 * so that pieces can be positioned relative to already-placed pieces.
 */
export function resolveAnchorPosition(piece, resolvedPieces) {
  const anchor   = piece.position?.anchor || 'floor-center';
  const xOffset  = piece.position?.x_offset || 0;
  const yOffset  = piece.position?.y_offset || 0;
  const depthZone = piece.position?.depth_zone || 'mid';

  // Base v values per depth zone
  const zoneV = { far: 0.12, mid: 0.50, near: 0.82 };
  const baseV = zoneV[depthZone] ?? 0.50;

  // Named anchor resolution
  switch (anchor) {
    case 'floor-center':
      return { u: 0.5 + xOffset, v: baseV + yOffset };

    case 'back-center':
      return { u: 0.5 + xOffset, v: 0.08 + yOffset };

    case 'back-left-corner':
      return { u: 0.15 + xOffset, v: 0.08 + yOffset };

    case 'back-right-corner':
      return { u: 0.85 + xOffset, v: 0.08 + yOffset };

    case 'sofa-front-center': {
      const sofa = resolvedPieces.get('primary_sofa');
      if (!sofa) return { u: 0.5 + xOffset, v: 0.35 + yOffset };
      // Gap in front of sofa: shift v forward by ~0.18
      return { u: sofa.u + xOffset, v: sofa.v + 0.20 + yOffset };
    }

    case 'sofa-right-corner': {
      const sofa = resolvedPieces.get('primary_sofa');
      if (!sofa) return { u: 0.72 + xOffset, v: 0.08 + yOffset };
      return { u: sofa.u + 0.22 + xOffset, v: sofa.v + yOffset };
    }

    case 'sofa-left-corner': {
      const sofa = resolvedPieces.get('primary_sofa');
      if (!sofa) return { u: 0.28 + xOffset, v: 0.08 + yOffset };
      return { u: sofa.u - 0.22 + xOffset, v: sofa.v + yOffset };
    }

    case 'coffee-table-left': {
      const ct = resolvedPieces.get('coffee_table');
      if (!ct) return { u: 0.28 + xOffset, v: 0.45 + yOffset };
      return { u: ct.u - 0.20 + xOffset, v: ct.v + yOffset };
    }

    case 'coffee-table-right': {
      const ct = resolvedPieces.get('coffee_table');
      if (!ct) return { u: 0.72 + xOffset, v: 0.45 + yOffset };
      return { u: ct.u + 0.20 + xOffset, v: ct.v + yOffset };
    }

    case 'accent-chair-left-side': {
      const chair = resolvedPieces.get('accent_chair_left');
      if (!chair) return { u: 0.18 + xOffset, v: 0.48 + yOffset };
      return { u: chair.u - 0.10 + xOffset, v: chair.v - 0.05 + yOffset };
    }

    // Bedroom anchors
    case 'bed-left-side': {
      const bed = resolvedPieces.get('primary_bed');
      if (!bed) return { u: 0.25 + xOffset, v: 0.10 + yOffset };
      return { u: bed.u - 0.22 + xOffset, v: bed.v + yOffset };
    }

    case 'bed-right-side': {
      const bed = resolvedPieces.get('primary_bed');
      if (!bed) return { u: 0.75 + xOffset, v: 0.10 + yOffset };
      return { u: bed.u + 0.22 + xOffset, v: bed.v + yOffset };
    }

    case 'bed-foot-center': {
      const bed = resolvedPieces.get('primary_bed');
      if (!bed) return { u: 0.5 + xOffset, v: 0.45 + yOffset };
      return { u: bed.u + xOffset, v: bed.v + 0.30 + yOffset };
    }

    case 'left-wall-center':
      return { u: 0.12 + xOffset, v: 0.35 + yOffset };

    case 'nightstand-left-surface': {
      const ns = resolvedPieces.get('nightstand_left');
      if (!ns) return { u: 0.22 + xOffset, v: 0.10 + yOffset };
      return { u: ns.u + xOffset, v: ns.v + yOffset };
    }

    case 'nightstand-right-surface': {
      const ns = resolvedPieces.get('nightstand_right');
      if (!ns) return { u: 0.78 + xOffset, v: 0.10 + yOffset };
      return { u: ns.u + xOffset, v: ns.v + yOffset };
    }

    default:
      // Unknown anchor — place at floor center
      console.warn(`[templateEngine] Unknown anchor: ${anchor}, defaulting to floor-center`);
      return { u: 0.5 + xOffset, v: baseV + yOffset };
  }
}
