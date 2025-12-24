# 🔧 "Domain Not Authorized" Error Fix - Step by Step

## ❌ समस्या (Problem):
APK में Google login करते समय "Domain Not Authorized" error आ रहा है।

## ✅ समाधान (Solution):

### Step 1: SHA-1 Fingerprint Generate करें

**Option A: Automatic Script (Recommended)**
```powershell
# Project folder में जाएं
cd "C:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted"

# SHA-1 generate करें
cd android
.\gradlew signingReport
```

**Option B: Manual Command**
```powershell
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**Output में ढूंढें:**
```
SHA1: A1:B2:C3:D4:E5:F6:...
```
📋 **SHA-1 को copy कर लें** (colons के साथ)

---

### Step 2: Firebase Console में SHA-1 Add करें

1. **Firebase Console** खोलें: https://console.firebase.google.com/
2. Project **"rupantra-ai"** select करें
3. ⚙️ **Project Settings** (top-left gear icon) click करें
4. Scroll down करें → **"Your apps"** section
5. 📱 **Android app** (`com.rupantar.ai`) select करें
6. **"SHA certificate fingerprints"** section में:
   - ➕ **"Add fingerprint"** button click करें
   - 📋 SHA-1 paste करें (जो Step 1 में copy किया था)
   - 💾 **Save** button click करें

---

### Step 3: Google Cloud Console में Verify करें

1. **Google Cloud Console** खोलें: https://console.cloud.google.com/
2. Project **"rupantra-ai"** select करें
3. **APIs & Services** → **Credentials** पर जाएं
4. **OAuth 2.0 Client IDs** में:
   - **Web client** select करें
   - **Authorized redirect URIs** में verify करें:
     - ✅ `https://rupantra-ai.firebaseapp.com/__/auth/handler`
   - **Authorized JavaScript origins** में verify करें:
     - ✅ `https://rupantra-ai.firebaseapp.com`

---

### Step 4: Wait और Test करें

1. ⏰ **5-10 minutes wait करें** (Firebase changes propagate होने के लिए)
2. 📱 **APK rebuild करें** (अगर पहले से build नहीं है)
3. 🧪 **Test करें:**
   - App uninstall करें (अगर पहले install है)
   - Fresh APK install करें
   - Google login try करें
   - Error नहीं आना चाहिए ✅

---

## 🔍 Verification Checklist:

- [ ] SHA-1 fingerprint generate किया
- [ ] SHA-1 Firebase Console में add किया
- [ ] Google Cloud Console में redirect URI configured है
- [ ] 5-10 minutes wait किया
- [ ] APK rebuild किया
- [ ] Fresh install किया
- [ ] Google login test किया

---

## ⚠️ Important Notes:

1. **SHA-1 Format:** Colons के साथ होना चाहिए
   - ✅ Correct: `A1:B2:C3:D4:...`
   - ❌ Wrong: `A1B2C3D4...`

2. **Debug vs Release:**
   - Debug SHA-1: Testing के लिए (अभी यही use करें)
   - Release SHA-1: Production APK के लिए (बाद में add करेंगे)

3. **Changes Propagation:**
   - Firebase में changes immediately apply होते हैं
   - लेकिन Google OAuth के लिए 5-10 minutes wait करना पड़ सकता है

4. **APK Rebuild:**
   - SHA-1 add करने के बाद APK rebuild करना जरूरी नहीं है
   - लेकिन अगर error persist करे, तो rebuild करें

---

## 🆘 अगर अभी भी Error आए:

1. **Firebase Console में double-check करें:**
   - SHA-1 properly add हुआ है या नहीं
   - Android app properly configured है या नहीं

2. **Google Cloud Console में check करें:**
   - Redirect URI correctly configured है या नहीं
   - Web client properly linked है या नहीं

3. **App में check करें:**
   - Old APK uninstall किया है या नहीं
   - Fresh install किया है या नहीं

4. **Wait करें:**
   - 10-15 minutes wait करें और फिर try करें

---

## 📞 Support:

अगर अभी भी issue persist करे, तो:
- Firebase Console screenshot share करें
- Google Cloud Console screenshot share करें
- Error message का screenshot share करें

