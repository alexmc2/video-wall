import { useState, useRef, useEffect } from 'react';
import { VideoTile } from './components/VideoTile';
import { YouTubeTile } from './components/YouTubeTile';
import type { YouTubePlayer } from './components/YouTubeTile';
import { ControlPanel } from './components/ControlPanel';
import type { SourceMode } from './components/ControlPanel';
import { useLocalSync } from './hooks/useLocalSync';
import { useYouTubeSync } from './hooks/useYouTubeSync';
import { useDirector } from './hooks/useDirector';

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
  // const [isPlaying, setIsPlaying] = useState(false); // Managed by Director now
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Local State
  const [videoSrc, setVideoSrc] = useState<string>('');
  const localVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // YouTube State
  const [ytVideoId, setYtVideoId] = useState<string>('5IsSpAOD6K8');
  const ytPlayerRefs = useRef<(YouTubePlayer | null)[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Load API
  useLoadYouTubeScript();

  // Sync Engines moved below

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    // setIsPlaying(false);
  };

  const togglePlay = () => {
    // setIsPlaying(!isPlaying);
    requestPlay();
  };

  const { playbackState, requestPlay, signalReady } = useDirector(
    4, // 4 tiles
    () => {}, // setIsPlaying(true) - no longer needed as local state
    () => {} // setIsPlaying(false)
  );

  // Sync Engines need to know if we are "playing" in the engine sense.
  // The engine should run when we are PLAYING.
  // When BUFFERING, the engine should effectively be paused/idle or handled by the buffering logic.

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
    // setIsPlaying(false);
    setSourceMode(mode);
    // Reset refs on mode switch?
    // Actually we just persist them, but the layout unmounts components so refs might need care.
    // React refs callback will handle re-assignment on mount.
    localVideoRefs.current = [];
    ytPlayerRefs.current = [];
  };

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
          fixed inset-y-0 left-0 z-40 bg-bg-panel border-r border-border-color flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 overflow-hidden
          ${isSidebarOpen ? 'md:w-[320px]' : 'md:w-0 md:border-r-0'}
        `}
      >
        <div className="w-full flex-1 overflow-y-auto">
          {' '}
          {/* Inner wrapper fixed width */}
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
                // setIsPlaying(false);
              }}
              isSyncActive={isSyncActive}
              onToggleSync={setIsSyncActive}
              playbackState={playbackState}
              onTogglePlay={togglePlay}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
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
          className="hidden md:flex absolute top-4 left-4 z-50 p-2 bg-bg-panel border border-border-color text-white rounded hover:bg-gray-700 transition-colors shadow-lg"
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

      {/* Main Content */}
      <main
        className={`flex-1 grid grid-cols-2 grid-rows-2 bg-black w-full h-full transition-all duration-300`}
      >
        {sourceMode === 'local'
          ? Array.from({ length: 4 }).map((_, i) => (
              <VideoTile
                key={`local-${i}`}
                src={videoSrc}
                ref={(el) => {
                  localVideoRefs.current[i] = el;
                }}
                muted={isMuted}
                shouldBuffer={playbackState === 'BUFFERING'}
                onReady={() => signalReady(i)}
              />
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <YouTubeTile
                key={`yt-${i}`}
                videoId={ytVideoId}
                ref={(player) => {
                  ytPlayerRefs.current[i] = player;
                }}
                muted={isMuted}
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
