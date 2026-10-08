# MPPSC IQ Android Cloud Build

This repository now has a GitHub Actions workflow for building the Android APK in the cloud.

## Important
The Android Gradle project must be present at the repository root, including:

- `settings.gradle`
- `build.gradle`
- `app/build.gradle`
- `app/src/main/AndroidManifest.xml`
- Android source/assets
- `app/google-services.json`

The workflow builds a debug APK and publishes it as a GitHub Actions artifact.

## Mobile workflow

1. Upload the MPPSC IQ Android project files to this repository.
2. Open **Actions**.
3. Select **Build MPPSC IQ Android APK**.
4. Tap **Run workflow**.
5. Wait for the build to finish.
6. Open the successful run and download **mppsc-iq-debug-apk**.

Release signing/AAB should be configured separately; never commit a keystore or signing passwords.
