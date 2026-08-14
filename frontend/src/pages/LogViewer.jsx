import { useEffect, useState } from "react";
import { API_BASE, getLogs } from "../api";

const SEVERITY_LABEL = { red: "NGUY HIỂM", yellow: "CẢNH BÁO" };

export default function LogViewer() {
  const [filters, setFilters] = useState({ class_: "", severity: "", start: "", end: "" });
  const [rows, setRows] = useState([]);

  async function refresh() {
    const params = {};
    if (filters.class_) params.class_ = filters.class_;
    if (filters.severity) params.severity = filters.severity;
    if (filters.start) params.start = `${filters.start}:00Z`;
    if (filters.end) params.end = `${filters.end}:59Z`;
    setRows(await getLogs(params));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="panel wide">
      <h2>Lịch sử cảnh báo</h2>
      <div className="filters">
        <select value={filters.class_} onChange={(e) => setFilters({ ...filters, class_: e.target.value })}>
          <option value="">Tất cả loại</option>
          <option value="person">person</option>
          <option value="car">car</option>
          <option value="motorcycle">motorcycle</option>
          <option value="bus">bus</option>
          <option value="truck">truck</option>
        </select>
        <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">Tất cả mức</option>
          <option value="red">Nguy hiểm</option>
          <option value="yellow">Cảnh báo nhẹ</option>
        </select>
        <input
          type="datetime-local"
          value={filters.start}
          onChange={(e) => setFilters({ ...filters, start: e.target.value })}
        />
        <input
          type="datetime-local"
          value={filters.end}
          onChange={(e) => setFilters({ ...filters, end: e.target.value })}
        />
        <button onClick={refresh}>Lọc</button>
        <a href={`${API_BASE}/api/logs/export.csv`} target="_blank" rel="noreferrer">
          Export CSV
        </a>
      </div>

      <table>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Loại</th>
            <th>K.cách (m)</th>
            <th>Mức</th>
            <th>Ảnh</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.severity}>
              <td>{r.timestamp}</td>
              <td>{r.class}</td>
              <td>{r.distance_m}</td>
              <td>{SEVERITY_LABEL[r.severity]}</td>
              <td>
                <a href={`${API_BASE}/api/logs/${r.id}/snapshot`} target="_blank" rel="noreferrer">
                  Xem
                </a>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">Không có dữ liệu</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
