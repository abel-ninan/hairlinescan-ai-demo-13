# ✅ Mac Setup Checklist

Print this or keep it open. Check off each step as you complete it.

---

## Google Drive Transfer
- [ ] Upload `hairlinescan-ai-demo-13` folder to Google Drive
- [ ] Wait for upload to finish (green checkmark)
- [ ] Download folder on Mac
- [ ] Unzip the downloaded file
- [ ] Move folder to Documents folder

---

## Xcode Setup
- [ ] Xcode finished installing
- [ ] Open Xcode and install additional components
- [ ] Run: `sudo xcode-select --switch /Applications/Xcode.app` in Terminal
- [ ] Close Xcode

---

## CocoaPods
- [ ] Run: `sudo gem install cocoapods` in Terminal
- [ ] Wait for installation (2-5 minutes)
- [ ] Verify with: `pod --version`

---

## Navigate to Project
- [ ] Run: `cd /Users/[YourName]/Documents/hairlinescan-ai-demo-13`
- [ ] Verify with: `ls` (should see ios, src, etc.)

---

## Install Dependencies
- [ ] Run: `npm install`
- [ ] Wait for it to finish
- [ ] Run: `cd ios/App`
- [ ] Run: `pod install`
- [ ] Wait for "Pod installation complete!"
- [ ] Run: `cd ../..`

---

## Open in Xcode
- [ ] Run: `npx cap open ios`
- [ ] Xcode opens with your project

---

## Configure Signing
- [ ] Click "App" in left sidebar (blue icon)
- [ ] Click "App" under TARGETS
- [ ] Click "Signing & Capabilities" tab
- [ ] Check "Automatically manage signing"
- [ ] Click "Add an Account..." and sign in with Apple ID
- [ ] Select your Apple ID in "Team" dropdown
- [ ] Change Bundle Identifier to: `com.[yourname].hairlinescan`

---

## Test on iPhone
- [ ] Plug iPhone into Mac
- [ ] Trust computer on iPhone
- [ ] Select iPhone in Xcode device selector (top toolbar)
- [ ] Click Play button (▶️)
- [ ] Wait for build to finish (2-5 minutes)
- [ ] On iPhone: Settings → General → VPN & Device Management
- [ ] Trust your developer certificate
- [ ] Open app on iPhone
- [ ] Allow camera permission
- [ ] Test taking photos and AI analysis

---

## ✅ SUCCESS!
If the app opens and camera works, you're done! 🎉

---

## When Ready for App Store (Later):
- [ ] Sign up for Apple Developer Program ($99/year)
- [ ] Create app icons (1024x1024 image)
- [ ] Archive app in Xcode
- [ ] Upload to App Store Connect
- [ ] Submit for review

---

**Your Project Path:** `/Users/[YourName]/Documents/hairlinescan-ai-demo-13`

**Need Help?** Check `MAC_SETUP_GUIDE_DETAILED.md` for full instructions!
