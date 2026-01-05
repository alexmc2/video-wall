import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlaybackState } from '../types';

export const useDirector = (
  tileCount: number,
  onPlayAll: () => void,
  onPauseAll: () => void
) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('IDLE');
  const [readyTiles, setReadyTiles] = useState<Set<number>>(new Set());
  const bufferingTimeoutRef = useRef<number | null>(null);

  // When we request to Play, we actually switch to BUFFERING first.
  const requestPlay = useCallback(() => {
    if (playbackState === 'PLAYING') {
      // Pause
      setPlaybackState('PAUSED');
      onPauseAll();
      setReadyTiles(new Set());
    } else {
      // Start Buffering
      setPlaybackState('BUFFERING');
      setReadyTiles(new Set());
      // Failsafe: if chips are down, force play after 5 seconds
      bufferingTimeoutRef.current = window.setTimeout(() => {
        console.warn('Buffering timed out, forcing play.');
        setPlaybackState('PLAYING');
        onPlayAll();
      }, 5000);
    }
  }, [playbackState, onPlayAll, onPauseAll]);

  const signalReady = useCallback(
    (index: number) => {
      // We only care about ready signals if we are currently buffering
      setPlaybackState((current) => {
        if (current !== 'BUFFERING') return current;

        // Functional update for readyTiles to avoid stale closures if we used state directly
        // But since we are inside setPlaybackState callback, we can't update other state easily.
        // Actually, let's just use the ref pattern or check current state via closure if dependency is correct.
        return current;
      });

      // Re-implementing with cleaner logic:
      if (playbackState !== 'BUFFERING') return;

      setReadyTiles((prev) => {
        const next = new Set(prev);
        next.add(index);
        console.log(`Tile ${index} ready. Total: ${next.size}/${tileCount}`);

        if (next.size >= tileCount) {
          // All Ready!
          if (bufferingTimeoutRef.current) {
            clearTimeout(bufferingTimeoutRef.current);
            bufferingTimeoutRef.current = null;
          }
          // We need to trigger this effectfully.
          // Setting state here will trigger a re-render, we can allow the effect to pick it up or call directly.
          // Calling direct is safer for timing.
          onPlayAll();
          // We must update the playback state outside this reducer
          setTimeout(() => setPlaybackState('PLAYING'), 0);
        }
        return next;
      });
    },
    [playbackState, tileCount, onPlayAll]
  );

  useEffect(() => {
    return () => {
      if (bufferingTimeoutRef.current)
        clearTimeout(bufferingTimeoutRef.current);
    };
  }, []);

  // Debug trigger
  useEffect(() => {
    if (readyTiles.size > 0 && playbackState === 'BUFFERING') {
      const percent = Math.round((readyTiles.size / tileCount) * 100);
      console.log(`Buffering: ${percent}%`);
    }
  }, [readyTiles, playbackState, tileCount]);

  return {
    playbackState,
    requestPlay,
    signalReady,
  };
};
