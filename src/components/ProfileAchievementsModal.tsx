import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAchievements } from '../context/AchievementContext';
import AchievementItem from './AchievementItem';

interface ProfileAchievementsModalProps {
  visible: boolean;
  onClose: () => void;
  onAchievementPress: (id: string) => void;
}

const { width } = Dimensions.get('window');

const ProfileAchievementsModal: React.FC<ProfileAchievementsModalProps> = ({ 
  visible, 
  onClose,
  onAchievementPress
}) => {
  const { userAchievements, getUnlockedAchievements } = useAchievements();
  const slideAnim = useRef(new Animated.Value(width)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animation
      slideAnim.setValue(width);
      
      // Start animation
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };
  
  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = userAchievements.filter(a => !a.unlocked);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Achievements</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lockedAchievements.length}</Text>
              <Text style={styles.statLabel}>Locked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round((unlockedAchievements.length / userAchievements.length) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            {unlockedAchievements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Unlocked Achievements</Text>
                {unlockedAchievements.map(achievement => (
                  <AchievementItem 
                    key={achievement.id} 
                    achievement={achievement}
                    onPress={() => onAchievementPress(achievement.id)}
                  />
                ))}
              </View>
            )}
            
            {lockedAchievements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Locked Achievements</Text>
                {lockedAchievements.slice(0, 3).map(achievement => (
                  <AchievementItem 
                    key={achievement.id} 
                    achievement={achievement}
                  />
                ))}
                
                {lockedAchievements.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewMoreButton}
                    onPress={() => {
                      handleClose();
                      setTimeout(() => {
                        // Navigate to achievements screen
                      }, 300);
                    }}
                  >
                    <Text style={styles.viewMoreText}>
                      View {lockedAchievements.length - 3} more locked achievements
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
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
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 500,
    height: '80%',
    maxHeight: 600,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#f7931a',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#3d3d3d',
    alignSelf: 'center',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
});

export default ProfileAchievementsModal;
