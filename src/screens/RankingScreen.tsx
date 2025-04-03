import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

// Interface for user data in the ranking
interface RankingUser {
  id: string;
  username: string;
  score: number;
  level: number;
  isBot: boolean; // We'll keep this for internal logic but won't display it
  avatar?: string;
  streak?: number;
  dailyChange?: number; // New field for 24h change
}

const RankingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { score, level, highScore, streak } = useGame();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [rankingData, setRankingData] = useState<RankingUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'allTime'>('weekly');

  // Generate ranking data with realistic names and scores
  useEffect(() => {
    const generateRankingData = () => {
      setIsLoading(true);
      
      // Create realistic trader names
      const traderNames = [
        'CryptoKing', 'BitcoinBaron', 'SatoshiTrader', 'BlockchainBull', 
        'CandleGuru', 'TradingTitan', 'CoinCollector', 'TokenTrader',
        'HashMaster', 'WalletWarrior', 'MiningMaster', 'ChartChampion'
      ];
      
      // Create traders with scores based on the timeframe
      const traders: RankingUser[] = traderNames.slice(0, 11).map((name, index) => {
        // Generate scores more realistically based on timeframe
        let maxScore = 0;
        switch(timeFrame) {
          case 'daily':
            maxScore = 5000;
            break;
          case 'weekly':
            maxScore = 20000;
            break;
          case 'allTime':
            maxScore = 100000;
            break;
        }
        
        // Create a more realistic distribution with top players having much higher scores
        const position = index + 1;
        let baseScore;
        
        if (position === 1) {
          // Top player has significantly higher score
          baseScore = maxScore * 0.9;
        } else if (position === 2) {
          // Second place has about 80% of top score
          baseScore = maxScore * 0.8;
        } else if (position === 3) {
          // Third place has about 70% of top score
          baseScore = maxScore * 0.7;
        } else if (position <= 5) {
          // Top 5 have decent scores
          baseScore = maxScore * (0.5 - (position - 3) * 0.05);
        } else {
          // Rest have progressively lower scores
          baseScore = maxScore * (0.3 - (position - 5) * 0.02);
        }
        
        // Add some randomness
        const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
        const finalScore = Math.floor(baseScore * randomFactor);
        
        // Calculate level based on score
        const traderLevel = Math.max(1, Math.floor(finalScore / 5000) + 1);
        
        // Generate a realistic daily change (-5% to +10%)
        const dailyChangePercent = (Math.random() * 15) - 5;
        const dailyChange = Math.round(finalScore * (dailyChangePercent / 100));
        
        return {
          id: `trader-${index}`,
          username: name,
          score: finalScore,
          level: traderLevel,
          isBot: true, // Keep for internal logic
          avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${name}`,
          streak: Math.floor(Math.random() * 10),
          dailyChange: dailyChange
        };
      });
      
      // Add the current user
      const currentUser: RankingUser = {
        id: user?.id || 'current-user',
        username: user?.username || 'You',
        score: timeFrame === 'allTime' ? highScore : score,
        level,
        isBot: false,
        streak,
        dailyChange: Math.floor(Math.random() * 200) - 50 // Random change for the user
      };
      
      // Combine and sort
      const allUsers = [...traders, currentUser].sort((a, b) => b.score - a.score);
      
      // Find the user's rank
      const userRankIndex = allUsers.findIndex(u => u.id === currentUser.id);
      
      setRankingData(allUsers);
      setUserRank(userRankIndex + 1);
      setIsLoading(false);
    };
    
    generateRankingData();
  }, [timeFrame, user, score, level, highScore, streak]);

  // Function to render each ranking item
  const renderRankingItem = (user: RankingUser, index: number) => {
    const isCurrentUser = !user.isBot;
    const rank = index + 1;
    
    // Determine background color based on rank
    let backgroundColor = 'transparent';
    if (rank === 1) backgroundColor = 'rgba(255, 215, 0, 0.15)'; // Gold
    else if (rank === 2) backgroundColor = 'rgba(192, 192, 192, 0.15)'; // Silver
    else if (rank === 3) backgroundColor = 'rgba(205, 127, 50, 0.15)'; // Bronze
    else if (isCurrentUser) backgroundColor = 'rgba(138, 43, 226, 0.15)'; // Purple for current user
    
    // Determine medal based on rank
    let medal = null;
    if (rank === 1) medal = '🥇';
    else if (rank === 2) medal = '🥈';
    else if (rank === 3) medal = '🥉';
    
    return (
      <View 
        key={user.id} 
        style={[
          styles.rankingItem, 
          { backgroundColor },
          isCurrentUser && styles.currentUserItem
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{rank}</Text>
          {medal && <Text style={styles.medalText}>{medal}</Text>}
        </View>
        
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image 
              source={{ uri: user.avatar }} 
              style={styles.avatar} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#6b21a8' }]}>
              <Text style={styles.avatarText}>
                {user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[
            styles.username, 
            isCurrentUser && styles.currentUsername
          ]}>
            {isCurrentUser ? 'You' : user.username}
          </Text>
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{user.level}</Text>
            </View>
            {user.streak !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="flame" size={12} color="#f59e0b" />
                <Text style={styles.statValue}>{user.streak}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{user.score.toLocaleString()}</Text>
          <Text style={styles.scoreLabel}>points</Text>
          
          {/* Display 24h change */}
          {user.dailyChange !== undefined && (
            <View style={[
              styles.changeContainer,
              { backgroundColor: user.dailyChange >= 0 ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)' }
            ]}>
              <Ionicons 
                name={user.dailyChange >= 0 ? 'trending-up' : 'trending-down'} 
                size={10} 
                color={user.dailyChange >= 0 ? '#16a34a' : '#dc2626'} 
              />
              <Text style={[
                styles.changeText,
                { color: user.dailyChange >= 0 ? '#16a34a' : '#dc2626' }
              ]}>
                {user.dailyChange >= 0 ? '+' : ''}{user.dailyChange}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>Ranking</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.timeFrameSelector}>
        <TouchableOpacity 
          style={[
            styles.timeFrameButton, 
            timeFrame === 'daily' && styles.activeTimeFrame
          ]}
          onPress={() => setTimeFrame('daily')}
        >
          <Text style={[
            styles.timeFrameText,
            timeFrame === 'daily' && styles.activeTimeFrameText
          ]}>Daily</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.timeFrameButton, 
            timeFrame === 'weekly' && styles.activeTimeFrame
          ]}
          onPress={() => setTimeFrame('weekly')}
        >
          <Text style={[
            styles.timeFrameText,
            timeFrame === 'weekly' && styles.activeTimeFrameText
          ]}>Weekly</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.timeFrameButton, 
            timeFrame === 'allTime' && styles.activeTimeFrame
          ]}
          onPress={() => setTimeFrame('allTime')}
        >
          <Text style={[
            styles.timeFrameText,
            timeFrame === 'allTime' && styles.activeTimeFrameText
          ]}>All Time</Text>
        </TouchableOpacity>
      </View>
      
      {userRank !== null && (
        <View style={styles.yourRankContainer}>
          <Text style={styles.yourRankLabel}>Your Rank</Text>
          <View style={styles.yourRankValue}>
            <Text style={styles.yourRankNumber}>{userRank}</Text>
            <Text style={styles.yourRankSuffix}>
              {userRank === 1 ? 'st' : userRank === 2 ? 'nd' : userRank === 3 ? 'rd' : 'th'}
            </Text>
          </View>
        </View>
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading ranking data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.rankingList}>
          {rankingData.map((user, index) => renderRankingItem(user, index))}
        </ScrollView>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            setIsLoading(true);
            setTimeout(() => {
              // Simulate updating the ranking with small changes
              const updatedRanking = rankingData.map(user => {
                // Small random score changes (±2%)
                const changePercent = (Math.random() * 4) - 2;
                const scoreChange = Math.floor(user.score * (changePercent / 100));
                
                return {
                  ...user,
                  score: user.score + scoreChange,
                  dailyChange: (user.dailyChange || 0) + scoreChange
                };
              });
              
              setRankingData(updatedRanking.sort((a, b) => b.score - a.score));
              
              // Recalculate user rank
              const userIndex = updatedRanking.findIndex(u => !u.isBot);
              if (userIndex !== -1) {
                setUserRank(userIndex + 1);
              }
              
              setIsLoading(false);
            }, 1000);
          }}
        >
          <Ionicons name="refresh" size={16} color="#ffffff" />
          <Text style={styles.refreshButtonText}>Refresh Ranking</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Rankings update every 24 hours
        </Text>
      </View>
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
  timeFrameSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  timeFrameButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2d2d2d',
  },
  activeTimeFrame: {
    backgroundColor: '#8b5cf6',
  },
  timeFrameText: {
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTimeFrameText: {
    color: '#ffffff',
  },
  yourRankContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: '#8b5cf6',
  },
  yourRankLabel: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  yourRankValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yourRankNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  yourRankSuffix: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  rankingList: {
    flex: 1,
    padding: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentUserItem: {
    borderColor: '#8b5cf6',
    borderWidth: 1,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  medalText: {
    fontSize: 16,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentUsername: {
    color: '#8b5cf6',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginRight: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#9ca3af',
    fontSize: 10,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  changeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2d',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default RankingScreen;
