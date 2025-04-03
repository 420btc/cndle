import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAchievements } from '../context/AchievementContext';
import { Ionicons } from '@expo/vector-icons';

interface AchievementProgressBarProps {
  compact?: boolean;
}

const AchievementProgressBar: React.FC<AchievementProgressBarProps> = ({ compact = false }) => {
  const { userAchievements } = useAchievements();
  
  const unlockedCount = userAchievements.filter(a => a.unlocked).length;
  const totalCount = userAchievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactProgressBarBackground}>
          <View 
            style={[
              styles.compactProgressBarFill, 
              { width: `${completionPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.compactProgressText}>
          {unlockedCount}/{totalCount}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Ionicons name="trophy" size={18} color="#f7931a" />
          <Text style={styles.title}>Achievements Progress</Text>
        </View>
        <Text style={styles.percentage}>{completionPercentage}%</Text>
      </View>
      
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${completionPercentage}%` }
          ]} 
        />
      </View>
      
      <View style={styles.statsRow}>
        <Text style={styles.progressText}>
          <Text style={styles.highlightText}>{unlockedCount}</Text> of <Text style={styles.highlightText}>{totalCount}</Text> achievements unlocked
        </Text>
        <Text style={styles.remainingText}>
          {totalCount - unlockedCount} remaining
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(247, 147, 26, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  percentage: {
    color: '#f7931a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f7931a',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  highlightText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  remainingText: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 147, 26, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactProgressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#2d2d2d',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  compactProgressBarFill: {
    height: '100%',
    backgroundColor: '#f7931a',
    borderRadius: 2,
  },
  compactProgressText: {
    color: '#f7931a',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AchievementProgressBar;
