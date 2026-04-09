import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const STYLES = [
  { id: 'smart_pick', label: 'Smart Pick', icon: '✦', desc: 'AI chooses based on your listing' },
  { id: 'modern', label: 'Modern', icon: '◼', desc: 'Clean lines, neutral palette' },
  { id: 'farmhouse', label: 'Farmhouse', icon: '⌂', desc: 'Warm wood, linen, rustic accents' },
  { id: 'coastal', label: 'Coastal', icon: '~', desc: 'Blues, whites, natural textures' },
  { id: 'traditional', label: 'Traditional', icon: '❧', desc: 'Rich tones, formal elegance' },
  { id: 'mid_century', label: 'Mid-Century', icon: '◈', desc: 'Tapered legs, earthy palette' },
  { id: 'scandinavian', label: 'Scandinavian', icon: '✦', desc: 'White, light wood, minimal' },
  { id: 'transitional', label: 'Transitional', icon: '◇', desc: 'Modern meets traditional' }
];

const LEVELS = [
  { id: 'light', label: 'Light', desc: 'A few accent pieces' },
  { id: 'medium', label: 'Medium', desc: 'Main furniture + accents' },
  { id: 'full', label: 'Full Staging', desc: 'Completely furnished' }
];

export default function StyleSettings({ settings, onChange, showSmartPick = true }) {
  const [smartPickLoading, setSmartPickLoading] = useState(false);
  const [smartPickResult, setSmartPickResult] = useState(null);

  const runSmartPick = async () => {
    if (!settings.address || !settings.listingPrice) return;
    setSmartPickLoading(true);
    try {
      const res = await base44.functions.invoke('smartPick', {
        address: settings.address,
        listingPrice: settings.listingPrice,
        roomType: settings.roomType || 'living_room'
      });
      if (res.data?.style) {
        setSmartPickResult(res.data);
        onChange({ ...settings, decor_style: res.data.style, smart_pick_reasoning: res.data.reasoning });
      }
    } catch (e) {}
    setSmartPickLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Smart Pick inputs */}
      {showSmartPick && (
        <div className="bg-[#F5F0EB] p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C]">Smart Pick — Optional</p>
          <p className="text-sm font-sans text-[#6B6B6B]">Enter property details and our AI will recommend the ideal style for your target buyer.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Property address"
              value={settings.address || ''}
              onChange={e => onChange({ ...settings, address: e.target.value })}
              className="rounded-none border-[#D4C9BE] bg-white font-sans text-sm"
            />
            <Input
              placeholder="Listing price (e.g. $450,000)"
              value={settings.listingPrice || ''}
              onChange={e => onChange({ ...settings, listingPrice: e.target.value })}
              className="rounded-none border-[#D4C9BE] bg-white font-sans text-sm"
            />
          </div>
          <Button
            onClick={runSmartPick}
            disabled={!settings.address || !settings.listingPrice || smartPickLoading}
            className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none uppercase tracking-widest text-xs font-sans"
          >
            {smartPickLoading ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3 mr-2" />Run Smart Pick</>}
          </Button>
          {smartPickResult && (
            <div className="bg-white border border-[#D4C9BE] p-3">
              <p className="text-xs font-sans text-[#8B6F5C] uppercase tracking-wider mb-1">Smart Pick Result</p>
              <p className="text-sm font-sans text-[#2C2C2C] font-medium capitalize">{smartPickResult.style?.replace('_', ' ')}</p>
              <p className="text-xs font-sans text-[#6B6B6B] mt-1">{smartPickResult.reasoning}</p>
              <p className="text-xs font-sans text-[#A89080] mt-1">Target: {smartPickResult.target_demographic}</p>
            </div>
          )}
        </div>
      )}

      {/* Style picker */}
      <div>
        <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-3">Decor Style</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STYLES.filter(s => showSmartPick || s.id !== 'smart_pick').map(style => (
            <button
              key={style.id}
              onClick={() => onChange({ ...settings, decor_style: style.id })}
              className={`p-3 text-left border transition-all ${settings.decor_style === style.id ? 'border-[#2C2C2C] bg-[#2C2C2C] text-white' : 'border-[#E0D9D3] bg-white hover:border-[#8B6F5C]'}`}
            >
              <span className="text-lg block mb-1">{style.icon}</span>
              <p className={`text-xs font-sans font-medium uppercase tracking-wide ${settings.decor_style === style.id ? 'text-white' : 'text-[#2C2C2C]'}`}>{style.label}</p>
              <p className={`text-xs font-sans mt-0.5 ${settings.decor_style === style.id ? 'text-[#A89080]' : 'text-[#8B6F5C]'}`}>{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Level picker */}
      <div>
        <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-3">Staging Level</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => onChange({ ...settings, decor_level: level.id })}
              className={`p-4 text-center border transition-all ${settings.decor_level === level.id ? 'border-[#2C2C2C] bg-[#2C2C2C] text-white' : 'border-[#E0D9D3] bg-white hover:border-[#8B6F5C]'}`}
            >
              <p className={`text-sm font-sans font-medium uppercase tracking-wide ${settings.decor_level === level.id ? 'text-white' : 'text-[#2C2C2C]'}`}>{level.label}</p>
              <p className={`text-xs font-sans mt-1 ${settings.decor_level === level.id ? 'text-[#A89080]' : 'text-[#6B6B6B]'}`}>{level.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}