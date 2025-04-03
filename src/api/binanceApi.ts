import { Candle } from '../types/candle';

const BASE_URL = 'https://api.binance.com';
const WEBSOCKET_URL = 'wss://stream.binance.com:9443/ws';

// Convert Binance API response to our Candle type
const formatCandle = (data: any[]): Candle => {
  return {
    timestamp: data[0],
    open: parseFloat(data[1]),
    high: parseFloat(data[2]),
    low: parseFloat(data[3]),
    close: parseFloat(data[4]),
    volume: parseFloat(data[5]),
    isClosed: true
  };
};

// Format live websocket candle data
export const formatLiveCandle = (data: any): Candle => {
  const kline = data.k;
  return {
    timestamp: kline.t,
    open: parseFloat(kline.o),
    high: parseFloat(kline.h),
    low: parseFloat(kline.l),
    close: parseFloat(kline.c),
    volume: parseFloat(kline.v),
    isClosed: kline.x
  };
};

// Get historical candles
export const getHistoricalCandles = async (
  symbol: string = 'BTCUSDT',
  interval: string = '1m',
  limit: number = 60
): Promise<Candle[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map(formatCandle);
  } catch (error) {
    console.error('Failed to fetch historical candles:', error);
    throw error;
  }
};

// Get server time from Binance
export const getServerTime = async (): Promise<number> => {
  try {
    const response = await fetch(`${BASE_URL}/api/v3/time`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.serverTime;
  } catch (error) {
    console.error('Failed to fetch server time:', error);
    throw error;
  }
};

// Create a websocket connection for live candle data
export const createCandleWebSocket = (
  symbol: string = 'btcusdt',
  interval: string = '1m',
  onMessage: (candle: Candle) => void,
  onError: (error: any) => void
): WebSocket => {
  const ws = new WebSocket(`${WEBSOCKET_URL}/${symbol}@kline_${interval}`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const candle = formatLiveCandle(data);
      onMessage(candle);
    } catch (error) {
      console.error('WebSocket message error:', error);
      onError(error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError(error);
  };
  
  return ws;
};
