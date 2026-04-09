import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ROOM_TYPES = [
  { id: 'living_room', label: 'Living Room' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'dining_room', label: 'Dining Room' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'office', label: 'Office / Den' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'other', label: 'Other' },
];

export default function PhotoUploader({ photos, setPhotos }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFiles = async (files) => {
    setUploading(true);
    const fileArray = Array.from(files);
    const uploaded = await Promise.all(
      fileArray.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          id: crypto.randomUUID(),
          original_url: file_url,
          room_type: 'living_room',
          status: 'pending',
          name: file.name,
        };
      })
    );
    setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  const updateRoomType = (id, room_type) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, room_type } : p)));
  };

  return (
    <div>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">Upload Photos</p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border hover:border-foreground transition-colors cursor-pointer p-12 text-center mb-6"
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-muted-foreground font-light text-sm">Uploading...</p>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="font-cormorant text-xl mb-1">Drop photos here or click to browse</p>
            <p className="text-muted-foreground text-sm font-light">Upload all listing photos at once — any number</p>
          </>
        )}
      </div>

      {/* Photo grid with room assignment */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{photos.length} photo{photos.length !== 1 ? 's' : ''} — assign each a room type</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="flex gap-3 border border-border p-3 bg-card">
                <div className="w-20 h-20 shrink-0 bg-secondary overflow-hidden">
                  <img src={photo.original_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate mb-2">{photo.name}</p>
                  <select
                    value={photo.room_type}
                    onChange={(e) => updateRoomType(photo.id, e.target.value)}
                    className="w-full text-sm border border-border bg-background px-2 py-1.5 focus:outline-none focus:border-foreground"
                  >
                    {ROOM_TYPES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => removePhoto(photo.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}