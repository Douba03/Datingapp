import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../../types/user';
import { useTheme } from '../../contexts/ThemeContext';
import { colors as staticColors } from '../theme/colors';
import { calculateDistance, formatDistance } from '../../utils/location';
import { useAuth } from '../../hooks/useAuth';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
  onPress: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SwipeCard({ profile, onSwipe, onPress }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { profile: currentUserProfile } = useAuth();
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  
  // Overlay opacity for like/pass indicators
  const likeOpacity = translateX.interpolate({
    inputRange: [0, screenWidth * 0.15],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = translateX.interpolate({
    inputRange: [-screenWidth * 0.15, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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

  const handleGestureEnd = (event: any) => {
    const { translationX, translationY, velocityX } = event.nativeEvent;
    
    if (Math.abs(translationX) > screenWidth * 0.3 || Math.abs(velocityX) > 500) {
      const direction = translationX > 0 ? 'like' : 'pass';
      onSwipe(direction);
    } else {
      // Snap back to center
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
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
              resizeMode="cover"
            />
            
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

          <View style={styles.infoContainer}>
            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            {/* Interests Tags with gradient backgrounds */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 5).map((interest, index) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: getTagColor(index) }]}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {profile.interests.length > 5 && (
                  <View style={[styles.interestTag, styles.moreTag]}>
                    <Text style={styles.interestText}>+{profile.interests.length - 5}</Text>
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
    width: screenWidth * 0.92,
    height: screenHeight * 0.68,
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
    flex: 0.78,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    flex: 0.22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: staticColors.surface,
  },
  bio: {
    fontSize: 15,
    color: staticColors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  moreTag: {
    backgroundColor: 'rgba(139, 123, 142, 0.1)',
    borderColor: 'rgba(139, 123, 142, 0.3)',
  },
  interestText: {
    fontSize: 13,
    color: staticColors.text,
    fontWeight: '600',
  },
});