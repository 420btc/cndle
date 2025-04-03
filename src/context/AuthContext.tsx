import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

// Define simple types
interface User {
  id: string;
  username: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loginAsGuest: () => Promise<{ error: string | null }>;
  getStoredCredentials: () => Promise<any[]>;
  bulkRegisterUsers: (users: any[]) => Promise<any>;
  tryOfflineLogin: () => Promise<boolean>;
  syncUserData: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Basic sign in function
  const signIn = async (username: string, password: string) => {
    try {
      // Get users from storage
      const usersJson = await AsyncStorage.getItem('users');
      let users = {};
      
      try {
        users = usersJson ? JSON.parse(usersJson) : {};
      } catch (parseError) {
        console.error('Error parsing users JSON:', parseError);
        users = {};
      }

      // Check if user exists
      if (!users[username]) {
        return { error: 'User not found' };
      }

      // Check password
      if (users[username].password !== password) {
        return { error: 'Invalid password' };
      }

      // Create user object
      const userObj = {
        id: users[username].id,
        username
      };

      // Save user to state
      setUser(userObj);
      
      // Save user to storage
      try {
        await AsyncStorage.setItem('user', JSON.stringify(userObj));
      } catch (storageError) {
        console.error('Error saving user to storage:', storageError);
        return { error: 'Failed to save user data' };
      }

      // Save credentials for offline login
      try {
        const credentials = await AsyncStorage.getItem('credentials') || '[]';
        const credentialsArray = JSON.parse(credentials);
        credentialsArray.push({ username, password });
        await AsyncStorage.setItem('credentials', JSON.stringify(credentialsArray));
      } catch (credError) {
        console.error('Error saving credentials:', credError);
        // Non-critical error, continue
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: 'Failed to sign in' };
    }
  };

  // Simplified sign up function
  const signUp = async (username: string, password: string) => {
    try {
      console.log('Starting signup process for:', username);
      
      // Generate simple user ID (not using UUID which might be causing issues)
      const userId = 'user_' + Math.random().toString(36).substring(2, 15);
      console.log('Generated user ID:', userId);
      
      // Create user object
      const userObj = {
        id: userId,
        username
      };
      
      // Set user in state first
      setUser(userObj);
      console.log('User set in state');
      
      // Create user entry
      const userData = {
        id: userId,
        password,
        createdAt: new Date().toISOString()
      };
      
      // Get existing users or create empty object
      let users = {};
      try {
        const usersJson = await AsyncStorage.getItem('users');
        users = usersJson ? JSON.parse(usersJson) : {};
      } catch (error) {
        console.error('Error getting users:', error);
        // Continue with empty users object
      }
      
      // Check if username already exists
      if (users[username]) {
        console.log('Username already exists');
        setUser(null); // Reset state
        return { error: 'Username already exists' };
      }
      
      // Add new user
      users[username] = userData;
      
      // Save updated users
      try {
        await AsyncStorage.setItem('users', JSON.stringify(users));
        console.log('Users saved to storage');
      } catch (error) {
        console.error('Error saving users:', error);
        setUser(null); // Reset state
        return { error: 'Failed to save user data' };
      }
      
      // Save user to storage
      try {
        await AsyncStorage.setItem('user', JSON.stringify(userObj));
        console.log('User saved to storage');
      } catch (error) {
        console.error('Error saving user:', error);
        // Continue anyway since we already set the state
      }
      
      // Create profile
      try {
        await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify({
          coins: 50,
          highScore: 0,
          maxStreak: 0,
          totalBets: 0
        }));
        console.log('Profile created');
      } catch (error) {
        console.error('Error creating profile:', error);
        // Continue anyway
      }
      
      // Save credentials for offline login
      try {
        const credentials = await AsyncStorage.getItem('credentials') || '[]';
        const credentialsArray = JSON.parse(credentials);
        credentialsArray.push({ username, password });
        await AsyncStorage.setItem('credentials', JSON.stringify(credentialsArray));
        console.log('Credentials saved');
      } catch (error) {
        console.error('Error saving credentials:', error);
        // Non-critical error, continue
      }
      
      console.log('Signup completed successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      setUser(null); // Reset state on error
      return { error: 'Failed to sign up: ' + (error.message || 'Unknown error') };
    }
  };

  // Guest login - completely simplified
  const loginAsGuest = async () => {
    try {
      // Generate simple guest ID and username
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
      const guestUsername = `Guest-${Math.floor(Math.random() * 10000)}`;

      // Create guest user
      const guestUser = {
        id: guestId,
        username: guestUsername,
        isGuest: true
      };

      // Set user in state first
      setUser(guestUser);
      
      // Then try to save to storage
      try {
        await AsyncStorage.setItem('user', JSON.stringify(guestUser));
      } catch (storageError) {
        console.error('Failed to save guest user:', storageError);
        // Continue anyway since we already set the state
      }

      // Create basic profile
      try {
        await AsyncStorage.setItem(`profile_${guestId}`, JSON.stringify({
          coins: 50,
          highScore: 0,
          maxStreak: 0,
          totalBets: 0
        }));
      } catch (profileError) {
        console.error('Failed to create guest profile:', profileError);
        // Continue anyway, profile will be created when needed
      }

      return { error: null };
    } catch (error) {
      console.error('Guest login error:', error);
      return { error: 'Failed to login as guest' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Set state first
      setUser(null);
      
      // Then try to remove from storage
      try {
        await AsyncStorage.removeItem('user');
      } catch (error) {
        console.error('Error removing user from storage:', error);
        // Already set state to null, so continue
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Placeholder functions to maintain API compatibility
  const getStoredCredentials = async () => {
    try {
      const credentials = await AsyncStorage.getItem('credentials');
      return credentials ? JSON.parse(credentials) : [];
    } catch (error) {
      console.error('Get credentials error:', error);
      return [];
    }
  };

  const bulkRegisterUsers = async (users: any[]) => {
    return { success: 0, failed: 0, errors: ['Bulk registration is disabled'] };
  };

  const tryOfflineLogin = async () => {
    return false;
  };

  const syncUserData = async () => {
    // Do nothing
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        loginAsGuest,
        getStoredCredentials,
        bulkRegisterUsers,
        tryOfflineLogin,
        syncUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
