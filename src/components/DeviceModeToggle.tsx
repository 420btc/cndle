import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceMode } from '../context/DeviceModeContext';

interface DeviceModeToggleProps {
  isSpanish?: boolean;
}

const DeviceModeToggle: React.FC<DeviceModeToggleProps> = ({ isSpanish = false }) => {
  const { deviceMode, toggleDeviceMode } = useDeviceMode();
  
  const mobileText = isSpanish ? 'Móvil' : 'Mobile';
  const webText = isSpanish ? 'Web' : 'Web';
  const switchToText = isSpanish ? 'Cambiar a' : 'Switch to';
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={toggleDeviceMode}
      activeOpacity={0.8}
    >
      <View style={styles.toggleContainer}>
        <Ionicons 
          name={deviceMode === 'mobile' ? 'desktop-outline' : 'phone-portrait-outline'} 
          size={20} 
          color="#ffffff" 
        />
        <Text style={styles.toggleText}>
          {switchToText} {deviceMode === 'mobile' ? webText : mobileText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default DeviceModeToggle;
