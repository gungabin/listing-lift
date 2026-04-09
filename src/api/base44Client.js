/**
 * Mock Base44 Client
 *
 * Drop-in replacement for the real Base44 SDK. All pages import `base44` from here —
 * this mock keeps them working 100% locally with no backend connection.
 *
 * Persistence: jobs + subscription stored in localStorage.
 * Images: original photos are blob URLs (lost on page refresh — expected for local dev).
 * Staging: resolves with real staged room photos after a simulated delay.
 *
 * TO GO LIVE: Replace the internals of this file with real API calls.
 * The interface (base44.auth, base44.entities, base44.functions, base44.integrations)
 * stays the same — pages don't need to change.
 */

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const JOBS_KEY = 'll_jobs';
const SUB_KEY = 'll_subscription';

// ---------------------------------------------------------------------------
// Mock user — swap for real auth when going live
// ---------------------------------------------------------------------------
const MOCK_USER = {
  id: 'mock_user_1',
  email: 'agent@listinglift.com',
  full_name: 'Demo Agent',
};

// ---------------------------------------------------------------------------
// Mock subscription — edit generations_used here to test different states
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
// Staged result image pools — realistic room photos by room type
// Used as mock AI output when a staging job completes
// ---------------------------------------------------------------------------
const STAGED_IMAGES = {
  living_room: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=85',
    'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=900&q=85',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=900&q=85',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&q=85',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=900&q=85',
  ],
  bedroom: [
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=85',
    'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=900&q=85',
    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900&q=85',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=85',
  ],
  dining_room: [
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=900&q=85',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&q=85',
    'https://images.unsplash.com/photo-1550226891-ef816aed4a98?w=900&q=85',
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=85',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=85',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85',
  ],
  office: [
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=85',
    'https://images.unsplash.com/photo-1619468129361-605ebea04b44?w=900&q=85',
    'https://images.unsplash.com/photo-1524758860510-e9b5f8fcd9c2?w=900&q=85',
  ],
  bathroom: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=85',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=900&q=85',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=85',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=85',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=85',
  ],
  other: [
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=900&q=85',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&q=85',
  ],
};

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getJobs() {
  try {
    return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveJob(job) {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.unshift(job);
  }
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function getSubscription() {
  try {
    const stored = localStorage.getItem(SUB_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SUBSCRIPTION;
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}

function saveSubscription(sub) {
  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
}

// ---------------------------------------------------------------------------
// Mock staging simulation
// Simulates the AI processing delay, then marks the job as completed
// with a realistic staged room image.
// ---------------------------------------------------------------------------
function simulateStaging(jobId) {
  // 8–15 second delay to mimic real AI processing
  const delay = 8000 + Math.random() * 7000;

  setTimeout(() => {
    const jobs = getJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const pool = STAGED_IMAGES[job.room_type] || STAGED_IMAGES.other;
    const staged_image_url = pool[Math.floor(Math.random() * pool.length)];

    job.status = 'completed';
    job.staged_image_url = staged_image_url;
    job.completed_date = new Date().toISOString();
    saveJob(job);

    // Increment usage counter
    const sub = getSubscription();
    sub.generations_used = Math.min(
      (sub.generations_used || 0) + 1,
      sub.generations_limit
    );
    saveSubscription(sub);
  }, delay);
}

// ---------------------------------------------------------------------------
// The mock client — same interface as the Base44 SDK
// ---------------------------------------------------------------------------
export const base44 = {
  auth: {
    async me() {
      return MOCK_USER;
    },
    logout(redirect) {
      window.location.href = redirect || '/';
    },
    redirectToLogin(redirect) {
      window.location.href = redirect || '/';
    },
  },

  entities: {
    Subscription: {
      async filter(query) {
        const sub = getSubscription();
        // Return active subscription if that's what's asked for
        if (query?.status === 'active') return [sub];
        return [sub];
      },
      async create(data) {
        const sub = { ...DEFAULT_SUBSCRIPTION, ...data, id: generateId() };
        saveSubscription(sub);
        return sub;
      },
      async update(id, data) {
        const sub = getSubscription();
        const updated = { ...sub, ...data };
        saveSubscription(updated);
        return updated;
      },
    },

    StagingJob: {
      async filter(query, sort, limit) {
        let jobs = getJobs();
        if (query?.user_email) {
          jobs = jobs.filter((j) => j.user_email === query.user_email);
        }
        if (query?.id) {
          jobs = jobs.filter((j) => j.id === query.id);
        }
        return jobs.slice(0, limit || 100);
      },
      async create(data) {
        const job = {
          id: generateId(),
          created_date: new Date().toISOString(),
          ...data,
        };
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
        // Fire-and-forget: resolves in background after delay
        simulateStaging(args.jobId);
      }
      // Other functions (smartPick, createCheckoutSession, etc.) are no-ops in mock
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        // Blob URLs work for the session — images won't persist after refresh.
        // Replace with real file upload (S3, Cloudinary, etc.) when going live.
        return { file_url: URL.createObjectURL(file) };
      },
    },
  },
};
