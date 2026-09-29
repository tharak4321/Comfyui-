import React, { useState } from 'react';
import {
  Images,
  Image as ImageIcon,
  Video,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  X,
  Play,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { useComfy } from '../../context/ComfyContext';
import { StatusBanner } from '../common/StatusBanner';
import { OutputMedia } from '../../types/comfy';

interface GalleryPageProps {
  setActiveTab: (tab: string) => void;
  selectedMediaId?: string | null;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  setActiveTab,
  selectedMediaId,
}) => {
  const { galleryItems, isLoadingGallery, refreshHistory, isOnline } = useComfy();

  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMedia, setActiveMedia] = useState<OutputMedia | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Auto-select if selectedMediaId passed
  React.useEffect(() => {
    if (selectedMediaId) {
      const found = galleryItems.find((i) => i.id === selectedMediaId);
      if (found) setActiveMedia(found);
    }
  }, [selectedMediaId, galleryItems]);

  const filteredItems = galleryItems.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.filename.toLowerCase().includes(q) ||
        item.promptId.toLowerCase().includes(q) ||
        item.workflowName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = (item: OutputMedia) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <StatusBanner onOpenSettings={() => setActiveTab('settings')} />

      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Images className="w-5 h-5 text-indigo-400" />
            Output Gallery
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Browse, inspect metadata, and download images and MiniMax H3 videos from your local ComfyUI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshHistory()}
            disabled={isLoadingGallery}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGallery ? 'animate-spin' : ''}`} />
            Sync History
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center rounded-xl bg-zinc-900 p-1 border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Media ({galleryItems.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              filterType === 'image'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Images ({galleryItems.filter((i) => i.type === 'image').length})
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              filterType === 'video'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Videos ({galleryItems.filter((i) => i.type === 'video').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or prompt ID..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveMedia(item)}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 hover:border-indigo-500/50 cursor-pointer transition-all shadow-md"
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full bg-black">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              )}

              {/* Tag pill */}
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 text-zinc-200 backdrop-blur-md border border-white/10">
                  {item.type}
                </span>
              </div>

              {/* Hover overlay with filename and actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                <p className="text-xs font-semibold text-white truncate">
                  {item.filename}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">
                  Prompt #{item.promptId.substring(0, 8)}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(item.url);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-center space-y-3">
          <Images className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-sm font-semibold text-zinc-200">
            {galleryItems.length === 0 ? 'No generations found' : 'No items match filter'}
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isOnline
              ? 'When ComfyUI executes your image or MiniMax H3 video workflows, outputs will stream here directly.'
              : 'Connect your local ComfyUI instance in Settings to load previous outputs from your output folder.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setActiveTab('generate-image')}
              className="text-xs px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium"
            >
              Generate Image
            </button>
            <button
              onClick={() => setActiveTab('generate-video')}
              className="text-xs px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Generate Video
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Metadata Inspector Modal */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveMedia(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Viewport */}
            <div className="flex-1 bg-black/90 flex items-center justify-center p-4 min-h-[300px] max-h-[55vh] md:max-h-none overflow-hidden">
              {activeMedia.type === 'video' ? (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ) : (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.filename}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              )}
            </div>

            {/* Metadata & Actions Sidebar */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-4 space-y-4 overflow-y-auto max-h-[40vh] md:max-h-none">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {activeMedia.type} Output
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5 break-all">
                  {activeMedia.filename}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  {activeMedia.workflowName}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activeMedia)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={() => handleCopyUrl(activeMedia.url)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Copy ComfyUI media URL"
                >
                  {copiedUrl ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={activeMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Open raw in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Metadata Details */}
              <div className="pt-2 border-t border-zinc-800 space-y-2 text-xs">
                <h4 className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
                  Generation Metadata
                </h4>

                <div className="p-3 rounded-xl bg-zinc-850/80 border border-zinc-800 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Prompt ID:</span>
                    <span className="text-zinc-200 select-all truncate max-w-[140px]">
                      {activeMedia.promptId}
                    </span>
                  </div>

                  {activeMedia.nodeId && (
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Output Node:</span>
                      <span className="text-zinc-200">#{activeMedia.nodeId}</span>
                    </div>
                  )}

                  {activeMedia.subfolder && (
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Subfolder:</span>
                      <span className="text-zinc-200">{activeMedia.subfolder}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Timestamp:</span>
                    <span className="text-zinc-300">
                      {new Date(activeMedia.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
