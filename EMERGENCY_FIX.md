# 🚨 EMERGENCY FIX - Profiler Sparas Inte

## Problem:
1. ❌ Profildata sparas inte (bilder, info)
2. ❌ "Not What I'm Looking For" knappen fungerar inte
3. ❌ Nya profiler syns inte i Discover

## ROOT CAUSE:
**Du har INTE kört SQL-filerna i Supabase!**

Tabellen `hidden_profiles` finns INTE i databasen, vilket betyder att:
- Real-time subscriptions kraschar
- Filtering fungerar inte
- Appen kan inte hämta profiler

---

## ✅ LÖSNING (GÖR DETTA NU):

### Steg 1: Kör SQL i Supabase (KRITISKT)

**A) Skapa hidden_profiles tabell:**
```sql
-- Gå till: https://supabase.com/dashboard
-- Välj ditt projekt
-- SQL Editor → New Query
-- Kopiera HELA innehållet från: sql/create-hidden-profiles-table.sql
-- Klicka RUN
```

**B) Aktivera Real-time:**
```sql
-- Kör detta EFTER steg A:
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE hidden_profiles;
```

### Steg 2: Verifiera Databas Schema

**Kör detta för att se vad som saknas:**
```sql
-- Kolla vilka tabeller som finns
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'preferences', 'hidden_profiles', 'connection_requests');

-- Kolla profiles kolumner
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('gender', 'photos', 'bio', 'age', 'first_name');

-- Kolla preferences kolumner
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'preferences' 
  AND column_name = 'seeking_genders';
```

**Om kolumner saknas, kör:**
```sql
-- Öppna: sql/add-profile-columns.sql
-- Kopiera allt och kör
```

---

## 🔍 DEBUG: Varför Profiler Inte Sparas

### Test 1: Öppna Browser Console (F12)

**När du skapar en profil, leta efter:**

**✅ Om det fungerar:**
```
[Complete] Saving profile data: { user_id: '...', first_name: '...', photos: [...], ... }
[Complete] ✅ Profile saved successfully
[Complete] ✅ Preferences saved successfully
```

**❌ Om det INTE fungerar:**
```
[Complete] ❌ Profile save error: column "gender" does not exist
[Complete] ❌ Profile save error: permission denied
[Complete] ❌ Profile save error: null value in column "user_id"
```

### Test 2: Kolla Supabase Table Editor

**Gå till Supabase Dashboard:**
1. Table Editor → profiles
2. Finns din profil där?
3. Har den `photos`, `gender`, `bio`?

**Om NEJ:**
- Kör `sql/add-profile-columns.sql`
- Kolla RLS policies

---

## 🔧 TEMPORÄR FIX (Tills du kör SQL)

### Ta bort real-time subscriptions som kraschar:

**Fil:** `src/hooks/useRequests.ts`

**Kommentera ut dessa rader (rad 67-78):**
```typescript
// TEMPORÄRT BORTTAGET - Kör SQL först!
/*
const hiddenProfilesSubscription = supabase
  .channel('hidden-profiles-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'hidden_profiles', filter: `user_id=eq.${user.id}` },
    (payload) => {
      console.log('[useRequests] Hidden profiles changed:', payload);
      fetchProfiles();
    }
  )
  .subscribe();
*/
```

**Och rad 97:**
```typescript
return () => {
  requestSubscription.unsubscribe();
  profilesSubscription.unsubscribe();
  // hiddenProfilesSubscription.unsubscribe(); // ← Kommentera ut
  appStateSubscription.remove();
};
```

**Och rad 191:**
```typescript
// Kommentera ut hidden profiles filtering tills tabellen finns
/*
const { data: hiddenProfiles } = await supabase
  .from('hidden_profiles')
  .select('hidden_user_id')
  .eq('user_id', user.id);
*/

// Och rad 207:
// hiddenProfiles?.forEach(h => excludeIds.add(h.hidden_user_id));
```

---

## 🎯 CHECKLISTA:

- [ ] Kör `sql/create-hidden-profiles-table.sql` i Supabase
- [ ] Aktivera real-time för `profiles` och `hidden_profiles`
- [ ] Verifiera att `profiles` tabellen har alla kolumner
- [ ] Testa skapa ny profil med console öppen
- [ ] Kolla att profilen sparas i Supabase Table Editor
- [ ] Testa "Not What I'm Looking For" knappen
- [ ] Verifiera att nya profiler syns i Discover

---

## 📞 NÄSTA STEG:

1. **KÖR SQL-FILERNA** (detta är KRITISKT)
2. **Öppna console** när du skapar profil
3. **Dela console output** om det fortfarande inte fungerar
4. **Dela screenshot** av Supabase Table Editor (profiles tabell)

**Problemet är INTE koden - det är att databasen saknar tabeller/kolumner!**
