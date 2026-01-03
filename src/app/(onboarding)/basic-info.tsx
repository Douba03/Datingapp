import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

export default function BasicInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    { value: 'man', label: 'Man', icon: 'male', color: '#4A90D9' },
    { value: 'woman', label: 'Woman', icon: 'female', color: '#FF6B9D' },
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
      
      if (yearNum < 1924 || yearNum > new Date().getFullYear()) {
        setAgeError('Please enter a valid year');
        return;
      }
      
      if (monthNum < 1 || monthNum > 12) {
        setAgeError('Please enter a valid month (1-12)');
        return;
      }
      
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      if (dayNum < 1 || dayNum > daysInMonth) {
        setAgeError(`Please enter a valid day (1-${daysInMonth})`);
        return;
      }
      
      const date = new Date(yearNum, monthNum - 1, dayNum);
      
      if (date > new Date()) {
        setAgeError('Date cannot be in the future');
        return;
      }
      
      const age = calculateAge(date);
      setDateOfBirth(date);
      setAgeError(null);
      
      if (age < 18) {
        setAgeError('You must be at least 18 years old');
      }
    }
  }, [year, month, day]);

  const validateAndContinue = () => {
    if (!firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name');
      return;
    }

    if (!dateOfBirth) {
      Alert.alert('Missing Information', 'Please enter your date of birth');
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      Alert.alert('Age Requirement', 'You must be at least 18 years old');
      return;
    }

    if (!gender) {
      Alert.alert('Missing Information', 'Please select your gender');
      return;
    }

    updateData({
      firstName,
      dateOfBirth: dateOfBirth.toISOString(),
      gender,
      customGender: gender === 'custom' ? customGender : undefined,
    });
    
    router.push('/(onboarding)/photos');
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: '14%' }]}
            />
          </View>
          
          <Text style={styles.stepText}>Step 1 of 7</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleSection}>
              <Ionicons name="hand-left" size={48} color="#FF6B9D" />
              <Text style={styles.title}>Let's get to know you!</Text>
              <Text style={styles.subtitle}>
                This info will be shown on your profile
              </Text>
            </View>

            {/* First Name */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>What's your first name?</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  maxLength={50}
                  autoFocus
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>When's your birthday? 🎂</Text>
              <View style={styles.dateInputContainer}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>Day</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    placeholderTextColor={colors.textSecondary}
                    value={day}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      if (numeric.length <= 2) setDay(numeric);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
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
                      if (numeric.length <= 2) setMonth(numeric);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateInputLabel}>Year</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY"
                    placeholderTextColor={colors.textSecondary}
                    value={year}
                    onChangeText={(text) => {
                      const numeric = text.replace(/[^0-9]/g, '');
                      if (numeric.length <= 4) setYear(numeric);
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
              {dateOfBirth && !ageError && (
                <View style={styles.ageDisplay}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.ageText}>
                    {calculateAge(dateOfBirth)} years old
                  </Text>
                </View>
              )}
                  {ageError && (
                <View style={styles.errorDisplay}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.errorText}>{ageError}</Text>
                </View>
              )}
            </View>

            {/* Gender */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>I am a...</Text>
              <View style={styles.genderOptions}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionSelected,
                      gender === option.value && { borderColor: option.color }
                    ]}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.genderIconContainer,
                      { backgroundColor: `${option.color}15` }
                    ]}>
                    <Ionicons 
                      name={option.icon as any} 
                        size={32} 
                        color={gender === option.value ? option.color : colors.textSecondary} 
                    />
                    </View>
                    <Text
                      style={[
                        styles.genderLabel,
                        gender === option.value && { color: option.color, fontWeight: '700' },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {gender === option.value && (
                      <View style={[styles.checkBadge, { backgroundColor: option.color }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={validateAndContinue}
            activeOpacity={0.8}
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
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
    marginBottom: 32,
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
  inputSection: {
    marginBottom: 28,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 17,
    color: colors.text,
    fontWeight: '500',
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  ageText: {
    fontSize: 15,
    color: colors.success,
    fontWeight: '600',
  },
  errorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  genderOptionSelected: {
    backgroundColor: colors.surface,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  genderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 100,
    elevation: 10,
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
