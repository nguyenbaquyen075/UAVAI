import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Battery,
  Crosshair,
  Wifi,
  User,
  Search,
  Plane,
  ClipboardList,
  Star,
  Clock,
  X,
  Bold,
  Italic,
  Trash2,
} from "lucide-react";
import { createNote, deleteNote, listMissions, listNotes, listUAVs, patchNote } from "../api";

function fmt(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("vi-VN");
}

export default function NotesView() {
  const [currentTime, setCurrentTime] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | starred
  const [notes, setNotes] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterUav, setFilterUav] = useState("");

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUavId, setNewUavId] = useState("");
  const [newMissionId, setNewMissionId] = useState("");

  const [draftContent, setDraftContent] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState("");

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

  async function reload() {
    const list = await listNotes();
    setNotes(Array.isArray(list) ? list : []);
  }

  useEffect(() => {
    reload();
    listUAVs().then((l) => setUavs(Array.isArray(l) ? l : []));
    listMissions().then((l) => setMissions(Array.isArray(l) ? l : []));
    const id = setInterval(reload, 5000);
    return () => clearInterval(id);
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) ?? null;

  useEffect(() => {
    setDraftContent(selectedNote?.content ?? "");
  }, [selectedNoteId, selectedNote?.content]);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (activeTab === "starred" && !n.starred) return false;
      if (filterUav && String(n.uav_id) !== filterUav) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [notes, activeTab, filterUav, search]);

  function uavName(id) {
    return uavs.find((u) => u.id === id)?.name ?? null;
  }
  function missionName(id) {
    return missions.find((m) => m.id === id)?.name ?? null;
  }

  async function toggleStar(e, note) {
    e.stopPropagation();
    await patchNote(note.id, { starred: !note.starred });
    reload();
  }

  async function createNewNote() {
    if (!newTitle.trim()) return;
    const created = await createNote({
      title: newTitle.trim(),
      content: "",
      tags: [],
      uav_id: newUavId ? Number(newUavId) : null,
      mission_id: newMissionId ? Number(newMissionId) : null,
    });
    setNewTitle(""); setNewUavId(""); setNewMissionId(""); setShowNewForm(false);
    await reload();
    if (created?.id) setSelectedNoteId(created.id);
  }

  async function saveContent() {
    if (!selectedNote) return;
    await patchNote(selectedNote.id, { content: draftContent });
    reload();
  }

  function wrapSelection(before, after) {
    const el = document.getElementById("note-content-textarea");
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const next = draftContent.slice(0, s) + before + draftContent.slice(s, e) + after + draftContent.slice(e);
    setDraftContent(next);
  }

  async function removeTag(tag) {
    if (!selectedNote) return;
    await patchNote(selectedNote.id, { tags: selectedNote.tags.filter((t) => t !== tag) });
    reload();
  }

  async function addTag(e) {
    e.preventDefault();
    if (!selectedNote || !newTagInput.trim()) return;
    if (selectedNote.tags.includes(newTagInput.trim())) return;
    await patchNote(selectedNote.id, { tags: [...selectedNote.tags, newTagInput.trim()] });
    setNewTagInput(""); setShowAddTagInput(false);
    reload();
  }

  async function saveQuickNote() {
    if (!quickNoteText.trim()) return;
    await createNote({ title: `Ghi chú nhanh ${new Date().toLocaleTimeString("vi-VN")}`, content: quickNoteText.trim(), tags: ["ghi-chu-nhanh"] });
    setQuickNoteText("");
    reload();
  }

  async function removeNote(id) {
    await deleteNote(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
    reload();
  }

  return (
    <div className="notes-page-layout">
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <FileText size={18} color="#4ade80" />
            <span className="sub-title-label">GHI CHÉP</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Ghi chép</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><Crosshair size={14} color="#4ade80" /><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><Wifi size={14} /><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><Battery size={14} /><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill"><span>{currentTime || "-"}</span></div>
          <div className="user-profile-badge">
            <div className="avatar"><User size={16} color="#e6e8ec" /></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>

      <div className="notes-top-bar">
        <div className="category-tabs">
          <button className={`cat-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>Tất cả ghi chép</button>
          <button className={`cat-tab ${activeTab === "starred" ? "active" : ""}`} onClick={() => setActiveTab("starred")}>Gắn dấu sao</button>
        </div>
        <button className="btn-create-note" onClick={() => setShowNewForm((v) => !v)}>
          <span className="plus-icon">+</span> Tạo ghi chép mới
        </button>
      </div>

      {showNewForm && (
        <div className="notes-filter-bar">
          <input className="search-input-box" style={{ flex: 2 }} placeholder="Tiêu đề ghi chép..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <select className="filter-select" value={newUavId} onChange={(e) => setNewUavId(e.target.value)}>
            <option value="">Không gắn UAV</option>
            {uavs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="filter-select" value={newMissionId} onChange={(e) => setNewMissionId(e.target.value)}>
            <option value="">Không gắn nhiệm vụ</option>
            {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="btn-create-note" onClick={createNewNote} disabled={!newTitle.trim()}>Tạo</button>
        </div>
      )}

      <div className="notes-filter-bar">
        <div className="search-input-box">
          <span className="search-icon"><Search size={14} /></span>
          <input type="text" placeholder="Tìm kiếm ghi chép..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterUav} onChange={(e) => setFilterUav(e.target.value)}>
          <option value="">Tất cả UAV</option>
          {uavs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="notes-main-grid">
        {/* Left Column */}
        <div className="notes-list-column">
          <div className="column-header-row">
            <span className="column-title">DANH SÁCH GHI CHÉP ({filtered.length})</span>
          </div>

          <div className="notes-card-scroll">
            {filtered.length === 0 && <p className="muted" style={{ padding: "10px" }}>Chưa có ghi chép nào.</p>}
            {filtered.map((n) => (
              <div key={n.id} className={`note-list-card ${n.id === selectedNoteId ? "active" : ""}`} onClick={() => setSelectedNoteId(n.id)}>
                <div className="card-top-row">
                  <span className="note-type-icon"><FileText size={16} /></span>
                  <div className="note-card-title">{n.title}</div>
                  <span className="note-card-time">{new Date(n.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="card-bottom-row">
                  <div className="card-tags">
                    {uavName(n.uav_id) && <span className="tag-pill"><Plane size={12} /> {uavName(n.uav_id)}</span>}
                    {missionName(n.mission_id) && <span className="tag-pill"><ClipboardList size={12} /> {missionName(n.mission_id)}</span>}
                  </div>
                  <button className={`star-btn ${n.starred ? "starred" : ""}`} onClick={(e) => toggleStar(e, n)} title={n.starred ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}>
                    <Star size={14} fill={n.starred ? "#facc15" : "none"} color={n.starred ? "#facc15" : "currentColor"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Detail + editor */}
        <div className="note-detail-column">
          {!selectedNote ? (
            <p className="muted">Chọn một ghi chép ở danh sách bên trái, hoặc tạo ghi chép mới.</p>
          ) : (
            <>
              <div className="detail-title-header">
                <div className="title-left"><h2>{selectedNote.title}</h2></div>
                <div className="title-right-actions">
                  <button className={`star-btn-large ${selectedNote.starred ? "starred" : ""}`} onClick={(e) => toggleStar(e, selectedNote)}>
                    <Star size={16} fill={selectedNote.starred ? "#facc15" : "none"} color={selectedNote.starred ? "#facc15" : "currentColor"} />
                  </button>
                  <button className="more-options-btn" title="Xoá ghi chép" onClick={() => removeNote(selectedNote.id)}><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="note-metadata-bar">
                <span><Plane size={14} /> <strong>{uavName(selectedNote.uav_id) ?? "—"}</strong></span>
                <span className="sep">•</span>
                <span><ClipboardList size={14} /> <strong>{missionName(selectedNote.mission_id) ?? "—"}</strong></span>
                <span className="sep">•</span>
                <span><Clock size={14} /> <strong>{fmt(selectedNote.created_at)}</strong></span>
                <span className="sep">•</span>
                <span><User size={14} /> <strong>{selectedNote.author}</strong></span>
              </div>

              <div className="rich-editor-toolbar">
                <button className="tb-btn font-bold" title="In đậm" onClick={() => wrapSelection("**", "**")}><Bold size={14} /></button>
                <button className="tb-btn font-italic" title="In nghiêng" onClick={() => wrapSelection("_", "_")}><Italic size={14} /></button>
              </div>

              <textarea
                id="note-content-textarea"
                className="sf-textarea"
                style={{ width: "100%", minHeight: "180px", marginBottom: "8px" }}
                placeholder="Nội dung ghi chép..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button className="btn-save-quick-note" onClick={saveContent} disabled={draftContent === selectedNote.content}>Lưu nội dung</button>
              </div>

              <div className="tags-management-box">
                <span className="tags-label">Thẻ (Tag)</span>
                <div className="tags-chips-list">
                  {selectedNote.tags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}<button className="remove-tag-btn" onClick={() => removeTag(tag)}><X size={12} /></button></span>
                  ))}
                  {showAddTagInput ? (
                    <form onSubmit={addTag} className="add-tag-inline-form">
                      <input type="text" placeholder="Nhập tên thẻ..." value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} autoFocus />
                      <button type="submit" className="confirm-tag-btn">Thêm</button>
                    </form>
                  ) : (
                    <button className="btn-add-tag" onClick={() => setShowAddTagInput(true)}>+ Thêm thẻ</button>
                  )}
                </div>
              </div>

              <div className="quick-note-box">
                <span className="quick-note-title">Ghi chú nhanh (tạo ghi chép mới)</span>
                <div className="quick-note-input-row">
                  <textarea placeholder="Thêm ghi chú nhanh..." value={quickNoteText} onChange={(e) => setQuickNoteText(e.target.value)} rows="2" />
                  <button className="btn-save-quick-note" onClick={saveQuickNote}>Lưu ghi chú nhanh</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: real metadata only */}
        <div className="notes-info-column">
          <div className="side-meta-card">
            <span className="side-card-title">THÔNG TIN GHI CHÉP</span>
            {selectedNote ? (
              <div className="meta-info-list">
                <div className="meta-item"><span className="lbl">Trạng thái</span><span className="status-text green">● {selectedNote.starred ? "Đánh dấu sao" : "Bình thường"}</span></div>
                <div className="meta-item"><span className="lbl">Người tạo</span><span className="val font-mono">{selectedNote.author}</span></div>
                <div className="meta-item"><span className="lbl">Thời gian tạo</span><span className="val font-mono">{fmt(selectedNote.created_at)}</span></div>
                <div className="meta-item"><span className="lbl">Cập nhật lần cuối</span><span className="val font-mono">{fmt(selectedNote.updated_at)}</span></div>
              </div>
            ) : (
              <p className="muted">Chưa chọn ghi chép.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
