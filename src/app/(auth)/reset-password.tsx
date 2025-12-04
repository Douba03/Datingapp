import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  
  const { updatePassword } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Check if we have the necessary parameters from the deep link
    console.log('Reset password params:', params);
  }, [params]);

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        const errorMessage = error instanceof Error ? error.message : (error as any)?.message || 'Unknown error';
        Alert.alert('Error', errorMessage);
      } else {
        setResetComplete(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {resetComplete ? 'Password Reset Complete' : 'Reset Your Password'}
          </Text>
          <Text style={styles.subtitle}>
            {resetComplete 
              ? 'Your password has been updated successfully' 
              : 'Please enter a new password for your account'}
          </Text>

          {!resetComplete ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Reset Password"
                onPress={handlePasswordReset}
                loading={loading}
                style={styles.resetButton}
              />

              <Button
                title="Back to Login"
                onPress={handleGoToLogin}
                variant="outline"
                style={styles.backButton}
              />
            </View>
          ) : (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              <Text style={styles.successText}>Your password has been reset successfully</Text>
              <Button
                title="Go to Login"
                onPress={handleGoToLogin}
                style={styles.loginButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  resetButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: `${colors.success}10`,
    borderRadius: 16,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: colors.text,
  },
  loginButton: {
    minWidth: 200,
  },
});
