import { useDeviceMode } from '../context/DeviceModeContext';
import { StyleSheet } from 'react-native';

/**
 * A hook that returns responsive styles based on the current device mode
 * @param mobileStyles The styles to use in mobile mode
 * @param webStyles The styles to use in web mode
 * @returns The appropriate styles for the current device mode
 */
export const useResponsiveStyles = <T extends StyleSheet.NamedStyles<T>>(
  mobileStyles: T,
  webStyles: Partial<T>
): T => {
  const { isWebMode } = useDeviceMode();
  
  if (!isWebMode) {
    return mobileStyles;
  }
  
  // Merge mobile and web styles, with web styles taking precedence
  return {
    ...mobileStyles,
    ...webStyles,
  };
};

export default useResponsiveStyles;
