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
  ImageBackground,
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
      console.log('========================================');
      console.log(`[Login] 🔐 ${isSignUp ? 'SIGNUP' : 'SIGNIN'} ATTEMPT`);
      console.log('[Login] Email:', emailNormalized);
      console.log('[Login] Is signup:', isSignUp);
      console.log('========================================');
      
      const { data, error } = isSignUp 
        ? await signUp(emailNormalized, password)
        : await signIn(emailNormalized, password);
      
      console.log('========================================');
      console.log('[Login] Auth response received');
      console.log('[Login] Has data:', !!data);
      console.log('[Login] Has error:', !!error);
      console.log('========================================');

      if (error) {
        // Use warn instead of error to avoid red error overlay in dev
        console.warn('[Login] Auth error:', error);
        
        // Handle specific error cases
        let errorMsg = (error instanceof Error ? error.message : (error as any)?.message) || 'An unknown error occurred';
        
        // Log the full error for debugging
        console.log('[Login] Full error details:', JSON.stringify(error, null, 2));
        
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
          // Show the actual error message for debugging
          setErrorMessage(errorMsg || 'Unable to sign in. Please check your credentials and try again.');
          setErrorType('general');
        }
      } else if (isSignUp && data?.user?.identities?.length === 0) {
        // Handle the case where the email is already registered
        Alert.alert('Signup Failed', 'This email is already registered. Please sign in instead.');
      } else {
        console.log('[Login] ✅ Authentication successful!');
        
        // For new signups, always go to onboarding
        // For existing users, _layout.tsx will handle routing based on onboarding_completed
        if (isSignUp) {
          console.log('[Login] New signup → routing to onboarding/welcome');
          router.replace('/(onboarding)/welcome');
        } else {
          console.log('[Login] Existing user → routing to root, _layout will handle');
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
    <ImageBackground
      source={require('../../../assets/images/wedding-couple.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
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
            <Text style={styles.appName}>Calafdoon</Text>
            <Text style={styles.tagline}>Hitta din livskamrat</Text>
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
  </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
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
    backgroundColor: 'transparent',
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});