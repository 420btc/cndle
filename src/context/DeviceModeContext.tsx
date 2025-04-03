import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DeviceMode = 'mobile' | 'web';

interface DeviceModeContextType {
  deviceMode: DeviceMode;
  toggleDeviceMode: () => void;
  isMobileMode: boolean;
  isWebMode: boolean;
}

const DeviceModeContext = createContext<DeviceModeContextType | undefined>(undefined);

export const DeviceModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('mobile');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved device mode preference on startup
  useEffect(() => {
    const loadDeviceMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('deviceMode');
        if (savedMode === 'web' || savedMode === 'mobile') {
          setDeviceMode(savedMode);
        }
      } catch (error) {
        console.error('Error loading device mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeviceMode();
  }, []);

  // Toggle between mobile and web modes
  const toggleDeviceMode = async () => {
    const newMode: DeviceMode = deviceMode === 'mobile' ? 'web' : 'mobile';
    setDeviceMode(newMode);
    
    // Save preference to AsyncStorage
    try {
      await AsyncStorage.setItem('deviceMode', newMode);
    } catch (error) {
      console.error('Error saving device mode:', error);
    }
  };

  // Computed properties for easier checks in components
  const isMobileMode = deviceMode === 'mobile';
  const isWebMode = deviceMode === 'web';

  // Don't render children until we've loaded the saved preference
  if (isLoading) {
    return null;
  }

  return (
    <DeviceModeContext.Provider 
      value={{ 
        deviceMode, 
        toggleDeviceMode, 
        isMobileMode, 
        isWebMode 
      }}
    >
      {children}
    </DeviceModeContext.Provider>
  );
};

// Custom hook to use the device mode context
export const useDeviceMode = (): DeviceModeContextType => {
  const context = useContext(DeviceModeContext);
  if (context === undefined) {
    throw new Error('useDeviceMode must be used within a DeviceModeProvider');
  }
  return context;
};
