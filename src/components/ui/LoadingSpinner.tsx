import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: any;
  emoji?: string;
}

export function LoadingSpinner({
  size = 'large',
  text,
  style,
  emoji = '💕',
}: LoadingSpinnerProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const emojiSize = size === 'large' ? 45 : 28;
  
  useEffect(() => {
    // Simple pulse animation for the main emoji only
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#FDF8F8', '#FFF0F5', '#FAF0FF', '#FDF8F8']}
        style={styles.gradient}
      />
      
      {/* Main animated emoji - only this one moves */}
      <Animated.View style={[styles.emojiContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>{emoji}</Text>
      </Animated.View>
      
      {text && (
        <Text style={styles.text}>{text}</Text>
      )}
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  emojiContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  emoji: {
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 20,
  },
});
