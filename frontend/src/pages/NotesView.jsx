import { useEffect, useState } from "react";

export default function NotesView() {
  const [currentTime, setCurrentTime] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNoteId, setSelectedNoteId] = useState(1);
  const [quickNoteText, setQuickNoteText] = useState("");
  const [tags, setTags] = useState(["khu vực A", "kiểm tra", "bình thường", "giám sát"]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTagInput, setShowAddTagInput] = useState(false);

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

  const [notesList, setNotesList] = useState([
    {
      id: 1,
      icon: "📄",
      title: "Kiểm tra khu vực mục tiêu A",
      uav: "UAV_02",
      uavFull: "UAV_02 - Eagle Pro",
      mission: "NV_20240513_01",
      category: "mission",
      time: "18:35",
      date: "13/05/2024 18:35",
      starred: true,
      severity: "important",
      author: "admin",
      status: "completed",
    },
    {
      id: 2,
      icon: "🌧️",
      title: "Điều kiện thời tiết bất thường",
      uav: "UAV_03",
      uavFull: "UAV_03 - Falcon Eye",
      mission: "NV_20240513_02",
      category: "weather",
      time: "17:40",
      date: "13/05/2024 17:40",
      starred: false,
      severity: "warning",
      author: "admin",
      status: "completed",
    },
    {
      id: 3,
      icon: "⚠️",
      title: "Phát hiện hoạt động nghi vấn",
      uav: "UAV_01",
      uavFull: "UAV_01 - Predator X",
      mission: "NV_20240512_08",
      category: "security",
      time: "16:20",
      date: "12/05/2024 16:20",
      starred: true,
      severity: "urgent",
      author: "admin",
      status: "completed",
    },
    {
      id: 4,
      icon: "🔧",
      title: "Ghi chú bảo trì định kỳ UAV_02",
      uav: "UAV_02",
      uavFull: "UAV_02 - Eagle Pro",
      mission: "Bảo trì",
      category: "maintenance",
      time: "15:10",
      date: "12/05/2024 15:10",
      starred: false,
      severity: "normal",
      author: "technician",
      status: "completed",
    },
    {
      id: 5,
      icon: "🔀",
      title: "Thay đổi kế hoạch bay",
      uav: "UAV_01",
      uavFull: "UAV_01 - Predator X",
      mission: "NV_20240512_07",
      category: "plan",
      time: "14:05",
      date: "12/05/2024 14:05",
      starred: false,
      severity: "normal",
      author: "admin",
      status: "completed",
    },
    {
      id: 6,
      icon: "🌊",
      title: "Quan sát khu vực sông",
      uav: "UAV_03",
      uavFull: "UAV_03 - Falcon Eye",
      mission: "NV_20240512_05",
      category: "patrol",
      time: "11:30",
      date: "12/05/2024 11:30",
      starred: true,
      severity: "normal",
      author: "admin",
      status: "completed",
    },
    {
      id: 7,
      icon: "👥",
      title: "Họp giao ban sáng",
      uav: "Chung",
      uavFull: "Trung tâm chỉ huy",
      mission: "Họp",
      category: "meeting",
      time: "09:15",
      date: "12/05/2024 09:15",
      starred: false,
      severity: "normal",
      author: "admin",
      status: "completed",
    },
    {
      id: 8,
      icon: "🔋",
      title: "Lưu ý về pin và hiệu suất",
      uav: "UAV_04",
      uavFull: "UAV_04 - Scout 04",
      mission: "Bảo trì",
      category: "battery",
      time: "12/05",
      date: "12/05/2024 08:00",
      starred: false,
      severity: "normal",
      author: "technician",
      status: "completed",
    },
  ]);

  const toggleStar = (e, noteId) => {
    e.stopPropagation();
    setNotesList((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, starred: !n.starred } : n))
    );
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const addTag = (e) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput("");
      setShowAddTagInput(false);
    }
  };

  const selectedNote = notesList.find((n) => n.id === selectedNoteId) || notesList[0];

  return (
    <div className="notes-page-layout">
      {/* Sub Header */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span className="sub-title-label">GHI CHÉP</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Ghi chép</span>
          </div>
        </div>

        <div className="header-right-telemetry">
          <div className="telemetry-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>GPS <strong>12</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>Liên kết <strong>Strong</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
              <line x1="23" y1="11" x2="23" y2="13"></line>
            </svg>
            <span>Pin <strong>78%</strong></span>
          </div>

          <div className="telemetry-pill clock-pill">
            <span>{currentTime || "18:42:10 13/05/2024"}</span>
          </div>

          <div className="user-profile-badge">
            <div className="avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="username">admin</span>
              <span className="user-role">Quản trị viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Filter Tabs & Action Bar */}
      <div className="notes-top-bar">
        <div className="category-tabs">
          <button
            className={`cat-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả ghi chép
          </button>
          <button
            className={`cat-tab ${activeTab === "quick" ? "active" : ""}`}
            onClick={() => setActiveTab("quick")}
          >
            Ghi chú nhanh
          </button>
          <button
            className={`cat-tab ${activeTab === "mine" ? "active" : ""}`}
            onClick={() => setActiveTab("mine")}
          >
            Ghi chép của tôi
          </button>
          <button
            className={`cat-tab ${activeTab === "starred" ? "active" : ""}`}
            onClick={() => setActiveTab("starred")}
          >
            Gắn dấu sao
          </button>
        </div>

        <button className="btn-create-note">
          <span className="plus-icon">+</span> Tạo ghi chép mới
        </button>
      </div>

      {/* Search & Filter Dropdowns Bar */}
      <div className="notes-filter-bar">
        <div className="search-input-box">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Tìm kiếm ghi chép..." />
        </div>

        <select className="filter-select" defaultValue="">
          <option value="">Tất cả loại</option>
          <option value="mission">Nhiệm vụ</option>
          <option value="weather">Thời tiết</option>
          <option value="maintenance">Bảo trì</option>
        </select>

        <select className="filter-select" defaultValue="">
          <option value="">Tất cả UAV</option>
          <option value="UAV_01">UAV_01</option>
          <option value="UAV_02">UAV_02</option>
          <option value="UAV_03">UAV_03</option>
        </select>

        <select className="filter-select" defaultValue="">
          <option value="">Tất cả nhiệm vụ</option>
          <option value="NV_20240513_01">NV_20240513_01</option>
          <option value="NV_20240513_02">NV_20240513_02</option>
        </select>

        <select className="filter-select" defaultValue="">
          <option value="">Tất cả mức độ</option>
          <option value="important">Quan trọng</option>
          <option value="warning">Cảnh báo</option>
          <option value="normal">Bình thường</option>
        </select>

        <div className="date-range-picker">
          <span>13/04/2024 - 13/05/2024</span>
          <span className="cal-icon">📅</span>
        </div>
      </div>

      {/* Main 3-Column Split Content */}
      <div className="notes-main-grid">
        {/* Left Column: Note List */}
        <div className="notes-list-column">
          <div className="column-header-row">
            <span className="column-title">DANH SÁCH GHI CHÉP (32)</span>
            <select className="sort-select" defaultValue="newest">
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="oldest">Sắp xếp: Cũ nhất</option>
            </select>
          </div>

          <div className="notes-card-scroll">
            {notesList.map((n) => (
              <div
                key={n.id}
                className={`note-list-card ${n.id === selectedNoteId ? "active" : ""}`}
                onClick={() => setSelectedNoteId(n.id)}
              >
                <div className="card-top-row">
                  <span className="note-type-icon">{n.icon}</span>
                  <div className="note-card-title">{n.title}</div>
                  <span className="note-card-time">{n.time}</span>
                </div>

                <div className="card-bottom-row">
                  <div className="card-tags">
                    <span className="tag-pill">🛸 {n.uav}</span>
                    {n.mission && <span className="tag-pill">📋 Nhiệm vụ: {n.mission}</span>}
                  </div>

                  <button
                    className={`star-btn ${n.starred ? "starred" : ""}`}
                    onClick={(e) => toggleStar(e, n.id)}
                    title={n.starred ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
                  >
                    {n.starred ? "⭐" : "✩"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="notes-pagination">
            <button className="page-btn disabled">&lt;</button>
            <button className="page-num active">1</button>
            <button className="page-num">2</button>
            <button className="page-num">3</button>
            <button className="page-num">4</button>
            <button className="page-btn">&gt;</button>
            <button className="page-btn">&gt;&gt;</button>
          </div>
        </div>

        {/* Middle Column: Note Detail Viewer & Rich Editor */}
        <div className="note-detail-column">
          <div className="detail-title-header">
            <div className="title-left">
              <h2>{selectedNote.title}</h2>
              <button className="edit-icon-btn" title="Chỉnh sửa tiêu đề">✏️</button>
            </div>

            <div className="title-right-actions">
              <span className="badge-severity important">Quan trọng</span>
              <button
                className={`star-btn-large ${selectedNote.starred ? "starred" : ""}`}
                onClick={(e) => toggleStar(e, selectedNote.id)}
              >
                {selectedNote.starred ? "⭐" : "✩"}
              </button>
              <button className="more-options-btn">⋮</button>
            </div>
          </div>

          <div className="note-metadata-bar">
            <span>🛸 <strong>{selectedNote.uavFull}</strong></span>
            <span className="sep">•</span>
            <span>📋 <strong>{selectedNote.mission}</strong></span>
            <span className="sep">•</span>
            <span>🕒 <strong>{selectedNote.date}</strong></span>
            <span className="sep">•</span>
            <span>👤 <strong>{selectedNote.author}</strong></span>
          </div>

          {/* Rich Text Editor Toolbar */}
          <div className="rich-editor-toolbar">
            <button className="tb-btn font-bold" title="In đậm">B</button>
            <button className="tb-btn font-italic" title="In nghiêng">I</button>
            <button className="tb-btn font-underline" title="Gạch chân">U</button>
            <button className="tb-btn font-strike" title="Gạch ngang">S</button>
            <span className="tb-divider"></span>
            <button className="tb-btn" title="Danh sách không thứ tự">≡</button>
            <button className="tb-btn" title="Danh sách có thứ tự">1.</button>
            <span className="tb-divider"></span>
            <button className="tb-btn" title="Căn trái">⇐</button>
            <button className="tb-btn" title="Căn giữa">⇔</button>
            <button className="tb-btn" title="Căn phải">⇒</button>
            <span className="tb-divider"></span>
            <button className="tb-btn" title="Chèn liên kết">🔗</button>
            <button className="tb-btn" title="Chèn hình ảnh">🖼️</button>
            <button className="tb-btn" title="Chèn bảng">🔲</button>
            <button className="tb-btn" title="Mã nguồn">&lt;&gt;</button>
            <span className="tb-divider"></span>
            <button className="tb-btn" title="Hoàn tác">↶</button>
            <button className="tb-btn" title="Làm lại">↷</button>
          </div>

          {/* Formatted Content Body */}
          <div className="note-rendered-content">
            <h4 className="section-head">Nội dung ghi chép</h4>
            <p className="lead-paragraph">
              Tiến hành kiểm tra chi tiết khu vực mục tiêu A theo kế hoạch.
            </p>

            <ul className="content-bullet-list">
              <li>Khu vực tổng quan ổn định, không phát hiện dấu hiệu bất thường.</li>
              <li>Một số hoạt động của người dân tại khu vực phía Đông.</li>
              <li>Phương tiện di chuyển chủ yếu là xe máy và xe tải nhỏ.</li>
              <li>Điều kiện thời tiết: Nhiều mây, tầm nhìn tốt.</li>
              <li>GPS ổn định, tín hiệu mạnh trong suốt quá trình bay.</li>
            </ul>

            <h4 className="section-head">Đề xuất:</h4>
            <ul className="content-bullet-list">
              <li>Tiếp tục theo dõi khu vực này trong 24 giờ tới.</li>
              <li>Tăng tần suất bay vào khung giờ 18:00 - 22:00.</li>
              <li>Phối hợp với lực lượng mặt đất để xác minh thông tin.</li>
            </ul>

            <h4 className="section-head">Hình ảnh đính kèm trong nội dung</h4>
            <div className="embedded-image-grid">
              <div className="embed-img-card highlight-border">
                <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=300&q=80" alt="Mục tiêu A 1" />
                <div className="reticle-target-dot"></div>
              </div>
              <div className="embed-img-card">
                <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80" alt="Mục tiêu A 2" />
              </div>
              <div className="embed-img-card">
                <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=300&q=80" alt="Mục tiêu A 3" />
              </div>
              <div className="embed-img-card overflow-card">
                <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80" alt="Mục tiêu A 4" />
                <div className="more-overlay">+3</div>
              </div>
            </div>
          </div>

          {/* Tag Chips Section */}
          <div className="tags-management-box">
            <span className="tags-label">Thẻ (Tag)</span>
            <div className="tags-chips-list">
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button className="remove-tag-btn" onClick={() => removeTag(tag)}>✕</button>
                </span>
              ))}

              {showAddTagInput ? (
                <form onSubmit={addTag} className="add-tag-inline-form">
                  <input
                    type="text"
                    placeholder="Nhập tên thẻ..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="confirm-tag-btn">Thêm</button>
                </form>
              ) : (
                <button className="btn-add-tag" onClick={() => setShowAddTagInput(true)}>
                  + Thêm thẻ
                </button>
              )}
            </div>
          </div>

          {/* Quick Note Section */}
          <div className="quick-note-box">
            <span className="quick-note-title">Ghi chú nhanh</span>
            <div className="quick-note-input-row">
              <textarea
                placeholder="Thêm ghi chú nhanh..."
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                rows="2"
              ></textarea>
              <button
                className="btn-save-quick-note"
                onClick={() => {
                  if (quickNoteText.trim()) {
                    alert("Đã lưu ghi chú nhanh thành công!");
                    setQuickNoteText("");
                  }
                }}
              >
                Lưu ghi chú nhanh
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Note Meta & Attachments */}
        <div className="notes-info-column">
          {/* Note Properties Card */}
          <div className="side-meta-card">
            <span className="side-card-title">THÔNG TIN GHI CHÉP</span>
            <div className="meta-info-list">
              <div className="meta-item">
                <span className="lbl">Loại ghi chép</span>
                <span className="badge-pill green">Ghi chép nhiệm vụ</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Mức độ</span>
                <span className="badge-pill yellow">Quan trọng</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Trạng thái</span>
                <span className="status-text green">● Hoàn thành</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Người tạo</span>
                <span className="val font-mono">admin</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Thời gian tạo</span>
                <span className="val font-mono">13/05/2024 18:35</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Cập nhật lần cuối</span>
                <span className="val font-mono">13/05/2024 18:37</span>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="side-meta-card">
            <div className="side-card-header">
              <span className="side-card-title">TỆP ĐÌNH KÈM (5)</span>
            </div>
            <div className="attachments-list">
              <div className="attach-item">
                <span className="file-icon">🖼️</span>
                <div className="file-meta">
                  <span className="filename">anh_khu_vuc_A_01.jpg</span>
                  <span className="filesize">2.4 MB</span>
                </div>
                <button className="download-btn" title="Tải xuống">📥</button>
              </div>

              <div className="attach-item">
                <span className="file-icon">🖼️</span>
                <div className="file-meta">
                  <span className="filename">anh_khu_vuc_A_02.jpg</span>
                  <span className="filesize">3.1 MB</span>
                </div>
                <button className="download-btn" title="Tải xuống">📥</button>
              </div>

              <div className="attach-item">
                <span className="file-icon">🎬</span>
                <div className="file-meta">
                  <span className="filename">video_khu_vuc_A.mp4</span>
                  <span className="filesize">45.2 MB</span>
                </div>
                <button className="download-btn" title="Tải xuống">📥</button>
              </div>

              <div className="attach-item">
                <span className="file-icon">📄</span>
                <div className="file-meta">
                  <span className="filename">bao_cao_so_bo.pdf</span>
                  <span className="filesize">1.2 MB</span>
                </div>
                <button className="download-btn" title="Tải xuống">📥</button>
              </div>

              <div className="attach-item">
                <span className="file-icon">📝</span>
                <div className="file-meta">
                  <span className="filename">log_bay_UAV_02.txt</span>
                  <span className="filesize">0.8 MB</span>
                </div>
                <button className="download-btn" title="Tải xuống">📥</button>
              </div>
            </div>

            <button className="btn-download-all">
              📥 Tải tất cả
            </button>
          </div>

          {/* Related Activity Timeline Card */}
          <div className="side-meta-card">
            <span className="side-card-title">HOẠT ĐỘNG LIÊN QUAN</span>
            <div className="activity-timeline">
              <div className="act-item">
                <span className="act-dot green">●</span>
                <span className="act-time font-mono">18:35</span>
                <div className="act-desc">
                  <strong>Tạo ghi chép</strong>
                  <span className="act-user">admin</span>
                </div>
                <button className="mini-action-btn">📥</button>
              </div>

              <div className="act-item">
                <span className="act-dot green">●</span>
                <span className="act-time font-mono">18:37</span>
                <div className="act-desc">
                  <strong>Cập nhật ghi chép</strong>
                  <span className="act-user">admin</span>
                </div>
                <button className="mini-action-btn">📥</button>
              </div>

              <div className="act-item">
                <span className="act-dot green">●</span>
                <span className="act-time font-mono">18:40</span>
                <div className="act-desc">
                  <strong>Đính kèm tệp mới</strong>
                  <span className="act-user">admin</span>
                </div>
                <button className="mini-action-btn">📥</button>
              </div>
            </div>

            <div className="link-history-footer">
              <a href="#history">Xem tất cả lịch sử &gt;</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
