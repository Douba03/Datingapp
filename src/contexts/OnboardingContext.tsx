import React, { createContext, useContext, useState } from 'react';

export interface OnboardingData {
  // Basic Info
  firstName?: string;
  dateOfBirth?: string;
  gender?: string;
  customGender?: string;
  
  // Photos
  photos?: string[];
  
  // Bio
  bio?: string;
  
  // Interests
  interests?: string[];
  
  // Preferences
  seekingGenders?: string[];
  ageMin?: number;
  ageMax?: number;
  maxDistance?: number;
  relationshipIntent?: string;
  
  // Location
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
  
  // Package Selection
  selectedPackage?: 'basic' | 'premium';
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    ageMin: 22,
    ageMax: 35,
    maxDistance: 50,
  });

  const updateData = (newData: Partial<OnboardingData>) => {
    console.log('[OnboardingContext] Updating data:', newData);
    setData(prev => {
      const updated = { ...prev, ...newData };
      console.log('[OnboardingContext] Updated data:', updated);
      return updated;
    });
  };

  const resetData = () => {
    console.log('[OnboardingContext] Resetting data');
    setData({
      ageMin: 22,
      ageMax: 35,
      maxDistance: 50,
    });
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
