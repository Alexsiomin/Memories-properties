#!/usr/bin/env bash
# Archive a release build of the iOS app and export a signed .ipa
# ready for App Store Connect / TestFlight upload.
#
# Output: build/ios/Siomin.ipa
#
# Requirements:
#   - Mac with Xcode 15+
#   - Apple Developer account, signing team configured in Xcode
#   - Distribution certificate + provisioning profile (Xcode handles this
#     automatically with "Automatically manage signing")
#   - A real Bundle Identifier (not the default app.lovable.*)
#
# Optional env vars:
#   SCHEME           Xcode scheme name        (default: App)
#   CONFIGURATION    Build configuration      (default: Release)
#   EXPORT_METHOD    app-store | ad-hoc | development | enterprise (default: app-store)
#   TEAM_ID          Apple Developer Team ID  (auto-detected from project if unset)

set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ iOS archives require macOS with Xcode."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SCHEME="${SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"
EXPORT_METHOD="${EXPORT_METHOD:-app-store}"

WORKSPACE="ios/App/App.xcworkspace"
BUILD_DIR="$ROOT/build/ios"
ARCHIVE_PATH="$BUILD_DIR/App.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"
EXPORT_OPTIONS="$BUILD_DIR/ExportOptions.plist"

if [[ ! -d "$WORKSPACE" ]]; then
  echo "❌ $WORKSPACE not found. Run 'npx cap add ios' first."
  exit 1
fi

echo "▶ Building web bundle (production)..."
npm run build

echo "▶ Syncing Capacitor (iOS)..."
npx cap sync ios

# Sanity check: warn if server.url is still set (it would make the release
# load assets from the Lovable preview instead of the bundled web build).
if grep -E "^\s*url:\s*['\"]https?://" capacitor.config.ts >/dev/null 2>&1; then
  echo ""
  echo "⚠️  WARNING: capacitor.config.ts still has a 'server.url' set."
  echo "   Release builds should load bundled assets, not a remote URL."
  echo "   Comment out the 'server' block, then re-run this script."
  echo ""
  read -r -p "Continue anyway? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || exit 1
fi

mkdir -p "$BUILD_DIR"
rm -rf "$ARCHIVE_PATH" "$EXPORT_PATH"

# Generate ExportOptions.plist
TEAM_LINE=""
if [[ -n "${TEAM_ID:-}" ]]; then
  TEAM_LINE="<key>teamID</key><string>${TEAM_ID}</string>"
fi

cat > "$EXPORT_OPTIONS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>${EXPORT_METHOD}</string>
  <key>signingStyle</key><string>automatic</string>
  <key>stripSwiftSymbols</key><true/>
  <key>uploadBitcode</key><false/>
  <key>uploadSymbols</key><true/>
  ${TEAM_LINE}
</dict>
</plist>
PLIST

echo "▶ Archiving ($CONFIGURATION)..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  clean archive

echo "▶ Exporting .ipa (method: $EXPORT_METHOD)..."
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates

# Move/rename the .ipa to a predictable location
IPA_SRC="$(find "$EXPORT_PATH" -name "*.ipa" -type f | head -n 1)"
if [[ -z "$IPA_SRC" ]]; then
  echo "❌ Export succeeded but no .ipa was produced. Check $EXPORT_PATH"
  exit 1
fi

IPA_DEST="$BUILD_DIR/Siomin.ipa"
mv "$IPA_SRC" "$IPA_DEST"

echo ""
echo "✅ Done."
echo "   Archive: $ARCHIVE_PATH"
echo "   IPA:     $IPA_DEST"
echo ""
echo "Next steps:"
echo "  • Upload via Transporter.app, OR"
echo "  • Xcode → Window → Organizer → select archive → Distribute App"
