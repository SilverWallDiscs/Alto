# Alto — Video Editor

A full-featured desktop video editor built with Electron + React.

## Features

- Multi-track timeline (video, audio, image)
- 22 video effects (blur, color grade, chroma key, speed, etc.)
- 24 transitions (dissolve, wipes, zoom, glitch, film burn, etc.)
- 10 audio effects (equalizer, reverb, delay, compressor, etc.)
- Color correction panel
- Export presets (YouTube 1080p/4K, Instagram, TikTok, Twitter, Custom)
- Full keyboard shortcuts
- Undo/Redo (50 levels)
- Auto-update via GitHub Releases

## Development

```bash
npm install
npm run dev:renderer   # Start webpack dev server
# In another terminal:
npx electron .         # Launch Electron
```

## Build Installer

```bash
npm run build
# Output: dist/Alto Setup 1.0.0.exe
```

## Auto-Update

Releases on GitHub trigger the CI workflow. The app checks for updates 5 seconds after launch and shows a banner when one is ready.

To release a new version:
1. Bump version in `package.json`
2. `git tag v1.x.x && git push --tags`
3. GitHub Actions builds and publishes the installer automatically.
