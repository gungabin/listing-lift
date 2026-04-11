/**
 * /api/depth.js — Vercel serverless function
 *
 * Accepts a room photo as a base64 data URI, runs it through
 * Depth Anything v2 on Replicate, and returns the depth map as base64.
 *
 * POST /api/depth
 * Body: { image: "data:image/png;base64,..." }
 * Response: { depthMap: "data:image/png;base64,..." }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Missing image in request body' });
  }

  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'REPLICATE_API_KEY not configured' });
  }

  try {
    // Create prediction on Replicate
    const createRes = await fetch('https://api.replicate.com/v1/models/depth-anything/depth-anything-v2-large/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=30',
      },
      body: JSON.stringify({
        input: {
          image,
          grayscale: true,    // return grayscale depth map
        },
      }),
    });

    let prediction = await createRes.json();

    if (!createRes.ok) {
      throw new Error(prediction.detail || `Replicate error ${createRes.status}`);
    }

    // If sync response completed, return immediately
    if (prediction.status === 'succeeded' && prediction.output) {
      const depthMap = await fetchAsBase64(prediction.output);
      return res.status(200).json({ depthMap });
    }

    // Poll until complete (max 60 seconds)
    const predId = prediction.id;
    for (let i = 0; i < 30; i++) {
      await sleep(2000);

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      prediction = await pollRes.json();

      if (prediction.status === 'succeeded' && prediction.output) {
        const depthMap = await fetchAsBase64(prediction.output);
        return res.status(200).json({ depthMap });
      }

      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        throw new Error(`Depth prediction ${prediction.status}: ${prediction.error || 'unknown'}`);
      }
    }

    throw new Error('Depth prediction timed out after 60 seconds');

  } catch (err) {
    console.error('[api/depth]', err);
    return res.status(500).json({ error: err.message });
  }
}

async function fetchAsBase64(url) {
  const res  = await fetch(url);
  const buf  = await res.arrayBuffer();
  const b64  = Buffer.from(buf).toString('base64');
  const mime = res.headers.get('content-type') || 'image/png';
  return `data:${mime};base64,${b64}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
