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

  // Local State
  const [videoSrc, setVideoSrc] = useState<string>('');
  const localVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // YouTube State
  const [ytVideoId, setYtVideoId] = useState<string>('jt7AF2RCMhg');
  const ytPlayerRefs = useRef<(YouTubePlayer | null)[]>([]);

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
    <div className="flex h-screen w-screen bg-bg-dark text-text-main font-[Inter,system-ui,sans-serif] overflow-hidden">
      <aside className="w-[300px] bg-bg-panel border-r border-border-color flex flex-col z-10">
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
        />
      </aside>

      <main className="flex-1 grid grid-cols-2 grid-rows-2 bg-black">
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
              />
            ))}
      </main>
    </div>
  );
}

export default App;
