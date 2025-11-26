# ⚡ Environment Variables - Quick Reference

## ✅ **Current Status**

Both environment files are set up:
- ✅ `.env.local` - For local development
- ✅ `.env` - For EAS builds

---

## 📝 **How It Works**

### **Local Development** (`npm start`, `expo start`)
- Uses: **`.env.local`** (if exists) → `.env` (fallback)
- File: `.env.local`
- Location: Project root

### **EAS Builds** (`eas build`)
- Uses: **EAS Secrets** (if set) → **`.env`** (fallback)
- File: `.env`
- Location: Project root

---

## 🔧 **What You Need**

Both files should have:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🚀 **Before Building**

**Always check:**
```bash
# Verify .env exists
ls .env

# Verify .env.local exists (for local dev)
ls .env.local
```

**Then build:**
```bash
eas build --platform android
```

---

## 🔐 **For Production (Recommended)**

Use EAS Secrets instead of `.env`:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
```

---

## 📚 **Full Guide**

See `ENV_SETUP.md` for complete documentation.

---

**✅ You're all set! Both files are configured!**

