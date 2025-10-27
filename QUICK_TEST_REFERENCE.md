# 🚀 Quick Test Reference

## ⚡ Servers Running

✅ **Admin Dashboard**: http://localhost:3001
✅ **Mobile App**: http://localhost:8082

---

## 🎯 Quick Test (30 seconds)

### 1️⃣ Send Warning (Admin Dashboard)
```
→ Open http://localhost:3001
→ Login: admin@test.com
→ Click "Users" in sidebar
→ Find user: kvinna@test.com
→ Click "Warn" button
→ Select reason: HARAM
→ Type message: "Test warning"
→ Click "Send Warning"
✅ Success!
```

### 2️⃣ Receive Warning (Mobile App)
```
→ Open http://localhost:8082
→ Login: kvinna@test.com + password
→ Wait 2 seconds...
✅ Alert popup appears!
→ Click "OK"
✅ Done!
```

---

## 📊 What to Watch

### Admin Dashboard Console:
```
[warn-user] Admin: admin@test.com warning user: xxx
[warn-user] Success: { warning_id: xxx, total_warnings: 1 }
```

### Mobile App Console:
```
[SimpleWarningAlert] User logged in, waiting 2 seconds...
[SimpleWarningAlert] Starting check for user: xxx
[SimpleWarningAlert] ✅ Query successful, found 1 warnings
```

---

## ✅ Success = 

1. Admin sends warning → Success message ✅
2. User logs in → Wait 2 seconds ✅
3. Alert popup appears ✅
4. User clicks OK → Alert closes ✅
5. No errors in console ✅

---

## 🐛 If Something Breaks

**White screen?**
- Check mobile app console for errors
- Make sure `user_warnings` table exists

**Alert doesn't appear?**
- Wait full 2 seconds
- Check console logs
- Make sure user has warnings

**Admin can't send warning?**
- Check admin dashboard console
- Make sure admin is logged in
- Restart: `cd admin; npm run dev`

---

## 🎉 Test It Now!

**Step 1**: Open http://localhost:3001 (admin)
**Step 2**: Open http://localhost:8082 (mobile)
**Step 3**: Follow Quick Test above
**Step 4**: 🎉 Celebrate!

