import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';

const { width } = Dimensions.get('window');

interface NoSwipesLeftBannerProps {
  nextRefillTime: Date | null;
  onUpgradePress: () => void;
  onTimerComplete?: () => void;
}

export function NoSwipesLeftBanner({ nextRefillTime, onUpgradePress, onTimerComplete }: NoSwipesLeftBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  
  // Use ref to store callback to avoid dependency issues
  const onTimerCompleteRef = useRef(onTimerComplete);
  // Track if we've already called the callback to prevent multiple calls
  const hasCalledComplete = useRef(false);

  // Update the ref when callback changes
  useEffect(() => {
    onTimerCompleteRef.current = onTimerComplete;
  }, [onTimerComplete]);

  useEffect(() => {
    const calculateTime = () => {
      if (!nextRefillTime) {
        setTimeRemaining({ hours: 12, minutes: 0, seconds: 0 });
        return;
      }

      const now = new Date();
      const diff = nextRefillTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        
        // Call the callback only once when timer completes
        if (!hasCalledComplete.current && onTimerCompleteRef.current) {
          hasCalledComplete.current = true;
          // Use setTimeout to avoid calling during render
          setTimeout(() => {
            onTimerCompleteRef.current?.();
          }, 100);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    // Reset the hasCalledComplete flag when nextRefillTime changes (new timer)
    hasCalledComplete.current = false;
    setIsExpired(false);

    // Calculate immediately
    calculateTime();

    // Update every second
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [nextRefillTime]); // Only depend on nextRefillTime, not on callback

  // Don't render if expired
  if (isExpired) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      {/* Main Card */}
      <View style={styles.card}>
        {/* Top Section with Icon */}
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.mainEmoji}>💔</Text>
          </View>
          <Text style={styles.title}>No Swipes Left!</Text>
          <Text style={styles.subtitle}>
            You've used all your free swipes for now
          </Text>
        </View>

        {/* Live Timer Section */}
        <View style={styles.timerSection}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerLabel}>⏰ Swipes refill in:</Text>
          </View>
          <View style={styles.timerDisplay}>
            <View style={styles.timerBlock}>
              <Text style={styles.timerNumber}>{formatNumber(timeRemaining.hours)}</Text>
              <Text style={styles.timerUnit}>hours</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerBlock}>
              <Text style={styles.timerNumber}>{formatNumber(timeRemaining.minutes)}</Text>
              <Text style={styles.timerUnit}>min</Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={styles.timerBlock}>
              <Text style={styles.timerNumber}>{formatNumber(timeRemaining.seconds)}</Text>
              <Text style={styles.timerUnit}>sec</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Premium Option */}
        <TouchableOpacity 
          style={styles.premiumCard}
          onPress={onUpgradePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumGradient}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumEmoji}>👑</Text>
                <Text style={styles.premiumTitle}>Go Premium</Text>
              </View>
              <Text style={styles.premiumSubtitle}>
                Unlimited swipes & exclusive features
              </Text>
              
              {/* Premium Benefits */}
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>Unlimited daily swipes</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>See who likes you</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>✓</Text>
                  <Text style={styles.benefitText}>Undo last swipe</Text>
                </View>
              </View>

              <View style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom Message */}
        <Text style={styles.bottomMessage}>
          💕 Great matches are worth the wait!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    ...shadows.large,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timerSection: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  timerHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  timerBlock: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 60,
  },
  timerNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  timerUnit: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 2,
  },
  timerSeparator: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  premiumCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.glow,
  },
  premiumGradient: {
    padding: 2,
    borderRadius: 16,
  },
  premiumContent: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  premiumEmoji: {
    fontSize: 24,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  benefitsList: {
    gap: 8,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitIcon: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
