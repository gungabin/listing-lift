import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import StyleSelector from '@/components/staging/StyleSelector';
import FurnishingLevel from '@/components/staging/FurnishingLevel';
import PhotoUploader from '@/components/staging/PhotoUploader';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function NewStaging() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1: details+style, 2: photos, 3: review
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    property_address: '',
    property_price: '',
    property_region: '',
    decor_style: 'smart_pick',
    furnishing_level: 'medium',
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    const job = await base44.entities.StagingJob.create({
      user_email: user.email,
      property_address: form.property_address,
      property_price: parseFloat(form.property_price) || 0,
      property_region: form.property_region,
      decor_style: form.decor_style,
      furnishing_level: form.furnishing_level,
      photos: photos,
      total_photos: photos.length,
      completed_photos: 0,
      status: 'pending',
    });

    // Trigger staging via backend function
    await base44.functions.invoke('stagePhotos', { job_id: job.id });
    navigate(`/jobs/${job.id}`);
  };

  return (
    <AppShell user={user}>
      <div className="p-10 max-w-3xl">
        {/* Header */}
        <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">New Job</p>
        <h1 className="font-cormorant text-4xl mb-2 font-light">Stage a Listing</h1>
        <p className="text-muted-foreground font-light text-sm mb-10">Fill in the property details, choose your style, upload your photos, and let AI do the rest.</p>

        {/* Step indicators */}
        <div className="flex items-center gap-4 mb-10">
          {['Property & Style', 'Upload Photos', 'Review & Submit'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 flex items-center justify-center text-xs border ${step === i + 1 ? 'bg-foreground text-primary-foreground border-foreground' : step > i + 1 ? 'bg-foreground/20 border-foreground/30 text-foreground' : 'border-border text-muted-foreground'}`}>
                {i + 1}
              </div>
              <span className={`text-xs tracking-wide hidden md:block ${step === i + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-border hidden md:block" />}
            </div>
          ))}
        </div>

        {/* Step 1: Property + Style */}
        {step === 1 && (
          <div className="space-y-10">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Property Details</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1.5">Property Address</label>
                  <input
                    type="text"
                    value={form.property_address}
                    onChange={(e) => update('property_address', e.target.value)}
                    placeholder="123 Maple St, Austin, TX"
                    className="w-full border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Listing Price ($)</label>
                  <input
                    type="number"
                    value={form.property_price}
                    onChange={(e) => update('property_price', e.target.value)}
                    placeholder="450000"
                    className="w-full border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Region / Market</label>
                  <input
                    type="text"
                    value={form.property_region}
                    onChange={(e) => update('property_region', e.target.value)}
                    placeholder="e.g. Austin, TX or Pacific Northwest"
                    className="w-full border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>
            </div>

            <StyleSelector value={form.decor_style} onChange={(v) => update('decor_style', v)} />
            <FurnishingLevel value={form.furnishing_level} onChange={(v) => update('furnishing_level', v)} />

            <button
              onClick={() => setStep(2)}
              disabled={!form.property_address}
              className="flex items-center gap-2 bg-foreground text-primary-foreground text-xs tracking-widest uppercase px-8 py-4 hover:bg-foreground/90 disabled:opacity-40 transition-colors"
            >
              Next: Upload Photos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-8">
            <PhotoUploader photos={photos} setPhotos={setPhotos} />
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="text-xs tracking-widest uppercase border border-border px-6 py-3 hover:bg-secondary transition-colors">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={photos.length === 0}
                className="flex items-center gap-2 bg-foreground text-primary-foreground text-xs tracking-widest uppercase px-8 py-3 hover:bg-foreground/90 disabled:opacity-40 transition-colors"
              >
                Review Job <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="border border-border p-6 space-y-4 bg-card">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p>{form.property_address}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                  <p>{form.property_price ? `$${parseInt(form.property_price).toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Style</p>
                  <p className="capitalize">{form.decor_style.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Furnishing</p>
                  <p className="capitalize">{form.furnishing_level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Photos</p>
                  <p>{photos.length} uploaded</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Generations Used</p>
                  <p>{photos.length}</p>
                </div>
              </div>
            </div>

            <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Important:</strong> AI staging will only add furniture and decor. Your walls, floors, fixtures, windows, and all structural elements will remain exactly as photographed. Do not use staged images to misrepresent physical features of the property.
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="text-xs tracking-widest uppercase border border-border px-6 py-3 hover:bg-secondary transition-colors">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-foreground text-primary-foreground text-xs tracking-widest uppercase px-8 py-4 hover:bg-foreground/90 disabled:opacity-40 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : `Stage ${photos.length} Photo${photos.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}