# 💎 Premium Feature Implementation Plan

## 🎯 Goal
Add premium package selection during signup WITHOUT breaking existing functionality.

---

## 📋 STEP-BY-STEP IMPLEMENTATION

### **PHASE 1: Database & Backend (2 hours)**

#### Step 1.1: Update Database Schema (30 min)
**File:** Run SQL in Supabase SQL Editor

```sql
-- Add premium tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMP WITH TIME ZONE;

-- Add profile boost column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS incognito_mode BOOLEAN DEFAULT FALSE;

-- Add rewind tracking
ALTER TABLE swipes ADD COLUMN IF NOT EXISTS can_undo BOOLEAN DEFAULT FALSE;

-- Create subscription tracking table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_provider TEXT,
  external_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
```

**✅ Risk:** Very low - just adding columns, existing data safe

---

### **PHASE 2: UI Components (3 hours)**

#### Step 2.1: Create Package Selection Screen (1 hour)
**File:** `src/app/(onboarding)/package-selection.tsx` (NEW)

```typescript
// This will show AFTER complete.tsx, BEFORE going to main app
// Display side-by-side comparison
// Let user choose Basic or Premium
// Store choice in context
```

**What it does:**
- Shows Basic vs Premium comparison
- Two big buttons: "Start Free" and "Go Premium $1.99"
- Beautiful UI with feature checkmarks
- Clicking choice stores in onboarding context
- Then navigates to payment (if premium) or main app (if basic)

**✅ Risk:** Low - new screen, doesn't affect existing flow

---

#### Step 2.2: Update Onboarding Context (30 min)
**File:** `src/contexts/OnboardingContext.tsx`

Add to interface:
```typescript
interface OnboardingData {
  // ... existing fields
  selectedPackage?: 'basic' | 'premium'; // ADD THIS
}
```

**✅ Risk:** Very low - just adding optional field

---

#### Step 2.3: Create Premium Badge Component (30 min)
**File:** `src/components/premium/PremiumBadge.tsx` (NEW)

```typescript
// Reusable badge that shows "PRO" or "Premium" icon
// Used throughout app to indicate premium users
// Gold/purple styling
```

**✅ Risk:** None - pure UI component

---

#### Step 2.4: Create Upgrade Prompt Component (1 hour)
**File:** `src/components/premium/UpgradePrompt.tsx` (NEW)

```typescript
// Modal/popup that suggests premium when:
// - Swipe counter hits 0
// - User wants to see who liked them
// - User wants to undo swipe
// Beautiful design, easy to dismiss or upgrade
```

**✅ Risk:** Low - optional component, doesn't break anything

---

### **PHASE 3: Feature Implementation (4 hours)**

#### Step 3.1: Update Swipe Counter Logic (30 min)
**File:** `src/hooks/useMatches.ts`

**Current code (line 262-265):**
```typescript
const canSwipe = () => {
  if (!swipeCounter) return false;
  return swipeCounter.remaining > 0;
};
```

**Change to:**
```typescript
const canSwipe = () => {
  // Premium users can always swipe
  if (user?.is_premium) return true;
  
  if (!swipeCounter) return false;
  return swipeCounter.remaining > 0;
};
```

**✅ Risk:** Very low - just adding early return, existing logic unchanged

---

#### Step 3.2: Build "See Who Liked You" Screen (1.5 hours)
**File:** `src/app/(tabs)/premium/likes-you.tsx` (NEW)

**What it does:**
- Fetches all users who liked current user (from swipes table)
- Shows list of profiles with photos
- Tap to see profile or swipe back
- Premium gated: shows upgrade prompt if not premium

**Navigation:** 
- Add to tabs: Profile tab → "People Who Liked You" button
- Button shows count badge: "7 people like you!"
- Premium gate: Show upgrade modal if not premium

**✅ Risk:** Low - new screen, doesn't touch existing features

---

#### Step 3.3: Implement Rewind Feature (1 hour)
**File:** `src/hooks/useMatches.ts` (add function)

**New function:**
```typescript
const undoLastSwipe = async () => {
  if (!user?.is_premium) {
    // Show upgrade prompt
    return { error: 'Premium feature' };
  }
  
  // Get last 3 swipes
  // Remove the last one
  // Refresh potential matches
  // Return success
};
```

**UI:** Add undo button in Discover screen (only for premium)
**Button:** "↩️ Undo" - disabled if not premium or no swipes to undo

**✅ Risk:** Low - new feature, doesn't affect existing swipe logic

---

#### Step 3.4: Add Profile Boost Feature (1 hour)
**File:** `src/hooks/useProfile.ts` (add function)

**New function:**
```typescript
const boostProfile = async () => {
  if (!user?.is_premium) {
    // Show upgrade prompt
    return { error: 'Premium feature' };
  }
  
  // Check if boost already used today
  // Set boost_expires_at = NOW() + 1 hour
  // Update database
  // Show success
};
```

**UI:** 
- Add "Boost Profile" button in Profile tab
- Shows: "Boost active for 45 more minutes" or "Use Boost"
- Premium gate: Show upgrade prompt if not premium

**✅ Risk:** Low - new feature, existing profiles unaffected

---

### **PHASE 4: Payment Integration (2 hours)**

#### Step 4.1: Choose Payment Provider
**Options:**
1. **RevenueCat** (Recommended for mobile) - Handles iOS/Android subscriptions
2. **Stripe** - More control, more complex
3. **Supabase Pay** - Built-in, but limited

**Recommendation:** Start with RevenueCat
- Handles iOS App Store / Google Play automatically
- Free tier covers 10,000 subscribers
- Simple API
- Handles renewals, receipts, webhooks

---

#### Step 4.2: Create Payment Service (1 hour)
**File:** `src/services/payments.ts` (NEW)

```typescript
// Service to handle:
// - Check if user has premium
// - Purchase premium
// - Restore purchases
// - Handle subscription status
```

---

#### Step 4.3: Create Payment UI (1 hour)
**File:** `src/app/(onboarding)/payment.tsx` (NEW)

**What it does:**
- Shows after package-selection.tsx if premium chosen
- Displays price: $1.99/month
- "Subscribe" button
- Handles payment flow with RevenueCat
- Shows success → save subscription to database
- Navigate to main app

**✅ Risk:** Medium - integrates external service, needs testing

---

### **PHASE 5: Testing & Polish (2 hours)**

#### Step 5.1: Test All Flows
1. ✅ New user → Choose Basic → Works normally
2. ✅ New user → Choose Premium → Payment → Upgrade works
3. ✅ Premium user → Unlimited swipes work
4. ✅ Premium user → See likes you screen
5. ✅ Premium user → Undo swipe works
6. ✅ Premium user → Boost profile works
7. ✅ Basic user → See upgrade prompts
8. ✅ Existing users → Still work normally

---

#### Step 5.2: Add Premium Gates Throughout App
**Files to update:**
- `src/app/(tabs)/profile.tsx` - Add "People Who Liked You" button
- `src/app/(tabs)/index.tsx` - Add undo button
- `src/components/swipe/SwipeCard.tsx` - Maybe add premium hints
- Settings page - Show premium status

**✅ Risk:** Low - just adding UI elements

---

## ⏱️ TIME ESTIMATE

| Phase | Task | Time | Risk |
|-------|------|------|------|
| Phase 1 | Database updates | 2 hours | 🟢 Low |
| Phase 2 | UI components | 3 hours | 🟢 Low |
| Phase 3 | Feature implementation | 4 hours | 🟡 Medium |
| Phase 4 | Payment integration | 2 hours | 🟡 Medium |
| Phase 5 | Testing & polish | 2 hours | 🟢 Low |
| **TOTAL** | **Complete Premium** | **13 hours** | 🟢 **Low-Medium** |

**Realistic estimate:** 2-3 days of focused work

---

## 🛡️ SAFETY MEASURES

### **Backward Compatibility:**
✅ All existing users default to "basic" package
✅ Existing swipe functionality unchanged
✅ No breaking changes to current flows
✅ Can be deployed incrementally

### **Testing Strategy:**
1. Test with new user flow
2. Test with existing user flow
3. Test premium features work
4. Test basic features still work
5. Test upgrade/downgrade flows
6. Test payment success/failure

### **Rollback Plan:**
If something breaks:
1. Database columns added are nullable, safe
2. Premium checks return false by default
3. Can disable premium features with feature flag
4. Revert code changes if needed

---

## 🚀 DEPLOYMENT STRATEGY

### **Day 1:**
- Deploy database changes only
- No user impact, all functions as normal

### **Day 2:**
- Deploy UI components behind feature flag
- Test with internal accounts
- No public impact yet

### **Day 3:**
- Enable package selection for NEW users only
- Existing users unchanged
- Monitor for issues

### **Day 4:**
- Enable premium features for all users
- Add upgrade prompts
- Monitor conversion rates

---

## 📊 SUCCESS METRICS

### **Track:**
1. **Conversion rate:** % of users choosing premium
2. **Feature usage:** Which premium features are used most
3. **Revenue:** Monthly recurring revenue from premium
4. **Retention:** Do premium users stay longer?
5. **Support:** Any payment-related issues?

---

## ✅ CHECKLIST

### **Database:**
- [ ] Add is_premium column to users
- [ ] Add premium_until column to users
- [ ] Add boost_expires_at to profiles
- [ ] Add incognito_mode to profiles
- [ ] Add can_undo to swipes
- [ ] Create subscriptions table
- [ ] Test all queries still work

### **UI:**
- [ ] Create package-selection.tsx
- [ ] Create PremiumBadge.tsx
- [ ] Create UpgradePrompt.tsx
- [ ] Create likes-you.tsx screen
- [ ] Create payment.tsx screen
- [ ] Update OnboardingContext
- [ ] Add premium gates throughout

### **Features:**
- [ ] Update canSwipe() for premium
- [ ] Implement See Who Liked You
- [ ] Implement Rewind Swipe
- [ ] Implement Profile Boost
- [ ] Add premium checks everywhere

### **Payment:**
- [ ] Set up RevenueCat account
- [ ] Configure products in App Store/Play Store
- [ ] Create payment service
- [ ] Test purchase flow
- [ ] Test restore purchases
- [ ] Handle webhooks

### **Testing:**
- [ ] Test new user → basic flow
- [ ] Test new user → premium flow
- [ ] Test existing user → still works
- [ ] Test all premium features
- [ ] Test payment success
- [ ] Test payment failure
- [ ] Test upgrade prompts

---

## 🎯 QUICK START ORDER

**Do these in this exact order to minimize risk:**

1. **Database changes first** (safest, no UI impact)
2. **Add premium checks to existing code** (backwards compatible)
3. **Build new UI components** (separate, doesn't affect existing)
4. **Integrate components** (gradually)
5. **Add payment** (last step, can disable easily)

---

## 💡 BONUS TIPS

1. **Start with 1 feature:** Just implement "Unlimited Swipes" first, then add others
2. **Test incrementally:** Don't build all at once, test as you go
3. **Feature flags:** Use them to enable/disable premium features easily
4. **Monitor closely:** Watch errors, conversions, support tickets
5. **Iterate fast:** Launch basic premium, add features based on feedback

---

## 🚨 WHAT TO AVOID

❌ Don't change existing swipe logic structure
❌ Don't remove any existing features
❌ Don't force premium on anyone
❌ Don't break existing user flows
❌ Don't deploy payment without thorough testing
❌ Don't forget to handle subscription cancellations
❌ Don't make premium feel like a scam (fake notifications, etc.)

---

## 🎉 READY TO START?

**I can implement this step-by-step for you:**
1. Start with database (safest)
2. Add premium checks (backwards compatible)
3. Build new screens (no existing impact)
4. Integrate everything gradually

**Want me to start? Just say "go" or "implement premium features"!** 🚀

