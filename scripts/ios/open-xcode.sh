#!/usr/bin/env bash
# Build, sync, and open the iOS project in Xcode for manual builds / debugging.
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

echo "▶ Opening Xcode workspace..."
npx cap open ios
