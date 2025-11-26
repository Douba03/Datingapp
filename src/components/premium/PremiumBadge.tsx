import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  variant?: 'default' | 'minimal' | 'gold';
}

export function PremiumBadge({ 
  size = 'medium', 
  showIcon = true,
  variant = 'default'
}: PremiumBadgeProps) {
  const sizeStyles = {
    small: {
      fontSize: 10,
      iconSize: 12,
      padding: 4,
      gap: 3,
    },
    medium: {
      fontSize: 12,
      iconSize: 14,
      padding: 6,
      gap: 4,
    },
    large: {
      fontSize: 14,
      iconSize: 16,
      padding: 8,
      gap: 5,
    },
  };

  const currentSize = sizeStyles[size];

  const getBackgroundColor = () => {
    if (variant === 'minimal') return 'transparent';
    if (variant === 'gold') return '#FFD700';
    return colors.primary;
  };

  const getTextColor = () => {
    if (variant === 'gold') return '#000';
    return '#fff';
  };

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: getBackgroundColor(),
        paddingHorizontal: currentSize.padding,
        paddingVertical: currentSize.padding / 2,
        gap: currentSize.gap,
        borderRadius: currentSize.padding * 2,
      },
      variant === 'minimal' && styles.minimalBorder
    ]}>
      {showIcon && (
        <Ionicons
          name="star"
          size={currentSize.iconSize}
          color={variant === 'gold' ? '#FF8C00' : getTextColor()}
        />
      )}
      <Text style={[
        styles.text,
        {
          fontSize: currentSize.fontSize,
          color: variant === 'minimal' ? colors.primary : getTextColor(),
        },
        variant === 'gold' && styles.goldText
      ]}>
        PRO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  minimalBorder: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  goldText: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

