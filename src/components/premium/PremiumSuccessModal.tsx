import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface PremiumSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

// Confetti particle component
const Confetti = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const colors = ['#FF6B9D', '#FFD700', '#FF69B4', '#00CED1', '#9370DB', '#FF4500', '#32CD32'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 10 + 8;
  
  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 200;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: randomX,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          borderRadius: size / 4,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
          opacity,
        },
      ]}
    />
  );
};

export function PremiumSuccessModal({ visible, onClose }: PremiumSuccessModalProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      starScale.setValue(0);
      glowAnim.setValue(0);
      
      // Start animations
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(starScale, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(glowAnim, {
                toValue: 0.5,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
      ]).start();
    }
  }, [visible]);

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    startX: Math.random() * width,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Main Card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Star with Glow Container */}
          <View style={styles.starWrapper}>
            {/* Glow effect behind star */}
            <Animated.View
              style={[
                styles.glowContainer,
                {
                  opacity: glowAnim,
                },
              ]}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF6B9D']}
                style={styles.glow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            
            {/* Star Icon */}
            <Animated.View
              style={[
                styles.starContainer,
                {
                  transform: [{ scale: starScale }],
                },
              ]}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.starGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={50} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>
          
          {/* Text */}
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Premium!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            You've unlocked all the exclusive features
          </Text>
          
          {/* Features unlocked */}
          <View style={styles.featuresContainer}>
            {[
              { icon: 'infinite', text: 'Unlimited swipes' },
              { icon: 'heart', text: 'See who likes you' },
              { icon: 'arrow-undo', text: 'Undo swipes' },
              { icon: 'rocket', text: 'Profile boosts' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons name={feature.icon as any} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
              </View>
            ))}
          </View>
          
          {/* CTA Button */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FF6B9D', '#FF8E53']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Start Exploring</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Confetti - rendered AFTER card so it appears on top */}
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiParticles.map((particle) => (
            <Confetti key={particle.id} delay={particle.delay} startX={particle.startX} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  confetti: {
    position: 'absolute',
    top: -50,
  },
  card: {
    width: width * 0.85,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  starWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  glowContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  starContainer: {
    position: 'absolute',
  },
  starGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
    width: width * 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
