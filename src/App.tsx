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

  // Playback Options
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [loopQueue, setLoopQueue] = useState(false);

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
  // Scaling State
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  // Async Sync Gap (ms)
  const [syncGap, setSyncGap] = useState(0);

  // Time Tracking
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Play Queue
  const {
    queue,
    currentlyPlaying,
    addToQueue,
    removeFromQueue,
    moveUp,
    moveDown,
    reorderQueue,
    playNext,
  } = usePlayQueue();

  // Load API
  useLoadYouTubeScript();

  // Polling for Time Updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (sourceMode === 'local') {
        const master = localVideoRefs.current[0];
        if (master) {
          setCurrentTime(master.currentTime);
          setDuration(master.duration || 0);
        }
      } else {
        const master = ytPlayerRefs.current[0];
        if (master && master.getCurrentTime) {
          setCurrentTime(master.getCurrentTime());
          setDuration(master.getDuration ? master.getDuration() : 0);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [sourceMode]);

  const handleSeek = (time: number) => {
    // Optimistic update
    setCurrentTime(time);

    if (sourceMode === 'local') {
      localVideoRefs.current.forEach((v) => {
        if (v) v.currentTime = time;
      });
    } else {
      ytPlayerRefs.current.forEach((p) => {
        if (p && p.seekTo) p.seekTo(time, true);
      });
    }
  };

  const handleRestart = () => {
    handleSeek(0);
    if (playbackState !== 'PLAYING' && playbackState !== 'BUFFERING') {
      requestPlay();
    }
  };

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
    syncGap,
  });

  useYouTubeSync({
    playersRef: ytPlayerRefs,
    isSyncEnabled: isSyncActive && sourceMode === 'youtube',
    isPlaying: playbackState === 'PLAYING' && sourceMode === 'youtube',
    syncGap,
  });

  const handleModeChange = (mode: SourceMode) => {
    setSourceMode(mode);
    localVideoRefs.current = [];
    ytPlayerRefs.current = [];
    setAudioSource(null); // Reset audio on mode switch
  };

  // Handle playing next video from queue
  const handleVideoEnded = useCallback(() => {
    if (!autoAdvance) return;

    // Play next item
    const nextItem = playNext();

    if (nextItem) {
      // If Looping is enabled, add it back to the end of the queue
      if (loopQueue) {
        addToQueue({
          type: nextItem.type,
          name: nextItem.name,
          source: nextItem.source,
        });
      }

      if (nextItem.type === 'local') {
        setSourceMode('local');
        setVideoSrc(nextItem.source);
      } else {
        setSourceMode('youtube');
        setYtVideoId(nextItem.source);
      }
    }
  }, [autoAdvance, loopQueue, playNext, addToQueue]);

  // Determine loop behavior: Loop current if queue is empty AND autoAdvance is true?
  // User asked: "if automatically, should they be looped".
  // If queue is empty:
  // - If loopQueue is true, we probably want to loop the current video (single loop behavior if queue empty)
  // - OR we just stop.
  // - But my previous logic was "Loop current if queue is empty".
  // - Let's refine: If AutoAdvance + LoopQueue + QueueEmpty -> Loop current video?
  // - Or does "Loop Queue" imply strictly the queue?
  // - If I have 1 item in queue, it plays, re-adds to queue, then plays again. So it effectively loops.
  // - If I have 0 items in queue and playing one, it's not in the queue.
  // - So "Queue Empty" logic relies on standard looping.
  // - I'll keep "shouldLoop = queue.length === 0" logic BUT conditionally on autoAdvance.
  // - If autoAdvance is OFF, video should stop (no loop).
  // - If autoAdvance is ON and Queue Empty:
  //   - If loopQueue is ON -> Loop current? (Maybe).
  //   - If loopQueue is OFF -> Stop.
  const shouldLoopCurrent = autoAdvance && queue.length === 0 && loopQueue;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-bg-dark text-text-main font-[Inter,system-ui,sans-serif] overflow-hidden relative">
      {/* Mobile Header / Toggle Button Overlay */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
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
      )}

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
            <ControlPanel
              onCollapse={() => setIsSidebarOpen(false)}
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
              scaleX={scaleX}
              onScaleXChange={setScaleX}
              scaleY={scaleY}
              onScaleYChange={setScaleY}
              syncGap={syncGap}
              onSyncGapChange={setSyncGap}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              onRestart={handleRestart}
              currentVideoSrc={videoSrc}
              currentVideoId={ytVideoId}
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
              onReorderQueue={reorderQueue}
              onPlayNext={() => {
                // Manual Play Next triggers standard logic (ignoring autoAdvance flag)
                const nextItem = playNext();
                if (nextItem) {
                  if (loopQueue) {
                    addToQueue({
                      type: nextItem.type,
                      name: nextItem.name,
                      source: nextItem.source,
                    });
                  }
                  if (nextItem.type === 'local') {
                    setSourceMode('local');
                    setVideoSrc(nextItem.source);
                  } else {
                    setSourceMode('youtube');
                    setYtVideoId(nextItem.source);
                  }
                }
              }}
              autoAdvance={autoAdvance}
              onToggleAutoAdvance={setAutoAdvance}
              loopQueue={loopQueue}
              onToggleLoopQueue={setLoopQueue}
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
                scaleX={scaleX}
                scaleY={scaleY}
                // Only Master Tile triggers navigation
                onEnded={i === 0 ? handleVideoEnded : undefined}
                // Loop if queue is empty or explicit loop requested
                {...(i === 0
                  ? { loop: shouldLoopCurrent }
                  : { loop: shouldLoopCurrent })}
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
                scaleX={scaleX}
                scaleY={scaleY}
                onEnded={i === 0 ? handleVideoEnded : undefined}
                // YouTube looping is handled via onEnded seeking if we want, or we can trust the component if we added loop prop support?
                // We added onEnded. The YouTubeTile doesn't natively support "loop" prop for single video, but we can restart it manually.
                // However, standard <video> 'loop' attribute handles it automatically.
                // For YouTube, if we want loop, handleVideoEnded will be called (shouldLoop=true means queue empty).
                // If queue empty, handleVideoEnded calls playNext -> returns null.
                // We need to REPLAY current if null returned?
                // Or better: pass a boolean to YouTubeTile to auto-seek-0 on end?
                // Let's rely on handleVideoEnded restarting it if needed.
              />
            ))}
      </main>
    </div>
  );
}

export default App;
