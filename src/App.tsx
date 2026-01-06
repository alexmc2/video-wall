import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoTile } from './components/VideoTile';
import { YouTubeTile } from './components/YouTubeTile';
import type { YouTubePlayer } from './components/YouTubeTile';
import { ControlPanel } from './components/ControlPanel';
import type { SourceMode, GridConfig } from './components/ControlPanel';
import { useLocalSync } from './hooks/useLocalSync';
import { useYouTubeSync } from './hooks/useYouTubeSync';
import { useDirector } from './hooks/useDirector';
import { usePlayQueue } from './hooks/usePlayQueue';

// Helper to load YT Script once
const useLoadYouTubeScript = () => {
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);
};

function App() {
  const [sourceMode, setSourceMode] = useState<SourceMode>('local');
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [audioSource, setAudioSource] = useState<number | null>(null); // null = all muted, number = index
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Grid Config State
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 2,
    cols: 2,
    aspectRatio: 1.77, // 16:9
    isAutoFit: false,
  });

  // Calculate total tiles
  const totalTiles = gridConfig.rows * gridConfig.cols;

  // Local State
  const [videoSrc, setVideoSrc] = useState<string>('');
  const localVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // YouTube State
  const [ytVideoId, setYtVideoId] = useState<string>('5IsSpAOD6K8');
  const ytPlayerRefs = useRef<(YouTubePlayer | null)[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Play Queue
  const {
    queue,
    currentlyPlaying,
    addToQueue,
    removeFromQueue,
    moveUp,
    moveDown,
    playNext,
  } = usePlayQueue();

  // Load API
  useLoadYouTubeScript();

  // Handle Auto-Fit
  const performGridOptimization = useCallback((currentAspectRatio: number) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Default to 16:9 if 0 or invalid
    const ratio = currentAspectRatio || 1.77;

    // Target a sensible minimum tile width to ensure we have "multiple videos"
    // The user reference code suggests filling the screen.
    // Let's aim for a tile width around 320px - 480px depending on density.
    // We want to maximize density without making them too small.
    // Let's target roughly 320px width minimum.
    const TARGET_TILE_WIDTH = 320;

    let bestCols = Math.floor(width / TARGET_TILE_WIDTH);
    // Ensure at least 1 col
    bestCols = Math.max(1, bestCols);

    // Calculated height based on ratio
    const tileHeight = width / bestCols / ratio;

    let bestRows = Math.floor(height / tileHeight);
    // Ensure at least 1 row
    bestRows = Math.max(1, bestRows);

    // If the grid is too sparse (e.g. 1x1 on a large screen), force a minimum density
    // For a "Video Wall" feel, we usually want at least 2x2 if space allows
    if (width > 800 && height > 600) {
      bestCols = Math.max(2, bestCols);
      bestRows = Math.max(2, bestRows);
    }

    setGridConfig((prev) => {
      // Avoid update if same
      if (prev.rows === bestRows && prev.cols === bestCols) {
        return prev;
      }
      return { ...prev, rows: bestRows, cols: bestCols };
    });
  }, []); // Dependencies are intentionally empty, arguments passed in.

  // Trigger auto-fit on resize or config change
  useEffect(() => {
    if (!gridConfig.isAutoFit) return;

    const runOptimization = () =>
      performGridOptimization(gridConfig.aspectRatio);

    // Run immediately
    runOptimization();

    const handleResize = () => runOptimization();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridConfig.isAutoFit, gridConfig.aspectRatio, performGridOptimization]);

  // Expose manual trigger
  const optimizeGrid = () => performGridOptimization(gridConfig.aspectRatio);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
  };

  const togglePlay = () => {
    requestPlay();
  };

  const { playbackState, requestPlay, signalReady } = useDirector(
    totalTiles,
    () => {},
    () => {}
  );

  useLocalSync({
    videosRef: localVideoRefs,
    isSyncEnabled: isSyncActive && sourceMode === 'local',
    isPlaying: playbackState === 'PLAYING' && sourceMode === 'local',
  });

  useYouTubeSync({
    playersRef: ytPlayerRefs,
    isSyncEnabled: isSyncActive && sourceMode === 'youtube',
    isPlaying: playbackState === 'PLAYING' && sourceMode === 'youtube',
  });

  const handleModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    localVideoRefs.current = [];
    ytPlayerRefs.current = [];
    setAudioSource(null); // Reset audio on mode switch
  };

  // Handle playing next video from queue
  const handlePlayNext = useCallback(() => {
    const nextItem = playNext();
    if (!nextItem) return;

    // Switch mode and load video based on type
    if (nextItem.type === 'local') {
      setSourceMode('local');
      setVideoSrc(nextItem.source);
    } else {
      setSourceMode('youtube');
      setYtVideoId(nextItem.source);
    }
  }, [playNext]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-bg-dark text-text-main font-[Inter,system-ui,sans-serif] overflow-hidden relative">
      {/* Mobile Header / Toggle Button Overlay */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded hover:bg-black/80 transition-colors md:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-[#121827] border-r border-border-color flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 overflow-hidden
          ${isSidebarOpen ? 'md:w-[320px]' : 'md:w-0 md:border-r-0'}
        `}
      >
        <div className="w-full flex-1 overflow-y-auto">
          <div className="relative">
            {/* Desktop Collapse Toggle - Inside Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex absolute top-4 right-4 p-1 text-gray-400 hover:text-white"
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

            <ControlPanel
              sourceMode={sourceMode}
              onModeChange={handleModeChange}
              onFileSelect={handleFileSelect}
              onVideoIdChange={(id) => {
                setYtVideoId(id);
              }}
              isSyncActive={isSyncActive}
              onToggleSync={setIsSyncActive}
              playbackState={playbackState}
              onTogglePlay={togglePlay}
              audioSource={audioSource}
              onAudioSourceChange={setAudioSource}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              gridConfig={gridConfig}
              onGridConfigChange={setGridConfig}
              onOptimizeGrid={optimizeGrid}
              // Queue props
              queue={queue}
              currentlyPlaying={currentlyPlaying}
              onAddToQueue={addToQueue}
              onRemoveFromQueue={removeFromQueue}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onPlayNext={handlePlayNext}
            />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Expand Button (Floating when sidebar is closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hidden md:flex absolute top-4 left-4 z-50 p-2 bg-#121827] border border-border-color text-white rounded hover:bg-gray-700 transition-colors shadow-lg"
          title="Expand Sidebar"
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
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {/* Main Content - Dynamic Grid */}
      <main
        className={`flex-1 grid bg-black w-full h-full transition-all duration-300`}
        style={{
          gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridConfig.rows}, minmax(0, 1fr))`,
        }}
      >
        {sourceMode === 'local'
          ? Array.from({ length: totalTiles }).map((_, i) => (
              <VideoTile
                key={`local-${i}`}
                src={videoSrc}
                ref={(el) => {
                  localVideoRefs.current[i] = el;
                }}
                muted={audioSource !== i}
                shouldBuffer={playbackState === 'BUFFERING'}
                onReady={() => signalReady(i)}
                scale={zoomLevel}
              />
            ))
          : Array.from({ length: totalTiles }).map((_, i) => (
              <YouTubeTile
                key={`yt-${i}`}
                videoId={ytVideoId}
                ref={(player) => {
                  ytPlayerRefs.current[i] = player;
                }}
                muted={audioSource !== i}
                shouldBuffer={playbackState === 'BUFFERING'}
                onReady={() => signalReady(i)}
                scale={zoomLevel}
              />
            ))}
      </main>
    </div>
  );
}

export default App;
