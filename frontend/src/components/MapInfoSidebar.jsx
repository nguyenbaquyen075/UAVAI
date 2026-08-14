export default function MapInfoSidebar({ cursorPos, layers, onToggleLayer }) {
  return (
    <aside className="map-info-sidebar">
      <div className="sidebar-header-row">
        <h3 className="sidebar-title">THÔNG TIN BẢN ĐỒ</h3>
        <button className="close-btn" title="Đóng panel">✕</button>
      </div>

      <div className="sidebar-scroll-content">
        {/* Section 1: Cursor Coordinates */}
        <div className="sidebar-section">
          <div className="section-label">TỌA ĐỘ CON TRỎ</div>
          <div className="coord-grid">
            <div className="coord-item">
              <span className="lbl">Lat:</span>
              <strong className="val">{cursorPos?.lat ?? "21.027123"}° N</strong>
            </div>
            <div className="coord-item">
              <span className="lbl">Lng:</span>
              <strong className="val">{cursorPos?.lng ?? "105.854567"}° E</strong>
            </div>
            <div className="coord-item">
              <span className="lbl">Độ cao:</span>
              <strong className="val">{cursorPos?.alt ?? "48"} m</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Regional Information */}
        <div className="sidebar-section">
          <div className="section-label">THÔNG TIN KHU VỰC</div>
          <div className="info-list-stacked">
            <div className="info-row">
              <span>Địa điểm:</span>
              <strong>Khu công nghiệp Bắc Thăng Long</strong>
            </div>
            <div className="info-row">
              <span>Quận/Huyện:</span>
              <strong>Đông Anh</strong>
            </div>
            <div className="info-row">
              <span>Thành phố:</span>
              <strong>Hà Nội</strong>
            </div>
            <div className="info-row">
              <span>Diện tích:</span>
              <strong>12.45 km²</strong>
            </div>
            <div className="info-row">
              <span>Dân cư:</span>
              <strong>~ 18,250 người</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Map Layers */}
        <div className="sidebar-section">
          <div className="section-label">LỚP BẢN ĐỒ</div>
          <div className="layer-checkbox-list">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.satellite ?? true}
                onChange={() => onToggleLayer?.("satellite")}
              />
              <span className="custom-check"></span>
              <span>Ảnh vệ tinh</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.streets ?? true}
                onChange={() => onToggleLayer?.("streets")}
              />
              <span className="custom-check"></span>
              <span>Bản đồ đường</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.terrain ?? false}
                onChange={() => onToggleLayer?.("terrain")}
              />
              <span className="custom-check"></span>
              <span>Địa hình</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.nofly ?? true}
                onChange={() => onToggleLayer?.("nofly")}
              />
              <span className="custom-check"></span>
              <span>Khu vực cấm bay</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.hazard ?? true}
                onChange={() => onToggleLayer?.("hazard")}
              />
              <span className="custom-check"></span>
              <span>Vùng nguy hiểm</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.targets ?? true}
                onChange={() => onToggleLayer?.("targets")}
              />
              <span className="custom-check"></span>
              <span>Mục tiêu</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.uavs ?? true}
                onChange={() => onToggleLayer?.("uavs")}
              />
              <span className="custom-check"></span>
              <span>Vị trí UAV</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={layers?.poi ?? false}
                onChange={() => onToggleLayer?.("poi")}
              />
              <span className="custom-check"></span>
              <span>Điểm quan tâm</span>
            </label>
          </div>
        </div>

        {/* Section 4: Map Legend */}
        <div className="sidebar-section">
          <div className="section-label">CHÚ THÍCH</div>
          <div className="legend-list">
            <div className="legend-item">
              <span className="lgd-icon uav-icon">🛸</span>
              <span>UAV đang bay</span>
            </div>
            <div className="legend-item">
              <span className="lgd-line blue-line"></span>
              <span>Lộ trình bay</span>
            </div>
            <div className="legend-item">
              <span className="lgd-icon target-icon">🎯</span>
              <span>Mục tiêu</span>
            </div>
            <div className="legend-item">
              <span className="lgd-shape yellow-box"></span>
              <span>Khu vực cấm bay</span>
            </div>
            <div className="legend-item">
              <span className="lgd-shape red-circle"></span>
              <span>Vùng nguy hiểm</span>
            </div>
            <div className="legend-item">
              <span className="lgd-shape blue-shield"></span>
              <span>Khu vực quan tâm</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
