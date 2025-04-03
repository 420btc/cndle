import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../types/achievement';
import { useAchievements } from '../context/AchievementContext';

interface AchievementItemProps {
  achievement: Achievement;
  onPress?: () => void;
}

const AchievementItem: React.FC<AchievementItemProps> = ({ achievement, onPress }) => {
  const { getAchievementProgress } = useAchievements();
  const progress = getAchievementProgress(achievement.id);
  
  const getIconColor = () => {
    if (achievement.unlocked) return '#f7931a';
    return '#6b7280';
  };
  
  const getProgressBarColor = () => {
    if (achievement.unlocked) return '#f7931a';
    if (progress > 50) return '#f59e0b';
    return '#6b7280';
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        achievement.unlocked && styles.unlockedContainer
      ]}
      onPress={onPress}
      disabled={!achievement.unlocked || !achievement.reward}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={achievement.icon as any} size={24} color={getIconColor()} />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{achievement.title}</Text>
          {achievement.unlocked && achievement.reward && (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>CLAIM</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.description}>{achievement.description}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progress}%`, backgroundColor: getProgressBarColor() }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress} / {achievement.requirement}
          </Text>
        </View>
        
        {achievement.reward && (
          <View style={styles.rewardContainer}>
            {achievement.reward.coins && (
              <View style={styles.rewardItem}>
                <Ionicons name="logo-bitcoin" size={14} color="#f59e0b" />
                <Text style={styles.rewardItemText}>+{achievement.reward.coins}</Text>
              </View>
            )}
            {achievement.reward.luckyBonus && (
              <View style={styles.rewardItem}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={styles.rewardItemText}>Lucky Bonus</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unlockedContainer: {
    borderColor: '#f7931a',
    backgroundColor: 'rgba(247, 147, 26, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rewardBadge: {
    backgroundColor: '#f7931a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewardText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#1e1e1e',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  rewardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  rewardItemText: {
    color: '#f59e0b',
    fontSize: 10,
    marginLeft: 4,
  },
});

export default AchievementItem;
