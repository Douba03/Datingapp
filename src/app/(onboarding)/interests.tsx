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
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

const interestCategories = [
  {
    category: '🎨 Creative',
    color: '#FF6B9D',
    interests: ['Photography', 'Art', 'Music', 'Writing', 'Design', 'Dancing'],
  },
  {
    category: '🏃 Active',
    color: '#4ECDC4',
    interests: ['Fitness', 'Yoga', 'Running', 'Hiking', 'Cycling', 'Sports'],
  },
  {
    category: '🎬 Entertainment',
    color: '#FFB347',
    interests: ['Movies', 'TV Shows', 'Gaming', 'Concerts', 'Theater', 'Podcasts'],
  },
  {
    category: '🌍 Lifestyle',
    color: '#9B59B6',
    interests: ['Travel', 'Food', 'Coffee', 'Wine', 'Fashion', 'Pets'],
  },
  {
    category: '💼 Professional',
    color: '#3498DB',
    interests: ['Tech', 'Startups', 'Finance', 'Marketing', 'Science', 'Education'],
  },
];

export default function InterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < MAX_INTERESTS) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert('Maximum Reached', `You can select up to ${MAX_INTERESTS} interests`);
      }
    }
  };

  const handleContinue = () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      Alert.alert('Select More', `Please select at least ${MIN_INTERESTS} interests`);
      return;
    }

    updateData({ interests: selectedInterests });
    router.push('/(onboarding)/preferences');
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
            style={[styles.progressBar, { width: '56%' }]}
          />
        </View>
        
        <Text style={styles.stepText}>Step 4 of 7</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Ionicons name="heart-circle" size={48} color="#FF6B9D" />
            <Text style={styles.title}>What are you into?</Text>
            <Text style={styles.subtitle}>
              Select interests to help us find your perfect match
            </Text>
          </View>

          {/* Count Badge */}
          <View style={[
            styles.countBadge,
            selectedInterests.length >= MIN_INTERESTS && styles.countBadgeComplete
          ]}>
            <Ionicons 
              name={selectedInterests.length >= MIN_INTERESTS ? "checkmark-circle" : "heart"} 
              size={18} 
              color={selectedInterests.length >= MIN_INTERESTS ? colors.success : colors.primary} 
            />
            <Text style={[
              styles.countText,
              selectedInterests.length >= MIN_INTERESTS && { color: colors.success }
            ]}>
              {selectedInterests.length} / {MAX_INTERESTS} selected
              {selectedInterests.length < MIN_INTERESTS && ` (${MIN_INTERESTS - selectedInterests.length} more)`}
            </Text>
          </View>

          {/* Interest Categories */}
          {interestCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: category.color }]}>
                {category.category}
              </Text>
              <View style={styles.interestsList}>
                {category.interests.map((interest, index) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.interestChip,
                        isSelected && { 
                          backgroundColor: category.color,
                          borderColor: category.color,
                        },
                      ]}
                      onPress={() => toggleInterest(interest)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.interestText,
                          isSelected && styles.interestTextSelected,
                        ]}
                      >
                        {interest}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedInterests.length < MIN_INTERESTS && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedInterests.length < MIN_INTERESTS}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={selectedInterests.length >= MIN_INTERESTS 
              ? [colors.primary, colors.primaryDark]
              : ['#D1D5DB', '#9CA3AF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {selectedInterests.length >= MIN_INTERESTS ? 'Continue' : `Select ${MIN_INTERESTS - selectedInterests.length} more`}
            </Text>
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
    marginBottom: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  countBadgeComplete: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}08`,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  categorySection: {
    marginBottom: 28,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  interestText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  interestTextSelected: {
    color: '#fff',
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
