import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface IntroScreenProps {
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

// Generate realistic candle data for animation
const generateRealisticCandles = (count: number) => {
  // Define specific zones to avoid title area and Bitcoin logo
  const zones = [
    // Left side
    { minX: 0, maxX: width * 0.25, minY: height * 0.15, maxY: height * 0.85 },
    // Right side
    { minX: width * 0.75, maxX: width, minY: height * 0.15, maxY: height * 0.85 },
    // Bottom - well below the logo
    { minX: width * 0.3, maxX: width * 0.7, minY: height * 0.75, maxY: height * 0.9 },
    // Top - well above the title
    { minX: width * 0.3, maxX: width * 0.7, minY: height * 0.05, maxY: height * 0.15 },
  ];

  // Create realistic price movements
  const basePrice = 50000 + Math.random() * 10000;
  let lastPrice = basePrice;
  
  return Array(count).fill(0).map((_, i) => {
    // Create realistic price movement (small changes between candles)
    const priceChange = (Math.random() - 0.5) * 1000; // -500 to +500
    const newPrice = lastPrice + priceChange;
    const isBullish = newPrice > lastPrice;
    
    // Calculate realistic candle body and wick sizes
    const bodySize = Math.abs(newPrice - lastPrice);
    const wickSize = bodySize * (1 + Math.random() * 1.5); // Wicks are 1-2.5x body size
    
    // Update last price for next candle
    lastPrice = newPrice;
    
    // Select a random zone
    const zone = zones[Math.floor(Math.random() * zones.length)];
    
    // Generate position within the selected zone
    const x = zone.minX + Math.random() * (zone.maxX - zone.minX);
    const y = zone.minY + Math.random() * (zone.maxY - zone.minY);
    
    // Scale candle size based on price movement (bigger movements = bigger candles)
    const scaleFactor = 0.5 + (Math.abs(priceChange) / 1000);
    const candleHeight = 40 * scaleFactor;
    const wickHeight = wickSize * 0.5;
    
    return {
      id: i,
      x: x,
      y: y,
      width: 10 + Math.random() * 8, // Realistic candle width
      height: candleHeight,
      wickHeight: wickHeight,
      isBullish,
      price: newPrice,
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
      rotation: new Animated.Value(0),
      showIndicator: Math.random() > 0.7, // Only some candles show indicators
    };
  });
};

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  // Animation values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;
  const bitcoinOpacity = useRef(new Animated.Value(0)).current;
  const bitcoinScale = useRef(new Animated.Value(0.5)).current;
  
  // Generate realistic candles for background
  const candles = useRef(generateRealisticCandles(15)).current;
  
  // Auto-advance timer
  useEffect(() => {
    // Start with background fade in
    const animations = [
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ];
    
    // Add title animation
    animations.push(
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ])
    );
    
    // Add Bitcoin logo animation after the title
    animations.push(
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(bitcoinOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bitcoinScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ])
    );
    
    // Animate candles with staggered timing and realistic movement
    candles.forEach((candle, index) => {
      // Random delay for more natural appearance
      const delay = 800 + Math.random() * 1000;
      
      animations.push(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(candle.opacity, {
              toValue: 0.9,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(candle.translateY, {
              toValue: -10 + Math.random() * 20, // Slight random movement
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(candle.rotation, {
              toValue: -5 + Math.random() * 10, // Slight random rotation
              duration: 1200,
              useNativeDriver: true,
            })
          ])
        ])
      );
    });
    
    // Run all animations in parallel with proper timing
    Animated.stagger(50, animations).start(() => {
      // Auto-advance after animation completes
      setTimeout(() => {
        onComplete();
      }, 4000);
    });
    
    // Start pulsating animation for the Bitcoin logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(bitcoinScale, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bitcoinScale, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={['rgba(18, 18, 18, 0.7)', 'rgba(30, 30, 30, 0.85)', 'rgba(45, 45, 45, 0.9)']}
          style={styles.gradient}
          locations={[0, 0.5, 1]}
        />
      </Animated.View>
      
      {/* Animated candles in background */}
      {candles.map((candle) => {
        // Convert rotation value to degrees string
        const rotateStr = candle.rotation.interpolate({
          inputRange: [-10, 10],
          outputRange: ['-10deg', '10deg'],
        });
        
        return (
          <Animated.View
            key={candle.id}
            style={[
              styles.candle,
              {
                left: candle.x,
                top: candle.y,
                width: candle.width,
                backgroundColor: candle.isBullish ? '#16a34a' : '#dc2626',
                height: candle.height,
                opacity: candle.opacity,
                transform: [
                  { translateY: candle.translateY },
                  { rotate: rotateStr }
                ],
                shadowColor: candle.isBullish ? '#16a34a' : '#dc2626',
                shadowOpacity: 0.5,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 0 },
              }
            ]}
          >
            {/* Candle wick */}
            <View
              style={[
                styles.candleWick,
                {
                  height: candle.wickHeight,
                  backgroundColor: candle.isBullish ? '#16a34a' : '#dc2626',
                }
              ]}
            />
            
            {/* Price indicator */}
            {candle.showIndicator && (
              <View
                style={[
                  styles.priceIndicator,
                  {
                    backgroundColor: candle.isBullish ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)',
                    top: -40,
                  }
                ]}
              >
                <Text style={styles.priceText}>
                  ${Math.floor(candle.price).toLocaleString()}
                </Text>
              </View>
            )}
          </Animated.View>
        );
      })}
      
      <View style={styles.content}>
        {/* Title styled like the main menu */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }]
            }
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.logoGreen}>Candle</Text>
            <Text style={styles.logoRed}>Rush</Text>
          </View>
          <Text style={styles.subtitle}>
            Trade Bitcoin with real-time market data
          </Text>
        </Animated.View>
        
        {/* Bitcoin logo - positioned BELOW the title */}
        <Animated.View 
          style={[
            styles.bitcoinContainer,
            {
              opacity: bitcoinOpacity,
              transform: [{ scale: bitcoinScale }]
            }
          ]}
        >
          <FontAwesome5 name="bitcoin" size={120} color="#f7931a" />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10, // Ensure content is above candles
  },
  titleContainer: {
    zIndex: 15,
    alignItems: 'center',
    marginBottom: 40, // Add margin to create space between title and Bitcoin logo
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  logoGreen: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#16a34a',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  logoRed: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#dc2626',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bitcoinContainer: {
    zIndex: 15,
    shadowColor: '#f7931a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 20,
  },
  candle: {
    position: 'absolute',
    borderRadius: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 2, // Lower zIndex to ensure candles stay behind the title and logo
    elevation: 5,
  },
  candleWick: {
    position: 'absolute',
    width: 2,
    top: -30,
    borderRadius: 1,
  },
  priceIndicator: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    zIndex: 3,
  },
  priceText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  }
});

export default IntroScreen;
