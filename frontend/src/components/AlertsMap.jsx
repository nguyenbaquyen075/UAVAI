import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function AlertsMap({ selectedAlert, onSelectAlert }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.0285, 105.8542],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // ESRI World Imagery Tile Layer
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      ).addTo(map);

      // Red Threat Zone Polygon around UAV_02
      const redZone = L.polygon(
        [
          [21.036, 105.845],
          [21.042, 105.852],
          [21.039, 105.862],
          [21.031, 105.858],
        ],
        {
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.25,
          weight: 2,
          dashArray: "4 4",
        }
      ).addTo(map);
      redZone.bindTooltip("Vùng mất tín hiệu (UAV_02)", { permanent: false });

      // Yellow Boundary Polygon around UAV_01
      const yellowZone = L.polygon(
        [
          [21.020, 105.835],
          [21.025, 105.848],
          [21.018, 105.850],
        ],
        {
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.2,
          weight: 1.5,
          dashArray: "3 3",
        }
      ).addTo(map);

      // Yellow Target Circle around UAV_05
      L.circle([21.018, 105.858], {
        radius: 400,
        color: "#facc15",
        fillColor: "#facc15",
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);

      // Custom UAV Markers
      const createCustomMarker = (htmlClass, label, color) => {
        return L.divIcon({
          className: "custom-leaflet-alert-icon",
          html: `<div class="alert-map-marker ${color}">
            <span class="marker-dot"></span>
            <span class="marker-lbl">${label}</span>
          </div>`,
          iconSize: [60, 24],
          iconAnchor: [30, 12],
        });
      };

      // UAV_02 (Critical Red)
      const m2 = L.marker([21.037, 105.853], {
        icon: createCustomMarker("red", "UAV_02", "red"),
      }).addTo(map);
      m2.on("click", () => onSelectAlert && onSelectAlert(1));

      // UAV_01 (Warning Orange)
      const m1 = L.marker([21.021, 105.842], {
        icon: createCustomMarker("orange", "UAV_01", "orange"),
      }).addTo(map);
      m1.on("click", () => onSelectAlert && onSelectAlert(3));

      // UAV_04 (Blue)
      const m4 = L.marker([21.029, 105.864], {
        icon: createCustomMarker("blue", "UAV_04", "blue"),
      }).addTo(map);
      m4.on("click", () => onSelectAlert && onSelectAlert(4));

      // UAV_05 (Yellow)
      const m5 = L.marker([21.018, 105.858], {
        icon: createCustomMarker("yellow", "UAV_05", "yellow"),
      }).addTo(map);

      // Home Base Marker
      L.marker([21.034, 105.871], {
        icon: L.divIcon({
          className: "home-leaflet-icon",
          html: `<div class="home-map-pin">🏠</div>`,
          iconSize: [24, 24],
        }),
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  }, []);

  return (
    <div className="alerts-map-card">
      <div className="map-card-header">
        <span className="card-title">VỊ TRÍ CẢNH BÁO</span>
        <div className="map-header-actions">
          <select className="mini-select" defaultValue="all">
            <option value="all">Tất cả UAV</option>
            <option value="UAV_01">UAV_01</option>
            <option value="UAV_02">UAV_02</option>
          </select>
          <button className="icon-btn" title="Phóng to">⤢</button>
        </div>
      </div>

      <div className="alerts-leaflet-wrap">
        <div ref={mapContainerRef} className="alerts-leaflet-container"></div>
      </div>

      <div className="alerts-map-legend">
        <div className="lgd-item"><span className="dot red">●</span> Nghiêm trọng</div>
        <div className="lgd-item"><span className="dot orange">●</span> Quan trọng</div>
        <div className="lgd-item"><span className="dot yellow">●</span> Trung bình</div>
        <div className="lgd-item"><span className="dot blue">●</span> Thông tin</div>
      </div>
    </div>
  );
}
