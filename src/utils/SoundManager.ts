import { Audio } from 'expo-av';

// Define sound types
export type SoundType = 'success' | 'failure' | 'bonus' | 'gameOver';

// Define sound URLs
const SOUND_URLS = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Win sound
  failure: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Lose sound
  bonus: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',   // Bonus/special sound
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/566/566-preview.mp3'   // Game over sound
};

// Sound instances cache
const soundInstances: Record<SoundType, Audio.Sound | null> = {
  success: null,
  failure: null,
  bonus: null,
  gameOver: null
};

// Default volume level - reduced to 0.3 (30% of original volume)
const DEFAULT_VOLUME = 0.3;

/**
 * Load all sound effects
 */
export const loadSounds = async (): Promise<void> => {
  try {
    // Configure audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load each sound
    for (const [key, url] of Object.entries(SOUND_URLS)) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, volume: DEFAULT_VOLUME }
      );
      soundInstances[key as SoundType] = sound;
    }
    
    console.log('All sounds loaded successfully');
  } catch (error) {
    console.error('Error loading sounds:', error);
  }
};

/**
 * Play a sound effect
 * @param soundType The type of sound to play
 * @param volume Optional volume override (0.0 to 1.0)
 */
export const playSound = async (soundType: SoundType, volume?: number): Promise<void> => {
  try {
    const sound = soundInstances[soundType];
    
    if (!sound) {
      console.warn(`Sound ${soundType} not loaded, attempting to load it now`);
      await loadSound(soundType);
      return playSound(soundType, volume);
    }
    
    // Set volume if provided, otherwise use default
    if (volume !== undefined) {
      await sound.setVolumeAsync(volume);
    } else {
      await sound.setVolumeAsync(DEFAULT_VOLUME);
    }
    
    // Reset sound to beginning and play
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (error) {
    console.error(`Error playing ${soundType} sound:`, error);
  }
};

/**
 * Load a specific sound
 * @param soundType The type of sound to load
 */
const loadSound = async (soundType: SoundType): Promise<void> => {
  try {
    const url = SOUND_URLS[soundType];
    if (!url) {
      console.error(`No URL defined for sound type: ${soundType}`);
      return;
    }
    
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, volume: DEFAULT_VOLUME }
    );
    
    soundInstances[soundType] = sound;
  } catch (error) {
    console.error(`Error loading ${soundType} sound:`, error);
  }
};

/**
 * Unload all sounds to free up resources
 */
export const unloadSounds = async (): Promise<void> => {
  try {
    for (const key of Object.keys(soundInstances)) {
      const sound = soundInstances[key as SoundType];
      if (sound) {
        await sound.unloadAsync();
        soundInstances[key as SoundType] = null;
      }
    }
    console.log('All sounds unloaded');
  } catch (error) {
    console.error('Error unloading sounds:', error);
  }
};

/**
 * Set the volume for all sounds
 * @param volume Volume level from 0.0 to 1.0
 */
export const setMasterVolume = async (volume: number): Promise<void> => {
  try {
    // Ensure volume is between 0 and 1
    const safeVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    for (const key of Object.keys(soundInstances)) {
      const sound = soundInstances[key as SoundType];
      if (sound) {
        await sound.setVolumeAsync(safeVolume);
      }
    }
    
    console.log(`Master volume set to ${safeVolume}`);
  } catch (error) {
    console.error('Error setting master volume:', error);
  }
};
