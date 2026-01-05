# Building & Packaging Robo-Stream

Complete guide for building and distributing Robo-Stream on all platforms.

## Config File Locations (OS-Standard)

The app now uses OS-standard configuration directories:

| OS | Config Location |
|---|---|
| **macOS** | `~/.robo-stream-server/` |
| **Linux** | `~/.robo-stream-server/` |
| **Windows** | `%APPDATA%\robo-stream-server\` |

The app will automatically create these directories on first run.

## Prerequisites

### All Platforms
```bash
# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### macOS
```bash
xcode-select --install
```

### Linux/Raspberry Pi
```bash
sudo apt update
sudo apt install build-essential libgtk-3-dev libwebkit2gtk-4.0-dev
```

### Windows
- Install [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- Install [Go](https://golang.org/dl/)

## Quick Build (Current Platform Only)

### macOS

## Server
```bash
cd server
make build
open ./build/bin/robo-stream-server.app
```

## Client
```bash
cd client
make build
open ./build/bin/robo-stream-client.app
```

### Linux/Raspberry Pi

## Server
```bash
cd server
make build
./build/bin/robo-stream-server
```

## Client
```bash
cd client
make build
./build/bin/robo-stream-client
```

### Windows

## Server
```bash
cd server
make build
.\build\bin\robostream-deck.exe
```

## Build All Platforms (Cross-Compilation)

From macOS or Windows:

```bash
## Server
cd server
make build-all

## Client
cd client
make build-all
```

This creates:
- `build/bin/robo-stream-server.app` (macOS Universal)
- `build/bin/robo-stream-server.exe` (Windows)

## Development Build (with DevTools)

```bash
wails build
open ./build/bin/robo-stream-server.app
```

DevTools will open automatically (Cmd+Option+I won't work in production builds).

### Can't find config file

The app creates it automatically. Check:
- macOS: `~/Library/Application Support/StreamPi/buttons.json`
- Linux: `~/.config/streampi/buttons.json`
- Windows: `%APPDATA%\StreamPi\buttons.json`

### Build fails with "platform not supported"

Some platforms can only be built from their native OS or require Docker.

**From macOS:**
- ✅ macOS (all)
- ✅ Windows

**From Linux:**
- ⚠️ macOS (requires osxcross)
- ✅ Windows
- ✅ Linux (all)

**From Windows:**
- ⚠️ macOS (not supported)
- ✅ Windows
- ✅ Linux (with WSL/Docker)

## Summary

✅ **No external files needed** - Everything is embedded
✅ **OS-standard config paths** - Works correctly on all platforms  
✅ **No working directory issues** - Run from anywhere
