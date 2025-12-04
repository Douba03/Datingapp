import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Heart pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/(onboarding)/basic-info');
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        
        {/* Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Animated Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.logoGradient}
            >
              <Animated.View style={{ transform: [{ scale: heartPulse }] }}>
                <Ionicons name="heart" size={56} color="#fff" />
              </Animated.View>
            </LinearGradient>
            
            {/* Decorative circles */}
            <View style={[styles.decorCircle, styles.circle1]} />
            <View style={[styles.decorCircle, styles.circle2]} />
            <View style={[styles.decorCircle, styles.circle3]} />
          </View>

          <Text style={styles.appName}>Mali Match</Text>
          <Text style={styles.tagline}>
            Find your perfect match{'\n'}in Mali and beyond
          </Text>
        </Animated.View>

        {/* Features Section */}
        <Animated.View 
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <FeatureItem
            icon="heart-circle"
            iconColor="#FF6B9D"
            title="Smart Matching"
            description="AI-powered matches based on your interests"
            delay={100}
          />
          <FeatureItem
            icon="sparkles"
            iconColor="#FFB347"
            title="Super Likes"
            description="Stand out with special likes"
            delay={200}
          />
          <FeatureItem
            icon="shield-checkmark"
            iconColor="#4ECDC4"
            title="Safe & Secure"
            description="Verified profiles for your safety"
            delay={300}
          />
        </Animated.View>

        {/* CTA Section */}
        <Animated.View 
          style={[
            styles.ctaSection,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ 
  icon, 
  iconColor, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: string; 
  iconColor: string;
  title: string; 
  description: string;
  delay?: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <Animated.View 
      style={[
        styles.featureItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={28} color={iconColor} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: height * 0.05,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  circle1: {
    width: 20,
    height: 20,
    top: -10,
    right: -15,
  },
  circle2: {
    width: 14,
    height: 14,
    bottom: 10,
    left: -20,
  },
  circle3: {
    width: 10,
    height: 10,
    top: 30,
    right: -25,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  featuresSection: {
    gap: 20,
    paddingVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.1)',
  },
  featureIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ctaSection: {
    paddingBottom: 16,
    gap: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
