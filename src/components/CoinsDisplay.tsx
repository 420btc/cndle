import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CoinsDisplayProps {
  coins: number;
}

const CoinsDisplay: React.FC<CoinsDisplayProps> = ({ coins }) => {
  return (
    <View style={styles.container}>
      <View style={styles.coinsContainer}>
        <Ionicons name="logo-bitcoin" size={24} color="#f59e0b" />
        <Text style={styles.coinsText}>{coins}</Text>
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
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  coinsText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 8,
  },
});

export default CoinsDisplay;
