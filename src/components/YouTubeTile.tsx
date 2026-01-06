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
  getDuration(): number;
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
  scaleX?: number;
  scaleY?: number;
  onEnded?: () => void;
}

export const YouTubeTile = forwardRef<YouTubePlayer | null, YouTubeTileProps>(
  (props, ref) => {
    const {
      videoId,
      onPlayerReady,
      onReady,
      shouldBuffer,
      scaleX = 1,
      scaleY = 1,
      onEnded,
    } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);

    // Expose methods to the parent via a stable handle
    useImperativeHandle(
      ref,
      () => ({
        playVideo: () => {
          if (typeof playerRef.current?.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        },
        pauseVideo: () => {
          if (typeof playerRef.current?.pauseVideo === 'function') {
            playerRef.current.pauseVideo();
          }
        },
        seekTo: (s, a) => {
          if (typeof playerRef.current?.seekTo === 'function') {
            playerRef.current.seekTo(s, a);
          }
        },
        getCurrentTime: () => {
          return typeof playerRef.current?.getCurrentTime === 'function'
            ? playerRef.current.getCurrentTime()
            : 0;
        },
        getPlayerState: () => {
          return typeof playerRef.current?.getPlayerState === 'function'
            ? playerRef.current.getPlayerState()
            : -1;
        },
        mute: () => {
          if (typeof playerRef.current?.mute === 'function') {
            playerRef.current.mute();
          }
        },
        unMute: () => {
          if (typeof playerRef.current?.unMute === 'function') {
            playerRef.current.unMute();
          }
        },
        getDuration: () => {
          return typeof playerRef.current?.getDuration === 'function'
            ? playerRef.current.getDuration()
            : 0;
        },
        destroy: () => {
          if (typeof playerRef.current?.destroy === 'function') {
            playerRef.current.destroy();
          }
        },
      }),
      []
    );

    // Refs for props to avoid re-init deps
    const onPlayerReadyRef = useRef(onPlayerReady);
    const onReadyRef = useRef(onReady);
    const onEndedRef = useRef(onEnded);
    const shouldBufferRef = useRef(shouldBuffer);

    useEffect(() => {
      onPlayerReadyRef.current = onPlayerReady;
    }, [onPlayerReady]);

    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
      onEndedRef.current = onEnded;
    }, [onEnded]);

    useEffect(() => {
      shouldBufferRef.current = shouldBuffer;
    }, [shouldBuffer]);

    // specific effect for buffering trigger when shouldBuffer becomes true
    useEffect(() => {
      if (
        shouldBuffer &&
        playerRef.current &&
        typeof playerRef.current.playVideo === 'function'
      ) {
        // If we are already ready/cued, we might need to kick it.
        // But usually the player state change handles it.
        // This is mostly for if we switch to buffering state AFTER player is already loaded.
        playerRef.current.playVideo();
      }
    }, [shouldBuffer]);

    // Dynamic Mute Handling
    useEffect(() => {
      if (!playerRef.current) return;
      if (typeof props.muted === 'undefined') return;

      if (props.muted) {
        if (typeof playerRef.current.mute === 'function')
          playerRef.current.mute();
      } else {
        if (typeof playerRef.current.unMute === 'function')
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
          mute: initialMute ? 1 : 0,
        },
        events: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (event: any) => {
            // Check refs for latest values
            const shouldBufferVal = shouldBufferRef.current;

            // State 1 = Playing
            if (shouldBufferVal && event.data === 1) {
              if (playerRef.current) {
                if (typeof playerRef.current.pauseVideo === 'function')
                  playerRef.current.pauseVideo();
                // Removed seekTo(0) to allow resume.
                if (onReadyRef.current) onReadyRef.current();
              }
            }

            // State 0 = Ended
            if (event.data === 0) {
              if (onEndedRef.current) onEndedRef.current();
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onReady: (event: any) => {
            if (onPlayerReadyRef.current)
              onPlayerReadyRef.current(event.target);

            if (initialMute) {
              event.target.mute();
            } else {
              event.target.unMute();
            }

            // Priming trigger using ref value
            if (shouldBufferRef.current) {
              event.target.playVideo();
            }
          },
        },
      });

      return () => {
        if (playerRef.current) {
          if (typeof playerRef.current.destroy === 'function')
            playerRef.current.destroy();
          playerRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId]); // Only re-init on videoId change

    return (
      <div className="w-full h-full relative overflow-hidden border border-black">
        <div
          className="absolute inset-0 z-10 bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <div
          className="w-full h-full"
          style={{
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <div
            ref={containerRef}
            className="w-full h-full object-cover block"
          />
        </div>
      </div>
    );
  }
);

YouTubeTile.displayName = 'YouTubeTile';
