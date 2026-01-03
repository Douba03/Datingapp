import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';

interface ProfileEditModalProps {
  visible: boolean;
  profile: any;
  onClose: () => void;
  onSave: (updatedProfile: any) => Promise<void>;
}

export function ProfileEditModal({ visible, profile, onClose, onSave }: ProfileEditModalProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { pickAndUploadPhoto, uploading } = usePhotoUpload();
  const [formData, setFormData] = useState({
    first_name: '',
    bio: '',
    interests: [] as string[],
    photos: [] as string[],
    city: '',
    country: '',
    age_min: 18,
    age_max: 100,
    max_distance_km: 50,
    relationship_intent: 'not_sure',
    seeking_genders: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [showInterestSelector, setShowInterestSelector] = useState(false);

  // Separate text state for age inputs to allow free typing
  const [ageMinText, setAgeMinText] = useState('18');
  const [ageMaxText, setAgeMaxText] = useState('100');

  const interestCategories = [
    {
      category: 'Activities',
      interests: ['Fitness', 'Yoga', 'Running', 'Hiking', 'Cycling', 'Dancing', 'Cooking', 'Gaming', 'Photography', 'Art'],
    },
    {
      category: 'Entertainment',
      interests: ['Movies', 'TV Shows', 'Music', 'Concerts', 'Theater', 'Comedy', 'Podcasts', 'Reading', 'Writing'],
    },
    {
      category: 'Lifestyle',
      interests: ['Travel', 'Food', 'Coffee', 'Wine', 'Fashion', 'Shopping', 'DIY', 'Home Decor', 'Pets', 'Plants'],
    },
    {
      category: 'Professional',
      interests: ['Entrepreneurship', 'Startups', 'Tech', 'Design', 'Marketing', 'Finance', 'Education', 'Science'],
    },
    {
      category: 'Social',
      interests: ['Volunteering', 'Activism', 'Environment', 'Politics', 'Philosophy', 'Spirituality', 'Meditation'],
    },
  ];

  useEffect(() => {
    if (profile) {
      const ageMin = profile.preferences?.age_min || 18;
      const ageMax = profile.preferences?.age_max || 100;
      const seekingGenders = profile.preferences?.seeking_genders || [];
      setFormData({
        first_name: profile.first_name || '',
        bio: profile.bio || '',
        interests: profile.interests || [],
        photos: profile.photos || [],
        city: profile.city || '',
        country: profile.country || '',
        age_min: ageMin,
        age_max: ageMax,
        max_distance_km: profile.preferences?.max_distance_km || 50,
        relationship_intent: profile.preferences?.relationship_intent || 'not_sure',
        seeking_genders: Array.isArray(seekingGenders) ? seekingGenders : [],
      });
      console.log('[ProfileEditModal] Loaded seeking_genders:', seekingGenders);
      setAgeMinText(String(ageMin));
      setAgeMaxText(String(ageMax));
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('[ProfileEditModal] Saving form data:', formData);
      await onSave(formData);
      console.log('[ProfileEditModal] Save successful');
      // Parent handles closing the modal now
    } catch (error) {
      console.error('[ProfileEditModal] Save error:', error);
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to update profile: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      console.log('[ProfileEditModal] Starting photo upload...');
      
      const { url, error } = await pickAndUploadPhoto();

      if (error) {
        console.error('[ProfileEditModal] Photo upload error:', error);
        Alert.alert('Upload Error', error.message || 'Failed to upload photo');
        return;
      }

      if (!url) {
        console.log('[ProfileEditModal] Photo selection canceled');
        return;
      }

      console.log('[ProfileEditModal] Photo uploaded successfully:', url);
      
      setFormData(prev => {
        const newPhotos = [...prev.photos, url];
        console.log('[ProfileEditModal] Updated photos:', newPhotos);
        return {
          ...prev,
          photos: newPhotos,
        };
      });

      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('[ProfileEditModal] Unexpected photo upload error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleRemovePhoto = (index: number) => {
    console.log('[ProfileEditModal] Remove photo clicked, index:', index);
    
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      const confirmed = window.confirm('Are you sure you want to remove this photo?');
      if (confirmed) {
        console.log('[ProfileEditModal] Removing photo at index:', index);
        setFormData(prev => {
          const newPhotos = prev.photos.filter((_, i) => i !== index);
          console.log('[ProfileEditModal] New photos array:', newPhotos);
          return {
            ...prev,
            photos: newPhotos,
          };
        });
      } else {
        console.log('[ProfileEditModal] Photo removal cancelled');
      }
    } else {
      // Use Alert.alert for mobile
      Alert.alert(
        'Remove Photo',
        'Are you sure you want to remove this photo?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              console.log('[ProfileEditModal] Removing photo at index:', index);
              setFormData(prev => ({
                ...prev,
                photos: prev.photos.filter((_, i) => i !== index),
              }));
            },
          },
        ]
      );
    }
  };

  const handleMovePhoto = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= formData.photos.length) return;
    
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      const temp = newPhotos[fromIndex];
      newPhotos[fromIndex] = newPhotos[toIndex];
      newPhotos[toIndex] = temp;
      return {
        ...prev,
        photos: newPhotos,
      };
    });
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      
      console.log('[ProfileEditModal] Interest toggled:', interest, 'New interests:', newInterests);
      
      return {
        ...prev,
        interests: newInterests,
      };
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Photos Section */}
          <View style={styles.section}>
            <View style={styles.photosSectionHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.photoHint}>First photo is your profile picture</Text>
            </View>
            <View style={styles.photosContainer}>
              {formData.photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image 
                    source={{ uri: photo }} 
                    style={styles.photo}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.photoControls}>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.photoControlButton}
                        onPress={() => handleMovePhoto(index, 'left')}
                      >
                        <Ionicons name="chevron-back" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                    {index < formData.photos.length - 1 && (
                      <TouchableOpacity
                        style={styles.photoControlButton}
                        onPress={() => handleMovePhoto(index, 'right')}
                      >
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              {formData.photos.length < 6 && (
                <TouchableOpacity 
                  style={styles.addPhotoButton} 
                  onPress={handlePhotoUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color={colors.primary} />
                      <Text style={styles.addPhotoText}>Add Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.photoDescription}>
              You can add up to 6 photos. Tap and use arrows to reorder them.
            </Text>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{formData.bio.length}/500</Text>
          </View>

          {/* Interests Section */}
          <View style={styles.section}>
            <View style={styles.interestsHeader}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <TouchableOpacity onPress={() => setShowInterestSelector(!showInterestSelector)}>
                <Text style={styles.editInterestsButton}>
                  {showInterestSelector ? 'Done' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            {showInterestSelector ? (
              <View style={styles.interestsSelector}>
                {interestCategories.map((category) => (
                  <View key={category.category} style={styles.categoryContainer}>
                    <Text style={styles.categoryTitle}>{category.category}</Text>
                    <View style={styles.categoryInterests}>
                      {category.interests.map((interest) => (
                        <TouchableOpacity
                          key={interest}
                          style={[
                            styles.interestOption,
                            formData.interests.includes(interest) && styles.selectedInterest,
                          ]}
                          onPress={() => handleInterestToggle(interest)}
                        >
                          <Text
                            style={[
                              styles.interestOptionText,
                              formData.interests.includes(interest) && styles.selectedInterestText,
                            ]}
                          >
                            {interest}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.currentInterests}>
                {formData.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your first name"
                value={formData.first_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                maxLength={50}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., New York"
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                maxLength={100}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., United States"
                value={formData.country}
                onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                maxLength={100}
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dating Preferences</Text>
            
            {/* Gender Interest */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>I'm interested in...</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.seeking_genders.includes('man') && styles.genderOptionSelected,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({
                      ...prev,
                      seeking_genders: prev.seeking_genders.includes('man')
                        ? prev.seeking_genders.filter(g => g !== 'man')
                        : [...prev.seeking_genders, 'man']
                    }));
                  }}
                >
                  <Ionicons 
                    name="male" 
                    size={24} 
                    color={formData.seeking_genders.includes('man') ? '#4A90D9' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.genderOptionText,
                    formData.seeking_genders.includes('man') && { color: '#4A90D9', fontWeight: '700' }
                  ]}>Men</Text>
                  {formData.seeking_genders.includes('man') && (
                    <Ionicons name="checkmark-circle" size={18} color="#4A90D9" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.seeking_genders.includes('woman') && styles.genderOptionSelected,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({
                      ...prev,
                      seeking_genders: prev.seeking_genders.includes('woman')
                        ? prev.seeking_genders.filter(g => g !== 'woman')
                        : [...prev.seeking_genders, 'woman']
                    }));
                  }}
                >
                  <Ionicons 
                    name="female" 
                    size={24} 
                    color={formData.seeking_genders.includes('woman') ? '#FF6B9D' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.genderOptionText,
                    formData.seeking_genders.includes('woman') && { color: '#FF6B9D', fontWeight: '700' }
                  ]}>Women</Text>
                  {formData.seeking_genders.includes('woman') && (
                    <Ionicons name="checkmark-circle" size={18} color="#FF6B9D" />
                  )}
                </TouchableOpacity>
              </View>
              {formData.seeking_genders.length === 0 && (
                <Text style={styles.warningText}>⚠️ Select at least one to see profiles</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age Range: {formData.age_min} - {formData.age_max}</Text>
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Min</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={ageMinText}
                    onChangeText={setAgeMinText}
                    onBlur={() => {
                      const num = parseInt(ageMinText) || 18;
                      const validNum = Math.max(18, Math.min(num, formData.age_max - 1));
                      setFormData(prev => ({ ...prev, age_min: validNum }));
                      setAgeMinText(String(validNum));
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="18"
                  />
                </View>
                <Text style={styles.rangeSeparator}>to</Text>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Max</Text>
                  <TextInput
                    style={styles.rangeInput}
                    value={ageMaxText}
                    onChangeText={setAgeMaxText}
                    onBlur={() => {
                      const num = parseInt(ageMaxText) || 100;
                      const validNum = Math.max(formData.age_min + 1, Math.min(num, 100));
                      setFormData(prev => ({ ...prev, age_max: validNum }));
                      setAgeMaxText(String(validNum));
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    placeholder="100"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Distance: {formData.max_distance_km} km</Text>
              <TextInput
                style={styles.input}
                value={String(formData.max_distance_km)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 50;
                  setFormData(prev => ({ ...prev, max_distance_km: Math.max(1, Math.min(num, 500)) }));
                }}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Looking For</Text>
              <View style={styles.relationshipOptions}>
                {[
                  { value: 'serious_relationship', label: 'Serious Relationship' },
                  { value: 'open_to_long_term', label: 'Open to Long Term' },
                  { value: 'not_sure', label: 'Not Sure Yet' },
                  { value: 'casual', label: 'Casual' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.relationshipOption,
                      formData.relationship_intent === option.value && styles.selectedRelationshipOption,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, relationship_intent: option.value }))}
                  >
                    <Text
                      style={[
                        styles.relationshipOptionText,
                        formData.relationship_intent === option.value && styles.selectedRelationshipOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  photosSectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  photoHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  photoControls: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  photoControlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  interestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editInterestsButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  interestsSelector: {
    marginTop: 12,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  categoryInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedInterest: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  interestOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedInterestText: {
    color: '#fff',
  },
  currentInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  interestText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
    width: '80%',
  },
  rangeSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  relationshipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  relationshipOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedRelationshipOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  relationshipOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  selectedRelationshipOptionText: {
    color: '#fff',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  genderOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  warningText: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 8,
    textAlign: 'center',
  },
});
