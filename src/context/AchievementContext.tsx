import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, AchievementType } from '../types/achievement';
import { achievements } from '../data/achievements';
import { useAuth } from './AuthContext';
import { useGame } from './GameContext';

interface AchievementContextType {
  userAchievements: Achievement[];
  updateAchievement: (type: AchievementType, value: number) => Promise<Achievement | null>;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getAchievementProgress: (id: string) => number;
  claimAchievementReward: (id: string) => Promise<boolean>;
  recentlyUnlocked: Achievement | null;
  clearRecentlyUnlocked: () => void;
  refreshAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addCoins, setLuckyBonus } = useGame();
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([...achievements]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user achievements from storage when user changes
  useEffect(() => {
    if (user) {
      loadUserAchievements();
    } else {
      // Reset to default achievements when user logs out
      setUserAchievements([...achievements]);
      setIsInitialized(true);
    }
  }, [user]);

  const loadUserAchievements = async () => {
    if (!user) return;

    try {
      const achievementsData = await AsyncStorage.getItem(`achievements_${user.id}`);
      
      if (achievementsData) {
        const savedAchievements = JSON.parse(achievementsData);
        
        // Check if we need to merge with new achievements that might have been added
        if (savedAchievements.length < achievements.length) {
          console.log('Merging new achievements with saved achievements');
          
          // Get IDs of saved achievements
          const savedIds = new Set(savedAchievements.map((a: Achievement) => a.id));
          
          // Find new achievements that aren't in saved data
          const newAchievements = achievements.filter(a => !savedIds.has(a.id));
          
          // Merge saved and new achievements
          const mergedAchievements = [...savedAchievements, ...newAchievements];
          
          // Save the merged achievements
          await AsyncStorage.setItem(`achievements_${user.id}`, JSON.stringify(mergedAchievements));
          setUserAchievements(mergedAchievements);
        } else {
          setUserAchievements(savedAchievements);
        }
      } else {
        // Initialize with default achievements if none exist
        await AsyncStorage.setItem(`achievements_${user.id}`, JSON.stringify(achievements));
        setUserAchievements([...achievements]);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading achievements:', error);
      // Fallback to default achievements on error
      setUserAchievements([...achievements]);
      setIsInitialized(true);
    }
  };

  const saveUserAchievements = async (updatedAchievements: Achievement[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(`achievements_${user.id}`, JSON.stringify(updatedAchievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  };

  const refreshAchievements = async () => {
    // Force a reload of achievements from storage
    if (user) {
      setIsInitialized(false);
      await loadUserAchievements();
    } else {
      setUserAchievements([...achievements]);
    }
  };

  const updateAchievement = async (type: AchievementType, value: number): Promise<Achievement | null> => {
    if (!user || !isInitialized) return null;

    const updatedAchievements = [...userAchievements];
    let newlyUnlocked: Achievement | null = null;

    // Update progress for all achievements of the specified type
    updatedAchievements.forEach(achievement => {
      if (achievement.type === type) {
        // For level and coins, set the absolute value
        if (type === 'level' || type === 'coins') {
          achievement.progress = value;
        } else {
          // For other types, increment the progress
          achievement.progress = Math.max(achievement.progress, value);
        }

        // Check if achievement is newly unlocked
        if (!achievement.unlocked && achievement.progress >= achievement.requirement) {
          achievement.unlocked = true;
          newlyUnlocked = achievement;
        }
      }
    });

    setUserAchievements(updatedAchievements);
    await saveUserAchievements(updatedAchievements);

    if (newlyUnlocked) {
      setRecentlyUnlocked(newlyUnlocked);
    }

    return newlyUnlocked;
  };

  const getUnlockedAchievements = (): Achievement[] => {
    return userAchievements.filter(achievement => achievement.unlocked);
  };

  const getLockedAchievements = (): Achievement[] => {
    return userAchievements.filter(achievement => !achievement.unlocked);
  };

  const getAchievementProgress = (id: string): number => {
    const achievement = userAchievements.find(a => a.id === id);
    if (!achievement) return 0;
    
    return Math.min(achievement.progress / achievement.requirement, 1) * 100;
  };

  const claimAchievementReward = async (id: string): Promise<boolean> => {
    if (!user || !isInitialized) return false;

    const achievementIndex = userAchievements.findIndex(a => a.id === id);
    if (achievementIndex === -1) return false;

    const achievement = userAchievements[achievementIndex];
    if (!achievement.unlocked || !achievement.reward) return false;

    // Apply rewards
    if (achievement.reward.coins) {
      addCoins(achievement.reward.coins);
    }

    if (achievement.reward.luckyBonus) {
      setLuckyBonus(true);
    }

    // Mark as claimed by removing the reward
    const updatedAchievements = [...userAchievements];
    updatedAchievements[achievementIndex] = {
      ...achievement,
      reward: undefined
    };

    setUserAchievements(updatedAchievements);
    await saveUserAchievements(updatedAchievements);

    return true;
  };

  const clearRecentlyUnlocked = () => {
    setRecentlyUnlocked(null);
  };

  return (
    <AchievementContext.Provider
      value={{
        userAchievements,
        updateAchievement,
        getUnlockedAchievements,
        getLockedAchievements,
        getAchievementProgress,
        claimAchievementReward,
        recentlyUnlocked,
        clearRecentlyUnlocked,
        refreshAchievements
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
