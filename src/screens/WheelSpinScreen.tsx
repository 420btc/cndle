import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame, WheelSegment } from '../context/GameContext';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
// Reducir el tamaño de la rueda en dispositivos móviles para mejorar el rendimiento
const WHEEL_SIZE = Math.min(width - 40, Platform.OS === 'web' ? 300 : 280);
const SPIN_DURATION = 6000; // 6 segundos
const SPIN_COST = 1000;

// Reducir la complejidad de la animación en dispositivos móviles
const EASING = Platform.OS === 'web' 
  ? Easing.bezier(0.25, 0.1, 0.25, 1) 
  : Easing.out(Easing.quad); // Easing más simple para móviles

interface WheelSpinScreenProps {
  onClose?: () => void;
}

const WheelSpinScreen: React.FC<WheelSpinScreenProps> = ({ onClose }) => {
  const navigation = useNavigation();
  const { 
    coins, 
    addCoins,
    removeCoins,
    getWheelSegments,
    setLuckyBonus,
    playSound,
    setWheelMultiplier,
    wheelSpinsRemaining,
    wheelSpinLastReset,
    useWheelSpin,
    getTimeUntilNextWheelReset
  } = useGame();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [wonPrize, setWonPrize] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [currentCoins, setCurrentCoins] = useState(coins);
  const [timeUntilReset, setTimeUntilReset] = useState(0);
  
  // Get wheel segments
  const SEGMENTS = getWheelSegments();
  
  // Update current coins and check if user has enough coins to spin
  useEffect(() => {
    setCurrentCoins(coins);
    setCanSpin(coins >= SPIN_COST && wheelSpinsRemaining > 0);
  }, [coins, wheelSpinsRemaining]);
  
  // Update time until reset
  useEffect(() => {
    const updateTimeUntilReset = () => {
      setTimeUntilReset(getTimeUntilNextWheelReset());
    };
    
    updateTimeUntilReset();
    
    const timer = setInterval(updateTimeUntilReset, 1000);
    
    return () => clearInterval(timer);
  }, [wheelSpinLastReset]);
  
  // Format time until reset
  const formatTimeUntilReset = () => {
    const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Memoize the wheel segments to avoid recreating them on every render
  const wheelSegments = useMemo(() => {
    const segmentAngle = 360 / SEGMENTS.length;
    const center = WHEEL_SIZE / 2;
    const radius = WHEEL_SIZE / 2;
    
    return SEGMENTS.map((segment, i) => {
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;
      
      // Calculate path for the segment
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      
      // Ensure that the path is correctly closed
      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');
      
      // Calculate position for the text
      const textAngle = startAngle + segmentAngle / 2;
      const textRad = (textAngle * Math.PI) / 180;
      const textRadius = radius * 0.65;
      const textX = center + textRadius * Math.cos(textRad);
      const textY = center + textRadius * Math.sin(textRad);
      const textRotation = textAngle + 90;
      
      return {
        segment,
        pathData,
        textX,
        textY,
        textRotation,
        index: i
      };
    });
  }, [SEGMENTS, WHEEL_SIZE]);
  
  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;
    
    // Check if user has enough coins
    if (currentCoins < SPIN_COST) {
      Alert.alert("Not Enough Coins", `You need ${SPIN_COST} coins to spin the wheel.`);
      return;
    }
    
    // Check if user has spins remaining
    if (wheelSpinsRemaining <= 0) {
      Alert.alert(
        "No Spins Remaining", 
        `You've used all your spins for today. Spins reset in ${formatTimeUntilReset()}.`
      );
      return;
    }
    
    // Set spinning state immediately
    setIsSpinning(true);
    
    // Deduct coins first
    removeCoins(SPIN_COST);
    
    // Update local state to reflect the deduction
    setCurrentCoins(prev => prev - SPIN_COST);
    
    // Hide any previous result
    setShowResult(false);
    setWonPrize(null);
    
    // Reset animation values
    spinValue.setValue(0);
    
    try {
      // Calculate total weight for probability
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
      
      // Use a wheel spin
      const spinUsed = await useWheelSpin();
      if (!spinUsed) {
        Alert.alert("Error", "Failed to use wheel spin. Please try again.");
        setIsSpinning(false);
        return;
      }
      
      // Get the selected segment
      const selectedSegment = SEGMENTS[segmentIndex];
      
      // Set the selected segment index for highlighting
      setSelectedSegmentIndex(segmentIndex);
      setWonPrize(selectedSegment);
      
      // Calculate angle for animation
      const segmentAngle = 360 / SEGMENTS.length;
      
      // Calculate the angle needed to position the winning segment at the top (pointer)
      // The pointer is at 0 degrees (top), so we need to rotate to position the segment there
      // We need to add 270 degrees because SVG 0 degrees is at 3 o'clock, not 12 o'clock
      // And we need to position the center of the segment at the top
      const segmentCenter = segmentIndex * segmentAngle + (segmentAngle / 2);
      const targetAngle = 270 - segmentCenter;
      
      // Add multiple full rotations for effect (4 full rotations plus the target angle)
      const fullRotations = 360 * 4;
      const finalAngle = fullRotations + targetAngle;
      
      // Animate the wheel con un easing más gradual para crear tensión al final
      Animated.timing(spinValue, {
        toValue: finalAngle,
        duration: SPIN_DURATION,
        easing: EASING,
        useNativeDriver: true,
      }).start(() => {
        // Show the result
        setShowResult(true);
        
        // Play sound
        playSound('bonus');
        
        // Apply the prize ONLY after animation completes
        if (selectedSegment.value === 'lucky') {
          // Set lucky bonus flag
          setLuckyBonus(true);
          setResultMessage(`You won ${selectedSegment.label}!`);
        } else if (typeof selectedSegment.value === 'number' && selectedSegment.value >= 1000) {
          // For big prizes (1000+), set wheel multiplier
          if (selectedSegment.value >= 3000) {
            setWheelMultiplier(3); // x3 multiplier for 3000+ prizes
          } else if (selectedSegment.value >= 1000) {
            setWheelMultiplier(2); // x2 multiplier for 1000+ prizes
          }
          // Add coins
          addCoins(selectedSegment.value);
          setResultMessage(`You won ${selectedSegment.value} coins!`);
        } else {
          // Add coins for regular prizes
          addCoins(selectedSegment.value as number);
          setResultMessage(`You won ${selectedSegment.value} coins!`);
        }
        
        // Reset spinning state after 3 seconds
        setTimeout(() => {
          setIsSpinning(false);
        }, 3000);
      });
    } catch (error) {
      // Handle error
      Alert.alert("Error", "Failed to spin the wheel. Please try again.");
      setIsSpinning(false);
    }
  };
  
  // Map rotation to degrees
  const rotation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'modulo'
  });
  
  // Handle back button to return to GameScreen
  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      // If no onClose prop is provided, use navigation to go back
      navigation.goBack();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wheel of Fortune</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.coinsContainer}>
            <Ionicons name="logo-bitcoin" size={24} color="#f59e0b" />
            <Text style={styles.coinsText}>{currentCoins}</Text>
          </View>
          
          <View style={styles.spinsContainer}>
            <Ionicons name="sync" size={24} color="#f59e0b" />
            <Text style={styles.spinsText}>{wheelSpinsRemaining}/3</Text>
          </View>
        </View>
        
        {/* Only show the reset timer when all spins are used (wheelSpinsRemaining === 0) */}
        {wheelSpinsRemaining === 0 && (
          <View style={styles.resetTimerContainer}>
            <Text style={styles.resetTimerLabel}>Spins reset in:</Text>
            <Text style={styles.resetTimerValue}>{formatTimeUntilReset()}</Text>
          </View>
        )}
        
        <View style={styles.wheelContainer}>
          {/* Pointer at the top */}
          <View style={styles.pointer}>
            <Ionicons name="caret-down" size={36} color="#ffffff" />
          </View>
          
          {/* Wheel */}
          <Animated.View style={[styles.wheel, { transform: [{ rotate: rotation }] }]}>
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
              {wheelSegments.map(({ segment, pathData, textX, textY, textRotation, index }) => {
                // Highlight the selected segment
                const isSelected = selectedSegmentIndex === index && showResult;
                const strokeWidth = isSelected ? "2" : "1";
                const strokeColor = isSelected ? "#ffffff" : "#333333";
                
                return (
                  <G key={index}>
                    <Path 
                      d={pathData} 
                      fill={segment.color} 
                      stroke={strokeColor} 
                      strokeWidth={strokeWidth} 
                      strokeLinejoin="round"
                    />
                    <SvgText
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                    >
                      {segment.label}
                    </SvgText>
                  </G>
                );
              })}
              <Circle 
                cx={WHEEL_SIZE / 2} 
                cy={WHEEL_SIZE / 2} 
                r={WHEEL_SIZE / 10} 
                fill="#1e1e1e" 
                stroke="#ffffff" 
                strokeWidth="2" 
              />
            </Svg>
          </Animated.View>
        </View>
        
        {/* Result message */}
        {showResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{resultMessage}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.spinButton, (!canSpin || isSpinning) && styles.disabledButton]}
          onPress={handleSpin}
          disabled={!canSpin || isSpinning}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.buttonGradient}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'SPINNING...' : `SPIN (${SPIN_COST} COINS)`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {!canSpin && !isSpinning && (
          <Text style={styles.notEnoughCoinsText}>
            {wheelSpinsRemaining <= 0 
              ? `You've used all your spins for today. Spins reset in ${formatTimeUntilReset()}.`
              : `You need ${SPIN_COST} coins to spin the wheel`
            }
          </Text>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Possible Prizes:</Text>
          <View style={styles.prizesList}>
            {/* Sort prizes from highest to lowest */}
            {[...SEGMENTS]
              .sort((a, b) => {
                // Put LUCKY BONUS at the top
                if (a.value === 'lucky') return -1;
                if (b.value === 'lucky') return 1;
                // Sort numeric values in descending order
                return (b.value as number) - (a.value as number);
              })
              .map((segment, index) => (
                <View key={index} style={styles.prizeItem}>
                  <View style={[styles.prizeColor, { backgroundColor: segment.color }]} />
                  <Text style={[
                    styles.prizeText, 
                    { color: getPrizeTextColor(segment) }
                  ]}>
                    {getFullLabel(segment)}
                  </Text>
                </View>
              ))}
          </View>
        </View>
        
        <View style={styles.limitInfoContainer}>
          <Ionicons name="information-circle" size={20} color="#f59e0b" />
          <Text style={styles.limitInfoText}>
            Limit: 3 spins every 24 hours
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Define segment weights for probability
const SEGMENT_WEIGHTS = [
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

// Function to get the color of the prize text based on its value
const getPrizeTextColor = (prize: WheelSegment) => {
  if (prize.value === 'lucky' || prize.value >= 3000) return '#f7931a'; // Gold
  if (prize.value >= 500) return '#16a34a'; // Green
  return '#dc2626'; // Red
};

// Function to get the full label for display in the prize list
const getFullLabel = (prize: WheelSegment) => {
  if (prize.value === 'lucky') return 'LUCKY BONUS';
  return `${prize.label}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    color: '#f7931a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  coinsText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 8,
  },
  spinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  spinsText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 8,
  },
  resetTimerContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  resetTimerLabel: {
    color: '#3b82f6',
    fontSize: 12,
    marginBottom: 4,
  },
  resetTimerValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wheelContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  pointer: {
    position: 'absolute',
    top: -18,
    zIndex: 10,
  },
  resultContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
    width: '100%',
  },
  resultText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinButton: {
    width: '80%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginVertical: 16,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  notEnoughCoinsText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginTop: 16,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prizesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  prizeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  prizeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  limitInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
    width: '100%',
  },
  limitInfoText: {
    color: '#f59e0b',
    fontSize: 14,
    marginLeft: 8,
  }
});

export default WheelSpinScreen;
