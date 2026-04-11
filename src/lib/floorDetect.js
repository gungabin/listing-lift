/**
 * floorDetect.js
 * Analyzes a depth map image to extract floor geometry for the compositor.
 *
 * Input:  HTMLImageElement of a grayscale depth map (near=bright, far=dark)
 * Output: FloorGeometry object used by templateEngine + compositor
 */

/**
 * Main entry point.
 * @param {HTMLImageElement} depthImg - grayscale depth map
 * @param {number} imageWidth  - original room photo width in pixels
 * @param {number} imageHeight - original room photo height in pixels
 * @returns {FloorGeometry}
 */
export function detectFloorPlane(depthImg, imageWidth, imageHeight) {
  // Render depth map to a canvas so we can sample pixels
  const canvas = document.createElement('canvas');
  canvas.width  = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(depthImg, 0, 0, imageWidth, imageHeight);
  const depthData = ctx.getImageData(0, 0, imageWidth, imageHeight).data;

  // Helper: get brightness (0-255) of depth map at pixel (x, y)
  function brightness(x, y) {
    const i = (Math.floor(y) * imageWidth + Math.floor(x)) * 4;
    return depthData[i]; // R channel = grayscale brightness
  }

  // ── Step 1: Find the horizon line ──────────────────────────────────────
  // Scan vertically in columns across the center half of the image.
  // The horizon is where brightness transitions from flat/dark (walls, far)
  // to increasing (floor, getting closer to camera).
  // We detect this as the row where average brightness starts rising steadily.

  const sampleCols = 8;
  const colStep = Math.floor(imageWidth / (sampleCols + 1));
  const rowBrightness = [];

  for (let y = 0; y < imageHeight; y++) {
    let total = 0;
    for (let c = 1; c <= sampleCols; c++) {
      const x = colStep * c;
      total += brightness(x, y);
    }
    rowBrightness.push(total / sampleCols);
  }

  // Smooth the row brightness curve (5-row rolling average)
  const smoothed = rowBrightness.map((v, i) => {
    const window = rowBrightness.slice(Math.max(0, i - 2), i + 3);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });

  // Find the y where brightness starts consistently increasing (the horizon)
  // Search in the range 25%–65% of image height
  const searchStart = Math.floor(imageHeight * 0.25);
  const searchEnd   = Math.floor(imageHeight * 0.65);
  let horizonY = Math.floor(imageHeight * 0.42); // sensible default

  for (let y = searchStart; y < searchEnd - 5; y++) {
    // Check if brightness increases consistently over the next 5 rows
    const rising = smoothed[y + 1] > smoothed[y] &&
                   smoothed[y + 2] > smoothed[y] &&
                   smoothed[y + 3] > smoothed[y + 1];
    if (rising && smoothed[y] < 100) { // must be starting from a dark (far) value
      horizonY = y;
      break;
    }
  }

  // Clamp horizon to reasonable range
  horizonY = Math.max(Math.floor(imageHeight * 0.28), Math.min(horizonY, Math.floor(imageHeight * 0.58)));

  // ── Step 2: Floor bottom ────────────────────────────────────────────────
  // Floor extends to ~90% of image height in typical real estate photos
  const floorBottom = Math.floor(imageHeight * 0.90);

  // ── Step 3: Vanishing point estimate ───────────────────────────────────
  // For MVP, estimate VP as the horizontal center at the horizon line.
  // Phase 2: replace with actual VP detection from depth gradients.
  const vanishingPoint = {
    x: imageWidth * 0.5,
    y: horizonY,
  };

  // ── Step 4: Floor polygon ───────────────────────────────────────────────
  // Trapezoid: narrow at horizon, full width at bottom.
  // Side margins shrink toward the VP as y approaches horizon.
  const bottomMargin = Math.floor(imageWidth * 0.03);
  const topWidth     = Math.floor(imageWidth * 0.35); // narrow strip at horizon

  const floorPolygon = [
    { x: vanishingPoint.x - topWidth / 2, y: horizonY },      // top-left
    { x: vanishingPoint.x + topWidth / 2, y: horizonY },      // top-right
    { x: imageWidth - bottomMargin,       y: floorBottom },   // bottom-right
    { x: bottomMargin,                    y: floorBottom },   // bottom-left
  ];

  // ── Step 5: Depth zones ─────────────────────────────────────────────────
  const floorHeight = floorBottom - horizonY;

  const depthZones = {
    far: {
      yMin: horizonY,
      yMax: horizonY + Math.floor(floorHeight * 0.33),
      scaleFactor: 0.45,
    },
    mid: {
      yMin: horizonY + Math.floor(floorHeight * 0.33),
      yMax: horizonY + Math.floor(floorHeight * 0.66),
      scaleFactor: 0.72,
    },
    near: {
      yMin: horizonY + Math.floor(floorHeight * 0.66),
      yMax: floorBottom,
      scaleFactor: 1.00,
    },
  };

  // ── Step 6: Camera angle estimate ──────────────────────────────────────
  // Horizon at ~42% → camera angle ≈ 28°. Adjust slightly based on detected horizon.
  const horizonRatio   = horizonY / imageHeight;
  const cameraAngleDeg = 15 + (horizonRatio * 30); // 15–45° range

  return {
    horizonY,
    floorBottom,
    vanishingPoint,
    floorPolygon,
    depthZones,
    estimatedRoomWidthFt: 15, // default; Phase 2: derive from depth scale
    cameraAngleDeg,
  };
}

/**
 * scaleAtY — returns the perspective scale factor for a given y pixel position.
 * 1.0 at floorBottom, ~0.45 at horizonY.
 */
export function scaleAtY(y, geometry) {
  const { horizonY, floorBottom } = geometry;
  const FAR_SCALE  = 0.45;
  const NEAR_SCALE = 1.00;
  const t = Math.max(0, Math.min(1, (y - horizonY) / (floorBottom - horizonY)));
  return FAR_SCALE + (NEAR_SCALE - FAR_SCALE) * t;
}

/**
 * perspectiveProject — converts floor plane (u, v) coordinates to image (x, y) pixels.
 * u: 0 = left edge of floor, 1 = right edge
 * v: 0 = back wall (horizonY), 1 = foreground (floorBottom)
 */
export function perspectiveProject(u, v, geometry, imageWidth) {
  const { horizonY, floorBottom, floorPolygon } = geometry;

  // Interpolate between top and bottom of the floor trapezoid
  const topLeft     = floorPolygon[0];
  const topRight    = floorPolygon[1];
  const bottomRight = floorPolygon[2];
  const bottomLeft  = floorPolygon[3];

  // Left and right x at this depth
  const leftX  = topLeft.x  + (bottomLeft.x  - topLeft.x)  * v;
  const rightX = topRight.x + (bottomRight.x - topRight.x) * v;
  const rowY   = horizonY   + (floorBottom - horizonY)      * v;

  return {
    x: leftX + (rightX - leftX) * u,
    y: rowY,
  };
}

/**
 * isInsideFloorPolygon — point-in-polygon test for the floor trapezoid.
 */
export function isInsideFloorPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
                      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
