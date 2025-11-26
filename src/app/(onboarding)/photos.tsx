import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

export default function PhotosScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const { pickAndUploadPhoto, uploading } = usePhotoUpload();
  const [photos, setPhotos] = useState<string[]>([]);

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Maximum Photos', `You can only add up to ${MAX_PHOTOS} photos`);
      return;
    }

    try {
      console.log('[Photos] Starting photo upload...');
      const { url, error } = await pickAndUploadPhoto();

      if (error) {
        console.error('[Photos] Photo upload error:', error);
        Alert.alert('Upload Error', error.message || 'Failed to upload photo');
        return;
      }

      if (!url) {
        console.log('[Photos] Photo selection canceled');
        return;
      }

      console.log('[Photos] Photo uploaded successfully:', url);
      setPhotos([...photos, url]);
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('[Photos] Unexpected photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };


  const handleContinue = () => {
    if (photos.length < MIN_PHOTOS) {
      Alert.alert(
        'Add More Photos',
        `Please add at least ${MIN_PHOTOS} photos to continue`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Save photos to context
    updateData({ photos });
    console.log('[Photos] Saved photos, navigating to bio...');
    router.push('/(onboarding)/bio');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '28%' }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Add your photos</Text>
            <Text style={styles.subtitle}>
              Upload at least {MIN_PHOTOS} photos. Your first photo will be your main profile picture.
            </Text>
          </View>

          {/* Photo Grid */}
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                {index === 0 && (
                  <View style={styles.mainPhotoBadge}>
                    <Text style={styles.mainPhotoText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={32} color={colors.primary} />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Count */}
          <Text style={styles.photoCount}>
            {photos.length} / {MAX_PHOTOS} photos
            {photos.length < MIN_PHOTOS && ` (${MIN_PHOTOS - photos.length} more required)`}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, uploading && styles.disabledButton]} 
              onPress={handleAddPhoto}
              disabled={uploading}
            >
              <Ionicons name="images" size={24} color={uploading ? colors.textSecondary : colors.primary} />
              <Text style={[styles.actionButtonText, uploading && styles.disabledText]}>
                {uploading ? 'Uploading...' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <Text style={styles.tipsTitle}>Photo Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <TipItem text="Use recent photos that show your face clearly" />
              <TipItem text="Include photos of your hobbies and interests" />
              <TipItem text="Avoid group photos as your main picture" />
              <TipItem text="Natural lighting works best" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title={`Continue ${photos.length >= MIN_PHOTOS ? '' : `(${MIN_PHOTOS - photos.length} more)`}`}
          onPress={handleContinue}
          disabled={photos.length < MIN_PHOTOS}
          style={styles.continueButton}
        />
      </View>

    </SafeAreaView>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipItem}>
      <View style={styles.tipBullet} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
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
    marginBottom: 32,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mainPhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  photoCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  tipsSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    paddingVertical: 16,
  },
});
