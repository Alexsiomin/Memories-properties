#!/usr/bin/env bash
# Build the web bundle, sync into iOS, and run on a connected physical device.
# Requires: a paid Apple Developer account, the device trusted in Xcode,
# and a signing team configured in ios/App/App.xcworkspace.
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ iOS builds require macOS with Xcode."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "▶ Building web bundle..."
npm run build

echo "▶ Syncing Capacitor (iOS)..."
npx cap sync ios

echo "▶ Available iOS devices:"
xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator" || true

echo ""
echo "▶ Running on connected device..."
echo "   (Tip: pass TARGET=\"<device-name>\" to pick a specific one)"

TARGET="${TARGET:-}"
if [[ -n "$TARGET" ]]; then
  npx cap run ios --target "$TARGET"
else
  npx cap run ios
fi
