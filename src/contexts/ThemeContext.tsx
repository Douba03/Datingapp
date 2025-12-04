import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Core palette
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  
  // Backgrounds
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  surface: string;
  surfaceElevated: string;
  
  // Text
  text: string;
  textSecondary: string;
  textLight: string;
  
  // Borders & Dividers
  border: string;
  borderLight: string;
  
  // Status colors
  success: string;
  successDark: string;
  warning: string;
  error: string;
  errorDark: string;
  
  // Action buttons
  like: string;
  likeShadow: string;
  pass: string;
  passShadow: string;
  superlike: string;
  superlikeShadow: string;
  undo: string;
  undoShadow: string;
}

// Light theme colors
const lightColors: ThemeColors = {
  primary: '#FF6B9D',
  primaryDark: '#E91E63',
  primaryLight: '#FFB6C1',
  secondary: '#FF8A65',
  accent: '#FFD700',
  
  background: '#FAFBFC',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFBFC',
  
  text: '#2D1F3D',
  textSecondary: '#8B7B8E',
  textLight: '#FFFFFF',
  
  border: '#F3E5F5',
  borderLight: '#FCE4EC',
  
  success: '#4CAF50',
  successDark: '#388E3C',
  warning: '#FFB300',
  error: '#FF5252',
  errorDark: '#D32F2F',
  
  like: '#4CAF50',
  likeShadow: '#81C784',
  pass: '#EF5350',
  passShadow: '#EF9A9A',
  superlike: '#2196F3',
  superlikeShadow: '#64B5F6',
  undo: '#9C27B0',
  undoShadow: '#CE93D8',
};

// Dark theme colors
const darkColors: ThemeColors = {
  primary: '#FF6B9D',
  primaryDark: '#FF4081',
  primaryLight: '#FF8A80',
  secondary: '#FF8A65',
  accent: '#FFD700',
  
  background: '#121212',
  backgroundGradientStart: '#1A1A2E',
  backgroundGradientEnd: '#16213E',
  surface: '#1E1E1E',
  surfaceElevated: '#2D2D2D',
  
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textLight: '#FFFFFF',
  
  border: '#333333',
  borderLight: '#404040',
  
  success: '#66BB6A',
  successDark: '#4CAF50',
  warning: '#FFC107',
  error: '#EF5350',
  errorDark: '#E53935',
  
  like: '#66BB6A',
  likeShadow: '#81C784',
  pass: '#EF5350',
  passShadow: '#E57373',
  superlike: '#42A5F5',
  superlikeShadow: '#64B5F6',
  undo: '#AB47BC',
  undoShadow: '#CE93D8',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@mali_match_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;
  const theme: ThemeMode = isDarkMode ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export colors for backward compatibility
export { lightColors, darkColors };
export type { ThemeColors };
