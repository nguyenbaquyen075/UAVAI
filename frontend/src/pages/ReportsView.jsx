import { useState } from "react";
import {
  FileText,
  Calendar,
  ClipboardList,
  Clock,
  Navigation,
  Target,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  Plus,
  Car,
  User,
  Package,
  Home,
  ChevronDown,
} from "lucide-react";
import MissionDayChart from "../components/MissionDayChart";
import DistanceChart from "../components/DistanceChart";

export default function ReportsView() {
  const [dateFilter, setDateFilter] = useState("01/05/2024 - 13/05/2024");

  const reportsList = [
    {
      id: 1,
      title: "Báo cáo nhiệm vụ tuần 19",
      type: "Tổng hợp tuần",
      uav: "Tất cả",
      mission: "Tất cả",
      range: "06/05/2024 - 12/05/2024",
      author: "admin",
      createdAt: "13/05/2024 09:15",
      format: "PDF",
      size: "2.4 MB",
    },
    {
      id: 2,
      title: "Báo cáo giám sát khu vực A",
      type: "Giám sát",
      uav: "UAV_02",
      mission: "NV_20240512_01",
      range: "12/05/2024",
      author: "admin",
      createdAt: "12/05/2024 18:30",
      format: "PDF",
      size: "1.8 MB",
    },
    {
      id: 3,
      title: "Báo cáo trinh sát biên giới",
      type: "Trinh sát",
      uav: "UAV_03",
      mission: "NV_20240511_03",
      range: "11/05/2024",
      author: "operator1",
      createdAt: "11/05/2024 21:45",
      format: "PDF",
      size: "3.1 MB",
    },
    {
      id: 4,
      title: "Báo cáo tìm kiếm cứu nạn",
      type: "Tìm kiếm cứu nạn",
      uav: "UAV_01",
      mission: "NV_20240510_02",
      range: "10/05/2024",
      author: "operator2",
      createdAt: "10/05/2024 16:20",
      format: "PDF",
      size: "2.0 MB",
    },
    {
      id: 5,
      title: "Báo cáo tổng hợp tháng 04",
      type: "Tổng hợp tháng",
      uav: "Tất cả",
      mission: "Tất cả",
      range: "01/04/2024 - 30/04/2024",
      author: "admin",
      createdAt: "01/05/2024 10:00",
      format: "PDF",
      size: "5.6 MB",
    },
  ];

  return (
    <div className="reports-page-layout-v2">
      {/* Top Filter & Action Toolbar */}
      <div className="reports-top-filter-bar">
        <div className="filters-left">
          <div className="filter-item">
            <span className="lbl">Loại báo cáo</span>
            <select className="select-sm"><option>Tất cả</option></select>
          </div>
          <div className="filter-item">
            <span className="lbl">UAV</span>
            <select className="select-sm"><option>Tất cả</option></select>
          </div>
          <div className="filter-item">
            <span className="lbl">Nhiệm vụ</span>
            <select className="select-sm"><option>Tất cả</option></select>
          </div>
          <div className="filter-item">
            <span className="lbl">Khoảng thời gian</span>
            <div className="date-range-box">
              <Calendar size={13} />
              <span>{dateFilter}</span>
            </div>
          </div>
        </div>

        <div className="actions-right">
          <button className="btn-act dark-outline">
            <ClipboardList size={14} /> Lịch sử báo cáo
          </button>
          <button className="btn-create-note-green">
            <Plus size={16} /> Tạo báo cáo mới <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Top 6 KPI Summary Cards */}
      <div className="reports-top-6-kpi">
        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-purple"><ClipboardList size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng số nhiệm vụ</span>
            <span className="val font-mono">28</span>
            <span className="trend green">▲ +21.7% so với kỳ trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-blue"><Clock size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng thời gian bay</span>
            <span className="val font-mono">45h 32m</span>
            <span className="trend green">▲ +18.3% so với kỳ trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><Navigation size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng quãng đường</span>
            <span className="val font-mono">1,248 km</span>
            <span className="trend green">▲ +24.6% so với kỳ trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-yellow"><Target size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng mục tiêu phát hiện</span>
            <span className="val font-mono">156</span>
            <span className="trend green">▲ +31.4% so với kỳ trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><CheckCircle2 size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tỷ lệ hoàn thành nhiệm vụ</span>
            <span className="val text-green font-mono">92.6%</span>
            <span className="trend green">▲ +8.1% so với kỳ trước</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-red"><AlertTriangle size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Sự cố xảy ra</span>
            <span className="val text-red font-mono">7</span>
            <span className="trend green">▼ -12.5% so với kỳ trước</span>
          </div>
        </div>
      </div>

      {/* Middle Grid Row: 3 Cards */}
      <div className="reports-mid-3col">
        {/* Card 1: THỐNG KÊ NHIỆM VỤ THEO NGÀY */}
        <MissionDayChart />

        {/* Card 2: PHÂN BỐ NHIỆM VỤ THEO LOẠI */}
        <div className="dashboard-panel donut-panel-1fr">
          <div className="panel-section-header">
            <h3 className="section-title">PHÂN BỐ NHIỆM VỤ THEO LOẠI</h3>
          </div>
          <div className="type-donut-body-v2">
            <div className="svg-donut-box-lg">
              <svg width="145" height="145" viewBox="0 0 42 42" className="donut-svg">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="5.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="5.5" strokeDasharray="35.7 64.3" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="5.5" strokeDasharray="21.4 78.6" strokeDashoffset="89.3" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="5.5" strokeDasharray="17.9 82.1" strokeDashoffset="67.9" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="5.5" strokeDasharray="14.3 85.7" strokeDashoffset="50.0" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#60a5fa" strokeWidth="5.5" strokeDasharray="10.7 89.3" strokeDashoffset="35.7" />
              </svg>
              <div className="donut-center-text">
                <strong className="val">28</strong>
                <span className="lbl">Tổng số</span>
              </div>
            </div>
            <div className="type-legend-list-v2">
              <div className="lgd-item-v2">
                <div className="item-left">
                  <span className="sq-chip bg-green" />
                  <span className="name">Giám sát</span>
                </div>
                <span className="val font-mono">10 (35.7%)</span>
              </div>
              <div className="lgd-item-v2">
                <div className="item-left">
                  <span className="sq-chip bg-blue" />
                  <span className="name">Tìm kiếm cứu nạn</span>
                </div>
                <span className="val font-mono">6 (21.4%)</span>
              </div>
              <div className="lgd-item-v2">
                <div className="item-left">
                  <span className="sq-chip bg-yellow" />
                  <span className="name">Trinh sát</span>
                </div>
                <span className="val font-mono">5 (17.9%)</span>
              </div>
              <div className="lgd-item-v2">
                <div className="item-left">
                  <span className="sq-chip bg-purple" />
                  <span className="name">Đo đạc</span>
                </div>
                <span className="val font-mono">4 (14.3%)</span>
              </div>
              <div className="lgd-item-v2">
                <div className="item-left">
                  <span className="sq-chip bg-cyan" />
                  <span className="name">Khác</span>
                </div>
                <span className="val font-mono">3 (10.7%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: TỔNG HỢP THEO UAV */}
        <div className="dashboard-panel uav-summary-panel-1fr">
          <div className="panel-section-header">
            <h3 className="section-title">TỔNG HỢP THEO UAV</h3>
          </div>
          <table className="mini-table-uav">
            <thead>
              <tr>
                <th>UAV</th>
                <th>Thời gian bay</th>
                <th>Nhiệm vụ</th>
                <th>Tỷ lệ HT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="u-name">UAV_01 - Eagle Pro</td>
                <td className="font-mono">15h 20m</td>
                <td className="font-mono">9</td>
                <td className="text-green font-bold font-mono">94.4%</td>
              </tr>
              <tr>
                <td className="u-name">UAV_02 - Falcon 8X</td>
                <td className="font-mono">12h 45m</td>
                <td className="font-mono">7</td>
                <td className="text-green font-bold font-mono">85.7%</td>
              </tr>
              <tr>
                <td className="u-name">UAV_03 - SkyEye 4K</td>
                <td className="font-mono">9h 30m</td>
                <td className="font-mono">6</td>
                <td className="text-green font-bold font-mono">100%</td>
              </tr>
              <tr>
                <td className="u-name">UAV_04 - Phantom 4 RTK</td>
                <td className="font-mono">5h 10m</td>
                <td className="font-mono">4</td>
                <td className="text-green font-bold font-mono">87.5%</td>
              </tr>
              <tr>
                <td className="u-name">UAV_05 - Matrice 300</td>
                <td className="font-mono">2h 45m</td>
                <td className="font-mono">2</td>
                <td className="text-green font-bold font-mono">100%</td>
              </tr>
            </tbody>
          </table>
          <a href="#more" className="link-more-center">Xem chi tiết &gt;</a>
        </div>
      </div>

      {/* Lower Row: 2 Split Grid */}
      <div className="reports-lower-grid">
        {/* Left Section with 3 Sub-Cards */}
        <div className="left-sub-3cards">
          {/* Sub-Card 1: THỐNG KÊ QUẢNG ĐƯỜNG BAY */}
          <DistanceChart />

          {/* Sub-Card 2: THỐNG KÊ MỤC TIÊU PHÁT HIỆN */}
          <div className="dashboard-panel target-sub-card">
            <div className="panel-section-header">
              <h3 className="section-title">THỐNG KÊ MỤC TIÊU PHÁT HIỆN</h3>
            </div>
            <div className="tgt-rows-list">
              <div className="tgt-item">
                <Car size={14} className="ic-tgt" />
                <span className="name">Phương tiện</span>
                <span className="val font-mono">68</span>
                <span className="trend green">▲ +25.9%</span>
              </div>

              <div className="tgt-item">
                <User size={14} className="ic-tgt" />
                <span className="name">Người</span>
                <span className="val font-mono">42</span>
                <span className="trend green">▲ +40.0%</span>
              </div>

              <div className="tgt-item">
                <Package size={14} className="ic-tgt" />
                <span className="name">Vật thể lạ</span>
                <span className="val font-mono">27</span>
                <span className="trend green">▲ +17.4%</span>
              </div>

              <div className="tgt-item">
                <Home size={14} className="ic-tgt" />
                <span className="name">Khác</span>
                <span className="val font-mono">19</span>
                <span className="trend red">▼ -5.0%</span>
              </div>
            </div>
          </div>

          {/* Sub-Card 3: THỐNG KÊ SỰ CỐ */}
          <div className="dashboard-panel incident-sub-card">
            <div className="panel-section-header">
              <h3 className="section-title">THỐNG KÊ SỰ CỐ</h3>
            </div>
            <div className="incident-donut-flex-v2">
              <div className="svg-donut-box-lg">
                <svg width="140" height="140" viewBox="0 0 42 42" className="donut-svg">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="5.5" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="5.5" strokeDasharray="42.9 57.1" strokeDashoffset="25" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="5.5" strokeDasharray="28.6 71.4" strokeDashoffset="82.1" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#8b5cf6" strokeWidth="5.5" strokeDasharray="14.3 85.7" strokeDashoffset="53.5" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="5.5" strokeDasharray="14.3 85.7" strokeDashoffset="39.2" />
                </svg>
                <div className="donut-center-text">
                  <strong className="val">7</strong>
                  <span className="lbl">Tổng số</span>
                </div>
              </div>
              <div className="type-legend-list-v2">
                <div className="lgd-item-v2">
                  <div className="item-left">
                    <span className="sq-chip bg-red" />
                    <span className="name">Mất tín hiệu</span>
                  </div>
                  <span className="val font-mono">3 (42.9%)</span>
                </div>
                <div className="lgd-item-v2">
                  <div className="item-left">
                    <span className="sq-chip bg-yellow" />
                    <span className="name">Pin yếu</span>
                  </div>
                  <span className="val font-mono">2 (28.6%)</span>
                </div>
                <div className="lgd-item-v2">
                  <div className="item-left">
                    <span className="sq-chip bg-purple" />
                    <span className="name">Va chạm</span>
                  </div>
                  <span className="val font-mono">1 (14.3%)</span>
                </div>
                <div className="lgd-item-v2">
                  <div className="item-left">
                    <span className="sq-chip bg-blue" />
                    <span className="name">Lỗi thiết bị</span>
                  </div>
                  <span className="val font-mono">1 (14.3%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: BÁO CÁO GẦN NHẤT */}
        <div className="dashboard-panel recent-reports-panel">
          <div className="panel-section-header">
            <h3 className="section-title">BÁO CÁO GẦN NHẤT</h3>
          </div>
          <div className="recent-reports-stack">
            <div className="recent-rpt-card">
              <FileText size={20} className="ic-green" />
              <div className="rpt-details">
                <h5 className="name">Báo cáo nhiệm vụ tuần 19</h5>
                <span className="sub">06/05/2024 - 12/05/2024</span>
              </div>
              <span className="date font-mono">13/05/2024 09:15</span>
            </div>

            <div className="recent-rpt-card">
              <FileText size={20} className="ic-green" />
              <div className="rpt-details">
                <h5 className="name">Báo cáo giám sát khu vực A</h5>
                <span className="sub">Nhiệm vụ: NV_20240512_01</span>
              </div>
              <span className="date font-mono">12/05/2024 18:30</span>
            </div>

            <div className="recent-rpt-card">
              <FileText size={20} className="ic-green" />
              <div className="rpt-details">
                <h5 className="name">Báo cáo trinh sát biên giới</h5>
                <span className="sub">Nhiệm vụ: NV_20240511_03</span>
              </div>
              <span className="date font-mono">11/05/2024 21:45</span>
            </div>

            <div className="recent-rpt-card">
              <FileText size={20} className="ic-green" />
              <div className="rpt-details">
                <h5 className="name">Báo cáo tìm kiếm cứu nạn</h5>
                <span className="sub">Nhiệm vụ: NV_20240510_02</span>
              </div>
              <span className="date font-mono">10/05/2024 16:20</span>
            </div>

            <div className="recent-rpt-card">
              <FileText size={20} className="ic-green" />
              <div className="rpt-details">
                <h5 className="name">Báo cáo tổng hợp tháng 04</h5>
                <span className="sub">01/04/2024 - 30/04/2024</span>
              </div>
              <span className="date font-mono">01/05/2024 10:00</span>
            </div>
          </div>
          <a href="#all" className="link-more-center">Xem tất cả báo cáo &gt;</a>
        </div>
      </div>

      {/* Bottom Data Table: DANH SÁCH BÁO CÁO */}
      <div className="dashboard-panel reports-table-panel">
        <div className="panel-section-header">
          <h3 className="section-title">DANH SÁCH BÁO CÁO</h3>
        </div>
        <div className="reports-table-wrapper">
          <table className="reports-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>TÊN BÁO CÁO</th>
                <th>LOẠI BÁO CÁO</th>
                <th>UAV</th>
                <th>NHIỆM VỤ</th>
                <th>KHOẢNG THỜI GIAN</th>
                <th>NGƯỜI TẠO</th>
                <th>NGÀY TẠO</th>
                <th>ĐỊNH DẠNG</th>
                <th>KÍCH THƯỚC</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {reportsList.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-muted">{r.id}</td>
                  <td className="font-bold text-white">{r.title}</td>
                  <td>{r.type}</td>
                  <td>{r.uav}</td>
                  <td className="font-mono text-muted">{r.mission}</td>
                  <td className="font-mono text-muted">{r.range}</td>
                  <td className="font-mono">{r.author}</td>
                  <td className="font-mono text-muted">{r.createdAt}</td>
                  <td><span className="badge-pdf">PDF</span></td>
                  <td className="font-mono">{r.size}</td>
                  <td>
                    <div className="table-actions-row">
                      <button className="btn-ic-table" title="Xem"><Eye size={14} /></button>
                      <button className="btn-ic-table" title="Tải về"><Download size={14} /></button>
                      <button className="btn-ic-table" title="Xoá"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="reports-pagination-bar">
          <span className="count-info">Hiển thị 1 - 5 của 24 báo cáo</span>
          <div className="pages-flex">
            <button className="page-btn">&lt;</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">4</button>
            <button className="page-btn">5</button>
            <button className="page-btn">&gt;</button>
          </div>
          <div className="rows-per-page">
            <span>Hiển thị 5/trang ▾</span>
          </div>
        </div>
      </div>
    </div>
  );
}
