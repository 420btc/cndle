# Building an APK for Android with Expo

This document provides step-by-step instructions for building an Android APK using Expo and EAS Build.

## Prerequisites

1. Node.js (LTS version recommended)
2. Expo CLI
3. EAS CLI
4. Expo account
5. PowerShell terminal

## Setup Instructions

### 1. Install Required Tools

```powershell
# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally
npm install -g eas-cli
```

### 2. Login to Expo

```powershell
eas login
```

### 3. Configure Your Project

The project has already been configured with:
- Updated package.json with build scripts
- Created eas.json with build profiles
- Added Gradle configuration files

### 4. Initialize EAS Build (First Time Only)

```powershell
eas build:configure
```

### 5. Build an APK

```powershell
# Use the npm script
npm run build:android-apk

# Or use EAS CLI directly
eas build -p android --profile preview-apk
```

This will:
1. Upload your code to Expo's build servers
2. Build an APK using Gradle
3. Provide a download link when complete

### 6. Alternative: Local Build

If you want to build locally (requires Android SDK and Gradle):

```powershell
# Install dependencies
npm install

# Generate native code
npx expo prebuild

# Build the APK
cd android
./gradlew assembleRelease
```

The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Gradle Issues

If you encounter Gradle issues:

1. Ensure you have Java JDK 11 or 17 installed
2. Set JAVA_HOME environment variable:
   ```powershell
   $env:JAVA_HOME = "C:\Path\To\Your\JDK"
   ```
3. Check Gradle version:
   ```powershell
   cd android
   ./gradlew --version
   ```

### Build Failures

If the build fails:
1. Check the EAS build logs
2. Ensure all dependencies are correctly installed
3. Verify your app.json configuration

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Gradle Documentation](https://docs.gradle.org/current/userguide/userguide.html)
