import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface MatchModalProps {
  visible: boolean;
  matchedUser: { name: string; photo?: string } | null;
  isSuperLike?: boolean;
  onContinue: () => void;
  onMessage: () => void;
}

const { width, height } = Dimensions.get('window');

export function MatchModal({ visible, matchedUser, isSuperLike, onContinue, onMessage }: MatchModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const heartAnim1 = useRef(new Animated.Value(0)).current;
  const heartAnim2 = useRef(new Animated.Value(0)).current;
  const heartAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      heartAnim1.setValue(0);
      heartAnim2.setValue(0);
      heartAnim3.setValue(0);

      // Main content animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Floating hearts animations
      const animateHeart = (anim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animateHeart(heartAnim1, 0);
      animateHeart(heartAnim2, 700);
      animateHeart(heartAnim3, 1400);
    }
  }, [visible]);

  const getHeartStyle = (anim: Animated.Value, startX: number) => ({
    opacity: anim.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 1, 1, 0],
    }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -150],
        }),
      },
      {
        translateX: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [startX, startX + 20, startX - 10],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.2, 0.8],
        }),
      },
    ],
  });

  if (!matchedUser) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={isSuperLike 
            ? ['rgba(59, 130, 246, 0.95)', 'rgba(99, 102, 241, 0.95)'] 
            : ['rgba(236, 72, 153, 0.95)', 'rgba(168, 85, 247, 0.95)']}
          style={styles.gradient}
        >
          {/* Floating Hearts */}
          <View style={styles.heartsContainer}>
            <Animated.Text style={[styles.floatingHeart, getHeartStyle(heartAnim1, -40)]}>
              💕
            </Animated.Text>
            <Animated.Text style={[styles.floatingHeart, getHeartStyle(heartAnim2, 40)]}>
              ❤️
            </Animated.Text>
            <Animated.Text style={[styles.floatingHeart, getHeartStyle(heartAnim3, 0)]}>
              💖
            </Animated.Text>
          </View>

          <Animated.View style={[
            styles.content,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            {/* Header */}
            <Text style={styles.title}>
              {isSuperLike ? '⭐ Super Match! ⭐' : "It's a Match! 💕"}
            </Text>
            <Text style={styles.subtitle}>
              You and {matchedUser.name} liked each other!
            </Text>

            {/* Photo */}
            <View style={styles.photoContainer}>
              {matchedUser.photo ? (
                <Image source={{ uri: matchedUser.photo }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={60} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <View style={styles.heartBadge}>
                <Text style={styles.heartBadgeText}>❤️</Text>
              </View>
            </View>

            {/* Celebration Emojis */}
            <View style={styles.celebrationRow}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.celebrationEmoji}>💖</Text>
              <Text style={styles.celebrationEmoji}>✨</Text>
              <Text style={styles.celebrationEmoji}>💕</Text>
              <Text style={styles.celebrationEmoji}>🎊</Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.messageButton}
              onPress={onMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={20} color={colors.primary} />
              <Text style={styles.messageButtonText}>Send a Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Keep Swiping</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heartsContainer: {
    position: 'absolute',
    bottom: '30%',
    width: '100%',
    alignItems: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#fff',
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  heartBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heartBadgeText: {
    fontSize: 24,
  },
  celebrationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  celebrationEmoji: {
    fontSize: 28,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
