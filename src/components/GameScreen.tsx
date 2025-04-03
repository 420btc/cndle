import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Alert,
  BackHandler,
  AppState,
  AppStateStatus,
  TouchableOpacity,
  Text,
  Animated as RNAnimated,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame, Bet } from '../context/GameContext';
import { getHistoricalCandles, createCandleWebSocket, formatLiveCandle, getServerTime } from '../api/binanceApi';
import { Candle, Prediction } from '../types/candle';
import { getRandomPattern } from '../data/candlePatterns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import CandleChart from '../components/CandleChart';
import PredictionButtons from '../components/PredictionButtons';
import PatternChallenge from '../components/PatternChallenge';
import ScoreAnimation from '../components/ScoreAnimation';
import BetHistoryItem from '../components/BetHistoryItem';
import GameOverModal from '../components/GameOverModal';
import StreakBonus from '../components/StreakBonus';

enum GameState {
  ESPERANDO_VELA_ACTUAL,
  FASE_APUESTA,
  OBSERVANDO_VELA,
}

interface ActiveBet {
  prediction: Prediction;
  amount: number;
  timestamp: number;
  candleTimestamp: number; // Se asignará la vela a la que se apuesta
  sessionBetId: string;
  initialPrice: number; // Precio al momento de la apuesta
  openPrice?: number; // Precio de apertura de la vela
  closePrice?: number; // Precio de cierre de la vela
  resolutionScheduled?: boolean; // Flag to track if resolution is scheduled
  candleMinute: number; // Minuto exacto de la vela
  isDoubleBet?: boolean; // Indica si es una apuesta doble (costs more coins)
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

// Define dynamic bet amount options based on available coins
const getBetAmountOptions = (coins: number) => {
  if (coins <= 100) {
    return [10, 25, 50, 100, 'ALL-IN'];
  } else if (coins <= 500) {
    return [25, 50, 100, 250, 'ALL-IN'];
  } else if (coins <= 1000) {
    return [50, 100, 250, 500, 'ALL-IN'];
  } else if (coins <= 5000) {
    return [100, 250, 500, 1000, 'ALL-IN'];
  } else {
    return [250, 500, 1000, 2500, 'ALL-IN'];
  }
};

const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    score, 
    level, 
    setLevel, 
    updateScore, 
    updateStreak,
    playSound,
    addBet,
    updateBet,
    coins,
    addCoins,
    removeCoins,
    betHistory,
    streak,
    multiplier,
    setMultiplier,
    saveGameState,
    loadGameState,
    luckyBonus,
    setLuckyBonus,
    // New: Use the new candle size related functions
    addCandleSize,
    calculateSizeBonus,
    checkCandleSizeRecord
  } = useGame();
  
  // Estados de juego
  const [historicalCandles, setHistoricalCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [pendingPrediction, setPendingPrediction] = useState<Prediction>(null);
  const [activePrediction, setActivePrediction] = useState<Prediction>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [bettingTimeRemaining, setBettingTimeRemaining] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>(GameState.ESPERANDO_VELA_ACTUAL);
  const [nextCandleTimestamp, setNextCandleTimestamp] = useState<number | null>(null);
  const [mensajeApuesta, setMensajeApuesta] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; message: string; coinsWon?: number; bonusAmount?: number; multiplierApplied?: number; candleSize?: number; bonusPercentage?: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPatternChallenge, setShowPatternChallenge] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(getRandomPattern(1));
  const [patternTimeLimit, setPatternTimeLimit] = useState(5);
  const [betAmount, setBetAmount] = useState(10); // Monedas a apostar
  const [betAmountIndex, setBetAmountIndex] = useState(0); // Track the current index in options
  const resultOpacity = useRef(new RNAnimated.Value(0)).current;
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const [sessionBets, setSessionBets] = useState<Bet[]>([]);
  const [bettedCandles, setBettedCandles] = useState<{timestamp: number; prediction: Prediction; isDoubleBet?: boolean}[]>([]);
  const [chartOffset, setChartOffset] = useState(0);
  
  // New state for game over modal
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  // New state to track if game over has been shown already
  const [gameOverShown, setGameOverShown] = useState(false);
  
  // New state for streak bonus
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [streakBonusInfo, setStreakBonusInfo] = useState({ streak: 0, multiplier: 0, coinsAwarded: 0 });
  
  // New state for next bet multiplier
  const [nextBetMultiplier, setNextBetMultiplier] = useState(1);
  
  // New state for auto-resolution notification
  const [showAutoResolutionNotice, setShowAutoResolutionNotice] = useState(false);
  const autoResolutionOpacity = useRef(new RNAnimated.Value(0)).current;
  
  // New state for double bet mode
  const [isDoubleBet, setIsDoubleBet] = useState(false);
  
  // New state to track if player has already bet on the current candle
  const [hasBetOnCurrentCandle, setHasBetOnCurrentCandle] = useState(false);
  
  // New state to track if game state has been saved
  const [isSaved, setIsSaved] = useState(false);
  
  // New state to track if there are unresolved bets that should have been resolved
  const [hasUnresolvedBets, setHasUnresolvedBets] = useState(false);
  
  // Removed bonusMessage and recordMessage states since we're consolidating notifications
  
  const [scoreAnimations, setScoreAnimations] = useState<Array<{id: number; points: number; position: { x: number; y: number }}>>([]);
  const [coinsAnimations, setCoinsAnimations] = useState<Array<{id: number; amount: number; position: { x: number; y: number }}>>([]);
  
  // Get current bet amount options based on available coins
  const betAmountOptions = getBetAmountOptions(coins);
  
  // Refs
  const webSocketRef = useRef<WebSocket | null>(null);
  const animationIdCounter = useRef(0);
  const appState = useRef(AppState.currentState);
  const serverTimeOffsetRef = useRef(0);
  const lastCandleOpenTimeRef = useRef<number | null>(null);
  const lastProcessedCandleRef = useRef<number | null>(null);
  const autoResolveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerCheckRef = useRef<NodeJS.Timeout | null>(null);
  const autoResolutionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resolvedBetsRef = useRef<Set<string>>(new Set());
  const forceResolveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBetEndTimeRef = useRef<number | null>(null);
  const betResolutionTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isInitialLoadRef = useRef(true);
  const candlesByMinuteRef = useRef<Map<number, Candle>>(new Map());
  const isPlacingBetRef = useRef(false);
  const isNavigatingHomeRef = useRef(false);
  const isFirstLoadRef = useRef(true);
  const currentGameStateRef = useRef<GameState>(GameState.ESPERANDO_VELA_ACTUAL);
  const currentCandleMinuteRef = useRef<number | null>(null);
  const isRestartingGameRef = useRef(false);
  const hasCheckedForUnresolvedBetsRef = useRef(false);
  
  // Update currentGameStateRef when gameState changes
  useEffect(() => {
    currentGameStateRef.current = gameState;
  }, [gameState]);
  
  // Add debug function to log current state
  const logDebugState = () => {
    const now = new Date();
    console.log(`\n[DEBUG STATE] Current time: ${now.toLocaleTimeString()}`);
    console.log(`[DEBUG STATE] Current minute: ${now.getMinutes()}`);
    
    // Log current candle
    if (currentCandle) {
      const candleDate = new Date(currentCandle.timestamp);
      console.log(`[DEBUG STATE] Current candle: ${candleDate.toLocaleTimeString()}, minute: ${candleDate.getMinutes()}, isClosed: ${currentCandle.isClosed}`);
    } else {
      console.log(`[DEBUG STATE] Current candle: null`);
    }
    
    // Log historical candles (last 3)
    console.log(`[DEBUG STATE] Historical candles (last 3):`);
    const lastCandles = historicalCandles.slice(-3);
    lastCandles.forEach((candle, index) => {
      const candleDate = new Date(candle.timestamp);
      console.log(`[DEBUG STATE]   ${index}: ${candleDate.toLocaleTimeString()}, minute: ${candleDate.getMinutes()}, isClosed: ${candle.isClosed}`);
    });
    
    // Log active bets
    console.log(`[DEBUG STATE] Active bets: ${activeBets.length}`);
    activeBets.forEach((bet, index) => {
      const betDate = new Date(bet.candleTimestamp);
      console.log(`[DEBUG STATE]   Bet ${index}: minute: ${bet.candleMinute}, timestamp: ${betDate.toLocaleTimeString()}, prediction: ${bet.prediction}, doubleBet: ${bet.isDoubleBet}`);
    });
    
    // Log candles by minute map
    console.log(`[DEBUG STATE] Candles by minute map:`);
    candlesByMinuteRef.current.forEach((candle, minute) => {
      const candleDate = new Date(candle.timestamp);
      console.log(`[DEBUG STATE]   Minute ${minute}: ${candleDate.toLocaleTimeString()}, open: ${candle.open}, close: ${candle.close}, isClosed: ${candle.isClosed}`);
    });

    // Log current coins
    console.log(`[DEBUG STATE] Current coins: ${coins}`);
    console.log(`[DEBUG STATE] Double bet mode: ${isDoubleBet}`);
    console.log(`[DEBUG STATE] Current game state: ${GameState[gameState]}`);
    console.log(`[DEBUG STATE] Has bet on current candle: ${hasBetOnCurrentCandle}`);
    console.log(`[DEBUG STATE] Lucky bonus active: ${luckyBonus}`);
    console.log(`[DEBUG STATE] Is placing bet: ${isPlacingBetRef.current}`);
    console.log(`[DEBUG STATE] Game over shown: ${gameOverShown}`);
    console.log(`[DEBUG STATE] Is restarting game: ${isRestartingGameRef.current}`);
    console.log(`[DEBUG STATE] Platform: ${Platform.OS}`);
    console.log(`[DEBUG STATE] Has unresolved bets: ${hasUnresolvedBets}`);
    console.log(`[DEBUG STATE] Has checked for unresolved bets: ${hasCheckedForUnresolvedBetsRef.current}`);
    console.log(`[DEBUG STATE] Current bet amount options:`, betAmountOptions);
  };
  
  // Save game state before navigating away
  const saveCurrentGameState = async () => {
    try {
      const gameStateData = {
        betAmount,
        betAmountIndex,
        activeBets,
        sessionBets,
        bettedCandles,
        gameState,
        nextBetMultiplier,
        pendingPrediction,
        activePrediction,
        isDoubleBet,
        hasBetOnCurrentCandle,
        historicalCandles,
        currentCandle
      };
      
      await saveGameState(gameStateData);
      console.log('[DEBUG] Game state saved successfully');
      setIsSaved(true);
      
      // Reset saved state after 2 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving game state:', error);
      Alert.alert('Error', 'No se pudo guardar el estado del juego');
    }
  };
  
  // Navigate to home screen
  const navigateToHome = () => {
    isNavigatingHomeRef.current = true;
    saveCurrentGameState();
    navigation.navigate('Home' as never);
  };
  
  // Check for game over conditions
  useEffect(() => {
    // Only show game over modal when coins are exactly 0
    // AND there are no active bets (meaning we're not waiting for a bet resolution)
    // AND we're not in the process of placing a bet
    // AND game over hasn't been shown already
    // AND we're not in the process of restarting the game
    if (coins === 0 && activeBets.length === 0 && !isPlacingBetRef.current && !gameOverShown && !isRestartingGameRef.current) {
      console.log('[DEBUG] Coins check: Coins = 0, no active bets, not placing bet - showing game over modal');
      playSound('gameOver');
      setShowGameOverModal(true);
      setGameOverShown(true); // Mark that we've shown the game over modal
    }
  }, [coins, activeBets.length, gameOverShown]);
  
  useEffect(() => {
    const initGame = async () => {
      try {
        setIsLoading(true);
        
        // Try to load saved game state
        const savedState = await loadGameState();
        
        if (savedState) {
          console.log('[DEBUG] Loaded saved game state');
          
          // Restore all game state from saved data
          setBetAmount(savedState.betAmount || 10);
          setBetAmountIndex(savedState.betAmountIndex || 0);
          setActiveBets(savedState.activeBets || []);
          setSessionBets(savedState.sessionBets || []);
          setBettedCandles(savedState.bettedCandles || []);
          setGameState(savedState.gameState || GameState.ESPERANDO_VELA_ACTUAL);
          setNextBetMultiplier(savedState.nextBetMultiplier || 1);
          setPendingPrediction(savedState.pendingPrediction || null);
          setActivePrediction(savedState.activePrediction || null);
          setIsDoubleBet(savedState.isDoubleBet || false);
          setHasBetOnCurrentCandle(savedState.hasBetOnCurrentCandle || false);
          
          // Restore candles if available
          if (savedState.historicalCandles && savedState.historicalCandles.length > 0) {
            setHistoricalCandles(savedState.historicalCandles);
          }
          
          if (savedState.currentCandle) {
            setCurrentCandle(savedState.currentCandle);
          }
          
          // Restore resolved bets set
          if (savedState.activeBets) {
            const resolvedBetIds = new Set<string>();
            savedState.sessionBets.forEach(bet => {
              if (bet.resultado !== 'pendiente') {
                resolvedBetIds.add(bet.id);
              }
            });
            resolvedBetsRef.current = resolvedBetIds;
          }
          
          // If we have saved candles, update the candlesByMinuteRef
          if (savedState.historicalCandles) {
            savedState.historicalCandles.forEach(candle => {
              const date = new Date(candle.timestamp);
              const minute = date.getMinutes();
              candlesByMinuteRef.current.set(minute, candle);
            });
          }
          
          if (savedState.currentCandle) {
            const date = new Date(savedState.currentCandle.timestamp);
            const minute = date.getMinutes();
            candlesByMinuteRef.current.set(minute, savedState.currentCandle);
            lastCandleOpenTimeRef.current = savedState.currentCandle.timestamp;
          }
        } else {
          // If no saved state, clear session bets on first load
          if (isFirstLoadRef.current) {
            setSessionBets([]);
            setBettedCandles([]);
            setActiveBets([]);
            resolvedBetsRef.current.clear();
            isFirstLoadRef.current = false;
          }
        }
        
        await syncServerTime();
        
        // Only fetch new candles if we don't have saved ones
        if (!savedState || !savedState.historicalCandles || savedState.historicalCandles.length === 0) {
          await refreshCandles();
        } else {
          // If we have saved candles, just set up the websocket
          setupWebSocket();
        }
        
        setIsLoading(false);
        setGameStarted(true);
        
        // Calculate initial state based on current time
        calcularEstadoInicial();
        
        // Start timers
        startTimerCheck();
        startAutoResolveTimer();
        
        // Reset the flag to check for unresolved bets
        hasCheckedForUnresolvedBetsRef.current = false;
        
        // Log initial state
        setTimeout(logDebugState, 1000);
        
        // Check for unresolved bets immediately after loading
        setTimeout(() => {
          if (!hasCheckedForUnresolvedBetsRef.current) {
            console.log('[DEBUG] Checking for unresolved bets after initialization');
            checkForPendingBetsToResolve();
            hasCheckedForUnresolvedBetsRef.current = true;
          }
        }, 2000);
      } catch (error) {
        console.error('Error initializing game:', error);
        Alert.alert('Connection Error', 'Could not connect to Binance.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    };
    
    initGame();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmarSalida();
      return true;
    });
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Focus listener to handle returning to the game screen
    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (isNavigatingHomeRef.current) {
        isNavigatingHomeRef.current = false;
        console.log('[DEBUG] Returned to game from home screen');
        
        // When returning from home screen, immediately check for bets that need resolution
        setTimeout(() => {
          console.log('[DEBUG] Checking for unresolved bets after returning from home screen');
          checkForPendingBetsToResolve();
          forceResolvePendingBets();
        }, 1000);
      }
    });
    
    return () => {
      closeWebSocket();
      backHandler.remove();
      subscription.remove();
      unsubscribeFocus();
      if (autoResolveTimerRef.current) clearInterval(autoResolveTimerRef.current);
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
      if (autoResolutionTimerRef.current) clearTimeout(autoResolutionTimerRef.current);
      if (forceResolveTimeoutRef.current) clearTimeout(forceResolveTimeoutRef.current);
      
      // Clear all bet resolution timers
      betResolutionTimersRef.current.forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);
  
  // Store candles by minute for easier lookup
  useEffect(() => {
    // Update candlesByMinuteRef when historical candles change
    candlesByMinuteRef.current.clear();
    historicalCandles.forEach(candle => {
      const date = new Date(candle.timestamp);
      const minute = date.getMinutes();
      candlesByMinuteRef.current.set(minute, candle);
    });
    
    // Also add current candle if it exists
    if (currentCandle) {
      const date = new Date(currentCandle.timestamp);
      const minute = date.getMinutes();
      candlesByMinuteRef.current.set(minute, currentCandle);
      
      // Update current candle minute reference
      currentCandleMinuteRef.current = minute;
    }
    
    // Debug log
    console.log('[DEBUG] Updated candles by minute map:');
    candlesByMinuteRef.current.forEach((candle, minute) => {
      console.log(`[DEBUG] Minute ${minute}: Candle timestamp ${new Date(candle.timestamp).toLocaleTimeString()}, open: ${candle.open}, close: ${candle.close}`);
    });
    
    // Log full state after candles update
    setTimeout(logDebugState, 500);
  }, [historicalCandles, currentCandle]);
  
  // Start a timer check that runs frequently to ensure we transition to betting phase
  const startTimerCheck = () => {
    if (timerCheckRef.current) clearInterval(timerCheckRef.current);
    timerCheckRef.current = setInterval(() => {
      // If we're waiting for the current candle and time is up, start betting phase
      if (gameState === GameState.ESPERANDO_VELA_ACTUAL && timeRemaining <= 0) {
        console.log('[DEBUG] Timer reached 0, starting betting phase');
        iniciarFaseApuesta();
      }
      
      // If we're in betting phase and time is up, go back to waiting
      if (gameState === GameState.FASE_APUESTA && bettingTimeRemaining <= 0) {
        console.log('[DEBUG] Betting time reached 0, going back to waiting');
        setGameState(GameState.ESPERANDO_VELA_ACTUAL);
        setMensajeApuesta('Betting time expired');
        
        // Calculate next candle timestamp
        const ahora = Date.now() + serverTimeOffsetRef.current;
        const nextMinuteTimestamp = (Math.floor(ahora/60000)+1)*60000;
        setTimeRemaining((nextMinuteTimestamp - ahora)/1000);
        setNextCandleTimestamp(nextMinuteTimestamp);
      }
      
      // Check if we need to auto-resolve bets
      const now = Date.now() + serverTimeOffsetRef.current;
      if (lastBetEndTimeRef.current && now - lastBetEndTimeRef.current > 1000) {
        // If it's been more than 1 second since a bet ended, auto-resolve
        if (activeBets.length > 0) {
          console.log('[DEBUG] Auto-triggering force resolve after 1 second');
          forceResolvePendingBets();
          lastBetEndTimeRef.current = null; // Reset after resolving
        }
      }
      
      // Check if player has exactly 0 coins and show game over modal
      // Only if there are no active bets and we're not placing a bet
      // AND game over hasn't been shown already
      // AND we're not in the process of restarting the game
      if (coins === 0 && activeBets.length === 0 && !isPlacingBetRef.current && !gameOverShown && !isRestartingGameRef.current) {
        console.log('[DEBUG] No coins, no active bets, not placing bet - showing game over modal');
        playSound('gameOver');
        setShowGameOverModal(true);
        setGameOverShown(true); // Mark that we've shown the game over modal
      }
      
      // Check for unresolved bets that should have been resolved
      checkForUnresolvedBets();
    }, 500); // Check every 500ms
  };
  
  // Check for unresolved bets that should have been resolved
  const checkForUnresolvedBets = () => {
    if (activeBets.length === 0) {
      setHasUnresolvedBets(false);
      return;
    }
    
    const now = Date.now() + serverTimeOffsetRef.current;
    
    // Check if there are any bets that should have been resolved
    // A bet should be resolved if:
    // 1. It's not already resolved
    // 2. The candle has closed (60 seconds have passed since the candle timestamp)
    // 3. We're not in the middle of the candle's formation (it's not the current active candle)
    const unresolvedBets = activeBets.filter(bet => {
      // Skip if already resolved
      if (resolvedBetsRef.current.has(bet.sessionBetId)) return false;
      
      // Check if the bet's candle has closed (60 seconds have passed)
      const candleEndTime = bet.candleTimestamp + 60000;
      
      // Check if this is the current forming candle
      const isCurrentFormingCandle = currentCandle && 
                                    currentCandle.timestamp === bet.candleTimestamp && 
                                    !currentCandle.isClosed;
      
      // Only consider it unresolved if:
      // - The candle end time has passed
      // - It's not the current forming candle
      return now >= candleEndTime && !isCurrentFormingCandle;
    });
    
    setHasUnresolvedBets(unresolvedBets.length > 0);
  };
  
  // New function to check for pending bets that should be resolved
  const checkForPendingBetsToResolve = () => {
    if (activeBets.length === 0) return;
    
    const now = Date.now() + serverTimeOffsetRef.current;
    const currentMinute = new Date(now).getMinutes();
    
    console.log(`[DEBUG] Checking for pending bets to resolve. Current minute: ${currentMinute}, Active bets: ${activeBets.length}`);
    
    // Check each active bet
    activeBets.forEach(bet => {
      // Skip if already resolved
      if (resolvedBetsRef.current.has(bet.sessionBetId)) {
        console.log(`[DEBUG] Bet ${bet.sessionBetId} already resolved, skipping`);
        return;
      }
      
      console.log(`[DEBUG] Checking bet for minute ${bet.candleMinute}, current minute: ${currentMinute}`);
      
      // Get the candle for this bet's minute
      const candleForBet = candlesByMinuteRef.current.get(bet.candleMinute);
      
      // If we have a closed candle for this minute, resolve the bet
      if (candleForBet && candleForBet.isClosed) {
        console.log(`[DEBUG] Found closed candle for bet minute ${bet.candleMinute}, resolving bet ${bet.sessionBetId}`);
        
        // Update the bet with the candle data
        const updatedBet: ActiveBet = {
          ...bet,
          openPrice: candleForBet.open,
          closePrice: candleForBet.close
        };
        
        // Show notification
        showAutoResolutionNotification();
        
        // Resolve the bet
        resolverApuestaPorVela(updatedBet);
      }
      // If the bet's minute has passed and we don't have a candle, use current price
      else if (bet.candleMinute !== currentMinute && 
               (currentMinute !== (bet.candleMinute + 1) % 60) && 
               (currentMinute !== (bet.candleMinute - 1 + 60) % 60)) {
        console.log(`[DEBUG] Bet minute ${bet.candleMinute} has passed (current: ${currentMinute}), resolving with current price`);
        
        // Get current price
        const currentPrice = getCurrentPrice();
        
        // Update the bet with the current price
        const updatedBet: ActiveBet = {
          ...bet,
          openPrice: bet.initialPrice,
          closePrice: currentPrice
        };
        
        // Show notification
        showAutoResolutionNotification();
        
        // Resolve the bet
        resolverApuestaPorVela(updatedBet);
      }
      // Check if the bet's candle has ended (60 seconds have passed since timestamp)
      else {
        const candleEndTime = bet.candleTimestamp + 60000;
        if (now >= candleEndTime) {
          console.log(`[DEBUG] Bet candle has ended (timestamp: ${new Date(bet.candleTimestamp).toLocaleTimeString()}), resolving with current price`);
          
          // Get current price
          const currentPrice = getCurrentPrice();
          
          // Update the bet with the current price
          const updatedBet: ActiveBet = {
            ...bet,
            openPrice: bet.initialPrice,
            closePrice: currentPrice
          };
          
          // Show notification
          showAutoResolutionNotification();
          
          // Resolve the bet
          resolverApuestaPorVela(updatedBet);
        }
      }
    });
  };
  
  // Simple auto-resolve timer that checks every second
  const startAutoResolveTimer = () => {
    if (autoResolveTimerRef.current) clearInterval(autoResolveTimerRef.current);
    autoResolveTimerRef.current = setInterval(() => {
      // Only proceed if we have active bets
      if (activeBets.length === 0) return;
      
      const now = Date.now() + serverTimeOffsetRef.current;
      
      // Check each active bet
      activeBets.forEach(bet => {
        // Skip if already resolved
        if (resolvedBetsRef.current.has(bet.sessionBetId)) return;
        
        // Calculate if 60 seconds have passed since the candle timestamp
        const candleEndTime = bet.candleTimestamp + 60000;
        
        // If the candle has ended, resolve the bet
        if (now >= candleEndTime) {
          console.log(`[DEBUG] Auto-resolving bet for candle at ${new Date(bet.candleTimestamp).toLocaleTimeString()}, minute: ${bet.candleMinute}`);
          
          // Set the last bet end time to trigger auto force resolve if needed
          lastBetEndTimeRef.current = now;
          
          // Show notification
          showAutoResolutionNotification();
          
          // Get current price if we don't have close price
          const currentPrice = getCurrentPrice();
          
          // Create updated bet with all necessary data
          const updatedBet = {
            ...bet,
            closePrice: currentPrice
          };
          
          // Resolve the bet
          resolverApuestaPorVela(updatedBet);
        }
      });
    }, 1000);
  };
  
  // Function to show auto-resolution notification
  const showAutoResolutionNotification = () => {
    setShowAutoResolutionNotice(true);
    
    // Animate notification in
    RNAnimated.timing(autoResolutionOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Set timer to hide notification
    if (autoResolutionTimerRef.current) {
      clearTimeout(autoResolutionTimerRef.current);
    }
    
    autoResolutionTimerRef.current = setTimeout(() => {
      RNAnimated.timing(autoResolutionOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setShowAutoResolutionNotice(false);
      });
    }, 2000); // Changed from 3000 to 2000 ms
  };
  
  const calcularEstadoInicial = () => {
    if (!lastCandleOpenTimeRef.current) return;
    
    const ahora = Date.now() + serverTimeOffsetRef.current;
    const inicioVela = lastCandleOpenTimeRef.current;
    const finVela = inicioVela + 60000;
    
    if (ahora < finVela) {
      // Estamos en medio de una vela, esperar a que termine
      setGameState(GameState.ESPERANDO_VELA_ACTUAL);
      setTimeRemaining((finVela - ahora) / 1000);
      setMensajeApuesta('Wait for the current candle to finish to bet');
      setNextCandleTimestamp(finVela);
    } else {
      // La vela actual ya terminó, podemos apostar a la siguiente
      iniciarFaseApuesta();
    }
  };
  
  const iniciarFaseApuesta = () => {
    setGameState(GameState.FASE_APUESTA);
    
    // Check if player has exactly 0 coins before starting betting phase
    // Only if there are no active bets and we're not placing a bet
    // AND game over hasn't been shown already
    // AND we're not in the process of restarting the game
    if (coins === 0 && activeBets.length === 0 && !isPlacingBetRef.current && !gameOverShown && !isRestartingGameRef.current) {
      console.log('[DEBUG] No coins at start of betting phase, showing game over modal');
      playSound('gameOver');
      setShowGameOverModal(true);
      setGameOverShown(true); // Mark that we've shown the game over modal
      return;
    }
    
    // Reset hasBetOnCurrentCandle flag when starting a new betting phase
    setHasBetOnCurrentCandle(false);
    
    setMensajeApuesta(`Choose your bet! (10s) - Bet ${betAmount} coins`);
    setBettingTimeRemaining(10);
    
    const ahora = Date.now() + serverTimeOffsetRef.current;
    // Calcular el timestamp de la próxima vela (siguiente minuto)
    const nextMinuteTimestamp = (Math.floor(ahora/60000)+1)*60000;
    
    setTimeRemaining((nextMinuteTimestamp - ahora)/1000);
    setNextCandleTimestamp(nextMinuteTimestamp);
    setPendingPrediction(null);
    
    const nextMinuteDate = new Date(nextMinuteTimestamp);
    console.log(`[DEBUG] Started betting phase at ${new Date().toLocaleTimeString()}`);
    console.log(`[DEBUG] Next candle at ${nextMinuteDate.toLocaleTimeString()}, minute: ${nextMinuteDate.getMinutes()}`);
  };
  
  const syncServerTime = async () => {
    try {
      const serverTime = await getServerTime();
      const localTime = Date.now();
      serverTimeOffsetRef.current = serverTime - localTime;
      console.log(`[DEBUG] Server time offset: ${serverTimeOffsetRef.current}ms`);
      return serverTime;
    } catch (error) {
      console.error('Error syncing time:', error);
      return Date.now();
    }
  };
  
  const refreshCandles = async () => {
    try {
      setIsRefreshing(true);
      
      // Store current game state before refreshing
      const currentGameState = currentGameStateRef.current;
      console.log(`[DEBUG] Refreshing candles. Current game state: ${GameState[currentGameState]}`);
      
      const velas = await getHistoricalCandles('BTCUSDT', '1m', 25);
      setHistoricalCandles(velas);
      
      if (velas.length > 0) {
        const ultima = velas[velas.length - 1];
        lastCandleOpenTimeRef.current = ultima.timestamp;
        console.log(`[DEBUG] Last candle timestamp: ${new Date(ultima.timestamp).toLocaleTimeString()}, minute: ${new Date(ultima.timestamp).getMinutes()}`);
      }
      
      setupWebSocket();
      
      // Only recalculate initial state if we're not in betting phase
      if (currentGameState !== GameState.FASE_APUESTA) {
        calcularEstadoInicial();
      } else {
        console.log('[DEBUG] Preserving betting phase during refresh');
      }
      
      setIsRefreshing(false);
      
      // Log state after refresh
      setTimeout(logDebugState, 500);
      
      // Check for unresolved bets after refreshing candles
      setTimeout(() => {
        console.log('[DEBUG] Checking for unresolved bets after refreshing candles');
        checkForPendingBetsToResolve();
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Could not load recent data.');
      setIsRefreshing(false);
    }
  };
  
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      closeWebSocket();
      if (autoResolveTimerRef.current) clearInterval(autoResolveTimerRef.current);
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
      if (autoResolutionTimerRef.current) clearTimeout(autoResolutionTimerRef.current);
      if (forceResolveTimeoutRef.current) clearTimeout(forceResolveTimeoutRef.current);
      
      // Save game state when app goes to background
      saveCurrentGameState();
      
      // Clear all bet resolution timers
      betResolutionTimersRef.current.forEach(timer => {
        clearTimeout(timer);
      });
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      setupWebSocket();
      syncServerTime().then(() => {
        calcularEstadoInicial();
      });
      startAutoResolveTimer();
      startTimerCheck();
      
      // Check for unresolved bets when app comes back to foreground
      setTimeout(() => {
        console.log('[DEBUG] Checking for unresolved bets after app comes to foreground');
        checkForPendingBetsToResolve();
      }, 1000);
    }
    appState.current = nextAppState;
  };
  
  const setupWebSocket = () => {
    closeWebSocket();
    const ws = createCandleWebSocket('btcusdt', '1m', handleWebSocketMessage, handleWebSocketError);
    webSocketRef.current = ws;
  };
  
  const closeWebSocket = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
  };
  
  const handleWebSocketMessage = (vela: Candle) => {
    const velaDate = new Date(vela.timestamp);
    console.log(`[DEBUG] Received candle: ${velaDate.toLocaleTimeString()}, minute: ${velaDate.getMinutes()}, isClosed: ${vela.isClosed}`);
    
    // Log current time to compare with candle time
    const now = new Date();
    console.log(`[DEBUG] Current time: ${now.toLocaleTimeString()}, minute: ${now.getMinutes()}`);
    
    // Check if this is a duplicate or out-of-order candle
    if (currentCandle) {
      const currentDate = new Date(currentCandle.timestamp);
      console.log(`[DEBUG] Current candle time: ${currentDate.toLocaleTimeString()}, minute: ${currentDate.getMinutes()}`);
      
      // Check if this is the same candle but with updated data
      if (currentCandle.timestamp === vela.timestamp) {
        console.log(`[DEBUG] Updating existing candle data for minute ${velaDate.getMinutes()}`);
      } 
      // Check if this is a new candle
      else if (vela.timestamp > currentCandle.timestamp) {
        console.log(`[DEBUG] New candle received for minute ${velaDate.getMinutes()}`);
      }
      // Check if this is an old candle (should not happen)
      else {
        console.log(`[DEBUG] WARNING: Received older candle for minute ${velaDate.getMinutes()}`);
      }
    }
    
    setCurrentCandle(vela);
    
    // Store candle by minute for easier lookup
    const minute = velaDate.getMinutes();
    candlesByMinuteRef.current.set(minute, vela);
    
    // Si recibe una vela nueva diferente a la registrada
    if (vela.timestamp !== lastCandleOpenTimeRef.current) {
      console.log(`[DEBUG] New candle detected: ${velaDate.toLocaleTimeString()}, minute: ${minute}`);
      
      // Actualizar la referencia a la vela actual
      lastCandleOpenTimeRef.current = vela.timestamp;
      
      // Reset hasBetOnCurrentCandle flag for the new candle
      setHasBetOnCurrentCandle(false);
      
      // Verificar si hay apuestas para esta nueva vela
      const betsForThis = activeBets.filter(bet => bet.candleMinute === minute);
      if (betsForThis.length > 0) {
        const bet = betsForThis[0];
        setActivePrediction(bet.prediction);
        setGameState(GameState.OBSERVANDO_VELA);
        const betTypeText = bet.isDoubleBet ? '(DOUBLE BET)' : '';
        setMensajeApuesta(`Observing candle with bet: ${bet.prediction === 'bull' ?'🐂 BULL (BULLISH)' : '🐻 BEAR (BEARISH)'} ${betTypeText} (${bet.amount} coins)`);
        
        // Update the bet with the opening price of the candle
        setActiveBets(prev => prev.map(b => {
          if (b.sessionBetId === bet.sessionBetId) {
            return {
              ...b,
              openPrice: vela.open,
              candleTimestamp: vela.timestamp // Update with actual timestamp
            };
          }
          return b;
        }));
      } else if (gameState === GameState.FASE_APUESTA) {
        // Si estábamos en fase de apuesta pero no se apostó
        setGameState(GameState.ESPERANDO_VELA_ACTUAL);
        setMensajeApuesta('No bet placed for this candle.');
      }
      
      // Actualizar el historial de velas cuando llega una nueva
      if (historicalCandles.length > 0) {
        const lastHistoricalCandle = historicalCandles[historicalCandles.length - 1];
        if (lastHistoricalCandle.timestamp !== vela.timestamp && lastHistoricalCandle.isClosed) {
          setHistoricalCandles(prev => [...prev.slice(1), lastHistoricalCandle]);
        }
      }
    }
    
    // Cuando la vela actual se cierra
    if (vela.isClosed && vela.timestamp === lastCandleOpenTimeRef.current) {
      console.log(`[DEBUG] Current candle closed: ${velaDate.toLocaleTimeString()}, minute: ${minute}`);
      
      // Calculate candle size (high - low) and add to candleSizes array
      const candleSize = vela.high - vela.low;
      console.log(`[DEBUG] Candle size: $${candleSize.toFixed(2)}`);
      
      // Add candle size to the array
      addCandleSize(candleSize);
      
      // Actualizar el historial de velas con la vela cerrada
      setHistoricalCandles(prev => {
        const newCandles = [...prev];
        const lastIndex = newCandles.length - 1;
        
        // Si la última vela en el historial es la misma que acaba de cerrarse, actualizarla
        if (newCandles[lastIndex]?.timestamp === vela.timestamp) {
          newCandles[lastIndex] = vela;
        } else {
          // Si no, añadir la nueva vela cerrada y quitar la más antigua
          newCandles.push(vela);
          newCandles.shift();
        }
        
        return newCandles;
      });
      
      // Verificar si hay apuestas para esta vela que acaba de cerrarse
      const betsForClosedCandle = activeBets.filter(bet => bet.candleMinute === minute);
      if (betsForClosedCandle.length > 0) {
        // Show auto-resolution notification if there are bets to resolve
        if (betsForClosedCandle.length > 0) {
          showAutoResolutionNotification();
        }
        
        // Update the bets with the closing price and resolve them
        betsForClosedCandle.forEach(bet => {
          const updatedBet = {
            ...bet,
            openPrice: vela.open, // Asegurarse de usar el precio de apertura de la vela
            closePrice: vela.close, // Usar el precio de cierre de la vela
            candleTimestamp: vela.timestamp // Update with actual timestamp
          };
          
          // Update the active bet
          setActiveBets(prev => prev.map(b => 
            b.sessionBetId === bet.sessionBetId ? updatedBet : b
          ));
          
          // Resolve the bet with the updated data
          resolverApuestaPorVela(updatedBet);
        });
        
        // Set the last bet end time to trigger auto force resolve if needed
        lastBetEndTimeRef.current = Date.now() + serverTimeOffsetRef.current;
      }
      
      // Iniciar nueva fase de apuesta después de resolver las apuestas
      setTimeout(() => {
        iniciarFaseApuesta();
      }, 1000); // Dar tiempo para que se muestre el resultado antes de iniciar nueva fase
    }
    
    // Check for any pending bets that can be resolved with this new candle
    setTimeout(() => {
      checkForPendingBetsToResolve();
    }, 500);
    
    // Log state after processing the message
    setTimeout(logDebugState, 500);
  };
  
  const handleWebSocketError = (error: any) => {
    Alert.alert('Connection Error', 'Lost connection to Binance', [{ text: 'Retry', onPress: setupWebSocket }]);
  };
  
  useEffect(() => {
    if (!gameStarted || isLoading || !nextCandleTimestamp) return;
    
    const timer = setInterval(() => {
      const ahora = Date.now() + serverTimeOffsetRef.current;
      const restante = Math.max(0, (nextCandleTimestamp - ahora)/1000);
      setTimeRemaining(restante);
      
      if (restante <= 0) {
        clearInterval(timer);
        if (gameState === GameState.FASE_APUESTA) {
          setMensajeApuesta('Betting time expired');
          setGameState(GameState.ESPERANDO_VELA_ACTUAL);
        } else if (gameState === GameState.ESPERANDO_VELA_ACTUAL) {
          // If we're waiting and time is up, start betting phase
          iniciarFaseApuesta();
        }
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [gameStarted, isLoading, nextCandleTimestamp, gameState]);
  
  useEffect(() => {
    if (gameState !== GameState.FASE_APUESTA) return;
    
    const timer = setInterval(() => {
      setBettingTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          setMensajeApuesta('Betting time expired');
          setGameState(GameState.ESPERANDO_VELA_ACTUAL);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [gameState]);
  
  // Función para determinar si una vela es alcista (verde)
  const isCandleBullish = (openPrice: number, closePrice: number): boolean => {
    return closePrice > openPrice;
  };
  
  // Función para obtener el color de la vela como string
  const getCandleColor = (openPrice: number, closePrice: number): 'green' | 'red' => {
    return isCandleBullish(openPrice, closePrice) ? 'green' : 'red';
  };
  
  // Check for streak milestones and award bonuses
  const checkStreakMilestones = (newStreak: number) => {
    if (newStreak === 10) {
      // 10 streak bonus: +100 coins, next bet x5
      setStreakBonusInfo({
        streak: 10,
        multiplier: 5,
        coinsAwarded: 100
      });
      setShowStreakBonus(true);
      addCoins(100);
      showCoinsAnimation(100, { x: 200, y: 100 });
      setNextBetMultiplier(5);
    } else if (newStreak === 7) {
      // 7 streak bonus: +50 coins, next bet x4
      setStreakBonusInfo({
        streak: 7,
        multiplier: 4,
        coinsAwarded: 50
      });
      setShowStreakBonus(true);
      addCoins(50);
      showCoinsAnimation(50, { x: 200, y: 100 });
      setNextBetMultiplier(4);
    } else if (newStreak === 5) {
      // 5 streak bonus: +25 coins, next bet x3
      setStreakBonusInfo({
        streak: 5,
        multiplier: 3,
        coinsAwarded: 25
      });
      setShowStreakBonus(true);
      addCoins(25);
      showCoinsAnimation(25, { x: 200, y: 100 });
      setNextBetMultiplier(3);
    } else if (newStreak === 3) {
      // 3 streak bonus: +10 coins, next bet x2
      setStreakBonusInfo({
        streak: 3,
        multiplier: 2,
        coinsAwarded: 10
      });
      setShowStreakBonus(true);
      addCoins(10);
      showCoinsAnimation(10, { x: 200, y: 100 });
      setNextBetMultiplier(2);
    }
  };
  
  const resolverApuestaPorVela = (bet: ActiveBet) => {
    // Prevenir resoluciones duplicadas
    if (resolvedBetsRef.current.has(bet.sessionBetId)) {
      console.log(`[DEBUG] Bet ${bet.sessionBetId} already resolved, skipping`);
      return;
    }
    
    // Marcar esta apuesta como resuelta para evitar duplicados
    resolvedBetsRef.current.add(bet.sessionBetId);
    
    // Buscar la vela por minuto exacto
    const candleForBet = candlesByMinuteRef.current.get(bet.candleMinute);
    
    // Si no encontramos la vela por minuto, intentar buscarla por timestamp
    const candleByTimestamp = !candleForBet && 
      (currentCandle?.timestamp === bet.candleTimestamp 
        ? currentCandle 
        : historicalCandles.find(c => c.timestamp === bet.candleTimestamp));
    
    // Usar la vela encontrada o los precios de la apuesta
    const openPrice = candleForBet?.open || candleByTimestamp?.open || bet.openPrice || bet.initialPrice || 0;
    const closePrice = candleForBet?.close || candleByTimestamp?.close || bet.closePrice || getCurrentPrice();
    
    // Verificar que tenemos precios válidos
    if (openPrice <= 0 || closePrice <= 0) {
      console.error(`[ERROR] Invalid prices for bet ${bet.sessionBetId}: open=${openPrice}, close=${closePrice}`);
      return;
    }
    
    console.log(`[DEBUG] Resolving bet ${bet.sessionBetId}:`);
    console.log(`[DEBUG] Prediction: ${bet.prediction}`);
    console.log(`[DEBUG] Candle minute: ${bet.candleMinute}`);
    console.log(`[DEBUG] Open price: ${openPrice}`);
    console.log(`[DEBUG] Close price: ${closePrice}`);
    console.log(`[DEBUG] Double bet: ${bet.isDoubleBet}`);
    console.log(`[DEBUG] Lucky bonus active: ${luckyBonus}`);
    
    // Determinar el color de la vela
    const isBullish = closePrice > openPrice;
    const candleColor = isBullish ? '#16a34a' : '#dc2626';
    
    console.log(`[DEBUG] Candle color: ${candleColor} (${isBullish ? 'bullish' : 'bearish'})`);
    
    // Determinar si la apuesta fue correcta basada en el color de la vela
    // Bull gana con velas verdes, Bear gana con velas rojas
    let isWin = false;
    
    if (bet.prediction === 'bull') {
      isWin = candleColor === '#16a34a';
      console.log(`[DEBUG] Bull prediction with ${candleColor} candle: ${isWin ? 'WIN' : 'LOSE'}`);
    } else if (bet.prediction === 'bear') {
      isWin = candleColor === '#dc2626';
      console.log(`[DEBUG] Bear prediction with ${candleColor} candle: ${isWin ? 'WIN' : 'LOSE'}`);
    }
    
    let resultado: 'ganó' | 'perdió' | 'pendiente' = isWin ? 'ganó' : 'perdió';
    
    // Calculate candle size for both win and loss cases
    const candleForSize = candleForBet || candleByTimestamp;
    let candleSize = 0;
    
    if (candleForSize) {
      candleSize = candleForSize.high - candleForSize.low;
    } else {
      // Fallback if we don't have the candle
      candleSize = Math.abs(closePrice - openPrice);
    }
    
    if (isWin) {
      playSound('success');
      
      // Calculate winnings with multiplier
      // Apply lucky bonus if active (x2) or use nextBetMultiplier if > 1, otherwise use default 2x
      let betMultiplier = 2; // Default multiplier
      
      if (luckyBonus) {
        betMultiplier = 2; // Lucky bonus guarantees 2x
        setLuckyBonus(false); // Reset lucky bonus after use
        console.log('[DEBUG] Applied lucky bonus multiplier (2x)');
      } else if (nextBetMultiplier > 1) {
        betMultiplier = nextBetMultiplier;
        setNextBetMultiplier(1); // Reset next bet multiplier after use
        console.log(`[DEBUG] Applied streak bonus multiplier (${betMultiplier}x)`);
      }
      
      // Calculate base winnings
      const baseWinnings = bet.amount * betMultiplier;
      
      // Calculate size bonus using the updated bonus scale
      const { bonusPercentage } = calculateSizeBonus(candleSize);
      const bonusAmount = Math.round((baseWinnings * bonusPercentage) / 100);
      
      // Total winnings with size bonus
      const totalWinnings = baseWinnings + bonusAmount;
      
      console.log(`[DEBUG] Base winnings: ${baseWinnings} coins`);
      console.log(`[DEBUG] Candle size: $${candleSize.toFixed(2)}`);
      console.log(`[DEBUG] Size bonus: ${bonusPercentage}% (${bonusAmount} coins)`);
      console.log(`[DEBUG] Total winnings: ${totalWinnings} coins`);
      
      // Check if this candle size is a record
      const recordMessage = checkCandleSizeRecord(candleSize);
      if (recordMessage) {
        console.log(`[DEBUG] Record detected: ${recordMessage}`);
      }
      
      // Add coins with bonus
      addCoins(totalWinnings);
      showCoinsAnimation(totalWinnings, { x: 200, y: 100 });
      updateScore(10);
      
      // Update streak and check for streak milestones
      const newStreak = streak + 1;
      updateStreak(true);
      
      // Check for streak milestones
      checkStreakMilestones(newStreak);
      
      showScoreAnimation(10, { x: 200, y: 150 });
      
      setLastResult({ 
        correct: true, 
        message: `You won! Candle was ${candleColor === '#16a34a' ? 'green' : 'red'} (${isBullish ? 'bullish' : 'bearish'}) as you predicted.`,
        coinsWon: totalWinnings,
        bonusAmount: bonusAmount,
        multiplierApplied: betMultiplier,
        candleSize: candleSize,
        bonusPercentage: bonusPercentage
      });
    } else {
      playSound('failure');
      
      // Lose the bet amount - for double bets, lose double the amount
      const lossAmount = bet.isDoubleBet ? bet.amount * 2 : bet.amount;
      removeCoins(lossAmount);
      
      updateStreak(false);
      showScoreAnimation(-5, { x: 200, y: 150 });
      
      // Update message based on bet type
      const lossMessage = bet.isDoubleBet 
        ? `You lost! Candle was ${candleColor === '#16a34a' ? 'green' : 'red'} (${isBullish ? 'bullish' : 'bearish'}), contrary to your prediction. Double bet cost you ${lossAmount} coins!`
        : `You lost! Candle was ${candleColor === '#16a34a' ? 'green' : 'red'} (${isBullish ? 'bullish' : 'bearish'}), contrary to your prediction.`;
      
      setLastResult({ 
        correct: false, 
        message: lossMessage,
        coinsWon: -lossAmount,
        candleSize: candleSize,
        bonusPercentage: 0
      });
    }
    
    // Actualizar la apuesta en el historial de sesión
    setSessionBets(prev => prev.map(sessionBet => {
      if (sessionBet.id === bet.sessionBetId) {
        return { 
          ...sessionBet, 
          resultado,
          initialPrice: openPrice, // Guardar el precio de apertura de la vela
          finalPrice: closePrice, // Guardar el precio de cierre de la vela
          // Actualizar la fecha para reflejar el momento de resolución
          fecha: Date.now(),
          isDoubleBet: bet.isDoubleBet
        };
      }
      return sessionBet;
    }));
    
    // Actualizar// Actualizar la apuesta en el historial global
    updateBet(bet.sessionBetId, { 
      resultado,
      initialPrice: openPrice, // Guardar el precio de apertura de la vela
      finalPrice: closePrice, // Guardar el precio de cierre de la vela
      fecha: Date.now(), // Actualizar la fecha para reflejar el momento de resolución
      isDoubleBet: bet.isDoubleBet
    });
    
    // Mostrar el resultado
    setShowResult(true);
    setActivePrediction(null);
    
    // Eliminar la apuesta de las apuestas activas
    setActiveBets(prev => prev.filter(b => b.sessionBetId !== bet.sessionBetId));
    
    console.log(`[DEBUG] Bet resolved: ${resultado}`);
    
    // After resolving all bets, check if player has 0 coins and no active bets
    // AND game over hasn't been shown already
    // AND we're// AND we're not in the process of restarting the game
    setTimeout(() => {
      if (coins === 0 && activeBets.length === 0 && !isPlacingBetRef.current && !gameOverShown && !isRestartingGameRef.current) {
        console.log('[DEBUG] After bet resolution: No coins, no active bets - showing game over modal');
        playSound('gameOver');
        setShowGameOverModal(true);
        setGameOverShown(true); // Mark that we've shown the game over modal
      }
    }, 500);
  };
  
  useEffect(() => {
    if (showResult) {
      RNAnimated.timing(resultOpacity, {
        toValue: 1,
        duration: 300, // Faster animation
        useNativeDriver: true
      }).start();
      
      const timer = setTimeout(() => {
        RNAnimated.timing(resultOpacity, {
          toValue: 0,
          duration: 300, // Faster animation
          useNativeDriver: true
        }).start(() => {
          setShowResult(false);
        });
      }, 2000); // Changed from 3000 to 2000 ms
      
      return () => clearTimeout(timer);
    }
  }, [showResult]);
  
  useEffect(() => {
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      setPatternTimeLimit(Math.max(5 - Math.floor((newLevel-1)/2), 3));
    }
  }, [score]);
  
  const handlePredict = (pred: Prediction) => {
    // Only allow prediction if in betting phase, has enough coins, and hasn't already bet on this candle
    if (gameState === GameState.FASE_APUESTA && !hasBetOnCurrentCandle) {
      const betCost = isDoubleBet ? betAmount * 2 : betAmount;
      if (coins < betCost) {
        Alert.alert("Not Enough Coins", `You need ${betCost} coins. You have ${coins} coins.`, [{ text: "OK" }]);
        return;
      }
      setPendingPrediction(pred);
    }
  };
  
  const confirmBet = () => {
    if (!pendingPrediction || gameState !== GameState.FASE_APUESTA || hasBetOnCurrentCandle) return;
    
    // Set the flag to indicate we're in the process of placing a bet
    isPlacingBetRef.current = true;
    
    // Obtener el precio actual en el momento de la apuesta
    const currentPrice = getCurrentPrice();
    
    // Deducir monedas (double for double bet)
    const betCost = isDoubleBet ? betAmount * 2 : betAmount;
    removeCoins(betCost);
    showCoinsAnimation(-betCost, { x: 200, y: 50 });
    
    const ahora = Date.now() + serverTimeOffsetRef.current;
    
    // Determinar a qué vela se está apostando
    // Si hay una vela actual no cerrada, apostamos a ella
    // De lo contrario, apostamos a la próxima vela (siguiente minuto)
    const targetTimestamp = currentCandle && !currentCandle.isClosed 
      ? currentCandle.timestamp 
      : (Math.floor(ahora/60000)+1)*60000;
    
    // Get the exact minute of the target candle
    const targetDate = new Date(targetTimestamp);
    const targetMinute = targetDate.getMinutes();
    
    console.log(`[DEBUG] Placing bet for candle at ${targetDate.toLocaleTimeString()}, minute: ${targetMinute}`);
    console.log(`[DEBUG] Initial price (when bet is placed): ${currentPrice}`);
    console.log(`[DEBUG] Prediction: ${pendingPrediction}`);
    console.log(`[DEBUG] Double bet: ${isDoubleBet}`);
    console.log(`[DEBUG] Lucky bonus active: ${luckyBonus}`);
    
    // Crear ID único para esta apuesta
    const sessionBetId = `bet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Crear la apuesta para el historial de sesión
    const sessionBet: Bet = {
      id: sessionBetId,
      fecha: ahora,
      apuesta: pendingPrediction,
      resultado: 'pendiente',
      minuto: targetMinute,
      amount: betAmount,
      initialPrice: currentPrice, // Guardar el precio inicial cuando se hace la apuesta
      isDoubleBet: isDoubleBet // Añadir indicador de apuesta doble
    };
    
    // Añadir al historial de sesión
    setSessionBets(prev => [sessionBet, ...prev]);
    
    // Añadir al historial global
    addBet(sessionBet);
    
    // Crear la apuesta activa
    const newBet: ActiveBet = {
      prediction: pendingPrediction,
      amount: betAmount,
      timestamp: ahora,
      candleTimestamp: targetTimestamp,
      sessionBetId,
      initialPrice: currentPrice, //initialPrice: currentPrice, // Guardar el precio inicial cuando se hace la apuesta
      resolutionScheduled: false, // Initialize as not scheduled
      candleMinute: targetMinute, // Store the exact minute
      isDoubleBet: isDoubleBet // Añadir indicador de apuesta doble
    };
    
    // Añadir a las apuestas activas
    setActiveBets(prev => [...prev, newBet]);
    
    // Añadir la marca en el gráfico inmediatamente
    setBettedCandles(prev => [...prev, {
      timestamp: targetTimestamp,
      prediction: pendingPrediction,
      isDoubleBet: isDoubleBet
    }]);
    
    // Actualizar mensaje
    const betTypeText = isDoubleBet ? '(DOUBLE BET)' : '';
    setMensajeApuesta(`Bet confirmed: ${pendingPrediction === 'bull' ? '🐂 BULL (BULLISH)' : '🐻 BEAR (BEARISH)'} ${betTypeText} for ${betAmount} coins at price ${currentPrice.toFixed(1)}`);
    
    // Schedule automatic resolution after 60 seconds
    scheduleAutomaticResolution(newBet);
    
    // Limpiar la predicción pendiente
    setPendingPrediction(null);
    
    // Set the flag that player has already bet on this candle
    setHasBetOnCurrentCandle(true);
    
    // Reset the flag after the bet is placed
    setTimeout(() => {
      isPlacingBetRef.current = false;
    }, 500);
    
    // Save game state after placing bet
    setTimeout(() => {
      saveCurrentGameState();
    }, 1000);
    
    // Log state after placing bet
    setTimeout(logDebugState, 500);
  };
  
  // New function to schedule automatic resolution
  const scheduleAutomaticResolution = (bet: ActiveBet) => {
    // Calculate time until resolution (60 seconds after candle start)
    const resolutionTime = bet.candleTimestamp + 60000;
    const now = Date.now() + serverTimeOffsetRef.current;
    const timeUntilResolution = Math.max(0, resolutionTime - now);
    
    console.log(`[DEBUG] Scheduling bet resolution in ${timeUntilResolution/1000} seconds for bet ${bet.sessionBetId}`);
    console.log(`[DEBUG] Bet prediction: ${bet.prediction}`);
    console.log(`[DEBUG] Candle minute: ${bet.candleMinute}`);
    console.log(`[DEBUG] Candle timestamp: ${new Date(bet.candleTimestamp).toLocaleTimeString()}`);
    console.log(`[DEBUG] Double bet: ${bet.isDoubleBet}`);
    
    // Clear any existing timer for this bet
    if (betResolutionTimersRef.current.has(bet.sessionBetId)) {
      clearTimeout(betResolutionTimersRef.current.get(bet.sessionBetId));
    }
    
    // Set a timer to resolve the bet automatically
    const timer = setTimeout(() => {
      console.log(`[DEBUG] Auto-resolution timer triggered for bet ${bet.sessionBetId}`);
      
      // Check if bet is still active and not already resolved
      if (!resolvedBetsRef.current.has(bet.sessionBetId)) {
        // Get the current real price at resolution time
        const realCurrentPrice = getCurrentPrice();
        
        // Get the candle data for the bet by minute
        const candleForBet = candlesByMinuteRef.current.get(bet.candleMinute);
        
        // If we have the candle data, use it; otherwise use the current price
        const openPrice = candleForBet?.open || bet.openPrice || bet.initialPrice;
        const closePrice = candleForBet?.close || realCurrentPrice;
        
        console.log(`[DEBUG] Auto-resolving bet ${bet.sessionBetId}:`);
        console.log(`[DEBUG] Candle minute: ${bet.candleMinute}`);
        console.log(`[DEBUG] Open price: ${openPrice}`);
        console.log(`[DEBUG] Close price: ${closePrice}`);
        console.log(`[DEBUG] Candle color: ${closePrice > openPrice ? 'green' : 'red'}`);
        console.log(`[DEBUG] Double bet: ${bet.isDoubleBet}`);
        
        // Update the bet with the current real price
        const updatedBet: ActiveBet = {
          ...bet,
          openPrice,
          closePrice
        };
        
        // Show notification
        showAutoResolutionNotification();
        
        // Resolve the bet
        resolverApuestaPorVela(updatedBet);
        
        // Remove from the timers map
        betResolutionTimersRef.current.delete(bet.sessionBetId);
      }
    }, timeUntilResolution);
    
    // Store the timer reference
    betResolutionTimersRef.current.set(bet.sessionBetId, timer);
    
    // Mark the bet as having resolution scheduled
    setActiveBets(prev => prev.map(b => 
      b.sessionBetId === bet.sessionBetId ? { ...b, resolutionScheduled: true } : b
    ));
  };
  
  const cancelBet = () => {
    setPendingPrediction(null);
  };
  
  const getCurrentPrice = (): number => {
    if (currentCandle) return currentCandle.close;
    if (historicalCandles.length > 0) return historicalCandles[historicalCandles.length - 1].close;
    return 0;
  };
  
  const renderMensajeFase = () => {
    let msg = '';
    let color = '#ffffff';
    let timerVal = timeRemaining;
    let mostrarTimerApuesta = false;
    
    switch(gameState) {
      case GameState.ESPERANDO_VELA_ACTUAL:
        msg = `Next bet in ${Math.ceil(timeRemaining)}s`;
        color = '#9ca3af';
        break;
      case GameState.FASE_APUESTA:
        if (hasBetOnCurrentCandle) {
          msg = `Waiting for candle to complete (${Math.ceil(timeRemaining)}s)`;
          color ='#9ca3af';
        } else {
          const betTypeText = isDoubleBet ? '(DOUBLE BET)' : '';
          const betCost = isDoubleBet ? betAmount * 2 : betAmount;
          msg = `Bet ${betCost} coins ${betTypeText} for the current candle (${Math.ceil(bettingTimeRemaining)}s)!`;
          color = '#f59e0b';
          timerVal = bettingTimeRemaining;
          mostrarTimerApuesta = true;
        }
        break;
      case GameState.OBSERVANDO_VELA:
        const activeBetTypeText = activeBets.length > 0 && activeBets[0].isDoubleBet ? '(DOUBLE BET)' : '';
        msg = `Observing candle with bet: ${activePrediction==='bull'?'🐂 BULL (BULLISH)':'🐻 BEAR (BEARISH)'} ${activeBetTypeText} (${betAmount} coins)`;
        color = activePrediction==='bull' ? '#16a34a' : '#dc2626';
        break;
    }
    
    // Calculate progress percentage for timer bar
    const totalTime = gameState === GameState.FASE_APUESTA && !hasBetOnCurrentCandle ? 10 : 60;
    const progress = (timerVal / totalTime) * 100;
    
    //// Determine color based on progress
    let progressColor = '#16a34a'; // Green
    if (progress < 50) progressColor = '#f59e0b'; // Orange
    if (progress < 20) progressColor = '#dc2626'; // Red
    
    return (
      <View style={styles.timerContainer}>
        <Text style={[styles.mensajeText, { color }]}>{msg}</Text>
        <View style={styles.timerProgressContainer}>
          <View style={styles.timerBackground}>
            <View 
              style={[
                styles.timerFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: progressColor
                }
              ]} 
            />
          </View>
          <Text style={styles.timerText}>{Math.ceil(timerVal)}s</Text>
        </View>
      </View>
    );
  };
  
  const showScoreAnimation = (points: number, position: { x: number; y: number }) => {
    const id = animationIdCounter.current++; 
    setScoreAnimations(prev => [...prev, { id, points, position }]);
    setTimeout(() => {
      setScoreAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1500);
  };
  
  const showCoinsAnimation = (amount: number, position: { x: number; y: number }) => {
    const id = animationIdCounter.current++;
    setCoinsAnimations(prev => [...prev, { id, amount, position }]);
    setTimeout(() => {
      setCoinsAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1500);
  };
  
  const confirmarSalida = () => {
    Alert.alert("Exit Game", "Are you sure you want to exit? Your progress will be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", onPress: () => {
        saveCurrentGameState();
        navigation.goBack();
      }}
    ]);
  };
  
  const changeBetAmount = () => {
    // Increment the index and wraparound if needed
    const newIndex = (betAmountIndex + 1) % betAmountOptions.length;
    setBetAmountIndex(newIndex);
    
    // Get the new bet amount
    const newAmount = betAmountOptions[newIndex];
    
    // If ALL-IN is selected, set the bet amount to all available coins
    if (newAmount === 'ALL-IN') {
      setBetAmount(coins);
    } else {
      setBetAmount(newAmount as number);
    }
    
    console.log(`[DEBUG] Changed bet amount to: ${newAmount === 'ALL-IN' ? coins : newAmount} (index: ${newIndex})`);
  };
  
  // Toggle double bet mode
  const toggleDoubleBet = () => {
    setIsDoubleBet(prev => !prev);
    playSound('bonus');
  };

  const clearBetHistory = () => {
    setSessionBets([]);
    setBettedCandles([]);
  };

  const navigateToBetDetails = (betId: string) => {
    navigation.navigate('BetDetails' as never, { betId } as never);
  };

  const moveChartLeft = () => {
    setChartOffset(prev => prev + 50); // Move chart to the left
  };

  const moveChartRight = () => {
    setChartOffset(prev => prev - 50); // Move chart to the right
  };

  // Force resolve all pending bets - improved function with anti-cheat
  const forceResolvePendingBets = () => {
    // Only allow force resolve if there are unresolved bets that should have been resolved
    if (!hasUnresolvedBets) {
      console.log('[DEBUG] No pending bets to force resolve');
      return;
    }
    
    // Clear any existing auto-resolve timeout
    if (forceResolveTimeoutRef.current) {
      clearTimeout(forceResolveTimeoutRef.current);
      forceResolveTimeoutRef.current = null;
    }
    
    // Reset the last bet end time since we're manually resolving
    lastBetEndTimeRef.current = null;
    
    if (activeBets.length === 0) {
      console.log('[DEBUG] No active bets to resolve');
      return;
    }

    // Show auto-resolution notification
    showAutoResolutionNotification();

    // Get current time and minute
    const now = Date.now() + serverTimeOffsetRef.current;
    const currentMinute = new Date(now).getMinutes();
    
    // Create a copy of active bets to avoid issues with state updates during iteration
    const betsToResolve = [...activeBets];
    
    // Filter bets that should be resolved:
    // 1. Bet is not already resolved
    // 2. Bet's candle has ended (60 seconds have passed since timestamp)
    // 3. Bet is not for the current forming candle
    const eligibleBets = betsToResolve.filter(bet => {
      // Skip if already resolved
      if (resolvedBetsRef.current.has(bet.sessionBetId)) return false;
      
      // Check if the bet's candle has closed (60 seconds have passed)
      const candleEndTime = bet.candleTimestamp + 60000;
      
      // Check if this is the current forming candle
      const isCurrentFormingCandle = currentCandle && 
                                    currentCandle.timestamp === bet.candleTimestamp && 
                                    !currentCandle.isClosed;
      
      // Only consider it eligible if:
      // - The candle end time has passed
      // - It's not the current forming candle
      return now >= candleEndTime && !isCurrentFormingCandle;
    });
    
    console.log(`[DEBUG] Force resolving ${eligibleBets.length} pending bets out of ${betsToResolve.length} total active bets`);
    
    // Process each eligible bet
    eligibleBets.forEach(bet => {
      // Get the candle data for the bet by minute
      const candleForBet = candlesByMinuteRef.current.get(bet.candleMinute);
      
      // If we have the candle data, use it; otherwise use the current price
      const openPrice = candleForBet?.open || bet.openPrice || bet.initialPrice;
      const closePrice = candleForBet?.close || getCurrentPrice();
      
      console.log(`[DEBUG] Force resolving bet ${bet.sessionBetId}:`);
      console.log(`[DEBUG] Prediction: ${bet.prediction}`);
      console.log(`[DEBUG] Candle minute: ${bet.candleMinute}`);
      console.log(`[DEBUG] Open price: ${openPrice}`);
      console.log(`[DEBUG] Close price: ${closePrice}`);
      console.log(`[DEBUG] Candle color: ${closePrice > openPrice ? 'green' : 'red'}`);
      console.log(`[DEBUG] Double bet: ${bet.isDoubleBet}`);
      
      const updatedBet = {
        ...bet,
        openPrice,
        closePrice
      };
      
      // Resolve the bet immediately
      resolverApuestaPorVela(updatedBet);
    });
    
    // Reset the unresolved bets flag after resolving
    if (eligibleBets.length > 0) {
      setHasUnresolvedBets(false);
    } else {
      console.log('[DEBUG] No eligible bets to force resolve');
    }
  };
  
  // Handle game over restart
  const handleGameRestart = () => {
    // Set flag to indicate we're in the process of restarting
    isRestartingGameRef.current = true;
    console.log('[DEBUG] Starting game restart process');
    
    // Hide the game over modal
    setShowGameOverModal(false);
    
    // Reset game state
    setActiveBets([]);
    setSessionBets([]);
    setBettedCandles([]);
    resolvedBetsRef.current.clear();
    setNextBetMultiplier(1);
    setIsDoubleBet(false);
    setHasBetOnCurrentCandle(false);
    
    // Reset the game over shown flag so it can appear again if needed
    setGameOverShown(false);
    
    // Force a transition to betting phase
    setGameState(GameState.FASE_APUESTA);
    
    // Restart the game by refreshing candles
    refreshCandles().then(() => {
      // After refreshing, explicitly start betting phase
      iniciarFaseApuesta();
      
      // Clear the restarting flag after a short delay
      setTimeout(() => {
        isRestartingGameRef.current = false;
        console.log('[DEBUG] Game restart process completed');
      }, 1000);
    });
  };
  
  // Handle game over exit
  const handleGameExit = () => {
    setShowGameOverModal(false);
    navigation.goBack();
  };
  
  // Handle streak bonus close
  const handleStreakBonusClose = () => {
    setShowStreakBonus(false);
  };

  // Get display text for bet amount
  const getBetAmountDisplayText = () => {
    if (betAmount === coins) {
      return "ALL-IN";
    }
    return `${betAmount} coins`;
  };

  // Format current price for display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(getCurrentPrice());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.navBanner}>
          <TouchableOpacity style={styles.navButton} onPress={moveChartLeft}>
            <Ionicons name="chevron-back" size={20} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={refreshCandles} disabled={isRefreshing}>
            <Ionicons name="refresh" size={16} color="#f59e0b" style={isRefreshing ? styles.refreshingIcon : {}} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={navigateToHome}>
            <Ionicons name="home" size={16} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={moveChartRight}>
            <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
          </TouchableOpacity>
        </View>
        <CandleChart 
          candles={historicalCandles} 
          currentCandle={currentCandle} 
          highlightPattern={undefined} 
          showLastCandle={true}
          bettedCandles={bettedCandles}
          centerLastCandle={false}
          xOffset={chartOffset}
        />
        <PredictionButtons 
          onPredict={handlePredict} 
          disabled={gameState !== GameState.FASE_APUESTA || coins < (isDoubleBet ? betAmount * 2 : betAmount) || hasBetOnCurrentCandle}
          currentPrediction={pendingPrediction}
          activePrediction={activePrediction}
          currentPrice={getCurrentPrice()}
          onConfirm={confirmBet}
          onCancel={cancelBet}
          isDoubleBet={isDoubleBet}
          coins={coins}
          streak={streak}
          multiplier={multiplier}
        />
        
        {/* Consolidated banners module */}
        <View style={styles.bannersContainer}>
          {/* Price, Streak, Coins info */}
          <View style={styles.statsRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>BTC/USDT</Text>
              <Text style={styles.priceValue}>{formattedPrice}</Text>
            </View>
            
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={18} color="#f59e0b" />
              <Text style={styles.streakText}>Streak: {streak}</Text>
              {multiplier > 1 && (
                <View style={[
                  styles.multiplierBadge,
                  { backgroundColor: multiplier >= 4 ? '#ef4444' : multiplier >= 3 ? '#f59e0b' : '#16a34a' }
                ]}>
                  <Text style={styles.multiplierText}>x{multiplier}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.coinsContainer}>
              <Ionicons name="logo-bitcoin" size={24} color="#f59e0b" />
              <Text style={styles.coinsText}>{coins}</Text>
            </View>
          </View>
          
          {/* Next bet countdown */}
          {renderMensajeFase()}
          
          {/* Bet amount controls */}
          <View style={styles.betAmountRow}>
            <Text style={styles.betAmountLabel}>Bet Amount:</Text>
            <TouchableOpacity 
              style={[
                styles.betAmountButton, 
                hasBetOnCurrentCandle && gameState === GameState.FASE_APUESTA && styles.disabledButton,
                { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: '#f59e0b' }
              ]} 
              onPress={changeBetAmount}
              disabled={hasBetOnCurrentCandle && gameState === GameState.FASE_APUESTA}
            >
              <Text style={[
                styles.betAmountValue, 
                betAmount === coins ? styles.allInText : null
              ]}>
                {getBetAmountDisplayText()}
              </Text>
              <Ionicons name="swap-vertical" size={16} color="#f59e0b" />
            </TouchableOpacity>
            
            {/* Double Bet Toggle Button */}
            <TouchableOpacity 
              style={[
                styles.doubleBetButton, 
                isDoubleBet && styles.doubleBetButtonActive,
                hasBetOnCurrentCandle && gameState === GameState.FASE_APUESTA && styles.disabledButton
              ]} 
              onPress={toggleDoubleBet}
              disabled={hasBetOnCurrentCandle && gameState === GameState.FASE_APUESTA}
            >
              <Ionicons name="cash" size={16} color={isDoubleBet ? "#ffffff" : "#f59e0b"} />
              <Text style={[styles.doubleBetText, isDoubleBet && styles.doubleBetTextActive]}>
                {isDoubleBet ? "DOUBLE BET ON" : "DOUBLE BET"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {nextBetMultiplier > 1 && (
          <View style={styles.nextBetMultiplierContainer}>
            <Ionicons name="flash" size={20} color="#f59e0b" />
            <Text style={styles.nextBetMultiplierText}>
              Next bet has a x{nextBetMultiplier} multiplier!
            </Text>
          </View>
        )}
        
        {luckyBonus && (
          <View style={styles.luckyBonusContainer}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.luckyBonusText}>
              Lucky bonus active! Next bet has a guaranteed x2 multiplier!
            </Text>
          </View>
        )}
        
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Bets</Text>
            <View style={styles.historyActions}>
              <TouchableOpacity 
                style={[styles.saveHistoryButton, isSaved && styles.savedHistoryButton]} 
                onPress={saveCurrentGameState}
              >
                <Ionicons name="card" size={16} color={isSaved ? "#ffffff" : "#f7931a"} />
                {isSaved && <Text style={styles.savedText}>Saved!</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearHistoryButton} onPress={clearBetHistory}>
                <Ionicons name="trash-outline" size={16} color="#ffffff" />
                <Text style={styles.clearHistoryText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
          {sessionBets.length === 0 ? (
            <Text style={styles.emptyHistoryText}>No bets placed yet</Text>
          ) : (
            <FlatList
              data={sessionBets.slice(0, 5)}
              renderItem={({ item }) => <BetHistoryItem bet={item} />}
              keyExtractor={item => item.id}
              style={styles.historyList}
              scrollEnabled={false}
            />
          )}
        </View>
        {scoreAnimations.map(anim => (
          <ScoreAnimation key={`score-${anim.id}`} points={anim.points} position={anim.position} onComplete={() => {}} />
        ))}
        {coinsAnimations.map(anim => (
          <ScoreAnimation key={`coins-${anim.id}`} points={anim.amount} position={anim.position} onComplete={() => {}} isCoin />
        ))}
        <PatternChallenge 
          pattern={currentPattern} 
          timeLimit={patternTimeLimit} 
          onAnswer={correct => {}}
          visible={showPatternChallenge} 
        />
        {showResult && (
          <RNAnimated.View style={[styles.resultOverlay, { opacity: resultOpacity }]}>
            <View style={[styles.resultContainer, lastResult?.correct ? styles.resultContainerSuccess : styles.resultContainerFailure]}>
              <Text style={styles.resultTitle}>{lastResult?.correct ? 'You Won!' : 'You Lost!'}</Text>
              
              <View style={lastResult?.correct ? styles.winDetailsContainer : styles.lossDetailsContainer}>
                <View style={lastResult?.correct ? styles.winAmountRow : styles.lossAmountRow}>
                  <Ionicons name="logo-bitcoin" size={24} color="#ffffff" />
                  <Text style={lastResult?.correct ? styles.winAmountText : styles.lossAmountText}>
                    {lastResult?.correct ? `+${lastResult.coinsWon}` : `${lastResult?.coinsWon}`} coins
                  </Text>
                </View>
                
                <View style={styles.candleSizeRow}>
                  <Ionicons name="analytics-outline" size={18} color="#ffffff" />
                  <Text style={styles.candleSizeText}>
                    Candle size: ${lastResult?.candleSize?.toFixed(2)} (Bonus: +{lastResult?.bonusPercentage}%)
                  </Text>
                </View>
                
                {lastResult?.correct && lastResult.multiplierApplied && lastResult.multiplierApplied > 1 && (
                  <View style={styles.multiplierRow}>
                    <Ionicons name="flash" size={18} color="#f59e0b" />
                    <Text style={styles.multiplierInfoText}>x{lastResult.multiplierApplied} multiplier applied!</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.resultMessage}>{lastResult?.message}</Text>
            </View>
          </RNAnimated.View>
        )}
        
        {/* Auto-resolution notification */}
        {showAutoResolutionNotice && (
          <RNAnimated.View style={[styles.autoResolutionNotice, { opacity: autoResolutionOpacity }]}>
            <View style={styles.autoResolutionContent}>
              <Ionicons name="flash" size={20} color="#ffffff" />
              <Text style={styles.autoResolutionText}>Bet automatically resolved!</Text>
            </View>
          </RNAnimated.View>
        )}
        
        {/* Force Resolve Button - Only enabled when there are unresolved bets */}
        <TouchableOpacity 
          style={[
            styles.forceResolveButton,
            !hasUnresolvedBets && styles.forceResolveButtonDisabled
          ]}
          onPress={forceResolvePendingBets}
          disabled={!hasUnresolvedBets}
        >
          <Text style={[
            styles.forceResolveButtonText,
            !hasUnresolvedBets && styles.forceResolveButtonTextDisabled
          ]}>
            Force Resolve Pending Bets
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Game Over Modal */}
      <GameOverModal 
        visible={showGameOverModal}
        onRestart={handleGameRestart}
        onExit={handleGameExit}
      />
      
      {/* Streak Bonus Component */}
      <StreakBonus 
        streak={streakBonusInfo.streak}
        multiplier={streakBonusInfo.multiplier}
        coinsAwarded={streakBonusInfo.coinsAwarded}
        visible={showStreakBonus}
        onClose={handleStreakBonusClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#121212' },
  scrollContent: { padding:15, flexGrow:1 }, // Changed padding from 12 to 15
  navBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 4,
    marginBottom: 2
  },
  navButton: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 2,
    height: 32
  },
  refreshingIcon: { transform:[{ rotate:'45deg' }] },
  // Consolidated banners container
  bannersContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginTop: 6, // Reduced from 10 to 6
    marginBottom: 10,
  },
  // Stats row (price, streak, coins)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  priceLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceValue: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 18 : 20, // Increased font size
    fontWeight: 'bold',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  streakText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  multiplierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  multiplierText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  coinsText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 4,
  },
  // Timer container
  timerContainer: {
    marginBottom: 10,
  },
  mensajeText: { 
    fontSize: isSmallScreen ? 12 : 14, 
    fontWeight: 'bold',
    marginBottom: 6,
  },
  timerProgressContainer: {
    position: 'relative',
    width: '100%',
    height: 24,
  },
  timerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#333333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 12,
  },
  timerText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Bet amount row
  betAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betAmountLabel: { color: '#9ca3af', fontSize: isSmallScreen ? 12 : 14, fontWeight: 'bold' },
  betAmountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32, // Match height with doubleBetButton
  },
  betAmountValue: { color: '#f59e0b', fontWeight: 'bold', fontSize: isSmallScreen ? 12 : 14, marginRight: 6 },
  allInText: { color: '#ef4444', fontWeight: 'bold' },
  disabledButton: {
    opacity: 0.5,
  },
  // Double bet button styles
  doubleBetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32, // Match height with betAmountButton
  },
  doubleBetButtonActive: {
    backgroundColor: '#f59e0b',
  },
  doubleBetText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 10,
    marginLeft: 4
  },
  doubleBetTextActive: {
    color: '#ffffff'
  },
  chartNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2 // Reduced from 6 to 2
  },
  chartNavButton: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60, // Maintained width
    height: 32 // Maintained height
  },
  historyContainer: { backgroundColor: '#1e1e1e', borderRadius: 8, padding: 12, marginTop: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  historyActions: { flexDirection: 'row', alignItems: 'center' },
  clearHistoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d2d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  clearHistoryText: { color: '#ffffff', fontSize: 12, marginLeft: 4 },
  saveHistoryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2d2d2d', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6,
    marginRight: 8
  },
  savedHistoryButton: {
    backgroundColor: '#f7931a',
  },
  savedText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold'
  },
  historyList: { maxHeight: 200 },
  emptyHistoryText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', fontStyle: 'italic', padding: 10 },
  // Auto-resolution notification styles
  autoResolutionNotice: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000
  },
  autoResolutionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  autoResolutionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8
  },
  // Next bet multiplier styles
  nextBetMultiplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    justifyContent: 'center'
  },
  nextBetMultiplierText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8
  },
  // Lucky bonus styles
  luckyBonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    justifyContent: 'center'
  },
  luckyBonusText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8
  },
  // Result overlay styles
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  resultContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2
  },
  resultContainerSuccess: {
    borderColor: '#16a34a'
  },
  resultContainerFailure: {
    borderColor: '#dc2626'
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12
  },
  resultMessage: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12
  },
  // Unified details container for both win and loss
  winDetailsContainer: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginVertical: 8
  },
  lossDetailsContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginVertical: 8
  },
  winAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  lossAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  winAmountText: {
    color: '#16a34a',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8
  },
  lossAmountText: {
    color: '#dc2626',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8
  },
  // New candle size row
  candleSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  candleSizeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  multiplierInfoText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bonusInfoText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6
  },
  // Force resolve button styles
  forceResolveButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  forceResolveButtonDisabled: {
    backgroundColor: '#4b5563',
    opacity: 0.5
  },
  forceResolveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  forceResolveButtonTextDisabled: {
    color: '#9ca3af'
  }
});

export default GameScreen;
