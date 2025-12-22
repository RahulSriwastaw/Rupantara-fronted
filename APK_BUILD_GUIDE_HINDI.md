# APK Build Guide - Rupantar AI

## ✅ Setup Complete

Android platform successfully added और sync हो गया है!

## 📱 APK बनाने के Steps:

### Option 1: Android Studio में Build करें (Recommended)

1. **Android Studio खुल गया होगा** - अगर नहीं खुला, तो:
   ```bash
   cd Rupantara-fronted
   npx cap open android
   ```

2. **Gradle Sync होने दें** - Android Studio में project load होने के बाद Gradle sync automatically होगा

3. **APK Build करें:**
   - Menu bar में: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - या: **Build** → **Generate Signed Bundle / APK** (Production के लिए)

4. **APK Location:**
   - APK file यहाँ मिलेगी: `android/app/build/outputs/apk/debug/app-debug.apk`
   - या: `android/app/build/outputs/apk/release/app-release.apk` (signed APK)

### Option 2: Command Line से Build करें

```bash
cd Rupantara-fronted/android
./gradlew assembleDebug
```

APK file: `app/build/outputs/apk/debug/app-debug.apk`

### Option 3: Release APK (Signed) बनाने के लिए

1. **Keystore बनाएं:**
   ```bash
   cd android/app
   keytool -genkey -v -keystore rupantar-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rupantar
   ```

2. **Android Studio में:**
   - **Build** → **Generate Signed Bundle / APK**
   - Keystore file select करें
   - Password enter करें
   - **APK** select करें
   - **release** build variant select करें
   - **Finish** click करें

## 🔄 Future Updates के लिए:

जब भी frontend में changes करें:

```bash
# 1. Build Next.js app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Android Studio में rebuild करें
```

## 📝 Important Notes:

- **Minimum Requirements:** Android 5.0 (API level 21)
- **App ID:** `com.rupantar.ai`
- **App Name:** Rupantar AI
- **Web Directory:** `out` (Next.js static export)

## 🐛 Troubleshooting:

### अगर Android Studio नहीं खुल रहा:
```bash
# Manual path specify करें
npx cap open android --path "C:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted\android"
```

### अगर Gradle sync fail हो रहा है:
- Android Studio में: **File** → **Invalidate Caches / Restart**
- Internet connection check करें (Gradle dependencies download करने के लिए)

### अगर build fail हो रहा है:
- Android SDK properly installed है या नहीं check करें
- Java JDK installed है या नहीं check करें

## ✅ Success!

APK successfully build होने के बाद, आप इसे Android device में install कर सकते हैं!

