import React, { useState, useRef } from 'react';
import type { QueueItem } from '../types';

interface PlayQueueProps {
  queue: QueueItem[];
  currentlyPlaying: QueueItem | null;
  sourceMode: 'local' | 'youtube';
  onAddToQueue: (item: Omit<QueueItem, 'id' | 'addedAt'>) => boolean;
  onRemoveFromQueue: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onPlayNext: () => void;
}

export const PlayQueue: React.FC<PlayQueueProps> = ({
  queue,
  currentlyPlaying,
  sourceMode,
  onAddToQueue,
  onRemoveFromQueue,
  onMoveUp,
  onMoveDown,
  onPlayNext,
}) => {
  const [ytInput, setYtInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddYouTube = () => {
    if (!ytInput.trim()) return;

    let videoId = ytInput.trim();
    let videoName = videoId;

    // Extract video ID from URL if needed
    try {
      const url = new URL(ytInput);
      if (url.hostname.includes('youtube.com')) {
        videoId = url.searchParams.get('v') || videoId;
      } else if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1) || videoId;
      }
      videoName = `YouTube: ${videoId}`;
    } catch {
      // Input was not a URL, treat as video ID
      videoName = `YouTube: ${videoId}`;
    }

    const success = onAddToQueue({
      type: 'youtube',
      name: videoName,
      source: videoId,
    });

    if (success) {
      setYtInput('');
      setError(null);
    } else {
      setError('Queue is full (max 15 items)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);

      const success = onAddToQueue({
        type: 'local',
        name: file.name,
        source: url,
      });

      if (success) {
        setError(null);
      } else {
        setError('Queue is full (max 15 items)');
        URL.revokeObjectURL(url); // Clean up if not added
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Now Playing */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
          Now Playing
        </label>
        <div className="bg-gray-800 rounded p-3 border border-gray-700">
          {currentlyPlaying ? (
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  currentlyPlaying.type === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {currentlyPlaying.type === 'youtube' ? 'YT' : 'LOCAL'}
              </span>
              <span className="text-sm text-white truncate flex-1">
                {currentlyPlaying.name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-dim italic">
              No video playing
            </span>
          )}
        </div>
      </div>

      {/* Add to Queue */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
          Add to Queue
        </label>

        {sourceMode === 'youtube' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={ytInput}
              onChange={(e) => setYtInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddYouTube()}
              className="flex-1 bg-slate-700 border border-slate-600 text-white p-2 rounded text-sm focus:outline-none"
              placeholder="YouTube URL or ID"
            />
            <button
              onClick={handleAddYouTube}
              className="bg-red-600 text-white border-none px-4 rounded cursor-pointer font-bold text-xs hover:bg-red-700 transition-colors"
            >
              ADD
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="flex-1 text-text-dim text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#333] file:text-white file:cursor-pointer hover:file:bg-[#444] transition-colors"
            />
          </div>
        )}

        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {/* Queue List */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
            Queue ({queue.length}/15)
          </label>
          {queue.length > 0 && (
            <button
              onClick={onPlayNext}
              className="text-xs text-accent-green hover:underline"
            >
              PLAY NEXT
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {queue.length === 0 ? (
            <span className="text-xs text-text-dim italic p-2">
              Queue is empty. Add videos above.
            </span>
          ) : (
            queue.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 bg-gray-800 p-2 rounded hover:bg-gray-700 group"
              >
                {/* Position */}
                <span className="text-xs text-text-dim w-5 text-center">
                  {index + 1}
                </span>

                {/* Type Badge */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    item.type === 'youtube'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {item.type === 'youtube' ? 'YT' : 'LOCAL'}
                </span>

                {/* Name */}
                <span className="text-xs text-white truncate flex-1 min-w-0">
                  {item.name}
                </span>

                {/* Controls */}
                <div className="flex gap-1 shrink-0">
                  {/* Move Up */}
                  <button
                    onClick={() => onMoveUp(item.id)}
                    disabled={index === 0}
                    className={`p-1 rounded text-xs transition-colors ${
                      index === 0
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                    title="Move up"
                  >
                    ▲
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => onMoveDown(item.id)}
                    disabled={index === queue.length - 1}
                    className={`p-1 rounded text-xs transition-colors ${
                      index === queue.length - 1
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                    title="Move down"
                  >
                    ▼
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="p-1 rounded text-xs text-red-500 hover:text-red-400 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
