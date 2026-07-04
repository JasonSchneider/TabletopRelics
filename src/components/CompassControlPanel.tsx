import { useEffect, useRef, useState } from "react";
import type { RelicCommand } from "../ble/protocol";

type TopMode = "compass" | "manual" | "calibrate";

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

const COLOR_PRESETS = [
  { label: "Blue",   hex: "#00b4ff" },
  { label: "Gold",   hex: "#ffc800" },
  { label: "Green",  hex: "#00ff8c" },
  { label: "Violet", hex: "#7800ff" },
  { label: "Red",    hex: "#ff2000" },
  { label: "White",  hex: "#ffffff" },
];

interface Props {
  connected: boolean;
  calibrated?: boolean;
  send: (cmd: RelicCommand) => Promise<void>;
  sendFast: (cmd: RelicCommand) => void;
}

export function CompassControlPanel({ connected, calibrated = false, send, sendFast }: Props) {
  const [topMode, setTopMode]               = useState<TopMode>("compass");
  const [pointingNorth, setPointingNorth]   = useState(true);
  const [ledsOn, setLedsOn]                 = useState(true);
  const [target, setTarget]                 = useState(0);
  const [color, setColor]                   = useState("#00b4ff");
  const [brightness, setBrightness]         = useState(78);
  const [spread, setSpread]                 = useState(0);
  const [spreadIntensity, setSpreadIntensity] = useState(50);
  const [allLeds, setAllLeds]               = useState(false);
  const [randomColor, setRandomColor]       = useState(false);
  const [spinEnabled, setSpinEnabled]       = useState(false);
  const [spinDirection, setSpinDirection]   = useState<"cw" | "ccw">("cw");
  const [spinSpeed, setSpinSpeed]           = useState(50);
  const [pulseEnabled, setPulseEnabled]     = useState(false);
  const [pulseSpeed, setPulseSpeed]         = useState(50);

  const [calibrationSuccess, setCalibrationSuccess] = useState(false);
  const [magCalActive, setMagCalActive]             = useState(false);
  const [magCalDone, setMagCalDone]                 = useState(false);

  const bearingDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevConnected = useRef(false);
  const isManual = topMode === "manual";
  const isCompass = topMode === "compass";

  // Push full UI state to the device on connect/reconnect.
  function syncToDevice() {
    sendFast({ op: "compass.setBrightness", brightness });
    sendFast({ op: "compass.setSpreadIntensity", intensity: spreadIntensity });
    sendFast({ op: "compass.setLeds", on: ledsOn });
    if (randomColor) {
      sendFast({ op: "compass.setColor", random: true });
    } else {
      const { r, g, b } = hexToRgb(color);
      sendFast({ op: "compass.setColor", r, g, b });
    }
    sendFast({ op: "compass.setAll", all: allLeds });
    sendFast({ op: "compass.setSpill", spill: spread });

    if (topMode === "compass") {
      if (pointingNorth) {
        sendFast({ op: "compass.setMode", mode: "ambient" });
      } else {
        sendFast({ op: "compass.setTarget", bearing: target });
        sendFast({ op: "compass.setMode", mode: "quest" });
      }
    } else if (topMode === "manual" || topMode === "calibrate") {
      sendFast({ op: "compass.setSpinDirection", direction: spinDirection });
      if (spinEnabled) sendFast({ op: "compass.setSpeed", speed: spinSpeed });
      else if (pulseEnabled) sendFast({ op: "compass.setSpeed", speed: pulseSpeed });
      sendFast({ op: "compass.setTarget", bearing: target });
      sendFast({ op: "compass.setMode", mode: derivedManualMode(spinEnabled, pulseEnabled) });
    }
  }

  useEffect(() => {
    if (connected && !prevConnected.current) syncToDevice();
    prevConnected.current = connected;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  function derivedManualMode(spin: boolean, pulse: boolean) {
    if (spin && pulse) return "spin-pulse" as const;
    if (spin) return "spin" as const;
    if (pulse) return "pulse" as const;
    return "manual" as const;
  }

  function manualFirmwareMode() {
    return derivedManualMode(spinEnabled, pulseEnabled);
  }

  function switchTopMode(m: TopMode) {
    setTopMode(m);
    if (!connected) return;
    if (m === "calibrate") {
      // Don't send calibrate command yet — user presses the button when ready.
    } else if (m === "compass") {
      if (randomColor) sendFast({ op: "compass.setColor", random: true });
      else { const { r, g, b } = hexToRgb(color); sendFast({ op: "compass.setColor", r, g, b }); }
      sendFast({ op: "compass.setSpill", spill: spread });
      if (pointingNorth) {
        send({ op: "compass.setMode", mode: "ambient" });
      } else {
        sendFast({ op: "compass.setTarget", bearing: target });
        send({ op: "compass.setMode", mode: "quest" });
      }
    } else if (m === "manual") {
      send({ op: "compass.setMode", mode: manualFirmwareMode() });
    }
  }

  function handleToggleNorthCustom() {
    const next = !pointingNorth;
    setPointingNorth(next);
    if (!connected) return;
    if (next) {
      send({ op: "compass.setMode", mode: "ambient" });
    } else {
      sendFast({ op: "compass.setTarget", bearing: target });
      send({ op: "compass.setMode", mode: "quest" });
    }
  }

  function handleBrightnessChange(value: number) {
    setBrightness(value);
    sendFast({ op: "compass.setBrightness", brightness: value });
  }

  function handleLedsToggle() {
    const next = !ledsOn;
    setLedsOn(next);
    if (connected) send({ op: "compass.setLeds", on: next });
  }

  function handleBearingChange(value: number) {
    setTarget(value);
    if (isCompass && pointingNorth) return; // pre-set locally; send on switch to custom
    if (bearingDebounce.current) clearTimeout(bearingDebounce.current);
    bearingDebounce.current = setTimeout(() => {
      sendFast({ op: "compass.setTarget", bearing: value });
    }, 16);
  }

  function handleAllLedsToggle() {
    const next = !allLeds;
    setAllLeds(next);
    if (connected) send({ op: "compass.setAll", all: next });
  }

  function handleSpreadChange(value: number) {
    setSpread(value);
    sendFast({ op: "compass.setSpill", spill: value });
  }

  function handleSpreadIntensityChange(value: number) {
    setSpreadIntensity(value);
    sendFast({ op: "compass.setSpreadIntensity", intensity: value });
  }

  function handleColorChange(hex: string) {
    setColor(hex);
    setRandomColor(false);
    const { r, g, b } = hexToRgb(hex);
    sendFast({ op: "compass.setColor", r, g, b });
  }

  function handleRandomColor(on: boolean) {
    setRandomColor(on);
    if (!connected) return;
    if (on) {
      send({ op: "compass.setColor", random: true });
    } else {
      const { r, g, b } = hexToRgb(color);
      send({ op: "compass.setColor", r, g, b });
    }
  }

  function handleSpinToggle() {
    const next = !spinEnabled;
    setSpinEnabled(next);
    if (!connected) return;
    const mode = derivedManualMode(next, pulseEnabled);
    send({ op: "compass.setMode", mode });
    if (next) {
      send({ op: "compass.setSpinDirection", direction: spinDirection });
      send({ op: "compass.setSpeed", speed: spinSpeed });
    }
  }

  function handleSpinDirection(dir: "cw" | "ccw") {
    setSpinDirection(dir);
    if (connected && spinEnabled) send({ op: "compass.setSpinDirection", direction: dir });
  }

  function handleSpinSpeedChange(value: number) {
    setSpinSpeed(value);
    if (spinEnabled) sendFast({ op: "compass.setSpeed", speed: value });
  }

  function handlePulseToggle() {
    const next = !pulseEnabled;
    setPulseEnabled(next);
    if (!connected) return;
    const mode = derivedManualMode(spinEnabled, next);
    send({ op: "compass.setMode", mode });
    if (next) send({ op: "compass.setSpeed", speed: pulseSpeed });
  }

  function handlePulseSpeedChange(value: number) {
    setPulseSpeed(value);
    if (pulseEnabled) sendFast({ op: "compass.setSpeed", speed: value });
  }

  async function handleStartMagCal() {
    await send({ op: "compass.startMagCal" });
    setMagCalActive(true);
    setMagCalDone(false);
  }

  async function handleFinishMagCal() {
    await send({ op: "compass.finishMagCal" });
    setMagCalActive(false);
    setMagCalDone(true);
    setTimeout(() => setMagCalDone(false), 4000);
    switchTopMode("compass");
  }

  async function handleSetNorth() {
    await send({ op: "compass.calibrate" });
    setCalibrationSuccess(true);
    setTimeout(() => setCalibrationSuccess(false), 4000);
  }

  // Shared color picker block used in both compass and manual modes.
  function ColorPicker() {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Color</label>
          <button onClick={() => handleRandomColor(!randomColor)}
            className={[
              "text-xs px-2 py-0.5 rounded border transition-colors",
              randomColor
                ? "bg-relic-rune/30 border-relic-rune/60 text-relic-parchment"
                : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
            ].join(" ")}
          >🎲 Random</button>
        </div>
        <div className={`flex items-center gap-3 transition-opacity ${randomColor ? "opacity-30 pointer-events-none" : ""}`}>
          <input type="color" value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
          />
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map(({ label, hex }) => (
              <button key={hex} onClick={() => handleColorChange(hex)} title={label}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: hex, borderColor: color === hex && !randomColor ? "#fff" : "transparent" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* LEDs on/off — always visible */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-relic-parchment/60">LEDs</p>
        <button onClick={handleLedsToggle}
          className={[
            "text-xs px-3 py-1 rounded border transition-colors",
            ledsOn
              ? "bg-relic-rune/30 border-relic-rune/60 text-relic-parchment"
              : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
          ].join(" ")}
        >{ledsOn ? "On" : "Off"}</button>
      </div>

      {/* Brightness — always visible, caps all LED output */}
      <div>
        <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Brightness</label>
        <input type="range" min={0} max={100} value={brightness}
          onChange={(e) => handleBrightnessChange(Number(e.target.value))}
          className="w-full mt-2 accent-relic-glow"
        />
        <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
          <span>Off</span>
          <span className="text-relic-rune font-display text-base">{brightness}%</span>
          <span>Full</span>
        </div>
      </div>

      {/* Mode */}
      <div>
        <p className="text-xs uppercase tracking-wider text-relic-parchment/60 mb-2">Mode</p>
        <div className="flex gap-2 flex-wrap">
          {(["compass", "manual", "calibrate"] as TopMode[]).map((m) => (
            <button key={m} onClick={() => switchTopMode(m)}
              className={[
                "px-3 py-1.5 rounded-md text-sm capitalize transition-colors",
                topMode === m
                  ? "bg-relic-glow/30 text-relic-parchment border border-relic-glow/50"
                  : "bg-white/5 text-relic-parchment/60 hover:text-relic-parchment hover:bg-white/10 border border-white/10",
              ].join(" ")}
            >{m}</button>
          ))}
        </div>
      </div>

      {/* ── Compass mode ── */}
      {isCompass && (
        <>
          <ColorPicker />

          {/* Target bearing — always visible; pre-sets target while in North mode */}
          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Target Bearing</label>
            <input type="range" min={0} max={359} value={target}
              onChange={(e) => handleBearingChange(Number(e.target.value))}
              className="w-full mt-2 accent-relic-glow"
            />
            <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
              <span>0°</span>
              <span className="text-relic-rune font-display text-base">{target}°</span>
              <span>359°</span>
            </div>
          </div>

          {/* North / Custom toggle */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleNorthCustom}
              className={[
                "flex-1 py-2 rounded-md text-sm font-medium border transition-colors",
                pointingNorth
                  ? "bg-relic-glow/30 text-relic-parchment border-relic-glow/50"
                  : "bg-white/5 text-relic-parchment/60 hover:text-relic-parchment hover:bg-white/10 border-white/10",
              ].join(" ")}
            >
              True North
            </button>
            <button
              onClick={handleToggleNorthCustom}
              className={[
                "flex-1 py-2 rounded-md text-sm font-medium border transition-colors",
                !pointingNorth
                  ? "bg-relic-glow/30 text-relic-parchment border-relic-glow/50"
                  : "bg-white/5 text-relic-parchment/60 hover:text-relic-parchment hover:bg-white/10 border-white/10",
              ].join(" ")}
            >
              {target}° Custom
            </button>
          </div>

          {/* Spread */}
          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Spread</label>
            <input type="range" min={0} max={4} step={1} value={spread}
              onChange={(e) => handleSpreadChange(Number(e.target.value))}
              className="w-full mt-2 accent-relic-glow"
            />
            <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
              <span>None</span>
              <span className="text-relic-rune font-display text-base">{spread}</span>
              <span>Wide</span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Spread Intensity</label>
            <input type="range" min={10} max={100} step={5} value={spreadIntensity}
              onChange={(e) => handleSpreadIntensityChange(Number(e.target.value))}
              className="w-full mt-2 accent-relic-glow"
            />
            <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
              <span>Dim</span>
              <span className="text-relic-rune font-display text-base">{spreadIntensity}%</span>
              <span>Bright</span>
            </div>
          </div>
        </>
      )}

      {/* ── Manual mode ── */}
      {isManual && (
        <>
          <ColorPicker />

          {/* Bearing */}
          <div className={allLeds ? "opacity-40 pointer-events-none" : ""}>
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Bearing</label>
            <input type="range" min={0} max={359} value={target}
              onChange={(e) => handleBearingChange(Number(e.target.value))}
              className="w-full mt-2 accent-relic-glow"
            />
            <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
              <span>0°</span>
              <span className="text-relic-rune font-display text-base">{target}°</span>
              <span>359°</span>
            </div>
          </div>

          {/* All LEDs */}
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-relic-parchment/60">All LEDs</label>
            <button onClick={handleAllLedsToggle}
              className={[
                "text-xs px-3 py-1 rounded border transition-colors",
                allLeds
                  ? "bg-relic-rune/30 border-relic-rune/60 text-relic-parchment"
                  : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
              ].join(" ")}
            >{allLeds ? "On" : "Off"}</button>
          </div>

          {!allLeds && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Spread</label>
                <input type="range" min={0} max={4} step={1} value={spread}
                  onChange={(e) => handleSpreadChange(Number(e.target.value))}
                  className="w-full mt-2 accent-relic-glow"
                />
                <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                  <span>None</span>
                  <span className="text-relic-rune font-display text-base">{spread}</span>
                  <span>Wide</span>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-relic-parchment/60">Spread Intensity</label>
                <input type="range" min={10} max={100} step={5} value={spreadIntensity}
                  onChange={(e) => handleSpreadIntensityChange(Number(e.target.value))}
                  className="w-full mt-2 accent-relic-glow"
                />
                <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                  <span>Dim</span>
                  <span className="text-relic-rune font-display text-base">{spreadIntensity}%</span>
                  <span>Bright</span>
                </div>
              </div>
            </div>
          )}

          {/* Spin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-relic-parchment/60">Spin</p>
              <button onClick={handleSpinToggle}
                className={[
                  "text-xs px-3 py-1 rounded border transition-colors",
                  spinEnabled
                    ? "bg-relic-rune/30 border-relic-rune/60 text-relic-parchment"
                    : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
                ].join(" ")}
              >{spinEnabled ? "On" : "Off"}</button>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <p className="text-xs text-relic-parchment/50 w-20 shrink-0">Direction</p>
              <div className="flex gap-1.5">
                {(["cw", "ccw"] as const).map((dir) => (
                  <button key={dir} onClick={() => handleSpinDirection(dir)}
                    className={[
                      "px-2.5 py-1 rounded text-xs uppercase tracking-wide border transition-colors",
                      spinDirection === dir
                        ? "bg-relic-rune/40 border-relic-rune/60 text-relic-parchment"
                        : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
                    ].join(" ")}
                  >{dir}</button>
                ))}
              </div>
            </div>
            <div className="pl-1">
              <label className="text-xs text-relic-parchment/50">Speed</label>
              <input type="range" min={1} max={100} value={spinSpeed}
                onChange={(e) => handleSpinSpeedChange(Number(e.target.value))}
                className="w-full mt-2 accent-relic-glow"
              />
              <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                <span>Slow</span>
                <span className="text-relic-rune font-display text-base">{spinSpeed}</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Pulse */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-relic-parchment/60">Pulse</p>
              <button onClick={handlePulseToggle}
                className={[
                  "text-xs px-3 py-1 rounded border transition-colors",
                  pulseEnabled
                    ? "bg-relic-rune/30 border-relic-rune/60 text-relic-parchment"
                    : "bg-white/5 border-white/10 text-relic-parchment/50 hover:text-relic-parchment",
                ].join(" ")}
              >{pulseEnabled ? "On" : "Off"}</button>
            </div>
            <div className="pl-1">
              <label className="text-xs text-relic-parchment/50">Speed</label>
              <input type="range" min={1} max={100} value={pulseSpeed}
                onChange={(e) => handlePulseSpeedChange(Number(e.target.value))}
                className="w-full mt-2 accent-relic-glow"
              />
              <div className="flex justify-between text-xs text-relic-parchment/50 mt-1">
                <span>Slow</span>
                <span className="text-relic-rune font-display text-base">{pulseSpeed}</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Calibrate mode ── */}
      {topMode === "calibrate" && (
        <div className="space-y-6">

          {/* Overall status */}
          <div className="flex items-center gap-2">
            <span className={[
              "w-2 h-2 rounded-full shrink-0",
              (calibrated || calibrationSuccess)
                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                : "bg-relic-parchment/20",
            ].join(" ")} />
            <span className="text-xs text-relic-parchment/60">
              {(calibrated || calibrationSuccess) ? "Calibrated" : "Not yet calibrated"}
            </span>
          </div>

          {/* Step 1: Magnetic calibration */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-relic-parchment/60">
              Step 1 — Magnetic calibration
            </p>
            <div className="rounded-md border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm text-relic-parchment/80 font-medium">
                {magCalActive ? "Collecting — keep rotating…" : "Remove magnetic interference"}
              </p>
              {magCalActive ? (
                <p className="text-sm text-relic-parchment/60">
                  Slowly rotate the device through all orientations — tip it forward,
                  backward, left, and right while spinning it. Press <strong className="text-relic-parchment/90">Done</strong> when finished.
                </p>
              ) : (
                <p className="text-sm text-relic-parchment/60">
                  Move away from metal objects and electronics. Press <strong className="text-relic-parchment/90">Start</strong>, then
                  slowly rotate the device through all orientations for 20–30 seconds.
                </p>
              )}
            </div>
            {magCalDone ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <span>✓</span>
                <span>Magnetic calibration complete</span>
              </div>
            ) : magCalActive ? (
              <button
                onClick={handleFinishMagCal}
                disabled={!connected}
                className="w-full btn-primary py-2.5 text-sm disabled:opacity-40"
              >
                Done — save offsets
              </button>
            ) : (
              <button
                onClick={handleStartMagCal}
                disabled={!connected}
                className="w-full btn-primary py-2.5 text-sm disabled:opacity-40"
              >
                Start
              </button>
            )}
          </div>

          {/* Step 2: Set North */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-relic-parchment/60">
              Step 2 — Set North
            </p>
            <div className="rounded-md border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm text-relic-parchment/80 font-medium">Point the device North</p>
              <p className="text-sm text-relic-parchment/60">
                Hold the compass flat and level, rotate until it faces true North,
                then press <strong className="text-relic-parchment/90">Set North</strong>.
              </p>
            </div>
            {calibrationSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <span>✓</span>
                <span>North saved</span>
              </div>
            ) : (
              <button
                onClick={handleSetNorth}
                disabled={!connected}
                className="w-full btn-primary py-2.5 text-sm disabled:opacity-40"
              >
                Set North
              </button>
            )}
          </div>

        </div>
      )}

      {!connected && (
        <p className="text-sm text-relic-parchment/50">
          Connect a compass relic to send commands to your device.
        </p>
      )}
    </div>
  );
}
