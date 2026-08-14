export default function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size}>
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circumference;
          const rotate = (acc / total) * 360 - 90;
          acc += s.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
            />
          );
        })}
        <text x="50%" y="46%" textAnchor="middle" className="donut-total">{total}</text>
        <text x="50%" y="62%" textAnchor="middle" className="donut-total-label">Tổng số</text>
      </svg>
      <ul className="donut-legend">
        {segments.map((s, i) => (
          <li key={i}>
            <i style={{ background: s.color }} />
            {s.label}
            <strong>{s.value} ({total ? Math.round((s.value / total) * 100) : 0}%)</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
