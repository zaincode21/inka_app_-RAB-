#!/usr/bin/env bash
# Run Expo over USB (no Wi‑Fi, no tunnel). Android only.
# Requires: adb (sudo apt install adb), USB debugging enabled on the phone.
set -euo pipefail

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install with: sudo apt install adb"
  exit 1
fi

adb start-server
adb wait-for-device
adb reverse tcp:8081 tcp:8081
adb reverse tcp:4000 tcp:4000
echo "USB forwards ready:"
adb reverse --list
echo
echo "Now run: npm run start:usb"
echo "Then in Expo Go open: exp://127.0.0.1:8081"
