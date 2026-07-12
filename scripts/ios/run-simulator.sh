#!/usr/bin/env bash
# Build the web bundle, sync into iOS, and launch in the iOS Simulator.
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

# Optional: target a specific simulator with TARGET="iPhone 15 Pro" ./run-simulator.sh
TARGET="${TARGET:-}"

echo "▶ Launching iOS Simulator..."
if [[ -n "$TARGET" ]]; then
  npx cap run ios --target "$TARGET"
else
  npx cap run ios
fi
