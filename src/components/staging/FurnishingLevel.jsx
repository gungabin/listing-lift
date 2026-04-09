const levels = [
  {
    id: 'light',
    label: 'Light Touch',
    desc: 'A few key accent pieces — art, rugs, throws. Minimal footprint.',
    preview: '░░░',
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: 'Core furniture plus accents. The sweet spot for most listings.',
    preview: '▒▒▒',
  },
  {
    id: 'full',
    label: 'Full Stage',
    desc: 'Completely furnished. Every corner styled to perfection.',
    preview: '███',
  },
];

export default function FurnishingLevel({ value, onChange }) {
  return (
    <div>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Furnishing Level</p>
      <div className="grid grid-cols-3 gap-3">
        {levels.map((l) => (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            className={`text-left p-5 border transition-colors ${
              value === l.id
                ? 'border-foreground bg-foreground text-primary-foreground'
                : 'border-border hover:border-foreground bg-card'
            }`}
          >
            <span className={`text-xs tracking-widest block mb-3 ${value === l.id ? 'text-white/50' : 'text-muted-foreground'}`}>
              {l.preview}
            </span>
            <p className={`font-cormorant text-xl mb-1 ${value === l.id ? 'text-white' : ''}`}>{l.label}</p>
            <p className={`text-xs font-light leading-relaxed ${value === l.id ? 'text-white/70' : 'text-muted-foreground'}`}>{l.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}