import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppNav from '@/components/layout/AppNav';
import BatchUploader from '@/components/staging/BatchUploader';
import StyleSettings from '@/components/staging/StyleSettings';
import JobCard from '@/components/staging/JobCard';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'settings' | 'processing'
  const [pendingJobs, setPendingJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [settings, setSettings] = useState({ decor_style: 'modern', decor_level: 'medium' });
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  // Poll active jobs — only if there are genuinely in-flight jobs (created within last 10 min)
  useEffect(() => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const hasActiveJobs = activeJobs.some(j =>
      (j.status === 'processing' || j.status === 'pending') &&
      new Date(j.created_date).getTime() > tenMinutesAgo
    );
    if (hasActiveJobs) {
      const timer = setInterval(pollJobs, 4000);
      return () => clearInterval(timer);
    }
  }, [activeJobs]);

  const loadUser = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u) {
      const subs = await base44.entities.Subscription.filter({ user_email: u.email, status: 'active' });
      setSubscription(subs[0] || null);
      // Load recent jobs
      const jobs = await base44.entities.StagingJob.filter({ user_email: u.email }, '-created_date', 12);
      setActiveJobs(jobs);
    }
  };

  const pollJobs = async () => {
    if (!user) return;
    const jobs = await base44.entities.StagingJob.filter({ user_email: user.email }, '-created_date', 12);
    setActiveJobs(jobs);
  };

  const handleJobsCreated = (jobs) => {
    setPendingJobs(jobs);
    setStep('settings');
  };

  const handleProcess = async () => {
    if (!settings.decor_style || !settings.decor_level) return;
    setProcessing(true);

    const createdJobIds = [];
    for (const job of pendingJobs) {
      const created = await base44.entities.StagingJob.create({
        user_email: user.email,
        original_image_url: job.original_image_url,
        room_type: job.room_type,
        decor_style: settings.decor_style,
        decor_level: settings.decor_level,
        smart_pick_reasoning: settings.smart_pick_reasoning,
        status: 'pending'
      });
      createdJobIds.push(created.id);
    }

    // Kick off staging for each
    for (const jobId of createdJobIds) {
      base44.functions.invoke('stageImage', { jobId }).catch(() => {});
    }

    setPendingJobs([]);
    setStep('upload');
    setProcessing(false);

    // Reload jobs
    const jobs = await base44.entities.StagingJob.filter({ user_email: user.email }, '-created_date', 12);
    setActiveJobs(jobs);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B6F5C]" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Sparkles className="w-10 h-10 text-[#8B6F5C] mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-light text-[#2C2C2C] mb-3">Choose a plan to get started</h2>
          <p className="text-[#6B6B6B] font-sans text-sm mb-6">You need an active subscription to stage listings. Plans start at just $49/month — less than the cost of 2 traditional staging photos.</p>
          <Link to="/pricing">
            <Button className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none uppercase tracking-widest text-xs font-sans px-8 py-5">
              View Plans <ArrowRight className="ml-2 w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <AppNav user={user} subscription={subscription} />

      <main className="md:ml-56 pt-20 md:pt-0 p-6 lg:p-10">
        {/* Processing banner */}
        {activeJobs.some(j => j.status === 'processing' || j.status === 'pending') && (
          <div className="mb-6 bg-[#F5F0EB] border border-[#D4C9BE] px-5 py-4 flex items-start gap-3">
            <Loader2 className="w-4 h-4 text-[#8B6F5C] animate-spin mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-sans font-medium text-[#2C2C2C]">Your photos are being staged — please stay on this page.</p>
              <p className="text-xs font-sans text-[#8B6F5C] mt-0.5">Each image typically takes 2–4 minutes. Leaving the page will not cancel the job, but you won't see live updates until you return.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light text-[#2C2C2C]">
            {step === 'upload' ? 'Stage Your Listings' : 'Configure Staging'}
          </h1>
          <p className="text-[#8B6F5C] font-sans text-sm mt-1">
            {step === 'upload'
              ? `${subscription.generations_limit - subscription.generations_used} generations remaining this month`
              : `${pendingJobs.length} photo${pendingJobs.length !== 1 ? 's' : ''} ready to stage`}
          </p>
        </div>

        {step === 'upload' && (
          <div className="max-w-2xl">
            <BatchUploader onJobsCreated={handleJobsCreated} subscription={subscription} />
          </div>
        )}

        {step === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-white border border-[#E0D9D3] p-6 mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {pendingJobs.map((job, i) => (
                  <div key={i} className="flex-shrink-0 w-24 h-16 bg-[#F0EDE8] overflow-hidden">
                    <img src={job.preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-sans text-[#8B6F5C] uppercase tracking-widest">{pendingJobs.length} photos queued</p>
            </div>

            <StyleSettings settings={settings} onChange={setSettings} showSmartPick={['agent', 'pro'].includes(subscription?.plan)} />

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep('upload')} className="rounded-none border-[#D4C9BE] font-sans text-xs uppercase tracking-widest">
                Back
              </Button>
              <Button
                onClick={handleProcess}
                disabled={!settings.decor_style || !settings.decor_level || processing}
                className="flex-1 bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none uppercase tracking-widest text-xs font-sans py-5"
              >
                {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</> : `Stage ${pendingJobs.length} Photo${pendingJobs.length !== 1 ? 's' : ''} →`}
              </Button>
            </div>
          </div>
        )}

        {/* Recent jobs */}
        {step === 'upload' && activeJobs.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest font-sans text-[#8B6F5C]">Recent Stagings</p>
              <Link to="/history" className="text-xs font-sans text-[#8B6F5C] hover:underline">View all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}