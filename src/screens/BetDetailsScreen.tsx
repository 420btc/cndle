import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGame, Bet } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const BetDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { betHistory } = useGame();
  const [bet, setBet] = useState<Bet | null>(null);
  const betId = (route.params as any)?.betId;
  
  useEffect(() => {
    if (betId) {
      // Find the bet in the global history
      const foundBet = betHistory.find(b => b.id === betId);
      if (foundBet) {
        setBet(foundBet);
        console.log("Found bet:", foundBet);
      } else {
        console.log("Bet not found. ID:", betId);
        console.log("Available bets:", betHistory.map(b => b.id));
      }
    }
  }, [betId, betHistory]);
  
  if (!bet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bet Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bet not found</Text>
          <Text style={styles.emptySubtext}>ID: {betId}</Text>
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.returnButtonText}>Return to Game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const isPending = bet.resultado === 'pendiente';
  const isWin = bet.resultado === 'ganó';
  const statusColor = isPending ? '#f59e0b' : (isWin ? '#16a34a' : '#dc2626');
  const statusText = isPending ? 'PENDING' : (isWin ? 'WON' : 'LOST');
  
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const calculatePriceChange = () => {
    if (!bet.initialPrice || !bet.finalPrice) return null;
    
    const change = bet.finalPrice - bet.initialPrice;
    const percentChange = (change / bet.initialPrice) * 100;
    
    return {
      change,
      percentChange,
      isPositive: change > 0
    };
  };
  
  const priceChange = calculatePriceChange();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bet Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Bet Information</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time:</Text>
            <Text style={styles.infoValue}>{formatDateTime(bet.fecha)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prediction:</Text>
            <View style={[styles.predictionBadge, { 
              backgroundColor: bet.apuesta === 'bull' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)',
              borderColor: bet.apuesta === 'bull' ? '#16a34a' : '#dc2626'
            }]}>
              <Text style={styles.predictionEmoji}>
                {bet.apuesta === 'bull' ? '🐂' : '🐻'}
              </Text>
              <Ionicons 
                name={bet.apuesta === 'bull' ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={bet.apuesta === 'bull' ? '#16a34a' : '#dc2626'} 
              />
              <Text style={[styles.predictionText, { 
                color: bet.apuesta === 'bull' ? '#16a34a' : '#dc2626' 
              }]}>
                {bet.apuesta === 'bull' ? 'BULL (BULLISH)' : 'BEAR (BEARISH)'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bet Amount:</Text>
            <View style={styles.amountContainer}>
              <Ionicons name="logo-bitcoin" size={16} color="#f59e0b" />
              <Text style={styles.amountText}>{bet.amount || 0} coins</Text>
            </View>
          </View>
          
          {bet.initialPrice && (
            <View style={styles.priceSection}>
              <Text style={styles.priceSectionTitle}>Price Information</Text>
              
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Initial Price</Text>
                  <Text style={styles.priceValue}>${bet.initialPrice.toFixed(2)}</Text>
                  <Text style={styles.priceTimestamp}>At time of bet</Text>
                </View>
                
                {bet.finalPrice && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Final Price</Text>
                    <Text style={styles.priceValue}>${bet.finalPrice.toFixed(2)}</Text>
                    <Text style={styles.priceTimestamp}>After 59 seconds</Text>
                  </View>
                )}
              </View>
              
              {priceChange && (
                <View style={[styles.changeContainer, { 
                  backgroundColor: priceChange.isPositive ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'
                }]}>
                  <Ionicons 
                    name={priceChange.isPositive ? 'trending-up' : 'trending-down'} 
                    size={20} 
                    color={priceChange.isPositive ? '#16a34a' : '#dc2626'} 
                  />
                  <Text style={[styles.changeText, { 
                    color: priceChange.isPositive ? '#16a34a' : '#dc2626' 
                  }]}>
                    {priceChange.isPositive ? '+' : ''}{priceChange.change.toFixed(2)} 
                    ({priceChange.isPositive ? '+' : ''}{priceChange.percentChange.toFixed(2)}%)
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Bet Result</Text>
            <Text style={styles.resultExplanation}>
              {isPending ? 
                'This bet is still pending resolution.' : 
                (isWin ? 
                  `You won this bet because the price ${bet.apuesta === 'bull' ? 'increased' : 'decreased'} as you predicted.` : 
                  `You lost this bet because the price ${bet.apuesta === 'bull' ? 'decreased' : 'increased'}, contrary to your prediction.`
                )
              }
            </Text>
            
            {!isPending && (
              <View style={[styles.outcomeContainer, { 
                backgroundColor: isWin ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'
              }]}>
                <Ionicons 
                  name={isWin ? 'checkmark-circle' : 'close-circle'} 
                  size={24} 
                  color={isWin ? '#16a34a' : '#dc2626'} 
                />
                <Text style={[styles.outcomeText, { 
                  color: isWin ? '#16a34a' : '#dc2626' 
                }]}>
                  {isWin ? 
                    `You won ${(bet.amount || 0) * 2} coins!` : 
                    `You lost ${bet.amount || 0} coins.`
                  }
                </Text>
              </View>
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 24,
  },
  returnButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  returnButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  predictionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  predictionText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amountText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  priceSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
  },
  priceSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  priceLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceTimestamp: {
    color: '#9ca3af',
    fontSize: 10,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  changeText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  resultSection: {
    marginTop: 8,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultExplanation: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  outcomeText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default BetDetailsScreen;
