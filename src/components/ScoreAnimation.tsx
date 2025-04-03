import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScoreAnimationProps {
  points: number;
  position: { x: number; y: number };
  onComplete: () => void;
  isCoin?: boolean;
}

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ 
  points, 
  position, 
  onComplete,
  isCoin = false
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Hold for a moment
      Animated.delay(300),
      
      // Float up and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, []);
  
  // Determine color based on points
  const textColor = points > 0 ? '#16a34a' : '#dc2626';
  const pointsText = points > 0 ? `+${points}` : `${points}`;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x,
          top: position.y,
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {isCoin ? (
        <View style={styles.coinContainer}>
          <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
          <Text style={[styles.text, { color: points > 0 ? '#f59e0b' : '#dc2626' }]}>
            {pointsText}
          </Text>
        </View>
      ) : (
        <Text style={[styles.text, { color: textColor }]}>
          {pointsText}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  }
});

export default ScoreAnimation;
