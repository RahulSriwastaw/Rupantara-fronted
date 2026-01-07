# Firebase Domain Authorization Setup (APK के लिए)

## समस्या (Problem)
APK में Google login करते समय "Domain Not Authorized" error आ रहा है।

## समाधान (Solution)

### Step 1: Firebase Console में Authorized Domains (Web के लिए)

**Note:** Android package name को यहाँ add नहीं करना है! यह सिर्फ web domains के लिए है।

1. **Firebase Console** खोलें: https://console.firebase.google.com/
2. अपना project **"rupantra-ai"** select करें
3. **Authentication** → **Settings** → **Authorized domains** पर जाएं
4. ✅ आपके पास already ये domains हैं:
   - `localhost` (Default)
   - `rupantra-ai.firebaseapp.com` (Default)
   - `rupantra-ai.web.app` (Default)
   - `rupantara-fronted.vercel.app` (Custom)
   - `new-admin-pannel-nine.vercel.app` (Custom)

**Android apps के लिए:** Package name (`com.rupantar.ai`) को यहाँ add नहीं करना है। Android के लिए Google Cloud Console में configure करना होगा (Step 2 देखें)।

### Step 2: Google Cloud Console में OAuth Configuration (IMPORTANT! ⚠️)

यह step बहुत जरूरी है Android apps के लिए!

1. **Google Cloud Console** खोलें: https://console.cloud.google.com/
2. Project **"rupantra-ai"** select करें
3. **APIs & Services** → **Credentials** पर जाएं
4. **OAuth 2.0 Client IDs** section में:

   **A. Web Client (Firebase Web App) को configure करें:**
   - Web client select करें (जो Firebase के साथ linked है)
   - **Authorized redirect URIs** में ये add करें:
     - `https://rupantra-ai.firebaseapp.com/__/auth/handler` ✅ (यह Android app के लिए use होगा)
     - `https://rupantara-fronted.vercel.app` (Web app के लिए)
   - **Authorized JavaScript origins** में add करें:
     - `https://rupantra-ai.firebaseapp.com`
     - `https://rupantara-fronted.vercel.app`
     - `https://rupantar.ai` (अगर custom domain है)

   **B. Android Client (अगर separate Android OAuth client है):**
   - Android client select करें या create करें
   - **Package name:** `com.rupantar.ai`
   - **SHA-1 certificate fingerprint:** Android Studio से generate करें (debug keystore के लिए)

### Step 3: Android App Configuration (Already Done ✅)

AndroidManifest.xml में ये already configured हैं:
- Custom URL scheme: `com.rupantar.ai://`
- Firebase auth redirect: `https://rupantra-ai.firebaseapp.com/__/auth/handler`
- App Links: `https://rupantar.ai`

### Step 4: Verify Configuration

APK build करने के बाद:
1. App install करें
2. Google login try करें
3. अगर अभी भी error आए, तो Firebase Console में domain check करें

## Important Notes

- ✅ Firebase Console में web domains already configured हैं - कोई change नहीं करना है
- ⚠️ **Google Cloud Console में Web client के redirect URI check करें** - यह Android app के लिए use होगा
- Google Cloud Console में changes save करने के बाद, 5-10 minutes लग सकते हैं
- APK rebuild करना जरूरी नहीं है, लेकिन अगर issue persist करे तो rebuild करें

## Android App के लिए OAuth Flow:

1. User Google login button click करता है
2. App Firebase auth handler use करता है: `https://rupantra-ai.firebaseapp.com/__/auth/handler`
3. Google OAuth redirect करता है back to Firebase handler
4. Firebase handler redirect करता है back to app via deep link: `com.rupantar.ai://`
5. App redirect result handle करता है और user login हो जाता है

**Key Point:** Android app Firebase auth handler URL use करता है, इसलिए Google Cloud Console में Web client का redirect URI properly configured होना चाहिए!

## Current Configuration

- **Firebase Auth Domain:** `rupantra-ai.firebaseapp.com`
- **Android Package:** `com.rupantar.ai`
- **Backend API:** `https://new-backend-g2gw.onrender.com/api`
- **Frontend:** `https://rupantara-fronted.vercel.app`

