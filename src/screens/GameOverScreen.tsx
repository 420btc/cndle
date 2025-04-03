import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';

const GameOverScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { score, highScore, resetGame } = useGame();
  const finalScore = (route.params as any)?.score || score;
  const isHighScore = finalScore >= highScore;
  
  const scoreAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(0.5);
  
  // Animations
  useEffect(() => {
    // Score counting animation
    Animated.timing(scoreAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
    
    // Bounce animation for high score badge
    if (isHighScore) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);
  
  // Interpolate score for counting animation
  const animatedScore = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, finalScore],
  });
  
  const handlePlayAgain = () => {
    resetGame();
    navigation.navigate('Game' as never);
  };
  
  const handleHome = () => {
    navigation.navigate('Home' as never);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#121212', '#1e1e1e']}
          style={styles.background}
        />
        
        <View style={styles.header}>
          <Text style={styles.title}>Game Over</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>YOUR SCORE</Text>
          <Animated.Text style={styles.scoreValue}>
            {animatedScore.interpolate({
              inputRange: [0, finalScore],
              outputRange: [0, finalScore].map(x => Math.floor(x).toString()),
            })}
          </Animated.Text>
          
          {isHighScore && (
            <Animated.View 
              style={[
                styles.highScoreBadge,
                { transform: [{ scale: bounceAnim }] }
              ]}
            >
              <Ionicons name="trophy" size={16} color="#ffffff" />
              <Text style={styles.highScoreText}>NEW HIGH SCORE!</Text>
            </Animated.View>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HIGH SCORE</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.playAgainButtonText}>PLAY AGAIN</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color="#9ca3af" />
            <Text style={styles.homeButtonText}>HOME</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.tipText}>
            TIP: Watch for patterns in the candlesticks to improve your predictions!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  highScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
  },
  highScoreText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    minWidth: 150,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  playAgainButton: {
    width: '80%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playAgainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  homeButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  tipText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default GameOverScreen;
