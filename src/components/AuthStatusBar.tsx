import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface AuthStatusBarProps {
  onLogout?: () => void;
}

const AuthStatusBar: React.FC<AuthStatusBarProps> = ({ onLogout }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Ionicons name="person-circle-outline" size={18} color="#ffffff" />
        <Text style={styles.username}>{user.username}</Text>
      </View>
      
      {onLogout && (
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ffffff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default AuthStatusBar;
