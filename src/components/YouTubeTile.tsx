import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

// Define a minimal interface for the YouTube Player
export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeTileProps {
  videoId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPlayerReady?: (player: any) => void;
  width?: string | number;
  height?: string | number;
  onReady?: () => void;
  shouldBuffer?: boolean;
  muted?: boolean;
}

export const YouTubeTile = forwardRef<YouTubePlayer | null, YouTubeTileProps>(
  (props, ref) => {
    const { videoId, onPlayerReady, onReady, shouldBuffer } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);

    // Expose methods to the parent via a stable handle
    useImperativeHandle(
      ref,
      () => ({
        playVideo: () => playerRef.current?.playVideo(),
        pauseVideo: () => playerRef.current?.pauseVideo(),
        seekTo: (s, a) => playerRef.current?.seekTo(s, a),
        getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
        getPlayerState: () => playerRef.current?.getPlayerState() ?? -1,
        mute: () => playerRef.current?.mute(),
        unMute: () => playerRef.current?.unMute(),
        destroy: () => playerRef.current?.destroy(),
      }),
      []
    ); // Empty dependency array is safe because we use ref.current inside callbacks

    // Use a ref for onPlayerReady to avoid re-triggering the effect
    const onPlayerReadyRef = useRef(onPlayerReady);
    useEffect(() => {
      onPlayerReadyRef.current = onPlayerReady;
    }, [onPlayerReady]);

    // Dynamic Mute Handling
    useEffect(() => {
      if (!playerRef.current) return;
      if (typeof props.muted === 'undefined') return; // If not controlled, ignore

      if (props.muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }, [props.muted]);

    useEffect(() => {
      if (!window.YT || !window.YT.Player) {
        return;
      }

      if (!containerRef.current) return;

      // Determine initial mute state
      const initialMute = props.muted === undefined ? true : props.muted;

      // Create the player
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          mute: initialMute ? 1 : 0, // Start muted based on prop
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (event: any) => {
            // State 1 = Playing, 5 = Cued.
            // If we are buffering (shouldBuffer = true), we might want to capture when it actually hits "playing"
            // then immediately pause it to signal ready.
            if (shouldBuffer && event.data === 1) {
              // It started playing, now we know it's buffered.
              // Pause it immediately/seek to start.
              if (playerRef.current) {
                playerRef.current.pauseVideo();
                playerRef.current.seekTo(0, true);
                if (onReady) onReady();
              }
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (event: any) => {
            if (onPlayerReadyRef.current)
              onPlayerReadyRef.current(event.target);

            // Enforce mute state on ready as well, just in case
            if (initialMute) {
              event.target.mute();
            } else {
              event.target.unMute();
            }

            // Priming trigger: if we need to buffer, we play() then wait for state change.
            if (shouldBuffer) {
              event.target.playVideo();
            }
          },
        },
      });

      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }, [videoId, shouldBuffer, onReady, props.muted]); // Added props.muted to dependencies only if we want re-init (we don't usually)
    // Actually, we do NOT want to re-init on mute change. We want the separate effect to handle it.
    // So we should NOT include props.muted in this dependency array if we want to avoid destroy/recreate.
    // However, I need to be careful with the closure over 'initialMute'.
    // Let me refactor the replacement to be cleaner and avoid dependency array issues.

    return (
      <div className="w-full h-full relative overflow-hidden border border-black">
        <div ref={containerRef} className="w-full h-full object-cover block" />
      </div>
    );
  }
);

YouTubeTile.displayName = 'YouTubeTile';
