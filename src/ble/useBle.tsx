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
import { BleDevice, isWebBluetoothSupported, requestRelic } from "./BleDevice";
import type { DeviceInfo, RelicCommand, RelicState } from "./protocol";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

interface BleContextValue {
  supported: boolean;
  status: ConnectionStatus;
  error: string | null;
  device: BleDevice | null;
  info: DeviceInfo | null;
  state: RelicState | null;
  battery: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (cmd: RelicCommand) => Promise<void>;
}

const BleContext = createContext<BleContextValue | null>(null);

export function BleProvider({ children }: { children: ReactNode }) {
  const supported = useMemo(() => isWebBluetoothSupported(), []);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<BleDevice | null>(null);
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [state, setState] = useState<RelicState | null>(null);
  const [battery, setBattery] = useState<number | null>(null);

  // Keep the latest device reachable from event handlers without stale closures.
  const deviceRef = useRef<BleDevice | null>(null);

  const handleDisconnect = useCallback(() => {
    setStatus("idle");
    setDevice(null);
    setInfo(null);
    setState(null);
    setBattery(null);
    deviceRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const ble = await requestRelic();
      ble.nativeDevice.addEventListener("gattserverdisconnected", handleDisconnect);
      await ble.connect();

      const offState = ble.onState((s) => setState(s));
      const offBattery = ble.onBattery((b) => setBattery(b));

      // When the device disconnects, clean up listeners.
      const cleanup = () => {
        offState();
        offBattery();
        ble.nativeDevice.removeEventListener(
          "gattserverdisconnected",
          cleanup,
        );
      };
      ble.nativeDevice.addEventListener("gattserverdisconnected", cleanup);

      setDevice(ble);
      setInfo(ble.info);
      setStatus("connected");
      deviceRef.current = ble;
    } catch (err) {
      // The user canceling the chooser surfaces as a NotFoundError —
      // treat that as benign and just return to idle.
      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof DOMException && err.name === "NotFoundError") {
        setStatus("idle");
        return;
      }
      setError(message);
      setStatus("error");
    }
  }, [handleDisconnect]);

  const disconnect = useCallback(() => {
    deviceRef.current?.disconnect();
    handleDisconnect();
  }, [handleDisconnect]);

  const send = useCallback(async (cmd: RelicCommand) => {
    const current = deviceRef.current;
    if (!current) {
      throw new Error("No relic connected.");
    }
    await current.send(cmd);
  }, []);

  // Auto-disconnect on unmount to avoid leaking connections during HMR.
  useEffect(() => {
    return () => {
      deviceRef.current?.disconnect();
    };
  }, []);

  const value: BleContextValue = {
    supported,
    status,
    error,
    device,
    info,
    state,
    battery,
    connect,
    disconnect,
    send,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle(): BleContextValue {
  const ctx = useContext(BleContext);
  if (!ctx) {
    throw new Error("useBle must be used inside <BleProvider>.");
  }
  return ctx;
}
