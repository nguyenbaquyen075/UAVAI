import { useState } from "react";
import {
  BarChart3,
  Crosshair,
  Wifi,
  Battery,
  User,
  Clock,
  Navigation,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Radio,
  LifeBuoy,
  Package,
  Compass,
  Wrench,
  Target,
} from "lucide-react";
import FlightHoursChart from "../components/FlightHoursChart";
import UavRadarChart from "../components/UavRadarChart";
import BatteryConsumptionChart from "../components/BatteryConsumptionChart";

export default function Analytics({ payload }) {
  const [timeFilter, setTimeFilter] = useState("30");
  const [currentTime, setCurrentTime] = useState("18:42:10 13/05/2024");

  return (
    <div className="analytics-page-v2">
      {/* Top 6 KPI Stat Summary Cards */}
      <div className="analytics-top-6-kpi">
        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-blue"><Clock size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">TỔNG SỐ GIỜ BAY</span>
            <span className="val">128h 45m</span>
            <span className="trend green">▲ 18% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-blue"><Navigation size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">TỔNG QUẢNG ĐƯỜNG</span>
            <span className="val">1,245 km</span>
            <span className="trend green">▲ 12% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><CheckCircle size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">NHIỆM VỤ HOÀN THÀNH</span>
            <span className="val">48</span>
            <span className="trend green">▲ 20% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><BarChart3 size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">TỶ LỆ THÀNH CÔNG</span>
            <span className="val">92.3%</span>
            <span className="trend green">▲ 6% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-red"><AlertTriangle size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">SỰ CỐ / CẢNH BÁO</span>
            <span className="val text-red">7</span>
            <span className="trend green">▼ -22% so với tuần trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><DollarSign size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">CHI PHÍ VẬN HÀNH</span>
            <span className="val">32.5M <span className="unit">VNĐ</span></span>
            <span className="trend green">▼ -8% so với tuần trước</span>
          </div>
        </div>
      </div>

      {/* Row 1 Grid: Flight Hours Line Chart + Flight Hours Donut + Radar Chart */}
      <div className="analytics-row-3col-v2">
        {/* Card 1: THỐNG KÊ GIỜ BAY */}
        <div className="dashboard-panel flight-hours-panel">
          <div className="panel-section-header">
            <h3 className="section-title">THỐNG KÊ GIỜ BAY ⓘ</h3>
            <div className="header-filters-row">
              <button className={`filter-btn ${timeFilter === "7" ? "active" : ""}`} onClick={() => setTimeFilter("7")}>7 ngày</button>
              <button className={`filter-btn ${timeFilter === "30" ? "active" : ""}`} onClick={() => setTimeFilter("30")}>30 ngày</button>
              <button className={`filter-btn ${timeFilter === "90" ? "active" : ""}`} onClick={() => setTimeFilter("90")}>90 ngày</button>
              <div className="date-picker-box">
                <Calendar size={12} />
                <span>14/04/2024 - 13/05/2024</span>
              </div>
            </div>
          </div>
          <div className="chart-canvas-container">
            <FlightHoursChart />
          </div>
        </div>

        {/* Card 2: PHÂN BỔ GIỜ BAY THEO UAV */}
        <div className="dashboard-panel alloc-donut-panel">
          <div className="panel-section-header">
            <h3 className="section-title">PHÂN BỔ GIỜ BAY THEO UAV</h3>
          </div>
          <div className="donut-flex-wrapper">
            <div className="svg-donut-box">
              <svg width="120" height="120" viewBox="0 0 42 42" className="donut-svg">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4.5" strokeDasharray="25.1 74.9" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="21.1 78.9" strokeDashoffset="99.9" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="4.5" strokeDasharray="17.7 82.3" strokeDashoffset="78.8" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="14.3 85.7" strokeDashoffset="61.1" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="4.5" strokeDasharray="12.9 87.1" strokeDashoffset="46.8" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="9.0 91.0" strokeDashoffset="33.9" />
              </svg>
              <div className="donut-center-text">
                <span className="lbl">Tổng</span>
                <strong className="val">128h 45m</strong>
              </div>
            </div>

            <div className="donut-right-legend">
              <div className="lgd-row"><span className="sq sq-green" /><span>UAV_01</span><span className="val">32h 15m (25.1%)</span></div>
              <div className="lgd-row"><span className="sq sq-blue" /><span>UAV_02</span><span className="val">27h 10m (21.1%)</span></div>
              <div className="lgd-row"><span className="sq sq-purple" /><span>UAV_03</span><span className="val">22h 45m (17.7%)</span></div>
              <div className="lgd-row"><span className="sq sq-yellow" /><span>UAV_04</span><span className="val">18h 20m (14.3%)</span></div>
              <div className="lgd-row"><span className="sq sq-cyan" /><span>UAV_05</span><span className="val">16h 35m (12.9%)</span></div>
              <div className="lgd-row"><span className="sq sq-red" /><span>UAV_06</span><span className="val">11h 40m (9.0%)</span></div>
            </div>
          </div>
          <button className="btn-link-more">Xem chi tiết &gt;</button>
        </div>

        {/* Card 3: HIỆU SUẤT NHIỆM VỤ (Radar Chart) */}
        <div className="dashboard-panel radar-panel">
          <div className="panel-section-header">
            <h3 className="section-title">HIỆU SUẤT NHIỆM VỤ</h3>
            <select className="select-sm"><option>30 ngày</option></select>
          </div>
          <div className="radar-canvas-box">
            <UavRadarChart />
          </div>
        </div>
      </div>

      {/* Row 2 Grid: Task Breakdown + Battery Consumption + Incident Stats */}
      <div className="analytics-row-3col-v2">
        {/* Card 1: PHÂN TÍCH NHIỆM VỤ & LOẠI NHIỆM VỤ */}
        <div className="dashboard-panel task-breakdown-panel-v2">
          <div className="task-breakdown-body-v2">
            {/* Left Half: PHÂN TÍCH NHIỆM VỤ */}
            <div className="task-half-left">
              <h3 className="section-title">PHÂN TÍCH NHIỆM VỤ</h3>
              <div className="donut-and-legend-row">
                <div className="svg-donut-box-md">
                  <svg width="105" height="105" viewBox="0 0 42 42" className="donut-svg">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4.5" strokeDasharray="91.7 8.3" strokeDashoffset="25" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="4.2 95.8" strokeDashoffset="33.3" />
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="4.2 95.8" strokeDashoffset="29.1" />
                  </svg>
                  <div className="donut-center-text">
                    <strong className="val">48</strong>
                    <span className="lbl">Nhiệm vụ</span>
                  </div>
                </div>

                <div className="task-sq-legend-list">
                  <div className="sq-lgd-item">
                    <span className="sq sq-green" />
                    <div className="meta">
                      <span className="title">Hoàn thành</span>
                      <span className="sub">44 (91.7%)</span>
                    </div>
                  </div>
                  <div className="sq-lgd-item">
                    <span className="sq sq-red" />
                    <div className="meta">
                      <span className="title">Thất bại</span>
                      <span className="sub">2 (4.2%)</span>
                    </div>
                  </div>
                  <div className="sq-lgd-item">
                    <span className="sq sq-blue" />
                    <div className="meta">
                      <span className="title">Đang thực hiện</span>
                      <span className="sub">2 (4.2%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Half: LOẠI NHIỆM VỤ with Progress Bars */}
            <div className="task-half-right">
              <h3 className="section-title">LOẠI NHIỆM VỤ</h3>
              <div className="task-types-progress-list">
                <div className="type-progress-item">
                  <div className="type-meta-row">
                    <Radio size={16} color="#4ade80" className="type-icon-colored" />
                    <span className="name">Giám sát</span>
                    <span className="val">22 (45.8%)</span>
                  </div>
                  <div className="type-bar-track">
                    <div className="type-bar-fill blue" style={{ width: "45.8%" }} />
                  </div>
                </div>

                <div className="type-progress-item">
                  <div className="type-meta-row">
                    <LifeBuoy size={16} color="#4ade80" className="type-icon-colored" />
                    <span className="name">Tìm kiếm cứu nạn</span>
                    <span className="val">12 (25.0%)</span>
                  </div>
                  <div className="type-bar-track">
                    <div className="type-bar-fill green" style={{ width: "25.0%" }} />
                  </div>
                </div>

                <div className="type-progress-item">
                  <div className="type-meta-row">
                    <Package size={16} color="#f97316" className="type-icon-colored" />
                    <span className="name">Vận chuyển</span>
                    <span className="val">8 (16.7%)</span>
                  </div>
                  <div className="type-bar-track">
                    <div className="type-bar-fill orange" style={{ width: "16.7%" }} />
                  </div>
                </div>

                <div className="type-progress-item">
                  <div className="type-meta-row">
                    <Compass size={16} color="#a855f7" className="type-icon-colored" />
                    <span className="name">Khảo sát</span>
                    <span className="val">6 (12.5%)</span>
                  </div>
                  <div className="type-bar-track">
                    <div className="type-bar-fill purple" style={{ width: "12.5%" }} />
                  </div>
                </div>
              </div>
              <a href="#details" className="link-more-bottom">Xem chi tiết &gt;</a>
            </div>
          </div>
        </div>

        {/* Card 2: PHÂN TÍCH TIÊU THỤ PIN */}
        <div className="dashboard-panel battery-chart-panel">
          <div className="panel-section-header">
            <h3 className="section-title">PHÂN TÍCH TIÊU THỤ PIN</h3>
          </div>
          <div className="battery-chart-box">
            <BatteryConsumptionChart />
          </div>
        </div>

        {/* Card 3: THỐNG KÊ SỰ CỐ */}
        <div className="dashboard-panel incident-stats-panel-v2">
          <div className="panel-section-header">
            <h3 className="section-title">THỐNG KÊ SỰ CỐ</h3>
          </div>
          <div className="incident-body-v2">
            <div className="svg-donut-box-md">
              <svg width="105" height="105" viewBox="0 0 42 42" className="donut-svg">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="42.9 57.1" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="28.6 71.4" strokeDashoffset="82.1" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="4.5" strokeDasharray="14.3 85.7" strokeDashoffset="53.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="14.3 85.7" strokeDashoffset="39.2" />
              </svg>
              <div className="donut-center-text">
                <strong className="val">7</strong>
                <span className="lbl">Sự cố</span>
              </div>
            </div>

            <div className="incident-rows-list-v2">
              <div className="inc-row-item">
                <div className="inc-badge badge-red">
                  <Radio size={12} color="#ffffff" />
                </div>
                <span className="inc-name">Mất tín hiệu</span>
                <span className="inc-val">3 (42.9%)</span>
              </div>

              <div className="inc-row-item">
                <div className="inc-badge badge-yellow">
                  <Battery size={12} color="#ffffff" />
                </div>
                <span className="inc-name">Pin yếu</span>
                <span className="inc-val">2 (28.6%)</span>
              </div>

              <div className="inc-row-item">
                <div className="inc-badge badge-purple">
                  <AlertTriangle size={12} color="#ffffff" />
                </div>
                <span className="inc-name">Va chạm</span>
                <span className="inc-val">1 (14.3%)</span>
              </div>

              <div className="inc-row-item">
                <div className="inc-badge badge-blue">
                  <Wrench size={12} color="#ffffff" />
                </div>
                <span className="inc-name">Lỗi động cơ</span>
                <span className="inc-val">1 (14.3%)</span>
              </div>
            </div>
          </div>
          <a href="#details" className="link-more-center">Xem chi tiết &gt;</a>
        </div>
      </div>

      {/* Row 3 Grid: UAV Performance Table + 7-Day Trend + AI Recommendations */}
      <div className="analytics-row-3col-v2">
        {/* Card 1: HIỆU SUẤT UAV */}
        <div className="dashboard-panel perf-table-panel">
          <div className="panel-section-header">
            <h3 className="section-title">HIỆU SUẤT UAV</h3>
          </div>
          <div className="perf-table-wrapper">
            <table className="perf-table">
              <thead>
                <tr>
                  <th>UAV</th>
                  <th>TỔNG GIỜ BAY</th>
                  <th>QUÃNG ĐƯỜNG</th>
                  <th>NHIỆM VỤ</th>
                  <th>TỶ LỆ THÀNH CÔNG</th>
                  <th>TIÊU THỤ PIN TB</th>
                  <th>SỰ CỐ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono font-bold">UAV_01</td>
                  <td>32h 15m</td>
                  <td>312 km</td>
                  <td>12</td>
                  <td>
                    <div className="rate-bar-flex">
                      <span>95.8%</span>
                      <div className="bar-track"><div className="bar-fill green" style={{ width: "95.8%" }} /></div>
                    </div>
                  </td>
                  <td>68%</td>
                  <td className="text-red font-bold">1</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold">UAV_02</td>
                  <td>27h 10m</td>
                  <td>276 km</td>
                  <td>10</td>
                  <td>
                    <div className="rate-bar-flex">
                      <span>90.0%</span>
                      <div className="bar-track"><div className="bar-fill green" style={{ width: "90%" }} /></div>
                    </div>
                  </td>
                  <td>71%</td>
                  <td className="text-red font-bold">1</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold">UAV_03</td>
                  <td>22h 45m</td>
                  <td>198 km</td>
                  <td>9</td>
                  <td>
                    <div className="rate-bar-flex">
                      <span>88.9%</span>
                      <div className="bar-track"><div className="bar-fill green" style={{ width: "88.9%" }} /></div>
                    </div>
                  </td>
                  <td>65%</td>
                  <td className="text-red font-bold">2</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold">UAV_04</td>
                  <td>18h 20m</td>
                  <td>156 km</td>
                  <td>7</td>
                  <td>
                    <div className="rate-bar-flex">
                      <span>100%</span>
                      <div className="bar-track"><div className="bar-fill green" style={{ width: "100%" }} /></div>
                    </div>
                  </td>
                  <td>62%</td>
                  <td className="text-green font-bold">0</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold">UAV_05</td>
                  <td>16h 35m</td>
                  <td>142 km</td>
                  <td>6</td>
                  <td>
                    <div className="rate-bar-flex">
                      <span>83.3%</span>
                      <div className="bar-track"><div className="bar-fill green" style={{ width: "83.3%" }} /></div>
                    </div>
                  </td>
                  <td>70%</td>
                  <td className="text-red font-bold">2</td>
                </tr>
                <tr>
                  <td className="font-mono font-bold">UAV_06</td>
                  <td>11h 40m</td>
                  <td>98 km</td>
                  <td>4</td>
                  <td>
                    <div className="rate-bar-flex">
                      <span>75.0%</span>
                      <div className="bar-track"><div className="bar-fill green" style={{ width: "75%" }} /></div>
                    </div>
                  </td>
                  <td>66%</td>
                  <td className="text-red font-bold">1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: XU HƯỚNG 7 NGÀY QUA */}
        <div className="dashboard-panel trend-panel">
          <div className="panel-section-header">
            <h3 className="section-title">XU HƯỚNG 7 NGÀY QUA</h3>
            <select className="select-sm"><option>7 ngày</option></select>
          </div>
          <div className="trend-metrics-list">
            <div className="trend-item">
              <div className="meta">
                <span className="lbl">Giờ bay</span>
                <strong className="val">18h 25m</strong>
              </div>
              <div className="sparkline">
                <svg width="60" height="20"><path d="M0 15 L15 10 L30 14 L45 6 L60 8" fill="none" stroke="#3b82f6" strokeWidth="2" /></svg>
              </div>
              <span className="change green">▲ 15.3%</span>
            </div>

            <div className="trend-item">
              <div className="meta">
                <span className="lbl">Quãng đường</span>
                <strong className="val">156 km</strong>
              </div>
              <div className="sparkline">
                <svg width="60" height="20"><path d="M0 14 L15 12 L30 8 L45 10 L60 4" fill="none" stroke="#3b82f6" strokeWidth="2" /></svg>
              </div>
              <span className="change green">▲ 9.8%</span>
            </div>

            <div className="trend-item">
              <div className="meta">
                <span className="lbl">Nhiệm vụ</span>
                <strong className="val">8</strong>
              </div>
              <div className="sparkline">
                <svg width="60" height="20"><path d="M0 16 L15 14 L30 10 L45 12 L60 5" fill="none" stroke="#3b82f6" strokeWidth="2" /></svg>
              </div>
              <span className="change green">▲ 14.3%</span>
            </div>

            <div className="trend-item">
              <div className="meta">
                <span className="lbl">Tỷ lệ thành công</span>
                <strong className="val">91.2%</strong>
              </div>
              <div className="sparkline">
                <svg width="60" height="20"><path d="M0 12 L15 14 L30 8 L45 6 L60 4" fill="none" stroke="#3b82f6" strokeWidth="2" /></svg>
              </div>
              <span className="change green">▲ 6.7%</span>
            </div>
          </div>
        </div>

        {/* Card 3: BÁO CÁO ĐỀ XUẤT */}
        <div className="dashboard-panel rec-panel">
          <div className="panel-section-header">
            <h3 className="section-title">BÁO CÁO ĐỀ XUẤT</h3>
          </div>
          <div className="recs-feed-list">
            <div className="rec-card-item">
              <Battery size={16} className="ic green" />
              <div className="rec-content">
                <p className="main"><strong>UAV_02</strong> tiêu thụ pin cao hơn mức trung bình 15%.</p>
                <p className="sub">Đề xuất: Kiểm tra pin và hiệu chỉnh lại.</p>
              </div>
            </div>

            <div className="rec-card-item">
              <Radio size={16} className="ic green" />
              <div className="rec-content">
                <p className="main"><strong>3 lần</strong> mất tín hiệu trong khu vực Đông Anh.</p>
                <p className="sub">Đề xuất: Kiểm tra lại trạm lặp tín hiệu.</p>
              </div>
            </div>

            <div className="rec-card-item">
              <Target size={16} className="ic red" />
              <div className="rec-content">
                <p className="main">Khu vực <strong>cầu Đông Trù</strong> có tần suất nhiệm vụ cao nhất.</p>
                <p className="sub">Đề xuất: Lên kế hoạch bảo trì định kỳ.</p>
              </div>
            </div>
          </div>
          <button className="btn-link-more">Xem đầy đủ báo cáo &gt;</button>
        </div>
      </div>
    </div>
  );
}
