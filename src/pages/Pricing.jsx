import { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    generations: 100,
    description: 'Perfect for occasional listings',
    perImage: '$0.49',
    features: [
      '100 staged images/month',
      'All 7 decor styles',
      'Light / Medium / Full density',
      'Batch upload up to 20 photos',
      'Instant download',
      'Email support',
    ],
    highlight: false,
  },
  {
    id: 'agent',
    name: 'Agent',
    price: 99,
    generations: 300,
    description: 'For active listing agents',
    perImage: '$0.33',
    features: [
      '300 staged images/month',
      'All 7 decor styles',
      'Light / Medium / Full density',
      'Smart Pick AI styling',
      'Batch upload up to 50 photos',
      'Instant download',
      'Priority support',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    generations: 750,
    description: 'For teams and top producers',
    perImage: '$0.20',
    features: [
      '750 staged images/month',
      'All 7 decor styles',
      'Light / Medium / Full density',
      'Smart Pick AI styling',
      'Unlimited batch uploads',
      'Instant download',
      'Dedicated support',
    ],
    highlight: false,
  },
];

const PLAN_LIMITS = { starter: 100, agent: 300, pro: 750 };

export default function Pricing() {
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();

  const handleSubscribe = async (planId) => {
    setLoading(planId);

    // Mock: create a subscription record so the dashboard works locally.
    // TO GO LIVE: Replace this with a real Stripe Checkout session:
    //   const session = await base44.functions.invoke('createCheckoutSession', { planId });
    //   window.location.href = session.url;
    const user = await base44.auth.me();
    if (user) {
      await base44.entities.Subscription.create({
        user_email: user.email,
        plan: planId,
        status: 'active',
        generations_used: 0,
        generations_limit: PLAN_LIMITS[planId],
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    navigate('/dashboard?subscribed=true');
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-serif">
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#8B6F5C]" />
          <span className="text-xl tracking-widest uppercase text-[#2C2C2C] font-light">Listing Lift</span>
        </Link>
        <Link to="/dashboard">
          <Button variant="ghost" className="text-[#2C2C2C] font-light tracking-wide font-sans">
            Dashboard
          </Button>
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-8 pt-12 pb-24">
        <p className="text-[#8B6F5C] tracking-widest uppercase text-sm mb-2 text-center font-sans">Plans & Pricing</p>
        <h1 className="text-4xl text-[#2C2C2C] font-light text-center mb-3">Choose your plan</h1>
        <p className="text-[#6B6B6B] text-center font-sans mb-4 max-w-lg mx-auto">
          Traditional virtual staging costs $35+ per photo. One good month with Listing Lift pays for itself in the first listing.
        </p>
        <div className="flex justify-center mb-16">
          <div className="bg-[#F0EDE8] px-6 py-2 text-xs font-sans text-[#8B6F5C] uppercase tracking-widest">
            Cancel anytime · No contracts
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 ${plan.highlight ? 'bg-[#2C2C2C] text-white ring-2 ring-[#8B6F5C]' : 'bg-white border border-[#E0D9D3]'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8B6F5C] text-white text-xs px-4 py-1 uppercase tracking-widest font-sans whitespace-nowrap">
                  Best Value
                </div>
              )}
              <p className={`text-xs uppercase tracking-widest font-sans mb-2 ${plan.highlight ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`}>
                {plan.name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-light ${plan.highlight ? 'text-white' : 'text-[#2C2C2C]'}`}>${plan.price}</span>
                <span className={`text-sm mb-1 font-sans ${plan.highlight ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`}>/month</span>
              </div>
              <p className={`text-sm font-sans mb-1 ${plan.highlight ? 'text-[#999]' : 'text-[#6B6B6B]'}`}>
                {plan.generations} generations
              </p>
              <p className={`text-xs font-sans mb-6 ${plan.highlight ? 'text-[#A89080]' : 'text-[#A89080]'}`}>
                {plan.perImage}/image · vs $35+ traditional
              </p>

              <Button
                className={`w-full rounded-none uppercase tracking-widest text-xs font-sans py-5 ${
                  plan.highlight
                    ? 'bg-white text-[#2C2C2C] hover:bg-[#F0EDE8]'
                    : 'bg-[#2C2C2C] text-white hover:bg-[#444]'
                }`}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? 'Setting up...' : 'Get Started'}
              </Button>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`} />
                    <span className={`text-sm font-sans ${plan.highlight ? 'text-[#CCC]' : 'text-[#6B6B6B]'}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[#6B6B6B] font-sans text-sm">
            Questions?{' '}
            <a href="mailto:hello@listinglift.com" className="text-[#8B6F5C] underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
