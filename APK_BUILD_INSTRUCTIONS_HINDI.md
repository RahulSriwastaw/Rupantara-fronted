# APK Build Instructions - Rupantar AI

## ✅ Build Complete!

Next.js app successfully build हो गया है और Capacitor sync हो गया है!

## 📱 APK बनाने के लिए:

### Method 1: Android Studio में Build करें (सबसे आसान) ⭐

1. **Android Studio खुल गया होगा** - अगर नहीं, तो:
   ```bash
   cd Rupantara-fronted
   npx cap open android
   ```

2. **Gradle Sync होने दें** (अगर automatic नहीं हुआ):
   - Top menu: **File** → **Sync Project with Gradle Files**
   - Wait करें sync complete होने तक

3. **APK Build करें:**
   - Top menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Build start होगा (bottom में progress दिखेगा)
   - Build complete होने पर notification आएगा

4. **APK File Location:**
   - Notification में **"locate"** link पर click करें
   - या manually जाएं:
     ```
     android\app\build\outputs\apk\debug\app-debug.apk
     ```

### Method 2: Java JDK Install करके Command Line से

#### Step 1: Java JDK Install करें
1. [Oracle JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) download करें
2. Install करें
3. Environment Variable set करें:
   - Windows: **Settings** → **System** → **About** → **Advanced system settings** → **Environment Variables**
   - **JAVA_HOME** variable add करें: `C:\Program Files\Java\jdk-17` (अपने install path के अनुसार)
   - **Path** में add करें: `%JAVA_HOME%\bin`

#### Step 2: APK Build करें
```bash
cd android
.\gradlew.bat assembleDebug
```

APK file: `app\build\outputs\apk\debug\app-debug.apk`

## 📦 APK File Details:

- **Location:** `android\app\build\outputs\apk\debug\app-debug.apk`
- **Size:** ~15-25 MB (approximate)
- **Type:** Debug APK (testing के लिए)
- **Install:** Android device में directly install कर सकते हैं

## 🔄 Future Updates के लिए:

जब भी frontend में changes करें:

```bash
# 1. Build Next.js app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Android Studio में rebuild करें
# या command line से: cd android && .\gradlew.bat assembleDebug
```

## ✅ Success!

APK successfully build होने के बाद, आप इसे Android device में install कर सकते हैं!

**Note:** Debug APK testing के लिए है। Production के लिए signed APK बनाना होगा।

