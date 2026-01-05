export type PlaybackState = 'IDLE' | 'BUFFERING' | 'PLAYING' | 'PAUSED';

export interface TileStatus {
  id: number;
  isReady: boolean;
}
