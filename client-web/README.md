# Robo-Stream Web Client

Progressive Web App (PWA) for controlling OBS Studio via touchscreen devices.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at:
- **Local:** http://localhost:5173
- **Network:** http://[your-ip]:5173 (for mobile testing)

### 3. Configure Server URL

1. Click the settings icon (⚙️)
2. Enter your server URL (e.g., `http://192.168.1.100:8080`)
3. Click "Connect"

---

## 📱 Testing on Mobile

### iOS (Safari)

1. Get your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. On your iPhone, open Safari and navigate to:
   ```
   http://[your-ip]:5173
   ```

3. To install as PWA:
   - Tap the Share button
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add"

### Android (Chrome)

1. Get your computer's IP address
2. On your Android device, open Chrome and navigate to:
   ```
   http://[your-ip]:5173
   ```

3. To install as PWA:
   - Tap the menu (⋮)
   - Tap "Install app" or "Add to Home screen"

---

## 🏗️ Project Structure

```
client-web/
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icons/             # App icons (add 192x192 and 512x512 PNGs)
├── src/
│   ├── index.html         # Main HTML
│   ├── css/
│   │   └── app.css        # Styles
│   └── js/
│       ├── app.js         # Main application logic
│       └── api.js         # HTTP API client
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Configuration

### Server URL

The app stores the server URL in `localStorage`. Default: `http://localhost:8080`

### Session Persistence

The app maintains a persistent session ID across page reloads using `localStorage`.

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` directory. You can serve this with any static file server.

### Preview Production Build

```bash
npm run preview
```

---

## 🌐 CORS Configuration

Your server must allow CORS requests from web browsers. Add these headers to your server:

```go
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Session-ID")
```

---

## 📲 Installing as Native App

### Option 1: PWA (No App Stores)

Users can install directly from their browser (see "Testing on Mobile" above).

**Pros:**
- No app store approval needed
- Instant updates
- Works everywhere

**Cons:**
- Less discoverable
- Some native features limited

### Option 2: Capacitor (App Stores)

To wrap as native iOS/Android apps:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Initialize
npx cap init robo-stream com.robomon.robostream RoboStream

# Add platforms
npx cap add ios      # Requires macOS + Xcode
npx cap add android  # Requires Android Studio

# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Open in IDE
npx cap open ios
npx cap open android
```

---

## 🎨 App Icons

Add your app icons to `public/icons/`:

- **icon-192.png** - 192x192px
- **icon-512.png** - 512x512px

You can generate icons from a single image using online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

---

## ✅ Features

- ✅ Touch-optimized button grid
- ✅ Real-time OBS status indicators
- ✅ Multiple configuration support
- ✅ Fullscreen mode
- ✅ Works offline (once loaded)
- ✅ Responsive design (phones, tablets, desktop)
- ✅ PWA installable
- ✅ Session persistence
- ✅ Automatic reconnection

---

## 🔍 Troubleshooting

### Can't connect to server

1. Check that the server is running
2. Verify the server URL is correct
3. Make sure you're on the same network
4. Check firewall settings
5. Verify CORS headers are configured

### Buttons not working

1. Check browser console for errors
2. Verify session ID is present (check console logs)
3. Try clicking settings → Connect to re-establish session
4. Clear browser cache and reload

### Not loading on mobile

1. Verify you're using the correct IP address
2. Check that both devices are on the same network
3. Try disabling VPN or proxy
4. Use `http://` not `https://` for local development

---

## 🚀 Next Steps

1. **Add icons:** Create 192x192 and 512x512 PNG icons
2. **Test on devices:** Try on actual iOS and Android devices
3. **Configure CORS:** Update server to allow web client
4. **Customize:** Modify colors, layout, or features as needed
5. **Deploy:** Build and host on a web server
6. **App stores:** Use Capacitor to create native apps

---

## 📚 Learn More

- [Vite Documentation](https://vitejs.dev/)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Capacitor Documentation](https://capacitorjs.com/)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)

---

## 🐛 Known Issues

- Fullscreen API may not work on all browsers
- iOS Safari requires user interaction before playing audio
- Some older browsers may not support all features

---

## 📄 License

MIT
