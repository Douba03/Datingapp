import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function PreferencesScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [seekingGenders, setSeekingGenders] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState({ min: data.ageMin || 22, max: data.ageMax || 35 });
  const [maxDistance, setMaxDistance] = useState(data.maxDistance || 50);
  const [relationshipIntent, setRelationshipIntent] = useState<string | null>(null);

  const genderOptions = [
    { value: 'man', label: 'Men', icon: '👨' },
    { value: 'woman', label: 'Women', icon: '👩' },
    { value: 'non_binary', label: 'Non-binary', icon: '🧑' },
  ];

  const relationshipOptions = [
    { value: 'serious_relationship', label: 'Serious Relationship', emoji: '💍' },
    { value: 'open_to_long_term', label: 'Open to Long-term', emoji: '💕' },
    { value: 'not_sure', label: 'Not Sure Yet', emoji: '🤷' },
    { value: 'casual', label: 'Casual', emoji: '🌟' },
  ];

  const toggleGender = (gender: string) => {
    if (seekingGenders.includes(gender)) {
      setSeekingGenders(seekingGenders.filter(g => g !== gender));
    } else {
      setSeekingGenders([...seekingGenders, gender]);
    }
  };

  const handleContinue = () => {
    if (seekingGenders.length === 0) {
      Alert.alert('Select Gender', 'Please select at least one gender preference');
      return;
    }

    if (!relationshipIntent) {
      Alert.alert('Relationship Intent', 'Please select what you\'re looking for');
      return;
    }

    // Save preferences to context
    updateData({
      seekingGenders,
      ageMin: ageRange.min,
      ageMax: ageRange.max,
      maxDistance,
      relationshipIntent,
    });
    console.log('[Preferences] Saved preferences, navigating to location...');
    router.push('/(onboarding)/location');
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
          <View style={[styles.progressBar, { width: '70%' }]} />
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
            <Text style={styles.title}>Your preferences</Text>
            <Text style={styles.subtitle}>
              Help us find your perfect match
            </Text>
          </View>

          {/* Seeking Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I'm interested in</Text>
            <View style={styles.genderOptions}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    seekingGenders.includes(option.value) && styles.genderOptionSelected,
                  ]}
                  onPress={() => toggleGender(option.value)}
                >
                  <Text style={styles.genderIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.genderLabel,
                      seekingGenders.includes(option.value) && styles.genderLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {seekingGenders.includes(option.value) && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Age Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age range</Text>
            <View style={styles.rangeDisplay}>
              <Text style={styles.rangeText}>{ageRange.min} - {ageRange.max} years</Text>
            </View>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Minimum age: {ageRange.min}</Text>
              <Slider
                style={styles.slider}
                minimumValue={18}
                maximumValue={100}
                step={1}
                value={ageRange.min}
                onValueChange={(value) => setAgeRange({ ...ageRange, min: Math.round(value) })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
              />
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Maximum age: {ageRange.max}</Text>
              <Slider
                style={styles.slider}
                minimumValue={18}
                maximumValue={100}
                step={1}
                value={ageRange.max}
                onValueChange={(value) => setAgeRange({ ...ageRange, max: Math.round(value) })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
              />
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum distance</Text>
            <View style={styles.rangeDisplay}>
              <Text style={styles.rangeText}>{maxDistance} km</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={200}
              step={5}
              value={maxDistance}
              onValueChange={(value) => setMaxDistance(Math.round(value))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
            />
          </View>

          {/* Relationship Intent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking for</Text>
            <View style={styles.relationshipOptions}>
              {relationshipOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.relationshipOption,
                    relationshipIntent === option.value && styles.relationshipOptionSelected,
                  ]}
                  onPress={() => setRelationshipIntent(option.value)}
                >
                  <Text style={styles.relationshipEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.relationshipLabel,
                      relationshipIntent === option.value && styles.relationshipLabelSelected,
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

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  genderOptions: {
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  genderIcon: {
    fontSize: 28,
  },
  genderLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  genderLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  rangeDisplay: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  relationshipOptions: {
    gap: 12,
  },
  relationshipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  relationshipOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  relationshipEmoji: {
    fontSize: 28,
  },
  relationshipLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  relationshipLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
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
