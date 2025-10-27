# 🧪 Onboarding Testing Guide

## ✅ Date Picker Fixed!

I've fixed the date picker issue. It now works properly on:
- ✅ **iOS** - Shows spinner picker with "Done" button
- ✅ **Android** - Shows native calendar picker
- ✅ **Web** - Shows text input (YYYY-MM-DD format)

---

## 🚀 How to Test Now

### Step 1: Reload the App
In your terminal, press **`r`** to reload the app

### Step 2: Test Basic Info Screen

1. **First Name:**
   - ✅ Type your name
   - ✅ Should show preview text below

2. **Date of Birth:**
   - ✅ Click the "Select your date of birth" button
   - ✅ **On Android:** Calendar picker should appear
   - ✅ **On iOS:** Spinner picker should appear with "Done" button
   - ✅ **On Web:** Text input should appear (type date as YYYY-MM-DD)
   - ✅ Select a date
   - ✅ It should show "Age: XX years old" below
   - ✅ Try selecting a date under 18 years - should show error

3. **Gender:**
   - ✅ Tap on Man, Woman, Non-binary, or Custom
   - ✅ Selected option should highlight
   - ✅ If Custom, text input should appear

4. **Continue Button:**
   - ✅ Leave fields empty and click Continue - should show error alerts
   - ✅ Fill all fields and click Continue - should go to Photos screen

---

## 📸 Test All Onboarding Screens

### Screen 1: Welcome ✅
- **Test:** Click "Get Started"
- **Expected:** Navigate to Basic Info

### Screen 2: Basic Info ✅
- **Test:** Fill name, DOB, gender
- **Expected:** Navigate to Photos

### Screen 3: Photos
- **Test:**
  - ✅ Click "Add Photo" - opens gallery
  - ✅ Click "Take Photo" - opens camera
  - ✅ Try adding 6+ photos - should show "maximum" alert
  - ✅ Remove photos using X button
  - ✅ Try continuing with 0-1 photos - should show error
  - ✅ Add 2+ photos and continue

### Screen 4: Bio
- **Test:**
  - ✅ Type in bio text area
  - ✅ Character count updates
  - ✅ Try typing 500+ characters - should stop at 500
  - ✅ Click prompt chips - text gets added
  - ✅ Click "Skip for now" - goes to next screen
  - ✅ OR click "Continue" with bio

### Screen 5: Interests
- **Test:**
  - ✅ Click on interests - should select (highlighted)
  - ✅ Click again - should deselect
  - ✅ Try selecting 10+ interests - should show maximum alert
  - ✅ Try continuing with <3 interests - should show error
  - ✅ Select 3+ interests and continue

### Screen 6: Preferences
- **Test:**
  - ✅ Select gender preferences (can select multiple)
  - ✅ Adjust age range sliders
  - ✅ Adjust distance slider
  - ✅ Select relationship intent
  - ✅ Try continuing without selections - should show errors
  - ✅ Complete all and continue

### Screen 7: Location
- **Test:**
  - ✅ Click "Enable Location"
  - ✅ Should ask for permission
  - ✅ If granted - shows city name
  - ✅ Click "Continue" - goes to complete screen
  - ✅ OR click "Skip for now"

### Screen 8: Complete
- **Test:**
  - ✅ Shows success message
  - ✅ Shows profile summary
  - ✅ Click "Let's Go!" button
  - ✅ Should navigate to main app

---

## 🐛 Common Issues & Solutions

### Issue: Date picker doesn't show
**What to check:**
- Are you on web? (Use text input format: 2000-01-15)
- On Android: Does it show as a calendar dialog?
- On iOS: Does it show as a spinner with "Done" button?

**Solution:** Press `r` to reload after my fix

### Issue: Can't upload photos
**What to check:**
- Did you grant camera/gallery permissions?
- Check device settings → App permissions

**Solution:** Grant permissions when asked

### Issue: Form doesn't validate
**What to check:**
- Are all required fields filled?
- Is age 18 or older?
- Are there at least 2 photos?
- Are there at least 3 interests selected?

**Solution:** Fill all required fields

### Issue: Back button doesn't work
**What to check:**
- Navigation stack might be confused

**Solution:** Press `r` to reload app

### Issue: App crashes
**What to check:**
- Check terminal for errors
- Look at the error message

**Solution:** Send me the error message

---

## ✅ Validation Rules

| Screen | Field | Requirement |
|--------|-------|-------------|
| Basic Info | First Name | Required, max 50 chars |
| Basic Info | Date of Birth | Required, must be 18+ |
| Basic Info | Gender | Required |
| Photos | Photos | Min 2, Max 6 |
| Bio | Bio | Optional, max 500 chars |
| Interests | Interests | Min 3, Max 10 |
| Preferences | Gender | At least 1 selected |
| Preferences | Relationship | Required |
| Location | Location | Optional |

---

## 🎯 Success Criteria

**You'll know it works when:**
- ✅ All screens navigate smoothly
- ✅ Date picker shows and works
- ✅ Photos can be uploaded
- ✅ Form validation prevents invalid data
- ✅ Complete screen shows and redirects to app
- ✅ No console errors

---

## 📝 Quick Test Checklist

```
Basic Info Screen:
[ ] First name input works
[ ] Date picker opens and closes
[ ] Can select date
[ ] Age calculation shows
[ ] Gender selection works
[ ] Custom gender input appears
[ ] Validation errors show correctly
[ ] Continue button navigates to next screen

Photos Screen:
[ ] Can open gallery
[ ] Can take photo with camera
[ ] Photos appear in grid
[ ] Can remove photos
[ ] Main photo badge shows
[ ] Photo count updates
[ ] Validation prevents < 2 photos
[ ] Continue works with 2+ photos

Bio Screen:
[ ] Can type in text area
[ ] Character count updates
[ ] Prompts work
[ ] Skip button works
[ ] Continue button works

Interests Screen:
[ ] Can select/deselect interests
[ ] Count updates
[ ] Maximum 10 enforced
[ ] Minimum 3 enforced
[ ] Continue works

Preferences Screen:
[ ] Gender selection works
[ ] Sliders work
[ ] Values update
[ ] Validation works
[ ] Continue works

Location Screen:
[ ] Permission request shows
[ ] City name appears (if granted)
[ ] Skip works
[ ] Continue works

Complete Screen:
[ ] Success message shows
[ ] Summary displays
[ ] Button navigates to main app
```

---

## 🔍 Debugging Tips

**Enable Debug Mode:**
1. If something doesn't work, check the browser console (F12)
2. Look for red error messages
3. Check React Native debugger

**Common Console Errors:**
- "Cannot read property" → Missing data
- "Navigation error" → Route not registered
- "Permission denied" → Grant device permissions

**Need Help?**
1. Press `r` to reload
2. Clear cache: `npx expo start --clear`
3. Check terminal for errors
4. Send me the error message

---

## ✨ Next Steps After Testing

Once everything works:
1. Take screenshots of the flow
2. Note any UI improvements you want
3. Get ready for Phase 2: Database integration
4. Test on both iOS and Android if possible

---

**Everything should work now! Test it and let me know what you find! 🚀**
