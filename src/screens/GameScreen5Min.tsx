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
  Dimensions
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
import HeartLossAnimation from '../components/HeartLossAnimation';

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
  isDoubleBet?: boolean; // Indica si es una apuesta doble (2 corazones)
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

// Define bet amount options as a constant
const BET_AMOUNT_OPTIONS = [10, 25, 50, 100, 'ALL-IN'];

const GameScreen5Min: React.FC = () => {
  const navigation = useNavigation();
  const { 
    score, 
    lives, 
    level, 
    setLevel, 
    updateScore, 
    loseLife,
    addLife,
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
    setLives,
    luckyBonus,
    setLuckyBonus
  } = useGame();
  
  // Estados de juego
  const [historicalCandles, setHistoricalCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [pendingPrediction, setPendingPrediction] = useState<Prediction>(null);
  const [activePrediction, setActivePrediction] = useState<Prediction>(null);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [bettingTimeRemaining, setBettingTimeRemaining] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>(GameState.ESPERANDO_VELA_ACTUAL);
  const [nextCandleTimestamp, setNextCandleTimestamp] = useState<number | null>(null);
  const [mensajeApuesta, setMensajeApuesta] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; message: string; coinsWon?: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPatternChallenge, setShowPatternChallenge] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(getRandomPattern(1));
  const [patternTimeLimit, setPatternTimeLimit] = useState(5);
  const [betAmount, setBetAmount] = useState(10); // Monedas a apostar
  const [betAmountIndex, setBetAmountIndex] = useState(0); // Track the current index in options
  const resultOpacity = useRefI'll close the current artifact properly.
