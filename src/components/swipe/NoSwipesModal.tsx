import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface NoSwipesModalProps {
  visible: boolean;
  nextRefillTime: Date | null;
  onClose: () => void;
  onGetPremium: () => void;
}

export function NoSwipesModal({
  visible,
  nextRefillTime,
  onClose,
  onGetPremium,
}: NoSwipesModalProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!visible || !nextRefillTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const refillTime = nextRefillTime.getTime();
      const diff = refillTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [visible, nextRefillTime]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with gradient */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.header}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="heart-dislike" size={40} color={colors.primary} />
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>You're Out of Swipes! 💔</Text>
            <Text style={styles.subtitle}>
              You've used all 10 swipes.{'\n'}Wait 12 hours or go Premium for unlimited!
            </Text>

            {/* Live Timer */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>New swipes in</Text>
              <View style={styles.timerRow}>
                <View style={styles.timeBlock}>
                  <LinearGradient
                    colors={['#FF6B9D', '#FF8A80']}
                    style={styles.timeBlockGradient}
                  >
                    <Text style={styles.timeNumber}>{formatNumber(timeLeft.hours)}</Text>
                  </LinearGradient>
                  <Text style={styles.timeUnit}>hours</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeBlock}>
                  <LinearGradient
                    colors={['#FF6B9D', '#FF8A80']}
                    style={styles.timeBlockGradient}
                  >
                    <Text style={styles.timeNumber}>{formatNumber(timeLeft.minutes)}</Text>
                  </LinearGradient>
                  <Text style={styles.timeUnit}>mins</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeBlock}>
                  <LinearGradient
                    colors={['#FF6B9D', '#FF8A80']}
                    style={styles.timeBlockGradient}
                  >
                    <Text style={styles.timeNumber}>{formatNumber(timeLeft.seconds)}</Text>
                  </LinearGradient>
                  <Text style={styles.timeUnit}>secs</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Premium CTA */}
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={onGetPremium}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.accent, '#FFA000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumButtonGradient}
              >
                <Ionicons name="diamond" size={20} color="#fff" />
                <Text style={styles.premiumButtonText}>Get Premium</Text>
                <Text style={styles.premiumSubtext}>Unlimited Swipes!</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Premium benefits */}
            <View style={styles.benefitsRow}>
              <View style={styles.benefit}>
                <Ionicons name="infinite" size={16} color={colors.primary} />
                <Text style={styles.benefitText}>Unlimited</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="star" size={16} color={colors.primary} />
                <Text style={styles.benefitText}>Super Likes</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="eye" size={16} color={colors.primary} />
                <Text style={styles.benefitText}>See Likes</Text>
              </View>
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: screenWidth - 48,
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 0,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeBlockGradient: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  timeUnit: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  premiumButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  premiumSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 4,
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  benefitText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

