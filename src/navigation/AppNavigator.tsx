import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import GameScreen5Min from '../screens/GameScreen5Min';
import GameOverScreen from '../screens/GameOverScreen';
import AuthScreen from '../screens/AuthScreen';
import { useAuth } from '../context/AuthContext';
import ProfileScreen from '../screens/ProfileScreen';
import StoreScreen from '../screens/StoreScreen';
import BetDetailsScreen from '../screens/BetDetailsScreen';
import HistorialScreen from '../screens/HistorialScreen';
import RankingScreen from '../screens/RankingScreen';
import TutorialScreen from '../screens/TutorialScreen';
import IntroScreen from '../screens/IntroScreen';
import WheelSpinScreen from '../screens/WheelSpinScreen';
import AchievementsScreen from '../screens/AchievementsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  // Skip intro after it's shown once per session
  useEffect(() => {
    if (user) {
      // Auto-hide intro after 5 seconds if user doesn't interact
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#121212' }
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            {showIntro ? (
              <Stack.Screen name="Intro">
                {props => <IntroScreen {...props} onComplete={handleIntroComplete} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Game" component={GameScreen} />
                <Stack.Screen name="Game5Min" component={GameScreen5Min} />
                <Stack.Screen name="GameOver" component={GameOverScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Store" component={StoreScreen} />
                <Stack.Screen name="BetDetails" component={BetDetailsScreen} />
                <Stack.Screen name="Historial" component={HistorialScreen} />
                <Stack.Screen name="Ranking" component={RankingScreen} />
                <Stack.Screen name="Tutorial" component={TutorialScreen} />
                <Stack.Screen name="WheelSpin" component={WheelSpinScreen} />
                <Stack.Screen name="Achievements" component={AchievementsScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
