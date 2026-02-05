# ✅ Profile Matching Checklist

## Problem: Säkerställa att profiler sparas korrekt och matchar rätt kön

---

## 📋 **Vad jag har verifierat:**

### 1. **Onboarding Data Sparas Korrekt** ✅

**Fil:** `src/app/(onboarding)/complete.tsx`

**Vad som sparas:**
```typescript
// PROFILE DATA
- user_id
- first_name
- date_of_birth
- gender ✅ (man/woman/prefer_not_to_say)
- bio
- photos
- location, city, country
- age (beräknas automatiskt)
- religious_practice
- education_level
- occupation
- has_children, wants_children
- ethnicity, languages
- tribe_clan

// PREFERENCES DATA
- user_id
- seeking_genders ✅ (array: ['man'] eller ['woman'] eller ['man', 'woman'])
- age_min, age_max
- max_distance_km
- relationship_intent
- values
```

**Status:** ✅ Koden sparar både `gender` och `seeking_genders` korrekt

---

### 2. **Matching Logik Fungerar** ✅

**Fil:** `src/hooks/useRequests.ts` (rad 223-234)

```typescript
// Filtrerar profiler baserat på seeking_genders
const currentSeeking = Array.isArray(profile.preferences?.seeking_genders)
  ? profile.preferences.seeking_genders
  : profile.preferences?.seeking_genders
    ? [profile.preferences.seeking_genders]
    : [];

if (currentSeeking.length > 0) {
  filteredProfiles = filteredProfiles.filter(p => 
    currentSeeking.includes(p.gender)  // ✅ Matchar mot gender
  );
}
```

**Exempel:**
- **Man söker kvinna:** `seeking_genders = ['woman']` → Ser bara kvinnor
- **Kvinna söker man:** `seeking_genders = ['man']` → Ser bara män
- **Bi:** `seeking_genders = ['man', 'woman']` → Ser båda

**Status:** ✅ Logiken är korrekt

---

### 3. **Preferences Screen Fungerar** ✅

**Fil:** `src/app/(onboarding)/preferences.tsx`

**Vad som händer:**
1. Användaren väljer kön de söker (Men/Women eller båda)
2. Data sparas i `onboardingData.seekingGenders`
3. Skickas till `complete.tsx` → Supabase `preferences` tabell

**Default beteende:**
- Man → Söker kvinnor automatiskt
- Kvinna → Söker män automatiskt

**Status:** ✅ UI och logik fungerar

---

## ⚠️ **POTENTIELLA PROBLEM:**

### Problem 1: SQL Migrationer Inte Körda

**Risk:** Om `profiles` tabellen saknar kolumner kommer data inte sparas.

**Lösning:** Kör dessa SQL-filer i Supabase SQL Editor:

```sql
-- 1. Skapa users tabell
sql/create-users-table.sql

-- 2. Lägg till profile kolumner
sql/add-profile-columns.sql

-- 3. Skapa preferences tabell (om den inte finns)
-- Kontrollera att den har seeking_genders som TEXT[]
```

**Verifiera:**
```sql
-- Kör i Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('gender', 'age', 'photos', 'bio');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preferences' 
  AND column_name = 'seeking_genders';
```

---

### Problem 2: RLS Policies Blockerar Synlighet

**Risk:** Om RLS policies är för restriktiva kan profiler inte ses av andra.

**Lösning:** Verifiera RLS policies:

```sql
-- Kör i Supabase SQL Editor
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'preferences');
```

**Rätt policies för profiles:**
```sql
-- Users can view all profiles (not just their own)
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### Problem 3: Data Inte Sparad Vid Onboarding

**Symptom:** 
- Profiler syns inte i feed
- Console visar "No profiles found"

**Debug:**
1. Öppna browser console under onboarding
2. Leta efter:
   ```
   [Complete] Saving profile data: {...}
   [Complete] ✅ Profile saved successfully
   [Complete] ✅ Preferences saved successfully
   ```

3. Om du ser errors:
   ```
   [Complete] ❌ Profile save error: ...
   ```
   → Kolla error message för detaljer

**Vanliga errors:**
- `column "gender" does not exist` → Kör `add-profile-columns.sql`
- `permission denied` → Fixa RLS policies
- `null value in column "user_id"` → Auth problem

---

## 🔧 **ÅTGÄRDER ATT GÖRA:**

### Steg 1: Verifiera Databas Schema
```bash
# Kör verification script i Supabase SQL Editor
sql/verify-profile-matching.sql
```

Detta kommer visa:
- ✅ Vilka kolumner som finns
- ✅ RLS policies
- ✅ Sample data
- ✅ Matching test mellan användare

### Steg 2: Kör Saknade Migrationer

Om verification visar saknade kolumner:
```sql
-- I Supabase SQL Editor
\i sql/add-profile-columns.sql
```

### Steg 3: Testa Onboarding Flow

1. **Skapa ny användare (Man):**
   - Välj gender: Man
   - I preferences: Välj "Women"
   - Fyll i resten av onboarding
   - Verifiera i console att data sparas

2. **Skapa ny användare (Kvinna):**
   - Välj gender: Woman
   - I preferences: Välj "Men"
   - Fyll i resten av onboarding
   - Verifiera i console att data sparas

3. **Testa Matching:**
   - Logga in som Man
   - Gå till Discover (/)
   - Du ska BARA se kvinnor
   - Logga in som Kvinna
   - Du ska BARA se män

### Steg 4: Debug Om Det Inte Fungerar

**Kör i Supabase SQL Editor:**
```sql
-- Se alla profiler och deras gender
SELECT user_id, first_name, gender, age 
FROM profiles 
ORDER BY created_at DESC;

-- Se alla preferences och seeking_genders
SELECT p.user_id, prof.first_name, prof.gender, p.seeking_genders
FROM preferences p
LEFT JOIN profiles prof ON p.user_id = prof.user_id;

-- Test matching mellan två användare
SELECT 
  u1.first_name as user1,
  u1.gender as user1_gender,
  pr1.seeking_genders as user1_seeking,
  u2.first_name as user2,
  u2.gender as user2_gender,
  CASE 
    WHEN u2.gender = ANY(pr1.seeking_genders) THEN '✅ MATCH'
    ELSE '❌ NO MATCH'
  END as match_status
FROM profiles u1
JOIN preferences pr1 ON u1.user_id = pr1.user_id
CROSS JOIN profiles u2
WHERE u1.user_id != u2.user_id
LIMIT 10;
```

---

## 📊 **SAMMANFATTNING:**

### Vad som fungerar:
✅ Onboarding sparar `gender` korrekt  
✅ Preferences sparar `seeking_genders` korrekt  
✅ Matching logik filtrerar på `seeking_genders`  
✅ UI för att välja kön finns  

### Vad som kan vara problem:
⚠️ SQL migrationer kanske inte körda  
⚠️ RLS policies kanske för restriktiva  
⚠️ Data kanske inte sparas pga schema errors  

### Nästa steg:
1. Kör `sql/verify-profile-matching.sql` i Supabase
2. Kör `sql/add-profile-columns.sql` om kolumner saknas
3. Testa skapa två användare (man + kvinna)
4. Verifiera att de ser varandra i feed

---

## 🆘 **Om Det Fortfarande Inte Fungerar:**

**Dela denna info:**
1. Output från `verify-profile-matching.sql`
2. Console logs från onboarding (särskilt `[Complete]` meddelanden)
3. Screenshot av Discover feed (visar den profiler eller "No profiles found"?)
4. Vilka kön du testade (man söker kvinna, kvinna söker man, etc.)
