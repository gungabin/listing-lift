import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppNav from '@/components/layout/AppNav';
import { Download, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROOM_LABELS = {
  living_room: 'Living Room', bedroom: 'Bedroom', dining_room: 'Dining Room',
  kitchen: 'Kitchen', office: 'Home Office', bathroom: 'Bathroom',
  outdoor: 'Outdoor', other: 'Other',
};

const STYLE_LABELS = {
  modern: 'Modern', farmhouse: 'Farmhouse', coastal: 'Coastal',
  traditional: 'Traditional', mid_century: 'Mid-Century', scandinavian: 'Scandinavian',
  transitional: 'Transitional', smart_pick: 'Smart Pick',
};

export default function JobDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('staged'); // 'staged' | 'original'

  useEffect(() => {
    loadAll();
  }, [id]);

  // Poll while job is still processing
  useEffect(() => {
    if (!job) return;
    if (job.status === 'processing' || job.status === 'pending') {
      const interval = setInterval(loadJob, 3000);
      return () => clearInterval(interval);
    }
  }, [job?.status]);

  const loadAll = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u) {
      const subs = await base44.entities.Subscription.filter({ user_email: u.email, status: 'active' });
      setSubscription(subs[0] || null);
    }
    await loadJob();
    setLoading(false);
  };

  const loadJob = async () => {
    const results = await base44.entities.StagingJob.filter({ id });
    if (results?.length > 0) setJob(results[0]);
  };

  const handleDownload = () => {
    if (!job?.staged_image_url) return;
    const a = document.createElement('a');
    a.href = job.staged_image_url;
    a.download = `staged-${job.room_type || 'room'}-${job.id}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const isProcessing = job?.status === 'pending' || job?.status === 'processing';

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <AppNav user={user} subscription={subscription} />

      <main className="md:ml-56 pt-20 md:pt-0 p-6 lg:p-10 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B6F5C]" />
          </div>
        ) : !job ? (
          <div className="text-center py-20">
            <p className="text-[#A89080] font-sans text-sm mb-4">Job not found.</p>
            <Link to="/dashboard">
              <Button variant="outline" className="rounded-none border-[#D4C9BE] font-sans text-xs uppercase tracking-widest">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
              <div>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-xs font-sans text-[#A89080] hover:text-[#2C2C2C] uppercase tracking-widest transition-colors mb-4"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </Link>
                <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-1">Staging Job</p>
                <h1 className="text-3xl font-serif font-light text-[#2C2C2C]">
                  {ROOM_LABELS[job.room_type] || 'Room'}
                </h1>
                <p className="text-sm font-sans text-[#8B6F5C] mt-1">
                  {STYLE_LABELS[job.decor_style] || job.decor_style}
                  {job.decor_level && ` · ${job.decor_level} furnishing`}
                </p>
              </div>

              {job.status === 'completed' && job.staged_image_url && (
                <Button
                  onClick={handleDownload}
                  className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none uppercase tracking-widest text-xs font-sans px-6 py-4 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5 mr-2" /> Download
                </Button>
              )}
            </div>

            {/* Processing banner */}
            {isProcessing && (
              <div className="mb-8 bg-[#F5F0EB] border border-[#D4C9BE] px-5 py-4 flex items-start gap-3">
                <Loader2 className="w-4 h-4 text-[#8B6F5C] animate-spin mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-sans font-medium text-[#2C2C2C]">Staging in progress — this page will update automatically.</p>
                  <p className="text-xs font-sans text-[#8B6F5C] mt-0.5">Typically 2–4 minutes. Please stay on this page for live updates.</p>
                </div>
              </div>
            )}

            {/* Completed: toggle between original and staged */}
            {job.status === 'completed' && job.staged_image_url && (
              <div className="mb-10">
                {/* Toggle */}
                <div className="flex items-center gap-0 mb-4 inline-flex border border-[#E0D9D3]">
                  <button
                    onClick={() => setView('staged')}
                    className={`px-5 py-2 text-xs font-sans uppercase tracking-widest transition-colors ${
                      view === 'staged' ? 'bg-[#2C2C2C] text-white' : 'text-[#8B6F5C] hover:text-[#2C2C2C]'
                    }`}
                  >
                    AI Staged
                  </button>
                  <button
                    onClick={() => setView('original')}
                    className={`px-5 py-2 text-xs font-sans uppercase tracking-widest transition-colors ${
                      view === 'original' ? 'bg-[#2C2C2C] text-white' : 'text-[#8B6F5C] hover:text-[#2C2C2C]'
                    }`}
                  >
                    Original
                  </button>
                </div>

                {/* Image */}
                <div className="aspect-[4/3] bg-[#E8E0D8] overflow-hidden rounded-sm relative">
                  <img
                    key={view}
                    src={view === 'staged' ? job.staged_image_url : job.original_image_url}
                    alt={view === 'staged' ? 'AI staged room' : 'Original room'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5">
                    <p className="text-xs font-sans uppercase tracking-widest text-[#8B6F5C]">
                      {view === 'staged'
                        ? `AI Staged · ${STYLE_LABELS[job.decor_style] || job.decor_style}`
                        : 'Original Photo'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing state: blurred original */}
            {isProcessing && job.original_image_url && (
              <div className="mb-10 relative aspect-[4/3] bg-[#E8E0D8] overflow-hidden rounded-sm">
                <img
                  src={job.original_image_url}
                  alt="Original room"
                  className="w-full h-full object-cover opacity-40 blur-sm"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#8B6F5C] animate-spin mx-auto mb-3" />
                    <p className="text-sm font-serif text-[#2C2C2C]">Staging your photo...</p>
                    <p className="text-xs font-sans text-[#8B6F5C] mt-1">~2–4 minutes · please stay on this page</p>
                  </div>
                </div>
              </div>
            )}

            {/* Failed state */}
            {job.status === 'failed' && (
              <div className="mb-10 p-8 bg-white border border-[#E0D9D3] text-center">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-serif text-[#2C2C2C] mb-1">Staging failed</p>
                {job.error_message && (
                  <p className="text-xs font-sans text-red-400">{job.error_message}</p>
                )}
              </div>
            )}

            {/* Job metadata */}
            <div className="bg-white border border-[#E0D9D3] p-6">
              <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-4">Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-sans text-[#A89080] mb-1">Room Type</p>
                  <p className="text-sm font-sans text-[#2C2C2C]">{ROOM_LABELS[job.room_type] || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-[#A89080] mb-1">Style</p>
                  <p className="text-sm font-sans text-[#2C2C2C]">{STYLE_LABELS[job.decor_style] || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-[#A89080] mb-1">Density</p>
                  <p className="text-sm font-sans text-[#2C2C2C] capitalize">{job.decor_level || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-[#A89080] mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    {job.status === 'completed'
                      ? <CheckCircle className="w-3.5 h-3.5 text-[#8B6F5C]" />
                      : job.status === 'failed'
                        ? <XCircle className="w-3.5 h-3.5 text-red-400" />
                        : <Loader2 className="w-3.5 h-3.5 text-[#A89080] animate-spin" />
                    }
                    <p className="text-sm font-sans text-[#2C2C2C] capitalize">{job.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
