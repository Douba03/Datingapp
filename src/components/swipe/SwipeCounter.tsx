import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SwipeCounter as SwipeCounterType } from '../../types/user';
import { useTheme } from '../../contexts/ThemeContext';
import { SWIPE_CONSTANTS } from '../../constants/swipes';

interface SwipeCounterProps {
  counter: SwipeCounterType | null;
  onRefillPress?: () => void;
}

export function SwipeCounter({ counter, onRefillPress }: SwipeCounterProps) {
  const { colors } = useTheme();
  const [now, setNow] = useState(Date.now());
  
  if (!counter) return null;

  const isExhausted = counter.remaining === 0;
  const isLow = counter.remaining > 0 && counter.remaining <= SWIPE_CONSTANTS.LOW_SWIPES_THRESHOLD;
  const nextRefill = counter.next_refill_at ? new Date(counter.next_refill_at) : null;

  useEffect(() => {
    if (!isExhausted || !nextRefill) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isExhausted, nextRefill]);

  const formatTimeUntilRefill = () => {
    if (!nextRefill) return '';
    const diff = nextRefill.getTime() - now;
    if (diff <= 0) return 'Refill now!';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  if (isExhausted) {
    return (
      <LinearGradient
        colors={[colors.error, '#FF8A80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.exhaustedContainer}
      >
        <Ionicons name="time-outline" size={16} color="#fff" />
        <Text style={styles.exhaustedText}>{formatTimeUntilRefill()}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.surface, borderColor: `${colors.primary}30` },
      isLow && { borderColor: colors.warning, backgroundColor: `${colors.warning}15` }
    ]}>
      <Ionicons 
        name="flame" 
        size={18} 
        color={isLow ? colors.warning : colors.primary} 
      />
      <Text style={[styles.remainingText, { color: isLow ? colors.warning : colors.primary }]}>
        {counter.remaining}
      </Text>
      <Text style={[styles.label, { color: isLow ? colors.warning : colors.textSecondary }]}>left</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    gap: 6,
  },
  exhaustedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  remainingText: {
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  exhaustedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
