import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakBonusProps {
  streak: number;
  multiplier: number;
  coinsAwarded: number;
  visible: boolean;
  onClose: () => void;
}

const StreakBonus: React.FC<StreakBonusProps> = ({ 
  streak, 
  multiplier, 
  coinsAwarded, 
  visible, 
  onClose 
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="flame" size={24} color="#f59e0b" />
          <Text style={styles.title}>STREAK BONUS!</Text>
          <Ionicons name="flame" size={24} color="#f59e0b" />
        </View>
        
        <Text style={styles.streakText}>
          {streak} consecutive wins!
        </Text>
        
        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Ionicons name="logo-bitcoin" size={30} color="#f59e0b" />
            <Text style={styles.rewardText}>+{coinsAwarded} coins</Text>
          </View>
          
          <View style={styles.rewardItem}>
            <Ionicons name="trending-up" size={30} color="#16a34a" />
            <Text style={styles.rewardText}>Next bet x{multiplier} multiplier</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>AWESOME!</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#f59e0b',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  streakText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  rewardsContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  closeButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  closeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StreakBonus;
