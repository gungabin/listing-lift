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

  return `You are a professional virtual home stager. Your ONLY job is to place freestanding furniture and small accessories into the empty floor space of this room photo. Think of it as placing physical objects into the room — nothing else changes.

ABSOLUTE PROHIBITIONS — violating any of these is a critical failure:

WINDOWS & OUTSIDE:
- The view through every window must be preserved with 100% pixel accuracy — same trees, same sky, same buildings, same colors, same lighting outside
- DO NOT add, remove, or change curtains, blinds, shutters, or any window treatments
- DO NOT alter window frames, glass, or anything seen through the glass

WALLS, FLOORS & STRUCTURE:
- DO NOT change wall color, texture, paint, paneling, shiplap, wallpaper, or any wall surface
- DO NOT change flooring material, color, pattern, or texture
- DO NOT alter ceiling, crown molding, baseboards, or any architectural trim
- DO NOT add, remove, or change doors or door frames

FIXED ROOM FEATURES — every item below must remain exactly as it appears in the original photo:
- Every electrical outlet, wall plate, coax plate, ethernet plate, USB plate — preserve the exact type and appearance
- Every light switch and switch plate
- Every HVAC vent, air return, diffuser
- Every smoke detector, carbon monoxide detector, sprinkler head
- Every thermostat, keypad, or wall-mounted device
- Every built-in fixture, recessed light, ceiling fan
- If any of these items would be hidden behind furniture you are placing, you may place the furniture in front — but never alter the item itself

LIGHTING:
- DO NOT change the existing light, shadow, or exposure of the room
- Only add shadows cast by new furniture items you place, consistent with existing light direction

YOU MAY ONLY:
- Place freestanding furniture on the floor (sofas, chairs, tables, beds, rugs, bookshelves)
- Place small accessories on top of furniture you added (lamps, plants, books, vases, bowls)
- Everything you add must match the room's existing perspective, scale, and lighting exactly
- The final result must look like a real photograph with furniture added — not a rendering or illustration

STAGING REQUIREMENTS:
- Room: ${roomDesc}
- Style: ${styleDesc}
- Density: ${levelDesc}`;
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
// Real AI staging — calls OpenAI gpt-image-1
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

  // Decode base64 → blob URL so we can display it
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'image/png' });
  return URL.createObjectURL(blob);
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
