import { useState, useCallback } from 'react';
import type { QueueItem } from '../types';

const MAX_QUEUE_SIZE = 15;

export interface UsePlayQueueReturn {
  queue: QueueItem[];
  currentlyPlaying: QueueItem | null;
  addToQueue: (item: Omit<QueueItem, 'id' | 'addedAt'>) => boolean;
  removeFromQueue: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  playNext: () => QueueItem | null;
  playCurrent: () => void;
  clearCurrent: () => void;
  setCurrentlyPlaying: (item: QueueItem | null) => void;
}

export const usePlayQueue = (): UsePlayQueueReturn => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<QueueItem | null>(
    null
  );

  const addToQueue = useCallback(
    (item: Omit<QueueItem, 'id' | 'addedAt'>): boolean => {
      if (queue.length >= MAX_QUEUE_SIZE) {
        return false; // Queue is full
      }

      const newItem: QueueItem = {
        ...item,
        id: crypto.randomUUID(),
        addedAt: Date.now(),
      };

      setQueue((prev) => [...prev, newItem]);
      return true;
    },
    [queue.length]
  );

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const moveUp = useCallback((id: string) => {
    setQueue((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index <= 0) return prev; // Already at top or not found

      const newQueue = [...prev];
      [newQueue[index - 1], newQueue[index]] = [
        newQueue[index],
        newQueue[index - 1],
      ];
      return newQueue;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setQueue((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1 || index >= prev.length - 1) return prev; // At bottom or not found

      const newQueue = [...prev];
      [newQueue[index], newQueue[index + 1]] = [
        newQueue[index + 1],
        newQueue[index],
      ];
      return newQueue;
    });
  }, []);

  const playNext = useCallback((): QueueItem | null => {
    if (queue.length === 0) return null;

    const [nextItem, ...rest] = queue;
    setCurrentlyPlaying(nextItem);
    setQueue(rest);
    return nextItem;
  }, [queue]);

  const playCurrent = useCallback(() => {
    // This is a no-op placeholder for when we want to replay current
  }, []);

  const clearCurrent = useCallback(() => {
    setCurrentlyPlaying(null);
  }, []);

  return {
    queue,
    currentlyPlaying,
    addToQueue,
    removeFromQueue,
    moveUp,
    moveDown,
    playNext,
    playCurrent,
    clearCurrent,
    setCurrentlyPlaying,
  };
};
