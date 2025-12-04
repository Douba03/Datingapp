import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

export default function PhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData } = useOnboarding();
  const { pickAndUploadPhoto, uploading } = usePhotoUpload();
  const [photos, setPhotos] = useState<string[]>([]);

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum Photos', `You can only add up to ${MAX_PHOTOS} photos`);
      return;
    }

    try {
      const { url, error } = await pickAndUploadPhoto();

      if (error) {
        Alert.alert('Upload Error', error.message || 'Failed to upload photo');
        return;
      }

      if (!url) return;

      setPhotos([...photos, url]);
      Alert.alert('Success! 📸', 'Photo uploaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Add More Photos', `Please add at least ${MIN_PHOTOS} photos to continue`);
      return;
    }

    updateData({ photos });
    router.push('/(onboarding)/bio');
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: '28%' }]}
          />
        </View>
        
        <Text style={styles.stepText}>Step 2 of 7</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.emoji}>📸</Text>
            <Text style={styles.title}>Add your best photos</Text>
            <Text style={styles.subtitle}>
              Upload at least {MIN_PHOTOS} photos. Your first photo will be your main picture!
            </Text>
          </View>

          {/* Photo Count Badge */}
          <View style={styles.countBadge}>
            <Ionicons 
              name={photos.length >= MIN_PHOTOS ? "checkmark-circle" : "images"} 
              size={18} 
              color={photos.length >= MIN_PHOTOS ? colors.success : colors.primary} 
            />
            <Text style={[
              styles.countText,
              photos.length >= MIN_PHOTOS && { color: colors.success }
            ]}>
              {photos.length} / {MAX_PHOTOS} photos
              {photos.length < MIN_PHOTOS && ` (${MIN_PHOTOS - photos.length} more needed)`}
            </Text>
          </View>

          {/* Photo Grid */}
          <View style={styles.photoGrid}>
            {[...Array(MAX_PHOTOS)].map((_, index) => {
              const photo = photos[index];
              const isMainPhoto = index === 0;
              
              if (photo) {
                return (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                    {isMainPhoto && (
                  <View style={styles.mainPhotoBadge}>
                        <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.mainPhotoText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                      <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
                );
              }

              return (
              <TouchableOpacity
                  key={index}
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                disabled={uploading}
              >
                  {uploading && index === photos.length ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                      <View style={styles.addIconContainer}>
                        <Ionicons name="add" size={28} color={colors.primary} />
                      </View>
                      {isMainPhoto && (
                        <Text style={styles.addPhotoHint}>Main Photo</Text>
                      )}
                  </>
                )}
              </TouchableOpacity>
              );
            })}
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconContainer}>
                <Ionicons name="bulb" size={20} color="#FFB347" />
              </View>
              <Text style={styles.tipsTitle}>Photo Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <TipItem text="Show your face clearly" />
              <TipItem text="Include photos of your hobbies" />
              <TipItem text="Avoid group photos as main picture" />
              <TipItem text="Natural lighting works best!" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            photos.length < MIN_PHOTOS && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={photos.length < MIN_PHOTOS}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={photos.length >= MIN_PHOTOS 
              ? [colors.primary, colors.primaryDark]
              : ['#D1D5DB', '#9CA3AF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {photos.length >= MIN_PHOTOS ? 'Continue' : `Add ${MIN_PHOTOS - photos.length} more`}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipBullet}>
        <Ionicons name="checkmark" size={12} color={colors.primary} />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
  },
  titleSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  mainPhotoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  mainPhotoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoHint: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tipsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  tipsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 179, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    shadowOpacity: 0.1,
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
});
