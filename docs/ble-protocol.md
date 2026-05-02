# Tabletop Relics BLE Protocol (v0.1)

This document describes the GATT service every Tabletop Relics prop
implements. The web app, native iOS/Android apps, and any third-party tooling
all speak this same protocol.

## Why one shared service?

All three flagship props (Magic Compass, Haunted Lantern, Fairy Stones) — and
any future relic — expose a single service. The prop tells the app *what it
is* through a `device_info` characteristic, and the app renders the
appropriate UI. This keeps the firmware skeleton identical across props,
makes BLE sniffing easier to debug, and lets the discovery filter on a single
known UUID.

## Service & characteristics

| Name        | UUID                                   | Properties           | Format      |
| ----------- | -------------------------------------- | -------------------- | ----------- |
| Service     | `7461626c-0000-1000-8000-00805f9b34fb` | —                    | —           |
| Device Info | `7461626c-0001-1000-8000-00805f9b34fb` | READ                 | JSON UTF-8  |
| State       | `7461626c-0002-1000-8000-00805f9b34fb` | READ + NOTIFY        | JSON UTF-8  |
| Command     | `7461626c-0003-1000-8000-00805f9b34fb` | WRITE (with-response) | JSON UTF-8 |
| Telemetry   | `7461626c-0004-1000-8000-00805f9b34fb` | NOTIFY (optional)    | JSON UTF-8  |
| Battery     | `7461626c-0005-1000-8000-00805f9b34fb` | READ + NOTIFY (opt.) | uint8 (%)   |

The UUID prefix `7461626c` is `"tabl"` in ASCII so packets are easy to spot
in nRF Sniffer logs.

> **MTU note:** Keep individual JSON payloads under ~180 bytes. We can
> negotiate a larger MTU later, but 23-byte default ATT MTU + overhead means
> ~180 bytes is the safe ceiling without fragmentation work.

## Device Info

Read once on connect. Tells the app which prop it's talking to.

```json
{
  "type": "compass",        // "compass" | "lantern" | "fairy-stones"
  "hw":   "compass-r1",
  "fw":   "0.1.0",
  "serial": "TR-C-0001"
}
```

## State (NOTIFY)

The prop pushes a fresh state object whenever something changes. The shape
varies per device type (the `type` discriminator tells the app how to read
it).

```jsonc
// Compass
{
  "type": "compass",
  "mode": "quest",        // "ambient" | "quest" | "off"
  "heading": 187,         // 0–359, degrees from magnetic north
  "target":  270,         // 0–359, where the user has aimed it
  "calibrated": true
}

// Lantern
{
  "type": "lantern",
  "intensity": 64,                    // 0–100
  "color": { "r": 245, "g": 158, "b": 11 },
  "effect": "flicker"                 // null when idle
}

// Fairy Stones
{
  "type": "fairy-stones",
  "pattern": "breathe",                                 // see commands
  "color": { "r": 167, "g": 139, "b": 250 },
  "connectedStones": ["TR-S-001", "TR-S-002", "TR-S-007"]
}
```

## Command (WRITE)

The app writes JSON commands. Universal ops work on every prop; namespaced
ops (`compass.*`, `lantern.*`, `stones.*`) only apply to their own type.

```jsonc
// Universal
{ "op": "ping" }
{ "op": "identify" }   // chirp/blink so the user can find the prop
{ "op": "sleep" }

// Compass
{ "op": "compass.setTarget", "bearing": 270 }
{ "op": "compass.calibrate" }
{ "op": "compass.setMode", "mode": "quest" }

// Lantern
{ "op": "lantern.setFlame", "intensity": 64 }
{ "op": "lantern.setColor", "r": 245, "g": 158, "b": 11 }
{ "op": "lantern.trigger", "effect": "flicker" }

// Fairy Stones
{ "op": "stones.setPattern", "pattern": "breathe" }
{ "op": "stones.setColor", "r": 167, "g": 139, "b": 250 }
{ "op": "stones.assignRole", "stoneId": "TR-S-002", "role": "leader" }
```

The Arduino should always validate `op` and ignore unknown values rather
than crashing — forwards-compatibility matters.

## Telemetry (NOTIFY)

High-frequency sensor stream — magnetometer raw, microphone amplitude, IMU,
etc. Free-form `data` payload keyed per prop.

```json
{ "t": 12345, "data": { "mx": -120, "my": 41, "mz": 800 } }
```

Notifications should be throttled in firmware (e.g. 10–20 Hz) to avoid
flooding the link.

## Battery

Standard one-byte percentage 0–100. Notifies when value changes by ≥1%.

## Reference firmware (Arduino)

A minimal sketch using the **ArduinoBLE** library on a Nano 33 BLE / Nano
ESP32 looks roughly like this:

```cpp
#include <ArduinoBLE.h>

const char* SERVICE = "7461626c-0000-1000-8000-00805f9b34fb";
const char* INFO_C  = "7461626c-0001-1000-8000-00805f9b34fb";
const char* STATE_C = "7461626c-0002-1000-8000-00805f9b34fb";
const char* CMD_C   = "7461626c-0003-1000-8000-00805f9b34fb";

BLEService relicService(SERVICE);
BLEStringCharacteristic infoChar (INFO_C,  BLERead,           120);
BLEStringCharacteristic stateChar(STATE_C, BLERead | BLENotify, 180);
BLEStringCharacteristic cmdChar  (CMD_C,   BLEWrite,          180);

void setup() {
  BLE.begin();
  BLE.setLocalName("Tabletop Compass");
  BLE.setAdvertisedService(relicService);
  relicService.addCharacteristic(infoChar);
  relicService.addCharacteristic(stateChar);
  relicService.addCharacteristic(cmdChar);
  BLE.addService(relicService);

  infoChar.writeValue("{\"type\":\"compass\",\"hw\":\"compass-r1\",\"fw\":\"0.1.0\",\"serial\":\"TR-C-0001\"}");
  cmdChar.setEventHandler(BLEWritten, onCommand);

  BLE.advertise();
}

void onCommand(BLEDevice /*central*/, BLECharacteristic ch) {
  String json = ((BLEStringCharacteristic&)ch).value();
  // parse with ArduinoJson, dispatch by op...
}

void loop() {
  BLE.poll();
  // sample sensors, push state via stateChar.writeValue(...)
}
```

Use **ArduinoJson** (or a small hand-rolled parser, since payloads are
tiny) to encode/decode messages.

## Versioning

The protocol version is implicit in `device_info.fw`. Breaking changes bump
the major version; the app shows an "update firmware" prompt when the major
version it knows doesn't match the device's.
