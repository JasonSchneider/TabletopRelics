/**
 * Tabletop Relics BLE Protocol
 * --------------------------------------------------------------------------
 * All Tabletop Relics props expose ONE shared GATT service so the same
 * client code can talk to every prop. The prop identifies itself via the
 * `device_info` characteristic, and the app then renders the correct UI.
 *
 * Custom 128-bit UUIDs are derived from the namespace prefix `7461626c`
 * ("tabl" in ASCII) so they're easy to spot when sniffing traffic.
 *
 * Arduino firmware authors: implement these UUIDs in your sketch using
 * ArduinoBLE (Nano 33 BLE / Nano ESP32) or NimBLE-Arduino (ESP32). See
 * /docs/ble-protocol.md for the full spec and example firmware snippets.
 */

export const RELIC_SERVICE_UUID = "7461626c-0000-1000-8000-00805f9b34fb";

export const CHAR_DEVICE_INFO_UUID    = "7461626c-0001-1000-8000-00805f9b34fb"; // READ
export const CHAR_STATE_UUID          = "7461626c-0002-1000-8000-00805f9b34fb"; // READ + NOTIFY
export const CHAR_COMMAND_UUID        = "7461626c-0003-1000-8000-00805f9b34fb"; // WRITE
export const CHAR_TELEMETRY_UUID      = "7461626c-0004-1000-8000-00805f9b34fb"; // NOTIFY
export const CHAR_BATTERY_UUID        = "7461626c-0005-1000-8000-00805f9b34fb"; // READ + NOTIFY (uint8 %)

/** Identifies which physical prop is on the other end of the connection. */
export type DeviceType = "compass" | "lantern" | "fairy-stones" | "unknown";

/** Returned from CHAR_DEVICE_INFO_UUID. JSON-encoded UTF-8. */
export interface DeviceInfo {
  type: DeviceType;
  /** Hardware revision, e.g. "compass-r1". */
  hw: string;
  /** Firmware version, semver-ish. */
  fw: string;
  /** Stable per-unit serial — useful for distinguishing multiple fairy stones. */
  serial: string;
}

/**
 * Commands the app sends to the prop via CHAR_COMMAND_UUID.
 *
 * Encoded as JSON + UTF-8. Keep payloads under 180 bytes to stay within the
 * default ATT MTU on most BLE stacks (negotiate higher MTU later if needed).
 */
export type RelicCommand =
  // Universal
  | { op: "ping" }
  | { op: "identify" } // blink/chirp so the user can find the device
  | { op: "sleep" }

  // Compass
  | { op: "compass.setTarget"; bearing: number /* 0–359 degrees */ }
  | { op: "compass.setColor"; r: number; g: number; b: number }
  | { op: "compass.setColor"; random: true }
  | { op: "compass.setSpeed"; speed: number /* 0–100 */ }
  | { op: "compass.setSpill"; spill: number /* 0–4 neighbors per side */ }
  | { op: "compass.setAll"; all: boolean }
  | { op: "compass.setLeds"; on: boolean }
  | { op: "compass.setSpinDirection"; direction: "cw" | "ccw" }
  | { op: "compass.calibrate" }
  | { op: "compass.setMode"; mode: "ambient" | "quest" | "manual" | "spin" | "pulse" | "random" | "off" }

  // Lantern
  | { op: "lantern.setFlame"; intensity: number /* 0–100 */ }
  | { op: "lantern.setColor"; r: number; g: number; b: number }
  | { op: "lantern.trigger"; effect: "flicker" | "ghost" | "wind" | "snuff" }

  // Fairy Stones
  | { op: "stones.setPattern"; pattern: "breathe" | "twinkle" | "chase" | "off" }
  | { op: "stones.setColor"; r: number; g: number; b: number }
  | { op: "stones.assignRole"; stoneId: string; role: "leader" | "follower" };

/** State pushed from the prop via CHAR_STATE_UUID notifications. */
export type RelicState =
  | { type: "compass"; mode: "ambient" | "quest" | "manual" | "spin" | "pulse" | "random" | "off"; heading: number; target: number; calibrated: boolean; charging?: boolean }
  | { type: "lantern"; intensity: number; color: { r: number; g: number; b: number }; effect: string | null; charging?: boolean }
  | { type: "fairy-stones"; pattern: string; color: { r: number; g: number; b: number }; connectedStones: string[]; charging?: boolean };

/** Telemetry stream (CHAR_TELEMETRY_UUID) — high-frequency sensor data. */
export interface Telemetry {
  /** Milliseconds since prop boot. */
  t: number;
  /** Free-form payload, prop-specific. */
  data: Record<string, number>;
}

// --------- helpers -----------------------------------------------------------

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function decodeJson<T>(value: DataView | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decoder.decode(value)) as T;
  } catch {
    return null;
  }
}

export function encodeCommand(cmd: RelicCommand): BufferSource {
  return encoder.encode(JSON.stringify(cmd));
}
