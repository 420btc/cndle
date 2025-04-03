import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prediction } from '../types/candle';
import { LinearGradient } from 'expo-linear-gradient';

interface PredictionButtonsProps {
  onPredict: (prediction: Prediction) => void;
  disabled: boolean;
  currentPrediction: Prediction;
  activePrediction: Prediction;
  currentPrice: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  isDoubleBet?: boolean;
  coins?: number;
  streak?: number;
  multiplier?: number;
}

const PredictionButtons: React.FC<PredictionButtonsProps> = ({ 
  onPredict, 
  disabled,
  currentPrediction,
  activePrediction,
  currentPrice,
  onConfirm,
  onCancel,
  isDoubleBet = false,
  coins = 0,
  streak = 0,
  multiplier = 1
}) => {
  // Animation values for button press effect
  const bullScale = new Animated.Value(1);
  const bearScale = new Animated.Value(1);
  
  const animateButton = (button: 'bull' | 'bear') => {
    const scaleValue = button === 'bull' ? bullScale : bearScale;
    
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handleSelectPrediction = (prediction: Prediction) => {
    if (disabled) return;
    
    if (prediction === 'bull') {
      animateButton('bull');
    } else {
      animateButton('bear');
    }
    
    onPredict(prediction);
  };
  
  // Format current price for display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(currentPrice);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {disabled ? 'WAITING FOR NEXT BETTING PHASE' : 'PREDICT THE NEXT CANDLE'}
      </Text>
      
      <View style={styles.buttonsContainer}>
        <Animated.View style={{ transform: [{ scale: bullScale }], flex: 1 }}> 
          <TouchableOpacity
            style={[
              styles.button,
              styles.bullButton,
              currentPrediction === 'bull' && styles.selectedButton,
              disabled && styles.disabledButton
            ]}
            onPress={() => handleSelectPrediction('bull')}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.emojiText}>🐂</Text>
            <Text style={styles.buttonText}>BULL</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ transform: [{ scale: bearScale }], flex: 1 }}> 
          <TouchableOpacity
            style={[
              styles.button,
              styles.bearButton,
              currentPrediction === 'bear' && styles.selectedButton,
              disabled && styles.disabledButton
            ]}
            onPress={() => handleSelectPrediction('bear')}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.emojiText}>🐻</Text>
            <Text style={styles.buttonText}>BEAR</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {currentPrediction && onConfirm && onCancel && (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationText}>
            Confirm prediction: {currentPrediction === 'bull' ? '🐂 BULL (BULLISH)' : '🐻 BEAR (BEARISH)'}?
            {isDoubleBet && <Text style={styles.doubleBetWarning}> (DOUBLE BET: Costs more coins!)</Text>}
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={onConfirm}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>CONFIRM</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {activePrediction && (
        <View style={[
          styles.predictionStatusContainer,
          activePrediction === 'bull' ? styles.bullPrediction : styles.bearPrediction
        ]}>
          <Text style={styles.predictionStatusText}>
            Active bet: {activePrediction === 'bull' ? '🐂 BULL (BULLISH)' : '🐻 BEAR (BEARISH)'}
            {isDoubleBet && ' (DOUBLE BET)'}
          </Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    color: '#ffffff', // Changed to white as requested
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  button: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 12 : 16,
    paddingHorizontal: isSmallScreen ? 8 : 12,
    borderRadius: 16,
    marginHorizontal: 6,
    height: isSmallScreen ? 80 : 100, // Fixed height for both buttons
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bullButton: {
    backgroundColor: '#16a34a',
  },
  bearButton: {
    backgroundColor: '#dc2626',
  },
  selectedButton: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 16 : 20,
    marginTop: 4,
    textAlign: 'center',
  },
  emojiText: {
    fontSize: 28,
    marginBottom: 4,
    textAlign: 'center',
  },
  confirmationContainer: {
    backgroundColor: '#374151',
    padding: 12, // Reduced from 16 to 12
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  confirmationText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 13 : 15, // Reduced font size
    marginBottom: 12, // Reduced from 16 to 12
    textAlign: 'center',
  },
  doubleBetWarning: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 8, // Reduced from 12 to 8
    paddingHorizontal: 12, // Reduced from 16 to 12
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 11 : 13, // Reduced font size
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 8, // Reduced from 12 to 8
    paddingHorizontal: 12, // Reduced from 16 to 12
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 11 : 13, // Reduced font size
  },
  predictionStatusContainer: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  bullPrediction: {
    backgroundColor: 'rgba(22, 163, 74, 0.3)',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  bearPrediction: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  predictionStatusText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? 12 : 14,
  }
});

export default PredictionButtons;
