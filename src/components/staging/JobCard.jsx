import { useNavigate } from 'react-router-dom';
import { Download, Loader2, AlertCircle, Clock } from 'lucide-react';
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

export default function JobCard({ job }) {
  const navigate = useNavigate();

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!job.staged_image_url) return;
    const a = document.createElement('a');
    a.href = job.staged_image_url;
    a.download = `staged-${job.room_type}-${job.id}.jpg`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div
      className="bg-white border border-[#E0D9D3] overflow-hidden cursor-pointer hover:border-[#8B6F5C] transition-colors group"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div className="relative aspect-video bg-[#F0EDE8]">
        {job.status === 'completed' && job.staged_image_url ? (
          <img
            src={job.staged_image_url}
            alt="Staged room"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : job.original_image_url ? (
          <div className="relative w-full h-full">
            <img
              src={job.original_image_url}
              alt="Original room"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {(job.status === 'processing' || job.status === 'pending') && (
                <div className="text-center px-3">
                  <Loader2 className="w-7 h-7 text-[#8B6F5C] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-sans text-[#8B6F5C] uppercase tracking-widest mb-1">Staging...</p>
                  <p className="text-xs font-sans text-[#A89080] leading-snug">~2–4 min</p>
                </div>
              )}
              {job.status === 'failed' && (
                <div className="text-center">
                  <AlertCircle className="w-7 h-7 text-red-400 mx-auto mb-2" />
                  <p className="text-xs font-sans text-red-400 uppercase tracking-widest">Failed</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Clock className="w-7 h-7 text-[#A89080]" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-0.5 font-sans uppercase tracking-wide ${
            job.status === 'completed' ? 'bg-[#2C2C2C] text-white' :
            job.status === 'processing' || job.status === 'pending' ? 'bg-[#8B6F5C] text-white' :
            job.status === 'failed' ? 'bg-red-500 text-white' :
            'bg-[#E0D9D3] text-[#6B6B6B]'
          }`}>
            {job.status === 'pending' ? 'queued' : job.status}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-serif text-[#2C2C2C]">{ROOM_LABELS[job.room_type] || 'Room'}</p>
            <p className="text-xs font-sans text-[#8B6F5C]">
              {STYLE_LABELS[job.decor_style] || job.decor_style}
              {job.decor_level && ` · ${job.decor_level}`}
            </p>
          </div>
          {job.status === 'completed' && (
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none text-xs font-sans px-3 h-7"
            >
              <Download className="w-3 h-3 mr-1" /> Save
            </Button>
          )}
        </div>
        {job.status === 'failed' && job.error_message && (
          <p className="text-xs font-sans text-red-400 mt-1">{job.error_message}</p>
        )}
      </div>
    </div>
  );
}
