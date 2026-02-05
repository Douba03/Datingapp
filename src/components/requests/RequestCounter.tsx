import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RequestCounter as RequestCounterType, REQUEST_CONSTANTS } from '../../types/requests';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface RequestCounterProps {
  counter: RequestCounterType | null;
}

export function RequestCounter({ counter }: RequestCounterProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  
  const isPremium = user?.is_premium;
  const isExhausted = counter?.remaining === 0;
  const isLow = counter && counter.remaining > 0 && counter.remaining <= REQUEST_CONSTANTS.LOW_REQUESTS_THRESHOLD;
  const nextRefill = counter?.next_refill_at ? new Date(counter.next_refill_at) : null;

  useEffect(() => {
    if (isPremium || !isExhausted || !nextRefill) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isPremium, isExhausted, nextRefill]);
  
  // Premium users have unlimited requests
  if (isPremium) {
    return (
      <LinearGradient
        colors={['#C8A15A', '#D4AF37']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.premiumContainer}
      >
        <Ionicons name="infinite" size={14} color="#fff" />
        <Text style={styles.premiumText}>∞</Text>
      </LinearGradient>
    );
  }
  
  if (!counter) return null;

  const formatTimeUntilRefill = () => {
    if (!nextRefill) return '';
    const diff = nextRefill.getTime() - now;
    if (diff <= 0) return 'Refilling now!';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  if (isExhausted) {
    return (
      <LinearGradient
        colors={[colors.error, '#FCA5A5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.exhaustedContainer}
      >
        <Ionicons name="time-outline" size={12} color="#fff" />
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
        name="paper-plane" 
        size={12} 
        color={isLow ? colors.warning : colors.primary} 
      />
      <Text style={[styles.remainingText, { color: isLow ? colors.warning : colors.primary }]}>
        {counter.remaining}
      </Text>
      <Text style={[styles.label, { color: isLow ? colors.warning : colors.textSecondary }]}>
        left
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    gap: 3,
  },
  exhaustedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
  },
  exhaustedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  premiumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    shadowColor: '#C8A15A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
