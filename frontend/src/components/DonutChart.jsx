export default function DonutChart({ segments, size = 140, showLegend = true }) {
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
        {/* cỡ chữ theo kích thước donut, để donut nhỏ không bị chữ đè lên vành */}
        <text x="50%" y="50%" textAnchor="middle" className="donut-total" fontSize={size * 0.17} fontWeight="700" fill="#f8fafc">{total}</text>
        <text x="50%" y="50%" dy={size * 0.13} textAnchor="middle" className="donut-total-label" fontSize={size * 0.085} fill="#94a3b8">Tổng số</text>
      </svg>
      {showLegend && (
      <ul className="donut-legend">
        {segments.map((s, i) => (
          <li key={i}>
            <i style={{ background: s.color }} />
            {s.label}
            <strong>{s.value} ({total ? Math.round((s.value / total) * 100) : 0}%)</strong>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
