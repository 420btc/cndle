import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeartLossAnimationProps {
  count: number;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

const HeartLossAnimation: React.FC<HeartLossAnimationProps> = ({ count, onComplete }) => {
  // Create refs for each heart animation
  const hearts = Array(count).fill(0).map(() => ({
    scale: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(0)).current,
    rotation: useRef(new Animated.Value(0)).current,
  }));
  
  useEffect(() => {
    // Animate each heart with a slight delay between them
    hearts.forEach((heart, index) => {
      // Start with a delay based on index
      setTimeout(() => {
        // Animate the heart appearing and moving
        Animated.sequence([
          // Appear and grow
          Animated.parallel([
            Animated.timing(heart.scale, {
              toValue: 1.5,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(heart.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          
          // Hold for a moment
          Animated.delay(200),
          
          // Move up and fade out
          Animated.parallel([
            Animated.timing(heart.translateY, {
              toValue: -150,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(heart.translateX, {
              toValue: Math.random() * 100 - 50, // Random horizontal movement
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(heart.opacity, {
              toValue: 0,
              duration: 800,
              delay: 200,
              useNativeDriver: true,
            }),
            Animated.timing(heart.rotation, {
              toValue: Math.random() > 0.5 ? 1 : -1, // Random rotation direction
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // If this is the last heart, call onComplete
          if (index === hearts.length - 1) {
            setTimeout(onComplete, 200);
          }
        });
      }, index * 300); // Stagger the animations
    });
  }, []);
  
  return (
    <View style={styles.container}>
      {hearts.map((heart, index) => {
        // Convert rotation value to degrees
        const rotate = heart.rotation.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-30deg', '30deg'],
        });
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.heartContainer,
              {
                opacity: heart.opacity,
                transform: [
                  { scale: heart.scale },
                  { translateY: heart.translateY },
                  { translateX: heart.translateX },
                  { rotate },
                ],
              },
            ]}
          >
            <Ionicons name="heart" size={50} color="#ef4444" />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  heartContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeartLossAnimation;
