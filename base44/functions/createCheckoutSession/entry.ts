import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PLAN_PRICE_IDS = {
  starter: Deno.env.get('STRIPE_STARTER_PRICE_ID'),
  agent: Deno.env.get('STRIPE_AGENT_PRICE_ID'),
  pro: Deno.env.get('STRIPE_PRO_PRICE_ID')
};

const PLAN_LIMITS = { starter: 100, agent: 300, pro: 750 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan, successUrl, cancelUrl } = await req.json();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: { user_email: user.email, plan, generations_limit: PLAN_LIMITS[plan] },
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});