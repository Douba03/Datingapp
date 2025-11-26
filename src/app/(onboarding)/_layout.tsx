import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../contexts/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Prevent back swipe during onboarding
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="basic-info" />
        <Stack.Screen name="photos" />
        <Stack.Screen name="bio" />
        <Stack.Screen name="interests" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="location" />
        <Stack.Screen name="complete" />
        <Stack.Screen name="package-selection" />
        <Stack.Screen name="payment" />
      </Stack>
    </OnboardingProvider>
  );
}
