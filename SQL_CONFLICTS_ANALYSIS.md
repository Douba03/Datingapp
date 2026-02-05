# 🔴 SQL CONFLICTS ANALYSIS

## ⚠️ PROBLEM: Duplicate Table Definitions

Du har **flera SQL-filer som skapar samma tables**, vilket orsakar konflikter!

---

## 📊 KONFLIKTER IDENTIFIERADE:

### 1. **request_counters** Table - 4 OLIKA FILER! ❌

#### Fil 1: `sql/create-request-counters-table.sql`
```sql
CREATE TABLE IF NOT EXISTS request_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  ...
  UNIQUE(user_id)  -- ← HAR id kolumn
);
```

#### Fil 2: `sql/01-create-request-counters-table.sql`
```sql
CREATE TABLE IF NOT EXISTS request_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  ...
  UNIQUE(user_id)  -- ← HAR id kolumn
);
```

#### Fil 3: `sql/request-counters-setup.sql`
```sql
CREATE TABLE IF NOT EXISTS request_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  ...
  UNIQUE(user_id)  -- ← HAR id kolumn
);
```

#### Fil 4: `supabase/migrations/20250112_connection_requests.sql`
```sql
CREATE TABLE IF NOT EXISTS request_counters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  -- ← INGEN id kolumn!
  remaining INTEGER NOT NULL DEFAULT 10,
  ...
);
```

**KONFLIKT:**
- 3 filer har `id UUID PRIMARY KEY` + `UNIQUE(user_id)`
- 1 fil har `user_id UUID PRIMARY KEY` (ingen id kolumn)
- Detta skapar **schema mismatch**!

---

### 2. **users** Table - 3 OLIKA FILER! ❌

#### Fil 1: `sql/create-users-table.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  ...
);
```

#### Fil 2: `sql/EMERGENCY-FIX-SIGNUP.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,  -- ← INGEN REFERENCES!
  email TEXT,
  auth_provider TEXT DEFAULT 'email',
  ...
);
```

#### Fil 3: `sql/fix-users-table-rls.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  auth_provider TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',
  ...
);
```

**KONFLIKT:**
- Olika foreign key constraints
- Olika kolumner (vissa har `onboarding_completed`, vissa inte)
- Olika NOT NULL constraints

---

## 🔥 VARFÖR DETTA ÄR ETT PROBLEM:

### Problem 1: Schema Mismatch
Om du kör olika SQL-filer i olika ordning får du olika table schemas!

### Problem 2: Duplicate Triggers
Flera filer skapar samma triggers:
- `on_auth_user_created_request_counter`
- `create_request_counter_for_new_user()`

### Problem 3: Duplicate Policies
Flera filer skapar samma RLS policies med samma namn

### Problem 4: Data Inconsistency
Om tabellen redan finns och du kör en annan SQL-fil, kan data bli inkonsistent

---

## ✅ LÖSNING:

### Steg 1: Använd ENDAST Migration Files
**Kör ENDAST dessa filer i denna ordning:**

1. **`supabase/migrations/20250112_connection_requests.sql`**
   - Skapar: `connection_requests`, `request_counters`
   - Detta är den OFFICIELLA migrationen

2. **`sql/create-users-table.sql`**
   - Skapar: `users` table med alla kolumner

3. **`sql/add-profile-columns.sql`**
   - Lägger till: kulturella/religiösa kolumner i `profiles`

4. **`sql/create-hidden-profiles-table.sql`**
   - Skapar: `hidden_profiles` table

5. **`sql/create-user-blocks.sql`**
   - Skapar: `user_blocks` table

---

### Steg 2: TA BORT/IGNORERA Dessa Filer

**TA INTE KÖR:**
- ❌ `sql/create-request-counters-table.sql` (duplicate)
- ❌ `sql/01-create-request-counters-table.sql` (duplicate)
- ❌ `sql/request-counters-setup.sql` (duplicate)
- ❌ `sql/EMERGENCY-FIX-SIGNUP.sql` (incomplete schema)
- ❌ `sql/fix-users-table-rls.sql` (duplicate)

**Dessa är DUPLICATES och skapar konflikter!**

---

## 🎯 MASTER SQL SETUP (Kör i denna ordning):

Jag kommer skapa en **MASTER SQL-fil** som konsoliderar allt korrekt.

---

## 📝 NÄSTA STEG:

1. **Kolla din Supabase databas:**
   - Vilka tables finns redan?
   - Vilket schema har `request_counters`?
   - Har den `id` kolumn eller är `user_id` primary key?

2. **Dela denna info:**
   ```sql
   -- Kör detta i Supabase SQL Editor:
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'request_counters'
   ORDER BY ordinal_position;
   ```

3. **Jag skapar en master SQL-fil** baserat på vad som finns

---

## 🚨 KRITISKT:

**Kör ALDRIG flera SQL-filer som skapar samma table!**

Detta är varför din app har problem - databasen har inkonsistent schema!
