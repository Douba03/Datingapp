import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwipeCounter as SwipeCounterType } from '../../types/user';
import { colors } from '../theme/colors';

interface SwipeCounterProps {
  counter: SwipeCounterType | null;
  onRefillPress?: () => void;
}

export function SwipeCounter({ counter, onRefillPress }: SwipeCounterProps) {
  const [now, setNow] = useState(Date.now());
  if (!counter) return null;

  const isExhausted = counter.remaining === 0;
  const nextRefill = counter.next_refill_at ? new Date(counter.next_refill_at) : null;

  useEffect(() => {
    if (!isExhausted || !nextRefill) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isExhausted, nextRefill]);

  const formatTimeUntilRefill = () => {
    if (!nextRefill) return '';
    const diff = nextRefill.getTime() - now;
    if (diff <= 0) return 'Refill available!';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <View style={[styles.container, isExhausted && styles.exhaustedContainer]}>
      <Text style={[styles.remainingText, isExhausted && styles.exhaustedText]}>
        {isExhausted ? '0' : counter.remaining}
      </Text>
      <Text style={[styles.label, isExhausted && styles.exhaustedText]}>
        {isExhausted && nextRefill ? formatTimeUntilRefill() : 'swipes'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  exhaustedContainer: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  exhaustedText: {
    color: '#fff',
  },
});