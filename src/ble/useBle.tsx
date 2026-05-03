import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BleDevice, getKnownRelics, isWebBluetoothSupported, requestRelic } from "./BleDevice";
import type { DeviceInfo, RelicCommand, RelicState } from "./protocol";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

/** A single connected device with its own state, battery, and send functions. */
export interface DeviceView {
  id: string;
  device: BleDevice;
  info: DeviceInfo;
  state: RelicState | null;
  battery: number | null;
  send: (cmd: RelicCommand) => Promise<void>;
  sendFast: (cmd: RelicCommand) => void;
  disconnect: () => void;
}

interface BleContextValue {
  supported: boolean;
  status: ConnectionStatus;
  error: string | null;
  /** All currently connected devices. */
  devices: DeviceView[];
  // Backward-compat shortcuts — point to the first connected device.
  device: BleDevice | null;
  info: DeviceInfo | null;
  state: RelicState | null;
  battery: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (cmd: RelicCommand) => Promise<void>;
  sendFast: (cmd: RelicCommand) => void;
}

const BleContext = createContext<BleContextValue | null>(null);

interface DeviceEntry {
  id: string;
  device: BleDevice;
  info: DeviceInfo;
}

export function BleProvider({ children }: { children: ReactNode }) {
  const supported = useMemo(() => isWebBluetoothSupported(), []);

  const [entries, setEntries] = useState<DeviceEntry[]>([]);
  const [deviceStates, setDeviceStates] = useState<Record<string, RelicState>>({});
  const [deviceBatteries, setDeviceBatteries] = useState<Record<string, number | null>>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All current device refs for cleanup on unmount.
  const entriesRef = useRef<DeviceEntry[]>([]);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  const removeDevice = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeviceStates(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDeviceBatteries(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // Core wiring: connect a BleDevice and register all listeners/cleanup.
  // Does NOT manage `connecting` state — callers handle that.
  const connectBleDevice = useCallback(async (ble: BleDevice) => {
    const id = ble.id;
    if (entriesRef.current.some(e => e.id === id)) return;

    await ble.connect();

    // Register listeners AFTER connect() so lastBattery replay fires immediately.
    const offState = ble.onState(s =>
      setDeviceStates(prev => ({ ...prev, [id]: s }))
    );
    const offBattery = ble.onBattery(b =>
      setDeviceBatteries(prev => ({ ...prev, [id]: b }))
    );

    const handleDC = () => {
      offState();
      offBattery();
      ble.nativeDevice.removeEventListener("gattserverdisconnected", handleDC);
      removeDevice(id);
    };
    ble.nativeDevice.addEventListener("gattserverdisconnected", handleDC);

    setEntries(prev =>
      prev.some(e => e.id === id)
        ? prev
        : [...prev, { id, device: ble, info: ble.info! }]
    );
  }, [removeDevice]);

  // User-triggered: show connecting state and prompt the device picker.
  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const ble = await requestRelic();
      await connectBleDevice(ble);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "NotFoundError")) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setConnecting(false);
    }
  }, [connectBleDevice]);

  // On mount: silently reconnect any previously authorized relics.
  // getKnownRelics() does not require a user gesture.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    getKnownRelics().then(async relics => {
      for (const ble of relics) {
        if (cancelled) break;
        try { await connectBleDevice(ble); } catch { /* device not in range */ }
      }
    });
    return () => { cancelled = true; };
  }, [supported, connectBleDevice]);

  // Disconnect a specific device by id.
  const disconnectDevice = useCallback((id: string) => {
    const entry = entriesRef.current.find(e => e.id === id);
    if (entry) entry.device.disconnect();
    removeDevice(id);
  }, [removeDevice]);

  // Backward-compat: disconnect the primary device.
  const disconnect = useCallback(() => {
    const primary = entriesRef.current[0];
    if (primary) disconnectDevice(primary.id);
  }, [disconnectDevice]);

  // Auto-disconnect all on unmount (avoids leaking connections during HMR).
  useEffect(() => {
    return () => {
      for (const e of entriesRef.current) e.device.disconnect();
    };
  }, []);

  // Build the DeviceView array — derived from entries + state maps.
  const devices: DeviceView[] = entries.map(e => ({
    id: e.id,
    device: e.device,
    info: e.info,
    state: deviceStates[e.id] ?? null,
    battery: deviceBatteries[e.id] ?? null,
    send: (cmd: RelicCommand) => e.device.send(cmd),
    sendFast: (cmd: RelicCommand) => e.device.sendFast(cmd),
    disconnect: () => disconnectDevice(e.id),
  }));

  // Derived status.
  const status: ConnectionStatus = connecting
    ? "connecting"
    : entries.length > 0
    ? "connected"
    : error
    ? "error"
    : "idle";

  // Backward-compat shortcuts.
  const primary = devices[0] ?? null;
  const device = primary?.device ?? null;
  const info = primary?.info ?? null;
  const state = primary?.state ?? null;
  const battery = primary?.battery ?? null;

  const send = useCallback(async (cmd: RelicCommand) => {
    const p = entriesRef.current[0];
    if (!p) throw new Error("No relic connected.");
    await p.device.send(cmd);
  }, []);

  const sendFast = useCallback((cmd: RelicCommand) => {
    entriesRef.current[0]?.device.sendFast(cmd);
  }, []);

  const value: BleContextValue = {
    supported,
    status,
    error,
    devices,
    device,
    info,
    state,
    battery,
    connect,
    disconnect,
    send,
    sendFast,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error("useBle must be used inside <BleProvider>.");
  return ctx;
}
