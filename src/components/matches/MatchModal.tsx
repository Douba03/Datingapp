import React, { useEffect, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../theme/colors';

interface MatchModalProps {
  visible: boolean;
  matchedUserName: string;
  matchedUserPhoto?: string;
  onContinue: () => void;
  onSendMessage?: () => void;
  isSuperLike?: boolean;
}

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

export function MatchModal({ 
  visible, 
  matchedUserName, 
  matchedUserPhoto,
  onContinue,
  onSendMessage,
  isSuperLike = false
}: MatchModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      
      // Modal entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Only the main heart pulses - subtle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartAnim, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(heartAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          {/* Top gradient */}
          <LinearGradient
            colors={isSuperLike ? [colors.superlike, colors.primary] : [colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBorder}
          />
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main animated icon - only this one pulses */}
            <View style={styles.iconContainer}>
              <Animated.View style={[styles.iconCircle, { transform: [{ scale: heartAnim }] }]}>
                <LinearGradient
                  colors={isSuperLike ? [colors.superlike, '#B88AE8'] : [colors.primary, colors.primaryLight]}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconEmoji}>{isSuperLike ? '⭐' : '💕'}</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={styles.title}>It's a Match! 🎉</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              {isSuperLike ? (
                <><Text style={styles.matchName}>{matchedUserName}</Text> Super Liked You!</>
              ) : (
                <>You and <Text style={styles.matchName}>{matchedUserName}</Text> liked each other!</>
              )}
            </Text>

            {/* Static emoji row - no animation */}
            <View style={styles.emojiRow}>
              <Text style={styles.emoji}>💕</Text>
              <Text style={styles.emoji}>🥰</Text>
              <Text style={styles.emoji}>💘</Text>
              <Text style={styles.emoji}>😍</Text>
              <Text style={styles.emoji}>💝</Text>
            </View>

            {/* Photo */}
            {matchedUserPhoto && (
              <View style={styles.photoContainer}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.photoBorder}>
                  <Image source={{ uri: matchedUserPhoto }} style={styles.photo} resizeMode="cover" />
                </LinearGradient>
                <View style={styles.photoHeartBadge}>
                  <Text style={styles.heartBadgeEmoji}>💕</Text>
                </View>
              </View>
            )}

            {/* Tips - static emojis */}
            <View style={styles.tipsCard}>
              <View style={styles.tipRow}>
                <Text style={styles.tipEmoji}>💬</Text>
                <Text style={styles.tipText}>Start a conversation!</Text>
              </View>
              <View style={styles.tipRow}>
                <Text style={styles.tipEmoji}>✨</Text>
                <Text style={styles.tipText}>Be genuine and friendly</Text>
              </View>
              <View style={styles.tipRow}>
                <Text style={styles.tipEmoji}>🎯</Text>
                <Text style={styles.tipText}>Check your Messages tab</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {onSendMessage && (
                <TouchableOpacity style={styles.primaryButton} onPress={onSendMessage} activeOpacity={0.85}>
                  <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.buttonGradient}>
                    <Text style={styles.primaryButtonText}>💬 Send Message</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.secondaryButton} onPress={onContinue} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>
                  {onSendMessage ? 'Keep Swiping →' : '✓ Continue'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom text */}
            <Text style={styles.celebrationText}>🎊 Congratulations! 🎊</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 37, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    ...shadows.large,
  },
  topBorder: {
    height: 5,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  iconCircle: {
    width: isSmallDevice ? 80 : 90,
    height: isSmallDevice ? 80 : 90,
    borderRadius: isSmallDevice ? 40 : 45,
    overflow: 'hidden',
    ...shadows.glow,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: isSmallDevice ? 38 : 44,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  matchName: {
    fontWeight: '700',
    color: colors.primary,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 20,
  },
  photoContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  photoBorder: {
    width: isSmallDevice ? 100 : 110,
    height: isSmallDevice ? 100 : 110,
    borderRadius: isSmallDevice ? 50 : 55,
    padding: 3,
    ...shadows.glow,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
    backgroundColor: colors.border,
  },
  photoHeartBadge: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  heartBadgeEmoji: {
    fontSize: 18,
  },
  tipsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  tipEmoji: {
    fontSize: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.glow,
  },
  buttonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  celebrationText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 14,
    fontStyle: 'italic',
  },
});
