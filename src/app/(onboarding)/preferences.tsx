import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, updateData } = useOnboarding();
  const [seekingGenders, setSeekingGenders] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState({ min: data.ageMin || 22, max: data.ageMax || 35 });
  const [maxDistance, setMaxDistance] = useState(data.maxDistance || 50);
  const [relationshipIntent, setRelationshipIntent] = useState<string | null>(null);

  const genderOptions = [
    { value: 'man', label: 'Men', icon: 'male', color: '#4A90D9' },
    { value: 'woman', label: 'Women', icon: 'female', color: '#FF6B9D' },
  ];

  const relationshipOptions = [
    { value: 'serious_relationship', label: 'Serious Relationship', icon: 'heart', color: '#FF6B9D', emoji: '💍' },
    { value: 'open_to_long_term', label: 'Open to Long-term', icon: 'infinite', color: '#9B59B6', emoji: '💜' },
    { value: 'not_sure', label: 'Not Sure Yet', icon: 'help-circle', color: '#FFB347', emoji: '🤔' },
    { value: 'casual', label: 'Casual Dating', icon: 'sparkles', color: '#4ECDC4' },
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
      Alert.alert('What are you looking for?', 'Please select what you\'re looking for');
      return;
    }

    updateData({
      seekingGenders,
      ageMin: ageRange.min,
      ageMax: ageRange.max,
      maxDistance,
      relationshipIntent,
    });
    router.push('/(onboarding)/location');
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
            style={[styles.progressBar, { width: '70%' }]}
          />
        </View>
        
        <Text style={styles.stepText}>Step 5 of 7</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Ionicons name="heart" size={48} color="#FF6B9D" />
            <Text style={styles.title}>Your ideal match</Text>
            <Text style={styles.subtitle}>
              Tell us what you're looking for
            </Text>
          </View>

          {/* Seeking Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I'm interested in...</Text>
            <View style={styles.genderOptions}>
              {genderOptions.map((option) => {
                const isSelected = seekingGenders.includes(option.value);
                return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                      isSelected && { borderColor: option.color, backgroundColor: `${option.color}08` },
                  ]}
                  onPress={() => toggleGender(option.value)}
                    activeOpacity={0.7}
                >
                    <View style={[
                      styles.genderIconContainer,
                      { backgroundColor: `${option.color}15` }
                    ]}>
                  <Ionicons 
                    name={option.icon as any} 
                        size={28} 
                        color={isSelected ? option.color : colors.textSecondary} 
                  />
                    </View>
                    <Text style={[
                      styles.genderLabel,
                      isSelected && { color: option.color, fontWeight: '700' }
                    ]}>
                    {option.label}
                  </Text>
                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: option.color }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Age Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Age range</Text>
            <View style={styles.rangeCard}>
            <View style={styles.rangeDisplay}>
                <Text style={styles.rangeValue}>{ageRange.min}</Text>
                <Text style={styles.rangeDivider}>to</Text>
                <Text style={styles.rangeValue}>{ageRange.max}</Text>
                <Text style={styles.rangeUnit}>years</Text>
            </View>
            
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Minimum: {ageRange.min}</Text>
              <Slider
                style={styles.slider}
                minimumValue={18}
                  maximumValue={ageRange.max - 1}
                step={1}
                value={ageRange.min}
                  onValueChange={(value) => {
                    const newMin = Math.round(value);
                    // Ensure min doesn't exceed max
                    if (newMin < ageRange.max) {
                      setAgeRange({ ...ageRange, min: newMin });
                    }
                  }}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
              />
            </View>

            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Maximum: {ageRange.max}</Text>
              <Slider
                style={styles.slider}
                  minimumValue={ageRange.min + 1}
                maximumValue={100}
                step={1}
                value={ageRange.max}
                  onValueChange={(value) => {
                    const newMax = Math.round(value);
                    // Ensure max doesn't go below min
                    if (newMax > ageRange.min) {
                      setAgeRange({ ...ageRange, max: newMax });
                    }
                  }}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
              />
              </View>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum distance</Text>
            <View style={styles.rangeCard}>
              <View style={styles.distanceDisplay}>
                <Ionicons name="location" size={24} color={colors.primary} />
                <Text style={styles.distanceValue}>{maxDistance} km</Text>
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
                thumbTintColor={colors.primary}
            />
            </View>
          </View>

          {/* Relationship Intent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking for...</Text>
            <View style={styles.relationshipOptions}>
              {relationshipOptions.map((option) => {
                const isSelected = relationshipIntent === option.value;
                return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.relationshipOption,
                      isSelected && { borderColor: option.color, backgroundColor: `${option.color}08` },
                  ]}
                  onPress={() => setRelationshipIntent(option.value)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.relationshipEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.relationshipLabel,
                      isSelected && { color: option.color, fontWeight: '700' }
                    ]}>
                    {option.label}
                  </Text>
                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: option.color }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                  )}
                </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
    marginBottom: 28,
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 14,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  genderIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  rangeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  rangeDivider: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rangeUnit: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  distanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  distanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  relationshipOptions: {
    gap: 12,
  },
  relationshipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  relationshipEmoji: {
    fontSize: 24,
    marginRight: 14,
  },
  relationshipLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
