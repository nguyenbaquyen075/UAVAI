export default function ProgressRing({ pct = 0, size = 90 }) {
  const safePct = isNaN(Number(pct)) ? 0 : Math.min(100, Math.max(0, Number(pct)));
  const stroke = 8;
  const r = Math.max(1, (size - stroke) / 2);
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - safePct / 100);

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#262b38" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#4ade80"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={isNaN(circumference) ? 0 : circumference}
        strokeDashoffset={isNaN(offset) ? 0 : offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="progress-ring-label">
        {Math.round(safePct)}%
      </text>
    </svg>
  );
}
