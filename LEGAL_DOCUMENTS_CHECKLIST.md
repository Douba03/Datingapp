# Legal Documents Checklist

## ✅ What I've Created for You

I've created two comprehensive legal documents for your dating app:

1. **PRIVACY_POLICY.md** - Explains how you collect, use, and protect user data
2. **TERMS_OF_SERVICE.md** - Defines the rules and agreements for using your app

---

## 📝 Required Customizations

Before publishing these documents, you **MUST** replace the following placeholders:

### In Both Documents:

- [ ] `[Your App Name]` → Replace with your actual app name
- [ ] `[Your Company Name]` → Replace with your legal company/entity name
- [ ] `[Date]` → Add the current date (e.g., "January 15, 2025")
- [ ] `[your-support-email@example.com]` → Add your real support email
- [ ] `[Your Company Address]` → Add your physical business address
- [ ] `[Your Jurisdiction]` → Add your legal jurisdiction (e.g., "the State of California, USA")

### In Privacy Policy Only:

- [ ] `[Stripe/RevenueCat]` → Choose your payment processor
- [ ] `[Google Analytics/Firebase]` → Choose your analytics provider
- [ ] `[Expo/Firebase]` → Confirm your push notification provider
- [ ] `[DPO email if applicable]` → Add Data Protection Officer email (if you have one)

---

## ⚖️ Legal Review (IMPORTANT!)

**⚠️ DISCLAIMER: I am an AI assistant, not a lawyer. These documents are templates and starting points.**

### Before Publishing, You Should:

1. **Consult a Lawyer** 
   - Have an attorney review and customize these documents for your specific situation
   - Laws vary by country, state, and industry
   - Dating apps have specific legal requirements

2. **Consider Your Jurisdiction**
   - Different regions have different privacy laws (GDPR, CCPA, etc.)
   - Some countries require specific disclosures
   - Age verification requirements vary

3. **Review Regularly**
   - Update when you add new features
   - Update when laws change
   - Review at least annually

---

## 🌍 Key Legal Frameworks to Consider

### GDPR (European Union)
- ✅ Included in the Privacy Policy
- Requires explicit consent for data processing
- Right to be forgotten
- Data portability
- **Action**: If you have EU users, ensure full GDPR compliance

### CCPA (California, USA)
- ✅ Included in the Privacy Policy
- Right to know what data is collected
- Right to delete data
- Right to opt-out of data sales
- **Action**: If you have California users, ensure CCPA compliance

### COPPA (USA - Children's Privacy)
- ✅ Addressed (app is 18+)
- Strict rules for users under 13
- **Action**: Enforce age restrictions rigorously

### Other Considerations
- **CAN-SPAM Act**: Email marketing rules (USA)
- **TCPA**: Text message and call rules (USA)
- **Local Dating App Regulations**: Some regions have specific rules for dating platforms

---

## 📱 Where to Display These Documents

### In Your Mobile App:

1. **During Signup**
   - Show links to Privacy Policy and Terms of Service
   - Require users to check "I agree" before creating account

2. **Settings Page**
   - Add "Privacy Policy" and "Terms of Service" buttons
   - Link to in-app webview or external webpage

3. **App Store Listings**
   - Apple App Store requires Privacy Policy URL
   - Google Play Store requires Privacy Policy URL

### On Your Website:

1. **Footer Links**
   - Privacy Policy
   - Terms of Service
   - Contact Us

2. **Dedicated Pages**
   - Create `/privacy` and `/terms` pages
   - Make them easily accessible

---

## 🔧 Implementation Steps

### Step 1: Customize the Documents
- [ ] Replace all placeholders with your actual information
- [ ] Review and adjust based on your specific features
- [ ] Have a lawyer review

### Step 2: Host the Documents
- [ ] Create a website or landing page
- [ ] Upload Privacy Policy to `yourwebsite.com/privacy`
- [ ] Upload Terms of Service to `yourwebsite.com/terms`
- [ ] OR: Create in-app screens to display the documents

### Step 3: Update Your App
- [ ] Add links to Privacy Policy and Terms in signup flow
- [ ] Add links in Settings page
- [ ] Add "I agree to Terms and Privacy Policy" checkbox during signup

### Step 4: Update App Store Listings
- [ ] Add Privacy Policy URL to Apple App Store Connect
- [ ] Add Privacy Policy URL to Google Play Console
- [ ] Fill out data collection questionnaires

### Step 5: Implement Consent Mechanisms
- [ ] Add checkbox for Terms and Privacy Policy during signup
- [ ] Log user consent (timestamp, IP address)
- [ ] For EU users, implement explicit consent for data processing

---

## 🛠️ Code Implementation Example

### Add to Signup Screen:

```typescript
const [agreedToTerms, setAgreedToTerms] = useState(false);

// In your signup form:
<View style={styles.termsContainer}>
  <TouchableOpacity 
    style={styles.checkbox}
    onPress={() => setAgreedToTerms(!agreedToTerms)}
  >
    <Ionicons 
      name={agreedToTerms ? "checkbox" : "square-outline"} 
      size={24} 
      color={colors.primary} 
    />
  </TouchableOpacity>
  <Text style={styles.termsText}>
    I agree to the{' '}
    <Text 
      style={styles.link} 
      onPress={() => Linking.openURL('https://yourapp.com/terms')}
    >
      Terms of Service
    </Text>
    {' '}and{' '}
    <Text 
      style={styles.link}
      onPress={() => Linking.openURL('https://yourapp.com/privacy')}
    >
      Privacy Policy
    </Text>
  </Text>
</View>

// Disable signup button if not agreed:
<TouchableOpacity 
  disabled={!agreedToTerms}
  style={[styles.button, !agreedToTerms && styles.buttonDisabled]}
>
  <Text>Sign Up</Text>
</TouchableOpacity>
```

### Add to Settings Screen:

```typescript
<TouchableOpacity 
  style={styles.settingItem}
  onPress={() => Linking.openURL('https://yourapp.com/privacy')}
>
  <Ionicons name="shield-checkmark" size={20} color={colors.text} />
  <Text style={styles.settingLabel}>Privacy Policy</Text>
  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
</TouchableOpacity>

<TouchableOpacity 
  style={styles.settingItem}
  onPress={() => Linking.openURL('https://yourapp.com/terms')}
>
  <Ionicons name="document-text" size={20} color={colors.text} />
  <Text style={styles.settingLabel}>Terms of Service</Text>
  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
</TouchableOpacity>
```

---

## 📊 What's Covered in the Privacy Policy

✅ **Information Collection**
- User-provided data (profile, photos, messages)
- Automatically collected data (device info, usage)
- Third-party data

✅ **How Data is Used**
- Providing the service
- Safety and security
- Analytics and improvement
- Marketing (with consent)

✅ **Data Sharing**
- With other users (profiles, messages)
- With service providers (Supabase, payment processors)
- For legal reasons
- Business transfers

✅ **User Rights**
- Access, update, delete data
- Control notifications
- Privacy settings
- GDPR and CCPA rights

✅ **Security Measures**
- Encryption
- Access controls
- Security audits

✅ **Special Topics**
- Children's privacy (18+ requirement)
- International transfers
- Cookies and tracking
- Data retention

---

## 📋 What's Covered in the Terms of Service

✅ **Eligibility**
- 18+ age requirement
- Account restrictions

✅ **User Conduct**
- Prohibited activities (harassment, fraud, spam)
- Content rules
- Safety guidelines

✅ **Intellectual Property**
- User content ownership
- Our intellectual property
- Content licensing

✅ **Premium Features**
- Subscription terms
- Payment and refunds
- Cancellation

✅ **Disclaimers**
- Service "as is"
- No background checks
- Limitation of liability

✅ **Dispute Resolution**
- Governing law
- Arbitration (if applicable)

---

## 🚨 Critical Requirements for Dating Apps

### 1. Age Verification
- Clearly state 18+ requirement
- Implement age checks during signup
- Have a process to verify ages if needed

### 2. Safety Features
- Reporting system ✅ (you have this)
- Blocking system ✅ (you have this)
- Safety tips and resources
- Emergency contact features (consider adding)

### 3. Content Moderation
- Photo review process ✅ (you have this)
- Message monitoring (for reported content)
- Clear community guidelines

### 4. Background Checks Disclaimer
- Clearly state you DON'T do background checks
- Warn users to be cautious
- Provide safety tips

### 5. Data Protection
- Secure storage ✅ (Supabase with RLS)
- Encryption ✅
- Regular security audits
- Incident response plan

---

## 📞 Next Steps

1. **Immediate**: Replace all placeholders in the documents
2. **This Week**: Consult with a lawyer for review
3. **Before Launch**: Host documents on a website
4. **Before Launch**: Add links to signup and settings
5. **Before Launch**: Implement consent checkboxes
6. **Before Launch**: Update app store listings

---

## 💡 Additional Resources

### Legal Services for Startups
- **Rocket Lawyer**: Affordable legal documents
- **LegalZoom**: Business legal services
- **Termly**: Privacy policy and terms generator
- **Iubenda**: Compliance solutions for apps

### Privacy Compliance Tools
- **OneTrust**: Privacy management platform
- **TrustArc**: Privacy compliance software
- **Cookiebot**: Cookie consent management

### App Store Requirements
- [Apple Privacy Policy Requirements](https://developer.apple.com/app-store/review/guidelines/#privacy)
- [Google Play Privacy Policy Requirements](https://support.google.com/googleplay/android-developer/answer/9859455)

---

## ⚠️ Final Reminder

**These documents are templates. You MUST:**
1. Customize them for your specific app
2. Have them reviewed by a qualified attorney
3. Keep them updated as your app evolves
4. Ensure they comply with all applicable laws in your target markets

**I am not a lawyer, and this is not legal advice. Consult with a legal professional before publishing these documents.**

---

Good luck with your dating app! 🚀❤️

