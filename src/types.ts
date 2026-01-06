export type PlaybackState = 'IDLE' | 'BUFFERING' | 'PLAYING' | 'PAUSED';

export interface TileStatus {
  id: number;
  isReady: boolean;
}

export interface QueueItem {
  id: string;
  type: 'local' | 'youtube';
  name: string;
  source: string; // File blob URL or YouTube video ID
  addedAt: number;
}
