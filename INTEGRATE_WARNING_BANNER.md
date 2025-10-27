# 🔧 How to Integrate Warning Banner (When Ready)

## Issue

The `WarningBanner` component was causing a white screen when added directly to the tabs layout.

## Current Status

- ✅ WarningBanner component created (`src/components/warnings/WarningBanner.tsx`)
- ✅ Database tables and functions ready
- ✅ Admin warn functionality working
- ⚠️ Banner temporarily removed from layout to fix white screen

## How to Integrate (Option 1: Individual Screens)

Instead of adding to the layout, add the banner to each screen individually:

### Discover Screen (`src/app/(tabs)/index.tsx`)

```tsx
import { WarningBanner } from '@/components/warnings/WarningBanner';

export default function DiscoverScreen() {
  return (
    <View style={{ flex: 1 }}>
      <WarningBanner />
      {/* Rest of your screen content */}
    </View>
  );
}
```

### Matches Screen (`src/app/(tabs)/matches.tsx`)

```tsx
import { WarningBanner } from '@/components/warnings/WarningBanner';

export default function MatchesScreen() {
  return (
    <View style={{ flex: 1 }}>
      <WarningBanner />
      {/* Rest of your screen content */}
    </View>
  );
}
```

### Profile Screen (`src/app/(tabs)/profile.tsx`)

```tsx
import { WarningBanner } from '@/components/warnings/WarningBanner';

export default function ProfileScreen() {
  return (
    <ScrollView>
      <WarningBanner />
      {/* Rest of your screen content */}
    </ScrollView>
  );
}
```

## How to Integrate (Option 2: Root Layout)

Add to the root `_layout.tsx` instead:

### `src/app/_layout.tsx`

```tsx
import { WarningBanner } from '@/components/warnings/WarningBanner';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <WarningBanner />
      <Stack>
        {/* Your stack screens */}
      </Stack>
    </View>
  );
}
```

## How to Integrate (Option 3: SafeAreaView Wrapper)

Create a wrapper component:

### `src/components/layout/ScreenWrapper.tsx`

```tsx
import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { WarningBanner } from '../warnings/WarningBanner';

export function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      <WarningBanner />
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
```

Then use it in your screens:

```tsx
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function DiscoverScreen() {
  return (
    <ScreenWrapper>
      {/* Your screen content */}
    </ScreenWrapper>
  );
}
```

## Testing Before Integration

Before adding back to the app, test the component in isolation:

### Create a test screen:

```tsx
// src/app/test-warning.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { WarningBanner } from '@/components/warnings/WarningBanner';
import { supabase } from '@/services/supabase/client';

export default function TestWarningScreen() {
  const createTestWarning = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_warnings').insert({
      user_id: user.id,
      reason: 'Test warning - this is a test',
      severity: 'warning',
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <WarningBanner />
      <View style={{ padding: 20 }}>
        <Text>Test Warning Banner</Text>
        <Button title="Create Test Warning" onPress={createTestWarning} />
      </View>
    </View>
  );
}
```

Navigate to this screen and test if the banner works.

## Debugging White Screen

If you get a white screen again:

1. **Check console for errors**:
   ```bash
   # Look for errors in the terminal where npm start is running
   ```

2. **Check component imports**:
   - Make sure all imports are correct
   - Check that `@/components/warnings/WarningBanner` path is valid

3. **Check for missing dependencies**:
   - The component uses `Ionicons` from `@expo/vector-icons`
   - Make sure it's installed

4. **Simplify the component**:
   - Comment out the real-time subscription temporarily
   - Test with just the banner UI

5. **Check auth context**:
   - Make sure `useAuth()` is available
   - Component might fail if auth context is not ready

## Recommended Approach

For now, I recommend **Option 1** (add to individual screens) because:
- ✅ More control over where banner appears
- ✅ Easier to debug
- ✅ Can test one screen at a time
- ✅ Less likely to cause layout issues

## When You're Ready

1. First, run the SQL migration: `sql/create-user-warnings.sql`
2. Test the admin warn functionality
3. Add the banner to ONE screen first (e.g., Discover)
4. Test thoroughly
5. If it works, add to other screens
6. If you get white screen, check console and remove it

## Alternative: Simpler Banner

If the full component is too complex, create a simpler version first:

```tsx
// src/components/warnings/SimpleWarningBanner.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function SimpleWarningBanner() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchCount = async () => {
      const { count } = await supabase
        .from('user_warnings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('acknowledged', false);
      
      setCount(count || 0);
    };

    fetchCount();
  }, [user]);

  if (count === 0) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ You have {count} warning(s)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F59E0B',
    padding: 12,
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontWeight: '600',
  },
});
```

This simpler version:
- ✅ No modal (less complex)
- ✅ No real-time (less likely to cause issues)
- ✅ Just shows count
- ✅ Easier to debug

Test this first, then upgrade to the full version later.

## Summary

**Current state**: App works, banner removed temporarily
**To integrate**: Add to individual screens (Option 1)
**Test first**: Create test screen or use simpler version
**When ready**: Run SQL migration, then add banner back

