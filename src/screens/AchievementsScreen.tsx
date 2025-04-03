import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAchievements } from '../context/AchievementContext';
import AchievementItem from '../components/AchievementItem';
import AchievementUnlockedModal from '../components/AchievementUnlockedModal';
import { Achievement, AchievementType } from '../types/achievement';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    userAchievements, 
    getUnlockedAchievements, 
    getLockedAchievements,
    claimAchievementReward
  } = useAchievements();
  
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const unlockedCount = getUnlockedAchievements().length;
  const totalCount = userAchievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
  
  const getFilteredAchievements = () => {
    switch (activeTab) {
      case 'unlocked':
        return getUnlockedAchievements();
      case 'locked':
        return getLockedAchievements();
      default:
        return userAchievements;
    }
  };
  
  const handleAchievementPress = (achievement: Achievement) => {
    if (achievement.unlocked && achievement.reward) {
      setSelectedAchievement(achievement);
      setShowModal(true);
    }
  };
  
  const handleClaimReward = async () => {
    if (!selectedAchievement) return;
    
    const success = await claimAchievementReward(selectedAchievement.id);
    
    if (success) {
      Alert.alert(
        "Reward Claimed!",
        `You've received your reward for the "${selectedAchievement.title}" achievement.`,
        [{ text: "OK", onPress: () => setShowModal(false) }]
      );
    } else {
      Alert.alert(
        "Error",
        "Failed to claim reward. Please try again.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Group achievements by type
  const groupedAchievements = () => {
    const filtered = getFilteredAchievements();
    const grouped: Record<string, Achievement[]> = {};
    
    filtered.forEach(achievement => {
      const type = achievement.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(achievement);
    });
    
    return grouped;
  };
  
  // Get human-readable group names
  const getGroupName = (type: AchievementType): string => {
    switch (type) {
      case 'streak':
        return 'Streak Achievements';
      case 'wins':
        return 'Win Achievements';
      case 'bets':
        return 'Betting Achievements';
      case 'coins':
        return 'Coin Achievements';
      case 'level':
        return 'Level Achievements';
      case 'bull_wins':
        return 'Bull Market Achievements';
      case 'bear_wins':
        return 'Bear Market Achievements';
      case 'wheel_spins':
        return 'Wheel Spin Achievements';
      default:
        return 'Other Achievements';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Completion</Text>
          <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${completionPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {unlockedCount} of {totalCount} achievements unlocked
        </Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'all' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'all' && styles.activeTabButtonText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'unlocked' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('unlocked')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'unlocked' && styles.activeTabButtonText
          ]}>
            Unlocked
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'locked' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('locked')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'locked' && styles.activeTabButtonText
          ]}>
            Locked
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContent}>
        {Object.entries(groupedAchievements()).map(([type, achievements]) => (
          <View key={type} style={styles.achievementGroup}>
            <Text style={styles.groupTitle}>{getGroupName(type as AchievementType)}</Text>
            
            {achievements.map(achievement => (
              <AchievementItem 
                key={achievement.id} 
                achievement={achievement}
                onPress={() => handleAchievementPress(achievement)}
              />
            ))}
          </View>
        ))}
        
        {getFilteredAchievements().length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>
              {activeTab === 'unlocked' 
                ? "You haven't unlocked any achievements yet." 
                : "No achievements to display."}
            </Text>
          </View>
        )}
      </ScrollView>
      
      <AchievementUnlockedModal 
        achievement={selectedAchievement}
        visible={showModal}
        onClose={() => setShowModal(false)}
        onClaim={handleClaimReward}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressPercentage: {
    color: '#f7931a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f7931a',
    borderRadius: 4,
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
  },
  tabButtonText: {
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#f7931a',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  achievementGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AchievementsScreen;
