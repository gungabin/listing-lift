import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import { ImageIcon, ArrowRight } from 'lucide-react';

const STATUS_STYLES = {
  completed: 'bg-foreground text-primary-foreground',
  processing: 'bg-accent text-accent-foreground',
  pending: 'bg-secondary text-muted-foreground',
  failed: 'bg-destructive/10 text-destructive',
};

export default function JobsList() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.StagingJob.list('-created_date', 50),
    ]).then(([u, j]) => {
      setUser(u);
      setJobs(j);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell user={user}>
      <div className="p-10 max-w-4xl">
        <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">History</p>
        <h1 className="font-cormorant text-4xl mb-10 font-light">My Staging Jobs</h1>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-secondary animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-cormorant text-2xl mb-2">No jobs yet</p>
            <p className="text-muted-foreground font-light text-sm mb-6">Stage your first listing to see it here.</p>
            <Link to="/stage" className="text-xs tracking-widest uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-primary-foreground transition-colors inline-block">
              Start Staging
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between border border-border p-5 hover:bg-secondary transition-colors group"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium text-sm mb-1">{job.property_address || 'Untitled Property'}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {job.decor_style?.replace('_', ' ')} · {job.furnishing_level} · {job.total_photos || 0} photos · {job.completed_photos || 0} staged
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-xs tracking-wide uppercase px-2 py-1 ${STATUS_STYLES[job.status] || STATUS_STYLES.pending}`}>
                    {job.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}