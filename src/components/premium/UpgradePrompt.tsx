import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as staticColors } from '../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { PremiumBadge } from './PremiumBadge';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  trigger?: 'swipes' | 'likes' | 'undo' | 'boost' | 'general';
  customMessage?: string;
}

export function UpgradePrompt({
  visible,
  onClose,
  onUpgrade,
  trigger = 'general',
  customMessage,
}: UpgradePromptProps) {
  const { colors } = useTheme();
  
  const getTriggerContent = () => {
    switch (trigger) {
      case 'swipes':
        return {
          title: "Out of Swipes!",
          description: "You've used all your daily swipes. Get unlimited swipes with Premium!",
          benefits: [
            "Unlimited swipes forever",
            "No more waiting 12 hours",
            "Swipe as much as you want",
          ],
        };
      case 'likes':
        return {
          title: "Who Liked You?",
          description: "See everyone who's interested in you! Premium unlocks instant access.",
          benefits: [
            "See all your admirers",
            "Never miss a match",
            "Start conversations first",
          ],
        };
      case 'undo':
        return {
          title: "Undo That Swipe",
          description: "Accidentally passed? Rewind your last swipe with Premium!",
          benefits: [
            "Undo accidental passes",
            "Fix mistakes instantly",
            "Never lose a good match",
          ],
        };
      case 'boost':
        return {
          title: "Get More Matches",
          description: "Boost your profile and get 2x more visibility! Premium exclusive.",
          benefits: [
            "Be seen 2x more often",
            "Get more quality matches",
            "Stand out from the crowd",
          ],
        };
      default:
        return {
          title: "Unlock Premium",
          description: "Upgrade to Premium for the ultimate dating experience!",
          benefits: [
            "Unlimited swipes",
            "See who liked you",
            "Undo swipes",
            "Profile boost",
          ],
        };
    }
  };

  const content = customMessage 
    ? { title: "Unlock Premium", description: customMessage, benefits: [] }
    : getTriggerContent();

  // Heartbeat Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      const heartbeat = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(1000), // Pause between beats
        ])
      );
      heartbeat.start();

      return () => heartbeat.stop();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Premium Icon with Heartbeat Animation */}
          <View style={styles.iconContainer}>
            <View style={styles.heartContainer}>
              {/* Empty Heart Outline */}
              <Ionicons name="heart-outline" size={80} color={colors.primary} style={styles.heartOutline} />
              
              {/* Filled Heart Layer (Animated) */}
              <Animated.View 
                style={[
                  styles.heartFill, 
                  { 
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim
                  }
                ]}
              >
                <Ionicons name="heart" size={80} color={colors.primary} />
              </Animated.View>
            </View>
            
            <View style={styles.badgeContainer}>
              <PremiumBadge size="large" variant="gold" />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>{content.description}</Text>

          {/* Benefits List */}
          {content.benefits.length > 0 && (
            <ScrollView style={styles.benefitsContainer}>
              {content.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={colors.success} 
                  />
                  <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Price */}
          <View style={[styles.priceContainer, { borderColor: colors.border }]}>
            <Text style={[styles.priceAmount, { color: colors.primary }]}>$1.99</Text>
            <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>per month</Text>
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={onUpgrade}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.6}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustContainer}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={16} color={colors.textSecondary} />
              <Text style={[styles.trustText, { color: colors.textSecondary }]}>Cancel anytime</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 24,
    width: Math.min(width - 40, 400),
    maxHeight: '85%',
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    position: 'relative',
    height: 100,
    justifyContent: 'center',
  },
  heartContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heartOutline: {
    zIndex: 2,
  },
  heartFill: {
    position: 'absolute',
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -12,
    zIndex: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    maxHeight: 150,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '800',
  },
  pricePeriod: {
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: staticColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  trustContainer: {
    alignItems: 'center',
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
  },
});
