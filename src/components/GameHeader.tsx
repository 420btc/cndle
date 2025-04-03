import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGame } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';

interface GameHeaderProps {
  timeRemaining: number;
  totalTime: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({ timeRemaining, totalTime }) => {
  const { score, lives, streak, multiplier, highScore } = useGame();
  
  // Calculate time percentage for progress bar
  const timePercentage = (timeRemaining / totalTime) * 100;
  
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.highScore}>BEST: {highScore}</Text>
        </View>
        
        <View style={styles.livesContainer}>
          {[...Array(3)].map((_, index) => (
            <Ionicons
              key={`life-${index}`}
              name="heart"
              size={20}
              color={index < lives ? '#ef4444' : '#333333'}
              style={styles.lifeIcon}
            />
          ))}
        </View>
      </View>
      
      <View style={styles.middleRow}>
        <View style={styles.streakContainer}>
          {streak > 0 && (
            <>
              <Text style={styles.streakLabel}>STREAK</Text>
              <Text style={styles.streakValue}>{streak}x</Text>
              {multiplier > 1 && (
                <View style={[
                  styles.multiplierBadge,
                  { backgroundColor: multiplier === 3 ? '#ef4444' : '#f59e0b' }
                ]}>
                  <Text style={styles.multiplierText}>x{multiplier}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
      
      <View style={styles.timerContainer}>
        <View style={styles.timerBackground}>
          <View 
            style={[
              styles.timerFill, 
              { 
                width: `${timePercentage}%`,
                backgroundColor: timePercentage < 20 
                  ? '#ef4444' 
                  : timePercentage < 50 
                    ? '#f59e0b' 
                    : '#16a34a'
              }
            ]} 
          />
        </View>
        <Text style={styles.timerText}>{Math.ceil(timeRemaining)}s</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'column',
  },
  scoreLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  highScore: {
    color: '#9ca3af',
    fontSize: 10,
  },
  livesContainer: {
    flexDirection: 'row',
  },
  lifeIcon: {
    marginLeft: 4,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  streakValue: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  multiplierBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  multiplierText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'relative',
    height: 24,
    marginTop: 4,
  },
  timerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#333333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: 12,
  },
  timerText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default GameHeader;
