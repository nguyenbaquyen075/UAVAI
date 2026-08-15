import { useState } from "react";
import {
  FileText,
  Crosshair,
  Wifi,
  Battery,
  User,
  Search,
  Plane,
  CloudRain,
  AlertTriangle,
  Wrench,
  RotateCw,
  Waves,
  Users,
  Star,
  Edit2,
  MoreVertical,
  Calendar,
  Download,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Table,
  Code,
  Undo,
  Redo,
  X,
  Plus,
} from "lucide-react";

export default function NotesView() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNoteId, setSelectedNoteId] = useState(1);
  const [currentTime, setCurrentTime] = useState("18:42:10 13/05/2024");
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState(["khu vực A", "kiểm tra", "bình thường", "giám sát"]);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const notesList = [
    {
      id: 1,
      icon: FileText,
      iconColor: "#22c55e",
      title: "Kiểm tra khu vực mục tiêu A",
      uav: "UAV_02",
      mission: "NV_20240513_01",
      time: "18:35",
      starred: true,
    },
    {
      id: 2,
      icon: CloudRain,
      iconColor: "#3b82f6",
      title: "Điều kiện thời tiết bất thường",
      uav: "UAV_03",
      mission: "NV_20240513_02",
      time: "17:40",
      starred: false,
    },
    {
      id: 3,
      icon: AlertTriangle,
      iconColor: "#ef4444",
      title: "Phát hiện hoạt động nghi vấn",
      uav: "UAV_01",
      mission: "NV_20240512_08",
      time: "16:20",
      starred: true,
    },
    {
      id: 4,
      icon: Wrench,
      iconColor: "#94a3b8",
      title: "Ghi chú bảo trì định kỳ UAV_02",
      uav: "UAV_02",
      mission: "Bảo trì",
      time: "15:10",
      starred: false,
    },
    {
      id: 5,
      icon: RotateCw,
      iconColor: "#a855f7",
      title: "Thay đổi kế hoạch bay",
      uav: "UAV_01",
      mission: "NV_20240512_07",
      time: "14:05",
      starred: false,
    },
    {
      id: 6,
      icon: Waves,
      iconColor: "#06b6d4",
      title: "Quan sát khu vực sông",
      uav: "UAV_03",
      mission: "NV_20240512_05",
      time: "11:30",
      starred: true,
    },
    {
      id: 7,
      icon: Users,
      iconColor: "#f59e0b",
      title: "Họp giao ban sáng",
      uav: "Chung",
      mission: "Họp",
      time: "09:15",
      starred: false,
    },
    {
      id: 8,
      icon: Battery,
      iconColor: "#eab308",
      title: "Lưu ý về pin và hiệu suất",
      uav: "UAV_04",
      mission: "Bảo trì",
      time: "12/05",
      starred: false,
    },
  ];

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTagText.trim() && !tags.includes(newTagText.trim())) {
      setTags([...tags, newTagText.trim()]);
      setNewTagText("");
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (t) => {
    setTags(tags.filter((item) => item !== t));
  };

  return (
    <div className="notes-page-layout-v2">
      {/* Top Tabs & Action Button Bar */}
      <div className="notes-top-tabs-bar">
        <div className="tabs-group">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả ghi chép
          </button>
          <button
            className={`tab-btn ${activeTab === "quick" ? "active" : ""}`}
            onClick={() => setActiveTab("quick")}
          >
            Ghi chú nhanh
          </button>
          <button
            className={`tab-btn ${activeTab === "mine" ? "active" : ""}`}
            onClick={() => setActiveTab("mine")}
          >
            Ghi chép của tôi
          </button>
          <button
            className={`tab-btn ${activeTab === "starred" ? "active" : ""}`}
            onClick={() => setActiveTab("starred")}
          >
            Gắn dấu sao
          </button>
        </div>
        <button className="btn-create-note-green">
          <Plus size={16} /> Tạo ghi chép mới
        </button>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="notes-filters-row">
        <div className="search-box-wrap">
          <Search size={14} className="search-ic" />
          <input
            type="text"
            placeholder="Tìm kiếm ghi chép..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select-sm"><option>Tất cả loại</option></select>
        <select className="filter-select-sm"><option>Tất cả UAV</option></select>
        <select className="filter-select-sm"><option>Tất cả nhiệm vụ</option></select>
        <select className="filter-select-sm"><option>Tất cả mức độ</option></select>
        <div className="date-range-pill">
          <span>13/04/2024 - 13/05/2024</span>
          <Calendar size={12} />
        </div>
      </div>

      {/* Main 3 Column Split Layout */}
      <div className="notes-main-3col-v2">
        {/* Column 1: DANH SÁCH GHI CHÉP */}
        <div className="dashboard-panel notes-left-column">
          <div className="panel-section-header">
            <h3 className="section-title">DANH SÁCH GHI CHÉP (32)</h3>
            <span className="sort-sub-text">Sắp xếp: Mới nhất ▾</span>
          </div>
          <div className="notes-list-items-stack">
            {notesList.map((n) => {
              const IconComp = n.icon;
              const isSelected = n.id === selectedNoteId;
              return (
                <div
                  key={n.id}
                  className={`note-item-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedNoteId(n.id)}
                >
                  <div className="icon-box">
                    <IconComp size={16} color={isSelected ? "#22c55e" : n.iconColor} />
                  </div>
                  <div className="note-card-info">
                    <div className="card-top-header">
                      <span className="title-text">{n.title}</span>
                      <span className="time-text">{n.time}</span>
                    </div>
                    <div className="card-sub-meta">
                      <span>🛸 {n.uav}</span>
                      <span className="sep">•</span>
                      <span>📋 Nhiệm vụ: {n.mission}</span>
                    </div>
                  </div>
                  <div className="star-box">
                    <Star
                      size={14}
                      fill={n.starred ? "#f59e0b" : "none"}
                      color={n.starred ? "#f59e0b" : "#64748b"}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination */}
          <div className="notes-pagination-bar">
            <button className="page-btn">&lt;</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">4</button>
            <button className="page-btn">&gt;</button>
            <button className="page-btn">&gt;&gt;</button>
          </div>
        </div>

        {/* Column 2: CENTER NOTE DETAIL & RICH EDITOR */}
        <div className="dashboard-panel notes-center-column">
          {/* Note Detail Header */}
          <div className="note-header-row">
            <div className="title-edit-group">
              <h2 className="main-note-title">Kiểm tra khu vực mục tiêu A</h2>
              <button className="btn-ic-edit" title="Chỉnh sửa"><Edit2 size={14} /></button>
            </div>
            <div className="header-right-badges">
              <span className="tag-badge-yellow">Quan trọng</span>
              <button className="btn-star-yellow"><Star size={16} fill="#f59e0b" color="#f59e0b" /></button>
              <button className="btn-more-dots"><MoreVertical size={16} /></button>
            </div>
          </div>

          {/* Sub Metadata Bar */}
          <div className="note-sub-meta-bar">
            <span className="meta-pill-item"><Plane size={13} color="#22c55e" /> <strong>UAV_02 - Eagle Pro</strong></span>
            <span className="sep">•</span>
            <span className="meta-pill-item"><Calendar size={13} color="#94a3b8" /> <strong>NV_20240513_01</strong></span>
            <span className="sep">•</span>
            <span className="meta-pill-item"><Calendar size={13} color="#94a3b8" /> <strong>13/05/2024 18:35</strong></span>
            <span className="sep">•</span>
            <span className="meta-pill-item"><User size={13} color="#94a3b8" /> <strong>admin</strong></span>
          </div>

          {/* Rich Text Editor Formatting Toolbar */}
          <div className="editor-toolbar-v2">
            <button className="tb-ic-btn">B</button>
            <button className="tb-ic-btn font-italic">I</button>
            <button className="tb-ic-btn font-underline">U</button>
            <button className="tb-ic-btn font-strike">S</button>
            <div className="tb-divider" />
            <button className="tb-ic-btn"><List size={14} /></button>
            <button className="tb-ic-btn"><ListOrdered size={14} /></button>
            <div className="tb-divider" />
            <button className="tb-ic-btn"><Link2 size={14} /></button>
            <button className="tb-ic-btn"><ImageIcon size={14} /></button>
            <button className="tb-ic-btn"><Table size={14} /></button>
            <button className="tb-ic-btn"><Code size={14} /></button>
            <div className="tb-divider" />
            <button className="tb-ic-btn"><Undo size={14} /></button>
            <button className="tb-ic-btn"><Redo size={14} /></button>
          </div>

          {/* Note Body Text Content */}
          <div className="note-markdown-body">
            <h4 className="body-heading">Nội dung ghi chép</h4>
            <p className="body-paragraph">Tiến hành kiểm tra chi tiết khu vực mục tiêu A theo kế hoạch.</p>
            <ul className="body-bullet-list">
              <li>Khu vực tổng quan ổn định, không phát hiện dấu hiệu bất thường.</li>
              <li>Một số hoạt động của người dân tại khu vực phía Đông.</li>
              <li>Phương tiện di chuyển chủ yếu là xe máy và xe tải nhỏ.</li>
              <li>Điều kiện thời tiết: Nhiều mây, tầm nhìn tốt.</li>
              <li>GPS ổn định, tín hiệu mạnh trong suốt quá trình bay.</li>
            </ul>

            <h4 className="body-heading">Đề xuất:</h4>
            <ul className="body-bullet-list">
              <li>Tiếp tục theo dõi khu vực này trong 24 giờ tới.</li>
              <li>Tăng tần suất bay vào khung giờ 18:00 - 22:00.</li>
              <li>Phối hợp với lực lượng mặt đất để xác minh thông tin.</li>
            </ul>
          </div>

          {/* Embedded Content Image Grid */}
          <div className="note-images-grid-section">
            <h4 className="section-sub-label">Hình ảnh đính kèm trong nội dung</h4>
            <div className="images-thumb-row">
              <div className="img-thumb-card active">
                <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=300&q=80" alt="aerial target A" />
              </div>
              <div className="img-thumb-card">
                <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&q=80" alt="river landscape" />
              </div>
              <div className="img-thumb-card">
                <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80" alt="aerial mountain" />
              </div>
              <div className="img-thumb-card overlay">
                <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80" alt="dark aerial" />
                <div className="overlay-text">+3</div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="note-tags-section">
            <span className="tags-lbl">Thẻ (Tag)</span>
            <div className="tags-chips-flex">
              {tags.map((t) => (
                <span key={t} className="tag-chip-v2">
                  {t} <button className="btn-del-tag" onClick={() => handleRemoveTag(t)}>✕</button>
                </span>
              ))}

              {showAddTag ? (
                <form onSubmit={handleAddTag} className="add-tag-inline-form">
                  <input
                    type="text"
                    placeholder="Tên thẻ..."
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn-confirm-tag">Thêm</button>
                </form>
              ) : (
                <button className="btn-add-tag-v2" onClick={() => setShowAddTag(true)}>+ Thêm thẻ</button>
              )}
            </div>
          </div>

          {/* Quick Note Textarea Box */}
          <div className="quick-note-section">
            <span className="quick-lbl">Ghi chú nhanh</span>
            <textarea
              className="quick-textarea"
              placeholder="Thêm ghi chú nhanh..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
            />
            <button className="btn-save-quick">Lưu ghi chú nhanh</button>
          </div>
        </div>

        {/* Column 3: RIGHT SIDEBAR METADATA & ATTACHMENTS */}
        <div className="notes-right-column">
          {/* Card 1: THÔNG TIN GHI CHÉP */}
          <div className="dashboard-panel right-meta-card">
            <div className="panel-section-header">
              <h3 className="section-title">THÔNG TIN GHI CHÉP</h3>
            </div>
            <div className="side-kv-list">
              <div className="kv-row">
                <span className="lbl">Loại ghi chép</span>
                <span className="val green-text font-bold">Ghi chép nhiệm vụ</span>
              </div>
              <div className="kv-row">
                <span className="lbl">Mức độ</span>
                <span className="badge-tag yellow">Quan trọng</span>
              </div>
              <div className="kv-row">
                <span className="lbl">Trạng thái</span>
                <span className="val green-text font-bold">● Hoàn thành</span>
              </div>
              <div className="kv-row">
                <span className="lbl">Người tạo</span>
                <span className="val font-mono">admin</span>
              </div>
              <div className="kv-row">
                <span className="lbl">Thời gian tạo</span>
                <span className="val font-mono">13/05/2024 18:35</span>
              </div>
              <div className="kv-row">
                <span className="lbl">Cập nhật lần cuối</span>
                <span className="val font-mono">13/05/2024 18:37</span>
              </div>
            </div>
          </div>

          {/* Card 2: TỆP ĐÌNH KÈM (5) */}
          <div className="dashboard-panel right-attachments-card">
            <div className="panel-section-header">
              <h3 className="section-title">TỆP ĐÌNH KÈM (5)</h3>
            </div>
            <div className="attach-files-list">
              <div className="file-item-row">
                <ImageIcon size={14} className="ic-file" />
                <div className="file-name-size">
                  <span className="name">anh_khu_vuc_A_01.jpg</span>
                  <span className="size">2.4 MB</span>
                </div>
                <button className="btn-download"><Download size={13} /></button>
              </div>

              <div className="file-item-row">
                <ImageIcon size={14} className="ic-file" />
                <div className="file-name-size">
                  <span className="name">anh_khu_vuc_A_02.jpg</span>
                  <span className="size">3.1 MB</span>
                </div>
                <button className="btn-download"><Download size={13} /></button>
              </div>

              <div className="file-item-row">
                <span className="ic-file">🎥</span>
                <div className="file-name-size">
                  <span className="name">video_khu_vuc_A.mp4</span>
                  <span className="size">45.2 MB</span>
                </div>
                <button className="btn-download"><Download size={13} /></button>
              </div>

              <div className="file-item-row">
                <span className="ic-file red">📕</span>
                <div className="file-name-size">
                  <span className="name">bao_cao_so_bo.pdf</span>
                  <span className="size">1.2 MB</span>
                </div>
                <button className="btn-download"><Download size={13} /></button>
              </div>

              <div className="file-item-row">
                <FileText size={14} className="ic-file" />
                <div className="file-name-size">
                  <span className="name">log_bay_UAV_02.txt</span>
                  <span className="size">0.8 MB</span>
                </div>
                <button className="btn-download"><Download size={13} /></button>
              </div>
            </div>
            <button className="btn-download-all"><Download size={13} /> Tải tất cả</button>
          </div>

          {/* Card 3: HOẠT ĐỘNG LIÊN QUAN */}
          <div className="dashboard-panel right-activity-card">
            <div className="panel-section-header">
              <h3 className="section-title">HOẠT ĐỘNG LIÊN QUAN</h3>
            </div>
            <div className="activity-timeline-list">
              <div className="act-item-row">
                <span className="act-dot green">●</span>
                <span className="act-time font-mono">18:35</span>
                <div className="act-meta">
                  <span className="title">Tạo ghi chép</span>
                  <span className="author">admin</span>
                </div>
                <button className="btn-dl-act"><Download size={11} /></button>
              </div>

              <div className="act-item-row">
                <span className="act-dot green">●</span>
                <span className="act-time font-mono">18:37</span>
                <div className="act-meta">
                  <span className="title">Cập nhật ghi chép</span>
                  <span className="author">admin</span>
                </div>
                <button className="btn-dl-act"><Download size={11} /></button>
              </div>

              <div className="act-item-row">
                <span className="act-dot green">●</span>
                <span className="act-time font-mono">18:40</span>
                <div className="act-meta">
                  <span className="title">Đính kèm tệp mới</span>
                  <span className="author">admin</span>
                </div>
                <button className="btn-dl-act"><Download size={11} /></button>
              </div>
            </div>
            <a href="#history" className="history-link-footer">Xem tất cả lịch sử &gt;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
