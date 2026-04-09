import { useState, useEffect, useRef } from 'react';
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

// Interactive before/after slider for the job detail view
function CompareSlider({ before, after }) {
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
      className="relative w-full aspect-[4/3] overflow-hidden rounded-sm select-none cursor-col-resize bg-[#E8E0D8]"
      onTouchMove={onTouchMove}
    >
      {/* After (full base) */}
      <img src={after} alt="Staged" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before (clipped left side) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src={before}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: containerRef.current?.offsetWidth || 600 }}
        />
      </div>

      {/* Divider */}
      <div className="absolute top-0 bottom-0 w-px bg-white shadow-lg" style={{ left: `${position}%` }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onTouchStart={() => { dragging.current = true; }}
          onTouchEnd={() => { dragging.current = false; }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L3 10L7 16M13 4L17 10L13 16" stroke="#8B6F5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-sans uppercase tracking-widest px-3 py-1">
        Original
      </div>
      <div className="absolute bottom-3 right-3 bg-[#8B6F5C]/90 backdrop-blur-sm text-white text-xs font-sans uppercase tracking-widest px-3 py-1">
        AI Staged
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

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

            {/* Completed: before/after slider */}
            {job.status === 'completed' && job.original_image_url && job.staged_image_url && (
              <div className="mb-10">
                <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C] mb-3">Before & After</p>
                <CompareSlider before={job.original_image_url} after={job.staged_image_url} />
                <p className="text-center text-xs font-sans text-[#A89080] mt-2 tracking-wide">← Drag to compare →</p>
              </div>
            )}

            {/* Processing state: show blurred original */}
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
