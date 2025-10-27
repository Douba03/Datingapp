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
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

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

export default function InterestsScreen() {
  const router = useRouter();
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
      Alert.alert(
        'Select More Interests',
        `Please select at least ${MIN_INTERESTS} interests to help us find better matches`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Save interests to context
    updateData({ interests: selectedInterests });
    console.log('[Interests] Saved interests, navigating to preferences...');
    router.push('/(onboarding)/preferences');
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
          <View style={[styles.progressBar, { width: '56%' }]} />
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
            <Text style={styles.title}>Your interests</Text>
            <Text style={styles.subtitle}>
              Select at least {MIN_INTERESTS} interests to help us find your perfect match
            </Text>
          </View>

          {/* Selection Count */}
          <View style={styles.countSection}>
            <Text style={styles.countText}>
              {selectedInterests.length} / {MAX_INTERESTS} selected
              {selectedInterests.length < MIN_INTERESTS && 
                ` (${MIN_INTERESTS - selectedInterests.length} more required)`
              }
            </Text>
          </View>

          {/* Interest Categories */}
          {interestCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              <View style={styles.interestsList}>
                {category.interests.map((interest, index) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.interestChip,
                        isSelected && styles.interestChipSelected,
                      ]}
                      onPress={() => toggleInterest(interest)}
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
      <View style={styles.footer}>
        <Button
          title={`Continue ${selectedInterests.length >= MIN_INTERESTS ? '' : `(${MIN_INTERESTS - selectedInterests.length} more)`}`}
          onPress={handleContinue}
          disabled={selectedInterests.length < MIN_INTERESTS}
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
    marginBottom: 24,
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
  countSection: {
    marginBottom: 24,
  },
  countText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  interestChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  interestTextSelected: {
    color: '#fff',
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
