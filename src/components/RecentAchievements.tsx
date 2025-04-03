import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useAchievements } from '../context/AchievementContext';
import { Ionicons } from '@expo/vector-icons';

interface RecentAchievementsProps {
  maxToShow?: number;
  onAchievementPress?: (id: string) => void;
}

const RecentAchievements: React.FC<RecentAchievementsProps> = ({ 
  maxToShow = 3,
  onAchievementPress
}) => {
  const { userAchievements } = useAchievements();
  
  // Get the most recently unlocked achievements
  const recentAchievements = [...userAchievements]
    .filter(a => a.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, maxToShow);
  
  // Get achievements that are close to being unlocked (>50% progress)
  const upcomingAchievements = userAchievements
    .filter(a => !a.unlocked && a.progress > 0 && (a.progress / a.requirement) > 0.5)
    .sort((a, b) => (b.progress / b.requirement) - (a.progress / a.requirement))
    .slice(0, maxToShow - recentAchievements.length);
  
  // Combine both lists
  const achievementsToShow = [...recentAchievements, ...upcomingAchievements].slice(0, maxToShow);
  
  if (achievementsToShow.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={40} color="#4b5563" />
        <Text style={styles.emptyText}>No achievements unlocked yet</Text>
        <Text style={styles.emptySubtext}>Keep playing to earn achievements!</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {recentAchievements.length > 0 ? 'Recent Achievements' : 'Upcoming Achievements'}
      </Text>
      
      <FlatList
        data={achievementsToShow}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.achievementItem,
              item.unlocked ? styles.unlockedItem : styles.lockedItem
            ]}
            onPress={() => onAchievementPress && onAchievementPress(item.id)}
            disabled={!item.unlocked}
          >
            <View style={styles.achievementIconContainer}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={item.unlocked ? "#f7931a" : "#6b7280"} 
              />
              {item.unlocked && (
                <View style={styles.checkmarkBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                </View>
              )}
            </View>
            
            <View style={styles.achievementInfo}>
              <Text style={[
                styles.achievementTitle,
                item.unlocked ? styles.unlockedText : styles.lockedText
              ]}>
                {item.title}
              </Text>
              <Text style={styles.achievementDescription}>
                {item.description}
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(100, (item.progress / item.requirement) * 100)}%`,
                        backgroundColor: item.unlocked ? "#f7931a" : "#6b7280"
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {item.progress}/{item.requirement}
                </Text>
              </View>
            </View>
            
            {item.unlocked && item.reward && (
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>
                  {item.reward.coins ? `${item.reward.coins} 🪙` : '🎁'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  unlockedItem: {
    borderColor: 'rgba(247, 147, 26, 0.3)',
  },
  lockedItem: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.8,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 2,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  unlockedText: {
    color: '#ffffff',
  },
  lockedText: {
    color: '#9ca3af',
  },
  achievementDescription: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#1e1e1e',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 10,
  },
  rewardBadge: {
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  rewardText: {
    color: '#f7931a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RecentAchievements;
