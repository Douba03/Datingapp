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

// Light theme colors - Calafdoon: Calm, serious, trustworthy
const lightColors: ThemeColors = {
  primary: '#0B1F3B', // Deep Navy
  primaryDark: '#061428',
  primaryLight: '#1A3A5C',
  secondary: '#A8B8A6', // Soft Sage
  accent: '#C8A15A', // Muted Gold
  
  background: '#F7F3EE', // Warm Off-white
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#F7F3EE',
  surface: '#FFFFFF',
  surfaceElevated: '#FDFCFA',
  
  text: '#1C1C1C', // Charcoal
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  success: '#10B981', // Emerald
  successDark: '#059669',
  warning: '#F59E0B',
  error: '#EF4444',
  errorDark: '#DC2626',
  
  like: '#10B981',
  likeShadow: '#6EE7B7',
  pass: '#EF4444',
  passShadow: '#FCA5A5',
  superlike: '#0B1F3B',
  superlikeShadow: '#1A3A5C',
  undo: '#6B7280',
  undoShadow: '#9CA3AF',
};

// Dark theme colors - Calafdoon dark mode
const darkColors: ThemeColors = {
  primary: '#4A6FA5', // Lighter navy for dark mode
  primaryDark: '#0B1F3B',
  primaryLight: '#6B8FC5',
  secondary: '#A8B8A6', // Soft Sage
  accent: '#D4AF37', // Brighter gold for dark mode
  
  background: '#0F1419', // Dark navy-black
  backgroundGradientStart: '#0F1419',
  backgroundGradientEnd: '#1A2634',
  surface: '#1A2634', // Dark navy surface
  surfaceElevated: '#243447',
  
  text: '#F7F3EE', // Warm off-white
  textSecondary: '#9CA3AF',
  textLight: '#FFFFFF',
  
  border: '#374151',
  borderLight: '#4B5563',
  
  success: '#34D399', // Brighter emerald
  successDark: '#10B981',
  warning: '#FBBF24',
  error: '#F87171',
  errorDark: '#EF4444',
  
  like: '#34D399',
  likeShadow: '#6EE7B7',
  pass: '#F87171',
  passShadow: '#FCA5A5',
  superlike: '#4A6FA5',
  superlikeShadow: '#6B8FC5',
  undo: '#9CA3AF',
  undoShadow: '#D1D5DB',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@calafdoon_theme';

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
