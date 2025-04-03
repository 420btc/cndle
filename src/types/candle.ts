export interface Candle {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  isClosed?: boolean;
}

export type Prediction = 'bull' | 'bear';
