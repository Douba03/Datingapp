import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface NoSwipesLeftBannerProps {
  nextRefillTime?: Date | null;
  onUpgrade: () => void;
  onTimerComplete?: () => void;
}

const { width } = Dimensions.get('window');

export function NoSwipesLeftBanner({ nextRefillTime, onUpgrade, onTimerComplete }: NoSwipesLeftBannerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const onTimerCompleteRef = useRef(onTimerComplete);
  const hasCalledComplete = useRef(false);

  // Keep the ref updated
  useEffect(() => {
    onTimerCompleteRef.current = onTimerComplete;
  }, [onTimerComplete]);

  useEffect(() => {
    if (!nextRefillTime) {
      setTimeLeft('12:00:00');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const refillTime = new Date(nextRefillTime).getTime();
      const difference = refillTime - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00');
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true;
          setIsExpired(true);
          // Call the callback using the ref
          if (onTimerCompleteRef.current) {
            onTimerCompleteRef.current();
          }
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [nextRefillTime]);

  // Don't render if expired
  if (isExpired) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDF2F8', '#FCE7F3']}
        style={styles.banner}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>💔</Text>
          <Text style={styles.title}>No Swipes Left</Text>
          <Text style={styles.subtitle}>
            You've used all your daily swipes! Come back later or upgrade for unlimited swiping.
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>Swipes refill in</Text>
          <View style={styles.timerContainer}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.timerBg}
            >
              <Text style={styles.timerText}>{timeLeft}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Premium Section */}
        <View style={styles.premiumSection}>
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumTitle}>✨ Go Premium</Text>
            <Text style={styles.premiumSubtitle}>Why wait when love could be one swipe away?</Text>
          </View>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="infinite" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Unlimited swipes</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="eye" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>See who likes you</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="star" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>5 Super Likes daily</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>Priority in discovery</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={onUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Ionicons name="diamond" size={20} color="#fff" />
              <Text style={styles.upgradeText}>Upgrade Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  banner: {
    width: width - 32,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  timerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timerBg: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  premiumSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  benefitsList: {
    marginBottom: 20,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  upgradeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
