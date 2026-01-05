import React, { useState } from 'react';

export type SourceMode = 'local' | 'youtube';

interface ControlPanelProps {
  // Mode Change
  sourceMode: SourceMode;
  onModeChange: (mode: SourceMode) => void;

  // Local Props
  onFileSelect: (file: File) => void;

  // YouTube Props
  onVideoIdChange: (id: string) => void;

  // Shared Props
  isSyncActive: boolean;
  onToggleSync: (active: boolean) => void;
  playbackState: 'IDLE' | 'BUFFERING' | 'PLAYING' | 'PAUSED';
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  // YouTube Zoom
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  sourceMode,
  onModeChange,
  onFileSelect,
  onVideoIdChange,
  isSyncActive,
  onToggleSync,
  playbackState,
  onTogglePlay,
  isMuted,
  onToggleMute,
  zoomLevel,
  onZoomChange,
}) => {
  const [ytInput, setYtInput] = useState('5IsSpAOD6K8');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleYtLoad = () => {
    let id = ytInput;
    try {
      const url = new URL(ytInput);
      if (url.hostname.includes('youtube.com')) {
        id = url.searchParams.get('v') || id;
      } else if (url.hostname.includes('youtu.be')) {
        id = url.pathname.slice(1) || id;
      }
    } catch {
      // Input was not a URL, proceeding as if it is an ID
    }
    onVideoIdChange(id);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <h2 className="m-0 text-xl font-bold text-white border-b border-border-color pb-4">
        Control Deck
      </h2>

      {/* Mode Tabs */}
      <div className="flex bg-gray-800 rounded mb-4 overflow-hidden border border-gray-700">
        <button
          className={`flex-1 py-2 text-sm font-bold transition-colors ${
            sourceMode === 'local'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => onModeChange('local')}
        >
          LOCAL
        </button>
        <button
          className={`flex-1 py-2 text-sm font-bold transition-colors ${
            sourceMode === 'youtube'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => onModeChange('youtube')}
        >
          YOUTUBE
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {sourceMode === 'local' ? (
          <>
            <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
              Local File
            </label>
            <div className="overflow-hidden">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full text-text-dim text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#333] file:text-white file:cursor-pointer hover:file:bg-[#444] transition-colors"
              />
            </div>
          </>
        ) : (
          <>
            <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
              YouTube URL / ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                className="flex-1 bg-[#333] border border-[#444] text-white p-2 rounded text-sm"
                placeholder="ID or URL"
              />
              <button
                onClick={handleYtLoad}
                className="bg-[#444] text-white border-none px-4 rounded cursor-pointer font-bold text-xs hover:bg-[#555]"
              >
                LOAD
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Try: 5IsSpAOD6K8</p>

            <div className="mt-2">
              <label className="text-xs uppercase tracking-wider text-text-dim font-semibold flex justify-between">
                <span>Zoom / Crop</span>
                <span className="text-white">{zoomLevel.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="w-full mt-1 accent-accent-red cursor-pointer"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
          Playback
        </label>
        <button
          onClick={onTogglePlay}
          disabled={playbackState === 'BUFFERING'}
          className={`w-full py-3 border-none rounded-md font-bold cursor-pointer text-white transition-colors text-base ${
            playbackState === 'PLAYING'
              ? 'bg-accent-red hover:bg-red-700'
              : 'bg-accent-green hover:bg-green-700'
          } ${
            playbackState === 'BUFFERING' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {playbackState === 'PLAYING'
            ? 'PAUSE'
            : playbackState === 'BUFFERING'
            ? 'BUFFERING...'
            : 'PLAY'}
        </button>

        <button
          onClick={onToggleMute}
          className={`w-full py-3 border-none rounded-md font-bold cursor-pointer text-white transition-colors text-base mt-2 ${
            isMuted
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isMuted ? 'UNMUTE SOUND' : 'MUTE SOUND'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
          Sync Engine
        </label>
        <div className="flex justify-between items-center bg-white/5 p-3 rounded-md">
          <span>Active Correction</span>
          <button
            onClick={() => onToggleSync(!isSyncActive)}
            className={`relative w-12 h-6 rounded-full border-none cursor-pointer transition-colors ${
              isSyncActive ? 'bg-accent-blue' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                isSyncActive ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
