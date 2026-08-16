import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Plane,
  Calendar,
  User,
  Star,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import { listNotes, createNote, patchNote, deleteNote, listUAVs, listMissions } from "../api";

const PAGE_SIZE = 8;

function fmtDate(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function NotesView() {
  const [notes, setNotes] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [newTagText, setNewTagText] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function reload(selectAfterId) {
    const data = await listNotes();
    const rows = Array.isArray(data) ? data : [];
    setNotes(rows);
    if (selectAfterId !== undefined) {
      setSelectedId(selectAfterId);
    } else if (!rows.some((n) => n.id === selectedId)) {
      setSelectedId(rows[0]?.id ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    listUAVs().then((r) => setUavs(Array.isArray(r) ? r : []));
    listMissions().then((r) => setMissions(Array.isArray(r) ? r : []));
    reload();
  }, []);

  const selected = notes.find((n) => n.id === selectedId) || null;

  useEffect(() => {
    setDraftTitle(selected?.title ?? "");
    setDraftContent(selected?.content ?? "");
    setDirty(false);
  }, [selectedId]);

  const filtered = notes.filter((n) => {
    if (activeTab === "starred" && !n.starred) return false;
    if (search && !`${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleCreate() {
    const { id } = await createNote({ title: "Ghi chép mới", content: "", tags: [] });
    await reload(id);
    setActiveTab("all");
    setPage(1);
  }

  async function handleSave() {
    if (!selected) return;
    await patchNote(selected.id, { title: draftTitle || "Không tiêu đề", content: draftContent });
    await reload(selected.id);
  }

  async function handleToggleStar(note) {
    await patchNote(note.id, { starred: !note.starred });
    await reload(selectedId);
  }

  async function handleDelete(note) {
    await deleteNote(note.id);
    await reload();
  }

  async function handleAddTag(e) {
    e.preventDefault();
    const t = newTagText.trim();
    if (!t || !selected || selected.tags.includes(t)) return;
    await patchNote(selected.id, { tags: [...selected.tags, t] });
    setNewTagText("");
    setShowAddTag(false);
    await reload(selectedId);
  }

  async function handleRemoveTag(t) {
    if (!selected) return;
    await patchNote(selected.id, { tags: selected.tags.filter((x) => x !== t) });
    await reload(selectedId);
  }

  async function handleAssignUav(uavId) {
    if (!selected) return;
    await patchNote(selected.id, { uav_id: uavId ? Number(uavId) : null });
    await reload(selectedId);
  }

  async function handleAssignMission(missionId) {
    if (!selected) return;
    await patchNote(selected.id, { mission_id: missionId ? Number(missionId) : null });
    await reload(selectedId);
  }

  if (loading) {
    return <div className="notes-page-layout-v2"><div className="chart-empty-state">Đang tải ghi chép…</div></div>;
  }

  const selectedUav = selected?.uav_id ? uavs.find((u) => u.id === selected.uav_id) : null;
  const selectedMission = selected?.mission_id ? missions.find((m) => m.id === selected.mission_id) : null;

  return (
    <div className="notes-page-layout-v2">
      <div className="notes-top-tabs-bar">
        <div className="tabs-group">
          <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => { setActiveTab("all"); setPage(1); }}>
            Tất cả ghi chép
          </button>
          <button className={`tab-btn ${activeTab === "starred" ? "active" : ""}`} onClick={() => { setActiveTab("starred"); setPage(1); }}>
            Gắn dấu sao
          </button>
        </div>
        <button className="btn-create-note-green" onClick={handleCreate}>
          <Plus size={16} /> Tạo ghi chép mới
        </button>
      </div>

      <div className="notes-filters-row">
        <div className="search-box-wrap">
          <Search size={14} className="search-ic" />
          <input
            type="text"
            placeholder="Tìm kiếm ghi chép..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="notes-main-3col-v2">
        {/* Column 1: DANH SÁCH GHI CHÉP */}
        <div className="dashboard-panel notes-left-column">
          <div className="panel-section-header">
            <h3 className="section-title">DANH SÁCH GHI CHÉP ({filtered.length})</h3>
          </div>
          <div className="notes-list-items-stack">
            {pageRows.length === 0 && <div className="chart-empty-state">Chưa có ghi chép nào</div>}
            {pageRows.map((n) => {
              const isSelected = n.id === selectedId;
              const uav = n.uav_id ? uavs.find((u) => u.id === n.uav_id) : null;
              return (
                <div key={n.id} className={`note-item-card ${isSelected ? "selected" : ""}`} onClick={() => setSelectedId(n.id)}>
                  <div className="icon-box">
                    <FileText size={16} color={isSelected ? "#22c55e" : "#94a3b8"} />
                  </div>
                  <div className="note-card-info">
                    <div className="card-top-header">
                      <span className="title-text">{n.title}</span>
                      <span className="time-text">{fmtDate(n.updated_at).split(" ")[1]}</span>
                    </div>
                    <div className="card-sub-meta">
                      <span>🛸 {uav ? uav.name : "--"}</span>
                      <span className="sep">•</span>
                      <span>{fmtDate(n.updated_at)}</span>
                    </div>
                  </div>
                  <div className="star-box" onClick={(e) => { e.stopPropagation(); handleToggleStar(n); }}>
                    <Star size={14} fill={n.starred ? "#f59e0b" : "none"} color={n.starred ? "#f59e0b" : "#64748b"} />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="notes-pagination-bar">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>&lt;</button>
              <span className="page-btn active">{page} / {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>&gt;</button>
            </div>
          )}
        </div>

        {/* Column 2: NOTE DETAIL & EDITOR */}
        <div className="dashboard-panel notes-center-column">
          {!selected ? (
            <div className="chart-empty-state">Chọn hoặc tạo một ghi chép để xem chi tiết</div>
          ) : (
            <>
              <div className="note-header-row">
                <div className="title-edit-group">
                  <input
                    className="main-note-title-input"
                    value={draftTitle}
                    onChange={(e) => { setDraftTitle(e.target.value); setDirty(true); }}
                    placeholder="Tiêu đề ghi chép"
                  />
                </div>
                <div className="header-right-badges">
                  <button className="btn-star-yellow" onClick={() => handleToggleStar(selected)}>
                    <Star size={16} fill={selected.starred ? "#f59e0b" : "none"} color="#f59e0b" />
                  </button>
                  <button className="btn-more-dots" title="Xoá" onClick={() => handleDelete(selected)}>
                    <Trash2 size={16} color="#ef4444" />
                  </button>
                </div>
              </div>

              <div className="note-sub-meta-bar">
                <span className="meta-pill-item">
                  <Plane size={13} color="#22c55e" />
                  <select value={selected.uav_id ?? ""} onChange={(e) => handleAssignUav(e.target.value)}>
                    <option value="">-- UAV --</option>
                    {uavs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </span>
                <span className="sep">•</span>
                <span className="meta-pill-item">
                  <Calendar size={13} color="#94a3b8" />
                  <select value={selected.mission_id ?? ""} onChange={(e) => handleAssignMission(e.target.value)}>
                    <option value="">-- Nhiệm vụ --</option>
                    {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </span>
                <span className="sep">•</span>
                <span className="meta-pill-item"><User size={13} color="#94a3b8" /> <strong>{selected.author}</strong></span>
              </div>

              <div className="note-markdown-body">
                <textarea
                  className="note-content-textarea"
                  value={draftContent}
                  onChange={(e) => { setDraftContent(e.target.value); setDirty(true); }}
                  placeholder="Nội dung ghi chép..."
                  rows={10}
                />
              </div>

              {dirty && (
                <button className="btn-save-quick" onClick={handleSave}>Lưu thay đổi</button>
              )}

              <div className="note-tags-section">
                <span className="tags-lbl">Thẻ (Tag)</span>
                <div className="tags-chips-flex">
                  {selected.tags.map((t) => (
                    <span key={t} className="tag-chip-v2">
                      {t} <button className="btn-del-tag" onClick={() => handleRemoveTag(t)}><X size={10} /></button>
                    </span>
                  ))}
                  {showAddTag ? (
                    <form onSubmit={handleAddTag} className="add-tag-inline-form">
                      <input type="text" placeholder="Tên thẻ..." value={newTagText} onChange={(e) => setNewTagText(e.target.value)} autoFocus />
                      <button type="submit" className="btn-confirm-tag">Thêm</button>
                    </form>
                  ) : (
                    <button className="btn-add-tag-v2" onClick={() => setShowAddTag(true)}>+ Thêm thẻ</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Column 3: METADATA */}
        <div className="notes-right-column">
          {selected && (
            <div className="dashboard-panel right-meta-card">
              <div className="panel-section-header">
                <h3 className="section-title">THÔNG TIN GHI CHÉP</h3>
              </div>
              <div className="side-kv-list">
                <div className="kv-row">
                  <span className="lbl">UAV liên kết</span>
                  <span className="val green-text font-bold">{selectedUav ? selectedUav.name : "Không có"}</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">Nhiệm vụ liên kết</span>
                  <span className="val green-text font-bold">{selectedMission ? selectedMission.name : "Không có"}</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">Người tạo</span>
                  <span className="val font-mono">{selected.author}</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">Thời gian tạo</span>
                  <span className="val font-mono">{fmtDate(selected.created_at)}</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">Cập nhật lần cuối</span>
                  <span className="val font-mono">{fmtDate(selected.updated_at)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
