import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Modal,
  Animated
} from 'react-native';
import { CandlePattern } from '../types/candle';
import { candlePatterns } from '../data/candlePatterns';

interface PatternChallengeProps {
  pattern: CandlePattern;
  timeLimit: number;
  onAnswer: (correct: boolean) => void;
  visible: boolean;
}

const PatternChallenge: React.FC<PatternChallengeProps> = ({
  pattern,
  timeLimit,
  onAnswer,
  visible
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [options, setOptions] = useState<CandlePattern[]>([]);
  const fadeAnim = new Animated.Value(0);
  
  // Setup timer and animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTimeRemaining(timeLimit);
      generateOptions();
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);
  
  // Timer countdown
  useEffect(() => {
    if (!visible) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onAnswer(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [visible]);
  
  // Generate random options including the correct pattern
  const generateOptions = () => {
    const availablePatterns = candlePatterns.filter(p => p.id !== pattern.id);
    const shuffled = [...availablePatterns].sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 3);
    
    // Add the correct pattern and shuffle again
    const allOptions = [...selectedOptions, pattern].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };
  
  // Calculate progress bar width
  const progressWidth = `${(timeRemaining / timeLimit) * 100}%`;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }
          ]}
        >
          <Text style={styles.title}>IDENTIFY THE PATTERN</Text>
          
          <View style={styles.timerContainer}>
            <View style={styles.timerBackground}>
              <View style={[styles.timerFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.timerText}>{Math.ceil(timeRemaining)}s</Text>
          </View>
          
          <Image 
            source={{ uri: pattern.image }} 
            style={styles.patternImage}
            resizeMode="contain"
          />
          
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionButton}
                onPress={() => onAnswer(option.id === pattern.id)}
              >
                <Text style={styles.optionText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
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
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  timerContainer: {
    position: 'relative',
    height: 24,
    width: '100%',
    marginBottom: 20,
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
    backgroundColor: '#3B82F6',
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
  patternImage: {
    width: '100%',
    height: 150,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#2d2d2d',
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  optionText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default PatternChallenge;
