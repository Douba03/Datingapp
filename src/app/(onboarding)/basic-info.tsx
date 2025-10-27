import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [customGender, setCustomGender] = useState('');

  const genderOptions = [
    { value: 'man', label: 'Man', icon: '👨' },
    { value: 'woman', label: 'Woman', icon: '👩' },
    { value: 'non_binary', label: 'Non-binary', icon: '🧑' },
    { value: 'custom', label: 'Custom', icon: '✨' },
  ];

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const validateAndContinue = () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name');
      return;
    }

    if (!dateOfBirth) {
      Alert.alert('Missing Information', 'Please select your date of birth');
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      Alert.alert('Age Requirement', 'You must be at least 18 years old to use this app');
      return;
    }

    if (!gender) {
      Alert.alert('Missing Information', 'Please select your gender');
      return;
    }

    if (gender === 'custom' && !customGender.trim()) {
      Alert.alert('Missing Information', 'Please enter your gender identity');
      return;
    }

    // Save data to context
    updateData({
      firstName,
      dateOfBirth: dateOfBirth.toISOString(),
      gender,
      customGender: gender === 'custom' ? customGender : undefined,
    });
    
    console.log('[BasicInfo] Saved data, navigating to photos...');
    router.push('/(onboarding)/photos');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker closes when a date is selected
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      // On iOS, close the picker after selection
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      // User cancelled
      setShowDatePicker(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '14%' }]} />
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
              <Text style={styles.title}>Let's start with the basics</Text>
              <Text style={styles.subtitle}>
                This information will be shown on your profile
              </Text>
            </View>

            {/* First Name */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor={colors.textSecondary}
                value={firstName}
                onChangeText={setFirstName}
                maxLength={50}
                autoFocus
              />
              <Text style={styles.helperText}>
                This is how it will appear on your profile
              </Text>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                  {dateOfBirth
                    ? dateOfBirth.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select your date of birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {dateOfBirth && (
                <Text style={styles.helperText}>
                  Age: {calculateAge(dateOfBirth)} years old
                </Text>
              )}
            </View>

            {showDatePicker && Platform.OS !== 'web' && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1940, 0, 1)}
                  textColor={colors.text}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.datePickerDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Fallback for web */}
            {showDatePicker && Platform.OS === 'web' && (
              <View style={styles.webDatePicker}>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setDateOfBirth(date);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Gender */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderOptions}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionSelected,
                    ]}
                    onPress={() => setGender(option.value)}
                  >
                    <Text style={styles.genderIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.genderLabel,
                        gender === option.value && styles.genderLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {gender === 'custom' && (
                <TextInput
                  style={[styles.input, styles.customGenderInput]}
                  placeholder="Enter your gender identity"
                  placeholderTextColor={colors.textSecondary}
                  value={customGender}
                  onChangeText={setCustomGender}
                  maxLength={50}
                />
              )}
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={validateAndContinue}
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  datePlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  genderIcon: {
    fontSize: 28,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  genderLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  customGenderInput: {
    marginTop: 12,
  },
  datePickerContainer: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerDone: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webDatePicker: {
    marginTop: 16,
    gap: 12,
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
