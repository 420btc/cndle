import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

interface DailyRewardsProps {
  isSpanish: boolean;
}

const DailyRewards: React.FC<DailyRewardsProps> = ({ isSpanish }) => {
  const { user } = useAuth();
  const { addCoins, playSound } = useGame();
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [rewardAmount, setRewardAmount] = useState(100); // Cantidad de monedas de recompensa

  // Textos según el idioma
  const texts = {
    title: isSpanish ? 'Recompensa Diaria' : 'Daily Reward',
    claim: isSpanish ? 'RECLAMAR' : 'CLAIM',
    claimed: isSpanish ? 'RECLAMADO' : 'CLAIMED',
    nextReward: isSpanish ? 'Próxima:' : 'Next:',
    hours: isSpanish ? 'h' : 'h',
    minutes: isSpanish ? 'm' : 'm',
    seconds: isSpanish ? 's' : 's',
    rewardMessage: isSpanish 
      ? `¡Has recibido ${rewardAmount} monedas!` 
      : `You received ${rewardAmount} coins!`
  };

  useEffect(() => {
    checkDailyReward();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const checkDailyReward = async () => {
    try {
      setLoading(true);
      if (!user) {
        setCanClaim(false);
        setLoading(false);
        return;
      }

      const lastClaimKey = `dailyReward_lastClaim_${user.id}`;
      const lastClaimStr = await AsyncStorage.getItem(lastClaimKey);
      
      if (!lastClaimStr) {
        // Nunca ha reclamado, puede reclamar
        setCanClaim(true);
        setTimeRemaining(null);
      } else {
        const lastClaim = parseInt(lastClaimStr, 10);
        const now = Date.now();
        const timeDiff = now - lastClaim;
        const oneDayInMs = 24 * 60 * 60 * 1000;
        
        if (timeDiff >= oneDayInMs) {
          // Ha pasado más de un día, puede reclamar
          setCanClaim(true);
          setTimeRemaining(null);
        } else {
          // Aún no ha pasado un día, no puede reclamar
          setCanClaim(false);
          setTimeRemaining(oneDayInMs - timeDiff);
        }
      }
    } catch (error) {
      console.error('Error checking daily reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (timeRemaining !== null && timeRemaining > 0) {
      setTimeRemaining(prev => prev !== null ? prev - 1000 : null);
    } else if (timeRemaining !== null && timeRemaining <= 0) {
      setCanClaim(true);
      setTimeRemaining(null);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours}${texts.hours} ${minutes}${texts.minutes} ${seconds}${texts.seconds}`;
  };

  const handleClaim = async () => {
    if (!canClaim || !user) return;
    
    try {
      // Añadir monedas al usuario
      addCoins(rewardAmount);
      
      // Reproducir sonido de éxito
      playSound('bonus');
      
      // Guardar la fecha de reclamación
      const now = Date.now();
      await AsyncStorage.setItem(`dailyReward_lastClaim_${user.id}`, now.toString());
      
      // Actualizar estado
      setCanClaim(false);
      setTimeRemaining(24 * 60 * 60 * 1000); // 24 horas en ms
      
      // Mostrar mensaje de éxito (podría implementarse con un toast o alert)
      console.log(texts.rewardMessage);
    } catch (error) {
      console.error('Error claiming daily reward:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {canClaim ? (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClaim}
            activeOpacity={0.8}
          >
            <View style={styles.claimContent}>
              <Ionicons name="gift" size={18} color="#ffffff" />
              <Text style={styles.buttonText}>{texts.title} - {rewardAmount} 🪙</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={16} color="#ffffff" />
            <Text style={styles.timerLabel}>{texts.nextReward}</Text>
            <Text style={styles.timer}>
              {timeRemaining !== null ? formatTime(timeRemaining) : ''}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  card: {
    borderRadius: 20,
    height: 36,
    elevation: 3,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  timerLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    marginRight: 4,
  },
  timer: {
    color: '#ffffff',
    fontSize: 14,
  },
});

export default DailyRewards;
