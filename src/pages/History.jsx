import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppNav from '@/components/layout/AppNav';
import JobCard from '@/components/staging/JobCard';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROOM_LABELS = {
  living_room: 'Living Room', bedroom: 'Bedroom', dining_room: 'Dining Room',
  kitchen: 'Kitchen', office: 'Home Office', bathroom: 'Bathroom', outdoor: 'Outdoor', other: 'Other'
};

export default function History() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    if (u) {
      const [subs, allJobs] = await Promise.all([
        base44.entities.Subscription.filter({ user_email: u.email, status: 'active' }),
        base44.entities.StagingJob.filter({ user_email: u.email }, '-created_date', 100)
      ]);
      setSubscription(subs[0] || null);
      setJobs(allJobs);
    }
    setLoading(false);
  };

  const filtered = jobs.filter(j => {
    if (filterRoom !== 'all' && j.room_type !== filterRoom) return false;
    if (filterStatus !== 'all' && j.status !== filterStatus) return false;
    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#8B6F5C]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <AppNav user={user} subscription={subscription} />
      <main className="md:ml-56 pt-20 md:pt-0 p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light text-[#2C2C2C]">Staging History</h1>
          <p className="text-[#8B6F5C] font-sans text-sm mt-1">{jobs.length} total stagings</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger className="w-44 rounded-none border-[#D4C9BE] font-sans text-xs">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-sans">All Rooms</SelectItem>
              {Object.entries(ROOM_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v} className="text-xs font-sans">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 rounded-none border-[#D4C9BE] font-sans text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-sans">All Statuses</SelectItem>
              <SelectItem value="completed" className="text-xs font-sans">Completed</SelectItem>
              <SelectItem value="processing" className="text-xs font-sans">Processing</SelectItem>
              <SelectItem value="failed" className="text-xs font-sans">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#A89080] font-sans text-sm">No stagings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </main>
    </div>
  );
}