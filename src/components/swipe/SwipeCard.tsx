import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Profile } from '../../types/user';
import { colors, shadows } from '../theme/colors';
import { calculateDistance, formatDistance } from '../../utils/location';
import { useAuth } from '../../hooks/useAuth';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
  onPress: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive sizing
const isSmallDevice = screenWidth < 375;
const cardWidth = Math.min(screenWidth * 0.92, 400);
const cardHeight = Math.min(screenHeight * 0.65, 550);

export function SwipeCard({ profile, onSwipe, onPress }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { profile: currentUserProfile } = useAuth();
  
  // Animated values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const passOpacity = useRef(new Animated.Value(0)).current;
  const superlikeOpacity = useRef(new Animated.Value(0)).current;
  
  const rotate = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  // Swipe indicator animations
  useEffect(() => {
    const likeListener = translateX.addListener(({ value }) => {
      if (value > 0) {
        likeOpacity.setValue(Math.min(value / 80, 1));
        passOpacity.setValue(0);
      } else {
        passOpacity.setValue(Math.min(Math.abs(value) / 80, 1));
        likeOpacity.setValue(0);
      }
    });

    const superlikeListener = translateY.addListener(({ value }) => {
      if (value < -15) {
        superlikeOpacity.setValue(Math.min(Math.abs(value) / 60, 1));
      } else {
        superlikeOpacity.setValue(0);
      }
    });

    return () => {
      translateX.removeListener(likeListener);
      translateY.removeListener(superlikeListener);
    };
  }, []);

  // Reset position when profile changes
  useEffect(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    cardScale.setValue(1);
    likeOpacity.setValue(0);
    passOpacity.setValue(0);
    superlikeOpacity.setValue(0);
    setCurrentPhotoIndex(0);
  }, [profile.user_id]);

  // Calculate distance
  const getDistanceText = () => {
    if (!currentUserProfile?.location || !profile.location) {
      return profile.city || 'Nearby';
    }
    const distance = calculateDistance(currentUserProfile.location, profile.location);
    return `${formatDistance(distance)}${profile.city ? ` · ${profile.city}` : ''}`;
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleGestureEnd = (event: any) => {
    const { translationX: tX, translationY: tY, velocityX, velocityY } = event.nativeEvent;
    
    const isVertical = Math.abs(tY) > Math.abs(tX);
    const threshold = screenWidth * 0.25;
    const velocityThreshold = 350;

    if (isVertical && tY < -50) {
      if (Math.abs(tY) > threshold || Math.abs(velocityY) > velocityThreshold) {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -screenHeight,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.85,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => onSwipe('superlike'));
        return;
      }
    } else if (!isVertical) {
      if (Math.abs(tX) > threshold || Math.abs(velocityX) > velocityThreshold) {
        const direction = tX > 0 ? 'like' : 'pass';
        const targetX = tX > 0 ? screenWidth * 1.5 : -screenWidth * 1.5;

        Animated.parallel([
          Animated.timing(translateX, {
            toValue: targetX,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: tY + 20,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.9,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => onSwipe(direction));
        return;
      }
    }

    // Snap back
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, friction: 6, tension: 100, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, tension: 100, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
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
            width: cardWidth,
            height: cardHeight,
            transform: [
              { translateX },
              { translateY },
              { rotate },
              { scale: cardScale },
            ],
          },
        ]}
      >
        {/* LIKE Badge */}
        <Animated.View style={[styles.swipeBadge, styles.likeBadge, { opacity: likeOpacity }]}>
          <Text style={styles.likeBadgeText}>LIKE 💖</Text>
        </Animated.View>

        {/* PASS Badge */}
        <Animated.View style={[styles.swipeBadge, styles.passBadge, { opacity: passOpacity }]}>
          <Text style={styles.passBadgeText}>NOPE 👋</Text>
        </Animated.View>

        {/* SUPERLIKE Badge */}
        <Animated.View style={[styles.swipeBadge, styles.superlikeBadge, { opacity: superlikeOpacity }]}>
          <Text style={styles.superlikeBadgeText}>SUPER ⭐</Text>
        </Animated.View>

        <TouchableOpacity onPress={onPress} style={styles.cardContent} activeOpacity={0.98}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: profile.photos[currentPhotoIndex] }}
              style={styles.image}
              resizeMode="cover"
            />
            
            {/* Gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.imageGradient}
            />
            
            {/* Photo indicators */}
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

            {/* Photo navigation - visible buttons */}
            {profile.photos.length > 1 && (
              <>
                {currentPhotoIndex > 0 && (
                  <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={prevPhoto} activeOpacity={0.7}>
                    <View style={styles.navButtonInner}>
                      <Ionicons name="chevron-back" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )}
                {currentPhotoIndex < profile.photos.length - 1 && (
                  <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextPhoto} activeOpacity={0.7}>
                    <View style={styles.navButtonInner}>
                      <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Info on image */}
            <View style={styles.imageInfo}>
              <View style={styles.nameAgeRow}>
                <Text style={styles.name} numberOfLines={1}>{profile.first_name}</Text>
                <Text style={styles.age}>{profile.age}</Text>
                {profile.is_verified && (
                  <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                )}
              </View>
              
              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.locationText} numberOfLines={1}>{getDistanceText()}</Text>
              </View>
            </View>
          </View>

          {/* Bottom info */}
          <View style={styles.infoContainer}>
            {profile.bio ? (
              <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
            ) : null}

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText} numberOfLines={1}>{interest}</Text>
                  </View>
                ))}
                {profile.interests.length > 3 && (
                  <View style={styles.moreTag}>
                    <Text style={styles.moreTagText}>+{profile.interests.length - 3}</Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    ...shadows.large,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 0.75,
    position: 'relative',
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  photoIndicators: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    maxWidth: 50,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  navButton: {
    position: 'absolute',
    top: '35%',
    height: 50,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 8,
  },
  nextButton: {
    right: 8,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: '60%',
  },
  age: {
    fontSize: isSmallDevice ? 22 : 24,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    flex: 1,
  },
  infoContainer: {
    flex: 0.25,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestTag: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    maxWidth: 100,
  },
  moreTag: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  interestText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  moreTagText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Swipe badges - compact for mobile
  swipeBadge: {
    position: 'absolute',
    top: 50,
    zIndex: 1000,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  likeBadge: {
    left: 16,
    backgroundColor: 'rgba(255, 107, 138, 0.2)',
    borderColor: colors.like,
    transform: [{ rotate: '-12deg' }],
  },
  passBadge: {
    right: 16,
    backgroundColor: 'rgba(168, 163, 179, 0.2)',
    borderColor: colors.pass,
    transform: [{ rotate: '12deg' }],
  },
  superlikeBadge: {
    alignSelf: 'center',
    left: '50%',
    marginLeft: -50,
    backgroundColor: 'rgba(155, 93, 229, 0.2)',
    borderColor: colors.superlike,
  },
  likeBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.like,
    letterSpacing: 1,
  },
  passBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.pass,
    letterSpacing: 1,
  },
  superlikeBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.superlike,
    letterSpacing: 1,
  },
});
