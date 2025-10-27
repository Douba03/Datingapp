# 🚀 Quick Start Guide - What to Build First

## TL;DR - Start Here 👇

**Your app is 70% complete** but **missing critical user-facing features**.

**Build This First (Next 2 Weeks):**
1. Profile Creation & Editing
2. Photo Upload System
3. Onboarding Flow

**Why?** Users can't actually use your app without these core features.

---

## ⚡ Immediate Priority: Profile System

### What to Build:
```
📱 Onboarding Wizard
   ├── Welcome Screen
   ├── Account Setup
   ├── Profile Creation (step-by-step)
   │   ├── Basic Info (name, DOB, gender)
   │   ├── Photos (upload 3-6 photos)
   │   ├── Bio & About Me
   │   ├── Interests & Values
   │   └── Preferences (who you're looking for)
   └── Tutorial/Walkthrough
```

### Implementation Checklist:

#### Week 1: Onboarding + Basic Profile
- [ ] Create onboarding screens (4-5 screens)
- [ ] Build multi-step form component
- [ ] Implement photo picker (Expo Image Picker)
- [ ] Set up Supabase Storage for images
- [ ] Create profile creation flow
- [ ] Add form validation
- [ ] Connect to real database (replace mock data)

#### Week 2: Photo Upload + Polish
- [ ] Implement photo upload to Supabase Storage
- [ ] Add image compression/optimization
- [ ] Build photo gallery/editor
- [ ] Create profile preview screen
- [ ] Add edit profile functionality
- [ ] Test entire flow
- [ ] Fix bugs and polish UI

---

## 📁 Files You'll Need to Create/Modify

### New Files to Create:
```
src/app/(onboarding)/
  ├── _layout.tsx
  ├── welcome.tsx
  ├── account-setup.tsx
  ├── profile-creation.tsx
  ├── photo-upload.tsx
  └── preferences.tsx

src/components/profile/
  ├── PhotoPicker.tsx
  ├── PhotoGallery.tsx
  ├── ProfileForm.tsx
  └── InterestSelector.tsx

src/hooks/
  └── useProfile.ts (for profile CRUD operations)

src/services/
  └── storage.ts (for image upload)
```

### Existing Files to Modify:
```
src/app/(auth)/login.tsx
  └── Redirect to onboarding if !onboarding_completed

src/app/(tabs)/profile.tsx
  └── Add edit functionality

src/hooks/useAuth.ts
  └── Remove mock profile data, fetch real data

src/services/supabase/client.ts
  └── Add storage configuration
```

---

## 🎯 After Profile System is Done

### Next Priority: Focus Timer ⭐

**This is your unique selling point!**

Build a Pomodoro-style focus timer that rewards users with swipes:

```typescript
Focus Session Flow:
1. User starts 25-min focus timer
2. Timer runs, app locks (focus mode)
3. On completion → Reward +5 swipes
4. Track session in database
5. Show stats and insights
```

**Why it matters:**
- Differentiates from ALL other dating apps
- Creates unique value proposition
- Builds productive habits
- Increases daily engagement

---

## 🛠️ Technical Setup Needed

### 1. Supabase Storage (for photos)

```typescript
// In Supabase Dashboard:
// 1. Go to Storage
// 2. Create bucket: "profile-photos"
// 3. Set it to "public"
// 4. Add RLS policies:

// Allow authenticated users to upload
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

// Allow anyone to view photos
CREATE POLICY "Public photos are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');
```

### 2. Update Profiles Table

```sql
-- Make sure profiles table exists and is properly connected
-- Run this in Supabase SQL Editor:

-- Update profiles to use real data
ALTER TABLE profiles
ALTER COLUMN photos SET DEFAULT ARRAY[]::TEXT[];

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
```

### 3. Install Required Packages

```bash
# Image picker
npx expo install expo-image-picker

# Image manipulation (compression)
npx expo install expo-image-manipulator

# File system access
npx expo install expo-file-system
```

---

## 📝 Code Templates to Get Started

### Photo Upload Hook

```typescript
// src/hooks/usePhotoUpload.ts
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase/client';

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 5],
      quality: 0.8,
      selectionLimit: 6,
    });

    if (!result.canceled) {
      return result.assets;
    }
    return [];
  };

  const uploadPhoto = async (userId: string, uri: string, index: number) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${userId}/photo_${index}_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { pickImage, uploadPhoto, uploading };
}
```

### Profile Creation Screen

```typescript
// src/app/(onboarding)/profile-creation.tsx
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

export default function ProfileCreation() {
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    // Validate inputs
    if (!firstName || !dateOfBirth || !gender) {
      alert('Please fill all required fields');
      return;
    }

    // Create profile
    const { error } = await updateProfile({
      first_name: firstName,
      date_of_birth: dateOfBirth,
      gender: gender as any,
      bio: bio || '',
    });

    if (error) {
      alert('Error creating profile');
      return;
    }

    // Continue to photo upload
    router.push('/(onboarding)/photo-upload');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>
      
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      
      {/* Add more inputs */}
      
      <Button title="Continue" onPress={handleSubmit} />
    </View>
  );
}
```

---

## 🎨 Design Tips

### Profile Photo Requirements:
- Minimum 3 photos
- Maximum 9 photos
- Aspect ratio: 4:5 (portrait)
- Max file size: 5MB
- Formats: JPG, PNG

### Onboarding Best Practices:
- Keep it under 5 screens
- Show progress indicator
- Allow skipping non-essential steps
- Request permissions at point of use
- Celebrate completion

---

## ✅ Definition of Done

Before moving to next feature, ensure:

- [ ] Users can complete entire onboarding flow
- [ ] Profile data saves to database correctly
- [ ] Photos upload and display properly
- [ ] Profile editing works
- [ ] Existing users see their real profile data
- [ ] No console errors
- [ ] UI is polished and smooth
- [ ] Loading states are implemented
- [ ] Error handling is graceful

---

## 🐛 Common Issues You'll Face

### Issue 1: Mock Data Still Showing
**Fix:** Remove mock data from `useAuth.ts` and fetch from database

### Issue 2: Images Not Uploading
**Fix:** Check Supabase Storage policies and bucket settings

### Issue 3: Profile Not Updating
**Fix:** Verify RLS policies allow authenticated users to update their profiles

### Issue 4: Onboarding Shows for Existing Users
**Fix:** Check `onboarding_completed` flag in database

---

## 📞 Need Help?

Check these resources:
- **Expo Image Picker:** https://docs.expo.dev/versions/latest/sdk/imagepicker/
- **Supabase Storage:** https://supabase.com/docs/guides/storage
- **React Native Forms:** https://react-hook-form.com/

---

## 🎯 Success Metrics

After completing this phase, you should see:
- ✅ 80%+ profile completion rate
- ✅ Users can fully customize profiles
- ✅ App feels like a real product
- ✅ Ready to onboard beta testers

---

**Time Estimate:** 10-14 days (working full-time)

**Difficulty:** Medium

**Impact:** ⭐⭐⭐⭐⭐ (Critical)

---

Ready to start? Open the detailed plan in `APP_OPTIMIZATION_PLAN.md` for the full roadmap! 🚀
