# iOS App Setup Instructions

## ✅ What's Already Done (on Windows)

- Capacitor installed and configured
- iOS project generated
- Camera permissions configured
- Production web app built
- All configuration files ready

---

## 📋 What You Need to Do on Mac

### Step 1: Transfer Project to Your Mac

1. Copy the entire `hairlinescan-ai-demo-13` folder to your Mac
2. You can use:
   - USB drive
   - iCloud Drive
   - AirDrop
   - GitHub (push from Windows, pull on Mac)

### Step 2: Install Xcode (if not already installed)

1. Open the **App Store** on your Mac
2. Search for **Xcode**
3. Click **Get** or **Install** (it's free but ~15GB)
4. Wait for installation to complete (can take 30-60 minutes)
5. Open Xcode once to accept the license agreement
6. In Terminal, run: `sudo xcode-select --switch /Applications/Xcode.app`

### Step 3: Install CocoaPods

1. Open **Terminal** on your Mac
2. Run this command:
   ```bash
   sudo gem install cocoapods
   ```
3. Enter your Mac password when prompted

### Step 4: Open the iOS Project

1. Open Terminal
2. Navigate to your project folder:
   ```bash
   cd /path/to/hairlinescan-ai-demo-13
   ```
3. Install iOS dependencies:
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```
4. Open the Xcode project:
   ```bash
   npx cap open ios
   ```
   OR manually open: `ios/App/App.xcworkspace` in Xcode

### Step 5: Sign Up for Apple Developer Account (When Ready)

**Only do this when you're ready to test on a real device or submit to App Store.**

1. Go to https://developer.apple.com/
2. Click **Account**
3. Sign in with your Apple ID
4. Enroll in the **Apple Developer Program** ($99/year)
5. Complete the enrollment process (can take 24-48 hours for approval)

### Step 6: Configure Signing in Xcode

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Click on **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** from the dropdown (your Apple Developer account)
6. Xcode will automatically provision your app

### Step 7: Test on Your iPhone

1. Connect your iPhone to your Mac with a USB cable
2. On your iPhone: **Settings → General → VPN & Device Management**
3. Trust your developer certificate
4. In Xcode:
   - Select your iPhone from the device dropdown (top toolbar)
   - Click the **Play** button (▶️) to build and run
5. The app will install and launch on your iPhone

### Step 8: Prepare for App Store Submission

#### A. Create App Icons

You need app icons in these sizes:
- 1024x1024 (App Store)
- 180x180, 120x120, 87x87, 80x80, 76x76, 58x58, 40x40, 29x29, 20x20

**Easy way**: Use https://www.appicon.co/
1. Upload your 1024x1024 icon
2. Download the iOS icon set
3. Copy all icons to: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

#### B. Update App Information

Edit `ios/App/App.xcodeproj/project.pbxproj` or use Xcode:
- **Display Name**: HairlineScan
- **Bundle Identifier**: com.hairlinescan.app (already set)
- **Version**: 1.0
- **Build Number**: 1

#### C. Create App on App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: HairlineScan
   - **Primary Language**: English
   - **Bundle ID**: com.hairlinescan.app
   - **SKU**: hairlinescan001 (or any unique ID)
   - **User Access**: Full Access

#### D. Archive and Upload

1. In Xcode, select **Any iOS Device** from the device dropdown
2. Menu: **Product → Archive**
3. Wait for archive to complete
4. **Organizer** window will open
5. Click **Distribute App**
6. Choose **App Store Connect**
7. Click **Upload**
8. Follow the prompts to upload your app

#### E. Submit for Review

1. Go to App Store Connect
2. Click on your app
3. Fill in all required information:
   - Screenshots (you'll need to take these from your iPhone)
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL (if required)
4. Click **Submit for Review**

---

## 🔧 Troubleshooting

### "No code signing identities found"
- Make sure you enrolled in Apple Developer Program
- Wait 24-48 hours after enrollment
- Sign in to Xcode with your Apple ID: **Xcode → Preferences → Accounts**

### "Failed to install on device"
- Trust your developer certificate on iPhone
- Settings → General → VPN & Device Management

### App crashes on launch
- Check Console.app on Mac for error logs
- Make sure camera permissions are in Info.plist (already done)

### "Command PhaseScriptExecution failed"
- Run `pod install` again in `ios/App` folder
- Clean build: **Product → Clean Build Folder** in Xcode

---

## 📱 App Details

- **App Name**: HairlineScan
- **Bundle ID**: com.hairlinescan.app
- **Camera Permission**: Already configured
- **Min iOS Version**: 13.0+

---

## 🚀 Quick Commands Reference

```bash
# Navigate to project
cd /path/to/hairlinescan-ai-demo-13

# Install dependencies (first time only)
cd ios/App && pod install && cd ../..

# Open in Xcode
npx cap open ios

# Sync web changes to iOS
npm run build
npx cap copy ios
npx cap sync ios

# Update native dependencies
cd ios/App && pod install && cd ../..
```

---

## 📞 Need Help?

If you run into issues, check:
1. Xcode Console for error messages
2. Capacitor docs: https://capacitorjs.com/docs/ios
3. Apple Developer docs: https://developer.apple.com/documentation/

---

## ✅ Checklist Before Submission

- [ ] Tested on real iPhone device
- [ ] All features working (camera, AI analysis, etc.)
- [ ] App icons added (all sizes)
- [ ] Screenshots taken
- [ ] Privacy policy created (if collecting data)
- [ ] App description written
- [ ] Keywords chosen
- [ ] Support email/URL set up
- [ ] Pricing decided (free or paid)

---

**Good luck with your iOS app! 🎉**
