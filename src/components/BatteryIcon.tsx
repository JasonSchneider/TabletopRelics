export function BatteryIcon({ percent, charging }: { percent: number | null; charging: boolean }) {
  const known = percent !== null;
  const fillColor = !known
    ? "currentColor"
    : percent > 60
    ? "#34d399"
    : percent > 30
    ? "#fbbf24"
    : "#f87171";
  const fillWidth = known ? Math.round((percent / 100) * 14) : 0;
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true" className="inline-block shrink-0">
      <rect x="0.5" y="0.5" width="19" height="11" rx="2"
        fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity={known ? 0.45 : 0.2} />
      <rect x="20" y="3.5" width="3" height="5" rx="1"
        fill="currentColor" fillOpacity={known ? 0.35 : 0.15} />
      {known ? (
        <rect x="2" y="2" width={fillWidth} height="8" rx="1" fill={fillColor} />
      ) : (
        <text x="9.5" y="9" fontSize="7" textAnchor="middle" fill="currentColor" fillOpacity="0.35">?</text>
      )}
      {charging && (
        <path d="M11 1.5 L7.5 6.5 L10.5 6.5 L9 10.5 L14 5 L11 5 Z"
          fill="white" fillOpacity="0.9" />
      )}
    </svg>
  );
}
