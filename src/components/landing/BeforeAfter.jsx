import { useState, useRef, useEffect } from 'react';

function SliderComparison({ before, after, beforeLabel, afterLabel }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const updatePosition = (clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  const onMouseDown = () => { dragging.current = true; };
  const onMouseUp = () => { dragging.current = false; };
  const onMouseMove = (e) => { if (dragging.current) updatePosition(e.clientX); };
  const onTouchMove = (e) => { updatePosition(e.touches[0].clientX); };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] overflow-hidden rounded-sm select-none cursor-col-resize"
      onTouchMove={onTouchMove}
    >
      {/* After (full width base) */}
      <img src={after} alt="After staging" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={before} alt="Before staging" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: containerRef.current?.offsetWidth || 600 }} />
      </div>

      {/* Divider line */}
      <div className="absolute top-0 bottom-0 w-px bg-white shadow-lg" style={{ left: `${position}%` }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onTouchStart={() => { dragging.current = true; }}
          onTouchEnd={() => { dragging.current = false; }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L3 10L7 16M13 4L17 10L13 16" stroke="#8B6F5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-sans uppercase tracking-widest px-3 py-1">{beforeLabel}</div>
      <div className="absolute bottom-3 right-3 bg-[#8B6F5C]/90 backdrop-blur-sm text-white text-xs font-sans uppercase tracking-widest px-3 py-1">{afterLabel}</div>
    </div>
  );
}

const EXAMPLES = [
  {
    id: 'empty',
    tag: 'Empty Room',
    headline: 'Bare space to\nbuyable home.',
    desc: 'Upload an empty listing photo and watch Listing Lift furnish it with photorealistic pieces — floors, light, and architecture untouched.',
    before: 'https://media.base44.com/images/public/69d6dc047087a643cf893bf6/68a192ee5_point3d-commercial-imaging-ltd-nQlVMCHPysY-unsplash.jpg',
    after: 'https://media.base44.com/images/public/69d6dc047087a643cf893bf6/84789e5ce_generated_image.png',
    beforeLabel: 'Empty',
    afterLabel: 'AI Staged · Modern',
  },
  {
    id: 'cluttered',
    tag: 'Re-Stage',
    headline: 'Cluttered room,\nclean slate.',
    desc: 'Already furnished but it\'s not showing well? Re-Stage replaces existing furniture with styled, buyer-ready pieces that actually sell.',
    before: 'https://media.base44.com/images/public/69d6dc047087a643cf893bf6/6e77359bc_generated_image.png',
    after: 'https://media.base44.com/images/public/69d6dc047087a643cf893bf6/655b0aa3d_generated_image.png',
    beforeLabel: 'As-Is',
    afterLabel: 'AI Re-Staged · Modern',
  }
];

export default function BeforeAfter() {
  const [active, setActive] = useState('empty');
  const example = EXAMPLES.find(e => e.id === active);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[#8B6F5C] tracking-widest uppercase text-sm mb-2 font-sans">See It In Action</p>
          <h2 className="text-4xl text-[#2C2C2C] font-light mb-4">
            Two ways to transform<br /><em className="italic">any</em> listing.
          </h2>
          <p className="text-[#6B6B6B] font-sans text-base max-w-lg mx-auto leading-relaxed">
            Whether your room is empty or full of the seller's belongings — Listing Lift delivers styled, market-ready photos in minutes.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex border border-[#E0D9D3] p-1">
            {EXAMPLES.map(e => (
              <button
                key={e.id}
                onClick={() => setActive(e.id)}
                className={`px-6 py-2.5 text-xs font-sans uppercase tracking-widest transition-colors ${
                  active === e.id
                    ? 'bg-[#2C2C2C] text-white'
                    : 'text-[#8B6F5C] hover:text-[#2C2C2C]'
                }`}
              >
                {e.tag}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Slider */}
          <div className="relative">
            <SliderComparison
              before={example.before}
              after={example.after}
              beforeLabel={example.beforeLabel}
              afterLabel={example.afterLabel}
            />
            <p className="text-center text-xs font-sans text-[#A89080] mt-3 tracking-wide">← Drag to compare →</p>
          </div>

          {/* Copy */}
          <div className="lg:pl-8">
            <span className="inline-block bg-[#F5F0EB] text-[#8B6F5C] text-xs font-sans uppercase tracking-widest px-3 py-1 mb-5">
              {example.tag}
            </span>
            <h3 className="text-4xl text-[#2C2C2C] font-light leading-tight mb-5 whitespace-pre-line">
              {example.headline}
            </h3>
            <p className="text-[#6B6B6B] font-sans leading-relaxed mb-8 text-base">
              {example.desc}
            </p>

            {active === 'empty' ? (
              <ul className="space-y-3 mb-8">
                {['Walls, floors & fixtures always preserved', 'Choose from 7 design styles', 'Light, medium, or fully furnished density'].map(pt => (
                  <li key={pt} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B6F5C] mt-2 flex-shrink-0" />
                    <span className="text-sm font-sans text-[#6B6B6B]">{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3 mb-8">
                {['Removes existing furniture & clutter', 'Replaces with buyer-ready styled pieces', 'No manual masking required — AI handles it all'].map(pt => (
                  <li key={pt} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B6F5C] mt-2 flex-shrink-0" />
                    <span className="text-sm font-sans text-[#6B6B6B]">{pt}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-4">
              <a href="#pricing">
                <button className="bg-[#2C2C2C] text-white hover:bg-[#444] transition-colors px-8 py-3.5 text-xs uppercase tracking-widest font-sans">
                  Start for $49 / mo
                </button>
              </a>
              <p className="text-xs font-sans text-[#A89080]">No commitment required</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}