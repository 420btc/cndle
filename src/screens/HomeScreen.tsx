import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Animated,
  BackHandler,
  Platform,
  Alert,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useDeviceMode } from '../context/DeviceModeContext';
import DailyRewards from '../components/DailyRewards';
import DeviceModeToggle from '../components/DeviceModeToggle';

// English text content
const englishContent = {
  subtitle: "Predict Bitcoin's next move in real-time!",
  playButton: "PLAY",
  profileButton: "PROFILE",
  storeButton: "STORE",
  tutorialButton: "TUTORIAL",
  rankingButton: "RANKING",
  logoutButton: "Logout",
  disclaimer: "Using real-time Bitcoin data from Binance. Bfloat and a lot of love 💚 made this possible.",
  creditText: "By Carlos Freire"
};

// Spanish text content
const spanishContent = {
  subtitle: "¡Predice el próximo movimiento de Bitcoin en tiempo real!",
  playButton: "JUGAR",
  profileButton: "PERFIL",
  storeButton: "TIENDA",
  tutorialButton: "TUTORIAL",
  rankingButton: "RANKING",
  logoutButton: "Cerrar Sesión",
  disclaimer: "Usando datos de Bitcoin en tiempo real de Binance. Bfloat y mucho amor 💚 hicieron esto posible.",
  creditText: "Por Carlos Freire"
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const pulseAnim = new Animated.Value(1);
  const { user, signOut } = useAuth();
  const { coins, score } = useGame();
  const { deviceMode, isWebMode } = useDeviceMode();
  const [isSpanish, setIsSpanish] = useState(false);
  
  // Get content based on selected language
  const content = isSpanish ? spanishContent : englishContent;
  
  // Pulse animation for the play button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Handle back button to exit app
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);
  
  const handlePlay = () => {
    navigation.navigate('Game' as never);
  };
  
  const handleProfile = () => {
    navigation.navigate('Profile' as never);
  };
  
  const handleTutorial = () => {
    navigation.navigate('Tutorial' as never);
  };
  
  const handleStore = () => {
    navigation.navigate('Store' as never);
  };
  
  const handleRanking = () => {
    navigation.navigate('Ranking' as never);
  };
  
  const handleLogout = () => {
    Alert.alert(
      isSpanish ? "Cerrar Sesión" : "Logout",
      isSpanish ? "¿Estás seguro que quieres cerrar sesión?" : "Are you sure you want to log out?",
      [
        { text: isSpanish ? "Cancelar" : "Cancel", style: "cancel" },
        { 
          text: isSpanish ? "Cerrar Sesión" : "Logout", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };
  
  const toggleLanguage = () => {
    setIsSpanish(!isSpanish);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#000000', '#121212', '#1e1e1e', '#333333']}
          style={styles.gradient}
          locations={[0, 0.3, 0.6, 1]}
        />
        
        {/* Crypto-themed background elements */}
        <View style={styles.backgroundElements}>
          <FontAwesome5 name="bitcoin" size={30} color="#f7931a" style={[styles.bgIcon, { top: '15%', left: '15%' }]} />
          <FontAwesome5 name="ethereum" size={30} color="#627eea" style={[styles.bgIcon, { top: '20%', right: '20%' }]} />
          <Ionicons name="trending-up" size={30} color="#16a34a" style={[styles.bgIcon, { top: '30%', left: '25%' }]} />
          <Ionicons name="trending-down" size={30} color="#dc2626" style={[styles.bgIcon, { top: '35%', right: '25%' }]} />
          <FontAwesome5 name="chart-line" size={30} color="#ffffff" style={[styles.bgIcon, { top: '50%', left: '10%' }]} />
          <FontAwesome5 name="microchip" size={30} color="#ffffff" style={[styles.bgIcon, { top: '55%', right: '15%' }]} />
          <FontAwesome5 name="server" size={30} color="#ffffff" style={[styles.bgIcon, { top: '70%', left: '20%' }]} />
          <FontAwesome5 name="chart-bar" size={30} color="#ffffff" style={[styles.bgIcon, { top: '75%', right: '10%' }]} />
        </View>
      </View>
      
      <View style={[styles.content, isWebMode && styles.webContent]}>
        <View style={[styles.logoContainer, isWebMode && styles.webLogoContainer]}>
          <View style={styles.logoRow}>
            <Text style={[styles.logoGreen, isWebMode && styles.webLogoText]}>Candle</Text>
            <Text style={[styles.logoRed, isWebMode && styles.webLogoText]}>Rush</Text>
          </View>
          <Text style={[styles.subtitle, isWebMode && styles.webSubtitle]}>
            {content.subtitle}
          </Text>
        </View>
        
        <View style={[styles.buttonsContainer, isWebMode && styles.webButtonsContainer]}>
          {/* Main Play Button - Green remains unchanged */}
          <Animated.View style={{ 
            transform: [{ scale: pulseAnim }], 
            width: isWebMode ? '60%' : '100%', 
            marginBottom: 20 
          }}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlay}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="play" size={24} color="#ffffff" />
                <Text style={styles.playButtonText}>{content.playButton}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Main Menu Buttons - 2x2 Grid */}
          <View style={[styles.menuGrid, isWebMode && styles.webMenuGrid]}>
            {/* Profile Button - Now Orange */} 
            <TouchableOpacity
              style={[styles.menuButton, styles.profileButton, isWebMode && styles.webMenuButton]}
              onPress={handleProfile}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f97316', '#ea580c']}
                style={styles.menuButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person" size={22} color="#ffffff" />
                <Text style={styles.menuButtonText}>{content.profileButton}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Store Button - Now Purple */} 
            <TouchableOpacity
              style={[styles.menuButton, styles.storeButton, isWebMode && styles.webMenuButton]}
              onPress={handleStore}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.menuButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="cart" size={22} color="#ffffff" />
                <Text style={styles.menuButtonText}>{content.storeButton}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Tutorial Button remains unchanged */}
            <TouchableOpacity
              style={[styles.menuButton, styles.tutorialButton, isWebMode && styles.webMenuButton]}
              onPress={handleTutorial}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#627eea', '#4c6bc7']}
                style={styles.menuButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="help-circle" size={22} color="#ffffff" />
                <Text style={styles.menuButtonText}>{content.tutorialButton}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Ranking Button - Remains Golden */} 
            <TouchableOpacity
              style={[styles.menuButton, styles.rankingButton, isWebMode && styles.webMenuButton]}
              onPress={handleRanking}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fcd34d', '#f59e0b']}
                style={styles.menuButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="trophy" size={22} color="#ffffff" />
                <Text style={styles.menuButtonText}>{content.rankingButton}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {/* Daily Rewards Component */}
          <DailyRewards isSpanish={isSpanish} />
          
          {/* Logout Button - Bearish Red remains unchanged */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutButtonInner}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>{content.logoutButton}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          {/* Credit text */}
          <Text style={styles.creditText}>{content.creditText}</Text>
          <Text style={styles.disclaimer}>
            {content.disclaimer}
          </Text>
          
          {/* Device Mode Toggle Button */}
          <DeviceModeToggle isSpanish={isSpanish} />
          
          {/* Language toggle button */}
          <TouchableOpacity 
            style={styles.languageToggle}
            onPress={toggleLanguage}
          >
            <View style={styles.flagContainer}>
              <Image 
                source={{ 
                  uri: isSpanish 
                    ? 'https://flagcdn.com/w80/us.png' 
                    : 'https://flagcdn.com/w80/es.png' 
                }} 
                style={styles.flagImage} 
                resizeMode="cover"
              />
              <Text style={styles.languageToggleText}>
                {isSpanish ? "English" : "Español"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  bgIcon: {
    position: 'absolute',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  // Web mode styles
  webContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webLogoContainer: {
    width: '40%',
    alignItems: 'flex-start',
    marginTop: 0,
  },
  webLogoText: {
    fontSize: 80,
  },
  webSubtitle: {
    fontSize: 24,
    textAlign: 'left',
  },
  webButtonsContainer: {
    width: '55%',
    alignItems: 'center',
  },
  webMenuGrid: {
    width: '100%',
    justifyContent: 'space-around',
  },
  webMenuButton: {
    width: '45%',
    height: 100,
  },
  languageToggle: {
    marginTop: 15,
    alignSelf: 'center',
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  flagImage: {
    width: 24,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  languageToggleText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoRow: {
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
  buttonsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  playButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#16a34a',
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
  playButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  menuButton: {
    width: '48%',
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
  },
  menuButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
  profileButton: {
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  storeButton: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tutorialButton: {
    shadowColor: '#627eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  rankingButton: {
    shadowColor: '#fcd34d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  creditText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disclaimer: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 10,
  }
});

export default HomeScreen;
