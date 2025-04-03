import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';

// Remove the incorrect import and use TestIds constant directly
// import { RewardedAd, RewardedAdEventType, TestIds } from '@react-native-google-mobile-ads/google-mobile-ads';

// Production ad unit ID
const adUnitId = 'ca-app-pub-2801460666172922/9498218082';
// TestIds constant for development
const TEST_ID = 'ca-app-pub-3940256099942544/5224354917';

interface GameOverModalProps {
  visible: boolean;
  onRestart: () => void;
  onExit: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ 
  visible, 
  onRestart, 
  onExit 
}) => {
  const { coins, addCoins, resetCoins, setLuckyBonus } = useGame();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [hasWatchedAd, setHasWatchedAd] = useState(false);
  const [waitingTime, setWaitingTime] = useState(300); // 5 minutes in seconds
  const [isWaiting, setIsWaiting] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load rewarded ad when modal becomes visible
  useEffect(() => {
    if (visible) {
      setHasWatchedAd(false);
      setIsWaiting(false);
      setWaitingTime(300);
      setAdError(null);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Simulate ad loading for now
      setTimeout(() => {
        setAdLoaded(true);
      }, 1500);
    }
  }, [visible]);
  
  // Handle waiting timer
  useEffect(() => {
    if (isWaiting && waitingTime > 0) {
      timerRef.current = setInterval(() => {
        setWaitingTime(prev => {
          if (prev <= 1) {
            // Timer completed
            clearInterval(timerRef.current as NodeJS.Timeout);
            timerRef.current = null;
            
            // Add coins and restart
            addCoins(25);
            handleRestart();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isWaiting]);
  
  const handleRestart = () => {
    resetCoins();
    onRestart();
    
    // Reset waiting state
    setIsWaiting(false);
    setWaitingTime(300);
  };
  
  const handleWatchAd = () => {
    if (!adLoaded) {
      setAdError('Ad not loaded yet. Please try again in a moment.');
      return;
    }
    
    setIsWatchingAd(true);
    
    // Simulate watching an ad
    setTimeout(() => {
      // Add coins and set lucky bonus
      addCoins(50);
      setLuckyBonus(true);
      setHasWatchedAd(true);
      setIsWatchingAd(false);
      
      // Close modal and restart game
      setTimeout(() => {
        handleRestart();
      }, 500);
    }, 2000);
  };
  
  const handleWaitAndRecharge = () => {
    setIsWaiting(true);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>¡Game Over!</Text>
          
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Te quedaste sin monedas. ¿Cómo quieres volver?
            </Text>
          </View>
          
          <View style={styles.coinsContainer}>
            <Ionicons name="logo-bitcoin" size={30} color="#f59e0b" />
            <Text style={styles.coinsText}>{coins} monedas</Text>
          </View>
          
          {isWaiting ? (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>
                Espera {formatTime(waitingTime)} para recargar
              </Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsWaiting(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handleWaitAndRecharge}
              >
                <LinearGradient
                  colors={['#4B5563', '#374151']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="time-outline" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Espera y Recarga (25 monedas)</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.button}
                onPress={handleWatchAd}
                disabled={isWatchingAd || hasWatchedAd || !adLoaded}
              >
                <LinearGradient
                  colors={hasWatchedAd ? ['#6B7280', '#4B5563'] : ['#f59e0b', '#d97706']}
                  style={styles.buttonGradient}
                >
                  {isWatchingAd ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.buttonText}>Viendo Anuncio...</Text>
                    </>
                  ) : hasWatchedAd ? (
                    <>
                      <Ionicons name="checkmark" size={20} color="#ffffff" />
                      <Text style={styles.buttonText}>Anuncio Visto</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="play" size={20} color="#ffffff" />
                      <Text style={styles.buttonText}>
                        {adLoaded 
                          ? "Ver Anuncio (50 monedas + bonus)" 
                          : "Cargando anuncio..."}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              {adError && (
                <Text style={styles.errorText}>{adError}</Text>
              )}
            </>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.exitButton]}
            onPress={onExit}
          >
            <Ionicons name="exit-outline" size={20} color="#9ca3af" />
            <Text style={styles.exitButtonText}>Salir al Menú</Text>
          </TouchableOpacity>
          
          <Text style={styles.motivationalText}>
            ¡Los toros y osos no se rinden! Elige y sigue apostando.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    color: '#ef4444', // Red color for Game Over
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  messageContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  message: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  coinsText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 24,
    marginLeft: 12,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    marginBottom: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  waitingContainer: {
    width: '100%',
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  waitingText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  exitButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    marginLeft: 4,
  },
  motivationalText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  }
});

export default GameOverModal;
