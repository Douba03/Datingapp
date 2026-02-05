# 🔍 DEBUG: Profile Data Not Showing

## Problem:
Efter onboarding visas inte all information på `/profile` sidan.

## Vad som behöver undersökas:

### 1. Kolla Console Output
**Öppna browser console (F12) när du går igenom onboarding:**

**På varje steg, leta efter:**
```
[OnboardingContext] Updating data: { ... }
[OnboardingContext] Updated data: { ... }
```

**På complete-sidan:**
```
[Complete] Saving profile data: { 
  first_name: "...",
  photos: [...],
  bio: "...",
  religious_practice: "...",
  ... 
}
[Complete] Saving preferences data: {
  seeking_genders: [...],
  age_min: ...,
  age_max: ...,
  ...
}
[Complete] ✅ Profile saved successfully
[Complete] ✅ Preferences saved successfully
```

### 2. Kolla Supabase Table Editor
**Efter onboarding, gå till Supabase Dashboard:**

**Profiles tabell:**
- Finns din profil?
- Har den `photos` array?
- Har den `bio`?
- Har den `religious_practice`?
- Har den `interests`?

**Preferences tabell:**
- Finns din preferences rad?
- Har den `seeking_genders` array?
- Har den `age_min` och `age_max`?

### 3. Kolla Profile Page Load
**När du går till `/profile`, leta efter i console:**
```
[Profile] Loading profile for user: ...
[Profile] Profile data: { ... }
[Profile] Preferences data: { ... }
```

## Vanliga Problem:

### Problem 1: Data sparas inte i onboarding context
**Symptom:** Console visar inte "Updating data" meddelanden

**Lösning:** 
- Kolla att `updateData()` kallas i varje onboarding-steg
- Kolla att OnboardingProvider wrappas runt hela appen

### Problem 2: Data sparas inte i Supabase
**Symptom:** Console visar "Profile save error"

**Möjliga orsaker:**
1. **Kolumner saknas i databasen**
   - Kör: `sql/add-profile-columns.sql`
   
2. **RLS policies blockerar**
   - Kör: `sql/fix-users-table-rls.sql`
   
3. **User inte inloggad**
   - Kolla: `console.log('[Complete] User:', user)`

### Problem 3: Data finns i Supabase men visas inte på profile
**Symptom:** Supabase har data, men `/profile` är tom

**Möjliga orsaker:**
1. **Profile inte refreshad efter onboarding**
   - Kolla att `refreshProfile()` kallas i complete.tsx
   
2. **useAuth hook hämtar inte preferences**
   - Kolla att preferences fetched tillsammans med profile

## Test Script:

### Steg 1: Rensa och starta om
```bash
# Stoppa servern
# Starta igen
npm start
```

### Steg 2: Skapa ny profil med console öppen
1. Öppna browser console (F12)
2. Gå igenom hela onboarding
3. På varje steg, kolla console output
4. Kopiera alla console logs

### Steg 3: Verifiera i Supabase
1. Gå till Supabase Dashboard
2. Table Editor → profiles
3. Hitta din profil (sök efter email)
4. Kolla vilka fält som har data
5. Table Editor → preferences
6. Hitta din preferences rad
7. Kolla vilka fält som har data

### Steg 4: Kolla profile page
1. Gå till `/profile`
2. Kolla console för errors
3. Jämför vad som visas vs vad som finns i Supabase

## Vad jag behöver från dig:

**För att jag ska kunna hjälpa dig, dela:**

1. **Console output från onboarding** (hela flödet)
2. **Screenshot av Supabase profiles tabell** (din rad)
3. **Screenshot av Supabase preferences tabell** (din rad)
4. **Screenshot av `/profile` sidan** (vad som visas)
5. **Console output från `/profile` sidan** (errors?)

## Nästa steg:

1. Testa skapa en ny profil med console öppen
2. Dela console output här
3. Jag fixar problemet baserat på vad som saknas
