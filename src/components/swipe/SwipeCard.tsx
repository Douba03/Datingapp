import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../../types/user';
import { useTheme } from '../../contexts/ThemeContext';
import { colors as staticColors } from '../theme/colors';
import { calculateDistance, formatDistance } from '../../utils/location';
import { useAuth } from '../../hooks/useAuth';

// Blurhash placeholder for loading state - must use blurhash:// prefix
const PLACEHOLDER_BLURHASH = { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' };

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
  onPress: () => void;
  enterFrom?: 'left' | 'right' | 'top' | 'bottom';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SwipeCard({ profile, onSwipe, onPress, enterFrom }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const { profile: currentUserProfile } = useAuth();
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current; // Controls overlay visibility
  const isAnimatingOut = useRef(false);
  
  // Entry animation based on where the card should come from
  useEffect(() => {
    // Hide overlays during entry animation
    overlayOpacity.setValue(0);
    
    // Reset position for entry animation
    const startX = enterFrom === 'left' ? -screenWidth : enterFrom === 'right' ? screenWidth : 0;
    const startY = enterFrom === 'top' ? -screenHeight : enterFrom === 'bottom' ? screenHeight : 0;
    
    translateX.setValue(startX);
    translateY.setValue(startY);
    cardOpacity.setValue(1);
    
    // Animate to center
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start(() => {
      // Enable overlays after entry animation completes
      overlayOpacity.setValue(1);
    });
  }, [profile.user_id]);
  
  const rotate = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  
  // Thresholds for detection - increased for less sensitivity
  const SWIPE_THRESHOLD_X = screenWidth * 0.25; // 25% of screen width
  const SWIPE_THRESHOLD_Y = screenHeight * 0.15; // 15% of screen height for superlike
  const VELOCITY_THRESHOLD = 800;
  
  // Overlay opacity for like/pass/superlike indicators
  // Only show one indicator at a time based on dominant direction
  // Multiply by overlayOpacity to hide during entry animation
  const likeOpacity = Animated.multiply(
    overlayOpacity,
    Animated.multiply(
      translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD_X * 0.6],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      // Fade out if moving up significantly
      translateY.interpolate({
        inputRange: [-SWIPE_THRESHOLD_Y * 0.5, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
    )
  );
  
  const passOpacity = Animated.multiply(
    overlayOpacity,
    Animated.multiply(
      translateX.interpolate({
        inputRange: [-SWIPE_THRESHOLD_X * 0.6, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
      // Fade out if moving up significantly
      translateY.interpolate({
        inputRange: [-SWIPE_THRESHOLD_Y * 0.5, 0],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
    )
  );
  
  const superlikeOpacity = Animated.multiply(
    overlayOpacity,
    translateY.interpolate({
      inputRange: [-SWIPE_THRESHOLD_Y * 0.8, -SWIPE_THRESHOLD_Y * 0.3],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    })
  );

  // Calculate distance if both users have location data
  const getDistanceText = () => {
    if (!currentUserProfile?.location || !profile.location) {
      return profile.city ? `📍 ${profile.city}` : '📍 Location unknown';
    }
    
    const distance = calculateDistance(currentUserProfile.location, profile.location);
    const cityText = profile.city ? ` • ${profile.city}` : '';
    return `📍 ${formatDistance(distance)}${cityText}`;
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const animateCardOut = (direction: 'like' | 'pass' | 'superlike') => {
    if (isAnimatingOut.current) return;
    isAnimatingOut.current = true;
    
    let toX = 0;
    let toY = 0;
    
    if (direction === 'like') {
      toX = screenWidth * 1.5;
    } else if (direction === 'pass') {
      toX = -screenWidth * 1.5;
    } else if (direction === 'superlike') {
      toY = -screenHeight;
    }
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: toX,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: toY,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimatingOut.current = false;
      onSwipe(direction);
    });
  };

  const handleGestureEnd = (event: any) => {
    if (event.nativeEvent.state !== State.END) return;
    
    const { translationX: tx, translationY: ty, velocityX, velocityY } = event.nativeEvent;
    
    // Determine dominant direction - prioritize the axis with more movement
    const absX = Math.abs(tx);
    const absY = Math.abs(ty);
    
    // Check for superlike first (swipe up) - only if Y is dominant and negative
    if (ty < -SWIPE_THRESHOLD_Y && absY > absX * 1.5) {
      // Superlike - swiped up with Y being dominant
      animateCardOut('superlike');
      return;
    }
    
    // Check for horizontal swipes - only if X is dominant
    if (absX > SWIPE_THRESHOLD_X || Math.abs(velocityX) > VELOCITY_THRESHOLD) {
      if (absX > absY * 0.8) { // X must be reasonably dominant
        const direction = tx > 0 ? 'like' : 'pass';
        animateCardOut(direction);
        return;
      }
    }
    
    // Snap back to center if no valid swipe detected
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
    ]).start();
  };

  const nextPhoto = () => {
    if (currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleGestureEnd}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            transform: [
              { translateX },
              { translateY },
              { rotate },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={onPress} style={styles.cardContent} activeOpacity={0.98}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: profile.photos[currentPhotoIndex] }}
              style={styles.image}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLURHASH}
              placeholderContentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {/* Loading indicator overlay */}
            {imageLoading && (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            
            {/* LIKE overlay indicator */}
            <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, { opacity: likeOpacity }]}>
              <View style={styles.overlayBadge}>
                <Ionicons name="heart" size={40} color="#fff" />
                <Text style={styles.overlayText}>LIKE</Text>
              </View>
            </Animated.View>
            
            {/* PASS overlay indicator */}
            <Animated.View style={[styles.swipeOverlay, styles.passOverlay, { opacity: passOpacity }]}>
              <View style={styles.overlayBadge}>
                <Ionicons name="close" size={40} color="#fff" />
                <Text style={styles.overlayText}>NOPE</Text>
              </View>
            </Animated.View>
            
            {/* SUPERLIKE overlay indicator */}
            <Animated.View style={[styles.swipeOverlay, styles.superlikeOverlay, { opacity: superlikeOpacity }]}>
              <View style={[styles.overlayBadge, styles.superlikeBadge]}>
                <Ionicons name="star" size={40} color="#fff" />
                <Text style={styles.overlayText}>SUPER</Text>
              </View>
            </Animated.View>
            
            {/* Photo indicators - pill style */}
            {profile.photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {profile.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentPhotoIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Photo navigation - invisible touch areas */}
            {profile.photos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navArea, styles.prevArea]}
                  onPress={prevPhoto}
                />
                <TouchableOpacity
                  style={[styles.navArea, styles.nextArea]}
                  onPress={nextPhoto}
                />
              </>
            )}
            
            {/* Bottom gradient overlay for text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.bottomGradient}
            />
            
            {/* Profile info overlay on image */}
            <View style={styles.imageInfoOverlay}>
              <View style={styles.nameAgeContainer}>
                <Text style={styles.name}>{profile.first_name}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.superlike} />
                </View>
                <Text style={styles.age}>{profile.age}</Text>
              </View>
              
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.locationText}>{getDistanceText().replace('📍 ', '')}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
            {profile.bio && (
              <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={3}>
                {profile.bio}
              </Text>
            )}

            {/* Interests Tags - positioned at bottom */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 6).map((interest, index) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: getTagColor(index) }]}>
                    <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
                  </View>
                ))}
                {profile.interests.length > 6 && (
                  <View style={[styles.interestTag, styles.moreTag]}>
                    <Text style={[styles.interestText, { color: colors.text }]}>+{profile.interests.length - 6}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

// Helper function for colorful interest tags
function getTagColor(index: number): string {
  const tagColors = [
    'rgba(255, 107, 157, 0.15)', // pink
    'rgba(0, 188, 212, 0.15)',   // cyan
    'rgba(255, 215, 0, 0.15)',   // gold
    'rgba(156, 39, 176, 0.15)',  // purple
    'rgba(255, 138, 101, 0.15)', // coral
  ];
  return tagColors[index % tagColors.length];
}

const styles = StyleSheet.create({
  card: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.62,
    backgroundColor: staticColors.surface,
    borderRadius: 24,
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeOverlay: {
    backgroundColor: 'rgba(255, 64, 129, 0.3)',
  },
  passOverlay: {
    backgroundColor: 'rgba(120, 120, 120, 0.3)',
  },
  superlikeOverlay: {
    backgroundColor: 'rgba(0, 150, 255, 0.3)',
  },
  superlikeBadge: {
    borderColor: '#00BFFF',
  },
  overlayBadge: {
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    transform: [{ rotate: '-15deg' }],
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  photoIndicators: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  navArea: {
    position: 'absolute',
    top: 0,
    bottom: 100,
    width: '40%',
  },
  prevArea: {
    left: 0,
  },
  nextArea: {
    right: 0,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  imageInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginRight: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    marginRight: 8,
  },
  age: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  infoContainer: {
    flex: 0.25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    paddingBottom: 6,
    backgroundColor: staticColors.surface,
    justifyContent: 'space-between',
  },
  bio: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
    flex: 1,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 'auto',
  },
  interestTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  moreTag: {
    backgroundColor: 'rgba(139, 123, 142, 0.1)',
    borderColor: 'rgba(139, 123, 142, 0.3)',
  },
  interestText: {
    fontSize: 10,
    color: staticColors.text,
    fontWeight: '600',
  },
});