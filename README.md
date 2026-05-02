# Tabletop Relics

A Progressive Web App that controls Arduino-based tabletop props over
Bluetooth Low Energy. The first three relics are the **Magic Compass**, the
**Haunted Lantern**, and the **Fairy Stones**.

This repo is the client app. The Arduino firmware that runs on each prop is
in a sibling repository (TBD); the BLE protocol they share is documented in
[`docs/ble-protocol.md`](./docs/ble-protocol.md).

## Stack

- **Vite + React 18 + TypeScript** — fast dev, typed everywhere.
- **Tailwind CSS** — responsive, themeable, no CSS file sprawl.
- **react-router-dom** — one route per relic.
- **vite-plugin-pwa** — installable on phones and desktop, offline shell.
- **Web Bluetooth** — talks directly to the Arduino over BLE GATT.

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints. Vite is configured with `host: true` so you
can also open it from your phone on the same Wi-Fi.

```bash
npm run build      # production build
npm run preview    # preview the production build (also exposed on LAN)
npm run lint       # type-check
```

## Browser support

Web Bluetooth is the gating factor:

| Platform | Supported? | Notes |
| --- | --- | --- |
| Chrome / Edge desktop (Win/macOS/Linux) | ✅ | First-class |
| Chrome on Android | ✅ | Works great |
| Safari on macOS | ❌ | No Web Bluetooth |
| **Safari on iOS** | ❌ | **No Web Bluetooth** — see "iOS plan" below |
| Firefox | ❌ | Behind a flag, not recommended |

For testing, Chrome desktop is the smoothest path. **Web Bluetooth requires
a secure context (HTTPS or localhost)**, so when testing from a phone over
the LAN you'll either need to:

1. use `localhost` (won't reach the phone),
2. set up a local HTTPS dev cert (e.g. with `mkcert`), or
3. tunnel via something like `ngrok` / `cloudflared` to get an HTTPS URL.

## iOS plan

iOS Safari does not support Web Bluetooth. The plan is to wrap this PWA
with [Capacitor](https://capacitorjs.com) and use a community Bluetooth
plugin (e.g. `@capacitor-community/bluetooth-le`) so the same code runs as a
real iOS app with full BLE access. The architecture intentionally keeps all
BLE access behind `src/ble/` so swapping the implementation is a one-file
change.

A similar Capacitor wrapper handles Android too if we'd rather ship to the
Play Store than ask users to install the PWA.

## Project structure

```
src/
├── ble/
│   ├── protocol.ts      # UUIDs, message types, codecs
│   ├── BleDevice.ts     # typed wrapper around BluetoothDevice
│   └── useBle.tsx       # React context + hook for app-wide BLE state
├── components/
│   ├── AppShell.tsx     # responsive header, nav, layout chrome
│   ├── ConnectionBadge.tsx
│   └── PropCard.tsx
├── pages/
│   ├── Home.tsx         # picks a relic
│   ├── Compass.tsx
│   ├── Lantern.tsx
│   ├── FairyStones.tsx
│   └── NotFound.tsx
├── App.tsx
├── main.tsx
└── index.css
docs/
└── ble-protocol.md      # the GATT service every prop implements
```

## What works today

- Discover and connect to a Tabletop Relics device that advertises the
  shared service UUID.
- Read device info, subscribe to state and battery notifications.
- Send typed commands for the compass, lantern, and fairy stones.
- Render a UI per relic with placeholder controls wired to real BLE writes.

## What's next

- Real Arduino firmware sketches for each prop (sibling repo).
- Per-prop telemetry visualizations (compass calibration helper, lantern
  audio reactivity, fairy-stone proximity map).
- Capacitor wrap for iOS/Android.
- Persisted device pairing (`navigator.bluetooth.getDevices()`) so a relic
  remembers its phone.
- Onboarding flow that walks a new user through pairing their first prop.

## License

TBD.
