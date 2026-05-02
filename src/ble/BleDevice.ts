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

  info: DeviceInfo | null = null;

  constructor(device: BluetoothDevice) {
    this.nativeDevice = device;
  }

  get name(): string {
    return this.nativeDevice.name ?? "Unknown Relic";
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
    if (!this.commandChar) {
      throw new Error("Not connected — cannot send command.");
    }
    // writeValueWithoutResponse is faster but writeValueWithResponse is more
    // reliable for important commands; default to with-response for safety.
    await this.commandChar.writeValueWithResponse(encodeCommand(cmd));
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

export function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    typeof navigator.bluetooth?.requestDevice === "function"
  );
}
