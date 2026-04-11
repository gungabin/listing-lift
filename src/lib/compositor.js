/**
 * compositor.js
 * Deterministic compositing engine for Listing Lift.
 *
 * The original room photo is drawn once as the permanent base layer and never
 * modified. All furniture is composited on top using Canvas 2D.
 *
 * Usage:
 *   import { compositeRoom } from '@/lib/compositor';
 *   const blobUrl = await compositeRoom({ originalImage, depthMap, ... });
 */

import { detectFloorPlane, scaleAtY, perspectiveProject } from './floorDetect';
import { resolveTemplate, resolveAnchorPosition } from './templateEngine';
import { loadAssetPack, selectAsset, loadAssetImage } from './assetLoader';

/**
 * Main entry point.
 *
 * @param {object} opts
 * @param {HTMLImageElement} opts.originalImage
 * @param {HTMLImageElement} opts.depthMap       - grayscale depth map
 * @param {string}           opts.roomType       - e.g. 'living_room'
 * @param {string}           opts.decorStyle     - e.g. 'transitional'
 * @param {string}           opts.decorLevel     - 'light' | 'medium' | 'full'
 * @returns {Promise<string>} blob URL of composited image
 */
export async function compositeRoom({ originalImage, depthMap, roomType, decorStyle, decorLevel }) {
  const imageWidth  = originalImage.naturalWidth  || originalImage.width;
  const imageHeight = originalImage.naturalHeight || originalImage.height;

  // ── 4-1: Initialize canvases ──────────────────────────────────────────
  // Base canvas: permanent, untouched after the first drawImage
  const baseCanvas = createCanvas(imageWidth, imageHeight);
  const baseCtx    = baseCanvas.getContext('2d');
  baseCtx.drawImage(originalImage, 0, 0, imageWidth, imageHeight);

  // Compositing canvas: all furniture draws here, then merged onto base
  const compCanvas = createCanvas(imageWidth, imageHeight);
  const compCtx    = compCanvas.getContext('2d');

  // ── 4-2: Compute floor geometry ───────────────────────────────────────
  const geometry = detectFloorPlane(depthMap, imageWidth, imageHeight);

  // ── 4-3: Load template and assets ────────────────────────────────────
  const { pieces } = await resolveTemplate(roomType, decorLevel);
  const assetPack  = await loadAssetPack(decorStyle);

  // ── 4-4 + 4-5: Resolve positions and render pieces ───────────────────
  // resolvedPieces tracks each placed piece so later pieces can anchor to them
  const resolvedPieces = new Map();

  // Separate rug from other pieces — rug always renders first
  const rugPiece    = pieces.find(p => p.category === 'rug');
  const otherPieces = pieces.filter(p => p.category !== 'rug');

  // Render rug first (z_layer 0)
  if (rugPiece) {
    await renderRug(compCtx, rugPiece, resolvedPieces, geometry, assetPack, decorStyle, imageWidth, imageHeight);
    const rugPos = resolveAnchorPosition(rugPiece, resolvedPieces);
    resolvedPieces.set(rugPiece.slot, rugPos);
  }

  // Render all other pieces in z_layer order
  for (const piece of otherPieces) {
    const pos = resolveAnchorPosition(piece, resolvedPieces);

    // Clamp u to valid range
    pos.u = Math.max(0.08, Math.min(0.92, pos.u));
    pos.v = Math.max(0.02, Math.min(0.98, pos.v));

    const { x: anchorX, y: anchorY } = perspectiveProject(pos.u, pos.v, geometry, imageWidth);
    const scale = scaleAtY(anchorY, geometry);

    const asset = selectAsset(assetPack, piece.category, [decorStyle]);
    if (!asset) {
      console.warn(`[compositor] No asset found for category: ${piece.category}`);
      resolvedPieces.set(piece.slot, { ...pos, anchorX, anchorY });
      continue;
    }

    const img = await loadAssetImage(asset.descriptor.file);

    // Real-world width in pixels: scale relative to image width and depth
    const refWidthPx  = imageWidth * 0.40; // reference: 40% of image = near-zone sofa
    const assetWidthPx  = (asset.descriptor.width_ft / 8.0) * refWidthPx * scale;
    const aspectRatio   = img.naturalHeight / img.naturalWidth;
    const assetHeightPx = assetWidthPx * aspectRatio;

    const floorAnchorY = asset.descriptor.floor_anchor_y ?? 0.88;
    const drawX = anchorX - assetWidthPx / 2;
    const drawY = anchorY - assetHeightPx * floorAnchorY;

    // Render shadow beneath this piece
    renderShadow(compCtx, asset.descriptor.shadow, anchorX, anchorY, assetWidthPx, scale);

    // Draw the furniture asset
    compCtx.drawImage(img, drawX, drawY, assetWidthPx, assetHeightPx);

    // Track resolved position for dependent pieces
    resolvedPieces.set(piece.slot, {
      ...pos,
      anchorX,
      anchorY,
      width:  assetWidthPx,
      height: assetHeightPx,
    });
  }

  // ── 4-6: Flatten onto base and export ─────────────────────────────────
  baseCtx.drawImage(compCanvas, 0, 0);

  // OffscreenCanvas uses convertToBlob(); HTMLCanvasElement uses toBlob()
  const blob = baseCanvas.convertToBlob
    ? await baseCanvas.convertToBlob({ type: 'image/png' })
    : await new Promise((resolve, reject) => {
        baseCanvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
      });

  return URL.createObjectURL(blob);
}

// ── Shadow renderer ────────────────────────────────────────────────────────

function renderShadow(ctx, shadowDef, anchorX, anchorY, assetWidthPx, scale) {
  if (!shadowDef) return;

  const blur    = (shadowDef.blur_px ?? 14) * scale;
  const opacity = shadowDef.opacity ?? 0.18;
  const spread  = shadowDef.spread  ?? 0.80;
  const offX    = (shadowDef.offset_x ?? 0)    * assetWidthPx;
  const offY    = (shadowDef.offset_y ?? 0.02) * assetWidthPx;

  const cx = anchorX + offX;
  const cy = anchorY + offY;
  const rx = (assetWidthPx / 2) * spread;
  const ry = rx * 0.20; // flatten ellipse to look like a floor shadow

  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.fill();
  ctx.restore();
}

// ── Rug renderer (perspective foreshortening via horizontal strips) ─────────

async function renderRug(ctx, rugPiece, resolvedPieces, geometry, assetPack, decorStyle, imageWidth, imageHeight) {
  const asset = selectAsset(assetPack, 'rug', [decorStyle]);
  if (!asset) return;

  const img = await loadAssetImage(asset.descriptor.file);

  // Rug position: centered on floor, spanning from sofa-front to near mid zone
  const rugWidthFt  = asset.descriptor.width_ft  ?? 9;
  const rugDepthFt  = asset.descriptor.depth_ft  ?? 12;
  const roomWidthFt = geometry.estimatedRoomWidthFt ?? 15;

  // u-width of rug as fraction of floor
  const rugUWidth = rugWidthFt / roomWidthFt;
  const rugULeft  = 0.5 - rugUWidth / 2;
  const rugURight = 0.5 + rugUWidth / 2;

  // v positions: rug back edge at far zone, front at mid/near boundary
  const rugVBack  = 0.10;
  const rugVFront = 0.62;

  // Project 4 corners to image coordinates
  const topLeft     = perspectiveProject(rugULeft,  rugVBack,  geometry, imageWidth);
  const topRight    = perspectiveProject(rugURight, rugVBack,  geometry, imageWidth);
  const bottomLeft  = perspectiveProject(rugULeft,  rugVFront, geometry, imageWidth);
  const bottomRight = perspectiveProject(rugURight, rugVFront, geometry, imageWidth);

  // Draw rug using horizontal strips to approximate perspective
  drawPerspectiveImage(ctx, img, topLeft, topRight, bottomLeft, bottomRight);

  // Soft edge shadow on rug
  drawRugEdgeShadow(ctx, topLeft, topRight, bottomLeft, bottomRight);
}

/**
 * drawPerspectiveImage — approximates a 4-point perspective transform
 * by slicing the image into N horizontal strips and drawing each strip
 * at the correct trapezoidal position using ctx.transform().
 *
 * Based on the strip-based approach that works in Canvas 2D.
 */
function drawPerspectiveImage(ctx, img, tl, tr, bl, br, strips = 64) {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  ctx.save();

  for (let i = 0; i < strips; i++) {
    const t0 = i       / strips;
    const t1 = (i + 1) / strips;

    // Interpolate left and right edges of this strip in destination space
    const x0l = lerp(tl.x, bl.x, t0);  const y0l = lerp(tl.y, bl.y, t0);
    const x0r = lerp(tr.x, br.x, t0);  const y0r = lerp(tr.y, br.y, t0);
    const x1l = lerp(tl.x, bl.x, t1);  const y1l = lerp(tl.y, bl.y, t1);
    const x1r = lerp(tr.x, br.x, t1);  const y1r = lerp(tr.y, br.y, t1);

    // Source strip: slice of image height
    const srcY0 = srcH * t0;
    const srcY1 = srcH * t1;
    const srcH_strip = srcY1 - srcY0;

    // Destination strip width and height
    const destW = Math.max(x0r - x0l, x1r - x1l);
    const destH = Math.max(
      Math.hypot(x1l - x0l, y1l - y0l),
      Math.hypot(x1r - x0r, y1r - y0r),
    );

    if (destW <= 0 || destH <= 0 || srcH_strip <= 0) continue;

    // Apply transform: map the strip into the destination parallelogram
    // We use the top-left corner as the origin and set the transform matrix
    const scaleX = destW / srcW;
    const scaleY = destH / srcH_strip;

    // Skew angle for the horizontal axis of this strip
    const dx = x0r - x0l;
    const dy = y0r - y0l;
    const stripAngle = Math.atan2(y0r - y0l, x0r - x0l);

    ctx.save();
    ctx.translate(x0l, y0l);
    ctx.rotate(stripAngle);
    ctx.scale(Math.hypot(dx, dy) / srcW, destH / srcH_strip);

    ctx.drawImage(img,
      0, srcY0, srcW, srcH_strip,  // source
      0, 0,     srcW, srcH_strip   // destination
    );
    ctx.restore();
  }

  ctx.restore();
}

function drawRugEdgeShadow(ctx, tl, tr, bl, br) {
  ctx.save();
  ctx.filter = 'blur(8px)';

  // Draw a polygon matching the rug outline with a very faint shadow
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();

  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth   = 6;
  ctx.stroke();

  ctx.restore();
}

// ── Utilities ──────────────────────────────────────────────────────────────

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const c = document.createElement('canvas');
  c.width  = width;
  c.height = height;
  return c;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
