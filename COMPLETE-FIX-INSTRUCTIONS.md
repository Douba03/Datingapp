# KOMPLETT FIX FÖR ALLA PROBLEM

## Problem som ska lösas:
1. ✅ Profiluppgifter från onboarding sparas men syns inte i profile-sektionen
2. ✅ Man/kvinna ska endast se motsatt kön
3. ⚠️ Messages och requests hänger - kräver reload
4. ⚠️ "Inte det jag söker" knappen fungerar inte
5. ⚠️ Nya profiler syns inte i discover
6. ⚠️ En profil i taget ska visas (inte lista)

---

## STEG 1: Kör SQL-fixen i Supabase

### 1.1 Huvudfix
Gå till **Supabase Dashboard** → **SQL Editor** och kör:
```sql
sql/COMPLETE-APP-FIX.sql
```

Detta fixar:
- ✅ Alla profilkolumner finns
- ✅ Realtime för messages och requests
- ✅ hidden_profiles tabell och funktion
- ✅ swipes och swipe_counters tabeller
- ✅ Index för bättre prestanda

### 1.2 Storage-fix (om fotouppladdning inte fungerar)
Kör också:
```sql
sql/FIX-STORAGE-BUCKET.sql
```

### 1.3 Signup-fix (om nya användare inte kan registrera sig)
Kör:
```sql
sql/COMPLETE-SIGNUP-AND-MATCHING-FIX.sql
```

---

## STEG 2: Verifiera i Supabase Dashboard

### 2.1 Kontrollera Realtime
1. Gå till **Database** → **Replication**
2. Verifiera att dessa tabeller har realtime aktiverat:
   - ✅ messages
   - ✅ connection_requests
   - ✅ matches
   - ✅ profiles

### 2.2 Kontrollera Storage
1. Gå till **Storage**
2. Verifiera att **profile-pictures** bucket finns
3. Kontrollera att den är **Public**

---

## STEG 3: Kodändringar som gjorts

### 3.1 Matchningsalgoritm uppdaterad
**Filer ändrade:**
- `src/hooks/useMatches.ts` - Endast visa motsatt kön
- `src/hooks/useRequests.ts` - Samma logik
- `src/hooks/usePhotoUpload.ts` - Bättre felhantering

**Vad som ändrades:**
- ✅ Man ser ENDAST kvinnor
- ✅ Kvinnor ser ENDAST män
- ✅ Inga andra könsalternativ visas
- ✅ Prioritering baserat på matchande data (kompatibilitetspoäng)
- ✅ Alla profiler med rätt kön visas (inte krav på ömsesidigt intresse)

### 3.2 Profildata sparas korrekt
**Fil:** `src/app/(onboarding)/complete.tsx`

Onboarding sparar nu:
- ✅ Alla grundläggande uppgifter
- ✅ Religiösa och kulturella fält
- ✅ Utbildning och yrke
- ✅ Intressen och värderingar
- ✅ Preferenser (seeking_genders, ålder, avstånd)

---

## STEG 4: Problem som kvarstår att fixa

### 4.1 Messages och Requests hänger
**Orsak:** Realtime-subscriptions fungerar inte korrekt

**Fix:**
1. Kör SQL-fixen (STEG 1.1) - aktiverar realtime
2. Starta om appen helt (kill och starta igen)
3. Om det fortfarande hänger, kontrollera i Supabase Dashboard att realtime är aktiverat

### 4.2 "Inte det jag söker" knappen
**Status:** Funktionen finns i SQL-fixen

**Användning i koden:**
```typescript
// I discover-skärmen
const handleNotLookingFor = async (userId: string) => {
  const { error } = await supabase.rpc('hide_profile', {
    target_user_id: userId,
    reason: 'not_looking_for'
  });
  if (!error) {
    refetch(); // Uppdatera listan
  }
};
```

### 4.3 Visa en profil i taget (Tinder-stil)
**Nuvarande:** Lista med flera profiler
**Önskat:** En profil i taget med swipe-funktionalitet

**Lösning:** Använd swipe-skärmen istället för discover-skärmen:
- Discover (index.tsx) = Lista med requests
- Swipe-skärmen = En profil i taget

---

## STEG 5: Testa appen

### 5.1 Testa signup
1. Skapa ett nytt konto
2. Gå igenom hela onboarding
3. Kontrollera att alla uppgifter sparas
4. Gå till Profile-sektionen
5. Verifiera att alla uppgifter visas

### 5.2 Testa matchning
1. Logga in som man
2. Sätt preferenser till "kvinna"
3. Verifiera att endast kvinnor visas
4. Logga in som kvinna
5. Sätt preferenser till "man"
6. Verifiera att endast män visas

### 5.3 Testa realtime
1. Öppna appen på två enheter
2. Skicka ett meddelande från enhet 1
3. Verifiera att det dyker upp direkt på enhet 2 (utan reload)

---

## VANLIGA PROBLEM OCH LÖSNINGAR

### Problem: Profiler syns inte efter signup
**Lösning:**
1. Kontrollera att `seeking_genders` är satt i preferences
2. Kör SQL-fixen för att säkerställa RLS-policies är korrekta
3. Kontrollera i Supabase Dashboard att profilen finns i `profiles` tabellen

### Problem: Fotouppladdning fungerar inte
**Lösning:**
1. Kör `FIX-STORAGE-BUCKET.sql`
2. Kontrollera att bucket är public
3. Kontrollera att RLS-policies tillåter upload

### Problem: Messages hänger
**Lösning:**
1. Verifiera att realtime är aktiverat för `messages` tabellen
2. Starta om appen
3. Kontrollera att websocket-anslutningen fungerar

---

## NÄSTA STEG

### Prioritet 1: Fixa realtime
- Kör SQL-fixen
- Verifiera i Supabase Dashboard
- Testa med två enheter

### Prioritet 2: Visa en profil i taget
- Skapa ny swipe-komponent
- Implementera Tinder-stil swipe
- Integrera med matchningsalgoritmen

### Prioritet 3: Förbättra UX
- Lägg till laddningsindikatorer
- Förbättra felmeddelanden
- Lägg till success-feedback

---

## SUPPORT

Om problem kvarstår:
1. Kontrollera Supabase logs: Dashboard → Logs
2. Kontrollera app logs i konsolen
3. Verifiera att alla SQL-skript körts utan fel
