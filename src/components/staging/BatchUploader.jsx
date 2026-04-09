import { useState, useCallback } from 'react';
import { Upload, X, ImageIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const ROOM_TYPES = [
  { value: 'living_room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'dining_room', label: 'Dining Room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'office', label: 'Home Office' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'outdoor', label: 'Outdoor / Patio' },
  { value: 'other', label: 'Other' }
];

export default function BatchUploader({ onJobsCreated, subscription }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [
      ...prev,
      ...imageFiles.map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
        room_type: '',
        id: Math.random().toString(36).slice(2)
      }))
    ]);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const setRoomType = (id, room_type) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, room_type } : f));
  };

  const handleUpload = async () => {
    const unassigned = files.filter(f => !f.room_type);
    if (unassigned.length > 0) {
      alert('Please assign a room type to all photos before continuing.');
      return;
    }
    setUploading(true);
    const jobs = [];
    for (const item of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
      jobs.push({ original_image_url: file_url, room_type: item.room_type, preview: item.preview });
    }
    setUploading(false);
    setFiles([]);
    onJobsCreated(jobs);
  };

  const allAssigned = files.length > 0 && files.every(f => f.room_type);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById('file-input').click()}
        className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-[#8B6F5C] bg-[#F5F0EB]' : 'border-[#D4C9BE] hover:border-[#8B6F5C] hover:bg-[#FAF8F5]'}`}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 text-[#8B6F5C] mx-auto mb-3" />
        <p className="text-[#2C2C2C] font-serif font-light text-lg mb-1">Drop photos here or click to browse</p>
        <p className="text-[#8B6F5C] font-sans text-sm">Upload all room photos at once · JPG, PNG supported</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-sans text-sm text-[#2C2C2C] uppercase tracking-widest">{files.length} photo{files.length !== 1 ? 's' : ''} — assign room types</p>
            <button onClick={() => setFiles([])} className="text-xs font-sans text-[#8B6F5C] hover:underline">Clear all</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map(item => (
              <div key={item.id} className="bg-white border border-[#E0D9D3] overflow-hidden">
                <div className="relative aspect-video">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                    className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white"
                  >
                    <X className="w-3 h-3 text-[#2C2C2C]" />
                  </button>
                  {item.room_type && (
                    <div className="absolute bottom-2 left-2 bg-[#2C2C2C]/80 text-white text-xs px-2 py-0.5 font-sans">
                      <Check className="w-3 h-3 inline mr-1" />
                      {ROOM_TYPES.find(r => r.value === item.room_type)?.label}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <Select value={item.room_type} onValueChange={(v) => setRoomType(item.id, v)}>
                    <SelectTrigger className="w-full text-xs border-[#E0D9D3] rounded-none font-sans h-8">
                      <SelectValue placeholder="Assign room type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map(r => (
                        <SelectItem key={r.value} value={r.value} className="text-xs font-sans">{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!allAssigned || uploading}
            className="w-full bg-[#2C2C2C] text-white hover:bg-[#444] rounded-none uppercase tracking-widest text-xs font-sans py-5"
          >
            {uploading ? 'Uploading photos...' : `Continue with ${files.length} photo${files.length !== 1 ? 's' : ''} →`}
          </Button>
        </div>
      )}
    </div>
  );
}