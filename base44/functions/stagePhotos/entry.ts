import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import OpenAI from 'npm:openai';

let openai = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

const STYLE_DESCRIPTIONS = {
  modern: "modern contemporary style with clean lines, neutral palette (whites, grays, warm taupes), sleek furniture with minimal ornamentation",
  farmhouse: "warm farmhouse style with natural wood tones, cozy textiles, shiplap accents, rustic yet refined furniture",
  coastal: "coastal style with soft blues, whites, natural fiber rugs and textures, light airy furniture with a relaxed beach-house feel",
  traditional: "classic traditional style with rich warm tones, formal furniture silhouettes, Persian-style rugs, timeless elegance",
  mid_century: "mid-century modern style with organic shapes, teak and walnut wood tones, bold accent colors, retro-inspired yet timeless",
  scandinavian: "Scandinavian minimalist style with light woods, white walls, cozy hygge textures, simple functional furniture",
};

const LEVEL_DESCRIPTIONS = {
  light: "Add only a few carefully chosen accent pieces: one area rug, minimal wall art, and a few small decorative items. Keep it very sparse.",
  medium: "Add core furniture (sofa/bed/dining set as appropriate for the room) plus complementary accent pieces, a rug, and tasteful decor.",
  full: "Fully stage the room with all primary furniture, layered rugs, window treatments, wall art, plants, books, lamps, and decorative accessories.",
};

const ROOM_CONTEXT = {
  living_room: "living room",
  bedroom: "bedroom",
  dining_room: "dining room",
  kitchen: "kitchen",
  office: "home office",
  bathroom: "bathroom",
  other: "room",
};

async function getSmartPickStyle(address, price, region) {
  const prompt = `You are a real estate interior design expert. Based on the following property details, choose the single most appealing decor style for the likely buyer demographic. Return ONLY the style ID, nothing else.

Property: ${address}
Price: $${price?.toLocaleString() || 'unknown'}
Region: ${region || 'unknown'}

Available styles: modern, farmhouse, coastal, traditional, mid_century, scandinavian

Choose the style that would most appeal to buyers of this home. Consider: price point, region culture, typical buyer age/lifestyle. Return only the lowercase style ID.`;

  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 20,
  });

  const style = res.choices[0].message.content.trim().toLowerCase().replace(/[^a-z_]/g, '');
  return STYLE_DESCRIPTIONS[style] ? style : 'modern';
}

async function stagePhoto(photo, styleDesc, levelDesc, roomType) {
  const prompt = `You are a professional virtual staging assistant for real estate photography.

TASK: Add photorealistic furniture and decor to this empty/unfurnished ${ROOM_CONTEXT[roomType] || 'room'} photograph.

STYLE: ${styleDesc}

FURNISHING INSTRUCTION: ${levelDesc}

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. DO NOT change, alter, modify, recolor, or enhance ANY existing element: walls, floors, ceiling, windows, doors, light fixtures, built-in shelving, baseboards, crown molding, window frames, paint colors, flooring material, tile, or any structural/architectural feature.
2. ALL added furniture must cast realistic shadows that match the existing natural light and shadow direction already present in the photograph.
3. The final image must be PHOTOREALISTIC — indistinguishable from a real photograph. No CGI appearance, no illustrated look, no oversaturation, no artificial rendering.
4. Maintain the EXACT same camera angle, perspective, focal length, and depth of field as the original photograph.
5. Only place furniture in areas that are clearly empty floor space. Do not float furniture or place it unnaturally.
6. All furniture proportions must be realistic and to scale with the room.

The output must look like a real photograph of a professionally staged room, not a digital rendering.`;

  const response = await getOpenAI().images.edit({
    model: "gpt-image-1",
    image: await fetch(photo.original_url).then(r => r.blob()).then(b => new File([b], 'photo.jpg', { type: 'image/jpeg' })),
    prompt: prompt,
    size: "1536x1024",
    quality: "high",
  });

  return response.data[0].url || response.data[0].b64_json;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { job_id } = await req.json();

  // Load the job
  const jobs = await base44.entities.StagingJob.filter({ id: job_id });
  if (!jobs?.length) return Response.json({ error: 'Job not found' }, { status: 404 });

  const job = jobs[0];

  // Resolve smart pick style
  let resolvedStyle = job.decor_style;
  let smartPickStyle = null;

  if (job.decor_style === 'smart_pick') {
    resolvedStyle = await getSmartPickStyle(job.property_address, job.property_price, job.property_region);
    smartPickStyle = resolvedStyle;
  }

  const styleDesc = STYLE_DESCRIPTIONS[resolvedStyle] || STYLE_DESCRIPTIONS.modern;
  const levelDesc = LEVEL_DESCRIPTIONS[job.furnishing_level] || LEVEL_DESCRIPTIONS.medium;

  // Mark job as processing
  await base44.entities.StagingJob.update(job_id, {
    status: 'processing',
    smart_pick_style: smartPickStyle,
  });

  // Process photos sequentially to avoid rate limits
  const updatedPhotos = [...(job.photos || [])];
  let completedCount = 0;

  for (let i = 0; i < updatedPhotos.length; i++) {
    const photo = updatedPhotos[i];

    // Mark as processing
    updatedPhotos[i] = { ...photo, status: 'processing' };
    await base44.entities.StagingJob.update(job_id, { photos: updatedPhotos });

    try {
      const stagedUrl = await stagePhoto(photo, styleDesc, levelDesc, photo.room_type);

      // If it's a base64, upload it
      let finalUrl = stagedUrl;
      if (!stagedUrl.startsWith('http')) {
        const byteChars = atob(stagedUrl);
        const byteArr = new Uint8Array(byteChars.length);
        for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
        const blob = new Blob([byteArr], { type: 'image/png' });
        const file = new File([blob], 'staged.png', { type: 'image/png' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        finalUrl = file_url;
      }

      updatedPhotos[i] = { ...updatedPhotos[i], staged_url: finalUrl, status: 'completed' };
      completedCount++;
    } catch (err) {
      updatedPhotos[i] = { ...updatedPhotos[i], status: 'failed', error: err.message };
    }

    await base44.entities.StagingJob.update(job_id, {
      photos: updatedPhotos,
      completed_photos: completedCount,
    });
  }

  // Mark job complete and update user generation count
  const allFailed = updatedPhotos.every(p => p.status === 'failed');
  await base44.entities.StagingJob.update(job_id, {
    status: allFailed ? 'failed' : 'completed',
    completed_photos: completedCount,
  });

  // Increment user generation count
  const currentUsed = user.generations_used || 0;
  await base44.asServiceRole.entities.User.update(user.id, {
    generations_used: currentUsed + completedCount,
  });

  return Response.json({ success: true, completed: completedCount, total: updatedPhotos.length });
});