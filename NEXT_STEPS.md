# 🎯 Next Steps - What to Do Now

**Status:** Onboarding UI Complete ✅  
**Next:** Connect to Database and Make it Functional

---

## ✅ What We Just Built

You now have a **complete Tinder-style onboarding flow** with 8 beautiful screens:

1. ✅ Welcome Screen
2. ✅ Basic Info (name, DOB, gender)
3. ✅ Photos Upload (2-6 photos)
4. ✅ Bio Writing
5. ✅ Interests Selection  
6. ✅ Preferences Setup
7. ✅ Location Permission
8. ✅ Completion Screen

**All UI is done!** The forms work, navigation is smooth, and it looks great! 🎉

---

## 🚀 Test It Right Now!

### Quick Test:

1. **Start your app:**
   ```bash
   npm start
   ```

2. **Create a new account:**
   - Go to login screen
   - Click "Sign Up"
   - Enter email and password
   - You'll be redirected to onboarding! 🎊

3. **Walk through the flow:**
   - Fill in your info
   - Try uploading photos (camera/gallery)
   - Select interests
   - Set preferences
   - Grant location (optional)
   - See the celebration screen!

---

## 🔧 What's Left to Do

### Phase 2: Database Integration (Next 12-18 hours)

#### Task 1: Set up Supabase Storage (1-2 hours)

**In Supabase Dashboard:**

1. Go to Storage → Create bucket: `profile-photos`
2. Make it public
3. Add RLS policies:

```sql
-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view photos
CREATE POLICY "Public photos viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Allow users to delete own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Task 2: Create useProfile Hook (2-3 hours)

Create `src/hooks/useProfile.ts`:

```typescript
import { useState } from 'react';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Upload photo to Supabase Storage
  const uploadPhoto = async (uri: string, index: number) => {
    if (!user) return null;
    
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${user.id}/photo_${index}_${Date.now()}.jpg`;
      
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

  // Save complete profile
  const saveProfile = async (profileData: any) => {
    if (!user) return { error: new Error('No user') };

    try {
      // 1. Create profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: profileData.firstName,
          date_of_birth: profileData.dateOfBirth,
          gender: profileData.gender,
          custom_gender: profileData.customGender,
          bio: profileData.bio,
          photos: profileData.photoUrls,
          city: profileData.city,
          country: profileData.country,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Create preferences
      await supabase
        .from('preferences')
        .insert({
          user_id: user.id,
          seeking_genders: profileData.seekingGenders,
          age_min: profileData.ageMin,
          age_max: profileData.ageMax,
          max_distance_km: profileData.maxDistance,
          relationship_intent: profileData.relationshipIntent,
          interests: profileData.interests,
        });

      // 3. Update user metadata
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    uploading,
    uploadPhoto,
    saveProfile,
  };
}
```

#### Task 3: Create Onboarding Context (2-3 hours)

Create `src/contexts/OnboardingContext.tsx`:

```typescript
import React, { createContext, useContext, useState } from 'react';

interface OnboardingData {
  firstName?: string;
  dateOfBirth?: string;
  gender?: string;
  customGender?: string;
  photos?: string[];
  bio?: string;
  interests?: string[];
  seekingGenders?: string[];
  ageMin?: number;
  ageMax?: number;
  maxDistance?: number;
  relationshipIntent?: string;
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({});

  const updateData = (newData: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const resetData = () => {
    setData({});
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
```

#### Task 4: Update Onboarding Screens (3-4 hours)

In each onboarding screen, replace local state with context:

```typescript
// In basic-info.tsx
import { useOnboarding } from '../../contexts/OnboardingContext';

const { data, updateData } = useOnboarding();

// When user clicks Continue:
updateData({
  firstName,
  dateOfBirth: dateOfBirth?.toISOString(),
  gender,
  customGender,
});
router.push('/(onboarding)/photos');
```

#### Task 5: Complete Screen Integration (2-3 hours)

Update `complete.tsx` to save everything:

```typescript
const handleComplete = async () => {
  setSaving(true);
  try {
    // 1. Upload all photos
    const photoUrls = await Promise.all(
      data.photos?.map((uri, index) => uploadPhoto(uri, index)) || []
    );

    // 2. Save profile with photo URLs
    const { error } = await saveProfile({
      ...data,
      photoUrls: photoUrls.filter(Boolean),
    });

    if (error) throw error;

    // 3. Navigate to main app
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Error', 'Failed to save profile');
  } finally {
    setSaving(false);
  }
};
```

---

## 📝 Implementation Order

### Day 1 (4-6 hours):
- [ ] Set up Supabase Storage
- [ ] Create useProfile hook
- [ ] Create OnboardingContext
- [ ] Test photo upload

### Day 2 (4-6 hours):
- [ ] Update all onboarding screens to use context
- [ ] Implement complete screen integration
- [ ] Test full flow end-to-end

### Day 3 (4-6 hours):
- [ ] Add profile editing to profile tab
- [ ] Bug fixes and error handling
- [ ] Polish and optimize

---

## 🧪 Testing Plan

### Manual Testing:
1. Create new account
2. Complete onboarding
3. Check database for profile
4. Check Storage for photos
5. Login again (should skip onboarding)
6. Edit profile
7. Verify changes saved

### Check in Supabase:
- profiles table has new row
- preferences table has new row
- profile-photos bucket has images
- users.user_metadata.onboarding_completed = true

---

## 🐛 Common Issues & Solutions

### Issue: Photos not uploading
**Solution:** Check Supabase Storage policies and bucket permissions

### Issue: Profile not saving
**Solution:** Check RLS policies on profiles/preferences tables

### Issue: Onboarding shows for existing users
**Solution:** Check user_metadata.onboarding_completed flag

### Issue: Navigation not working
**Solution:** Ensure all routes are defined in _layout.tsx

---

## 📚 Resources

### Documentation:
- Expo Image Picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Expo Location: https://docs.expo.dev/versions/latest/sdk/location/
- Supabase Storage: https://supabase.com/docs/guides/storage
- React Navigation: https://reactnavigation.org/docs/getting-started

### Code Examples:
- All onboarding screens are in `src/app/(onboarding)/`
- Check each file for implementation details
- See comments for explanations

---

## 🎯 Success Criteria

Before moving to next feature:
- [ ] Users can complete onboarding
- [ ] Photos upload successfully
- [ ] Profile saves to database
- [ ] Can edit profile later
- [ ] No console errors
- [ ] Smooth navigation
- [ ] Good error messages

---

## 💬 Questions?

### Need Help?
1. Check the implementation in each onboarding file
2. Review ONBOARDING_IMPLEMENTATION_SUMMARY.md
3. Check console logs for errors
4. Test in Supabase dashboard

### Want to Optimize?
- Add loading skeletons
- Improve error messages
- Add animations
- Implement image compression
- Add offline support

---

## 🚀 After This is Done

### Next Features to Build:
1. **Focus Timer** (your unique feature!)
2. **Push Notifications**
3. **AI Icebreakers**
4. **Profile Verification**
5. **Premium Features**

See `APP_OPTIMIZATION_PLAN.md` for full roadmap!

---

**You're making amazing progress! 🎊**

The UI is beautiful and functional. Now we just need to connect it to the database and you'll have a fully working onboarding system!

Ready to continue? Let me know which task you want to tackle first! 💪
