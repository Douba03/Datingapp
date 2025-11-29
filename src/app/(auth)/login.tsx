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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';
import { Button } from '../../components/ui/Button';
import { colors } from '../../components/theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn, signUp, needsOnboarding } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    setErrorMessage('');
    setErrorType('');
    
    if (isForgotPassword) {
      handleResetPassword();
      return;
    }

    if (!email || (!isForgotPassword && !password)) {
      setErrorMessage('Please fill in all fields');
      setErrorType('general');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setErrorType('email');
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setErrorType('password');
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
        
        let errorMessage = (error instanceof Error ? error.message : (error as any)?.message) || 'An unknown error occurred';
        
        if (errorMessage.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please try again.');
          setErrorType('general');
        } else if (errorMessage.includes('already registered')) {
          setErrorMessage('This email is already registered. Please sign in instead.');
          setErrorType('email');
        } else {
          setErrorMessage(errorMessage);
          setErrorType('general');
        }
      } else if (isSignUp && data?.user?.identities?.length === 0) {
        Alert.alert('Signup Failed', 'This email is already registered. Please sign in instead.');
      } else {
        console.log('Authentication successful!');
        
        try {
          if (!isSignUp) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('user_id', data?.user?.id)
              .single();
              
            if (!profileData) {
              // User doesn't have a profile - show message and redirect to onboarding
              if (Platform.OS === 'web') {
                window.alert('Welcome! It looks like you need to complete your profile setup. Let\'s get you started!');
              } else {
                Alert.alert(
                  'Welcome to Mali Match! 💕',
                  'It looks like you need to complete your profile setup. Let\'s get you started!',
                  [{ text: 'Let\'s Go!', onPress: () => router.replace('/(onboarding)/welcome') }]
                );
                return;
              }
              router.replace('/(onboarding)/welcome');
              return;
            }
          }
          
          router.replace('/(tabs)');
        } catch (navError) {
          console.error('Navigation error:', navError);
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Unexpected auth error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setErrorType('general');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      setErrorType('email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setErrorType('email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${Platform.OS === 'web' ? window.location.origin : 'mali-match://'}/(auth)/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        setErrorType('general');
      } else {
        setResetSent(true);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setErrorType('general');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setResetSent(false);
    setErrorMessage('');
    setErrorType('');
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setResetSent(false);
    setErrorMessage('');
    setErrorType('');
  };

  if (resetSent) {
    return (
      <LinearGradient
        colors={['#FDF2F8', '#FCE7F3', '#FBCFE8']}
        style={styles.gradient}
      >
        <View style={styles.resetContainer}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.logoBg}
            >
              <Text style={styles.logoEmoji}>📧</Text>
            </LinearGradient>
          </View>
          <Text style={styles.resetTitle}>Check Your Email</Text>
          <Text style={styles.resetSubtitle}>
            We've sent password reset instructions to {email}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setIsForgotPassword(false);
              setResetSent(false);
            }}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FDF2F8', '#FCE7F3', '#FBCFE8']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.logoBg}
              >
                <Text style={styles.logoEmoji}>💕</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Mali Match</Text>
            <Text style={styles.tagline}>Where love begins 💕</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isForgotPassword 
                ? 'Enter your email to reset your password' 
                : isSignUp 
                  ? 'Join thousands finding love' 
                  : 'Sign in to continue'}
            </Text>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={[
              styles.inputContainer,
              errorType === 'email' && styles.inputError
            ]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                  setErrorType('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password Input */}
            {!isForgotPassword && (
              <View style={[
                styles.inputContainer,
                errorType === 'password' && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage('');
                    setErrorType('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitButtonText}>
                  {loading 
                    ? 'Please wait...' 
                    : isForgotPassword 
                      ? 'Send Reset Link' 
                      : isSignUp 
                        ? 'Create Account' 
                        : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle Links */}
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.linkText}>
                  {isSignUp ? 'Already have an account? ' : 'New here? '}
                  <Text style={styles.linkTextBold}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>

              {!isSignUp && !isForgotPassword && (
                <TouchableOpacity onPress={toggleForgotPassword} style={styles.forgotLink}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {isForgotPassword && (
                <TouchableOpacity onPress={toggleForgotPassword} style={styles.forgotLink}>
                  <Text style={styles.forgotText}>Back to Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/terms-of-service')}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/privacy-policy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linksContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  forgotLink: {
    marginTop: 16,
  },
  forgotText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  resetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  resetSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
