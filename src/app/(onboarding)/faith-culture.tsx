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

const RELIGIOUS_PRACTICE_OPTIONS: OptionItem[] = [
  { value: 'very_practicing', label: 'Very Practicing', icon: 'moon' },
  { value: 'practicing', label: 'Practicing', icon: 'star' },
  { value: 'somewhat_practicing', label: 'Somewhat Practicing', icon: 'star-half' },
  { value: 'cultural', label: 'Cultural Muslim', icon: 'heart' },
  { value: 'not_practicing', label: 'Not Currently Practicing', icon: 'leaf' },
];

const PRAYER_FREQUENCY_OPTIONS: OptionItem[] = [
  { value: 'five_daily', label: 'Five Daily Prayers' },
  { value: 'some_daily', label: 'Some Daily Prayers' },
  { value: 'friday_only', label: 'Friday Prayers' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'prefer_not_say', label: 'Prefer Not to Say' },
];

const HIJAB_OPTIONS: OptionItem[] = [
  { value: 'always', label: 'Always Wear Hijab' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'not_currently', label: 'Not Currently' },
  { value: 'prefer_not_say', label: 'Prefer Not to Say' },
  { value: 'not_applicable', label: 'Not Applicable' },
];

const DIETARY_OPTIONS: OptionItem[] = [
  { value: 'strict_halal', label: 'Strictly Halal' },
  { value: 'halal_preferred', label: 'Halal Preferred' },
  { value: 'no_pork', label: 'No Pork' },
  { value: 'no_restriction', label: 'No Dietary Restrictions' },
];

const MARRIAGE_TIMELINE_OPTIONS: OptionItem[] = [
  { value: 'within_year', label: 'Within a Year', icon: 'calendar' },
  { value: 'one_to_two_years', label: '1-2 Years', icon: 'time' },
  { value: 'when_ready', label: 'When the Right Person Comes', icon: 'heart' },
  { value: 'not_sure', label: 'Not Sure Yet', icon: 'help-circle' },
];

const FAMILY_INVOLVEMENT_OPTIONS: OptionItem[] = [
  { value: 'very_involved', label: 'Very Involved' },
  { value: 'somewhat_involved', label: 'Somewhat Involved' },
  { value: 'minimal', label: 'Minimal Involvement' },
  { value: 'prefer_not_say', label: 'Prefer Not to Say' },
];

const CORE_VALUES_OPTIONS = [
  'Modesty', 'Family First', 'Education', 'Charity', 'Respect', 
  'Honesty', 'Kindness', 'Patience', 'Tradition', 'Growth',
  'Balance', 'Community'
];

export default function FaithCultureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateData, data, saveToDatabase } = useOnboarding();

  const [religiousPractice, setReligiousPractice] = useState(data.religiousPractice || '');
  const [prayerFrequency, setPrayerFrequency] = useState(data.prayerFrequency || '');
  const [hijabPreference, setHijabPreference] = useState(data.hijabPreference || '');
  const [dietaryPreference, setDietaryPreference] = useState(data.dietaryPreference || '');
  const [marriageTimeline, setMarriageTimeline] = useState(data.marriageTimeline || '');
  const [familyInvolvement, setFamilyInvolvement] = useState(data.familyInvolvement || '');
  const [tribeClan, setTribeClan] = useState(data.tribeClan || '');
  const [selectedValues, setSelectedValues] = useState<string[]>(data.values || []);

  const isFormValid = religiousPractice && marriageTimeline && selectedValues.length >= 3;

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else {
      if (selectedValues.length < 5) {
        setSelectedValues([...selectedValues, value]);
      }
    }
  };

  const handleContinue = () => {
    updateData({
      religiousPractice,
      prayerFrequency,
      hijabPreference,
      dietaryPreference,
      marriageTimeline,
      familyInvolvement,
      tribeClan: tribeClan.trim() || undefined,
      values: selectedValues,
    });
    setTimeout(() => saveToDatabase(), 100);
    router.push('/(onboarding)/background');
  };

  const renderOptionButton = (
    option: OptionItem,
    selected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.optionButton,
        selected && styles.optionButtonSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {option.icon && (
        <Ionicons
          name={option.icon as any}
          size={18}
          color={selected ? '#fff' : colors.primary}
          style={styles.optionIcon}
        />
      )}
      <Text style={[
        styles.optionText,
        selected && styles.optionTextSelected,
      ]}>
        {option.label}
      </Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
      )}
    </TouchableOpacity>
  );

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
                <View style={[styles.progressFill, { width: '22%' }]} />
              </View>
              <Text style={styles.progressText}>Step 2 of 8</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Faith & Values</Text>
            <Text style={styles.subtitle}>
              Help us find someone who shares your values and beliefs
            </Text>
          </View>

          {/* Religious Practice */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              How would you describe your religious practice? *
            </Text>
            <View style={styles.optionsContainer}>
              {RELIGIOUS_PRACTICE_OPTIONS.map((option) =>
                renderOptionButton(
                  option,
                  religiousPractice === option.value,
                  () => setReligiousPractice(option.value)
                )
              )}
            </View>
          </View>

          {/* Prayer Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prayer Frequency</Text>
            <View style={styles.optionsGrid}>
              {PRAYER_FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.gridOption,
                    prayerFrequency === option.value && styles.gridOptionSelected,
                  ]}
                  onPress={() => setPrayerFrequency(option.value)}
                >
                  <Text style={[
                    styles.gridOptionText,
                    prayerFrequency === option.value && styles.gridOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hijab Preference - Only show for women */}
          {data.gender === 'woman' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hijab</Text>
              <View style={styles.optionsGrid}>
                {HIJAB_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.gridOption,
                      hijabPreference === option.value && styles.gridOptionSelected,
                    ]}
                    onPress={() => setHijabPreference(option.value)}
                  >
                    <Text style={[
                      styles.gridOptionText,
                      hijabPreference === option.value && styles.gridOptionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Dietary Preference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Preference</Text>
            <View style={styles.optionsGrid}>
              {DIETARY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.gridOption,
                    dietaryPreference === option.value && styles.gridOptionSelected,
                  ]}
                  onPress={() => setDietaryPreference(option.value)}
                >
                  <Text style={[
                    styles.gridOptionText,
                    dietaryPreference === option.value && styles.gridOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Marriage Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              When are you looking to get married? *
            </Text>
            <View style={styles.optionsContainer}>
              {MARRIAGE_TIMELINE_OPTIONS.map((option) =>
                renderOptionButton(
                  option,
                  marriageTimeline === option.value,
                  () => setMarriageTimeline(option.value)
                )
              )}
            </View>
          </View>

          {/* Family Involvement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              How involved will your family be in your marriage decision?
            </Text>
            <View style={styles.optionsGrid}>
              {FAMILY_INVOLVEMENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.gridOption,
                    familyInvolvement === option.value && styles.gridOptionSelected,
                  ]}
                  onPress={() => setFamilyInvolvement(option.value)}
                >
                  <Text style={[
                    styles.gridOptionText,
                    familyInvolvement === option.value && styles.gridOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Core Values */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Values (Select 3-5)</Text>
            <Text style={styles.sectionHint}>
              What matters most to you in a partner?
            </Text>
            <View style={styles.optionsGrid}>
              {CORE_VALUES_OPTIONS.map((value) => {
                const isSelected = selectedValues.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.chipOption,
                      isSelected && styles.chipOptionSelected,
                    ]}
                    onPress={() => toggleValue(value)}
                  >
                    <Text style={[
                      styles.chipOptionText,
                      isSelected && styles.chipOptionTextSelected,
                    ]}>
                      {value}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#fff" style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tribe/Clan (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tribe/Clan (Optional)</Text>
            <Text style={styles.sectionHint}>
              This is optional and only shown to matches
            </Text>
            <TextInput
              style={styles.textInput}
              value={tribeClan}
              onChangeText={setTribeClan}
              placeholder="e.g., Hawiye, Darod, Dir..."
              placeholderTextColor={colors.textSecondary}
            />
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
  sectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  gridOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gridOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  gridOptionTextSelected: {
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
