import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';
import { colors, shadows } from '../../components/theme/colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

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
  
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // Only logo pulses - simple animation
  const heartScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in on mount
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Subtle pulse for logo only
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
      if (isSignUp) {
        // Sign up flow
        const { data, error } = await signUp(emailNormalized, password);
        
        if (error) {
          let errorMsg = (error instanceof Error ? error.message : (error as any)?.message) || 'An unknown error occurred';
          if (errorMsg.includes('already registered')) {
            setErrorMessage('Email already registered. Sign in instead.');
            setErrorType('email');
          } else {
            setErrorMessage(errorMsg);
            setErrorType('general');
          }
        } else if (data?.user?.identities?.length === 0) {
          Alert.alert('Signup Failed', 'This email is already registered.');
        } else {
          // New user - go to onboarding
          router.replace('/(onboarding)/welcome');
        }
      } else {
        // Sign in flow
        const result = await signIn(emailNormalized, password);
        const { data, error, needsOnboarding } = result as any;

        if (error) {
          let errorMsg = (error instanceof Error ? error.message : (error as any)?.message) || 'An unknown error occurred';
          
          if (errorMsg.includes('Invalid login credentials')) {
            setErrorMessage('Invalid email or password');
            setErrorType('general');
          } else {
            setErrorMessage(errorMsg);
            setErrorType('general');
          }
        } else if (needsOnboarding) {
          // User exists in auth but no profile - show message then go to onboarding
          if (Platform.OS === 'web') {
            window.alert('Welcome! Your account exists but you haven\'t completed your profile yet. Let\'s set it up!');
          } else {
            Alert.alert(
              'Complete Your Profile',
              'Welcome! Your account exists but you haven\'t completed your profile yet. Let\'s set it up!',
              [{ text: 'Continue', onPress: () => router.replace('/(onboarding)/welcome') }]
            );
            return; // Don't navigate yet, wait for alert button
          }
          router.replace('/(onboarding)/welcome');
        } else if (data?.user?.id) {
          // Existing user with profile - check if onboarding completed
          let dbProfile: any = null;
          try {
            const profileResult = await Promise.race([
              supabase.from('profiles').select('first_name,bio,photos,interests').eq('user_id', data.user.id).single(),
              new Promise((resolve) => setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 5000)) as Promise<any>
            ]);
            dbProfile = (profileResult as any)?.data || null;
          } catch (err) {
            dbProfile = null;
          }

          const emailPrefix = (emailNormalized || '').split('@')[0];
          const hasCompletedOnboarding = !!dbProfile && (
            (dbProfile.first_name && dbProfile.first_name !== emailPrefix) ||
            (dbProfile.bio && dbProfile.bio.length > 0) ||
            (Array.isArray(dbProfile.photos) && dbProfile.photos.length > 0) ||
            (Array.isArray(dbProfile.interests) && dbProfile.interests.length > 0)
          );

          router.replace(hasCompletedOnboarding ? '/(tabs)' : '/(onboarding)/welcome');
        } else {
          router.replace('/');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    setErrorType('');
    
    if (!email) {
      setErrorMessage('Please enter your email');
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
        if (error.message.includes('user not found')) {
          setErrorMessage('Email not registered. Sign up instead.');
          setErrorType('email');
        } else {
          setErrorMessage(error.message || 'Unknown error');
          setErrorType('general');
        }
      } else {
        setResetSent(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDF8F8', '#FFF0F5', '#FAF0FF', '#FDF8F8']}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Logo - only this one has animation */}
            <View style={styles.brandContainer}>
              <Animated.View style={[styles.logoCircle, { transform: [{ scale: heartScale }] }]}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.logoGradient}>
                  <Text style={styles.logoEmoji}>💕</Text>
                </LinearGradient>
              </Animated.View>
              <Text style={styles.brandName}>Partner</Text>
              <Text style={styles.tagline}>Find your perfect match ✨</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.title}>
                {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isForgotPassword ? 'Enter your email' : isSignUp ? 'Join us today 💕' : 'Sign in to continue'}
              </Text>

              <View style={styles.form}>
                {/* Email */}
                <View style={[styles.inputContainer, errorType === 'email' && styles.inputContainerError]}>
                  <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={colors.textLight}
                    value={email}
                    onChangeText={(text) => { setEmail(text); if (errorType === 'email') { setErrorMessage(''); setErrorType(''); }}}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                {errorType === 'email' && (
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                )}
                
                {/* Password */}
                {!isForgotPassword && (
                  <>
                    <View style={[styles.inputContainer, errorType === 'password' && styles.inputContainerError]}>
                      <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.textLight}
                        value={password}
                        onChangeText={(text) => { setPassword(text); if (errorType === 'password') { setErrorMessage(''); setErrorType(''); }}}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    
                    {errorType === 'password' && (
                      <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                    )}
                  </>
                )}

                {errorType === 'general' && (
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                )}
                
                {/* Submit Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.buttonGradient}>
                    <Text style={styles.primaryButtonText}>
                      {loading ? '...' : isForgotPassword ? 'Send Link' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {resetSent ? (
                  <View style={styles.resetSentContainer}>
                    <Text style={styles.resetSentText}>✅ Reset link sent!</Text>
                    <Text style={styles.resetSentSubtext}>Check your email</Text>
                    <TouchableOpacity onPress={() => { setIsForgotPassword(false); setResetSent(false); }}>
                      <Text style={styles.linkText}>← Back to login</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.switchButton}
                      onPress={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setErrorMessage(''); setErrorType(''); }}
                    >
                      <Text style={styles.switchText}>
                        {isSignUp ? 'Have an account? ' : 'New here? '}
                        <Text style={styles.switchTextBold}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                      </Text>
                    </TouchableOpacity>
                    
                    {!isSignUp && !isForgotPassword && (
                      <TouchableOpacity style={styles.forgotButton} onPress={() => setIsForgotPassword(true)}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                      </TouchableOpacity>
                    )}
                    
                    {isForgotPassword && (
                      <TouchableOpacity style={styles.forgotButton} onPress={() => setIsForgotPassword(false)}>
                        <Text style={styles.linkText}>← Back to login</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: isSmallDevice ? 70 : 80,
    height: isSmallDevice ? 70 : 80,
    borderRadius: isSmallDevice ? 35 : 40,
    ...shadows.glow,
    marginBottom: 12,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: isSmallDevice ? 32 : 38,
  },
  brandName: {
    fontSize: isSmallDevice ? 28 : 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: isSmallDevice ? 20 : 24,
    width: '100%',
    maxWidth: 380,
    ...shadows.medium,
  },
  title: {
    fontSize: isSmallDevice ? 22 : 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    marginRight: -6,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: -4,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    ...shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  forgotText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  resetSentContainer: {
    backgroundColor: `${colors.success}15`,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  resetSentText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  resetSentSubtext: {
    fontSize: 13,
    color: colors.text,
    marginTop: 4,
    marginBottom: 10,
  },
});
