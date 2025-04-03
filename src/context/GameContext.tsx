import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { loadSounds, playSound as playSoundEffect } from '../utils/SoundManager';

export interface Bet {
  id: string;
  fecha: number;
  apuesta: 'bull' | 'bear';
  resultado: 'ganó' | 'perdió' | 'pendiente';
  minuto: number;
  amount?: number; // Add amount to track bet size
  initialPrice?: number; // Add initial price at the time of bet
  finalPrice?: number; // Add final price when bet is resolved
  isDoubleBet?: boolean; // Indicates if this is a double bet (costs more coins)
  gameType?: '1min'; // Add game type
}

// Interface for game state data
interface GameStateData {
  betAmount: number;
  betAmountIndex: number;
  activeBets: any[];
  sessionBets: Bet[];
  bettedCandles: any[];
  gameState: number;
  nextBetMultiplier: number;
  pendingPrediction: 'bull' | 'bear' | null;
  activePrediction: 'bull' | 'bear' | null;
  isDoubleBet: boolean;
  hasBetOnCurrentCandle?: boolean;
  historicalCandles?: any[];
  currentCandle?: any;
}

// Define wheel segments and their values
export interface WheelSegment {
  label: string;
  color: string;
  value: number | 'lucky';
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '5000', color: '#f7931a', value: 5000 },    // Oro (premio mayor)
  { label: '100', color: '#dc2626', value: 100 },      // Rojo (premio pequeño)
  { label: '3000', color: '#f7931a', value: 3000 },    // Oro (premio grande)
  { label: '50', color: '#dc2626', value: 50 },        // Rojo (premio mínimo)
  { label: 'LUCKY BONUS', color: '#f7931a', value: 'lucky' }, // Oro (premio especial)
  { label: '200', color: '#dc2626', value: 200 },      // Rojo (premio pequeño)
  { label: '2000', color: '#f7931a', value: 2000 },    // Oro (premio grande)
  { label: '75', color: '#dc2626', value: 75 },        // Rojo (premio mínimo)
  { label: '1000', color: '#16a34a', value: 1000 },    // Verde (premio medio)
  { label: '150', color: '#dc2626', value: 150 },      // Rojo (premio pequeño)
  { label: '500', color: '#16a34a', value: 500 },      // Verde (premio medio)
  { label: '25', color: '#dc2626', value: 25 }         // Rojo (premio mínimo)
];

// Define segment weights for probability
export const SEGMENT_WEIGHTS = [
  1,    // 5000 COINS (1% probability)
  15,   // 100 COINS (15% probability)
  2,    // 3000 COINS (2% probability)
  15,   // 50 COINS (15% probability)
  5,    // LUCKY BONUS (5% probability)
  15,   // 200 COINS (15% probability)
  3,    // 2000 COINS (3% probability)
  15,   // 75 COINS (15% probability)
  5,    // 1000 COINS (5% probability)
  15,   // 150 COINS (15% probability)
  4,    // 500 COINS (4% probability)
  15    // 25 COINS (15% probability)
];

// Wheel spin tracking interface
interface WheelSpinTracking {
  spinsRemaining: number;
  lastResetTime: number;
}

interface GameContextType {
  score: number;
  setScore: (score: number) => void;
  highScore: number;
  streak: number;
  setStreak: (streak: number) => void;
  maxStreak: number;
  level: number; // New: level state
  setLevel: (level: number) => void;
  wins: number; // New: wins state
  setWins: (wins: number) => void;
  getStatus: () => string; // New: function to get status name
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
  resetGame: () => void;
  updateScore: (points: number) => void;
  updateStreak: (success: boolean) => void;
  playSound: (soundType: 'success' | 'failure' | 'bonus' | 'gameOver') => void;
  betHistory: Bet[];
  addBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  coins: number;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => void;
  resetCoins: () => void;
  saveGameState: (gameState: GameStateData) => Promise<void>;
  loadGameState: () => Promise<GameStateData | null>;
  isLoading: boolean;
  luckyBonus: boolean;
  setLuckyBonus: (value: boolean) => void;
  candleSizes: number[]; // New: Array to store candle sizes
  addCandleSize: (size: number) => void; // New: Function to add candle size
  calculateSizeBonus: (size: number) => { bonusPercentage: number, bonusAmount: number }; // New: Function to calculate bonus
  checkCandleSizeRecord: (size: number) => string | null; // New: Function to check if candle size is a record
  // Market Momentum feature
  momentumStreak: number;
  momentumType: 'bull' | 'bear' | null;
  setMomentumStreak: (streak: number) => void;
  setMomentumType: (type: 'bull' | 'bear' | null) => void;
  calculateMomentumBonus: (streak: number) => number;
  // Wheel spin functionality
  spinWheel: () => Promise<{ segment: WheelSegment, index: number }>;
  getWheelSegments: () => WheelSegment[];
  getSegmentWeights: () => number[];
  // Wheel multiplier
  wheelMultiplier: number;
  setWheelMultiplier: (multiplier: number) => void;
  // Wheel spin tracking
  wheelSpinsRemaining: number;
  wheelSpinLastReset: number;
  useWheelSpin: () => Promise<boolean>;
  getTimeUntilNextWheelReset: () => number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [level, setLevel] = useState(1); // New: level state
  const [wins, setWins] = useState(0); // New: wins state
  const [multiplier, setMultiplier] = useState(1);
  const [betHistory, setBetHistory] = useState<Bet[]>([]);
  const [coins, setCoins] = useState(50); // Changed from 100 to 50 coins
  const [luckyBonus, setLuckyBonus] = useState(false); // New state for lucky bonus
  const [candleSizes, setCandleSizes] = useState<number[]>([]); // New: Array to store candle sizes
  // Market Momentum feature - new states
  const [momentumStreak, setMomentumStreak] = useState(0);
  const [momentumType, setMomentumType] = useState<'bull' | 'bear' | null>(null);
  // Wheel multiplier - new state
  const [wheelMultiplier, setWheelMultiplier] = useState(1);
  // Wheel spin tracking - new states
  const [wheelSpinsRemaining, setWheelSpinsRemaining] = useState(3);
  const [wheelSpinLastReset, setWheelSpinLastReset] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);

  // Load sounds when the component mounts
  useEffect(() => {
    loadSounds().catch(error => {
      console.error('Failed to load sounds:', error);
    });
  }, []);

  // New: Function to get status name based on level
  const getStatus = (): string => {
    switch (true) {
      case level >= 10:
        return "Crypto Legend";
      case level >= 8:
        return "Whale";
      case level >= 6:
        return "Master Trader";
      case level >= 4:
        return "Pro Trader";
      case level >= 2:
        return "Trader";
      default:
        return "Novice";
    }
  };

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile(user.id);
      loadBetHistory(user.id);
      loadWheelSpinTracking(user.id);
      setIsLoading(false);
    } else if (!authLoading) {
      // If not authenticated and not loading, set default values
      setCoins(50); // Changed from 100 to 50 coins
      setBetHistory([]);
      setLevel(1); // Reset level
      setWins(0); // Reset wins
      setWheelSpinsRemaining(3);
      setWheelSpinLastReset(Date.now());
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Load user profile from AsyncStorage
  const loadUserProfile = async (userId: string) => {
    try {
      const profileData = await AsyncStorage.getItem(`profile_${userId}`);
      
      if (profileData) {
        const profile = JSON.parse(profileData);
        setCoins(profile.coins || 50);
        setHighScore(profile.highScore || 0);
        setMaxStreak(profile.maxStreak || 0);
        setLevel(profile.level || 1); // Load level
        setWins(profile.wins || 0); // Load wins
      } else {
        // Initialize profile if it doesn't exist
        const defaultProfile = {
          coins: 50,
          highScore: 0,
          maxStreak: 0,
          level: 1, // Default level
          wins: 0, // Default wins
          totalBets: 0,
          bullBets: 0,
          bearBets: 0,
          oneMinBets: 0,
          fiveMinBets: 0
        };
        
        await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(defaultProfile));
        setCoins(50);
        setHighScore(0);
        setMaxStreak(0);
        setLevel(1);
        setWins(0);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Load wheel spin tracking from AsyncStorage
  const loadWheelSpinTracking = async (userId: string) => {
    try {
      const wheelData = await AsyncStorage.getItem(`wheelSpins_${userId}`);
      
      if (wheelData) {
        const wheelTracking: WheelSpinTracking = JSON.parse(wheelData);
        
        // Check if 24 hours have passed since last reset
        const now = Date.now();
        const hoursSinceReset = (now - wheelTracking.lastResetTime) / (1000 * 60 * 60);
        
        if (hoursSinceReset >= 24) {
          // Reset spins if 24 hours have passed
          setWheelSpinsRemaining(3);
          setWheelSpinLastReset(now);
          
          // Save the updated tracking
          await AsyncStorage.setItem(`wheelSpins_${userId}`, JSON.stringify({
            spinsRemaining: 3,
            lastResetTime: now
          }));
        } else {
          // Use the stored values
          setWheelSpinsRemaining(wheelTracking.spinsRemaining);
          setWheelSpinLastReset(wheelTracking.lastResetTime);
        }
      } else {
        // Initialize wheel tracking if it doesn't exist
        const now = Date.now();
        setWheelSpinsRemaining(3);
        setWheelSpinLastReset(now);
        
        await AsyncStorage.setItem(`wheelSpins_${userId}`, JSON.stringify({
          spinsRemaining: 3,
          lastResetTime: now
        }));
      }
    } catch (error) {
      console.error('Error loading wheel spin tracking:', error);
    }
  };

  // Save wheel spin tracking to AsyncStorage
  const saveWheelSpinTracking = async () => {
    if (!user?.id) return;
    
    try {
      await AsyncStorage.setItem(`wheelSpins_${user.id}`, JSON.stringify({
        spinsRemaining: wheelSpinsRemaining,
        lastResetTime: wheelSpinLastReset
      }));
    } catch (error) {
      console.error('Error saving wheel spin tracking:', error);
    }
  };

  // Function to use a wheel spin and check if it's available
  const useWheelSpin = async (): Promise<boolean> => {
    // Check if spins are available
    if (wheelSpinsRemaining <= 0) {
      return false;
    }
    
    // Use a spin
    const newSpinsRemaining = wheelSpinsRemaining - 1;
    setWheelSpinsRemaining(newSpinsRemaining);
    
    // Save the updated tracking
    if (user?.id) {
      await AsyncStorage.setItem(`wheelSpins_${user.id}`, JSON.stringify({
        spinsRemaining: newSpinsRemaining,
        lastResetTime: wheelSpinLastReset
      }));
    }
    
    return true;
  };

  // Function to get time until next wheel reset
  const getTimeUntilNextWheelReset = (): number => {
    const now = Date.now();
    const resetTime = wheelSpinLastReset + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
    return Math.max(0, resetTime - now);
  };

  // Load bet history from AsyncStorage
  const loadBetHistory = async (userId: string) => {
    try {
      // Get the list of bet hashes for this user
      const betHashesJson = await AsyncStorage.getItem(`betHistory_${userId}`);
      if (!betHashesJson) {
        setBetHistory([]);
        return;
      }
      
      const betHashes = JSON.parse(betHashesJson);
      const bets: Bet[] = [];
      
      // Load each bet by its hash
      for (const hash of betHashes) {
        const betJson = await AsyncStorage.getItem(`bet_${hash}`);
        if (betJson) {
          const bet = JSON.parse(betJson);
          bets.push(bet);
        }
      }
      
      // Sort by date (newest first)
      bets.sort((a, b) => b.fecha - a.fecha);
      setBetHistory(bets);
      
    } catch (error) {
      console.error('Error loading bet history:', error);
    }
  };

  // Update user profile in AsyncStorage
  const updateUserProfile = async () => {
    if (!user?.id) return;

    try {
      // Get current profile
      const profileJson = await AsyncStorage.getItem(`profile_${user.id}`);
      const profile = profileJson ? JSON.parse(profileJson) : {};
      
      // Update with current values
      const updatedProfile = {
        ...profile,
        coins,
        highScore,
        maxStreak,
        level, // Save level
        wins, // Save wins
        updatedAt: new Date().toISOString()
      };
      
      // Save updated profile
      await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
      
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  // Update profile when relevant state changes
  useEffect(() => {
    if (user?.id) {
      updateUserProfile();
    }
  }, [coins, highScore, maxStreak, level, wins, user?.id]);

  // Save wheel spin tracking when it changes
  useEffect(() => {
    if (user?.id) {
      saveWheelSpinTracking();
    }
  }, [wheelSpinsRemaining, wheelSpinLastReset, user?.id]);

  // Update multiplier based on streak
  useEffect(() => {
    if (streak >= 10) {
      setMultiplier(5);
    } else if (streak >= 7) {
      setMultiplier(4);
    } else if (streak >= 5) {
      setMultiplier(3);
    } else if (streak >= 3) {
      setMultiplier(2);
    } else {
      setMultiplier(1);
    }
    if (streak > maxStreak) {
      setMaxStreak(streak);
      
      // Recalculate level when maxStreak changes
      calculateLevel();
    }
  }, [streak, maxStreak, wins, score]);

  // New level calculation based on score - more aligned with store prices
  const calculateLevel = () => {
    // New level thresholds based on score
    const levelThresholds = [
      0,       // Level 1: 0-999
      1000,    // Level 2: 1,000-4,999
      5000,    // Level 3: 5,000-9,999
      10000,   // Level 4: 10,000-24,999
      25000,   // Level 5: 25,000-49,999
      50000,   // Level 6: 50,000-99,999
      100000,  // Level 7: 100,000-249,999
      250000,  // Level 8: 250,000-499,999
      500000,  // Level 9: 500,000-999,999
      1000000  // Level 10: 1,000,000+
    ];
    
    // Find the highest level threshold that the score exceeds
    let newLevel = 1;
    for (let i = 0; i < levelThresholds.length; i++) {
      if (score >= levelThresholds[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }
    
    // Update level if it has changed
    if (newLevel !== level) {
      setLevel(newLevel);
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setLevel(1);
    setMultiplier(1);
  };
  
  const resetCoins = () => {
    setCoins(50); // Changed from 100 to 50 coins
    
    // Update in AsyncStorage if user is logged in
    if (user?.id) {
      updateUserProfile();
    }
  };

  const updateScore = (points: number) => {
    const newScore = score + (points * multiplier);
    setScore(newScore);
    
    // Update high score if needed
    if (newScore > highScore) {
      setHighScore(newScore);
    }
    
    // Recalculate level based on new score
    calculateLevel();
  };

  const updateStreak = (success: boolean) => {
    if (success) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Update max streak if needed
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      setStreak(0);
    }
  };
  
  // Coins management
  const addCoins = (amount: number) => {
    const newCoins = coins + amount;
    setCoins(newCoins);
  };
  
  const removeCoins = (amount: number) => {
    const newCoins = Math.max(0, coins - amount);
    setCoins(newCoins);
  };

  const playSound = (soundType: 'success' | 'failure' | 'bonus' | 'gameOver') => {
    playSoundEffect(soundType).catch(error => {
      console.error('Error playing sound:', error);
    });
  };

  // Function to register bet in history using a simple hash
  const addBet = async (bet: Bet) => {
    if (!user?.id) return;
    
    try {
      // Generate a unique ID for the bet
      const betId = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Assign the ID to the bet
      const betWithId = {
        ...bet,
        id: betId
      };
      
      // Add to local state
      const newHistory = [betWithId, ...betHistory];
      setBetHistory(newHistory);
      
      // Save the bet with its ID as key
      await AsyncStorage.setItem(`bet_${betId}`, JSON.stringify(betWithId));
      
      // Get current bet IDs for this user
      const betIdsJson = await AsyncStorage.getItem(`betHistory_${user.id}`);
      const betIds = betIdsJson ? JSON.parse(betIdsJson) : [];
      
      // Add new ID to the list
      betIds.unshift(betId);
      
      // Save updated list of IDs
      await AsyncStorage.setItem(`betHistory_${user.id}`, JSON.stringify(betIds));
      
      // Update user profile statistics
      const profileJson = await AsyncStorage.getItem(`profile_${user.id}`);
      const profile = profileJson ? JSON.parse(profileJson) : {};
      
      const updatedProfile = {
        ...profile,
        totalBets: (profile.totalBets || 0) + 1,
        bullBets: bet.apuesta === 'bull' ? (profile.bullBets || 0) + 1 : (profile.bullBets || 0),
        bearBets: bet.apuesta === 'bear' ? (profile.bearBets || 0) + 1 : (profile.bearBets || 0),
        oneMinBets: (profile.oneMinBets || 0) + 1
      };
      
      await AsyncStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
      
    } catch (error) {
      console.error('Error adding bet:', error);
    }
  };

  // Function to update an existing bet
  const updateBet = async (id: string, updates: Partial<Bet>) => {
    if (!user?.id) return;
    
    try {
      // Find the bet in local state
      const betIndex = betHistory.findIndex(bet => bet.id === id);
      if (betIndex === -1) return;
      
      // Update the bet
      const updatedBet = { ...betHistory[betIndex], ...updates };
      
      // Update local state
      const updatedHistory = [...betHistory];
      updatedHistory[betIndex] = updatedBet;
      setBetHistory(updatedHistory);
      
      // Save updated bet to AsyncStorage
      await AsyncStorage.setItem(`bet_${id}`, JSON.stringify(updatedBet));
      
      // If the bet was won, increment wins
      if (updates.resultado === 'ganó') {
        const newWins = wins + 1;
        setWins(newWins);
      }
      
    } catch (error) {
      console.error('Error updating bet:', error);
    }
  };

  // Save game state to AsyncStorage
  const saveGameState = async (gameState: GameStateData) => {
    try {
      if (!user?.id) return;
      
      // Stringify the game state for storage
      const gameStateString = JSON.stringify(gameState);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(`gameState_${user.id}`, gameStateString);
      
      console.log('[DEBUG] Game state saved successfully:', gameState);
      
      // Also save a timestamp of when the state was saved
      await AsyncStorage.setItem(`gameStateSavedAt_${user.id}`, Date.now().toString());
      
      return;
    } catch (error) {
      console.error('Error saving game state:', error);
      throw error;
    }
  };

  // Load game state from AsyncStorage
  const loadGameState = async (): Promise<GameStateData | null> => {
    try {
      if (!user?.id) return null;
      
      // Get the saved game state from AsyncStorage
      const savedState = await AsyncStorage.getItem(`gameState_${user.id}`);
      
      if (savedState) {
        // Parse the saved state
        const gameState = JSON.parse(savedState);
        console.log('[DEBUG] Loaded game state successfully:', gameState);
        return gameState;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading game state:', error);
      return null;
    }
  };

  // New: Function to add candle size to the array
  const addCandleSize = (size: number) => {
    setCandleSizes(prevSizes => {
      const newSizes = [...prevSizes, size];
      // Keep only the last 10 sizes
      if (newSizes.length > 10) {
        return newSizes.slice(-10);
      }
      return newSizes;
    });
  };

  // Updated: Function to calculate bonus based on candle size with new scale
  const calculateSizeBonus = (size: number) => {
    let bonusPercentage = 0;
    
    // Apply bonus based on candle size with the new scale
    if (size <= 5) {
      bonusPercentage = 0; // No bonus for $0-$5
    } else if (size <= 25) {
      bonusPercentage = 0; // No bonus for $5-$25
    } else if (size <= 75) {
      bonusPercentage = 25; // +25% for $25-$75
    } else if (size <= 150) {
      bonusPercentage = 50; // +50% for $75-$150
    } else if (size <= 250) {
      bonusPercentage = 100; // +100% for $150-$250
    } else if (size <= 400) {
      bonusPercentage = 150; // +150% for $250-$400
    } else if (size <= 600) {
      bonusPercentage = 200; // +200% for $400-$600
    } else {
      bonusPercentage = 300; // +300% for $600+
    }
    
    return { bonusPercentage, bonusAmount: 0 }; // bonusAmount will be calculated when applied
  };

  // New: Function to check if candle size is a record
  const checkCandleSizeRecord = (size: number): string | null => {
    if (candleSizes.length === 0) return null;
    
    // Check if it's the biggest in the last minute (compared to previous candle)
    if (candleSizes.length >= 2 && size > candleSizes[candleSizes.length - 2]) {
      return "¡Vela más grande en 1 minuto!";
    }
    
    // Check if it's the biggest in the last 5 minutes
    if (candleSizes.length >= 5) {
      const last5Sizes = candleSizes.slice(-5);
      if (size > Math.max(...last5Sizes)) {
        return "¡Vela más grande en 5 minutos!";
      }
    }
    
    // Check if it's the biggest in the last 10 minutes
    if (size > Math.max(...candleSizes)) {
      return "¡Vela más grande en 10 minutos!";
    }
    
    return null;
  };

  // New: Function to calculate momentum bonus based on streak
  const calculateMomentumBonus = (streak: number): number => {
    if (streak >= 12) return 150; // +150% for 12+ candles
    if (streak >= 9) return 100;  // +100% for 9-11 candles
    if (streak >= 6) return 50;   // +50% for 6-8 candles
    if (streak >= 3) return 10;   // +10% for 3-5 candles
    return 0;                     // No bonus for less than 3 candles
  };

  // New: Function to spin the wheel and get a prize
  const spinWheel = async (): Promise<{ segment: WheelSegment, index: number }> => {
    try {
      // Check if spins are available
      if (wheelSpinsRemaining <= 0) {
        throw new Error("No spins remaining");
      }
      
      // Use a spin
      const spinUsed = await useWheelSpin();
      if (!spinUsed) {
        throw new Error("Failed to use wheel spin");
      }
      
      // Calculate total weight
      const totalWeight = SEGMENT_WEIGHTS.reduce((a, b) => a + b, 0);
      
      // Get a random value based on the weights
      const random = Math.random() * totalWeight;
      
      // Find the segment based on the random value
      let weightSum = 0;
      let segmentIndex = 0;
      
      for (let i = 0; i < SEGMENT_WEIGHTS.length; i++) {
        weightSum += SEGMENT_WEIGHTS[i];
        if (random <= weightSum) {
          segmentIndex = i;
          break;
        }
      }
      
      // Get the selected segment
      const selectedSegment = WHEEL_SEGMENTS[segmentIndex];
      
      // Return the selected segment and index
      // Note: We no longer apply the prize here - that's now done in the WheelSpinScreen
      // after the animation completes
      return { segment: selectedSegment, index: segmentIndex };
    } catch (error) {
      console.error('Error spinning wheel:', error);
      throw error;
    }
  };

  // Function to get wheel segments
  const getWheelSegments = (): WheelSegment[] => {
    return WHEEL_SEGMENTS;
  };

  // Function to get segment weights
  const getSegmentWeights = (): number[] => {
    return SEGMENT_WEIGHTS;
  };

  return (
    <GameContext.Provider
      value={{
        score,
        setScore,
        highScore,
        streak,
        setStreak,
        maxStreak,
        level, // New: expose level
        setLevel,
        wins, // New: expose wins
        setWins,
        getStatus, // New: expose getStatus function
        multiplier,
        setMultiplier,
        resetGame,
        updateScore,
        updateStreak,
        playSound,
        betHistory,
        addBet,
        updateBet,
        coins,
        addCoins,
        removeCoins,
        resetCoins,
        saveGameState,
        loadGameState,
        isLoading,
        luckyBonus,
        setLuckyBonus,
        candleSizes, // New: Expose candle sizes array
        addCandleSize, // New: Expose function to add candle size
        calculateSizeBonus, // New: Expose function to calculate bonus
        checkCandleSizeRecord, // New: Expose function to check if candle size is a record
        // Market Momentum feature
        momentumStreak,
        momentumType,
        setMomentumStreak,
        setMomentumType,
        calculateMomentumBonus,
        // Wheel spin functionality
        spinWheel,
        getWheelSegments,
        getSegmentWeights,
        // Wheel multiplier
        wheelMultiplier,
        setWheelMultiplier,
        // Wheel spin tracking
        wheelSpinsRemaining,
        wheelSpinLastReset,
        useWheelSpin,
        getTimeUntilNextWheelReset
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
