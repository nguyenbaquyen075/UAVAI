import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const START = [21.031, 105.855];

const MARKER_COLOR = {
  high: "#ef4444",    // Red
  medium: "#f59e0b",  // Orange
  low: "#3b82f6",     // Blue
  purple: "#8b5cf6"
};

export default function TargetsMap({ targets = [], uavPosition, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    if (mapRef.current) {
      try { mapRef.current.remove(); } catch (e) {}
      mapRef.current = null;
    }

    try {
      const map = L.map(container, { zoomControl: false }).setView(START, 14);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Esri, Maxar, Earthstar Geographics",
        maxZoom: 18,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      setTimeout(() => {
        try { map.invalidateSize(); } catch (e) {}
      }, 200);
    } catch (err) {
      console.error("TargetsMap init error:", err);
    }

    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;
    try {
      layerRef.current.clearLayers();

      // Sample targets overlay matching reference image
      const mapTargets = [
        { id: 1, code: "TGT_001", color: "#ef4444", icon: "🚗", lat: 21.031, lon: 105.855 },
        { id: 2, code: "TGT_002", color: "#f59e0b", icon: "👥", lat: 21.035, lon: 105.851 },
        { id: 3, code: "TGT_003", color: "#ef4444", icon: "🚗", lat: 21.026, lon: 105.860 },
        { id: 4, code: "TGT_004", color: "#3b82f6", icon: "📦", lat: 21.036, lon: 105.858 },
        { id: 5, code: "TGT_005", color: "#f59e0b", icon: "👥", lat: 21.027, lon: 105.852 },
        { id: 7, code: "TGT_007", color: "#8b5cf6", icon: "📦", lat: 21.020, lon: 105.850 },
      ];

      mapTargets.forEach((t) => {
        const marker = L.marker([t.lat, t.lon], {
          icon: L.divIcon({
            className: "custom-tgt-map-icon",
            html: `
              <div class="tgt-marker-box" style="border-color:${t.color}; box-shadow:0 0 10px ${t.color}80">
                <span class="tgt-ic">${t.icon}</span>
              </div>
              <span class="tgt-code-lbl" style="background:${t.color}">${t.code}</span>
            `,
            iconSize: [32, 44],
            iconAnchor: [16, 22],
          }),
        }).addTo(layerRef.current);

        marker.on("click", () => onSelect?.(t.id));
      });

      // Green bounding box polygon ("Khu vực quan tâm")
      const greenZone = [
        [21.028, 105.856],
        [21.030, 105.860],
        [21.025, 105.862],
        [21.023, 105.858],
      ];
      L.polygon(greenZone, {
        color: "#22c55e",
        weight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.15,
      }).addTo(layerRef.current);

      // Red dashed trajectory line from TGT_001
      L.polyline(
        [
          [21.031, 105.855],
          [21.033, 105.852],
        ],
        { color: "#ef4444", weight: 2, dashArray: "5, 5" }
      ).addTo(layerRef.current);

      if (mapRef.current) {
        try {
          mapRef.current.fitBounds(mapTargets.map((t) => [t.lat, t.lon]), { padding: [30, 30] });
        } catch (e) {}
      }
    } catch (err) {
      console.error("TargetsMap draw error:", err);
    }
  }, [targets, onSelect]);

  return <div ref={containerRef} className="targets-map-element" />;
}
