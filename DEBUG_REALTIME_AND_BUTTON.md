# 🔍 Debug Guide: Real-time & "Not What I'm Looking For" Button

## Problem 1: Profiler uppdateras inte förrän man refreshar
## Problem 2: "Not What I'm Looking For" knappen gör ingenting

---

## 🚨 **KRITISKA STEG ATT GÖRA NU:**

### Steg 1: Verifiera att `hidden_profiles` tabellen finns

**Kör i Supabase SQL Editor:**
```sql
-- Öppna: sql/check-hidden-profiles-table.sql
-- Kopiera allt och kör
```

**Förväntat resultat:**
- ✅ Tabellen `hidden_profiles` finns
- ✅ Funktionen `hide_profile` finns
- ✅ RLS policies finns

**Om tabellen INTE finns:**
```sql
-- Kör: sql/create-hidden-profiles-table.sql
```

---

### Steg 2: Testa knappen med console logging

**Öppna browser console (F12) och klicka på knappen.**

**Leta efter dessa meddelanden:**

**✅ Om det fungerar:**
```
[handleNotLookingFor] Profile hidden successfully: <user_id>
```

**❌ Om det INTE fungerar:**
```
[handleNotLookingFor] Error hiding profile: ...
```

**Vanliga errors:**

1. **`function hide_profile does not exist`**
   - Lösning: Kör `sql/create-hidden-profiles-table.sql`

2. **`permission denied for function hide_profile`**
   - Lösning: RLS policies saknas, kör SQL-filen igen

3. **`relation "hidden_profiles" does not exist`**
   - Lösning: Tabellen finns inte, kör SQL-filen

4. **Inget error, men inget händer**
   - Lösning: Kolla nästa steg

---

### Steg 3: Debug Real-time Problem

**Problem:** När du skapar en profil syns den inte förrän du refreshar.

**Orsak:** `useRequests` hook uppdaterar inte automatiskt när nya profiler skapas.

**Lösning:** Lägg till real-time subscription för `profiles` tabellen.

---

## 🔧 **FIXES:**

### Fix 1: Lägg till Real-time Subscription för Profiles

**Fil:** `src/hooks/useRequests.ts`

**Lägg till efter rad 44 (efter connection_requests subscription):**

```typescript
// Subscribe to new profiles
const profilesSubscription = supabase
  .channel('profiles-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('[useRequests] New profile created:', payload);
      // Refresh profiles list
      fetchProfiles();
    }
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('[useRequests] Profile updated:', payload);
      // Refresh profiles list
      fetchProfiles();
    }
  )
  .subscribe();
```

**Uppdatera return statement (rad 60-63):**
```typescript
return () => {
  requestSubscription.unsubscribe();
  profilesSubscription.unsubscribe(); // ← Lägg till denna rad
  appStateSubscription.remove();
};
```

---

### Fix 2: Lägg till Real-time för Hidden Profiles

**Samma fil:** `src/hooks/useRequests.ts`

**Lägg till efter profiles subscription:**

```typescript
// Subscribe to hidden profiles changes
const hiddenProfilesSubscription = supabase
  .channel('hidden-profiles-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'hidden_profiles', filter: `user_id=eq.${user.id}` },
    (payload) => {
      console.log('[useRequests] Hidden profiles changed:', payload);
      // Refresh profiles list to remove hidden ones
      fetchProfiles();
    }
  )
  .subscribe();
```

**Uppdatera return statement:**
```typescript
return () => {
  requestSubscription.unsubscribe();
  profilesSubscription.unsubscribe();
  hiddenProfilesSubscription.unsubscribe(); // ← Lägg till denna rad
  appStateSubscription.remove();
};
```

---

### Fix 3: Aktivera Real-time i Supabase

**Gå till Supabase Dashboard:**

1. Välj ditt projekt
2. Klicka **Database** → **Replication**
3. Hitta tabellerna:
   - `profiles`
   - `hidden_profiles`
4. Aktivera **Real-time** för båda

**Eller kör SQL:**
```sql
-- Aktivera real-time för profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Aktivera real-time för hidden_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE hidden_profiles;
```

---

## 🧪 **TESTPLAN:**

### Test 1: Testa "Not What I'm Looking For" knappen

1. **Öppna browser console (F12)**
2. **Gå till Discover feed**
3. **Klicka på "Not What I'm Looking For"** på en profil
4. **Klicka "Confirm"**

**Förväntat resultat:**
```
Console:
[handleNotLookingFor] Profile hidden successfully: abc-123-def

UI:
- Dialog stängs
- Profilen försvinner från feed
- Ingen error visas
```

**Om det inte fungerar:**
- Kolla console för errors
- Kör `sql/check-hidden-profiles-table.sql` för att se om tabellen finns
- Kör `sql/create-hidden-profiles-table.sql` om den saknas

---

### Test 2: Testa Real-time Updates

**Scenario A: Ny profil skapas**

1. **Öppna två browser tabs:**
   - Tab 1: Inloggad som User A (på Discover feed)
   - Tab 2: Skapa ny användare (User B)

2. **I Tab 2:** Gå igenom onboarding och skapa profil

3. **I Tab 1:** Profilen ska dyka upp automatiskt (inom 1-2 sekunder)

**Förväntat resultat:**
```
Console i Tab 1:
[useRequests] New profile created: { new: { user_id: '...', first_name: 'User B', ... } }
[useRequests] Fetching profiles...

UI i Tab 1:
- User B's profil dyker upp i feed
```

**Om det inte fungerar:**
- Kolla att real-time är aktiverat i Supabase
- Kolla console för subscription errors
- Verifiera att subscriptions är korrekt uppsatta

---

**Scenario B: Profil döljs**

1. **I Tab 1:** Klicka "Not What I'm Looking For" på en profil
2. **Profilen ska försvinna omedelbart**

**Förväntat resultat:**
```
Console:
[handleNotLookingFor] Profile hidden successfully: xyz-789
[useRequests] Hidden profiles changed: { eventType: 'INSERT', ... }
[useRequests] Fetching profiles...

UI:
- Profilen försvinner från feed
```

---

## 📊 **VERIFIERING:**

### Verifiera att knappen fungerar:

**Kör i Supabase SQL Editor:**
```sql
-- Se alla dolda profiler
SELECT 
  h.id,
  h.user_id,
  h.hidden_user_id,
  h.reason,
  h.created_at,
  u1.first_name as user_name,
  u2.first_name as hidden_profile_name
FROM hidden_profiles h
LEFT JOIN profiles u1 ON h.user_id = u1.user_id
LEFT JOIN profiles u2 ON h.hidden_user_id = u2.user_id
ORDER BY h.created_at DESC;
```

**Om du ser rader här efter att ha klickat knappen = ✅ Fungerar!**

---

### Verifiera Real-time:

**Kör i Supabase SQL Editor:**
```sql
-- Kolla vilka tabeller som har real-time aktiverat
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

**Du ska se:**
- `profiles`
- `hidden_profiles`
- `connection_requests`

---

## 🆘 **TROUBLESHOOTING:**

### Problem: Knappen gör ingenting

**Debug steg:**
1. Öppna console (F12)
2. Klicka på knappen
3. Ser du `[handleNotLookingFor]` meddelanden?

**Om NEJ:**
- Knappen är inte kopplad korrekt
- Kolla att `onNotLookingFor` prop skickas till `ProfileFeedItem`

**Om JA men error:**
- Kolla error meddelandet
- Troligen saknas tabell eller function

---

### Problem: Profiler uppdateras inte real-time

**Debug steg:**
1. Öppna console (F12)
2. Leta efter subscription meddelanden:
   ```
   [useRequests] Request change: ...
   [useRequests] New profile created: ...
   ```

**Om du INTE ser dessa:**
- Real-time är inte aktiverat i Supabase
- Subscriptions är inte korrekt uppsatta
- Kör Fix 1 och Fix 2 ovan

**Om du SER dessa men feed uppdateras inte:**
- `fetchProfiles()` anropas inte
- Kolla att callback anropar `fetchProfiles()`

---

### Problem: "function hide_profile does not exist"

**Lösning:**
```sql
-- Kör i Supabase SQL Editor
-- Öppna: sql/create-hidden-profiles-table.sql
-- Kopiera allt och kör
```

---

### Problem: "permission denied"

**Lösning:**
```sql
-- Kolla RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'hidden_profiles';

-- Om inga policies finns, kör:
-- sql/create-hidden-profiles-table.sql
```

---

## ✅ **SAMMANFATTNING:**

### För att fixa båda problemen:

1. **Kör SQL:**
   - `sql/check-hidden-profiles-table.sql` (verifiera)
   - `sql/create-hidden-profiles-table.sql` (om tabell saknas)

2. **Aktivera Real-time:**
   - Supabase Dashboard → Database → Replication
   - Aktivera för `profiles` och `hidden_profiles`

3. **Lägg till Subscriptions:**
   - Fix 1: Profiles subscription
   - Fix 2: Hidden profiles subscription

4. **Testa:**
   - Klicka "Not What I'm Looking For" → Ska fungera
   - Skapa ny profil → Ska dyka upp automatiskt

---

**Nästa steg:** Kör `sql/check-hidden-profiles-table.sql` och dela resultatet!
