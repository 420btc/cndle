import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame, Bet } from '../context/GameContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAchievements } from '../context/AchievementContext';
import AchievementProgressBar from '../components/AchievementProgressBar';
import RecentAchievements from '../components/RecentAchievements';
import AchievementUnlockedModal from '../components/AchievementUnlockedModal';
import { Achievement } from '../types/achievement';

interface UserProfile {
  coins: number;
  highScore: number;
  maxStreak: number;
  totalBets: number;
  bullBets: number;
  bearBets: number;
  oneMinBets: number;
  fiveMinBets: number;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { betHistory, coins, highScore, addCoins, level, wins, maxStreak, getStatus, score } = useGame();
  const { user, signOut } = useAuth();
  const { 
    userAchievements, 
    getUnlockedAchievements, 
    claimAchievementReward,
    refreshAchievements
  } = useAchievements();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    coins: 0,
    highScore: 0,
    maxStreak: 0,
    totalBets: 0,
    bullBets: 0,
    bearBets: 0,
    oneMinBets: 0,
    fiveMinBets: 0
  });
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [secretAttempts, setSecretAttempts] = useState(0);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Force refresh achievements when the screen is focused
  useEffect(() => {
    const refreshOnFocus = async () => {
      if (user) {
        await refreshAchievements();
      }
    };
    
    refreshOnFocus();
  }, []);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load profile data
      const profileData = await AsyncStorage.getItem(`profile_${user.id}`);
      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAchievements();
      await loadUserProfile();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTrendText = () => {
    const { bullBets, bearBets, totalBets } = profile;
    
    if (totalBets === 0) return { text: "No bets yet", emoji: "⚖️", color: "#9ca3af" };
    
    const bullPercentage = (bullBets / totalBets) * 100;
    const bearPercentage = (bearBets / totalBets) * 100;
    
    if (bullPercentage >= 55) {
      return { text: "Bull", emoji: "🐂", color: "#16a34a" };
    } else if (bearPercentage >= 55) {
      return { text: "Bear", emoji: "🐻", color: "#dc2626" };
    } else {
      return { text: "Balanced", emoji: "⚖️", color: "#f59e0b" };
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => signOut() }
      ]
    );
  };

  const handleSecretButton = () => {
    setShowSecretModal(true);
    setSecretPassword('');
    setSecretAttempts(0);
  };

  const handleCheckPassword = () => {
    if (secretPassword === '420420') {
      addCoins(1000);
      setShowSecretModal(false);
      Alert.alert("Success", "You've received 1000 coins! 🎉");
    } else {
      setSecretAttempts(prev => prev + 1);
      if (secretAttempts >= 2) {
        setShowSecretModal(false);
        Alert.alert("Access Denied", "Too many incorrect attempts.");
      } else {
        Alert.alert("Incorrect Password", "Please try again.");
        setSecretPassword('');
      }
    }
  };

  const handleAchievementPress = (id: string) => {
    const achievement = userAchievements.find(a => a.id === id);
    if (achievement && achievement.unlocked && achievement.reward) {
      setSelectedAchievement(achievement);
      setShowAchievementModal(true);
    }
  };

  const handleClaimReward = async () => {
    if (!selectedAchievement) return;
    
    const success = await claimAchievementReward(selectedAchievement.id);
    
    if (success) {
      Alert.alert(
        "Reward Claimed!",
        `You've received your reward for the "${selectedAchievement.title}" achievement.`,
        [{ text: "OK", onPress: () => setShowAchievementModal(false) }]
      );
    } else {
      Alert.alert(
        "Error",
        "Failed to claim reward. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Calculate progress to next level
  const calculateLevelProgress = () => {
    // Level thresholds based on score
    const levelThresholds = [
      0,       // Level 1: 0-999
      1000,    // Level 2: 1,000-4,999
      5000,    // Level 3: 5,000-9,999
      10000,   // Level 4: 10,000-24,999
      25000,   // Level 5: 25,000-49,999
      50000,   // Level 6: 50,000-99,999
      100000,  // Level 7: 100,000-249,999
      250000,  // Level 8: 250,000-499,999
      500000,  // Level 9: 500,000-999,999
      1000000  // Level 10: 1,000,000+
    ];
    
    const currentLevelThreshold = levelThresholds[level - 1] || 0;
    const nextLevelThreshold = levelThresholds[level] || (currentLevelThreshold * 2);
    const pointsNeeded = nextLevelThreshold - currentLevelThreshold;
    const pointsProgress = score - currentLevelThreshold;
    const progressPercentage = Math.min(100, (pointsProgress / pointsNeeded) * 100);
    
    return {
      progressPercentage,
      pointsProgress,
      pointsNeeded,
      nextLevelThreshold
    };
  };

  const levelProgress = calculateLevelProgress();
  const trend = getTrendText();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={24} color="#dc2626" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#f7931a"]}
            tintColor="#f7931a"
          />
        }
      >
        {/* Integrated User Profile Card with Level and Stats */}
        <View style={styles.profileCard}>
          {/* User Info Section */}
          <View style={styles.userSection}>
            <View style={styles.userAvatarContainer}>
              <FontAwesome5 name="bitcoin" size={30} color="#f7931a" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user?.username || 'User'}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{getStatus()}</Text>
              </View>
            </View>
            <View style={styles.coinsDisplay}>
              <FontAwesome5 name="bitcoin" size={18} color="#f7931a" />
              <Text style={styles.coinsText}>{coins}</Text>
            </View>
          </View>
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Points Banner */}
          <TouchableOpacity 
            style={styles.pointsBanner}
            onPress={() => setShowPointsInfo(!showPointsInfo)}
            activeOpacity={0.8}
          >
            <View style={styles.pointsRow}>
              <View style={styles.pointsLabelContainer}>
                <Ionicons name="star" size={20} color="#f7931a" />
                <Text style={styles.pointsLabel}>Points</Text>
              </View>
              <View style={styles.pointsValueContainer}>
                <Text style={styles.pointsValue}>{score.toLocaleString()}</Text>
                <Ionicons 
                  name={showPointsInfo ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#f7931a" 
                />
              </View>
            </View>
            
            {showPointsInfo && (
              <View style={styles.pointsInfoContainer}>
                <Text style={styles.pointsInfoTitle}>How Points Work:</Text>
                <View style={styles.pointsInfoItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text style={styles.pointsInfoText}>
                    +10 points for each correct prediction
                  </Text>
                </View>
                <View style={styles.pointsInfoItem}>
                  <Ionicons name="flash" size={16} color="#f59e0b" />
                  <Text style={styles.pointsInfoText}>
                    Points are multiplied by your streak multiplier (up to x5)
                  </Text>
                </View>
                <View style={styles.pointsInfoItem}>
                  <Ionicons name="trending-up" size={16} color="#3B82F6" />
                  <Text style={styles.pointsInfoText}>
                    Higher levels unlock better status titles
                  </Text>
                </View>
                <View style={styles.pointsInfoItem}>
                  <Ionicons name="cart" size={16} color="#f7931a" />
                  <Text style={styles.pointsInfoText}>
                    Points can be exchanged for Bitcoin in the Store
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Level Progress Section */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>{level}</Text>
              </View>
              <View style={styles.levelProgressContainer}>
                <View style={styles.levelProgressLabelRow}>
                  <Text style={styles.levelProgressLabel}>
                    Level {level}
                  </Text>
                  <Text style={styles.levelProgressPoints}>
                    {levelProgress.pointsProgress.toLocaleString()} / {levelProgress.pointsNeeded.toLocaleString()} points
                  </Text>
                </View>
                <View style={styles.levelProgressBar}>
                  <View 
                    style={[
                      styles.levelProgressFill, 
                      { width: `${levelProgress.progressPercentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.nextLevelText}>
                  Next level at {levelProgress.nextLevelThreshold.toLocaleString()} points
                </Text>
              </View>
            </View>
          </View>
          
          {/* Streak Section - Emphasized */}
          <View style={styles.streakSection}>
            <Text style={styles.streakTitle}>Streak Stats</Text>
            <View style={styles.streakContainer}>
              <View style={styles.streakItem}>
                <Ionicons name="flame" size={32} color="#f59e0b" />
                <Text style={styles.streakValue}>{maxStreak}</Text>
                <Text style={styles.streakLabel}>Max Streak</Text>
              </View>
              
              <View style={styles.streakDivider} />
              
              <View style={styles.streakItem}>
                <Ionicons name="trophy" size={32} color="#f59e0b" />
                <Text style={styles.streakValue}>{highScore}</Text>
                <Text style={styles.streakLabel}>High Score</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Achievements Section */}
        <View style={styles.achievementsCard}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.cardTitle}>Achievements</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Achievements' as never)}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          <AchievementProgressBar />
          
          <RecentAchievements 
            maxToShow={3} 
            onAchievementPress={handleAchievementPress}
          />
        </View>
        
        {/* Betting Trend Card (Kept separate) */}
        <View style={styles.trendCard}>
          <Text style={styles.cardTitle}>Betting Trend</Text>
          
          <View style={styles.trendContainer}>
            <Text style={[styles.trendEmoji]}>{trend.emoji}</Text>
            <View style={styles.trendTextContainer}>
              <Text style={[styles.trendText, { color: trend.color }]}>
                {trend.text}
              </Text>
              <Text style={styles.trendSubtext}>
                Bull ({profile.totalBets > 0 ? ((profile.bullBets / profile.totalBets) * 100).toFixed(1) : 0}%) / 
                Bear ({profile.totalBets > 0 ? ((profile.bearBets / profile.totalBets) * 100).toFixed(1) : 0}%)
              </Text>
            </View>
          </View>
          
          <View style={styles.percentageBar}>
            <View 
              style={[
                styles.percentageFill, 
                { 
                  width: `${profile.totalBets > 0 ? (profile.bullBets / profile.totalBets) * 100 : 0}%`,
                  backgroundColor: '#16a34a'
                }
              ]} 
            />
            <View 
              style={[
                styles.percentageFill, 
                { 
                  width: `${profile.totalBets > 0 ? (profile.bearBets / profile.totalBets) * 100 : 0}%`,
                  backgroundColor: '#dc2626'
                }
              ]} 
            />
          </View>
        </View>
        
        {/* Game Type Stats - Simplified */}
        <View style={styles.gameTypeCard}>
          <View style={styles.gameTypeHeader}>
            <Text style={styles.cardTitle}>Game Type</Text>
            <View style={styles.gameTypeBadge}>
              <Text style={styles.gameTypeBadgeText}>1 Minute</Text>
            </View>
          </View>
          <Text style={styles.gameTypeValue}>{profile.oneMinBets} bets</Text>
        </View>
        
        {/* Recent Bets Card */}
        <View style={styles.betsCard}>
          <View style={styles.betsHeader}>
            <Text style={styles.cardTitle}>Recent Bets</Text>
            {betHistory.length > 5 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('BetDetails' as never, { betId: betHistory[0].id } as never)}
              >
                <Text style={styles.viewAllButtonText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
          
          {betHistory.length === 0 ? (
            <Text style={styles.noBetsText}>No bets placed yet</Text>
          ) : (
            betHistory.slice(0, 5).map((bet, index) => (
              <View key={bet.id} style={styles.betItem}>
                <View style={styles.betHeader}>
                  <Text style={styles.betTimestamp}>
                    {new Date(bet.fecha).toLocaleString()}
                  </Text>
                  <View style={[
                    styles.betResultBadge,
                    { 
                      backgroundColor: bet.resultado === 'pendiente' 
                        ? '#f59e0b' 
                        : bet.resultado === 'ganó' 
                          ? '#16a34a' 
                          : '#dc2626' 
                    }
                  ]}>
                    <Text style={styles.betResultText}>
                      {bet.resultado === 'pendiente' ? 'PENDING' : bet.resultado === 'ganó' ? 'WON' : 'LOST'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.betDetails}>
                  <View style={styles.betDetailItem}>
                    <Text style={styles.betDetailLabel}>Prediction:</Text>
                    <Text style={[
                      styles.betDetailValue,
                      { color: bet.apuesta === 'bull' ? '#16a34a' : '#dc2626' }
                    ]}>
                      {bet.apuesta === 'bull' ? '🐂 BULL' : '🐻 BEAR'}
                    </Text>
                  </View>
                  
                  <View style={styles.betDetailItem}>
                    <Text style={styles.betDetailLabel}>Amount:</Text>
                    <Text style={styles.betDetailValue}>{bet.amount} coins</Text>
                  </View>
                  
                  {bet.initialPrice && bet.finalPrice && (
                    <View style={styles.betDetailItem}>
                      <Text style={styles.betDetailLabel}>Price Change:</Text>
                      <Text style={[
                        styles.betDetailValue,
                        { 
                          color: bet.finalPrice > bet.initialPrice 
                            ? '#16a34a' 
                            : bet.finalPrice < bet.initialPrice 
                              ? '#dc2626' 
                              : '#ffffff' 
                        }
                      ]}>
                        {bet.finalPrice > bet.initialPrice ? '↑ ' : bet.finalPrice < bet.initialPrice ? '↓ ' : ''}
                        ${bet.initialPrice.toFixed(1)} → ${bet.finalPrice.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secretCoinsButton}
            onPress={handleSecretButton}
          >
            <LinearGradient
              colors={['#4b5563', '#374151']}
              style={styles.secretButtonGradient}
            >
              <Ionicons name="key" size={20} color="#f7931a" />
              <Text style={styles.secretButtonText}>Secret Coins</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.buttonGradient}
            >
              <Ionicons name="home" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Return to Main Menu</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Secret Modal */}
      <Modal
        visible={showSecretModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSecretModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Secret Code</Text>
            <TextInput
              style={styles.passwordInput}
              value={secretPassword}
              onChangeText={setSecretPassword}
              placeholder="Enter password"
              placeholderTextColor="#666666"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowSecretModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCheckPassword}
              >
                <Text style={styles.confirmButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Achievement Modal */}
      <AchievementUnlockedModal
        achievement={selectedAchievement}
        visible={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
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
  signOutButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  
  // Integrated Profile Card
  profileCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f7931a',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#f7931a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 147, 26, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  coinsText: {
    color: '#f7931a',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#2d2d2d',
    marginBottom: 16,
  },
  // Points Banner
  pointsBanner: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLabel: {
    color: '#f7931a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pointsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  pointsInfoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3d3d3d',
  },
  pointsInfoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pointsInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsInfoText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 8,
  },
  levelSection: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7931a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  levelNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelProgressContainer: {
    flex: 1,
  },
  levelProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelProgressLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
  levelProgressPoints: {
    color: '#9ca3af',
    fontSize: 12,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: '#3d3d3d',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#f7931a',
    borderRadius: 3,
  },
  nextLevelText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'right',
  },
  // New Streak Section - Emphasized
  streakSection: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  streakTitle: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#3d3d3d',
    marginHorizontal: 8,
  },
  
  // Achievements Card
  achievementsCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Trend Card
  trendCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  trendTextContainer: {
    flex: 1,
  },
  trendText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendSubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
  percentageBar: {
    height: 8,
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
  },
  
  // Game Type Card
  gameTypeCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTypeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gameTypeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameTypeValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  
  // Bets Card
  betsCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  betsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  noBetsText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  betItem: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betTimestamp: {
    color: '#9ca3af',
    fontSize: 12,
  },
  betResultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  betResultText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  betDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    padding: 8,
  },
  betDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  betDetailLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  betDetailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Actions Container
  actionsContainer: {
    marginBottom: 32,
  },
  secretCoinsButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  secretButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  secretButtonText: {
    color: '#f7931a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backToHomeButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: '#2d2d2d',
    color: '#ffffff',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2d2d2d',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#f7931a',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
