import React, { useState, useRef } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabase/client';
import { Button } from '../../components/ui/Button';
import { colors as staticColors } from '../../components/theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | ''>('');
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const passwordInputRef = useRef<TextInput>(null);

  const handleAuth = async () => {
    // Clear any previous errors
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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      setErrorType('email');
      return;
    }

    // Validate password length
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
        // Use warn instead of error to avoid red error overlay in dev
        console.warn('[Login] Auth error:', error);
        
        // Handle specific error cases
        let errorMsg = (error instanceof Error ? error.message : (error as any)?.message) || 'An unknown error occurred';
        
        if (errorMsg.includes('Invalid login credentials')) {
          // For invalid credentials, we can't distinguish between wrong email and wrong password
          // due to security reasons. Show a generic message.
          setErrorMessage('Invalid email or password. Please check your credentials and try again.');
          setErrorType('general');
        } else if (errorMsg.includes('already registered')) {
          setErrorMessage('This email is already registered. Please sign in instead.');
          setErrorType('email');
        } else if (errorMsg.includes('Email not confirmed')) {
          setErrorMessage('Please check your email and confirm your account before signing in.');
          setErrorType('email');
        } else if (errorMsg.includes('Too many requests')) {
          setErrorMessage('Too many login attempts. Please wait a moment and try again.');
          setErrorType('general');
        } else if (errorMsg.includes('network') || errorMsg.includes('Network')) {
          setErrorMessage('Network error. Please check your connection and try again.');
          setErrorType('general');
        } else {
          // Make error message more user-friendly
          setErrorMessage('Unable to sign in. Please check your credentials and try again.');
          setErrorType('general');
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
            // Add timeout protection to prevent hanging
            let dbProfile: any = null;
            try {
              const profileResult = await Promise.race([
                supabase
                  .from('profiles')
                  .select('first_name,bio,photos,interests')
                  .eq('user_id', authUserId)
                  .single(),
                new Promise((resolve) =>
                  setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)
                ) as Promise<any>
              ]);
              dbProfile = (profileResult as any)?.data || null;
            } catch (err) {
              console.warn('[Login] Error or timeout checking profile for routing:', err);
              dbProfile = null;
            }

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
    // Clear any previous errors
    setErrorMessage('');
    setErrorType('');
    
    if (!email) {
      setErrorMessage('Please enter your email address');
      setErrorType('email');
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailNormalized, {
        redirectTo: 'https://zfnwtnqwokwvuxxwxgsr.supabase.co/auth/v1/verify'
      });

      if (error) {
        console.log('Password reset error:', error);
        if (error.message.includes('user not found')) {
          setErrorMessage('This email is not registered. Please sign up instead.');
          setErrorType('email');
        } else {
          setErrorMessage(error.message || 'Unknown error');
          setErrorType('general');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
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
            <TextInput
              style={[styles.input, errorType === 'email' && styles.inputError]}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorType === 'email') {
                  setErrorMessage('');
                  setErrorType('');
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!loading}
              onSubmitEditing={() => {
                passwordInputRef.current?.focus();
              }}
            />
            
            {errorType === 'email' && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
            
            {!isForgotPassword && (
              <>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, errorType === 'password' && styles.inputError]}
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorType === 'password') {
                      setErrorMessage('');
                      setErrorType('');
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  editable={!loading}
                  onSubmitEditing={handleAuth}
                />
                
                {errorType === 'password' && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}
              </>
            )}

            {errorType === 'general' && (
              <Text style={styles.errorText}>{errorMessage}</Text>
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
  errorText: {
    color: staticColors.error,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  inputError: {
    borderColor: staticColors.error,
    borderWidth: 1.5,
  },
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
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
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: staticColors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: staticColors.surface,
    borderWidth: 1.5,
    borderColor: staticColors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    color: staticColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  resetSentContainer: {
    backgroundColor: `${staticColors.success}20`,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resetSentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: staticColors.success,
    marginBottom: 8,
  },
  resetSentSubtext: {
    fontSize: 14,
    color: staticColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  resetBackLink: {
    color: staticColors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
});