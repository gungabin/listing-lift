import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const PLAN_LIMITS = { starter: 100, agent: 300, pro: 750 };

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_email, plan, generations_limit } = session.metadata;

    const existing = await base44.asServiceRole.entities.Subscription.filter({ user_email, status: 'active' });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(existing[0].id, {
        plan,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        generations_limit: parseInt(generations_limit),
        generations_used: 0,
        status: 'active',
        period_start: new Date().toISOString().split('T')[0]
      });
    } else {
      await base44.asServiceRole.entities.Subscription.create({
        user_email,
        plan,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        generations_limit: parseInt(generations_limit),
        generations_used: 0,
        status: 'active',
        period_start: new Date().toISOString().split('T')[0]
      });
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: customerId });
    if (subs.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
        generations_used: 0,
        status: 'active',
        period_start: new Date().toISOString().split('T')[0]
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: sub.id });
    if (subs.length > 0) {
      await base44.asServiceRole.entities.Subscription.update(subs[0].id, { status: 'cancelled' });
    }
  }

  return Response.json({ received: true });
});