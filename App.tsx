import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import TutorialScreen from './src/screens/TutorialScreen';
import BetDetailsScreen from './src/screens/BetDetailsScreen';
import IntroScreen from './src/screens/IntroScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import WheelSpinScreen from './src/screens/WheelSpinScreen';
import StoreScreen from './src/screens/StoreScreen';
import RankingScreen from './src/screens/RankingScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import { GameProvider } from './src/context/GameContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AchievementProvider } from './src/context/AchievementContext';
import { DeviceModeProvider } from './src/context/DeviceModeContext';
import { loadSounds } from './src/utils/SoundManager';

const Stack = createNativeStackNavigator();

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <ActivityIndicator size="large" color="#f7931a" />
  </View>
);

// Main navigation component that handles auth state
const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [checkingIntro, setCheckingIntro] = useState(true);
  const [forceShowIntro, setForceShowIntro] = useState(true); // Always show intro

  useEffect(() => {
    // Configure audio
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        
        // Preload sounds
        await loadSounds();
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };
    
    setupAudio();
    
    // Check if the user has seen the intro before
    const checkIntroStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenIntro');
        setHasSeenIntro(value === 'true');
      } catch (error) {
        console.error('Error checking intro status:', error);
      } finally {
        setCheckingIntro(false);
      }
    };

    checkIntroStatus();
  }, []);

  const handleIntroComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      setHasSeenIntro(true);
      setForceShowIntro(false);
    } catch (error) {
      console.error('Error saving intro status:', error);
    }
  };

  // Show loading screen while checking auth and intro status
  if (isLoading || checkingIntro) {
    return <LoadingScreen />;
  }

  // Show intro screen if user hasn't seen it yet or if we're forcing it
  if (forceShowIntro || !hasSeenIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <Stack.Navigator 
      initialRouteName={user ? "Home" : "Auth"}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#121212' }
      }}
    >
      {user ? (
        // Authenticated routes
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="GameOver" component={GameOverScreen} />
          <Stack.Screen name="Tutorial" component={TutorialScreen} />
          <Stack.Screen name="BetDetails" component={BetDetailsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="WheelSpin" component={WheelSpinScreen} />
          <Stack.Screen name="Store" component={StoreScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
        </>
      ) : (
        // Unauthenticated routes
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GameProvider>
          <AchievementProvider>
            <DeviceModeProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar style="light" />
              </NavigationContainer>
            </DeviceModeProvider>
          </AchievementProvider>
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
