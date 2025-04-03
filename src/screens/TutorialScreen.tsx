import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// English tutorial content
const englishTutorialContent = [
  {
    title: "Welcome to Candle Rush! ",
    content: "Get ready to predict Bitcoin's price movements in this fast-paced trading game! Here's how to play:"
  },
  {
    title: "Basic Gameplay ",
    content: "Every minute, a new Bitcoin candle forms. Your job is simple:\\n\\n• Predict if the candle will be GREEN (price goes up) or RED (price goes down)\\n• Win coins when you're right, lose coins when you're wrong\\n• Start with 50 coins - don't lose them all!"
  },
  {
    title: "Making Predictions ",
    content: "1. Tap BULL  if you think price will rise (green candle)\\n2. Tap BEAR  if you think price will fall (red candle)\\n3. Choose your bet amount - higher bets mean bigger rewards\\n4. Use DOUBLE BET for higher risk and reward"
  },
  {
    title: "Candle Size Bonuses ",
    content: "Bigger price movements = bigger bonuses!\\n\\n• $0-$25: No bonus (small movement)\\n• $25-$75: +25% bonus\\n• $75-$150: +50% bonus\\n• $150-$250: +100% bonus (double your winnings!)\\n• $250-$400: +150% bonus\\n• $400-$600: +200% bonus\\n• >$600: +300% bonus (quadruple your winnings!)"
  },
  {
    title: "Winning Streaks ",
    content: "Keep winning to build your streak:\\n\\n• 3 wins: x2 multiplier + 10 bonus coins\\n• 5 wins: x3 multiplier + 25 bonus coins\\n• 7 wins: x4 multiplier + 50 bonus coins\\n• 10 wins: x5 multiplier + 100 bonus coins"
  },
  {
    title: "Wheel of Fortune ",
    content: "For 1000 coins, spin the Wheel of Fortune for amazing prizes!\\n\\n• Tap the GIFT icon () in the game screen to access the wheel\\n• Win up to 5000 coins or special bonuses\\n• Limited to 3 spins every 24 hours\\n\\nThe wheel contains various prizes including coins and a special LUCKY BONUS that guarantees a x2 multiplier on your next bet!"
  },
  {
    title: "Market Momentum ",
    content: "The game tracks market momentum - consecutive candles in the same direction:\\n\\n• 3+ candles: +10% bonus\\n• 6+ candles: +50% bonus\\n• 9+ candles: +100% bonus\\n• 12+ candles: +150% bonus\\n\\nUse this information to make smarter predictions!"
  },
  {
    title: "Game Over & Comeback ",
    content: "If you lose all your coins:\\n\\n• Watch an ad to get 50 coins + lucky bonus\\n• Wait for free 20 coins\\n• Or restart with fresh 50 coins\\n\\nYour progress is automatically saved!"
  },
  {
    title: "Pro Tips ",
    content: "• Start with small bets to learn the patterns\\n• Use DOUBLE BET when you're confident\\n• Save coins for the Wheel of Fortune\\n• Watch for market momentum to increase your odds\\n• Check candle sizes for potential big bonuses\\n\\nGood luck, trader! "
  }
];

// Spanish tutorial content
const spanishTutorialContent = [
  {
    title: "¡Bienvenido a Candle Rush! ",
    content: "¡Prepárate para predecir los movimientos del precio de Bitcoin en este juego de trading rápido! Así es como se juega:"
  },
  {
    title: "Jugabilidad Básica ",
    content: "Cada minuto, se forma una nueva vela de Bitcoin. Tu trabajo es simple:\\n\\n• Predice si la vela será VERDE (el precio sube) o ROJA (el precio baja)\\n• Gana monedas cuando aciertas, pierde monedas cuando te equivoques\\n• Comienzas con 50 monedas - ¡no las pierdas todas!"
  },
  {
    title: "Haciendo Predicciones ",
    content: "1. Toca TORO  si crees que el precio subirá (vela verde)\\n2. Toca OSO  si crees que el precio bajará (vela roja)\\n3. Elige tu cantidad de apuesta - apuestas más altas significan mayores recompensas\\n4. Usa APUESTA DOBLE para mayor riesgo y recompensa"
  },
  {
    title: "Bonos por Tamaño de Vela ",
    content: "¡Movimientos de precio más grandes = bonos más grandes!\\n\\n• $0-$25: Sin bono (movimiento pequeño)\\n• $25-$75: +25% de bono\\n• $75-$150: +50% de bono\\n• $150-$250: +100% de bono (¡duplica tus ganancias!)\\n• $250-$400: +150% de bono\\n• $400-$600: +200% de bono\\n• >$600: +300% de bono (¡cuadruplica tus ganancias!)"
  },
  {
    title: "Rachas Ganadoras ",
    content: "Sigue ganando para construir tu racha:\\n\\n• 3 victorias: multiplicador x2 + 10 monedas de bonificación\\n• 5 victorias: multiplicador x3 + 25 monedas de bonificación\\n• 7 victorias: multiplicador x4 + 50 monedas de bonificación\\n• 10 victorias: multiplicador x5 + 100 monedas de bonificación"
  },
  {
    title: "Rueda de la Fortuna ",
    content: "¡Por 1000 monedas, gira la Rueda de la Fortuna para obtener premios increíbles!\\n\\n• Toca el icono de REGALO () en la pantalla del juego para acceder a la rueda\\n• Gana hasta 5000 monedas o bonos especiales\\n• Limitado a 3 giros cada 24 horas\\n\\n¡La rueda contiene varios premios, incluyendo monedas y un BONO DE SUERTE especial que garantiza un multiplicador x2 en tu próxima apuesta!"
  },
  {
    title: "Impulso del Mercado ",
    content: "El juego rastrea el impulso del mercado - velas consecutivas en la misma dirección:\\n\\n• 3+ velas: +10% de bono\\n• 6+ velas: +50% de bono\\n• 9+ velas: +100% de bono\\n• 12+ velas: +150% de bono\\n\\n¡Usa esta información para hacer predicciones más inteligentes!"
  },
  {
    title: "Game Over y Regreso ",
    content: "Si pierdes todas tus monedas:\\n\\n• Mira un anuncio para obtener 50 monedas + bono de suerte\\n• Espera 20 monedas gratis\\n• O reinicia con 50 monedas frescas\\n\\n¡Tu progreso se guarda automáticamente!"
  },
  {
    title: "Consejos Pro ",
    content: "• Comienza con apuestas pequeñas para aprender los patrones\\n• Usa APUESTA DOBLE cuando estés seguro\\n• Ahorra monedas para la Rueda de la Fortuna\\n• Observa el impulso del mercado para aumentar tus probabilidades\\n• Verifica los tamaños de las velas para posibles grandes bonos\\n\\n¡Buena suerte, trader! "
  }
];

const TutorialScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isSpanish, setIsSpanish] = useState(false);
  
  // Select content based on language
  const tutorialContent = isSpanish ? spanishTutorialContent : englishTutorialContent;
  
  const handleSkip = () => {
    navigation.goBack();
  };
  
  const toggleLanguage = () => {
    setIsSpanish(!isSpanish);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleSkip}
        >
          <Ionicons name="close" size={24} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSpanish ? "Cómo Jugar" : "How to Play"}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tutorialContent.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
            {index < tutorialContent.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
        
        <View style={styles.wheelInfoContainer}>
          <Text style={styles.wheelInfoTitle}>
            {isSpanish ? "Cómo Acceder a la Rueda:" : "How to Access the Wheel:"}
          </Text>
          <View style={styles.wheelIconGuide}>
            <Ionicons name="gift" size={24} color="#f59e0b" />
            <Text style={styles.wheelIconText}>
              {isSpanish 
                ? "Busca este icono de regalo en la pantalla del juego" 
                : "Look for this gift icon in the game screen"}
            </Text>
          </View>
          <Image 
            source={require('../../assets/tutorial_image.png')} 
            style={styles.wheelImage}
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.startPlayingButton}
          onPress={handleSkip}
        >
          <Text style={styles.startPlayingText}>
            {isSpanish ? "¡EMPEZAR A JUGAR!" : "START PLAYING!"}
          </Text>
          <Ionicons name="play" size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={styles.creditsText}>
          {isSpanish ? "Hecho con  por Carlos Freire" : "Made with  by Carlos Freire"}
        </Text>
        
        {/* Language toggle button with flag style */}
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
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    color: '#f7931a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginTop: 24,
  },
  wheelInfoContainer: {
    backgroundColor: 'rgba(247, 147, 26, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  wheelInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f7931a',
    marginBottom: 12,
  },
  wheelIconGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 8,
  },
  wheelIconText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 12,
  },
  wheelImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  startPlayingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'center',
  },
  startPlayingText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  creditsText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  // New language toggle with flag style
  languageToggle: {
    marginBottom: 30,
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
  }
});

export default TutorialScreen;
