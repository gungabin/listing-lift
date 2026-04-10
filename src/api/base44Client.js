/**
 * Listing Lift — API Client
 *
 * Handles all data + staging operations. Two modes:
 *
 * REAL MODE (when VITE_OPENAI_API_KEY is set in .env):
 *   Calls OpenAI gpt-image-1 to actually stage the room photo.
 *
 * MOCK MODE (no API key):
 *   Resolves with a sample Unsplash room image after a short delay.
 *   Useful for UI work without burning API credits.
 *
 * TO GO LIVE:
 *   Move the OpenAI call to a Vercel serverless function (/api/stage)
 *   so the API key stays on the server and isn't exposed in the browser.
 */

// ---------------------------------------------------------------------------
// Prompts — tuned through extensive testing, do not modify lightly
// ---------------------------------------------------------------------------
const ROOM_PROMPTS = {
  living_room: 'living room with sofa, coffee table, accent chairs, area rug, and decorative accessories',
  bedroom: 'bedroom with bed frame, nightstands, dresser, lamps, and bedding',
  dining_room: 'dining room with dining table, dining chairs, sideboard, and pendant lighting',
  kitchen: 'kitchen with bar stools at island or counter, small decorative accessories on countertops',
  office: 'home office with desk, office chair, bookshelf, desk lamp, and accessories',
  bathroom: 'bathroom with towels, bath mat, vanity accessories, and small decor',
  outdoor: 'outdoor patio with outdoor furniture, planters, and outdoor accessories',
  other: 'room with appropriate furniture and decor',
};

const STYLE_DESCRIPTORS = {
  modern: 'sleek modern style with clean lines, neutral tones, minimal clutter, high-contrast accents, polished surfaces',
  farmhouse: 'warm farmhouse style with shiplap textures, natural wood tones, linen fabrics, vintage accents, cozy rustic warmth',
  coastal: 'coastal style with light blues, whites, natural textures, woven accents, breezy and relaxed atmosphere',
  traditional: 'classic traditional style with rich wood tones, symmetrical arrangements, formal elegance, warm deep colors',
  mid_century: 'mid-century modern style with tapered legs, warm wood tones, earthy palette, retro geometric patterns',
  scandinavian: 'Scandinavian style with white walls, light wood, minimal clean design, cozy hygge textures',
  transitional: 'transitional style blending traditional and modern, neutral palette, sophisticated and timeless',
};

const LEVEL_DESCRIPTORS = {
  light: 'Add only a few key accent pieces — one or two small furniture items, minimal accessories. Keep it sparse and open.',
  medium: 'Add the main furniture pieces for this room type and a moderate amount of accessories. Balanced and livable.',
  full: 'Fully stage the room with complete furniture arrangement, layered textiles, art, plants, and rich accessories. Lush and complete.',
};

function buildStagingPrompt(roomType, decorStyle, decorLevel) {
  const roomDesc = ROOM_PROMPTS[roomType] || ROOM_PROMPTS.other;
  const styleDesc = STYLE_DESCRIPTORS[decorStyle] || STYLE_DESCRIPTORS.transitional;
  const levelDesc = LEVEL_DESCRIPTORS[decorLevel] || LEVEL_DESCRIPTORS.medium;

  return `This is a real estate photograph of an empty room. Your ONLY task is to place freestanding furniture and accessories into the empty space. You are adding objects to a photograph — nothing about the photograph itself changes. Every pixel not covered by furniture you add must be 100% identical to the original image.

═══════════════════════════════════════
PRESERVATION RULES — READ THESE FIRST
These are absolute. Violating any one is a complete failure.
═══════════════════════════════════════

FLOOR — MOST CRITICAL:
The floor is a fixed, permanent feature of this property. It must appear exactly as it does in the original photograph in every area not directly covered by furniture you place.
- DO NOT change the floor color, stain, tone, or finish in any way
- DO NOT lighten, darken, warm, cool, or recolor the flooring
- DO NOT change the wood species, plank width, grain pattern, or texture
- DO NOT add sheen, gloss, or polish that does not exist in the original
- DO NOT blur, sharpen, or alter the floor surface in any way
- Floor visible around furniture legs, between pieces, and at room edges must be pixel-perfect identical to the original
- If the original floor looks raw, unfinished, or light in tone — it must remain exactly that way

WINDOWS & EXTERIOR VIEW:
- Every window must look exactly as it does in the original — same frame, same glass, same exterior view
- If the exterior view is overexposed, blown out, bright white, or partially visible — it must remain that way. DO NOT add trees, sky, foliage, buildings, or any scenery not clearly present in the original
- DO NOT add curtains, blinds, drapes, shutters, or any window treatments of any kind
- DO NOT alter window frames, glass reflections, or mullions

WALLS:
- Wall color, paint, texture, paneling, wainscoting, board-and-batten, shiplap, millwork, wallpaper — must be pixel-perfect identical to the original
- DO NOT alter, enhance, brighten, or "improve" any wall surface

CEILING:
- Ceiling color, texture, coffered details, tray ceiling profiles, beams, crown molding — must be pixel-perfect identical to the original
- DO NOT alter, lighten, or enhance the ceiling in any way

FIXED FIXTURES — every one of these must remain exactly as photographed:
- Recessed lights, can lights, ceiling fans, chandeliers, pendants, sconces
- HVAC vents, air returns, grilles, diffusers — exact appearance preserved
- Electrical outlets, switch plates, wall plates, coax plates, ethernet plates
- Smoke detectors, carbon monoxide detectors, sprinkler heads
- Thermostats, keypads, wall-mounted devices
- Baseboards, door frames, doors, built-in shelving, fireplaces, built-in cabinetry
- If furniture would overlap a fixture, you may place furniture in front — but never alter the fixture itself

LIGHTING & ATMOSPHERE:
- The room's existing natural and artificial lighting must remain unchanged
- DO NOT adjust brightness, contrast, exposure, saturation, or color temperature of the room
- DO NOT add ambient light, fill light, or HDR enhancement to the space
- DO NOT change how bright or dark the overall room appears

═══════════════════════════════════════
WHAT YOU ARE ALLOWED TO ADD
═══════════════════════════════════════
- Freestanding furniture placed on visible floor areas (sofas, chairs, tables, beds, bookshelves)
- A single area rug placed under/beneath furniture groupings
- Small accessories placed on top of furniture you added (plants, books, vases, bowls, art leaned against walls)
- Table lamps and floor lamps may be added as accessories — they MUST be turned ON. Every lamp placed must show a warm, soft glow emanating through the lampshade as if the bulb is lit. No unlit lamps.
- All additions must match the room's existing perspective, lighting, and scale exactly
- The final image must be photorealistic — indistinguishable from a professional real estate photograph

FURNITURE QUALITY REQUIREMENTS:
- Every piece of furniture must be fully photorealistic — crisp, sharp edges with no blurring, distortion, or soft rendering artifacts
- All furniture must follow the room's exact perspective and vanishing points — legs, arms, and backs must be geometrically accurate
- Upholstered pieces must show natural fabric weight, folds, and texture
- Chair and sofa legs must be fully formed, four-legged, and correctly foreshortened in perspective
- No furniture may appear partially melted, warped, merged with the floor, or have missing limbs

SHADOW REQUIREMENTS:
- Every piece of furniture must cast a soft, directional shadow on the floor directly beneath and behind it
- Shadow direction and angle must be consistent across ALL furniture in the scene, matching the existing window light source
- Shadow softness must match the existing ambient shadows visible in the original photo (look at the baseboard shadows for reference)
- Furniture legs must cast individual, correctly sized ground contact shadows
- Area rug edges must have a subtle shadow where they meet the floor

═══════════════════════════════════════
STAGING REQUIREMENTS
═══════════════════════════════════════
Room: ${roomDesc}
Style: ${styleDesc}
Density: ${levelDesc}

FINAL CHECK: Before finishing, verify — do the floors, walls, ceiling, windows, and all fixtures look exactly as they did in the original photo? If anything structural has changed, that is a failure. Undo it.`;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const JOBS_KEY = 'll_jobs';
const SUB_KEY = 'll_subscription';

// ---------------------------------------------------------------------------
// In-memory file store: blobUrl -> File
// File objects can't go in localStorage, so we keep them in memory.
// They're only needed during the current session (same session = same blob URLs).
// ---------------------------------------------------------------------------
const fileStore = new Map();

// ---------------------------------------------------------------------------
// Mock user
// ---------------------------------------------------------------------------
const MOCK_USER = {
  id: 'mock_user_1',
  email: 'agent@listinglift.com',
  full_name: 'Demo Agent',
};

// ---------------------------------------------------------------------------
// Mock subscription
// ---------------------------------------------------------------------------
const DEFAULT_SUBSCRIPTION = {
  id: 'sub_mock_1',
  user_email: MOCK_USER.email,
  plan: 'agent',
  status: 'active',
  generations_used: 47,
  generations_limit: 300,
  period_start: '2026-04-01',
  period_end: '2026-05-01',
};

// ---------------------------------------------------------------------------
// Mock staged image pool — used as fallback when no API key is present
// ---------------------------------------------------------------------------
const MOCK_STAGED_IMAGES = {
  living_room: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=85',
    'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=900&q=85',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=900&q=85',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=85',
  ],
  bedroom: [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=85',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900&q=85',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=85',
  ],
  dining_room: [
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=900&q=85',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=85',
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=85',
  ],
  office: [
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=85',
    'https://images.unsplash.com/photo-1524758860510-e9b5f8fcd9c2?w=900&q=85',
  ],
  bathroom: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=85',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=85',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=85',
  ],
  other: [
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=900&q=85',
  ],
};

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getJobs() {
  try { return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]'); }
  catch { return []; }
}

function saveJob(job) {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function getSubscription() {
  try {
    const stored = localStorage.getItem(SUB_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SUBSCRIPTION;
  } catch { return DEFAULT_SUBSCRIPTION; }
}

function saveSubscription(sub) {
  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
}

// ---------------------------------------------------------------------------
// Convert a File/Blob to PNG File (OpenAI image edits requires PNG)
// ---------------------------------------------------------------------------
async function toPngFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) return reject(new Error('Failed to convert image to PNG'));
        resolve(new File([blob], 'room.png', { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Floor compositing — color-distance based, floor zone only
//
// Approach:
//   In the bottom 55% of the image (where the floor lives), compare each
//   pixel between the original and AI output using Euclidean color distance:
//
//   - SMALL distance (< threshold): the AI just recolored this pixel.
//     The original wood floor got stained/darkened/lightened. Restore it.
//
//   - LARGE distance (≥ threshold): something physically different is here —
//     a rug, furniture leg, or shadow. Keep the AI pixel.
//
// Why color distance works in the floor zone but NOT elsewhere:
//   In the wall/ceiling zone, the original is white and furniture is also
//   white/light — small distance, would erase furniture. Bad.
//   In the floor zone, the original is wood-colored. A rug or furniture leg
//   on top of wood = very large color distance. Safe to threshold.
//
// Transition zone (45–55% from top): soft blend to avoid a hard seam
// at the wall/floor boundary.
//
// Threshold tuning:
//   Too low  → floor still changes (AI recoloring not caught)
//   Too high → rug/furniture starts getting erased
//   ~55 works well for typical wood floors. Adjust if needed.
// ---------------------------------------------------------------------------
const FLOOR_THRESHOLD = 55;

async function compositeStructure(originalFile, stagedBlobUrl) {
  return new Promise((resolve, reject) => {
    const origUrl  = URL.createObjectURL(originalFile);
    const origImg  = new Image();
    const stageImg = new Image();
    let origLoaded  = false;
    let stageLoaded = false;

    const run = () => {
      if (!origLoaded || !stageLoaded) return;
      try {
        const w = stageImg.naturalWidth;
        const h = stageImg.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Read AI staged pixels
        ctx.drawImage(stageImg, 0, 0, w, h);
        const stagedPixels = ctx.getImageData(0, 0, w, h);

        // Read original pixels scaled to match AI output dimensions
        ctx.drawImage(origImg, 0, 0, w, h);
        const origPixels = ctx.getImageData(0, 0, w, h);

        const ai   = stagedPixels.data; // modified in place
        const orig = origPixels.data;

        // Zone boundaries (from top of image)
        const blendStart = Math.floor(h * 0.45); // transition zone begins
        const floorStart = Math.floor(h * 0.55); // full floor zone begins

        for (let y = blendStart; y < h; y++) {
          // How strongly to apply restoration in the transition zone.
          // 0.0 at blend start → 1.0 at floor start → 1.0 for rest of image.
          const zoneStrength = y < floorStart
            ? (y - blendStart) / (floorStart - blendStart)
            : 1.0;

          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;

            const aiR = ai[i],   aiG = ai[i+1], aiB = ai[i+2];
            const orR = orig[i], orG = orig[i+1], orB = orig[i+2];

            // Euclidean color distance between original and AI at this pixel
            const dist = Math.sqrt((aiR-orR)**2 + (aiG-orG)**2 + (aiB-orB)**2);

            // Only restore if the change is small (floor recoloring, not furniture)
            if (dist < FLOOR_THRESHOLD) {
              const s = zoneStrength;
              ai[i]   = Math.round(orR * s + aiR * (1 - s));
              ai[i+1] = Math.round(orG * s + aiG * (1 - s));
              ai[i+2] = Math.round(orB * s + aiB * (1 - s));
            }
            // Large distance = rug, furniture leg, or shadow → keep AI pixel
          }
        }

        ctx.putImageData(stagedPixels, 0, 0);
        URL.revokeObjectURL(origUrl);

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Structure compositing failed'));
          resolve(URL.createObjectURL(blob));
        }, 'image/png');

      } catch (err) {
        URL.revokeObjectURL(origUrl);
        reject(err);
      }
    };

    origImg.onload   = () => { origLoaded  = true; run(); };
    stageImg.onload  = () => { stageLoaded = true; run(); };
    origImg.onerror  = () => reject(new Error('Compositing: failed to load original'));
    stageImg.onerror = () => reject(new Error('Compositing: failed to load staged image'));

    origImg.src  = origUrl;
    stageImg.src = stagedBlobUrl;
  });
}

// ---------------------------------------------------------------------------
// Real AI staging — calls OpenAI gpt-image-1, then composites structure back
// ---------------------------------------------------------------------------
async function runAiStaging(job) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Get the original file from memory store
  const originalFile = fileStore.get(job.original_image_url);
  if (!originalFile) {
    throw new Error('Original photo not found in session. Please re-upload and try again.');
  }

  // Convert to PNG (required by OpenAI image edits)
  const pngFile = await toPngFile(originalFile);

  const prompt = buildStagingPrompt(job.room_type, job.decor_style, job.decor_level);

  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('prompt', prompt);
  formData.append('image', pngFile);
  formData.append('quality', 'high');
  formData.append('size', '1536x1024');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI error: ${response.status}`);
  }

  // gpt-image-1 returns base64
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned from OpenAI');

  // Decode base64 → blob URL
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const aiBlob = new Blob([bytes], { type: 'image/png' });
  const aiUrl  = URL.createObjectURL(aiBlob);

  // Composite: restore original floor, windows, and bright structural elements
  const compositedUrl = await compositeStructure(originalFile, aiUrl);
  URL.revokeObjectURL(aiUrl); // clean up the intermediate blob
  return compositedUrl;
}

// ---------------------------------------------------------------------------
// Mock staging fallback — used when no API key is configured
// ---------------------------------------------------------------------------
function runMockStaging(job) {
  return new Promise((resolve) => {
    const delay = 6000 + Math.random() * 4000;
    setTimeout(() => {
      const pool = MOCK_STAGED_IMAGES[job.room_type] || MOCK_STAGED_IMAGES.other;
      resolve(pool[Math.floor(Math.random() * pool.length)]);
    }, delay);
  });
}

// ---------------------------------------------------------------------------
// Main staging dispatcher — called when stageImage is invoked
// ---------------------------------------------------------------------------
async function stageJob(jobId) {
  const jobs = getJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  try {
    let stagedImageUrl;

    if (apiKey) {
      // Real AI mode
      stagedImageUrl = await runAiStaging(job);
    } else {
      // Mock mode — no API key configured
      console.info('[Listing Lift] No VITE_OPENAI_API_KEY found — using mock staging. Add your key to .env to enable real AI.');
      stagedImageUrl = await runMockStaging(job);
    }

    job.status = 'completed';
    job.staged_image_url = stagedImageUrl;
    job.completed_date = new Date().toISOString();
    saveJob(job);

    // Increment usage counter
    const sub = getSubscription();
    sub.generations_used = Math.min((sub.generations_used || 0) + 1, sub.generations_limit);
    saveSubscription(sub);

  } catch (error) {
    console.error('[Listing Lift] Staging failed:', error);
    job.status = 'failed';
    job.error_message = error.message;
    saveJob(job);
  }
}

// ---------------------------------------------------------------------------
// The client — same interface used throughout the app
// ---------------------------------------------------------------------------
export const base44 = {
  auth: {
    async me() { return MOCK_USER; },
    logout(redirect) { window.location.href = redirect || '/'; },
    redirectToLogin(redirect) { window.location.href = redirect || '/'; },
  },

  entities: {
    Subscription: {
      async filter() { return [getSubscription()]; },
      async create(data) {
        const sub = { ...DEFAULT_SUBSCRIPTION, ...data, id: generateId() };
        saveSubscription(sub);
        return sub;
      },
      async update(id, data) {
        const sub = { ...getSubscription(), ...data };
        saveSubscription(sub);
        return sub;
      },
    },

    StagingJob: {
      async filter(query, sort, limit) {
        let jobs = getJobs();
        if (query?.user_email) jobs = jobs.filter((j) => j.user_email === query.user_email);
        if (query?.id) jobs = jobs.filter((j) => j.id === query.id);
        return jobs.slice(0, limit || 100);
      },
      async create(data) {
        const job = { id: generateId(), created_date: new Date().toISOString(), ...data };
        saveJob(job);
        return job;
      },
      async update(id, data) {
        const jobs = getJobs();
        const job = jobs.find((j) => j.id === id);
        if (!job) return null;
        const updated = { ...job, ...data };
        saveJob(updated);
        return updated;
      },
    },
  },

  functions: {
    async invoke(name, args) {
      if (name === 'stageImage') {
        // Fire-and-forget — resolves in background (real or mock)
        stageJob(args.jobId);
      }
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const blobUrl = URL.createObjectURL(file);
        // Store the File object so the staging function can access it later
        fileStore.set(blobUrl, file);
        return { file_url: blobUrl };
      },
    },
  },
};
