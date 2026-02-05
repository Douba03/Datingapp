import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../components/theme/colors';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface OptionItem {
  value: string;
  label: string;
  icon?: string;
}

const EDUCATION_OPTIONS: OptionItem[] = [
  { value: 'high_school', label: 'High School', icon: 'school' },
  { value: 'some_college', label: 'Some College', icon: 'library' },
  { value: 'bachelors', label: "Bachelor's Degree", icon: 'ribbon' },
  { value: 'masters', label: "Master's Degree", icon: 'medal' },
  { value: 'doctorate', label: 'Doctorate', icon: 'trophy' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const LIVING_SITUATION_OPTIONS: OptionItem[] = [
  { value: 'with_family', label: 'Living with Family' },
  { value: 'alone', label: 'Living Alone' },
  { value: 'with_roommates', label: 'With Roommates' },
  { value: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS = [
  'Somali',
  'English',
  'Arabic',
  'Swedish',
  'Norwegian',
  'Dutch',
  'Italian',
  'French',
  'German',
  'Swahili',
];

const ETHNICITY_OPTIONS = [
  'Somali',
  'Ethiopian',
  'Eritrean',
  'Djiboutian',
  'Kenyan',
  'Mixed',
  'Other',
];

export default function BackgroundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData, data, saveToDatabase } = useOnboarding();

  const [educationLevel, setEducationLevel] = useState(data.educationLevel || '');
  const [occupation, setOccupation] = useState(data.occupation || '');
  const [livingSituation, setLivingSituation] = useState(data.livingSituation || '');
  const [languages, setLanguages] = useState<string[]>(data.languages || ['Somali']);
  const [ethnicity, setEthnicity] = useState(data.ethnicity || 'Somali');
  const [hasChildren, setHasChildren] = useState<boolean | undefined>(data.hasChildren);
  const [wantsChildren, setWantsChildren] = useState<boolean | undefined>(data.wantsChildren);

  const isFormValid = educationLevel && occupation.trim();

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleContinue = () => {
    updateData({
      educationLevel,
      occupation: occupation.trim(),
      livingSituation,
      languages,
      ethnicity,
      hasChildren,
      wantsChildren,
    });
    setTimeout(() => saveToDatabase(), 100);
    router.push('/(onboarding)/photos');
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '33%' }]} />
              </View>
              <Text style={styles.progressText}>Step 3 of 8</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Professional & Personal</Text>
            <Text style={styles.subtitle}>
              Share details about your education, career, and lifestyle
            </Text>
          </View>

          {/* Education Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education Level *</Text>
            <View style={styles.optionsGrid}>
              {EDUCATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.educationOption,
                    educationLevel === option.value && styles.educationOptionSelected,
                  ]}
                  onPress={() => setEducationLevel(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={educationLevel === option.value ? '#fff' : colors.primary}
                  />
                  <Text style={[
                    styles.educationOptionText,
                    educationLevel === option.value && styles.educationOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Occupation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Occupation *</Text>
            <TextInput
              style={styles.textInput}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="e.g., Software Engineer, Doctor, Student..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Living Situation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Living Situation</Text>
            <View style={styles.optionsRow}>
              {LIVING_SITUATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chipOption,
                    livingSituation === option.value && styles.chipOptionSelected,
                  ]}
                  onPress={() => setLivingSituation(option.value)}
                >
                  <Text style={[
                    styles.chipOptionText,
                    livingSituation === option.value && styles.chipOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages Spoken</Text>
            <View style={styles.optionsRow}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.chipOption,
                    languages.includes(lang) && styles.chipOptionSelected,
                  ]}
                  onPress={() => toggleLanguage(lang)}
                >
                  <Text style={[
                    styles.chipOptionText,
                    languages.includes(lang) && styles.chipOptionTextSelected,
                  ]}>
                    {lang}
                  </Text>
                  {languages.includes(lang) && (
                    <Ionicons name="checkmark" size={16} color="#fff" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ethnicity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ethnicity</Text>
            <View style={styles.optionsRow}>
              {ETHNICITY_OPTIONS.map((eth) => (
                <TouchableOpacity
                  key={eth}
                  style={[
                    styles.chipOption,
                    ethnicity === eth && styles.chipOptionSelected,
                  ]}
                  onPress={() => setEthnicity(eth)}
                >
                  <Text style={[
                    styles.chipOptionText,
                    ethnicity === eth && styles.chipOptionTextSelected,
                  ]}>
                    {eth}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Children */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do you have children?</Text>
            <View style={styles.booleanRow}>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  hasChildren === true && styles.booleanOptionSelected,
                ]}
                onPress={() => setHasChildren(true)}
              >
                <Text style={[
                  styles.booleanOptionText,
                  hasChildren === true && styles.booleanOptionTextSelected,
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  hasChildren === false && styles.booleanOptionSelected,
                ]}
                onPress={() => setHasChildren(false)}
              >
                <Text style={[
                  styles.booleanOptionText,
                  hasChildren === false && styles.booleanOptionTextSelected,
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wants Children */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do you want children?</Text>
            <View style={styles.booleanRow}>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  wantsChildren === true && styles.booleanOptionSelected,
                ]}
                onPress={() => setWantsChildren(true)}
              >
                <Text style={[
                  styles.booleanOptionText,
                  wantsChildren === true && styles.booleanOptionTextSelected,
                ]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.booleanOption,
                  wantsChildren === false && styles.booleanOptionSelected,
                ]}
                onPress={() => setWantsChildren(false)}
              >
                <Text style={[
                  styles.booleanOptionText,
                  wantsChildren === false && styles.booleanOptionTextSelected,
                ]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isFormValid ? [colors.primary, colors.primaryDark] : ['#ccc', '#aaa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  educationOption: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  educationOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  educationOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  educationOptionTextSelected: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipOptionTextSelected: {
    color: '#fff',
  },
  booleanRow: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanOption: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  booleanOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  booleanOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  booleanOptionTextSelected: {
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.backgroundGradientEnd,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
