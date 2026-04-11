import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppNav from '@/components/layout/AppNav';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight, CreditCard, Key, Check } from 'lucide-react';

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: 49, limit: 100 },
  agent: { name: 'Agent', price: 99, limit: 300 },
  pro: { name: 'Pro', price: 149, limit: 750 }
};

export default function Account() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replicateKey, setReplicateKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  // Load saved key on mount
  useEffect(() => {
    const saved = localStorage.getItem('ll_replicate_key');
    if (saved) setReplicateKey(saved);
  }, []);

  const saveReplicateKey = () => {
    const trimmed = replicateKey.trim();
    if (!trimmed) return;
    localStorage.setItem('ll_replicate_key', trimmed);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const clearReplicateKey = () => {
    localStorage.removeItem('ll_replicate_key');
    setReplicateKey('');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u) {
      const subs = await base44.entities.Subscription.filter({ user_email: u.email, status: 'active' });
      setSubscription(subs[0] || null);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#8B6F5C]" />
    </div>
  );

  const plan = subscription ? PLAN_DETAILS[subscription.plan] : null;
  const usedPct = subscription ? Math.min((subscription.generations_used / subscription.generations_limit) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <AppNav user={user} subscription={subscription} />
      <main className="md:ml-56 pt-20 md:pt-0 p-6 lg:p-10 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light text-[#2C2C2C]">Account</h1>
        </div>

        {/* Profile */}
        <div className="bg-white border border-[#E0D9D3] p-6 mb-4">
          <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-4">Profile</p>
          <p className="text-sm font-sans text-[#2C2C2C]">{user?.full_name}</p>
          <p className="text-sm font-sans text-[#6B6B6B]">{user?.email}</p>
        </div>

        {/* Subscription */}
        <div className="bg-white border border-[#E0D9D3] p-6 mb-4">
          <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-4">Subscription</p>
          {subscription && plan ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-serif text-[#2C2C2C]">{plan.name} Plan</p>
                  <p className="text-sm font-sans text-[#6B6B6B]">${plan.price}/month · {plan.limit} generations</p>
                </div>
                <span className="bg-[#2C2C2C] text-white text-xs px-3 py-1 uppercase tracking-widest font-sans">Active</span>
              </div>

              {/* Usage */}
              <div className="mb-4">
                <div className="flex justify-between text-xs font-sans text-[#8B6F5C] mb-1">
                  <span>Generations used this month</span>
                  <span>{subscription.generations_used} / {subscription.generations_limit}</span>
                </div>
                <div className="h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usedPct > 85 ? 'bg-red-400' : 'bg-[#8B6F5C]'}`}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
                {usedPct > 85 && (
                  <p className="text-xs font-sans text-red-400 mt-1">Running low — consider upgrading</p>
                )}
              </div>

              <div className="flex gap-3">
                <Link to="/pricing">
                  <Button variant="outline" className="rounded-none border-[#D4C9BE] font-sans text-xs uppercase tracking-widest">
                    Change Plan
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm font-sans text-[#6B6B6B] mb-4">You don't have an active subscription.</p>
              <Link to="/pricing">
                <Button className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none uppercase tracking-widest text-xs font-sans px-6 py-4">
                  View Plans <ArrowRight className="ml-2 w-3 h-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* AI Engine Key */}
        <div className="bg-white border border-[#E0D9D3] p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-[#8B6F5C]" />
            <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C]">AI Engine</p>
          </div>
          <p className="text-xs font-sans text-[#6B6B6B] mb-4">
            Paste your Replicate API key to enable real AI staging. Keys are stored locally in your browser only.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={replicateKey}
              onChange={(e) => { setReplicateKey(e.target.value); setKeySaved(false); }}
              placeholder="r8_••••••••••••••••••••••••••••••••"
              className="flex-1 border border-[#E0D9D3] bg-[#FAF8F5] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#2C2C2C] text-[#2C2C2C]"
            />
            <button
              onClick={saveReplicateKey}
              disabled={!replicateKey.trim()}
              className="bg-[#2C2C2C] text-white text-xs tracking-widest uppercase px-5 py-2.5 hover:bg-[#444] disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {keySaved ? <><Check className="w-3 h-3" /> Saved</> : 'Save'}
            </button>
          </div>
          {localStorage.getItem('ll_replicate_key') && !keySaved && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-green-600 font-sans">✓ Key active — AI staging enabled</p>
              <button onClick={clearReplicateKey} className="text-xs text-[#8B6F5C] underline font-sans hover:text-red-400">Remove</button>
            </div>
          )}
        </div>

        {/* Billing note */}
        <div className="bg-[#F5F0EB] border border-[#E0D9D3] p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-[#8B6F5C] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-sans text-[#6B6B6B]">Billing is handled securely through Stripe. To update your payment method or cancel, contact us at <a href="mailto:hello@listinglift.com" className="text-[#8B6F5C] underline">hello@listinglift.com</a></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}