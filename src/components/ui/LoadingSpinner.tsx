import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
  showHeart?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color,
  text,
  style,
  showHeart = true,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color || colors.primary;
  
  return (
    <View style={[styles.container, style]}>
      {showHeart && (
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="heart" size={48} color={colors.primary} style={styles.heartIcon} />
        </View>
      )}
      <ActivityIndicator size={size} color={spinnerColor} style={styles.spinner} />
      {text && <Text style={[styles.text, { color: colors.text }]}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartIcon: {
    opacity: 0.9,
  },
  spinner: {
    marginBottom: 8,
  },
  text: {
    marginTop: 8,
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '600',
  },
});
