import { forwardRef, useEffect } from 'react';

interface VideoTileProps {
  src: string;
  muted?: boolean;
  onReady?: () => void;
  shouldBuffer?: boolean;
  scaleX?: number;
  scaleY?: number;
  onEnded?: () => void;
}

export const VideoTile = forwardRef<HTMLVideoElement, VideoTileProps>(
  (
    {
      src,
      muted = true,
      onReady,
      shouldBuffer,
      scaleX = 1,
      scaleY = 1,
      onEnded,
    },
    ref
  ) => {
    // Handling local video buffering readiness
    const handleCanPlay = () => {
      // For local video, we might consider 'canplaythrough' as enough.
      // If strict buffering is requested, we could check readyState, but usually this event is sufficient.
      if (onReady && shouldBuffer) onReady();
      // If we don't care about buffering, we just ignore it.
      if (onReady && !shouldBuffer) {
        // Maybe signal ready immediately?
      }
    };

    // Check ready state immediately when shouldBuffer changes
    // This allows resuming without waiting for an event if already ready
    useEffect(() => {
      const videoRef = ref as React.MutableRefObject<HTMLVideoElement | null>;
      if (
        shouldBuffer &&
        videoRef?.current &&
        videoRef.current.readyState >= 3
      ) {
        if (onReady) onReady();
      }
    }, [shouldBuffer, onReady, ref]);

    return (
      <div className="w-full h-full relative overflow-hidden border border-black pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          {/*
          muted={true} is critical for autoplay policies and initial sync.
          playsInline is needed for mobile/some browsers.
        */}
          <video
            ref={ref}
            src={src || undefined}
            className="w-full h-full object-cover block"
            muted={muted}
            playsInline
            loop
            onCanPlayThrough={handleCanPlay}
            onEnded={onEnded}
          />
        </div>
      </div>
    );
  }
);

VideoTile.displayName = 'VideoTile';
