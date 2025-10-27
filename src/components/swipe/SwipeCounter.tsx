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
    <View style={styles.container}>
      <View style={styles.counterContainer}>
        <Text style={styles.remainingText}>
          {isExhausted ? 'No swipes left' : `${counter.remaining} swipes left`}
        </Text>
        {isExhausted && nextRefill && (
          <Text style={styles.refillText}>
            Swipes refill in {formatTimeUntilRefill()}
          </Text>
        )}
      </View>

      {isExhausted && onRefillPress && (
        <Text style={styles.upgradeText} onPress={onRefillPress}>
          Upgrade to Premium for unlimited swipes
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  counterContainer: {
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  refillText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  upgradeText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});