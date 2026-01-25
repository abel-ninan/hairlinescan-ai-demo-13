# 🍎 Complete Mac Setup Guide - Step by Step

**Follow this guide EXACTLY. Don't skip any steps.**

---

## PART 1: Transfer Project from Windows to Mac (Using Google Drive)

### On Your Windows Computer:

1. **Upload to Google Drive:**
   - Open Google Drive in your browser: https://drive.google.com
   - Sign in with your Google account
   - Click the **"New"** button (top left)
   - Click **"Folder upload"**
   - Navigate to: `C:\Users\abelh\Documents\`
   - Select the folder `hairlinescan-ai-demo-13`
   - Click **"Select Folder"** or **"Upload"**
   - **WAIT** until the upload is 100% complete (this may take 5-10 minutes)
   - You'll see a green checkmark when it's done

---

### On Your Mac:

2. **Download from Google Drive:**
   - Open Google Drive in your browser: https://drive.google.com
   - Sign in with the **SAME** Google account
   - Find the `hairlinescan-ai-demo-13` folder
   - Right-click on the folder
   - Click **"Download"**
   - Your Mac will download it as a ZIP file
   - **Wait** for the download to complete
   - The ZIP file will be in your **Downloads** folder

3. **Unzip the Project:**
   - Open **Finder** (the smiley face icon in your dock)
   - Click **"Downloads"** in the left sidebar
   - Find `hairlinescan-ai-demo-13.zip`
   - Double-click it to unzip (it will create a folder)
   - You now have a folder called `hairlinescan-ai-demo-13` in Downloads

4. **Move to Documents Folder:**
   - In Finder, with Downloads still open
   - Click and drag the `hairlinescan-ai-demo-13` folder
   - Drop it on **"Documents"** in the left sidebar
   - Now your project is at: `/Users/[YourName]/Documents/hairlinescan-ai-demo-13`

---

## PART 2: Install Xcode (You're Already Doing This)

5. **Wait for Xcode to Finish Installing:**
   - This can take 30-60 minutes
   - Don't close your Mac or let it sleep
   - You'll know it's done when it says "Open" in the App Store

6. **Open Xcode for the First Time:**
   - Click **"Open"** in the App Store, OR
   - Find Xcode in your **Applications** folder and double-click it
   - Xcode will say: "Install required components?"
   - Click **"Install"** (this installs command-line tools)
   - Enter your Mac password if asked
   - Wait for this to finish (2-5 minutes)
   - You'll see the Xcode welcome screen
   - Close Xcode for now

7. **Set Xcode Command Line Tools:**
   - Open **Terminal** (Press `Command + Space`, type "Terminal", press Enter)
   - Copy this command EXACTLY and paste it:
     ```bash
     sudo xcode-select --switch /Applications/Xcode.app
     ```
   - Press **Enter**
   - Type your Mac password and press Enter (you won't see it typing - this is normal)
   - Wait for it to finish (no message means success)

---

## PART 3: Install CocoaPods (Required for iOS)

8. **Install CocoaPods:**
   - Still in Terminal, copy this command:
     ```bash
     sudo gem install cocoapods
     ```
   - Press **Enter**
   - Type your Mac password and press Enter
   - **WAIT** - this takes 2-5 minutes
   - You'll see lots of text scrolling
   - When you see a new line with your computer name, it's done

9. **Verify CocoaPods Installed:**
   - Type this command:
     ```bash
     pod --version
     ```
   - Press **Enter**
   - You should see a version number like `1.15.2`
   - If you see a number, you're good!

---

## PART 4: Navigate to Your Project

10. **Go to Your Project Folder:**
    - Still in Terminal, type this command (replace `[YourName]` with your actual Mac username):
      ```bash
      cd /Users/[YourName]/Documents/hairlinescan-ai-demo-13
      ```
    - **How to find your username:** In Finder, look at the left sidebar - you'll see a house icon with your name. That's your username.
    - Press **Enter**

11. **Verify You're in the Right Place:**
    - Type this command:
      ```bash
      ls
      ```
    - Press **Enter**
    - You should see a list that includes: `ios`, `src`, `package.json`, `IOS_SETUP_INSTRUCTIONS.md`
    - If you see these, you're in the right place!

---

## PART 5: Install Node Packages (Required)

12. **Install Project Dependencies:**
    - In Terminal, type this command:
      ```bash
      npm install
      ```
    - Press **Enter**
    - **WAIT** - this takes 1-2 minutes
    - You'll see lots of text scrolling
    - Ignore any warnings (yellow text is OK)
    - When you see a new line with your computer name, it's done

---

## PART 6: Set Up iOS Project

13. **Install iOS Dependencies:**
    - Type these commands ONE AT A TIME:
      ```bash
      cd ios/App
      ```
    - Press **Enter**, then:
      ```bash
      pod install
      ```
    - Press **Enter**
    - **WAIT** - this takes 1-3 minutes
    - You'll see text like "Installing..." and "Generating Pods project"
    - When you see "Pod installation complete!", you're good

14. **Go Back to Main Project Folder:**
    - Type this command:
      ```bash
      cd ../..
      ```
    - Press **Enter**

---

## PART 7: Open Your iOS App in Xcode

15. **Open the iOS Project:**
    - In Terminal, type this command:
      ```bash
      npx cap open ios
      ```
    - Press **Enter**
    - **Xcode will open** with your project
    - This may take 10-20 seconds
    - You'll see your app's file structure on the left

---

## PART 8: Configure for Your iPhone (Without Developer Account Yet)

16. **Select Your App Target:**
    - In Xcode, look at the left sidebar
    - Click on **"App"** (the blue icon at the very top)
    - In the main area, you'll see "TARGETS"
    - Click on **"App"** under TARGETS

17. **Go to Signing & Capabilities:**
    - At the top of the main area, click **"Signing & Capabilities"** tab
    - You'll see "Signing (Debug)" section

18. **Enable Automatic Signing:**
    - Check the box that says **"Automatically manage signing"**
    - Under "Team", you'll see "Add an Account..."

19. **Add Your Apple ID:**
    - Click **"Add an Account..."**
    - Click **"Apple ID"**
    - Enter your Apple ID email and password
    - Click **"Next"**
    - Complete any two-factor authentication if asked
    - Your Apple ID will appear under "Team"

20. **Select Your Team:**
    - In the "Team" dropdown, select your Apple ID (it will say "Personal Team")
    - You may see an error about "Failed to register bundle identifier"
    - **THIS IS NORMAL** - we'll fix it next

21. **Change the Bundle Identifier:**
    - Find the field "Bundle Identifier" - it says `com.hairlinescan.app`
    - Change it to: `com.[yourname].hairlinescan` (replace [yourname] with your actual name, no spaces)
    - Example: `com.john.hairlinescan`
    - The error should disappear
    - If you still see an error, try a different name: `com.[yourname].hairlineapp`

---

## PART 9: Test on Your iPhone (FREE - No Developer Account Needed Yet!)

22. **Connect Your iPhone:**
    - Plug your iPhone into your Mac with a USB cable
    - On your iPhone, you may see "Trust This Computer?" - tap **"Trust"**
    - Enter your iPhone passcode if asked

23. **Select Your iPhone as the Build Target:**
    - In Xcode, look at the top toolbar
    - Find the device selector (next to the Play/Stop buttons)
    - Click on it
    - Select your iPhone (it will show your iPhone's name)

24. **Build and Run:**
    - Click the **Play button** (▶️) in the top left of Xcode
    - Xcode will start building your app
    - You'll see a progress bar at the top
    - **WAIT** - first build takes 2-5 minutes

25. **Trust Your Developer Certificate (On iPhone):**
    - If the app installs but doesn't open, do this:
    - On your iPhone: **Settings → General → VPN & Device Management**
    - You'll see your Apple ID under "Developer App"
    - Tap it
    - Tap **"Trust [Your Apple ID]"**
    - Tap **"Trust"** again to confirm
    - Go back to your home screen
    - Tap the HairlineScan app icon
    - **IT SHOULD OPEN NOW!** 🎉

---

## PART 10: Test the Camera

26. **Test the App:**
    - On your iPhone, the HairlineScan app should be open
    - Follow the questionnaire
    - When it asks for camera access, tap **"Allow"**
    - Take photos of your hairline (or anything for testing)
    - Submit for analysis
    - The AI should analyze it and show results!

---

## TROUBLESHOOTING

### If Xcode says "No such file or directory":
- Make sure you're in the right folder in Terminal
- Type: `pwd` and press Enter
- It should show: `/Users/[YourName]/Documents/hairlinescan-ai-demo-13`

### If `npm install` fails:
- Make sure you have internet connection
- Try closing Terminal and opening a new one
- Try the command again

### If `pod install` fails:
- Make sure you ran it inside `ios/App` folder
- Try: `cd /Users/[YourName]/Documents/hairlinescan-ai-demo-13/ios/App`
- Then: `pod install` again

### If the app crashes on your iPhone:
- Check the Xcode console (bottom panel) for error messages
- Make sure you trusted your developer certificate on iPhone
- Try cleaning the build: In Xcode menu, **Product → Clean Build Folder**
- Then click Play (▶️) again

### If camera doesn't work:
- Make sure you tapped "Allow" when asked for camera permission
- On iPhone: **Settings → HairlineScan → Camera** - make sure it's enabled

---

## WHAT'S NEXT?

### For Testing Only (FREE):
You're done! You can test your app on your iPhone for free using your Apple ID "Personal Team". The app will work for 7 days, then you'll need to re-build and install it again (just click Play in Xcode again).

### For App Store Submission ($99/year):
When you're ready to submit to the App Store:

1. **Sign up for Apple Developer Program:**
   - Go to: https://developer.apple.com/programs/
   - Click **"Enroll"**
   - Follow the steps (costs $99/year)
   - Wait 24-48 hours for approval

2. **Update Xcode Signing:**
   - In Xcode, go back to **Signing & Capabilities**
   - Under "Team", select your Apple Developer team (not Personal Team)
   - Change Bundle Identifier back to: `com.hairlinescan.app`

3. **Create App Icons:**
   - You need icons in many sizes
   - Use this tool: https://www.appicon.co/
   - Upload a 1024x1024 PNG image
   - Download the iOS icon set
   - In Xcode left sidebar, find **Assets.xcassets → AppIcon**
   - Drag all the icon files into their slots

4. **Archive and Upload:**
   - In Xcode device selector, choose **"Any iOS Device"**
   - Menu: **Product → Archive**
   - Wait for archive to complete (2-5 minutes)
   - Click **"Distribute App"**
   - Choose **"App Store Connect"**
   - Follow the prompts to upload

5. **Submit in App Store Connect:**
   - Go to: https://appstoreconnect.apple.com/
   - Click **"My Apps"** → **"+"** → **"New App"**
   - Fill in all information
   - Add screenshots (take them from your iPhone)
   - Add description, keywords, etc.
   - Click **"Submit for Review"**
   - Wait 1-3 days for Apple's review

---

## IMPORTANT NOTES

- **The .env file**: Your Gemini API key is in the `.env` file. Make sure this file transferred to your Mac. Check: `/Users/[YourName]/Documents/hairlinescan-ai-demo-13/.env`

- **Free testing lasts 7 days**: Apps installed with Personal Team expire after 7 days. You'll need to rebuild and reinstall. Or pay $99 for the Developer Program.

- **Don't delete the project folder**: Keep it in Documents. You'll need it every time you want to update the app.

---

## QUICK COMMANDS REFERENCE

**Navigate to project:**
```bash
cd /Users/[YourName]/Documents/hairlinescan-ai-demo-13
```

**Rebuild app after making changes:**
```bash
npm run build
npx cap copy ios
npx cap open ios
```
Then click Play (▶️) in Xcode.

**Reinstall pods if needed:**
```bash
cd ios/App
pod install
cd ../..
```

---

**You've got this! Follow each step carefully and you'll have your app running on your iPhone!** 🚀📱
