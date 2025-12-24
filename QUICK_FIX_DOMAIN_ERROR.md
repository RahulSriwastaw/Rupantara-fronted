# 🔧 "Domain Not Authorized" Error - Quick Fix Guide

## ❌ समस्या:
APK में Google login करते समय "Domain Not Authorized" error आ रहा है।

## ✅ समाधान (3 Simple Steps):

---

### 📋 Step 1: SHA-1 Fingerprint Generate करें

**Option A: Android Studio से (Easiest)**
1. Android Studio खोलें
2. Project open करें: `Rupantara-fronted/android`
3. Right side में **"Gradle"** tab click करें
4. **app** → **Tasks** → **android** → **signingReport** double-click करें
5. Bottom में **"Build"** tab में output दिखेगा
6. **SHA1:** के बाद वाला fingerprint copy करें
   - Format: `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`

**Option B: Command Line से**
```powershell
cd "C:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted\android"
.\gradlew signingReport
```
Output में `SHA1:` के बाद वाला fingerprint copy करें।

**Option C: Manual Keytool Command**
```powershell
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

### 🔥 Step 2: Firebase Console में SHA-1 Add करें

1. **Firebase Console** खोलें: https://console.firebase.google.com/
2. Project **"rupantra-ai"** select करें
3. ⚙️ **Project Settings** (top-left gear icon) click करें
4. Scroll down करें → **"Your apps"** section
5. 📱 **Android app** (`com.rupantar.ai`) select करें
6. **"SHA certificate fingerprints"** section में:
   - ➕ **"Add fingerprint"** button click करें
   - 📋 SHA-1 paste करें (Step 1 से copy किया हुआ)
   - Format: `XX:XX:XX:XX:...` (colons के साथ)
   - 💾 **Save** button click करें

**Important:** 
- ✅ SHA-1 format में colons होने चाहिए
- ✅ Debug keystore का SHA-1 use करें (testing के लिए)

---

### 🌐 Step 3: Google Cloud Console में Verify करें

1. **Google Cloud Console** खोलें: https://console.cloud.google.com/
2. Project **"rupantra-ai"** select करें
3. **APIs & Services** → **Credentials** पर जाएं
4. **OAuth 2.0 Client IDs** section में:
   - **Web client** select करें (जो Firebase के साथ linked है)
   - **Authorized redirect URIs** में verify करें:
     - ✅ `https://rupantra-ai.firebaseapp.com/__/auth/handler` (यह जरूरी है!)
   - **Authorized JavaScript origins** में verify करें:
     - ✅ `https://rupantra-ai.firebaseapp.com`
   - अगर ये URIs नहीं हैं, तो **Add URI** button से add करें
   - 💾 **Save** button click करें

---

### ⏰ Step 4: Wait और Test करें

1. ⏰ **5-10 minutes wait करें** (Firebase और Google Cloud Console में changes propagate होने के लिए)
2. 📱 **APK rebuild करें:**
   - Android Studio में: **Build** → **Rebuild Project**
   - फिर: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. 🧪 **Test करें:**
   - Old APK uninstall करें (अगर पहले install है)
   - Fresh APK install करें
   - Google login try करें
   - Error नहीं आना चाहिए ✅

---

## 🔍 Verification Checklist:

- [ ] SHA-1 fingerprint generate किया
- [ ] SHA-1 Firebase Console में add किया (colons के साथ)
- [ ] Google Cloud Console में redirect URI verify किया: `https://rupantra-ai.firebaseapp.com/__/auth/handler`
- [ ] 5-10 minutes wait किया
- [ ] APK rebuild किया
- [ ] Old APK uninstall किया
- [ ] Fresh APK install किया
- [ ] Google login test किया

---

## ⚠️ Common Mistakes:

1. **SHA-1 Format Wrong:**
   - ❌ Wrong: `A1B2C3D4E5F6...` (colons नहीं हैं)
   - ✅ Correct: `A1:B2:C3:D4:E5:F6:...` (colons के साथ)

2. **Redirect URI Missing:**
   - ❌ Google Cloud Console में redirect URI add नहीं किया
   - ✅ `https://rupantra-ai.firebaseapp.com/__/auth/handler` add करना जरूरी है

3. **Not Waiting:**
   - ❌ Changes के बाद immediately test करना
   - ✅ 5-10 minutes wait करना जरूरी है

4. **Old APK:**
   - ❌ Old APK use करना
   - ✅ Fresh APK install करना जरूरी है

---

## 🆘 अगर अभी भी Error आए:

1. **Double-check करें:**
   - Firebase Console में SHA-1 properly add हुआ है या नहीं
   - Google Cloud Console में redirect URI correctly configured है या नहीं

2. **Wait करें:**
   - 10-15 minutes और wait करें
   - Firebase और Google Cloud Console में changes propagate होने में time लग सकता है

3. **Fresh Install:**
   - App completely uninstall करें
   - Phone restart करें (optional)
   - Fresh APK install करें

4. **Check Logs:**
   - Android Studio में Logcat check करें
   - Error message में specific details देखें

---

## 📞 Support:

अगर अभी भी issue persist करे, तो ये share करें:
- Firebase Console screenshot (SHA-1 fingerprints section)
- Google Cloud Console screenshot (OAuth 2.0 Client IDs → Web client → Authorized redirect URIs)
- Error message का screenshot
- Logcat output (अगर available है)

---

## 📝 Notes:

- **Debug SHA-1:** Testing के लिए use करें (अभी यही use करें)
- **Release SHA-1:** Production APK के लिए (बाद में add करेंगे)
- **Changes Propagation:** Firebase में changes immediately apply होते हैं, लेकिन Google OAuth के लिए 5-10 minutes wait करना पड़ सकता है
- **APK Rebuild:** SHA-1 add करने के बाद APK rebuild करना जरूरी नहीं है, लेकिन अगर error persist करे तो rebuild करें

