import { useEffect, useState } from "react";
import FlightHoursChart from "../components/FlightHoursChart";
import UavRadarChart from "../components/UavRadarChart";
import BatteryConsumptionChart from "../components/BatteryConsumptionChart";

export default function Analytics() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      setCurrentTime(`${timeStr} ${dateStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const uavPerformanceList = [
    { id: "UAV_01", hours: "32h 15m", dist: "312 km", missions: 12, rate: 95.8, bat: "68%", incidents: 1 },
    { id: "UAV_02", hours: "27h 10m", dist: "276 km", missions: 10, rate: 90.0, bat: "71%", incidents: 1 },
    { id: "UAV_03", hours: "22h 45m", dist: "198 km", missions: 9, rate: 88.9, bat: "65%", incidents: 2 },
    { id: "UAV_04", hours: "18h 20m", dist: "156 km", missions: 7, rate: 100, bat: "62%", incidents: 0 },
    { id: "UAV_05", hours: "16h 35m", dist: "142 km", missions: 6, rate: 83.3, bat: "70%", incidents: 2 },
    { id: "UAV_06", hours: "11h 40m", dist: "98 km", missions: 4, rate: 75.0, bat: "66%", incidents: 1 },
  ];

  return (
    <div className="analytics-page-layout">
      {/* Sub Header */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span className="sub-title-label">PHÂN TÍCH</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Phân tích</span>
          </div>
        </div>

        <div className="header-right-telemetry">
          <div className="telemetry-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>GPS <strong>12</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>Liên kết <strong>Strong</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
              <line x1="23" y1="11" x2="23" y2="13"></line>
            </svg>
            <span>Pin <strong>78%</strong></span>
          </div>

          <div className="telemetry-pill clock-pill">
            <span>{currentTime || "18:42:10 13/05/2024"}</span>
          </div>

          <div className="user-profile-badge">
            <div className="avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="username">admin</span>
              <span className="user-role">Quản trị viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Top 6 KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue">🕒</div>
          <div className="kpi-body">
            <span className="kpi-label">TỔNG SỐ GIỜ BAY</span>
            <div className="kpi-val">128h 45m</div>
            <span className="kpi-trend up">↑ 18% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">🗺️</div>
          <div className="kpi-body">
            <span className="kpi-label">TỔNG QUẢNG ĐƯỜNG</span>
            <div className="kpi-val">1,245 km</div>
            <span className="kpi-trend up">↑ 12% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">✅</div>
          <div className="kpi-body">
            <span className="kpi-label">NHIỆM VỤ HOÀN THÀNH</span>
            <div className="kpi-val">48</div>
            <span className="kpi-trend up">↑ 20% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon cyan">📊</div>
          <div className="kpi-body">
            <span className="kpi-label">TỶ LỆ THÀNH CÔNG</span>
            <div className="kpi-val">92.3%</div>
            <span className="kpi-trend up">↑ 6% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red">⚠️</div>
          <div className="kpi-body">
            <span className="kpi-label">SỰ CỐ / CẢNH BÁO</span>
            <div className="kpi-val">7</div>
            <span className="kpi-trend up">↓ -22% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon money">💲</div>
          <div className="kpi-body">
            <span className="kpi-label">CHI PHÍ VẬN HÀNH</span>
            <div className="kpi-val">32.5M <span className="unit">VNĐ</span></div>
            <span className="kpi-trend up">↓ -8% so với tuần trước</span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Main Charts */}
      <div className="analytics-row-3col">
        <FlightHoursChart />

        {/* Flight Hours Allocation Donut Card */}
        <div className="allocation-card">
          <div className="card-header-row">
            <span className="card-title">PHẦN BỔ GIỜ BAY THEO UAV</span>
          </div>
          <div className="allocation-body">
            <div className="donut-graphic-box">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="50" fill="none" stroke="#161c28" strokeWidth="22" />
                <circle cx="75" cy="75" r="50" fill="none" stroke="#22c55e" strokeWidth="22" strokeDasharray="314" strokeDashoffset="78" transform="rotate(-90 75 75)" />
                <circle cx="75" cy="75" r="50" fill="none" stroke="#3b82f6" strokeWidth="22" strokeDasharray="314" strokeDashoffset="144" transform="rotate(0 75 75)" />
                <circle cx="75" cy="75" r="50" fill="none" stroke="#a855f7" strokeWidth="22" strokeDasharray="314" strokeDashoffset="200" transform="rotate(76 75 75)" />
                <circle cx="75" cy="75" r="50" fill="none" stroke="#f97316" strokeWidth="22" strokeDasharray="314" strokeDashoffset="245" transform="rotate(140 75 75)" />
                <circle cx="75" cy="75" r="50" fill="none" stroke="#06b6d4" strokeWidth="22" strokeDasharray="314" strokeDashoffset="275" transform="rotate(190 75 75)" />
                <circle cx="75" cy="75" r="50" fill="none" stroke="#ef4444" strokeWidth="22" strokeDasharray="314" strokeDashoffset="295" transform="rotate(236 75 75)" />
              </svg>
              <div className="donut-center-text">
                <span className="lbl">Tổng</span>
                <strong className="val">128h 45m</strong>
              </div>
            </div>

            <div className="allocation-legend-list">
              <div className="alloc-item">
                <span className="sq-dot" style={{ background: "#22c55e" }}></span>
                <span className="u-name">UAV_01</span>
                <strong className="u-val">32h 15m (25.1%)</strong>
              </div>
              <div className="alloc-item">
                <span className="sq-dot" style={{ background: "#3b82f6" }}></span>
                <span className="u-name">UAV_02</span>
                <strong className="u-val">27h 10m (21.1%)</strong>
              </div>
              <div className="alloc-item">
                <span className="sq-dot" style={{ background: "#a855f7" }}></span>
                <span className="u-name">UAV_03</span>
                <strong className="u-val">22h 45m (17.7%)</strong>
              </div>
              <div className="alloc-item">
                <span className="sq-dot" style={{ background: "#f97316" }}></span>
                <span className="u-name">UAV_04</span>
                <strong className="u-val">18h 20m (14.3%)</strong>
              </div>
              <div className="alloc-item">
                <span className="sq-dot" style={{ background: "#06b6d4" }}></span>
                <span className="u-name">UAV_05</span>
                <strong className="u-val">16h 35m (12.9%)</strong>
              </div>
              <div className="alloc-item">
                <span className="sq-dot" style={{ background: "#ef4444" }}></span>
                <span className="u-name">UAV_06</span>
                <strong className="u-val">11h 40m (9.0%)</strong>
              </div>
            </div>
          </div>
          <div className="link-action-footer">
            <a href="#details">Xem chi tiết &gt;</a>
          </div>
        </div>

        <UavRadarChart />
      </div>

      {/* Row 3: Detailed Breakdown Cards */}
      <div className="analytics-row-3col">
        {/* Mission Breakdown Card */}
        <div className="breakdown-card">
          <div className="card-header-row">
            <span className="card-title">PHÂN TÍCH NHIỆM VỤ</span>
          </div>
          <div className="breakdown-body-split">
            <div className="donut-mini-wrap">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="38" fill="none" stroke="#161c28" strokeWidth="16" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#22c55e" strokeWidth="16" strokeDasharray="238" strokeDashoffset="20" transform="rotate(-90 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="238" strokeDashoffset="228" transform="rotate(240 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="238" strokeDashoffset="228" transform="rotate(255 55 55)" />
              </svg>
              <div className="donut-center-text mini">
                <strong className="val">48</strong>
                <span className="lbl">Nhiệm vụ</span>
              </div>
            </div>

            <div className="types-list">
              <div className="section-subtitle">LOẠI NHIỆM VỤ</div>
              <div className="type-row">
                <span>🛡️ Giám sát</span>
                <strong>22 (45.8%)</strong>
              </div>
              <div className="type-row">
                <span>🚑 Tìm kiếm cứu nạn</span>
                <strong>12 (25.0%)</strong>
              </div>
              <div className="type-row">
                <span>📦 Vận chuyển</span>
                <strong>8 (16.7%)</strong>
              </div>
              <div className="type-row">
                <span>🗺️ Khảo sát</span>
                <strong>6 (12.5%)</strong>
              </div>
            </div>
          </div>
          <div className="link-action-footer">
            <a href="#missions">Xem chi tiết &gt;</a>
          </div>
        </div>

        {/* Battery Consumption Chart */}
        <BatteryConsumptionChart />

        {/* Incidents Breakdown Card */}
        <div className="incidents-card">
          <div className="card-header-row">
            <span className="card-title">THỐNG KÊ SỰ CỐ</span>
          </div>
          <div className="incidents-body">
            <div className="donut-mini-wrap">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="38" fill="none" stroke="#161c28" strokeWidth="16" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="238" strokeDashoffset="136" transform="rotate(-90 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="238" strokeDashoffset="170" transform="rotate(64 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#a855f7" strokeWidth="16" strokeDasharray="238" strokeDashoffset="204" transform="rotate(166 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="238" strokeDashoffset="204" transform="rotate(218 55 55)" />
              </svg>
              <div className="donut-center-text mini">
                <strong className="val">7</strong>
                <span className="lbl">Sự cố</span>
              </div>
            </div>

            <div className="incidents-list">
              <div className="inc-row">
                <span className="dot red">●</span>
                <span className="label">Mất tín hiệu</span>
                <strong className="val">3 (42.9%)</strong>
              </div>
              <div className="inc-row">
                <span className="dot orange">●</span>
                <span className="label">Pin yếu</span>
                <strong className="val">2 (28.6%)</strong>
              </div>
              <div className="inc-row">
                <span className="dot purple">●</span>
                <span className="label">Va chạm</span>
                <strong className="val">1 (14.3%)</strong>
              </div>
              <div className="inc-row">
                <span className="dot blue">●</span>
                <span className="label">Lỗi động cơ</span>
                <strong className="val">1 (14.3%)</strong>
              </div>
            </div>
          </div>
          <div className="link-action-footer">
            <a href="#incidents">Xem chi tiết &gt;</a>
          </div>
        </div>
      </div>

      {/* Row 4: Performance Table & Insights */}
      <div className="analytics-row-bottom">
        {/* UAV Performance Table */}
        <div className="perf-table-card">
          <div className="card-header-row">
            <span className="card-title">HIỆU SUẤT UAV</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>UAV</th>
                <th>Tổng giờ bay</th>
                <th>Quãng đường</th>
                <th>Nhiệm vụ</th>
                <th>Tỷ lệ thành công</th>
                <th>Tiêu thụ pin TB</th>
                <th>Sự cố</th>
              </tr>
            </thead>
            <tbody>
              {uavPerformanceList.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.id}</strong></td>
                  <td>{row.hours}</td>
                  <td>{row.dist}</td>
                  <td>{row.missions}</td>
                  <td>
                    <div className="rate-flex">
                      <span>{row.rate}%</span>
                      <div className="mini-prog-track">
                        <div
                          className={`mini-prog-fill ${row.rate >= 90 ? "green" : "orange"}`}
                          style={{ width: `${row.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>{row.bat}</td>
                  <td>
                    <span className={`badge ${row.incidents > 0 ? "red" : "grey"}`}>{row.incidents}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 7-Day Trend Sparklines Card */}
        <div className="trend-card">
          <div className="card-header-row">
            <span className="card-title">XU HƯỚNG 7 NGÀY QUA</span>
            <select className="mini-select" defaultValue="7">
              <option value="7">7 ngày</option>
            </select>
          </div>
          <div className="trend-rows">
            <div className="trend-row">
              <div className="trend-meta">
                <span className="lbl">Giờ bay</span>
                <strong className="val">18h 25m</strong>
              </div>
              <div className="trend-spark">
                <svg width="70" height="20" viewBox="0 0 70 20">
                  <path d="M 0 14 L 14 10 L 28 16 L 42 8 L 56 12 L 70 4" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </div>
              <span className="trend-change up">↑ 15.3%</span>
            </div>

            <div className="trend-row">
              <div className="trend-meta">
                <span className="lbl">Quãng đường</span>
                <strong className="val">156 km</strong>
              </div>
              <div className="trend-spark">
                <svg width="70" height="20" viewBox="0 0 70 20">
                  <path d="M 0 16 L 14 12 L 28 14 L 42 6 L 56 10 L 70 2" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </div>
              <span className="trend-change up">↑ 9.8%</span>
            </div>

            <div className="trend-row">
              <div className="trend-meta">
                <span className="lbl">Nhiệm vụ</span>
                <strong className="val">8</strong>
              </div>
              <div className="trend-spark">
                <svg width="70" height="20" viewBox="0 0 70 20">
                  <path d="M 0 18 L 14 14 L 28 10 L 42 12 L 56 6 L 70 4" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </div>
              <span className="trend-change up">↑ 14.3%</span>
            </div>

            <div className="trend-row">
              <div className="trend-meta">
                <span className="lbl">Tỷ lệ thành công</span>
                <strong className="val">91.2%</strong>
              </div>
              <div className="trend-spark">
                <svg width="70" height="20" viewBox="0 0 70 20">
                  <path d="M 0 12 L 14 8 L 28 10 L 42 6 L 56 4 L 70 2" fill="none" stroke="#22c55e" strokeWidth="2" />
                </svg>
              </div>
              <span className="trend-change up">↑ 6.7%</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations Card */}
        <div className="recommendations-card">
          <div className="card-header-row">
            <span className="card-title">BÁO CÁO ĐỀ XUẤT</span>
          </div>
          <div className="recs-list">
            <div className="rec-item">
              <div className="rec-icon green">🔋</div>
              <div className="rec-text">
                <p className="main-desc">UAV_02 tiêu thụ pin cao hơn mức trung bình 15%.</p>
                <p className="sub-suggestion">Đề xuất: Kiểm tra pin và hiệu chỉnh lại.</p>
              </div>
            </div>

            <div className="rec-item">
              <div className="rec-icon blue">📶</div>
              <div className="rec-text">
                <p className="main-desc">3 lần mất tín hiệu trong khu vực Đông Anh.</p>
                <p className="sub-suggestion">Đề xuất: Kiểm tra lại trạm lặp tín hiệu.</p>
              </div>
            </div>

            <div className="rec-item">
              <div className="rec-icon red">🎯</div>
              <div className="rec-text">
                <p className="main-desc">Khu vực cầu Đông Trù có tần suất nhiệm vụ cao nhất.</p>
                <p className="sub-suggestion">Đề xuất: Lên kế hoạch bảo trì định kỳ.</p>
              </div>
            </div>
          </div>
          <div className="link-action-footer">
            <a href="#full-reports">Xem đầy đủ báo cáo &gt;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
