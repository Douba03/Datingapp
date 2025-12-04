import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const textStyle = [
    styles.text,
    styles[`${variant}Text`] || styles.primaryText,
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  // Use gradient for primary buttons
  if (variant === 'primary' || variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[styles.buttonWrapper, styles[size], disabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={['#FF6B9D', '#FF8E72', '#FFB347']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientButton, styles[size]]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={textStyle}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#fff' : colors.primary} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  secondary: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    // Handled by LinearGradient
  },
  small: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    minHeight: 52,
  },
  large: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    minHeight: 60,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontWeight: '700', // Bolder
    textAlign: 'center',
    letterSpacing: 0.3, // Better spacing
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: colors.primary,
    fontWeight: '600',
  },
  gradientText: {
    color: '#fff',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.7,
  },
});
