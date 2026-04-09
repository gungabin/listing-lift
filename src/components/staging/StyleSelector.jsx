const styles = [
  { id: 'smart_pick', label: 'Smart Pick', desc: 'AI selects the best style for the home & market', icon: '✦' },
  { id: 'modern', label: 'Modern', desc: 'Clean lines, neutral palette, minimal clutter', icon: '◻' },
  { id: 'farmhouse', label: 'Farmhouse', desc: 'Warm woods, shiplap accents, cozy textures', icon: '⌂' },
  { id: 'coastal', label: 'Coastal', desc: 'Light blues, natural fibers, breezy open feel', icon: '◡' },
  { id: 'traditional', label: 'Traditional', desc: 'Classic silhouettes, rich tones, timeless appeal', icon: '❖' },
  { id: 'mid_century', label: 'Mid-Century', desc: 'Organic shapes, teak tones, retro-modern mix', icon: '◈' },
  { id: 'scandinavian', label: 'Scandinavian', desc: 'Minimalist, light woods, hygge-inspired warmth', icon: '❄' },
];

export default function StyleSelector({ value, onChange }) {
  return (
    <div>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Decor Style</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`text-left p-4 border transition-colors ${
              value === s.id
                ? 'border-foreground bg-foreground text-primary-foreground'
                : 'border-border hover:border-foreground bg-card'
            }`}
          >
            <span className="text-lg mb-2 block">{s.icon}</span>
            <p className={`text-sm font-medium mb-1 ${value === s.id ? 'text-white' : ''}`}>{s.label}</p>
            <p className={`text-xs font-light leading-relaxed ${value === s.id ? 'text-white/70' : 'text-muted-foreground'}`}>{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}