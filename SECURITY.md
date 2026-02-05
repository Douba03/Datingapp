# 🔒 Säkerhetsguide för Calafdoon

## ⚠️ KRITISKT: Skydda Känslig Information

### 1. Miljövariabler (.env filer)

**ALDRIG committa dessa filer till Git:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`

**Vad du ska göra:**
1. Använd `.env.example` som mall
2. Kopiera till `.env.local` och fyll i riktiga värden
3. Verifiera att `.env*` finns i `.gitignore`

### 2. API-nycklar som ALDRIG ska delas

#### Supabase Keys
- ✅ **EXPO_PUBLIC_SUPABASE_ANON_KEY** - OK att exponera (används i frontend)
- ❌ **SUPABASE_SERVICE_ROLE_KEY** - ALDRIG exponera! (endast backend/edge functions)

#### Andra känsliga nycklar
- ❌ Signing keys (.p8, .p12, .key)
- ❌ Keystores (.jks, .keystore)
- ❌ Certificates (.pem, .mobileprovision)

### 3. Kontrollera Git-historik

**OM du redan har committat känsliga filer:**

```bash
# 1. Ta bort från Git (men behåll lokalt)
git rm --cached .env.local .env .env.production

# 2. Lägg till i .gitignore (redan gjort)
# 3. Commit ändringarna
git add .gitignore
git commit -m "Remove sensitive env files from git"

# 4. VIKTIGT: Rotera alla API-nycklar i Supabase!
# Gå till Supabase Dashboard → Settings → API
# Generera nya nycklar och uppdatera .env.local
```

**För att rensa historik (FARLIGT - gör backup först):**
```bash
# Detta skriver om Git-historiken - använd med försiktighet!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local .env .env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (varnar alla teammedlemmar först!)
git push origin --force --all
```

### 4. Supabase RLS (Row Level Security)

**Verifiera att RLS är aktiverat:**
```sql
-- Kör i Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Alla tabeller MÅSTE ha `rowsecurity = true`**

### 5. Expo Secrets (för Production)

**Använd EAS Secrets istället för .env i production:**

```bash
# Sätt secrets för production
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_key"

# Lista alla secrets
eas secret:list
```

### 6. Hardcoded Secrets - ALDRIG göra detta

**❌ DÅLIGT:**
```typescript
const supabaseUrl = "https://zfnwtnqwokwvuxxwxgsr.supabase.co";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**✅ BRA:**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

### 7. Vad är säkert att exponera?

**✅ Säkert (public):**
- Supabase URL
- Supabase Anon Key (med RLS aktiverat)
- Expo Project ID
- App scheme/bundle ID

**❌ ALDRIG exponera:**
- Service Role Key
- Database passwords
- Signing certificates
- Admin credentials
- User tokens/sessions

### 8. Säkerhetskontroll Checklista

- [ ] `.env*` filer finns i `.gitignore`
- [ ] Inga `.env` filer i Git-historiken
- [ ] RLS aktiverat på alla Supabase-tabeller
- [ ] Service Role Key används ENDAST i Edge Functions
- [ ] Inga hardcoded API-nycklar i koden
- [ ] Signing keys (.p8, .jks) är gitignored
- [ ] EAS Secrets konfigurerade för production
- [ ] Admin-funktioner kräver autentisering
- [ ] User input valideras (SQL injection prevention)
- [ ] HTTPS används för alla API-anrop

### 9. Incident Response

**OM en API-nyckel läcker:**

1. **Omedelbart:**
   - Gå till Supabase Dashboard → Settings → API
   - Klicka "Reset" på läckt nyckel
   - Uppdatera `.env.local` med ny nyckel

2. **Inom 24 timmar:**
   - Granska Git-historik för exponering
   - Kontrollera Supabase logs för misstänkt aktivitet
   - Uppdatera alla team-medlemmars `.env.local`

3. **Dokumentera:**
   - När läckan upptäcktes
   - Vilken nyckel som läckte
   - Åtgärder som vidtogs

### 10. Best Practices

1. **Aldrig dela .env filer via:**
   - Email
   - Slack/Discord
   - Screenshots
   - Git

2. **Använd istället:**
   - 1Password/LastPass för team
   - EAS Secrets för CI/CD
   - Supabase Vault för känslig data

3. **Code Review:**
   - Granska varje PR för hardcoded secrets
   - Använd tools som `git-secrets` eller `truffleHog`

4. **Monitoring:**
   - Sätt upp Supabase alerts för ovanlig aktivitet
   - Övervaka API-användning
   - Logga admin-åtgärder

---

## 📞 Support

Om du upptäcker en säkerhetsbrist, kontakta omedelbart:
- Email: security@calafdoon.com
- Supabase Support: https://supabase.com/support
