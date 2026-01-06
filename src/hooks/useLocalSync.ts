import { useEffect, useRef, useCallback } from 'react';

interface UseLocalSyncProps {
  videosRef: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  isSyncEnabled: boolean;
  isPlaying: boolean;
  syncGap: number; // in ms
}

export const useLocalSync = ({
  videosRef,
  isSyncEnabled,
  isPlaying,
  syncGap = 0,
}: UseLocalSyncProps) => {
  const loopRef = useRef<number>(0);

  // Configuration
  const SYNC_THRESHOLD_SEC = 0.04;
  const HARD_SYNC_THRESHOLD_SEC = 0.5;
  const CORRECTION_RATE_FAST = 1.02;
  const CORRECTION_RATE_SLOW = 0.98;

  const performSyncCheck = useCallback(() => {
    const master = videosRef.current[0];
    if (!master || !isSyncEnabled || master.paused) return;

    videosRef.current.forEach((slave, index) => {
      if (index === 0 || !slave) return;

      // Calculate target time for this slave
      // If syncGap is 500ms, Tile 1 should be 0.5s BEHIND Master.
      // So Target = MasterTime - (Index * Gap)
      const delaySec = (syncGap * index) / 1000;
      const targetTime = Math.max(0, master.currentTime - delaySec);

      const drift = slave.currentTime - targetTime;

      if (Math.abs(drift) > HARD_SYNC_THRESHOLD_SEC) {
        slave.currentTime = targetTime;
        slave.playbackRate = 1.0;
      } else if (Math.abs(drift) > SYNC_THRESHOLD_SEC) {
        if (drift > 0) {
          // Slave is ahead of target -> Slow down
          slave.playbackRate = CORRECTION_RATE_SLOW;
        } else {
          // Slave is behind target -> Speed up
          slave.playbackRate = CORRECTION_RATE_FAST;
        }
      } else {
        if (slave.playbackRate !== 1.0) {
          slave.playbackRate = 1.0;
        }
      }
    });
  }, [videosRef, isSyncEnabled, syncGap]);

  useEffect(() => {
    if (!isPlaying || !isSyncEnabled) {
      cancelAnimationFrame(loopRef.current);
      videosRef.current.forEach((v) => {
        if (v) v.playbackRate = 1.0;
      });
      return;
    }

    const tick = () => {
      performSyncCheck();
      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(loopRef.current);
    };
  }, [isPlaying, isSyncEnabled, performSyncCheck, videosRef]);

  // Sync Play/Pause
  useEffect(() => {
    videosRef.current.forEach((video) => {
      if (!video) return;
      if (isPlaying) {
        video.play().catch((e) => console.error('Play failed', e));
      } else {
        video.pause();
      }
    });
  }, [isPlaying, videosRef]);
};
