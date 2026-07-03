import {
  CHAR_BATTERY_UUID,
  CHAR_COMMAND_UUID,
  CHAR_DEVICE_INFO_UUID,
  CHAR_STATE_UUID,
  CHAR_TELEMETRY_UUID,
  RELIC_SERVICE_UUID,
  type DeviceInfo,
  type RelicCommand,
  type RelicState,
  type Telemetry,
  decodeJson,
  encodeCommand,
} from "./protocol";

type Listener<T> = (value: T) => void;

/**
 * Thin, typed wrapper around a connected Web Bluetooth device that speaks
 * the Tabletop Relics protocol. Owns the GATT connection and exposes
 * subscribe-style hooks for state, telemetry, and battery updates.
 */
export class BleDevice {
  readonly nativeDevice: BluetoothDevice;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;

  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;
  private stateChar: BluetoothRemoteGATTCharacteristic | null = null;
  private telemetryChar: BluetoothRemoteGATTCharacteristic | null = null;
  private batteryChar: BluetoothRemoteGATTCharacteristic | null = null;

  private stateListeners = new Set<Listener<RelicState>>();
  private telemetryListeners = new Set<Listener<Telemetry>>();
  private batteryListeners = new Set<Listener<number>>();
  private lastBattery: number | null = null;

  info: DeviceInfo | null = null;

  constructor(device: BluetoothDevice) {
    this.nativeDevice = device;
  }

  get name(): string {
    if (this.nativeDevice.name) return this.nativeDevice.name;
    const typeNames: Record<string, string> = {
      compass: "Magic Compass",
      lantern: "Magic Lantern",
      "fairy-stones": "Fairy Stones",
    };
    return (this.info?.type && typeNames[this.info.type]) ?? "Unknown Relic";
  }

  get id(): string {
    return this.nativeDevice.id;
  }

  get isConnected(): boolean {
    return this.server?.connected ?? false;
  }

  async connect(): Promise<void> {
    if (!this.nativeDevice.gatt) {
      throw new Error("Device does not support GATT.");
    }
    this.server = await this.nativeDevice.gatt.connect();
    this.service = await this.server.getPrimaryService(RELIC_SERVICE_UUID);

    // Resolve all characteristics in parallel — they're all required.
    const [info, state, command, telemetry, battery] = await Promise.all([
      this.service.getCharacteristic(CHAR_DEVICE_INFO_UUID),
      this.service.getCharacteristic(CHAR_STATE_UUID),
      this.service.getCharacteristic(CHAR_COMMAND_UUID),
      this.service.getCharacteristic(CHAR_TELEMETRY_UUID).catch(() => null),
      this.service.getCharacteristic(CHAR_BATTERY_UUID).catch(() => null),
    ]);

    this.commandChar = command;
    this.stateChar = state;
    this.telemetryChar = telemetry;
    this.batteryChar = battery;

    // Read static device info once.
    const infoValue = await info.readValue();
    this.info = decodeJson<DeviceInfo>(infoValue);

    // Subscribe to notifications.
    await state.startNotifications();
    state.addEventListener("characteristicvaluechanged", this.onStateChanged);

    if (telemetry) {
      await telemetry.startNotifications();
      telemetry.addEventListener(
        "characteristicvaluechanged",
        this.onTelemetryChanged,
      );
    }

    if (battery) {
      // Read current value immediately so it shows on connect without waiting for a notify.
      const batteryValue = await battery.readValue().catch(() => null);
      if (batteryValue && batteryValue.byteLength >= 1) {
        const percent = batteryValue.getUint8(0);
        this.lastBattery = percent;
        this.batteryListeners.forEach((l) => l(percent));
      }
      await battery.startNotifications().catch(() => {
        /* battery notify is optional */
      });
      battery.addEventListener(
        "characteristicvaluechanged",
        this.onBatteryChanged,
      );
    }
  }

  disconnect(): void {
    this.stateChar?.removeEventListener(
      "characteristicvaluechanged",
      this.onStateChanged,
    );
    this.telemetryChar?.removeEventListener(
      "characteristicvaluechanged",
      this.onTelemetryChanged,
    );
    this.batteryChar?.removeEventListener(
      "characteristicvaluechanged",
      this.onBatteryChanged,
    );
    if (this.server?.connected) {
      this.server.disconnect();
    }
  }

  async send(cmd: RelicCommand): Promise<void> {
    if (!this.commandChar) throw new Error("Not connected — cannot send command.");
    await this.commandChar.writeValueWithResponse(encodeCommand(cmd));
  }

  // Fire-and-forget write — no ACK wait. Use for high-frequency updates
  // (slider, real-time color) where latency matters more than reliability.
  sendFast(cmd: RelicCommand): void {
    if (!this.commandChar) return;
    this.commandChar.writeValueWithoutResponse(encodeCommand(cmd)).catch(() => {});
  }

  onState(listener: Listener<RelicState>): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onTelemetry(listener: Listener<Telemetry>): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  onBattery(listener: Listener<number>): () => void {
    this.batteryListeners.add(listener);
    if (this.lastBattery !== null) listener(this.lastBattery);
    return () => this.batteryListeners.delete(listener);
  }

  private onStateChanged = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const parsed = decodeJson<RelicState>(target.value);
    if (parsed) {
      this.stateListeners.forEach((l) => l(parsed));
    }
  };

  private onTelemetryChanged = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const parsed = decodeJson<Telemetry>(target.value);
    if (parsed) {
      this.telemetryListeners.forEach((l) => l(parsed));
    }
  };

  private onBatteryChanged = (event: Event): void => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (value && value.byteLength >= 1) {
      const percent = value.getUint8(0);
      this.lastBattery = percent;
      this.batteryListeners.forEach((l) => l(percent));
    }
  };
}

/**
 * Prompt the user to pick a Relics device. Must be called from a user
 * gesture (click/tap) on browsers that support Web Bluetooth.
 */
export async function requestRelic(): Promise<BleDevice> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "Web Bluetooth isn't supported in this browser. Try Chrome or Edge on desktop, or Chrome on Android. iOS users can install the native app (coming soon).",
    );
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [RELIC_SERVICE_UUID] }],
    // Optional name prefix filter would go here if we settle on a naming scheme.
  });

  return new BleDevice(device);
}

/**
 * Return BleDevice wrappers for all Tabletop Relics devices the browser has
 * previously been granted permission to access. Does not require a user
 * gesture. Returns an empty array if the API is unavailable or no devices
 * are known.
 */
export async function getKnownRelics(): Promise<BleDevice[]> {
  const bt = navigator.bluetooth as Bluetooth & { getDevices?: () => Promise<BluetoothDevice[]> };
  if (!bt?.getDevices) {
    console.warn("[BLE] getDevices() not available in this browser");
    return [];
  }
  try {
    const devices = await bt.getDevices();
    console.log(`[BLE] getDevices() → ${devices.length} device(s):`, devices.map(d => `${d.name} (${d.id})`));
    return devices.map(d => new BleDevice(d));
  } catch (err) {
    console.warn("[BLE] getDevices() threw:", err);
    return [];
  }
}

export function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    typeof navigator.bluetooth?.requestDevice === "function"
  );
}
