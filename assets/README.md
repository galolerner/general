# Assets

Esta carpeta debe contener los assets binarios de la app antes de compilar para
las stores. Reemplaza estos placeholders por tus archivos reales:

- `icon.png` — 1024×1024 PNG, fondo opaco. App icon principal.
- `adaptive-icon.png` — 1024×1024 PNG transparente. Foreground del icono adaptativo de Android.
- `splash.png` — 1284×2778 PNG sobre `#0B0B0F`. Splash screen.
- `notification-icon.png` — 96×96 PNG monocromo (solo alpha) para Android.
- `favicon.png` — 48×48 PNG (web).

`expo prebuild` y `eas build` fallan si faltan, así que añadirlos antes de subir
la primera build a App Store Connect / Google Play Console.
