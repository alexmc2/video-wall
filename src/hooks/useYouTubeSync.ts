import { useEffect, useRef, useCallback } from 'react';
import type { YouTubePlayer } from '../components/YouTubeTile';

interface UseYouTubeSyncProps {
  playersRef: React.MutableRefObject<(YouTubePlayer | null)[]>;
  isSyncEnabled: boolean;
  isPlaying: boolean;
  syncGap: number;
}

export const useYouTubeSync = ({
  playersRef,
  isSyncEnabled,
  isPlaying,
  syncGap = 0,
}: UseYouTubeSyncProps) => {
  const intervalRef = useRef<number>(0);

  const performSyncCheck = useCallback(() => {
    const players = playersRef.current.filter((p) => p && p.getCurrentTime);
    if (players.length < 2 || !isSyncEnabled) return;

    const master = players[0];
    const masterTime = master?.getCurrentTime();

    // Safety check: if master is not playing or invalid
    if (typeof masterTime !== 'number') return;

    players.forEach((slave, index) => {
      if (index === 0) return; // Skip master
      if (!slave) return;

      const delaySec = (syncGap * index) / 1000;
      const targetTime = Math.max(0, masterTime - delaySec);

      const slaveTime = slave.getCurrentTime();
      const drift = slaveTime - targetTime;

      // YouTube drift correction strategy
      // We can't set playbackRate arbitrarily float (like 1.02), only discrete [0.25, 0.5, 1, 1.5, 2] usually.
      // So we mainly rely on seeking for drifting.

      const THRESHOLD = 0.25; // 250ms tolerance - tightened from 500ms
      const HARD_THRESHOLD = 1.0;

      if (Math.abs(drift) > HARD_THRESHOLD) {
        // Hard snap
        slave.seekTo(targetTime, true);
      } else if (Math.abs(drift) > THRESHOLD) {
        // Soft corrections are hard with discrete rates.
        // For now, we just seek if it's annoying.
        slave.seekTo(targetTime, true);
      }
    });
  }, [playersRef, isSyncEnabled, syncGap]);

  // Sync Loop
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(intervalRef.current);
      return;
    }

    // Polling interval.
    // RequestAnimationFrame is too fast for YouTube API calls (they are async/bridged).
    // 100ms provides tighter loop for detection.
    intervalRef.current = window.setInterval(performSyncCheck, 100);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, isSyncEnabled, performSyncCheck]);

  // Global Play/Pause Control
  useEffect(() => {
    const players = playersRef.current.filter((p) => p && p.getPlayerState);

    players.forEach((p) => {
      if (!p) return;
      if (isPlaying) {
        console.log('Play');
        p.playVideo();
      } else {
        console.log('Pause');
        // Check state first to avoid error? YT handles it.
        p.pauseVideo();
      }
    });
  }, [isPlaying, playersRef]);
};
