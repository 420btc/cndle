import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../types/achievement';
import { LinearGradient } from 'expo-linear-gradient';

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
  onClaim: () => void;
}

const { width } = Dimensions.get('window');

const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({ 
  achievement, 
  visible, 
  onClose,
  onClaim
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.5);
      rotateAnim.setValue(0);
      
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);
  
  // Map rotation value to degrees
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });
  
  if (!achievement) return null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { 
              transform: [
                { scale: scaleAnim },
                { rotate }
              ] 
            }
          ]}
        >
          <LinearGradient
            colors={['#f7931a', '#e67e22']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerText}>Achievement Unlocked!</Text>
          </LinearGradient>
          
          <View style={styles.achievementContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name={achievement.icon as any} size={48} color="#f7931a" />
            </View>
            
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            
            {achievement.reward && (
              <View style={styles.rewardsContainer}>
                <Text style={styles.rewardsTitle}>Rewards:</Text>
                <View style={styles.rewardsList}>
                  {achievement.reward.coins && (
                    <View style={styles.rewardItem}>
                      <Ionicons name="logo-bitcoin" size={20} color="#f59e0b" />
                      <Text style={styles.rewardText}>{achievement.reward.coins} coins</Text>
                    </View>
                  )}
                  {achievement.reward.luckyBonus && (
                    <View style={styles.rewardItem}>
                      <Ionicons name="star" size={20} color="#f59e0b" />
                      <Text style={styles.rewardText}>Lucky Bonus</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            {achievement.reward ? (
              <TouchableOpacity 
                style={styles.claimButton}
                onPress={onClaim}
              >
                <LinearGradient
                  colors={['#f7931a', '#e67e22']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>CLAIM REWARD</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    width: width * 0.85,
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  headerGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  achievementContainer: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f7931a',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardsContainer: {
    width: '100%',
    backgroundColor: 'rgba(247, 147, 26, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rewardsTitle: {
    color: '#f7931a',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  rewardsList: {
    width: '100%',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  claimButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#2d2d2d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AchievementUnlockedModal;
