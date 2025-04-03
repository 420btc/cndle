import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useGame, Bet } from '../context/GameContext';

const HistorialScreen: React.FC = () => {
  const { betHistory } = useGame();
  const [historial, setHistorial] = useState<Bet[]>([]);

  useEffect(() => {
    setHistorial(betHistory);
  }, [betHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Historial de Apuestas</Text>
        {historial.length === 0 ? (
          <Text style={styles.emptyText}>No hay apuestas registradas.</Text>
        ) : (
          historial.map((bet) => (
            <View key={bet.id} style={styles.betItem}>
              <Text style={styles.betText}>
                Minuto {bet.minuto} - {bet.apuesta.toUpperCase()} : {bet.resultado.toUpperCase()}
              </Text>
              <Text style={styles.betDate}>{new Date(bet.fecha).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center'
  },
  betItem: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  betText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  betDate: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4
  }
});

export default HistorialScreen;
