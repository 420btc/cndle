import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakDisplayProps {
  streak: number;
  multiplier: number;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, multiplier }) => {
  // Determine color based on streak level
  const getStreakColor = () => {
    if (streak >= 10) return '#ef4444'; // Red for high streaks
    if (streak >= 7) return '#f97316'; // Orange for medium-high streaks
    if (streak >= 5) return '#f59e0b'; // Amber for medium streaks
    if (streak >= 3) return '#16a34a'; // Green for low streaks
    return '#9ca3af'; // Gray for no streak
  };

  return (
    <View style={styles.container}>
      <View style={[styles.streakContainer, { borderColor: getStreakColor() }]}>
        <Ionicons name="flame" size={24} color={getStreakColor()} />
        <Text style={styles.streakText}>{streak}</Text>
        {multiplier > 1 && (
          <View style={[styles.multiplierBadge, { backgroundColor: getStreakColor() }]}>
            <Text style={styles.multiplierText}>x{multiplier}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  streakText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 8,
  },
  multiplierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  multiplierText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default StreakDisplay;
