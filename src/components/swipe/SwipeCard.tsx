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
import { PanGestureHandler } from 'react-native-gesture-handler';
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

export function SwipeCard({ profile, onSwipe, onPress }: SwipeCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const { profile: currentUserProfile } = useAuth();
  const translateX = new Animated.Value(0);
  const translateY = new Animated.Value(0);
  const rotate = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
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
        <TouchableOpacity onPress={onPress} style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: profile.photos[currentPhotoIndex] }}
              style={styles.image}
              resizeMode="cover"
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

            {/* Photo navigation */}
            {profile.photos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.prevButton]}
                  onPress={prevPhoto}
                >
                  <Text style={styles.navButtonText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={nextPhoto}
                >
                  <Text style={styles.navButtonText}>›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.nameAgeContainer}>
              <Text style={styles.name}>{profile.first_name}</Text>
              <Text style={styles.age}>{profile.age}</Text>
            </View>
            
            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            {/* Interests Tags */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 4).map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {profile.interests.length > 4 && (
                  <View style={styles.interestTag}>
                    <Text style={styles.interestText}>+{profile.interests.length - 4}</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.location}>
              {getDistanceText()}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  card: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 0.7,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  photoIndicators: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 0.3,
    padding: 20,
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  age: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  interestTag: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  interestText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});