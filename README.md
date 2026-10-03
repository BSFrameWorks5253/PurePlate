# PurePlate - Citizen Food Safety Network 🛡️🥛🔬
**Science Exhibition & Innovation Project**

An end-to-end multiplatform application (Web PWA for iPhone/Desktop + Dart/Flutter Codebase with Android APK compilation) designed to democratize food safety testing, crowdsource adulteration tracking, and gamify science education for schools.

---

## 🌟 Architecture Overview

As specified in the project blueprint:
1. **iPhone Users (Web App / PWA)**:
   - Full native-like experience via Safari **"Add to Home Screen"**.
   - Full access to device camera, color probing, GPS location, and offline caching via Service Worker.
2. **Android Users (APK & Web)**:
   - Can run either via the responsive Web App or install the standalone **Android `.apk`**.
   - Built with **Flutter (Dart)** with ready-to-deploy `.github/workflows/build_apk.yml` for automated cloud compilation.

---

## 📱 The 5 Core Modules & Screens

### 1. The "Home Hub" (Dashboard)
- **Top Brand & Status Bar**: Displays detected region (*Athwa, Surat*) and real-time network sync indicator.
- **Surat Food Quality Bulletin**: Live alerts on neighborhood adulteration spikes.
- **Key Community Metrics**: Total verified tests, regional purity index percentage, and active watch zones.
- **Two Primary Action Cards**:
  - `Test Food Quality` (Magnifying glass & dairy icon) ➔ Screen 2
  - `View Safety Heat Map` (Radar signal icon) ➔ Screen 4
- **Recent Community Activity Ticker**: Real-time log stream.

### 2. Selection & Setup ("What are we testing today?")
- **Interactive Search & Category Filters**: Dairy 🥛, Spices 🌶️, Sweeteners 🍯, Oils 🫒.
- **Supported Standard DART / Citizen Tests**:
  - *Milk Starch & Thickener Test* (Iodine complex)
  - *Milk Water Trail Slip Test* (Gyroscope-assisted slope angle)
  - *Turmeric Metanil Yellow & Chalk Test*
  - *Chili Powder Brick Dust & Sand Test*
  - *Honey Water Dispersion Test*
  - *Mustard Oil Argemone Test*
- **Slide-up "Instruction Card"**: Pops open at the bottom detailing required household tools, chemical target, and science principles before opening the scanner.

### 3. The "Live Camera Scanner & Verdict"
- **Step Progress Bar**: Step 1 (Setup) ➔ Step 2 (Scan) ➔ Step 3 (Verdict).
- **Camera Viewport**:
  - Real WebRTC hardware camera access (`navigator.mediaDevices.getUserMedia`).
  - Circular targeting reticle (`ALIGN SAMPLE CUP`) with animated crosshairs.
  - Interactive color probe: tap anywhere on the sample to extract exact RGB and Hex color values.
  - Gyroscope surface tilt tracker for the Water Trail slope test.
  - One-click sample simulation switcher (`Pure Milk` vs `Starch Contaminated`).
- **"Visual Choice" Dialogue**:
  - `Stayed White / Pale Yellow (Pure)`
  - `Turned Deep Blue / Violet (Adulterated)`
- **Dynamic Action Button**: `Analyze & Generate Log`.
- **Verdict & Offline-First Sync**:
  - If Adulterated: Red alert banner, health impact breakdown, sample vendor picker (*Local Loose Milk Vendor*, *Supermarket Packet*, etc.), and push to Community Map.
  - If Pure: Green certified pure banner and badge progress.
  - Automatic connectivity detection: if offline, saves locally with an alert and automatically syncs when reconnected.

### 4. PurePlate Community Heat Map (Regional Food Security Tracker)
- Interactive map centered on **Surat (Athwa Lines, Adajan, Pal, Varachha, City Light)**.
- **Pulsing Soft Red Radar Waves** indicating contamination spikes (>3 fails in 7 days).
- **Green Shield Markers** indicating verified pure zones.
- Interactive filter chips (*All, Contamination Spikes, Pure Zones, Milk*).
- **Recent Community Public Feed** pulling up real-time logs with timestamps.

### 5. "School to Home" Kids' Learning Portal (Gamification)
- **Detective Profile & Level Progress**: Junior Food Inspector level with score and XP bar.
- **Unlockable Digital Badges**:
  - 🔍 *Food Safety Detective*
  - 🥛 *Milk Master*
  - 🌶️ *Spice Sleuth*
  - 🧪 *Chemical Sleuth*
- **Interactive Science Quiz**: Tests kids on food adulteration chemistry with instant explanations and confetti animations.
- **Fast Match Mini-Game**: Match common staple foods to their adulterants.
- **Surat Schools Leaderboard**: Competitive ranking between schools (e.g., Delhi Public School Surat, Ryan International, Tapti Valley).

---

## 🚀 How to Run the App Immediately

### Method 1: Instant Launch on Any Device (Same Wi-Fi)
1. Double click `RUN_APP.bat` in this folder, or open a terminal and run:
   ```powershell
   node serve.js
   ```
2. Your server will automatically bind to **all network interfaces** (`0.0.0.0`) on both HTTP and HTTPS:
   - **💻 On this PC**: `http://localhost:3000`
   - **📱 Any Phone, Tablet or Laptop on same Wi-Fi (HTTP)**: `http://192.168.29.215:3000`
   - **🔒 Secure HTTPS (For Mobile Camera & Gyroscope permissions)**: `https://192.168.29.215:3443`
   - **🏷️ Apple / Bonjour mDNS Name**: `http://Burhan.local:3000`
3. **Connecting from an iPhone or Android phone**:
   - Make sure the phone is on the **same Wi-Fi network**.
   - Point your phone's camera at the **terminal ASCII QR code** or type `http://192.168.29.215:3000`.
   - **Camera Hardware Access**: Since mobile browsers (iOS Safari, Android Chrome) block camera streaming over plain HTTP on IP addresses, open `https://192.168.29.215:3443` and tap "Advanced ➔ Proceed" once. The app will have full hardware camera and PWA permissions!
   - On iPhone: Tap **Share ➔ Add to Home Screen** to install as a standalone app!

---

### 🤖 Android Development Mode Features

When testing the app in development mode on Android (or in your desktop browser):
1. **Floating Android Dev Button (`🤖 Android Dev`)**:
   - Located at the bottom right. Tap it anytime to open the **Android Development Studio**.
2. **Device Frame Switcher**:
   - Switch between **Google Pixel 8 (Android)**, **Samsung Galaxy S24**, **iPhone 15 Pro**, and **Full Native**.
   - Toggle Android Top Status Bar (5G, WiFi, Clock, Battery) and Android 3-Button Navigation (◀ Back, ● Home, ■ Overview).
3. **Sensor & Hardware Simulation**:
   - **Gyroscope Tilt Angle Slider**: Adjust surface angle from $0^\circ$ to $90^\circ$ to test the Milk Water Trail Test logic.
   - **GPS Teleporter**: Jump instantly between Surat neighborhoods (*Athwa Lines, Pal, Adajan, Varachha, City Light, Majura Gate*).
   - **Camera Optical Sample Injector**: Switch between *Pure Milk*, *Starch Violet Reaction*, *Turmeric Acid*, and *Chili Brick Dust*.
4. **Network & State Controller**:
   - Airplane Mode toggle (simulates offline behavior and tests the offline queue).
   - Bulk seed 10 realistic test reports across Surat with 1 click.
   - Export test logs to JSON.
5. **On-Screen Mobile Console Logs**:
   - Real-time JavaScript console logs right on your Android phone screen without needing a USB cable.
   - Built-in REPL to evaluate JavaScript code on the device.
6. **Chrome Remote Web Inspector on Android**:
   - Connect phone via USB with USB Debugging enabled.
   - Navigate to `chrome://inspect/#devices` in Google Chrome on your computer to inspect elements, monitor network, and profile on Android live!

---

### Method 2: Compile Android APK (Flutter / Dart)

The complete Flutter project is located in `flutter_app/`.

#### Option A: 1-Click Cloud Build (No local Android Studio needed!)
1. Push this folder to a GitHub repository.
2. Go to **Actions** tab ➔ Run the **"Build Android APK and Web App"** workflow.
3. Download the compiled `app-release.apk` directly from GitHub Artifacts!

#### Option B: Local Flutter Build (If Flutter SDK is installed)
```bash
cd flutter_app
flutter pub get
flutter build apk --release
# APK is generated at flutter_app/build/app/outputs/flutter-apk/app-release.apk
```
Or run web:
```bash
flutter run -d chrome
```

---

## 📁 Project Structure

```text
Science Project/
│
├── RUN_APP.bat                  # 1-click Windows launcher
├── serve.js                     # Local HTTP server with LAN IP detection
├── README.md                    # Project documentation
│
├── web_app/                     # Interactive Web App & PWA (iPhone + Android)
│   ├── index.html               # 5 Screens responsive markup
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Offline caching service worker
│   ├── css/
│   │   └── styles.css           # Glassmorphic UI design system
│   ├── js/
│   │   ├── data.js              # Food testing protocols & initial incidents
│   │   ├── storage.js           # Offline queue & LocalStorage sync
│   │   ├── camera.js            # WebRTC camera, circular reticle, color probe
│   │   ├── map.js               # Leaflet map, pulsing radar spikes, feed
│   │   ├── quiz.js              # Kids' learning portal & matching game
│   │   └── app.js               # Main navigation & testing workflow controller
│   └── assets/
│       └── logo.svg             # PurePlate shield logo
│
├── flutter_app/                 # Dart / Flutter cross-platform project
│   ├── pubspec.yaml             # Flutter configuration
│   ├── lib/
│   │   ├── main.dart            # Flutter app entry & navigation shell
│   │   ├── models/
│   │   │   ├── food_protocol.dart
│   │   │   └── test_incident.dart
│   │   ├── services/
│   │   │   └── app_state.dart
│   │   └── screens/
│   │       ├── home_screen.dart
│   │       ├── selection_screen.dart
│   │       ├── camera_test_screen.dart
│   │       ├── heat_map_screen.dart
│   │       └── kids_portal_screen.dart
│   └── android/
│       └── app/
│           ├── build.gradle
│           └── src/main/AndroidManifest.xml
│
└── .github/
    └── workflows/
        └── build_apk.yml        # Automated CI/CD APK builder
```
