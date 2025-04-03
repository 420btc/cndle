import { CandlePattern } from '../types/candle';

export const candlePatterns: CandlePattern[] = [
  {
    id: 'doji',
    name: 'Doji',
    description: 'Open and close prices are very close, showing market indecision.',
    image: 'https://www.investopedia.com/thmb/jLQJiaPXIzZ-QZJu8QcAv2hNMsA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/doji-56a091dc5f9b58eba4b20230.jpg',
    difficulty: 1
  },
  {
    id: 'hammer',
    name: 'Hammer',
    description: 'Small body with a long lower shadow, signaling potential reversal.',
    image: 'https://www.investopedia.com/thmb/5_INWYHxAaMrLRSXKgkB2KCE9GU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/hammer-56a091dc5f9b58eba4b20231.jpg',
    difficulty: 1
  },
  {
    id: 'engulfing',
    name: 'Bullish Engulfing',
    description: 'A bearish candle followed by a larger bullish candle that "engulfs" it.',
    image: 'https://www.investopedia.com/thmb/q_JBnV5_Pbvr2RcHK-IUh9gJBUo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/bullishengulfing-56a091dc5f9b58eba4b20232.jpg',
    difficulty: 2
  },
  {
    id: 'evening_star',
    name: 'Evening Star',
    description: 'Three-candle pattern signaling a potential reversal from bullish to bearish.',
    image: 'https://www.investopedia.com/thmb/fOQbD4WAUfEzr9epPMTSRYCcRxw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/eveningstar-56a091dc5f9b58eba4b20233.jpg',
    difficulty: 3
  },
  {
    id: 'morning_star',
    name: 'Morning Star',
    description: 'Three-candle pattern signaling a potential reversal from bearish to bullish.',
    image: 'https://www.investopedia.com/thmb/iPaMvETXHBpKDDCWPAmX9yfBkAc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/morningstar-56a091dc5f9b58eba4b20234.jpg',
    difficulty: 3
  },
  {
    id: 'shooting_star',
    name: 'Shooting Star',
    description: 'Small body with a long upper shadow, signaling potential bearish reversal.',
    image: 'https://www.investopedia.com/thmb/F5S33vVKPnqpLiWiVUxRRv8c7fA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/shootingstar-56a091dc5f9b58eba4b20235.jpg',
    difficulty: 2
  }
];

export const getRandomPattern = (level: number): CandlePattern => {
  // Filter patterns by difficulty based on level
  const availablePatterns = candlePatterns.filter(
    pattern => pattern.difficulty <= Math.min(Math.ceil(level / 2), 3)
  );
  
  // Get a random pattern from the filtered list
  const randomIndex = Math.floor(Math.random() * availablePatterns.length);
  return availablePatterns[randomIndex];
};
