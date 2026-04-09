import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ROOM_PROMPTS = {
  living_room: "living room with sofa, coffee table, accent chairs, area rug, and decorative accessories",
  bedroom: "bedroom with bed frame, nightstands, dresser, lamps, and bedding",
  dining_room: "dining room with dining table, dining chairs, sideboard, and pendant lighting",
  kitchen: "kitchen with bar stools at island or counter, small decorative accessories on countertops",
  office: "home office with desk, office chair, bookshelf, desk lamp, and accessories",
  bathroom: "bathroom with towels, bath mat, vanity accessories, and small decor",
  outdoor: "outdoor patio with outdoor furniture, planters, and outdoor accessories",
  other: "room with appropriate furniture and decor"
};

const STYLE_DESCRIPTORS = {
  modern: "sleek modern style with clean lines, neutral tones, minimal clutter, high-contrast accents, polished surfaces",
  farmhouse: "warm farmhouse style with shiplap textures, natural wood tones, linen fabrics, vintage accents, cozy rustic warmth",
  coastal: "coastal style with light blues, whites, natural textures, woven accents, breezy and relaxed atmosphere",
  traditional: "classic traditional style with rich wood tones, symmetrical arrangements, formal elegance, warm deep colors",
  mid_century: "mid-century modern style with tapered legs, warm wood tones, earthy palette, retro geometric patterns",
  scandinavian: "Scandinavian style with white walls, light wood, minimal clean design, cozy hygge textures",
  transitional: "transitional style blending traditional and modern, neutral palette, sophisticated and timeless"
};

const LEVEL_DESCRIPTORS = {
  light: "Add only a few key accent pieces — one or two small furniture items, minimal accessories. Keep it sparse and open.",
  medium: "Add the main furniture pieces for this room type and a moderate amount of accessories. Balanced and livable.",
  full: "Fully stage the room with complete furniture arrangement, layered textiles, art, plants, and rich accessories. Lush and complete."
};

async function fetchImageAsBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

Deno.serve(async (req) => {
  let jobId = null;
  let base44 = null;

  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    jobId = body.jobId;

    // Get the job
    const job = await base44.asServiceRole.entities.StagingJob.get(jobId);
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    if (job.user_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Check subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email, status: 'active' });
    const sub = subs[0];
    if (!sub) return Response.json({ error: 'No active subscription' }, { status: 402 });
    if (sub.generations_used >= sub.generations_limit) return Response.json({ error: 'Generation limit reached' }, { status: 402 });

    // Mark as processing
    await base44.asServiceRole.entities.StagingJob.update(jobId, { status: 'processing' });

    const roomDesc = ROOM_PROMPTS[job.room_type] || ROOM_PROMPTS.other;
    const styleDesc = job.decor_style === 'smart_pick'
      ? (job.smart_pick_reasoning || STYLE_DESCRIPTORS.transitional)
      : STYLE_DESCRIPTORS[job.decor_style];
    const levelDesc = LEVEL_DESCRIPTORS[job.decor_level];

    const prompt = `You are a professional virtual home stager. Your ONLY job is to place freestanding furniture and small accessories into the empty floor space of this room photo. Think of it as placing physical objects into the room — nothing else changes.

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

    // Fetch the original image bytes
    const imageBytes = await fetchImageAsBuffer(job.original_image_url);
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });
    const imageFile = new File([imageBlob], 'room.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('image', imageFile);
    formData.append('quality', 'high');
    formData.append('size', '1536x1024');

    const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: formData
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      const errMsg = openaiData.error?.message || 'OpenAI API error';
      await base44.asServiceRole.entities.StagingJob.update(jobId, {
        status: 'failed',
        error_message: errMsg
      });
      return Response.json({ error: errMsg }, { status: 500 });
    }

    // gpt-image-1 always returns b64_json
    const b64 = openaiData.data[0].b64_json;
    if (!b64) {
      const errMsg = 'No image data returned from OpenAI';
      await base44.asServiceRole.entities.StagingJob.update(jobId, { status: 'failed', error_message: errMsg });
      return Response.json({ error: errMsg }, { status: 500 });
    }

    // Decode base64 and upload
    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/png' });
    const file = new File([blob], 'staged.png', { type: 'image/png' });
    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const stagedImageUrl = uploadRes.file_url;

    // Update job as completed
    await base44.asServiceRole.entities.StagingJob.update(jobId, {
      status: 'completed',
      staged_image_url: stagedImageUrl
    });

    // Increment usage
    await base44.asServiceRole.entities.Subscription.update(sub.id, {
      generations_used: (sub.generations_used || 0) + 1
    });

    return Response.json({ success: true, staged_image_url: stagedImageUrl });

  } catch (error) {
    // Always mark job as failed so it doesn't get stuck in processing
    if (jobId && base44) {
      try {
        await base44.asServiceRole.entities.StagingJob.update(jobId, {
          status: 'failed',
          error_message: error.message
        });
      } catch (_) {}
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});