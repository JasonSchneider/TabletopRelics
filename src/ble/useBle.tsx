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

const LAST_DEVICE_KEY = "relic:lastDevice";

function saveLastDevice(name: string) {
  try { localStorage.setItem(LAST_DEVICE_KEY, name); } catch { /* ignore */ }
}
function clearLastDevice() {
  try { localStorage.removeItem(LAST_DEVICE_KEY); } catch { /* ignore */ }
}
function readLastDevice(): string | null {
  try { return localStorage.getItem(LAST_DEVICE_KEY); } catch { return null; }
}

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
  /** Name of the last successfully connected device, persisted across page loads. */
  lastKnownName: string | null;
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

// Exponential backoff delays for auto-reconnect (ms): ~3 min total window.
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000];

export function BleProvider({ children }: { children: ReactNode }) {
  const supported = useMemo(() => isWebBluetoothSupported(), []);

  const [entries, setEntries] = useState<DeviceEntry[]>([]);
  const [deviceStates, setDeviceStates] = useState<Record<string, RelicState>>({});
  const [deviceBatteries, setDeviceBatteries] = useState<Record<string, number | null>>({});
  const [connecting, setConnecting] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastKnownName, setLastKnownName] = useState<string | null>(() => readLastDevice());

  // All current device refs for cleanup on unmount.
  const entriesRef = useRef<DeviceEntry[]>([]);
  useEffect(() => { entriesRef.current = entries; }, [entries]);

  // IDs of devices the user explicitly disconnected — skip auto-reconnect for these.
  const cancelledReconnectsRef = useRef<Set<string>>(new Set());

  const removeDevice = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeviceStates(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDeviceBatteries(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // Core wiring: connect a BleDevice and register all listeners/cleanup.
  // When the connection drops unexpectedly, automatically retries with backoff.
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

    const handleDC = async () => {
      offState();
      offBattery();
      ble.nativeDevice.removeEventListener("gattserverdisconnected", handleDC);
      removeDevice(id);

      // User explicitly disconnected this device — don't auto-reconnect.
      if (cancelledReconnectsRef.current.has(id)) return;

      // Unexpected disconnect — attempt to reconnect automatically.
      console.log(`[BLE] ${ble.name} disconnected unexpectedly, auto-reconnecting…`);
      setReconnectCount(c => c + 1);
      try {
        for (const delay of RECONNECT_DELAYS) {
          await new Promise(r => setTimeout(r, delay));
          if (cancelledReconnectsRef.current.has(id)) return;
          if (entriesRef.current.some(e => e.id === id)) return; // reconnected elsewhere
          console.log(`[BLE] auto-reconnect attempt for ${ble.name}…`);
          try {
            await connectBleDevice(ble);
            console.log(`[BLE] ${ble.name} reconnected ✓`);
            return;
          } catch (err) {
            console.warn(`[BLE] reconnect attempt failed:`, err);
          }
        }
        console.warn(`[BLE] ${ble.name} reconnect gave up after all attempts`);
      } finally {
        setReconnectCount(c => c - 1);
      }
    };

    ble.nativeDevice.addEventListener("gattserverdisconnected", handleDC);

    setEntries(prev =>
      prev.some(e => e.id === id)
        ? prev
        : [...prev, { id, device: ble, info: ble.info! }]
    );

    // Remember device name so the header can offer a one-tap reconnect on page refresh.
    saveLastDevice(ble.name);
    setLastKnownName(ble.name);
  }, [removeDevice]);

  // User-triggered: show connecting state and prompt the device picker.
  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const ble = await requestRelic();
      // Clear any cancelled flag in case the user is reconnecting a previously
      // disconnected device.
      cancelledReconnectsRef.current.delete(ble.id);
      await connectBleDevice(ble);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "NotFoundError")) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setConnecting(false);
    }
  }, [connectBleDevice]);

  // On mount: reconnect any previously authorized relics via getDevices().
  // Falls back gracefully when the API is unavailable (some browsers/versions).
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    async function autoReconnect() {
      const relics = await getKnownRelics();
      if (!relics.length || cancelled) {
        console.log("[BLE] auto-reconnect: no known relics via getDevices(), skipping");
        return;
      }

      console.log(`[BLE] auto-reconnect: attempting ${relics.length} device(s)`);
      setConnecting(true);
      // Give the device ~800 ms to tear down the old connection and resume advertising.
      await new Promise(r => setTimeout(r, 800));

      for (const ble of relics) {
        // Retry up to 4 times (at 0, 2, 4, 6 s) per device.
        for (let attempt = 0; attempt < 4; attempt++) {
          if (cancelled) break;
          console.log(`[BLE] auto-reconnect: ${ble.name} attempt ${attempt + 1}/4`);
          try {
            await connectBleDevice(ble);
            console.log(`[BLE] auto-reconnect: ${ble.name} connected ✓`);
            break;
          } catch (err) {
            console.warn(`[BLE] auto-reconnect: ${ble.name} attempt ${attempt + 1} failed:`, err);
            if (attempt < 3 && !cancelled) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            }
          }
        }
      }

      if (!cancelled) setConnecting(false);
    }

    autoReconnect();
    return () => { cancelled = true; };
  }, [supported, connectBleDevice]);

  // Disconnect a specific device by id (user-initiated — cancels auto-reconnect).
  const disconnectDevice = useCallback((id: string) => {
    cancelledReconnectsRef.current.add(id);
    const entry = entriesRef.current.find(e => e.id === id);
    if (entry) entry.device.disconnect();
    removeDevice(id);
  }, [removeDevice]);

  // Backward-compat: disconnect the primary device.
  const disconnect = useCallback(() => {
    const primary = entriesRef.current[0];
    if (primary) disconnectDevice(primary.id);
    clearLastDevice();
    setLastKnownName(null);
  }, [disconnectDevice]);

  // Auto-disconnect all on unmount (avoids leaking connections during HMR).
  useEffect(() => {
    return () => {
      for (const e of entriesRef.current) e.device.disconnect();
    };
  }, []);

  // Warn before page refresh/close when a relic is connected.
  useEffect(() => {
    if (entries.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set to trigger the dialog.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [entries.length]);

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

  // Derived status — reconnecting counts as "connecting" so the UI reflects it.
  const status: ConnectionStatus = (connecting || reconnectCount > 0)
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
    lastKnownName,
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
