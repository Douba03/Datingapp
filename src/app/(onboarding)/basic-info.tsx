import React, { useState, useEffect } from 'react';
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
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [customGender, setCustomGender] = useState('');
  const [ageError, setAgeError] = useState<string | null>(null);
  
  // Manual date input states
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const genderOptions = [
    { value: 'man', label: 'Man', icon: 'male-outline' },
    { value: 'woman', label: 'Woman', icon: 'female-outline' },
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

  useEffect(() => {
    if (year && month && day) {
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);
      
      // Validate inputs
      if (yearNum < 1924 || yearNum > new Date().getFullYear()) {
        setAgeError('Please enter a valid year');
        return;
      }
      
      if (monthNum < 1 || monthNum > 12) {
        setAgeError('Please enter a valid month (1-12)');
        return;
      }
      
      // Check days in month
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      if (dayNum < 1 || dayNum > daysInMonth) {
        setAgeError(`Please enter a valid day (1-${daysInMonth})`);
        return;
      }
      
      const date = new Date(yearNum, monthNum - 1, dayNum);
      
      // Check if date is in the future
      if (date > new Date()) {
        setAgeError('Date cannot be in the future');
        return;
      }
      
      const age = calculateAge(date);
      setDateOfBirth(date);
      setAgeError(null);
      
      if (age < 18) {
        setAgeError('You must be at least 18 years old to use this app');
      }
    }
  }, [year, month, day]);

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
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  maxLength={50}
                  autoFocus
                />
              </View>
              <Text style={styles.helperText}>
                This is how it will appear on your profile
              </Text>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.dateInputContainer}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>Year</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY"
                    placeholderTextColor={colors.textSecondary}
                    value={year}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      if (numeric.length <= 4) {
                        setYear(numeric);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>Month</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="MM"
                    placeholderTextColor={colors.textSecondary}
                    value={month}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      if (numeric.length <= 2) {
                        setMonth(numeric);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>Day</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    placeholderTextColor={colors.textSecondary}
                    value={day}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      if (numeric.length <= 2) {
                        setDay(numeric);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>
              {dateOfBirth && (
                <View>
                  <Text style={styles.helperText}>
                    Age: {calculateAge(dateOfBirth)} years old
                  </Text>
                  {ageError && (
                    <Text style={styles.errorText}>
                      ⚠️ {ageError}
                    </Text>
                  )}
                </View>
              )}
            </View>

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
                    <Ionicons 
                      name={option.icon as any} 
                      size={28} 
                      color={gender === option.value ? colors.primary : colors.textSecondary} 
                    />
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
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
