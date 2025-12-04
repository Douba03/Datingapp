import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';

export default function SimpleLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    if (isForgotPassword) {
      handleResetPassword();
      return;
    }

    if (!email || (!isForgotPassword && !password)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password length
    if (isSignUp && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    
    setLoading(true);
    try {
      console.log(`Attempting to ${isSignUp ? 'sign up' : 'sign in'} with email: ${emailNormalized}`);
      
      const { data, error } = isSignUp 
        ? await signUp(emailNormalized, password)
        : await signIn(emailNormalized, password);

      if (error) {
        console.error('Auth error:', error);
        
        // Handle specific error cases
        const authError = error as { message?: string };
        let errorMessage = authError.message || 'An unknown error occurred';
        
        if (errorMessage.includes('Invalid login credentials')) {
          // Check if email exists to determine if it's a wrong password or non-existent email
          // Don't try to check email existence - it's causing errors
          // Just show a generic message for invalid credentials
          Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
          
          // Log the error for debugging
          console.log('Login error details:', error);
        } else if (errorMessage.includes('already registered')) {
          Alert.alert('Signup Failed', 'This email is already registered. Please sign in instead.');
        } else {
          Alert.alert('Error', errorMessage);
        }
      } else if (isSignUp && data?.user?.identities?.length === 0) {
        // Handle the case where the email is already registered
        Alert.alert('Signup Failed', 'This email is already registered. Please sign in instead.');
      } else {
        console.log('Authentication successful!');
        
        // Decide destination immediately to avoid UI stall
        try {
          const authUserId = data?.user?.id;
          if (authUserId) {
            const { data: dbProfile, error: profileErr } = await supabase
              .from('profiles')
              .select('first_name,bio,photos,interests')
              .eq('user_id', authUserId)
              .single();

            const emailPrefix = (emailNormalized || '').split('@')[0];
            const hasCompletedOnboarding = !!dbProfile && (
              (dbProfile.first_name && dbProfile.first_name !== emailPrefix) ||
              (dbProfile.bio && dbProfile.bio.length > 0) ||
              (Array.isArray(dbProfile.photos) && dbProfile.photos.length > 0) ||
              (Array.isArray(dbProfile.interests) && dbProfile.interests.length > 0)
            );

            const dest = hasCompletedOnboarding ? '/(tabs)' : '/(onboarding)/welcome';
            router.replace(dest);
          } else {
            router.replace('/');
          }
        } catch (routingErr) {
          console.error('Routing error:', routingErr);
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Exception caught:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    
    setLoading(true);
    try {
      // Use a hardcoded URL that's guaranteed to work
      const { error } = await supabase.auth.resetPasswordForEmail(emailNormalized, {
        redirectTo: 'https://zfnwtnqwokwvuxxwxgsr.supabase.co/auth/v1/verify'
      });

      if (error) {
        console.log('Password reset error:', error);
        
        if (error.message.includes('user not found')) {
          Alert.alert('Error', 'This email is not registered. Please sign up instead.');
        } else {
          Alert.alert('Error', error.message || 'Unknown error');
        }
      } else {
        setResetSent(true);
        Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
      }
    } catch (error) {
      console.error('Password reset exception:', error);
      Alert.alert('Error', 'Something went wrong with the password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo & App Name */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.logoCircle}
            >
              <Ionicons name="heart" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>Mali Match</Text>
            <Text style={styles.tagline}>Find your perfect match</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isSignUp ? 'Join Mali Match today' : 'Sign in to continue'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {!isForgotPassword && (
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            <Button
              title={isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In')}
              onPress={handleAuth}
              loading={loading}
              style={styles.authButton}
            />

            {resetSent ? (
              <View style={styles.resetSentContainer}>
                <Text style={styles.resetSentText}>Password reset link sent!</Text>
                <Text style={styles.resetSentSubtext}>Check your email for instructions.</Text>
                <TouchableOpacity onPress={() => {
                  setIsForgotPassword(false);
                  setResetSent(false);
                }}>
                  <Text style={styles.resetBackLink}>Back to login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Button
                  title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setIsForgotPassword(false);
                  }}
                  variant="outline"
                  style={styles.switchButton}
                />
                
                {!isSignUp && !isForgotPassword && (
                  <TouchableOpacity 
                    style={styles.forgotPasswordLink}
                    onPress={() => setIsForgotPassword(true)}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                  </TouchableOpacity>
                )}
                
                {isForgotPassword && (
                  <TouchableOpacity 
                    style={styles.forgotPasswordLink}
                    onPress={() => setIsForgotPassword(false)}
                  >
                    <Text style={styles.forgotPasswordText}>Back to login</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
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
  authButton: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 16,
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  resetSentContainer: {
    backgroundColor: `${colors.success}20`,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resetSentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 8,
  },
  resetSentSubtext: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  resetBackLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});
