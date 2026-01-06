import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { PlayQueue } from './PlayQueue';
import type { QueueItem } from '../types';

export type SourceMode = 'local' | 'youtube';

export interface GridConfig {
  rows: number;
  cols: number;
  aspectRatio: number; // e.g. 1.77
  isAutoFit: boolean;
}

interface ControlPanelProps {
  // Mode Change
  sourceMode: SourceMode;

  onModeChange: (mode: SourceMode) => void;
  onCollapse?: () => void;

  // Local Props
  onFileSelect: (file: File) => void;

  // YouTube Props
  onVideoIdChange: (id: string) => void;

  // Shared Props
  isSyncActive: boolean;
  onToggleSync: (active: boolean) => void;
  playbackState: 'IDLE' | 'BUFFERING' | 'PLAYING' | 'PAUSED';
  onTogglePlay: () => void;
  audioSource: number | null; // null = all muted
  onAudioSourceChange: (index: number | null) => void;
  // Scaling
  scaleX: number;
  onScaleXChange: (val: number) => void;
  scaleY: number;
  onScaleYChange: (val: number) => void;
  // Sync
  syncGap: number;
  onSyncGapChange: (val: number) => void;
  // Time
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onRestart: () => void;
  // Preview Info
  currentVideoSrc: string;
  currentVideoId: string;

  // Grid Props
  gridConfig: GridConfig;
  onGridConfigChange: (config: GridConfig) => void;
  onOptimizeGrid: () => void; // Manually trigger optimization

  // Queue Props
  queue: QueueItem[];
  currentlyPlaying: QueueItem | null;
  onAddToQueue: (item: Omit<QueueItem, 'id' | 'addedAt'>) => boolean;
  onRemoveFromQueue: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onPlayNext: () => void;
  // Playback Options
  autoAdvance: boolean;
  onToggleAutoAdvance: (enabled: boolean) => void;
  loopQueue: boolean;
  onToggleLoopQueue: (enabled: boolean) => void;
}

interface SavedPreset {
  gridConfig: GridConfig;
  sourceMode: SourceMode;
  ytInput: string;
  scaleX: number;
  scaleY: number;
  syncGap: number;
  timestamp: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  sourceMode,
  onModeChange,
  onCollapse,
  onFileSelect,
  onVideoIdChange,
  isSyncActive,
  onToggleSync,
  playbackState,
  onTogglePlay,
  audioSource,
  onAudioSourceChange,
  scaleX,
  onScaleXChange,
  scaleY,
  onScaleYChange,
  syncGap,
  onSyncGapChange,
  currentTime,
  duration,
  onSeek,
  onRestart,
  currentVideoSrc,
  currentVideoId,
  gridConfig,
  onGridConfigChange,
  onOptimizeGrid,
  // Queue
  queue,
  currentlyPlaying,
  onAddToQueue,
  onRemoveFromQueue,
  onMoveUp,
  onMoveDown,
  onReorderQueue,
  onPlayNext,
  autoAdvance,
  onToggleAutoAdvance,
  loopQueue,
  onToggleLoopQueue,
}) => {
  const [ytInput, setYtInput] = useState('5IsSpAOD6K8');

  // Preset Management
  // Preset Management
  const [savedPresets, setSavedPresets] = useState<Record<string, SavedPreset>>(
    () => {
      try {
        const stored = localStorage.getItem('vw_presets');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
  );

  const handleSavePreset = (name: string) => {
    const newPreset: SavedPreset = {
      gridConfig,
      sourceMode,
      ytInput,
      scaleX,
      scaleY,
      syncGap,
      timestamp: Date.now(),
    };
    const updated = { ...savedPresets, [name]: newPreset };
    setSavedPresets(updated);
    localStorage.setItem('vw_presets', JSON.stringify(updated));
  };

  const handleLoadPreset = (name: string) => {
    const preset = savedPresets[name];
    if (!preset) return;

    if (preset.gridConfig) onGridConfigChange(preset.gridConfig);
    if (preset.sourceMode) onModeChange(preset.sourceMode);
    if (preset.ytInput) {
      setYtInput(preset.ytInput);
      onVideoIdChange(preset.ytInput);
    }
    if (preset.scaleX) onScaleXChange(preset.scaleX);
    if (preset.scaleY) onScaleYChange(preset.scaleY);
    if (preset.syncGap) onSyncGapChange(preset.syncGap);
  };

  const handleDeletePreset = (name: string) => {
    const updated = { ...savedPresets };
    delete updated[name];
    setSavedPresets(updated);
    localStorage.setItem('vw_presets', JSON.stringify(updated));
  };

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
      <div className="sticky top-0 z-50 bg-[#121827] -mx-6 -mt-6 px-6 py-4 flex justify-between items-center border-b border-border-color shadow-sm">
        <h2 className="m-0 text-xl font-bold text-sky-400 tracking-wider">
          SYNCHRONISER
        </h2>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1 text-gray-100 hover:text-white transition-colors bg-sky-500 rounded"
            title="Collapse Sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={[]} className="w-full">
        {/* SOURCE */}
        <AccordionItem value="source">
          <AccordionTrigger>VIDEO SOURCE</AccordionTrigger>
          <AccordionContent>
            <div className="flex bg-gray-800 rounded mb-4 overflow-hidden border border-gray-700">
              <button
                className={`flex-1 py-2 text-sm font-bold transition-colors ${
                  sourceMode === 'local'
                    ? 'bg-sky-600 text-white'
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

            {sourceMode === 'local' ? (
              <div className="flex flex-col gap-2">
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
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
                  YouTube URL / ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    className="flex-1 bg-slate-700 border border-slate-600 text-white p-2 rounded text-sm focus:outline-none"
                    placeholder="ID or URL"
                  />
                  <button
                    onClick={handleYtLoad}
                    className="bg-slate-700 text-white border-none px-4 rounded cursor-pointer font-bold text-xs hover:bg-[#555]"
                  >
                    LOAD
                  </button>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* PLAYBACK */}
        <AccordionItem value="playback">
          <AccordionTrigger>PLAYBACK CONTROL</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              <button
                onClick={onTogglePlay}
                disabled={playbackState === 'BUFFERING'}
                className={`w-full py-3 border-none rounded-md font-bold cursor-pointer text-white transition-colors text-base ${
                  playbackState === 'PLAYING'
                    ? 'bg-accent-red hover:bg-red-700'
                    : 'bg-accent-green hover:bg-green-700'
                } ${
                  playbackState === 'BUFFERING'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {playbackState === 'PLAYING'
                  ? 'PAUSE'
                  : playbackState === 'BUFFERING'
                  ? 'BUFFERING...'
                  : 'PLAY'}
              </button>

              <button
                onClick={() =>
                  onAudioSourceChange(audioSource === null ? 0 : null)
                }
                className={`w-full py-3 border-none rounded-md font-bold cursor-pointer text-white transition-colors text-base ${
                  audioSource !== null
                    ? 'bg-sky-600 hover:bg-sky-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {audioSource !== null ? 'MUTE AUDIO' : 'UNMUTE AUDIO'}
              </button>

              <button
                onClick={onRestart}
                className="text-xs font-bold text-text-dim hover:text-white bg-transparent hover:bg-white/10 px-2 py-1 rounded self-start transition-colors"
                title="Restart Video from Beginning"
              >
                ↻ RESTART VIDEO
              </button>

              {/* SCRUBBER & PREVIEW */}
              <div className="flex flex-col gap-2 mt-1 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center bg-black/40 p-2 rounded relative overflow-hidden group">
                  {/* MINI PREVIEW */}
                  <div className="w-24 h-14 bg-black rounded overflow-hidden mr-3 shrink-0 border border-white/10">
                    {sourceMode === 'local' && currentVideoSrc ? (
                      <video
                        src={currentVideoSrc}
                        className="w-full h-full object-cover opacity-80"
                        muted
                      />
                    ) : sourceMode === 'youtube' && currentVideoId ? (
                      // Just a thumbnail for YT to be safe on API limits
                      <img
                        src={`https://img.youtube.com/vi/${currentVideoId}/mqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[10px] text-gray-500">
                        No Signal
                      </div>
                    )}
                  </div>

                  {/* Info & Time */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-mono text-sky-500 font-bold truncate">
                      {currentlyPlaying?.name ||
                        (sourceMode === 'youtube'
                          ? 'YouTube Stream'
                          : 'Local Video')}
                    </span>
                    <div className="flex justify-between text-[10px] text-text-dim font-mono">
                      <span>
                        {new Date(currentTime * 1000)
                          .toISOString()
                          .substr(14, 5)}
                      </span>
                      <span>
                        {new Date((duration || 0) * 1000)
                          .toISOString()
                          .substr(14, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SLIDER */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1 appearance-none bg-gray-600 rounded cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:hover:bg-red-500 [&::-webkit-slider-thumb]:transition-colors"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PLAY QUEUE */}
        <AccordionItem value="queue">
          <AccordionTrigger>PLAY QUEUE</AccordionTrigger>
          <AccordionContent>
            <PlayQueue
              queue={queue}
              currentlyPlaying={currentlyPlaying}
              onAddToQueue={onAddToQueue}
              onRemoveFromQueue={onRemoveFromQueue}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onReorderQueue={onReorderQueue}
              onPlayNext={onPlayNext}
              autoAdvance={autoAdvance}
              onToggleAutoAdvance={onToggleAutoAdvance}
              loopQueue={loopQueue}
              onToggleLoopQueue={onToggleLoopQueue}
            />
          </AccordionContent>
        </AccordionItem>

        {/* LAYOUT / GRID */}
        <AccordionItem value="layout">
          <AccordionTrigger>GRID CONFIGURATION</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {/* PRESETS */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
                  Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      onGridConfigChange({
                        ...gridConfig,
                        rows: 2,
                        cols: 2,
                        isAutoFit: false,
                      })
                    }
                    className={`text-xs p-2 rounded border ${
                      gridConfig.rows === 2 &&
                      gridConfig.cols === 2 &&
                      !gridConfig.isAutoFit
                        ? 'bg-sky-500 border-transparent text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    2x2
                  </button>
                  <button
                    onClick={() =>
                      onGridConfigChange({
                        ...gridConfig,
                        rows: 3,
                        cols: 4,
                        isAutoFit: false,
                      })
                    }
                    className={`text-xs p-2 rounded border ${
                      gridConfig.rows === 3 &&
                      gridConfig.cols === 4 &&
                      !gridConfig.isAutoFit
                        ? 'bg-sky-500 border-transparent text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    4x3
                  </button>
                  <button
                    onClick={() =>
                      onGridConfigChange({
                        ...gridConfig,
                        rows: 4,
                        cols: 6,
                        isAutoFit: false,
                      })
                    }
                    className={`text-xs p-2 rounded border ${
                      gridConfig.rows === 4 &&
                      gridConfig.cols === 6 &&
                      !gridConfig.isAutoFit
                        ? 'bg-sky-500 border-transparent text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    6x4
                  </button>
                </div>
              </div>

              {/* ASPECT / AUTO */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
                    Auto-Fit (Aspect)
                  </label>
                  <input
                    type="checkbox"
                    checked={gridConfig.isAutoFit}
                    onChange={(e) =>
                      onGridConfigChange({
                        ...gridConfig,
                        isAutoFit: e.target.checked,
                      })
                    }
                    className="accent-sky-500"
                  />
                </div>
                {gridConfig.isAutoFit && (
                  <div className="flex gap-2 items-center">
                    <label className="text-xs text-text-dim">Ratio:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={gridConfig.aspectRatio}
                      onChange={(e) =>
                        onGridConfigChange({
                          ...gridConfig,
                          aspectRatio: parseFloat(e.target.value) || 1.77,
                        })
                      }
                      className="w-20 bg-[#333] border border-[#444] text-white p-1 rounded text-xs"
                    />
                    <button
                      onClick={onOptimizeGrid}
                      className="flex-1 bg-sky-500 text-white text-xs py-1 rounded hover:bg-sky-600"
                    >
                      Refit
                    </button>
                  </div>
                )}
              </div>

              {/* VIDEO CROPPING / SCALING */}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10">
                <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
                  Video Adjustment (Crop/Scale)
                </label>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-dim">
                      Horizontal (X)
                    </span>
                    <span className="text-xs text-white">
                      {scaleX.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={scaleX}
                    onChange={(e) => onScaleXChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-dim">Vertical (Y)</span>
                    <span className="text-xs text-white">
                      {scaleY.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={scaleY}
                    onChange={(e) => onScaleYChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SYNC SETTINGS */}
        <AccordionItem value="sync">
          <AccordionTrigger>SYNC ENGINE</AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-md">
              <span>Active Correction</span>
              <button
                onClick={() => onToggleSync(!isSyncActive)}
                className={`relative w-12 h-6 rounded-full border-none cursor-pointer transition-colors ${
                  isSyncActive ? 'bg-sky-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                    isSyncActive ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-start mt-2 text-text-dim">
              The sync engine continuously monitors all tiles and nudges
              playback to ensure zero-latency synchronization.
            </p>

            {/* ASYNC GAP CONTROL */}
            <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase tracking-wider text-text-dim font-semibold">
                  Async Playback Gap
                </label>
                <span className="text-xs text-white font-mono">
                  {syncGap}ms
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="50"
                value={syncGap}
                onChange={(e) => onSyncGapChange(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-green"
              />
              <p className="text-[10px] text-text-dim">
                Set a delay between tiles for a ripple effect. 0ms = Perfect
                Sync.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* PRESETS MANAGER */}
        <AccordionItem value="presets">
          <AccordionTrigger>SAVED CONFIGURATIONS</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Config Name (e.g. Morning News)"
                  id="preset-name-input"
                  className="flex-1 bg-slate-700 border border-slate-600 text-white p-2 rounded text-xs focus:outline-none"
                />
                <button
                  onClick={() => {
                    const nameInput = document.getElementById(
                      'preset-name-input'
                    ) as HTMLInputElement;
                    if (nameInput.value) {
                      handleSavePreset(nameInput.value);
                      nameInput.value = '';
                    }
                  }}
                  className="bg-sky-500 text-white border-none px-3 rounded cursor-pointer font-bold text-xs hover:bg-sky-600"
                >
                  SAVE
                </button>
              </div>

              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {Object.keys(savedPresets).length === 0 && (
                  <span className="text-xs text-text-dim italic">
                    No saved presets
                  </span>
                )}
                {Object.entries(savedPresets).map(([name]) => (
                  <div
                    key={name}
                    className="flex justify-between items-center bg-gray-800 p-2 rounded hover:bg-gray-700 group"
                  >
                    <span className="text-xs text-white truncate max-w-[150px]">
                      {name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadPreset(name)}
                        className="text-xs text-accent-green hover:underline"
                      >
                        LOAD
                      </button>
                      <button
                        onClick={() => handleDeletePreset(name)}
                        className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
