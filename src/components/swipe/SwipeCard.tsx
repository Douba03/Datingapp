import React, { useState } from 'react';
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
import { colors } from '../theme/colors';
import { calculateDistance, formatDistance } from '../../utils/location';
import { useAuth } from '../../hooks/useAuth';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (action: 'like' | 'pass' | 'superlike') => void;
  onPress: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenHeight < 700;
const CARD_HEIGHT = isSmallDevice ? screenHeight * 0.55 : screenHeight * 0.62;

export function SwipeCard({ profile, onSwipe, onPress }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { profile: currentUserProfile } = useAuth();
  const translateX = new Animated.Value(0);
  const translateY = new Animated.Value(0);
  const rotate = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  // Swipe indicators
  const likeOpacity = translateX.interpolate({
    inputRange: [0, screenWidth / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = translateX.interpolate({
    inputRange: [-screenWidth / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const getDistanceText = () => {
    if (!currentUserProfile?.location || !profile.location) {
      return profile.city ? `${profile.city}` : 'Location unknown';
    }
    
    const distance = calculateDistance(currentUserProfile.location, profile.location);
    const cityText = profile.city ? ` • ${profile.city}` : '';
    return `${formatDistance(distance)}${cityText}`;
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === 5) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
      
      if (translationY < -120 || velocityY < -800) {
        Animated.timing(translateY, {
          toValue: -screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onSwipe('superlike');
        });
      } else if (translationX > 120 || velocityX > 800) {
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipe('like');
        });
      } else if (translationX < -120 || velocityX < -800) {
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipe('pass');
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start();
        Animated.spring(translateY, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const photos = profile.photos?.filter(Boolean) || [];
  const currentPhoto = photos[currentPhotoIndex] || 'https://via.placeholder.com/400x600?text=No+Photo';

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const age = profile.birth_date
    ? Math.floor((new Date().getTime() - new Date(profile.birth_date).getTime()) / 31557600000)
    : null;

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
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
        <TouchableOpacity 
          activeOpacity={0.95} 
          onPress={onPress}
          style={styles.cardTouchable}
        >
          <Image source={{ uri: currentPhoto }} style={styles.image} />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            locations={[0.4, 0.65, 1]}
            style={styles.gradient}
          />

          {/* Photo Indicators */}
          {photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === currentPhotoIndex && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Photo Navigation Buttons */}
          {photos.length > 1 && (
            <>
              {currentPhotoIndex > 0 && (
                <TouchableOpacity
                  style={[styles.photoNavButton, styles.photoNavLeft]}
                  onPress={prevPhoto}
                  activeOpacity={0.7}
                >
                  <View style={styles.navButtonBg}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
              {currentPhotoIndex < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.photoNavButton, styles.photoNavRight]}
                  onPress={nextPhoto}
                  activeOpacity={0.7}
                >
                  <View style={styles.navButtonBg}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Swipe Indicators */}
          <Animated.View style={[styles.swipeIndicator, styles.likeIndicator, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeIndicator, styles.nopeIndicator, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile.first_name}{age ? `, ${age}` : ''}
              </Text>
              {profile.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                </View>
              )}
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.85)" />
              <Text style={styles.location}>{getDistanceText()}</Text>
            </View>

            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {profile.interests.length > 3 && (
                  <View style={styles.interestTag}>
                    <Text style={styles.interestText}>+{profile.interests.length - 3}</Text>
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
    width: screenWidth - 24,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  photoIndicators: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  photoIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: '#fff',
  },
  photoNavButton: {
    position: 'absolute',
    top: '35%',
    bottom: '35%',
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavLeft: {
    left: 0,
    paddingLeft: 12,
  },
  photoNavRight: {
    right: 0,
    paddingRight: 12,
  },
  navButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeIndicator: {
    right: 24,
    borderColor: '#22C55E',
    transform: [{ rotate: '15deg' }],
  },
  nopeIndicator: {
    left: 24,
    borderColor: '#EF4444',
    transform: [{ rotate: '-15deg' }],
  },
  likeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 2,
  },
  nopeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 2,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  bio: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  interestText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
