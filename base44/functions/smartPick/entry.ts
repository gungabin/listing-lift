import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address, listingPrice, roomType } = await req.json();

    const prompt = `You are a real estate staging strategist. Based on the following property details, determine the ideal interior design style that would appeal most to the likely buyer demographic for this home.

Property details:
- Address: ${address}
- Listing price: ${listingPrice}
- Room to stage: ${roomType?.replace('_', ' ')}

Consider:
- Price range and neighborhood tier (luxury, mid-range, starter home)
- Geographic region and climate (inferred from address)
- Likely buyer demographic (young professionals, families, retirees, luxury buyers, etc.)
- What design styles have the broadest appeal for this demographic

Respond with a JSON object containing:
- style: one of [modern, farmhouse, coastal, traditional, mid_century, scandinavian, transitional]
- reasoning: a 1-2 sentence explanation of why this style fits the target buyer
- target_demographic: brief description of the likely buyer`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          style: { type: "string" },
          reasoning: { type: "string" },
          target_demographic: { type: "string" }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});