import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bet } from '../context/GameContext';
import { useNavigation } from '@react-navigation/native';

interface BetHistoryItemProps {
  bet: Bet;
}

const BetHistoryItem: React.FC<BetHistoryItemProps> = ({ bet }) => {
  const navigation = useNavigation();
  const isPending = bet.resultado === 'pendiente';
  const isWin = bet.resultado === 'ganó';
  
  const getStatusColor = () => {
    if (isPending) return '#f59e0b';
    return isWin ? '#16a34a' : '#dc2626';
  };
  
  const getStatusIcon = () => {
    if (isPending) return 'time-outline';
    return isWin ? 'checkmark-circle' : 'close-circle';
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleViewDetails = () => {
    navigation.navigate('BetDetails' as never, { betId: bet.id } as never);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.timeText}>{formatTime(bet.fecha)}</Text>
        <View style={styles.predictionContainer}>
          <Text style={[styles.predictionText, { color: bet.apuesta === 'bull' ? '#16a34a' : '#dc2626' }]}>
            {bet.apuesta === 'bull' ? '🐂' : '🐻'}
          </Text>
        </View>
        {bet.amount && (
          <View style={styles.amountContainer}>
            <Ionicons name="logo-bitcoin" size={10} color="#f59e0b" />
            <Text style={styles.amountText}>{bet.amount}</Text>
          </View>
        )}
        {bet.initialPrice && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>${bet.initialPrice.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {isPending ? 'PENDING' : (isWin ? 'WON' : 'LOST')}
        </Text>
        <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={handleViewDetails}
        >
          <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    backgroundColor: '#2d2d2d', 
    borderRadius: 8, 
    marginBottom: 8 
  },
  leftSection: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  timeText: { 
    color: '#9ca3af', 
    fontSize: 12, 
    marginRight: 8 
  },
  predictionContainer: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    marginRight: 8 
  },
  predictionText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  amountContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    marginRight: 8
  },
  amountText: { 
    fontSize: 10, 
    color: '#f59e0b', 
    marginLeft: 2, 
    fontWeight: 'bold' 
  },
  priceContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  priceText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  rightSection: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginRight: 4 
  },
  detailsButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  }
});

export default BetHistoryItem;
