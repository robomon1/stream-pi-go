# Installation Guide

## Step 1: Extract Files

Extract the `client-web.zip` file into your `robo-stream` project directory:

```bash
cd robo-stream
unzip client-web.zip
```

Your directory structure should now look like:

```
robo-stream/
├── server/          # Existing server
├── client/          # Existing Wails client
└── client-web/      # NEW! Web client
    ├── public/
    ├── src/
    ├── package.json
    └── README.md
```

---

## Step 2: Install Dependencies

```bash
cd client-web
npm install
```

This will install Vite and other necessary dependencies.

---

## Step 3: Start the Server

Make sure your robo-stream server is running:

```bash
cd ../server
wails dev
# OR if already built:
./build/bin/RoboStream.app  # macOS
# ./build/bin/RoboStream     # Linux
# ./build/bin/RoboStream.exe # Windows
```

The server should be running on `http://localhost:8080`

---

## Step 4: Configure CORS (IMPORTANT!)

The web client needs CORS headers to communicate with the server.

### Option A: Update server/internal/api/handler.go

Add CORS middleware:

```go
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    // Add CORS headers
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Session-ID")
    
    // Handle preflight requests
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }
    
    // ... existing routing code
}
```

Then rebuild the server:

```bash
cd ../server
wails build
```

### Option B: Use a CORS Proxy (Quick Test)

For quick testing without modifying the server, you can use a browser extension like:
- "CORS Unblock" (Chrome)
- "CORS Everywhere" (Firefox)

---

## Step 5: Start the Web Client

```bash
cd client-web
npm run dev
```

The client will start at `http://localhost:5173`

---

## Step 6: Open in Browser

Open your browser and navigate to:

```
http://localhost:5173
```

You should see the Robo-Stream client interface!

---

## Step 7: Configure Server URL

1. Click the settings icon (⚙️) in the top right
2. The server URL should be: `http://localhost:8080`
3. Click "Connect"

If everything is working, you should see your button configuration load!

---

## Testing on Mobile Devices

### Get Your Computer's IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: 192.168.1.100
```

**Windows:**
```cmd
ipconfig
# Look for IPv4 Address under your network adapter
```

### On Your Mobile Device

1. Make sure you're on the same Wi-Fi network as your computer

2. Open your mobile browser (Safari on iOS, Chrome on Android)

3. Navigate to:
   ```
   http://[YOUR-IP]:5173
   ```
   For example: `http://192.168.1.100:5173`

4. In settings, set the server URL to:
   ```
   http://[YOUR-IP]:8080
   ```
   For example: `http://192.168.1.100:8080`

5. Click "Connect"

### Install as PWA

**iOS (Safari):**
1. Tap the Share button
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"

**Android (Chrome):**
1. Tap the menu (⋮)
2. Tap "Install app" or "Add to Home screen"

---

## Troubleshooting

### Problem: Can't connect to server

**Solution 1:** Check CORS headers are configured
- Open browser console (F12)
- Look for CORS errors
- Make sure you added CORS headers to the server

**Solution 2:** Check server is running
```bash
curl http://localhost:8080/api/health
# Should return: {"status":"healthy"}
```

**Solution 3:** Check firewall
- Make sure port 8080 is not blocked
- Try temporarily disabling firewall for testing

---

### Problem: Buttons not responding

**Solution 1:** Check session ID
- Open browser console (F12)
- Look for "Registered with server - Session: [ID]"
- If missing, click settings → Connect

**Solution 2:** Clear cache
- Hard reload: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Or clear browser cache completely

---

### Problem: Can't access from mobile

**Solution 1:** Check network
- Make sure both devices are on the same Wi-Fi network
- Verify IP address is correct

**Solution 2:** Check Vite is binding to 0.0.0.0
- The `vite.config.js` should have `host: true`
- This is already configured in the provided files

**Solution 3:** Disable VPN
- VPNs can interfere with local network access
- Try disabling VPN temporarily

---

### Problem: Build errors

**Solution 1:** Delete node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 2:** Update Node.js
- Make sure you have Node.js 18+ installed
- Check version: `node --version`

---

## Next Steps

Once everything is working:

1. **Customize the UI** - Edit `src/css/app.css`
2. **Add app icons** - Create 192x192 and 512x512 PNGs
3. **Build for production** - Run `npm run build`
4. **Create native apps** - Use Capacitor (see Phase 1 guide)
5. **Deploy to web** - Host the `dist/` folder on any web server

---

## Getting Help

If you encounter issues:

1. Check the browser console for errors (F12)
2. Check the server logs
3. Review the README.md for additional info
4. Check that all files extracted correctly

---

## File Checklist

After extraction, verify these files exist:

```
client-web/
├── ✓ package.json
├── ✓ vite.config.js
├── ✓ README.md
├── ✓ INSTALL.md
├── ✓ .gitignore
├── ✓ public/
│   ├── ✓ manifest.json
│   └── ✓ icons/
├── └── src/
    ├── ✓ index.html
    ├── ✓ css/
    │   └── ✓ app.css
    └── ✓ js/
        ├── ✓ app.js
        └── ✓ api.js
```

If any files are missing, re-extract the zip file.

---

Success! 🎉 You now have a working web client that can run on any device!
