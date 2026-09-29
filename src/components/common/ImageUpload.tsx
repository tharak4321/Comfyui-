import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Eye } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  description?: string;
  imageFile: File | null;
  imageBase64: string | null;
  onImageChange: (file: File | null, base64: string | null) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Reference Image (Picture 1)',
  description = 'Drag & drop image here or browse from device',
  imageFile,
  imageBase64,
  onImageChange,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onImageChange(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </label>
          {imageBase64 && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {imageBase64 ? (
        <div className="relative group rounded-xl border border-zinc-700/80 bg-zinc-900/90 overflow-hidden p-2 flex items-center gap-3">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-zinc-800">
            <img
              src={imageBase64}
              alt="Reference Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setShowFullPreview(true)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
              title="View full image"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {imageFile?.name || 'reference_image.png'}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Uploaded'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-medium px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/80'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:scale-105 transition-all mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-zinc-300">
            Upload reference image
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-xs">
            {description}
          </p>
          <span className="mt-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-800/60 px-2 py-0.5 rounded">
            PNG, JPG, WEBP
          </span>
        </div>
      )}

      {/* Full preview modal */}
      {showFullPreview && imageBase64 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullPreview(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageBase64}
              alt="Reference Full"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="p-3 text-xs text-zinc-400 flex items-center justify-between">
              <span>{imageFile?.name}</span>
              <span>{imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
