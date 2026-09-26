import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Maximize2, Cpu, WifiOff, Battery, Gauge, Mountain, X } from "lucide-react";
import { API_BASE, createUAV, getSettings, getUavTelemetry, listUAVs, updateSettings, updateUAV } from "../api";

const DEFAULT_TILE_COUNT = 4;
const FRAME_INTERVAL_MS = 35; // ~22-25 hình/giây mỗi khung (video gốc 30 fps); backend dùng lại JPEG nếu frame chưa đổi
const LAYOUTS = { auto: "Tự động", 1: "1 cột", 2: "2×2", 3: "3×3", 4: "4×4" };
const UAV_STATUS = {
  flying: ["ĐANG BAY", "#22c55e"],
  ready: ["SẴN SÀNG", "#38bdf8"],
  offline: ["OFFLINE", "#64748b"],
  maintenance: ["BẢO TRÌ", "#a855f7"],
};
const NEW_UAV = "__new__";

const autoColumns = (n) => (n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4);

// Poll từng frame JPEG: tải xong frame này mới xin frame kế — tự giãn nhịp khi mạng/CPU chậm
function LiveFrame({ uavId }) {
  const [src, setSrc] = useState(null);
  const [lost, setLost] = useState(false);
  const timer = useRef(null);
  const next = (delay) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSrc(`${API_BASE}/api/uavs/${uavId}/frame?t=${Date.now()}`), delay);
  };

  useEffect(() => {
    setLost(false);
    next(0);
    return () => clearTimeout(timer.current);
  }, [uavId]);

  return (
    <>
      {src && (
        <img
          className="mm-frame"
          src={src}
          alt=""
          onLoad={() => {
            setLost(false);
            next(FRAME_INTERVAL_MS);
          }}
          onError={() => {
            setLost(true);
            next(1500);
          }}
        />
      )}
      {lost && (
        <div className="mm-lost">
          <WifiOff size={26} />
          <span>Mất tín hiệu — đang kết nối lại…</span>
        </div>
      )}
    </>
  );
}

function Tile({ tile, uav, onEdit, onDelete }) {
  const ref = useRef(null);
  const [telemetry, setTelemetry] = useState(null);
  const [objects, setObjects] = useState([]);
  const [aiOn, setAiOn] = useState(true);

  useEffect(() => {
    if (!uav) return;
    let cancelled = false;
    const pollTelemetry = () => getUavTelemetry(uav.id).then((t) => !cancelled && setTelemetry(t));
    const pollDetections = () =>
      fetch(`${API_BASE}/api/uavs/${uav.id}/detections`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          setObjects(d.objects || []);
          setAiOn(d.ai !== false);
        })
        .catch(() => {});
    pollTelemetry();
    pollDetections();
    const t1 = setInterval(pollTelemetry, 2000);
    const t2 = setInterval(pollDetections, 1000);
    return () => {
      cancelled = true;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [uav?.id]);

  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : ref.current?.requestFullscreen())?.catch?.(() => {});
  const [statusText, statusColor] = UAV_STATUS[uav?.status] || ["-", "#64748b"];
  const danger = objects.filter((o) => o.severity === "red").length;
  const warning = objects.filter((o) => o.severity === "yellow").length;

  return (
    <div className={`mm-tile ${danger ? "alarm" : ""}`} ref={ref} onDoubleClick={fullscreen}>
      {uav ? (
        <LiveFrame uavId={uav.id} />
      ) : (
        <div className="mm-lost">
          <WifiOff size={26} />
          <span>UAV của khung này đã bị xoá — bấm sửa để chọn UAV khác</span>
        </div>
      )}

      <div className="mm-top">
        <div className="mm-title">
          <span className="mm-label">{tile.label || uav?.name || "Khung"}</span>
          {uav && (
            <span className="mm-sub">
              {uav.name}
              {uav.type ? ` · ${uav.type}` : ""}
            </span>
          )}
        </div>
        <div className="mm-badges">
          {uav && !aiOn && (
            <span className="mm-badge" style={{ color: "#64748b", borderColor: "#334155" }} title="Backend đang chạy không có YOLO (NO_YOLO=1)">
              <Cpu size={11} /> AI tắt
            </span>
          )}
          {uav && aiOn && (
            <span
              className={`mm-badge ai ${danger ? "danger" : warning ? "warning" : ""}`}
              title="YOLO đang nhận diện trên khung này (số mục tiêu hiện tại)"
            >
              <Cpu size={11} /> {objects.length} mục tiêu{danger ? ` · ${danger} nguy hiểm` : ""}
            </span>
          )}
          <span className="mm-badge" style={{ color: statusColor, borderColor: statusColor }}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="mm-actions" onDoubleClick={(e) => e.stopPropagation()}>
        <button title="Toàn màn hình (hoặc nháy đúp vào khung)" onClick={fullscreen}>
          <Maximize2 size={14} />
        </button>
        <button title="Sửa khung" onClick={onEdit}>
          <Pencil size={14} />
        </button>
        <button title="Xoá khung" className="danger" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>

      {telemetry && (
        <div className="mm-telemetry">
          <span>
            <Battery size={12} /> {Math.round(telemetry.battery_pct)}%
          </span>
          <span>
            <Mountain size={12} /> {telemetry.altitude_m} m
          </span>
          <span>
            <Gauge size={12} /> {telemetry.speed_kmh} km/h
          </span>
          <span>HDG {telemetry.heading_deg}°</span>
          <span className="mm-coords">
            {telemetry.lat?.toFixed(5)}, {telemetry.lon?.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}

function TileForm({ initial, uavs, onSave, onClose }) {
  const firstUav = uavs[0];
  const [f, setF] = useState(() => {
    const uav = uavs.find((u) => u.id === initial?.uav_id) || firstUav;
    return {
      label: initial?.label || "",
      uav_id: uav ? String(uav.id) : NEW_UAV,
      video_source: uav?.video_source || "",
      new_name: "",
      new_type: "",
    };
  });
  const [saving, setSaving] = useState(false);
  const isNew = f.uav_id === NEW_UAV;

  const pickUav = (value) => {
    const uav = uavs.find((u) => String(u.id) === value);
    setF({ ...f, uav_id: value, video_source: uav?.video_source || "" });
  };

  async function submit(e) {
    e.preventDefault();
    if (!f.video_source.trim()) return alert("Nhập nguồn video (RTSP/HTTP/đường dẫn file, hoặc 0 cho webcam)");
    if (isNew && !f.new_name.trim()) return alert("Nhập tên UAV mới");
    setSaving(true);
    let uavId = Number(f.uav_id);
    if (isNew) {
      const res = await createUAV({ name: f.new_name.trim(), type: f.new_type.trim(), video_source: f.video_source.trim() });
      uavId = res?.id;
    } else {
      const uav = uavs.find((u) => u.id === uavId);
      if (uav && uav.video_source !== f.video_source.trim()) await updateUAV(uavId, { video_source: f.video_source.trim() });
    }
    setSaving(false);
    if (uavId) onSave({ label: f.label.trim(), uav_id: uavId });
  }

  return (
    <div className="mm-modal-backdrop" onClick={onClose}>
      <form className="mm-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="mm-modal-head">
          <h3>{initial ? "Sửa khung theo dõi" : "Thêm khung theo dõi"}</h3>
          <button type="button" onClick={onClose} title="Đóng">
            <X size={16} />
          </button>
        </div>

        <label>
          Tên khung
          <input value={f.label} placeholder="VD: Cổng Bắc, Tuyến biên giới A…" onChange={(e) => setF({ ...f, label: e.target.value })} />
        </label>

        <label>
          UAV
          <select value={f.uav_id} onChange={(e) => pickUav(e.target.value)}>
            {uavs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.type ? `(${u.type})` : ""}
              </option>
            ))}
            <option value={NEW_UAV}>+ Thêm UAV mới…</option>
          </select>
        </label>

        {isNew && (
          <div className="mm-row">
            <label>
              Tên UAV mới
              <input value={f.new_name} placeholder="UAV_07" onChange={(e) => setF({ ...f, new_name: e.target.value })} />
            </label>
            <label>
              Loại
              <input value={f.new_type} placeholder="Matrice 350" onChange={(e) => setF({ ...f, new_type: e.target.value })} />
            </label>
          </div>
        )}

        <label>
          Nguồn video của UAV
          <input
            value={f.video_source}
            placeholder="rtsp://192.168.1.100/live hoặc sample_video.mp4"
            onChange={(e) => setF({ ...f, video_source: e.target.value })}
          />
          <small>Đổi nguồn ở đây sẽ cập nhật camera của UAV cho mọi màn hình.</small>
        </label>

        <div className="mm-modal-foot">
          <button type="button" className="mm-btn ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="mm-btn" disabled={saving}>
            {saving ? "Đang lưu…" : initial ? "Lưu thay đổi" : "Thêm khung"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MultiMonitor({ embedded = false, extraActions = null }) {
  const [uavs, setUavs] = useState([]);
  const [tiles, setTiles] = useState(null); // null = đang tải
  const [layout, setLayout] = useState("auto");
  const [editing, setEditing] = useState(null); // null | "new" | tile

  async function refreshUavs() {
    const list = await listUAVs();
    const safe = Array.isArray(list) ? list : [];
    setUavs(safe);
    return safe;
  }

  useEffect(() => {
    (async () => {
      const [list, settings] = await Promise.all([refreshUavs(), getSettings()]);
      if (Array.isArray(settings?.monitor_tiles)) {
        setTiles(settings.monitor_tiles);
      } else {
        // Lần đầu: tạo sẵn 4 khung cho 4 UAV đầu tiên
        const seed = list.slice(0, DEFAULT_TILE_COUNT).map((u, i) => ({ id: Date.now() + i, uav_id: u.id, label: "" }));
        setTiles(seed);
        updateSettings({ monitor_tiles: seed });
      }
    })();
    const id = setInterval(refreshUavs, 5000);
    return () => clearInterval(id);
  }, []);

  const save = (next) => {
    setTiles(next);
    updateSettings({ monitor_tiles: next });
  };

  const onSaveTile = (data) => {
    if (editing === "new") save([...tiles, { id: Date.now(), ...data }]);
    else save(tiles.map((t) => (t.id === editing.id ? { ...t, ...data } : t)));
    setEditing(null);
    refreshUavs();
  };

  const removeTile = (tile, name) => {
    if (confirm(`Xoá khung "${name}"? (UAV vẫn giữ nguyên, chỉ bỏ khỏi màn hình)`)) save(tiles.filter((t) => t.id !== tile.id));
  };

  const list = tiles || [];
  const cols = layout === "auto" ? autoColumns(list.length) : Number(layout);

  return (
    <div className={`mm-page ${embedded ? "embedded" : ""}`}>
      <div className="mm-toolbar">
        <div>
          {!embedded && <h2>Giám sát đa UAV</h2>}
          <span className="mm-count">
            {list.length} khung · {uavs.filter((u) => u.status === "flying").length} UAV đang bay
          </span>
        </div>
        <div className="mm-toolbar-right">
          {extraActions}
          <label className="mm-layout">
            Bố cục
            <select value={layout} onChange={(e) => setLayout(e.target.value)}>
              {Object.entries(LAYOUTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <button className="mm-btn" onClick={() => setEditing("new")} disabled={!tiles}>
            <Plus size={15} /> Thêm khung
          </button>
        </div>
      </div>

      {tiles && list.length === 0 && (
        <div className="mm-empty">
          Chưa có khung theo dõi nào.
          <button className="mm-btn" onClick={() => setEditing("new")}>
            <Plus size={15} /> Thêm khung đầu tiên
          </button>
        </div>
      )}

      <div className="mm-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {list.map((tile) => {
          const uav = uavs.find((u) => u.id === tile.uav_id);
          return (
            <Tile
              key={tile.id}
              tile={tile}
              uav={uav}
              onEdit={() => setEditing(tile)}
              onDelete={() => removeTile(tile, tile.label || uav?.name || "Khung")}
            />
          );
        })}
      </div>

      {editing && (
        <TileForm initial={editing === "new" ? null : editing} uavs={uavs} onSave={onSaveTile} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
