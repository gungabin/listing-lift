import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Upload, Zap, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BeforeAfter from '@/components/landing/BeforeAfter';

const PLANS = [
  {
    name: 'Starter',
    price: 49,
    generations: 100,
    perImage: '$0.49',
    description: 'Perfect for occasional listings',
    features: ['100 staged images/month', 'All 7 decor styles', 'Batch upload', 'Instant download', 'Email support'],
    highlight: false,
  },
  {
    name: 'Agent',
    price: 99,
    generations: 300,
    perImage: '$0.33',
    description: 'Most popular for active agents',
    features: ['300 staged images/month', 'All 7 decor styles', 'Smart Pick AI', 'Batch upload', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Pro',
    price: 149,
    generations: 750,
    perImage: '$0.20',
    description: 'For high-volume teams',
    features: ['750 staged images/month', 'All 7 decor styles', 'Smart Pick AI', 'Unlimited batch uploads', 'Dedicated support'],
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "I used to spend $200–$400 per listing on virtual staging. Listing Lift paid for itself on my first property. The turnaround time alone is worth it.",
    name: 'Sarah M.',
    title: 'Realtor, Compass — Austin, TX',
    avatar: 'SM',
  },
  {
    quote: "The Modern and Scandinavian styles photograph incredibly well online. My listings are getting more saves on Zillow and clicking through at a higher rate.",
    name: 'James R.',
    title: 'Broker, RE/MAX — Denver, CO',
    avatar: 'JR',
  },
  {
    quote: "I stage every single listing now, even the ones that wouldn't have justified the cost before. It's changed how I present vacant properties entirely.",
    name: 'Priya K.',
    title: 'Listing Agent, Coldwell Banker — Seattle, WA',
    avatar: 'PK',
  },
];

const FAQS = [
  {
    q: 'How realistic do the staged images look?',
    a: 'Listing Lift uses state-of-the-art AI image generation trained specifically on interior design and real estate photography. The output is photorealistic — furniture, lighting, and shadows are rendered to match the room\'s natural light and architecture.',
  },
  {
    q: 'Will the walls, floors, and fixtures be changed?',
    a: 'No. The AI only adds furniture and decor. Your walls, flooring, windows, built-ins, and all structural elements stay exactly as they appear in the original photo. This is what makes it safe to use in real estate listings.',
  },
  {
    q: 'What room types can I stage?',
    a: 'Living rooms, bedrooms, dining rooms, kitchens, home offices, bathrooms, and outdoor/patio spaces. If you have a room type not listed, use "Other" and the AI will stage it based on the context of the image.',
  },
  {
    q: 'Can I stage a room that already has furniture in it?',
    a: 'Yes — that\'s what the Re-Stage mode is for. The AI removes the existing furniture and replaces it with clean, buyer-ready pieces in your chosen style. No manual masking required.',
  },
  {
    q: 'How long does staging take?',
    a: 'Each image typically takes 2–4 minutes to process. You can upload and queue multiple photos at once, and they\'ll process in parallel. You\'ll see the results update in real time on your dashboard.',
  },
  {
    q: 'Can I use the staged images in my MLS listing?',
    a: 'Yes, with disclosure. Most MLS boards require that virtually staged images be labeled as such. We recommend adding a disclosure like "Virtually Staged" in your listing description. Check your local MLS rules for specifics.',
  },
  {
    q: 'What happens when I hit my monthly generation limit?',
    a: 'You\'ll see a warning on your dashboard as you approach the limit. If you hit it, you can upgrade your plan at any time — the additional generations are available immediately after upgrading.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no commitments. You can cancel or change your plan at any time from your Account page. Your access continues through the end of your current billing period.',
  },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-24 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-8">
        <p className="text-[#8B6F5C] tracking-widest uppercase text-sm mb-2 text-center font-sans">FAQ</p>
        <h2 className="text-3xl text-[#2C2C2C] font-light text-center mb-14">Questions we hear often</h2>
        <div className="space-y-0">
          {FAQS.map((item, i) => (
            <div key={i} className="border-t border-[#E0D9D3] last:border-b">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left gap-4"
              >
                <span className="font-serif text-[#2C2C2C] text-base font-light">{item.q}</span>
                {open === i
                  ? <ChevronUp className="w-4 h-4 text-[#8B6F5C] flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-[#8B6F5C] flex-shrink-0" />}
              </button>
              {open === i && (
                <p className="font-sans text-[#6B6B6B] text-sm leading-relaxed pb-5">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] font-serif">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#8B6F5C]" />
          <span className="text-xl tracking-widest uppercase text-[#2C2C2C] font-light">Listing Lift</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-[#2C2C2C] font-light tracking-wide font-sans">Sign In</Button>
          </Link>
          <Link to="/pricing">
            <Button className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none px-6 py-2 text-sm tracking-widest uppercase font-sans font-light">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[#8B6F5C] tracking-widest uppercase text-sm mb-4 font-sans">AI Virtual Staging</p>
          <h1 className="text-5xl lg:text-6xl text-[#2C2C2C] font-light leading-tight mb-6">
            Stage Every<br />
            <em className="italic">Listing</em> in<br />
            Minutes.
          </h1>
          <p className="text-[#6B6B6B] text-lg leading-relaxed mb-8 font-sans font-light max-w-md">
            Upload empty rooms, choose your style, download photorealistic staged photos instantly — at a fraction of traditional staging costs.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/pricing">
              <Button className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none px-8 py-6 text-sm tracking-widest uppercase font-sans font-light">
                Start Staging <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <p className="text-[#8B6F5C] text-sm font-sans">From $49/month</p>
          </div>
          <div className="flex items-center gap-6 mt-10 flex-wrap">
            <div className="text-center">
              <p className="text-2xl text-[#2C2C2C] font-light">$35+</p>
              <p className="text-xs text-[#8B6F5C] font-sans uppercase tracking-wide">saved per photo</p>
            </div>
            <div className="w-px h-10 bg-[#E0D9D3]" />
            <div className="text-center">
              <p className="text-2xl text-[#2C2C2C] font-light">2–4 min</p>
              <p className="text-xs text-[#8B6F5C] font-sans uppercase tracking-wide">per room</p>
            </div>
            <div className="w-px h-10 bg-[#E0D9D3]" />
            <div className="text-center">
              <p className="text-2xl text-[#2C2C2C] font-light">7</p>
              <p className="text-xs text-[#8B6F5C] font-sans uppercase tracking-wide">design styles</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] bg-[#E8E0D8] rounded-sm overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=85"
              alt="AI staged living room"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-sm">
              <p className="text-xs text-[#8B6F5C] font-sans uppercase tracking-widest">AI Staged · Modern Style</p>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#E8E0D8] rounded-sm -z-10" />
        </div>
      </section>

      {/* Before & After */}
      <BeforeAfter />

      {/* How it works */}
      <section className="bg-[#2C2C2C] py-20">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-[#A89080] tracking-widest uppercase text-sm mb-2 text-center font-sans">The Process</p>
          <h2 className="text-3xl text-white font-light text-center mb-16">Three steps to stunning listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Upload,
                step: '01',
                title: 'Upload Your Photos',
                desc: 'Drag and drop all your listing photos at once. Assign room types in bulk.',
              },
              {
                icon: Zap,
                step: '02',
                title: 'Choose Your Style',
                desc: 'Pick a decor style and furnishing density, or let Smart Pick AI recommend based on the property.',
              },
              {
                icon: Sparkles,
                step: '03',
                title: 'Download & List',
                desc: 'Receive photorealistic staged images in minutes. Download instantly — no waiting, no back-and-forth.',
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <p className="text-[#8B6F5C] text-6xl font-light mb-4">{step}</p>
                <Icon className="w-6 h-6 text-white mx-auto mb-3" />
                <h3 className="text-white text-lg font-light mb-2">{title}</h3>
                <p className="text-[#999] text-sm font-sans leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-[#8B6F5C] tracking-widest uppercase text-sm mb-2 text-center font-sans">From the Field</p>
          <h2 className="text-3xl text-[#2C2C2C] font-light text-center mb-16">
            Agents who've made the switch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#FAF8F5] border border-[#E0D9D3] p-8 flex flex-col">
                {/* Quote mark */}
                <span className="text-4xl text-[#D4C9BE] font-serif leading-none mb-4">&ldquo;</span>
                <p className="text-[#2C2C2C] font-sans text-sm leading-relaxed flex-1 mb-6">{t.quote}</p>
                <div className="flex items-center gap-3 border-t border-[#E0D9D3] pt-5">
                  <div className="w-9 h-9 rounded-full bg-[#E0D9D3] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-sans text-[#8B6F5C] font-medium">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-serif text-[#2C2C2C]">{t.name}</p>
                    <p className="text-xs font-sans text-[#8B6F5C]">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 max-w-7xl mx-auto px-8" id="pricing">
        <p className="text-[#8B6F5C] tracking-widest uppercase text-sm mb-2 text-center font-sans">Pricing</p>
        <h2 className="text-3xl text-[#2C2C2C] font-light text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-[#6B6B6B] text-center font-sans mb-16 max-w-md mx-auto">
          Traditional staging costs $35+ per photo. With Listing Lift, stage an entire home for less than the cost of one traditional image.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 ${plan.highlight ? 'bg-[#2C2C2C] text-white' : 'bg-white border border-[#E0D9D3]'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8B6F5C] text-white text-xs px-4 py-1 uppercase tracking-widest font-sans whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <p className={`text-xs uppercase tracking-widest font-sans mb-2 ${plan.highlight ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`}>
                {plan.name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-light ${plan.highlight ? 'text-white' : 'text-[#2C2C2C]'}`}>${plan.price}</span>
                <span className={`text-sm mb-1 font-sans ${plan.highlight ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`}>/month</span>
              </div>
              <p className={`text-xs font-sans mb-6 ${plan.highlight ? 'text-[#A89080]' : 'text-[#A89080]'}`}>
                {plan.perImage}/image · {plan.generations} generations
              </p>
              <Link to="/pricing">
                <Button
                  className={`w-full rounded-none uppercase tracking-widest text-xs font-sans py-5 ${
                    plan.highlight
                      ? 'bg-white text-[#2C2C2C] hover:bg-[#F0EDE8]'
                      : 'bg-[#2C2C2C] text-white hover:bg-[#444]'
                  }`}
                >
                  Get Started
                </Button>
              </Link>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.highlight ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`} />
                    <span className={`text-sm font-sans ${plan.highlight ? 'text-[#CCC]' : 'text-[#6B6B6B]'}`}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <Link to="/pricing">
            <Button variant="ghost" className="text-[#8B6F5C] font-sans text-sm tracking-wide">
              See full plan details <ArrowRight className="ml-1 w-3 h-3" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA banner */}
      <section className="bg-[#2C2C2C] py-20 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl text-white font-light mb-4">
            Ready to stage your first listing?
          </h2>
          <p className="text-[#999] font-sans text-sm mb-8">
            Join agents who've replaced expensive traditional staging with Listing Lift. Start in 2 minutes, cancel anytime.
          </p>
          <Link to="/pricing">
            <Button className="bg-white text-[#2C2C2C] hover:bg-[#F0EDE8] rounded-none px-10 py-6 text-sm tracking-widest uppercase font-sans font-light">
              View Plans <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E0D9D3] py-8 px-8 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B6F5C]" />
            <span className="text-sm tracking-widest uppercase text-[#2C2C2C] font-light">Listing Lift</span>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-[#8B6F5C] text-xs font-sans">© 2025 Listing Lift. All rights reserved.</p>
            <Link to="/terms" className="text-[#8B6F5C] text-xs font-sans hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
