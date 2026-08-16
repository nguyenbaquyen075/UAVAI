import React, { useState, useEffect } from "react";
import {
  Info,
  Sliders,
  Map,
  Ruler,
  Clock,
  Globe,
  Shield,
  Archive,
  ChevronRight,
  RotateCw,
  User,
  CheckCircle2,
  Save,
  X,
  Sun,
  Moon,
  Monitor,
  Check,
  Search,
  Bell,
  Plane,
  Eye,
  Download,
} from "lucide-react";
import { getSettings, updateSettings } from "../api";
import MapSettingsView from "../components/MapSettingsView";
import SecuritySettingsView from "../components/SecuritySettingsView";
import VideoDownloadSettingsView from "../components/VideoDownloadSettingsView";

const TOP_NAV_TABS = [
  { key: "info", label: "Thông tin hệ thống", Icon: Info },
  { key: "interface", label: "Giao diện", Icon: Sliders },
  { key: "map", label: "Bản đồ", Icon: Map },
  { key: "security", label: "Bảo mật", Icon: Shield },
  { key: "download", label: "Tải xuống video", Icon: Download },
];

const ACCENT_COLORS = [
  { key: "green", hex: "#22c55e", label: "Xanh lá" },
  { key: "blue", hex: "#3b82f6", label: "Xanh dương" },
  { key: "purple", hex: "#a855f7", label: "Tím" },
  { key: "orange", hex: "#f97316", label: "Cam" },
  { key: "red", hex: "#ef4444", label: "Đỏ" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("info");
  const [settings, setSettings] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savedMessage, setSavedMessage] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("13/05/2024 10:30:45");

  // System Info State
  const [systemData, setSystemData] = useState({
    systemName: "UAV CONTROL - Hệ thống quản lý UAV",
    description: "Hệ thống quản lý và giám sát UAV phục vụ cho các nhiệm vụ giám sát, tuần tra và khảo sát.",
    version: "v2.4.1",
    server: "UAV-SERVER-01",
    ipAddress: "192.168.1.10",
    storageUsed: 256,
    storageTotal: 1024,
    uptime: "15 ngày 8 giờ 32 phút",
    uavCount: 18,
    userCount: 24,
    missionCount: 156,
  });

  // Interface Settings State (Exact match screenshot)
  const [colorMode, setColorMode] = useState("dark"); // "light" | "dark" | "auto"
  const [accentColor, setAccentColor] = useState("green"); // "green" | "blue" | "purple" | "orange" | "red"
  const [interfaceToggles, setInterfaceToggles] = useState({
    showNotifications: true,
    showTooltips: true,
    enableAnimations: true,
    collapseSidebar: false,
    showStatusBar: true,
  });
  const [densityMode, setDensityMode] = useState("medium"); // "low" | "medium" | "high"

  // Other Tabs State
  const [mapData, setMapData] = useState({
    defaultMap: "Bản đồ vệ tinh (Satellite)",
    coordinateSystem: "WGS-84 / UTM Zone 48N",
    gridOverlay: "Hiển thị lưới tọa độ",
    autoCenterUAV: "Có (Mỗi 5 giây)",
    defaultZoom: "Mức 14",
  });

  const [unitsData, setUnitsData] = useState({
    distance: "Mét / Kilômét (m/km)",
    speed: "Kilômét / giờ (km/h)",
    altitude: "Mét so với mực nước biển (MSL)",
    area: "Hécta / Kilômét vuông (ha/km²)",
    temperature: "Độ C (°C)",
  });

  const [timeData, setTimeData] = useState({
    timezone: "(UTC+07:00) Bangkok, Hanoi, Jakarta",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24 giờ (HH:mm:ss)",
    ntpServer: "time.google.com (Đã đồng bộ)",
  });

  const [languageData, setLanguageData] = useState({
    appLanguage: "Tiếng Việt (Vietnamese)",
    voiceAlerts: "Tiếng Việt (Nữ miền Bắc)",
    locale: "vi_VN",
  });

  const [securityData, setSecurityData] = useState({
    twoFactor: "Đã bật (2FA)",
    sessionTimeout: "30 phút",
    failedAttempts: "Tối đa 5 lần",
    encryption: "AES-256 GCM",
  });

  const [backupData, setBackupData] = useState({
    lastBackup: "13/05/2024 02:00:00 (Tự động)",
    autoBackupFreq: "Hằng ngày vào 02:00 AM",
    backupLocation: "Máy chủ nội bộ + Cloud S3",
    retention: "30 bản sao gần nhất",
  });

  useEffect(() => {
    getSettings().then((res) => {
      if (res) setSettings(res);
    });
  }, []);

  const handleRefresh = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    const time = now.toTimeString().split(" ")[0];
    setLastUpdated(`${d}/${m}/${y} ${time}`);
    setSavedMessage("Đã cập nhật dữ liệu mới nhất!");
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleStartEdit = (key, val) => {
    setEditingRow(key);
    setEditValue(val);
  };

  const handleSaveEdit = (category, key) => {
    if (category === "system") {
      setSystemData((prev) => ({ ...prev, [key]: editValue }));
    }
    setEditingRow(null);
    setSavedMessage("Lưu thay đổi thành công!");
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleToggleInterface = (key) => {
    setInterfaceToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveInterfaceSettings = () => {
    setSavedMessage("Lưu cài đặt giao diện thành công!");
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const storagePercentage = (
    (systemData.storageUsed / systemData.storageTotal) *
    100
  ).toFixed(1);

  // Selected accent color hex helper
  const activeAccentHex =
    ACCENT_COLORS.find((c) => c.key === accentColor)?.hex || "#22c55e";

  return (
    <div className="sys-settings-layout-topbar">
      {/* TOP HORIZONTAL NAVIGATION TABS */}
      <div className="sys-top-tabs-bar">
        <div className="sys-top-tabs-list">
          {TOP_NAV_TABS.map((item) => {
            const Icon = item.Icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`sys-top-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon size={16} className="sys-top-tab-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="sys-settings-main-full">
        {/* HEADER TITLE (HIDE FOR MAP, SECURITY, DOWNLOAD TABS AS THEY HAVE CUSTOM HEADERS) */}
        {activeTab !== "map" && activeTab !== "security" && activeTab !== "download" && activeTab !== "backup" && (
          <div className="sys-main-header">
            <h1 className="sys-header-title font-sans">
              {activeTab === "info" && "Thông tin hệ thống"}
              {activeTab === "interface" && "Giao diện"}
            </h1>
            <p className="sys-header-subtitle">
              {activeTab === "info" && "Cấu hình các thông tin cơ bản của hệ thống"}
              {activeTab === "interface" && "Tùy chỉnh giao diện hiển thị của hệ thống"}
            </p>
          </div>
        )}

        {savedMessage && (
          <div className="sys-toast-alert">
            <CheckCircle2 size={16} />
            <span>{savedMessage}</span>
          </div>
        )}

        {/* TAB 1: THÔNG TIN HỆ THỐNG */}
        {activeTab === "info" && (
          <div className="sys-info-card-container">
            <div className="sys-row-item">
              <span className="sys-row-label">Tên hệ thống</span>
              <div className="sys-row-value-group">
                {editingRow === "systemName" ? (
                  <div className="sys-inline-edit font-sans">
                    <input
                      type="text"
                      className="sys-edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <button
                      className="sys-btn-icon save"
                      onClick={() => handleSaveEdit("system", "systemName")}
                    >
                      <Save size={14} />
                    </button>
                    <button
                      className="sys-btn-icon cancel"
                      onClick={() => setEditingRow(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span
                    className="sys-row-value editable"
                    onClick={() => handleStartEdit("systemName", systemData.systemName)}
                  >
                    {systemData.systemName}
                  </span>
                )}
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Mô tả</span>
              <div className="sys-row-value-group">
                {editingRow === "description" ? (
                  <div className="sys-inline-edit font-sans">
                    <textarea
                      className="sys-edit-textarea"
                      value={editValue}
                      rows={2}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <button
                      className="sys-btn-icon save"
                      onClick={() => handleSaveEdit("system", "description")}
                    >
                      <Save size={14} />
                    </button>
                    <button
                      className="sys-btn-icon cancel"
                      onClick={() => setEditingRow(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span
                    className="sys-row-value editable"
                    onClick={() => handleStartEdit("description", systemData.description)}
                  >
                    {systemData.description}
                  </span>
                )}
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Phiên bản</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.version}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Máy chủ</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.server}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Địa chỉ IP</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.ipAddress}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Dung lượng lưu trữ</span>
              <div className="sys-row-value-group storage-flex-group">
                <div className="sys-storage-bar-wrapper">
                  <div
                    className="sys-storage-bar-fill"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <span className="sys-row-value font-mono storage-text">
                  {systemData.storageUsed} GB / {systemData.storageTotal / 1024} TB{" "}
                  <span className="green-percentage">({storagePercentage}%)</span>
                </span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Thời gian hoạt động</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.uptime}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Số lượng UAV</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.uavCount}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Số người dùng</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.userCount}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            <div className="sys-row-item">
              <span className="sys-row-label">Số nhiệm vụ</span>
              <div className="sys-row-value-group">
                <span className="sys-row-value font-mono">{systemData.missionCount}</span>
                <ChevronRight size={18} className="sys-chevron-icon" />
              </div>
            </div>

            {/* FOOTER ROW */}
            <div className="sys-card-footer">
              <div className="sys-footer-left">
                <RotateCw
                  size={15}
                  className="sys-sync-icon"
                  onClick={handleRefresh}
                  title="Tải lại dữ liệu"
                />
                <span className="sys-footer-label">Cập nhật lần cuối:</span>
              </div>
              <div className="sys-footer-right">
                <span className="sys-footer-timestamp font-mono">{lastUpdated}</span>
                <RotateCw
                  size={15}
                  className="sys-sync-icon"
                  onClick={handleRefresh}
                  title="Làm mới"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GIAO DIỆN (EXACT MATCH SCREENSHOT DESIGN) */}
        {activeTab === "interface" && (
          <div className="ui-settings-grid font-sans">
            {/* LEFT COLUMN: OPTIONS & TOGGLES */}
            <div className="ui-settings-left-col">
              {/* SECTION 1: CHẾ ĐỘ MÀU */}
              <div className="ui-config-section">
                <h3 className="ui-section-title">Chế độ màu</h3>
                <div className="ui-cards-2col">
                  {/* Sáng */}
                  <div
                    className={`ui-mode-card ${colorMode === "light" ? "selected" : ""}`}
                    onClick={() => setColorMode("light")}
                  >
                    {colorMode === "light" && (
                      <div className="ui-card-badge">
                        <Check size={12} color="#ffffff" />
                      </div>
                    )}
                    <Sun size={24} className="ui-mode-icon" />
                    <span className="ui-mode-title">Sáng</span>
                    <span className="ui-mode-sub">Giao diện sáng</span>
                  </div>

                  {/* Tối */}
                  <div
                    className={`ui-mode-card ${colorMode === "dark" ? "selected" : ""}`}
                    onClick={() => setColorMode("dark")}
                  >
                    {colorMode === "dark" && (
                      <div className="ui-card-badge">
                        <Check size={12} color="#ffffff" />
                      </div>
                    )}
                    <Moon size={24} className="ui-mode-icon" />
                    <span className="ui-mode-title">Tối</span>
                    <span className="ui-mode-sub">Giao diện tối</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: MÀU CHỦ ĐẠO */}
              <div className="ui-config-section">
                <h3 className="ui-section-title">Màu chủ đạo</h3>
                <div className="ui-colors-row">
                  {ACCENT_COLORS.map((c) => {
                    const isSelected = accentColor === c.key;
                    return (
                      <div
                        key={c.key}
                        className={`ui-color-swatch-box ${isSelected ? "selected" : ""}`}
                        onClick={() => setAccentColor(c.key)}
                        style={{ "--swatch-color": c.hex }}
                      >
                        <div
                          className="ui-color-swatch-inner"
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && <Check size={16} color="#ffffff" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: HIỂN THỊ (TOGGLES) */}
              <div className="ui-config-section">
                <h3 className="ui-section-title">Hiển thị</h3>
                <div className="ui-toggles-list">
                  <div className="ui-toggle-row">
                    <span className="ui-toggle-label">Hiển thị thông báo</span>
                    <button
                      className={`ui-switch ${interfaceToggles.showNotifications ? "on" : ""}`}
                      onClick={() => handleToggleInterface("showNotifications")}
                    >
                      <span className="ui-switch-knob" />
                    </button>
                  </div>

                  <div className="ui-toggle-row">
                    <span className="ui-toggle-label">Hiển thị tooltip</span>
                    <button
                      className={`ui-switch ${interfaceToggles.showTooltips ? "on" : ""}`}
                      onClick={() => handleToggleInterface("showTooltips")}
                    >
                      <span className="ui-switch-knob" />
                    </button>
                  </div>

                  <div className="ui-toggle-row">
                    <span className="ui-toggle-label">Hiển thị hiệu ứng chuyển động</span>
                    <button
                      className={`ui-switch ${interfaceToggles.enableAnimations ? "on" : ""}`}
                      onClick={() => handleToggleInterface("enableAnimations")}
                    >
                      <span className="ui-switch-knob" />
                    </button>
                  </div>

                  <div className="ui-toggle-row">
                    <span className="ui-toggle-label">Thu gọn thanh bên</span>
                    <button
                      className={`ui-switch ${interfaceToggles.collapseSidebar ? "on" : ""}`}
                      onClick={() => handleToggleInterface("collapseSidebar")}
                    >
                      <span className="ui-switch-knob" />
                    </button>
                  </div>

                  <div className="ui-toggle-row">
                    <span className="ui-toggle-label">Hiển thị thanh trạng thái</span>
                    <button
                      className={`ui-switch ${interfaceToggles.showStatusBar ? "on" : ""}`}
                      onClick={() => handleToggleInterface("showStatusBar")}
                    >
                      <span className="ui-switch-knob" />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 4: MẬT ĐỘ HIỂN THỊ */}
              <div className="ui-config-section">
                <h3 className="ui-section-title">Mật độ hiển thị</h3>
                <div className="ui-cards-3col">
                  {/* Thấp */}
                  <div
                    className={`ui-mode-card ${densityMode === "low" ? "selected" : ""}`}
                    onClick={() => setDensityMode("low")}
                  >
                    {densityMode === "low" && (
                      <div className="ui-card-badge">
                        <Check size={12} color="#ffffff" />
                      </div>
                    )}
                    <span className="ui-mode-title">Thấp</span>
                    <span className="ui-mode-sub">Rộng rãi</span>
                  </div>

                  {/* Trung bình */}
                  <div
                    className={`ui-mode-card ${densityMode === "medium" ? "selected" : ""}`}
                    onClick={() => setDensityMode("medium")}
                  >
                    {densityMode === "medium" && (
                      <div className="ui-card-badge">
                        <Check size={12} color="#ffffff" />
                      </div>
                    )}
                    <span className="ui-mode-title">Trung bình</span>
                    <span className="ui-mode-sub">Đề xuất</span>
                  </div>

                  {/* Cao */}
                  <div
                    className={`ui-mode-card ${densityMode === "high" ? "selected" : ""}`}
                    onClick={() => setDensityMode("high")}
                  >
                    {densityMode === "high" && (
                      <div className="ui-card-badge">
                        <Check size={12} color="#ffffff" />
                      </div>
                    )}
                    <span className="ui-mode-title">Cao</span>
                    <span className="ui-mode-sub">Thu gọn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW MOCKUP & INFO CARD */}
            <div className="ui-settings-right-col">
              {/* LIVE PREVIEW CARD */}
              <div className="ui-preview-card">
                <h3 className="ui-card-header-title">Xem trước</h3>

                {/* PREVIEW CONTAINER MOCKUP */}
                <div className="ui-mockup-frame">
                  {/* MOCKUP HEADER */}
                  <div className="ui-mockup-header">
                    <div className="ui-mockup-brand">
                      <Plane size={14} style={{ color: activeAccentHex }} />
                      <span className="ui-mockup-brand-title">
                        UAV <strong style={{ color: activeAccentHex }}>CONTROL</strong>
                      </span>
                    </div>
                    <div className="ui-mockup-header-icons">
                      <Search size={12} color="#94a3b8" />
                      <Bell size={12} color="#94a3b8" />
                      <User size={12} color="#94a3b8" />
                    </div>
                  </div>

                  {/* MOCKUP BODY */}
                  <div className="ui-mockup-body">
                    {/* LEFT MINI NAV */}
                    <div className="ui-mockup-sidenav">
                      <div className="mockup-icon active" style={{ color: activeAccentHex }}>
                        <Info size={11} />
                      </div>
                      <div className="mockup-icon"><Sliders size={11} /></div>
                      <div className="mockup-icon"><Map size={11} /></div>
                      <div className="mockup-icon"><Clock size={11} /></div>
                      <div className="mockup-icon"><Shield size={11} /></div>
                      <div className="mockup-icon"><Archive size={11} /></div>
                    </div>

                    {/* MAIN MOCKUP CONTENT */}
                    <div className="ui-mockup-content">
                      {/* TOP STATS ROW */}
                      <div className="ui-mockup-stats-row">
                        <div className="mockup-stat-card">
                          <Plane size={14} color="#60a5fa" />
                          <div className="stat-stack">
                            <span className="val">18</span>
                            <span className="lbl">Tổng số UAV</span>
                          </div>
                        </div>

                        <div className="mockup-stat-card">
                          <RotateCw size={14} style={{ color: activeAccentHex }} />
                          <div className="stat-stack">
                            <span className="val">8</span>
                            <span className="lbl">Đang hoạt động</span>
                          </div>
                        </div>

                        <div className="mockup-stat-card danger">
                          <X size={14} color="#ef4444" />
                          <div className="stat-stack">
                            <span className="val">5</span>
                            <span className="lbl">Không khả dụng</span>
                          </div>
                        </div>
                      </div>

                      {/* MAP & DETAIL SPLIT */}
                      <div className="ui-mockup-map-split">
                        <div className="mockup-map-box">
                          <div className="mockup-radar-circle">
                            <Plane
                              size={12}
                              className="radar-uav"
                              style={{ color: activeAccentHex }}
                            />
                          </div>
                        </div>

                        <div className="mockup-uav-detail-card">
                          <div className="detail-header">
                            <span className="uav-name">
                              <Plane size={11} style={{ color: activeAccentHex }} /> UAV-01 - Eagle Pro
                            </span>
                          </div>
                          <div className="detail-field">
                            <span className="k">Status</span>
                            <span className="v" style={{ color: activeAccentHex }}>
                              Đang hoạt động
                            </span>
                          </div>
                          <div className="detail-field">
                            <span className="k">Pin</span>
                            <span className="v font-mono">78%</span>
                          </div>
                          <div className="detail-field">
                            <span className="k">Vị trí</span>
                            <span className="v">Khu vực A - Điểm 12</span>
                          </div>
                        </div>
                      </div>

                      {/* RECENT ACTIVITY TABLE */}
                      <div className="ui-mockup-table-box">
                        <div className="table-header-lbl">Hoạt động gần đây</div>
                        <div className="table-row">
                          <span>UAV-03 - SkyEye 4K</span>
                          <span>Tuần tra khu vực B</span>
                          <span style={{ color: activeAccentHex }}>Hoàn thành</span>
                          <span className="font-mono">10:25 AM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* INFORMATION CARD */}
              <div className="ui-info-card font-sans">
                <div className="info-title-row">
                  <Info size={16} className="info-icon" />
                  <span className="info-title font-bold">Thông tin</span>
                </div>
                <p className="info-text">
                  Các tùy chỉnh giao diện sẽ được lưu và áp dụng ngay lập tức trên tài khoản
                  của bạn.
                </p>
              </div>

              {/* BOTTOM SAVE BUTTON */}
              <div className="ui-save-btn-row">
                <button
                  className="ui-btn-save-outline"
                  onClick={handleSaveInterfaceSettings}
                >
                  <Save size={15} />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BẢN ĐỒ (EXACT MATCH REFERENCE SCREENSHOT) */}
        {activeTab === "map" && <MapSettingsView />}



        {/* TAB 4: BẢO MẬT (EXACT MATCH REFERENCE SCREENSHOT) */}
        {activeTab === "security" && <SecuritySettingsView />}

        {/* TAB 5: TẢI XUỐNG VIDEO (EXACT MATCH REFERENCE SCREENSHOT) */}
        {(activeTab === "download" || activeTab === "backup") && (
          <VideoDownloadSettingsView />
        )}
      </main>
    </div>
  );
}
