# iOS Build Scripts

Helper scripts for building, running, and archiving the Siomin iOS app locally.

> ⚠️ **All commands must be run on a Mac with Xcode 15+ installed.**
> Lovable's cloud sandbox cannot compile iOS binaries.

## One-time setup

See [`CHECKLIST.md`](./CHECKLIST.md) for the full local build checklist.

Quick version:
```bash
git pull
npm install
npm run build
npx cap add ios            # only the very first time
npx cap sync ios
```

## Scripts

Make them executable once:
```bash
chmod +x scripts/ios/*.sh
```

| Script | What it does |
|---|---|
| `./scripts/ios/run-simulator.sh` | Build web → sync → launch the iOS Simulator |
| `./scripts/ios/run-device.sh` | Build web → sync → run on a connected physical iPhone |
| `./scripts/ios/open-xcode.sh` | Build web → sync → open the project in Xcode |
| `./scripts/ios/archive-release.sh` | Produce a signed `.ipa` in `build/ios/` ready for App Store / TestFlight |

## Typical flows

**Daily dev (simulator):**
```bash
./scripts/ios/run-simulator.sh
```

**Test on your iPhone (USB / Wi-Fi):**
```bash
./scripts/ios/run-device.sh
```

**Ship a build to TestFlight:**
```bash
./scripts/ios/archive-release.sh
# Then upload build/ios/Siomin.ipa via Transporter.app or
# Xcode → Window → Organizer → Distribute App
```
