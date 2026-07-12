# Local iOS Build Checklist

Use this checklist before your first iOS build and before every release.

---

## 🧰 Prerequisites (one-time)

- [ ] **Mac** running macOS 14 (Sonoma) or newer
- [ ] **Xcode 15+** installed from the Mac App Store
- [ ] **Xcode Command Line Tools**: `xcode-select --install`
- [ ] **CocoaPods**: `sudo gem install cocoapods` (or `brew install cocoapods`)
- [ ] **Node.js 20+** and **npm**
- [ ] **Apple Developer Account** ($99/yr) — required for device + App Store
- [ ] Signed in to your Apple ID in **Xcode → Settings → Accounts**

## 📦 Project setup (one-time per clone)

- [ ] `git clone` your GitHub repo (exported from Lovable)
- [ ] `cd` into the project
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npx cap add ios` *(only if `ios/` folder does not exist)*
- [ ] `npx cap sync ios`
- [ ] Open `ios/App/App.xcworkspace` in Xcode
- [ ] In **Signing & Capabilities**, pick your **Team** and a unique **Bundle Identifier**
      (e.g. `com.yourname.siomin` — `app.lovable.*` cannot be used for App Store submissions)

## 🔁 Before every build

- [ ] `git pull` latest changes
- [ ] `npm install` (in case dependencies changed)
- [ ] `npm run build` to refresh the `dist/` web bundle
- [ ] `npx cap sync ios` to copy the web build + plugins into the iOS project
- [ ] Check `capacitor.config.ts` — for production builds, **remove or comment out
      the `server.url` block**, otherwise the app loads from Lovable's preview URL
      instead of the bundled assets

## 🧪 Simulator testing

- [ ] `./scripts/ios/run-simulator.sh`
- [ ] Verify navigation, auth, network requests
- [ ] Test in both light and dark mode
- [ ] Test multiple device sizes (iPhone SE, iPhone 15 Pro, iPad)

## 📱 Physical device testing

- [ ] Connect iPhone via USB, trust the Mac
- [ ] Device shows up in Xcode's device list
- [ ] `./scripts/ios/run-device.sh`
- [ ] On the iPhone: Settings → General → VPN & Device Management → trust your dev cert (first install only)

## 🚀 Release / TestFlight checklist

- [ ] Bump **Version** and **Build** numbers in Xcode → General
- [ ] Confirm `server.url` is **disabled** in `capacitor.config.ts`
- [ ] App icons present in `ios/App/App/Assets.xcassets/AppIcon.appiconset`
- [ ] Launch screen looks correct
- [ ] All required `Info.plist` usage descriptions present
      (`NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`, etc.)
      for any native plugins you use
- [ ] Production API endpoints / env values in place
- [ ] `./scripts/ios/archive-release.sh` succeeds
- [ ] Upload `build/ios/Siomin.ipa` to App Store Connect via Transporter or Xcode Organizer
- [ ] Submit build to TestFlight, add testers
- [ ] Fill out App Store metadata, screenshots, privacy questionnaire
- [ ] Submit for review

## 🆘 Troubleshooting

| Symptom | Fix |
|---|---|
| `Pod install` fails | `cd ios/App && pod repo update && pod install` |
| Old web content shows | Re-run `npm run build && npx cap sync ios` |
| Signing error | Xcode → Signing & Capabilities → re-select Team |
| App loads Lovable preview in production | Remove `server.url` from `capacitor.config.ts`, rebuild |
| Simulator won't launch | `xcrun simctl shutdown all && xcrun simctl erase all` |
