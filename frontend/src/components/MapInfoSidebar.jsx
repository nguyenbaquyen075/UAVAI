import { X, Plane, Target, AlertTriangle, Shield } from "lucide-react";

export default function MapInfoSidebar({ cursorPos, layers, onToggleLayer }) {
  return (
    <aside className="map-info-sidebar-v2">
      <div className="sidebar-header-row">
        <h3 className="sidebar-title">THÔNG TIN BẢN ĐỒ</h3>
        <button className="close-btn" title="Đóng panel"><X size={14} /></button>
      </div>

      <div className="sidebar-scroll-content">
        {/* Section 1: TỌA ĐỘ CON TRỎ */}
        <div className="sidebar-section">
          <div className="section-label">TỌA ĐỘ CON TRỎ</div>
          <div className="coord-kv-list">
            <div className="kv-row">
              <span className="lbl">Lat:</span>
              <strong className="val font-mono">{cursorPos?.lat || "21.027123"}° N</strong>
            </div>
            <div className="kv-row">
              <span className="lbl">Lng:</span>
              <strong className="val font-mono">{cursorPos?.lng || "105.854567"}° E</strong>
            </div>
            <div className="kv-row">
              <span className="lbl">Độ cao:</span>
              <strong className="val font-mono">{cursorPos?.alt || "48"} m</strong>
            </div>
          </div>
        </div>

        {/* Section 2: THÔNG TIN KHU VỰC */}
        <div className="sidebar-section">
          <div className="section-label">THÔNG TIN KHU VỰC</div>
          <div className="region-kv-list">
            <div className="kv-row">
              <span className="lbl">Địa điểm:</span>
              <span className="val font-semibold">Khu công nghiệp Bắc Thăng Long</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Quận/Huyện:</span>
              <span className="val font-semibold">Đông Anh</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Thành phố:</span>
              <span className="val font-semibold">Hà Nội</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Diện tích:</span>
              <span className="val font-mono">12.45 km²</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Dân cư:</span>
              <span className="val font-mono">~ 18,250 người</span>
            </div>
          </div>
        </div>

        {/* Section 3: LỚP BẢN ĐỒ */}
        <div className="sidebar-section">
          <div className="section-label">LỚP BẢN ĐỒ</div>
          <div className="layer-checkbox-list-v2">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.satellite ?? true}
                onChange={() => onToggleLayer?.("satellite")}
              />
              <span className="custom-check">✓</span>
              <span>Ảnh vệ tinh</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.streets ?? true}
                onChange={() => onToggleLayer?.("streets")}
              />
              <span className="custom-check">✓</span>
              <span>Bản đồ đường</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.terrain ?? false}
                onChange={() => onToggleLayer?.("terrain")}
              />
              <span className="custom-check">✓</span>
              <span>Địa hình</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.nofly ?? true}
                onChange={() => onToggleLayer?.("nofly")}
              />
              <span className="custom-check">✓</span>
              <span>Khu vực cấm bay</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.hazard ?? true}
                onChange={() => onToggleLayer?.("hazard")}
              />
              <span className="custom-check">✓</span>
              <span>Vùng nguy hiểm</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.targets ?? true}
                onChange={() => onToggleLayer?.("targets")}
              />
              <span className="custom-check">✓</span>
              <span>Mục tiêu</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.uavs ?? true}
                onChange={() => onToggleLayer?.("uavs")}
              />
              <span className="custom-check">✓</span>
              <span>Vị trí UAV</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.poi ?? true}
                onChange={() => onToggleLayer?.("poi")}
              />
              <span className="custom-check">✓</span>
              <span>Điểm quan tâm</span>
            </label>
          </div>
        </div>

        {/* Section 4: CHÚ THÍCH */}
        <div className="sidebar-section">
          <div className="section-label">CHÚ THÍCH</div>
          <div className="legend-list-v2">
            <div className="legend-item">
              <Plane size={14} className="icon-uav-lgd" />
              <span>UAV đang bay</span>
            </div>
            <div className="legend-item">
              <span className="lgd-path-line" />
              <span>Lộ trình bay</span>
            </div>
            <div className="legend-item">
              <Target size={14} className="icon-tgt-lgd" />
              <span>Mục tiêu</span>
            </div>
            <div className="legend-item">
              <AlertTriangle size={14} className="icon-nofly-lgd" />
              <span>Khu vực cấm bay</span>
            </div>
            <div className="legend-item">
              <span className="lgd-circle-dashed" />
              <span>Vùng nguy hiểm</span>
            </div>
            <div className="legend-item">
              <Shield size={14} className="icon-shield-lgd" />
              <span>Khu vực quan tâm</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
