import React, { useState } from "react";
import {
  Download,
  History,
  Laptop,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Play,
  CheckCircle2,
  Info,
  FileVideo,
  MoreHorizontal,
  Eye,
  Copy,
  Star,
  Trash2,
  X,
  Clock,
  HardDrive,
  Film,
  Tag,
} from "lucide-react";

const INITIAL_VIDEOS = [
  {
    id: 1,
    title: "Giới thiệu tổng quan về UAV",
    subtitle: "Tổng quan về hệ thống và nguyên lý hoạt động của UAV.",
    category: "Cơ bản",
    categoryColor: "#22c55e",
    duration: "12:45",
    sizeMB: 256,
    quality: "1080p",
    selected: true,
    thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80",
    filename: "Gioi_thieu_tong_quan_UAV_1080p.mp4",
    resolution: "1920 x 1080 (Full HD)",
    codec: "H.264 / AAC",
    dateAdded: "13/05/2024",
    favorite: false,
  },
  {
    id: 2,
    title: "Hướng dẫn điều khiển UAV",
    subtitle: "Hướng dẫn chi tiết cách điều khiển và các chế độ bay.",
    category: "Hướng dẫn",
    categoryColor: "#3b82f6",
    duration: "18:32",
    sizeMB: 358,
    quality: "1080p",
    selected: true,
    thumbnail: "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80",
    filename: "Huong_dan_dieu_khien_UAV_1080p.mp4",
    resolution: "1920 x 1080 (Full HD)",
    codec: "H.264 / AAC",
    dateAdded: "12/05/2024",
    favorite: true,
  },
  {
    id: 3,
    title: "Lập kế hoạch nhiệm vụ bay",
    subtitle: "Cách tạo và tối ưu hóa lộ trình nhiệm vụ trên bản đồ.",
    category: "Nâng cao",
    categoryColor: "#a855f7",
    duration: "15:20",
    sizeMB: 298,
    quality: "720p",
    selected: true,
    thumbnail: "https://images.unsplash.com/photo-1506947411487-a56738267384?w=600&auto=format&fit=crop&q=80",
    filename: "Lap_ke_hoach_nhiem_vu_720p.mp4",
    resolution: "1280 x 720 (HD)",
    codec: "H.264 / AAC",
    dateAdded: "10/05/2024",
    favorite: false,
  },
  {
    id: 4,
    title: "Bảo trì và kiểm tra thiết bị",
    subtitle: "Quy trình kiểm tra và bảo trì định kỳ cho UAV.",
    category: "Bảo trì",
    categoryColor: "#eab308",
    duration: "10:10",
    sizeMB: 198,
    quality: "720p",
    selected: false,
    thumbnail: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
    filename: "Bao_tri_kiem_tra_thiet_bi_720p.mp4",
    resolution: "1280 x 720 (HD)",
    codec: "H.264 / AAC",
    dateAdded: "08/05/2024",
    favorite: false,
  },
  {
    id: 5,
    title: "Quản lý pin và an toàn bay",
    subtitle: "Các nguyên tắc an toàn và cách quản lý pin hiệu quả.",
    category: "An toàn",
    categoryColor: "#ef4444",
    duration: "08:45",
    sizeMB: 154,
    quality: "480p",
    selected: false,
    thumbnail: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&auto=format&fit=crop&q=80",
    filename: "Quan_ly_pin_an_toan_bay_480p.mp4",
    resolution: "854 x 480 (SD)",
    codec: "H.264 / AAC",
    dateAdded: "05/05/2024",
    favorite: false,
  },
];

export default function VideoDownloadSettingsView() {
  const [videos, setVideos] = useState(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [detailModalVideo, setDetailModalVideo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trigger browser direct file download
  const triggerBrowserFileDownload = (filename, contentText) => {
    const element = document.createElement("a");
    const file = new Blob([contentText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleToggleSelect = (id) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, selected: !v.selected } : v))
    );
  };

  const handleToggleAll = () => {
    const allSelected = videos.every((v) => v.selected);
    setVideos((prev) => prev.map((v) => ({ ...v, selected: !allSelected })));
  };

  const handleChangeQuality = (id, quality) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, quality } : v))
    );
  };

  const handleSingleDownload = (video) => {
    triggerBrowserFileDownload(
      video.filename,
      `[UAV CONTROL SYSTEM] Video Demo Payload: ${video.title}\nChất lượng: ${video.quality}\nThời lượng: ${video.duration}\nDung lượng: ${video.sizeMB} MB\nNgày tải: ${new Date().toLocaleString()}`
    );
    showToast(`Đã tải tệp "${video.filename}" về máy của bạn!`);
    setActiveMenuId(null);
  };

  const handleBatchDownload = () => {
    const selected = videos.filter((v) => v.selected);
    if (selected.length === 0) return;

    selected.forEach((video) => {
      triggerBrowserFileDownload(
        video.filename,
        `[UAV CONTROL SYSTEM] Video Demo Payload: ${video.title}\nChất lượng: ${video.quality}\nThời lượng: ${video.duration}\nDung lượng: ${video.sizeMB} MB\nNgày tải: ${new Date().toLocaleString()}`
      );
    });

    showToast(`Đã tải ${selected.length} tệp video (${totalSizeMB} MB) về máy!`);
  };

  const handleCopyLink = (video) => {
    navigator.clipboard?.writeText(window.location.href);
    showToast(`Đã sao chép đường dẫn video: "${video.title}"`);
    setActiveMenuId(null);
  };

  const handleToggleFavorite = (id) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, favorite: !v.favorite } : v))
    );
    showToast("Đã cập nhật danh sách yêu thích!");
    setActiveMenuId(null);
  };

  const handleDeleteVideo = (id, title) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    showToast(`Đã xóa video "${title}" khỏi danh sách`);
    setActiveMenuId(null);
  };

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCount = videos.filter((v) => v.selected).length;
  const totalSizeMB = videos
    .filter((v) => v.selected)
    .reduce((sum, v) => sum + v.sizeMB, 0);

  return (
    <div
      className="vdl-settings-layout font-sans"
      onClick={() => setActiveMenuId(null)}
    >
      {/* PAGE HEADER */}
      <div className="vdl-page-header">
        <div className="header-left-stack">
          <h1 className="vdl-page-title font-sans">Tải xuống video</h1>
          <p className="vdl-page-subtitle">
            Tải các video bài giảng, tài liệu hướng dẫn trực tiếp về thiết bị của bạn.
          </p>
        </div>
        <button className="vdl-btn-history font-sans">
          <History size={15} />
          <span>Lịch sử tải xuống</span>
        </button>
      </div>

      {toastMessage && (
        <div className="sys-toast-alert">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN SPLIT: LEFT CONTENT & RIGHT INSTRUCTIONS SIDEBAR */}
      <div className="vdl-main-split">
        {/* LEFT COLUMN: FILTERS, TABLE */}
        <div className="vdl-left-col">
          {/* FILTER & BATCH ACTION TOOLBAR */}
          <div className="vdl-toolbar-row">
            <div className="toolbar-left-group">
              {/* Search input */}
              <div className="vdl-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="vdl-search-input font-sans"
                  placeholder="Tìm kiếm video..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category filter select */}
              <div className="vdl-select-box font-sans">
                <select
                  className="toolbar-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Tất cả chuyên mục</option>
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Hướng dẫn">Hướng dẫn</option>
                  <option value="Nâng cao">Nâng cao</option>
                  <option value="Bảo trì">Bảo trì</option>
                  <option value="An toàn">An toàn</option>
                </select>
                <ChevronDown size={14} className="select-chevron" />
              </div>

              {/* Advanced filter button */}
              <button className="vdl-btn-filter font-sans">
                <SlidersHorizontal size={14} />
                <span>Lọc nâng cao</span>
              </button>
            </div>

            {/* Batch download all button */}
            <button className="vdl-btn-batch-green" onClick={handleBatchDownload}>
              <Download size={15} />
              <span>Tải tất cả ({selectedCount})</span>
            </button>
          </div>

          {/* VIDEO LIST TABLE CARD */}
          <div className="vdl-table-container">
            <div className="vdl-table-header-row font-sans">
              <div className="col-check-video">
                <input
                  type="checkbox"
                  className="vdl-checkbox"
                  checked={videos.length > 0 && videos.every((v) => v.selected)}
                  onChange={handleToggleAll}
                />
                <span>Video</span>
              </div>
              <div className="col-cat">Chuyên mục</div>
              <div className="col-dur">Thời lượng</div>
              <div className="col-size">Kích thước</div>
              <div className="col-qual">Chất lượng</div>
              <div className="col-act">Thao tác</div>
            </div>

            <div className="vdl-table-body">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className={`vdl-table-row ${video.selected ? "selected-row" : ""}`}
                >
                  {/* Video Checkbox & Thumbnail & Title Stack */}
                  <div className="col-check-video">
                    <input
                      type="checkbox"
                      className="vdl-checkbox"
                      checked={video.selected}
                      onChange={() => handleToggleSelect(video.id)}
                    />
                    <div
                      className="video-thumb-wrapper"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalVideo(video);
                      }}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="thumb-img"
                      />
                      <div className="thumb-play-overlay">
                        <Play size={12} fill="#ffffff" color="#ffffff" />
                      </div>
                      <span className="thumb-duration font-mono">{video.duration}</span>
                    </div>
                    <div className="video-meta-stack">
                      <div className="title-row-flex">
                        <span
                          className="video-title font-sans clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalVideo(video);
                          }}
                        >
                          {video.title}
                        </span>
                        {video.favorite && (
                          <Star size={12} fill="#eab308" color="#eab308" />
                        )}
                      </div>
                      <span className="video-sub font-sans">{video.subtitle}</span>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div className="col-cat">
                    <span
                      className="cat-pill font-sans"
                      style={{
                        color: video.categoryColor,
                        borderColor: `${video.categoryColor}44`,
                        backgroundColor: `${video.categoryColor}15`,
                      }}
                    >
                      {video.category}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="col-dur font-mono">{video.duration}</div>

                  {/* File Size */}
                  <div className="col-size font-mono">{video.sizeMB} MB</div>

                  {/* Quality Select */}
                  <div className="col-qual font-mono">
                    <select
                      className="quality-select"
                      value={video.quality}
                      onChange={(e) => handleChangeQuality(video.id, e.target.value)}
                    >
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                    </select>
                  </div>

                  {/* 3-DOTS MENU DROPDOWN ACTION */}
                  <div className="col-act menu-col-relative">
                    <button
                      className={`vdl-btn-more-dots ${activeMenuId === video.id ? "active" : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === video.id ? null : video.id
                        );
                      }}
                      title="Tùy chọn thao tác"
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {/* POPUP DROPDOWN MENU */}
                    {activeMenuId === video.id && (
                      <div
                        className="vdl-action-dropdown-menu font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="menu-item green-hover"
                          onClick={() => handleSingleDownload(video)}
                        >
                          <Download size={14} className="menu-ic" />
                          <span>Tải xuống video</span>
                        </button>

                        <button
                          className="menu-item"
                          onClick={() => {
                            setDetailModalVideo(video);
                            setActiveMenuId(null);
                          }}
                        >
                          <Eye size={14} className="menu-ic" />
                          <span>Xem chi tiết video</span>
                        </button>

                        <button
                          className="menu-item"
                          onClick={() => handleCopyLink(video)}
                        >
                          <Copy size={14} className="menu-ic" />
                          <span>Sao chép đường dẫn</span>
                        </button>

                        <button
                          className="menu-item"
                          onClick={() => handleToggleFavorite(video.id)}
                        >
                          <Star
                            size={14}
                            className="menu-ic"
                            color={video.favorite ? "#eab308" : "currentColor"}
                          />
                          <span>
                            {video.favorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
                          </span>
                        </button>

                        <div className="menu-divider" />

                        <button
                          className="menu-item red-hover"
                          onClick={() => handleDeleteVideo(video.id, video.title)}
                        >
                          <Trash2 size={14} className="menu-ic" />
                          <span>Xóa khỏi danh sách</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TABLE FOOTER SUMMARY BAR */}
            <div className="vdl-table-footer-row font-sans">
              <div className="footer-left">
                <span className="selected-count-text">
                  Đã chọn <strong className="green-text">{selectedCount} video</strong>
                </span>
              </div>
              <div className="footer-center font-mono">
                Tổng dung lượng: {totalSizeMB} MB
              </div>
              <div className="footer-right">
                <button
                  className="vdl-btn-download-bottom"
                  onClick={handleBatchDownload}
                  disabled={selectedCount === 0}
                >
                  <Download size={15} />
                  <span>Tải xuống ({selectedCount})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSTRUCTIONS & SPECIFICATIONS */}
        <div className="vdl-right-col font-sans">
          {/* CARD 1: HƯỚNG DẪN TẢI FILE */}
          <div className="vdl-right-card">
            <h3 className="right-card-title">Hướng dẫn thao tác</h3>
            <div className="instructions-list">
              <div className="instruction-step">
                <div className="step-num font-bold">1</div>
                <div className="step-text-stack">
                  <span className="step-title font-bold">Menu 3 chấm (⋮)</span>
                  <span className="step-desc">
                    Nhấp biểu tượng 3 chấm ở cuối mỗi hàng để mở menu tùy chọn.
                  </span>
                </div>
              </div>

              <div className="instruction-step">
                <div className="step-num font-bold">2</div>
                <div className="step-text-stack">
                  <span className="step-title font-bold">Xem chi tiết</span>
                  <span className="step-desc">
                    Chọn "Xem chi tiết video" để xem trước và thông số kỹ thuật đầy đủ.
                  </span>
                </div>
              </div>

              <div className="instruction-step">
                <div className="step-num font-bold">3</div>
                <div className="step-text-stack">
                  <span className="step-title font-bold">Tải xuống</span>
                  <span className="step-desc">
                    Chọn "Tải xuống video" hoặc bấm nút dưới chân bảng để tải hàng loạt.
                  </span>
                </div>
              </div>

              <div className="instruction-step">
                <div className="step-num font-bold">4</div>
                <div className="step-text-stack">
                  <span className="step-title font-bold">Lưu file về máy</span>
                  <span className="step-desc">
                    Trình duyệt tự động tải tệp video về máy bạn ngay lập tức.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: ĐỊNH DẠNG TỆP */}
          <div className="vdl-right-card">
            <h3 className="right-card-title">Định dạng tệp hỗ trợ</h3>
            <div className="supported-devices-list">
              <div className="dev-spec-item">
                <FileVideo size={20} color="#22c55e" />
                <div className="dev-spec-info">
                  <span className="title font-bold">Chuẩn mã hóa MP4 (H.264)</span>
                  <span className="sub font-mono">Tương thích tất cả trình phát media</span>
                </div>
              </div>

              <div className="dev-spec-item">
                <Laptop size={20} color="#94a3b8" />
                <div className="dev-spec-info">
                  <span className="title font-bold">Tương thích thiết bị</span>
                  <span className="sub font-mono">Máy tính, Laptop, Điện thoại, Tablet</span>
                </div>
              </div>
            </div>
          </div>

          {/* INFO NOTE */}
          <div className="vdl-info-note-box font-sans">
            <Info size={18} className="info-icon" />
            <p className="info-text">
              Bạn có thể nhấp vào biểu tượng 3 chấm ở bất kỳ dòng video nào để mở danh sách thao tác nhanh.
            </p>
          </div>
        </div>
      </div>

      {/* VIDEO DETAIL MODAL (XEM CHI TIẾT VIDEO) */}
      {detailModalVideo && (
        <div
          className="vdl-modal-backdrop"
          onClick={() => setDetailModalVideo(null)}
        >
          <div
            className="vdl-detail-modal-box font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="vdl-modal-header">
              <div className="header-title-flex">
                <Film size={18} color="#22c55e" />
                <h3 className="modal-title font-sans">Chi tiết video bài giảng</h3>
              </div>
              <button
                className="vdl-modal-close-btn"
                onClick={() => setDetailModalVideo(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="vdl-modal-body">
              {/* VIDEO PLAYER PREVIEW CONTAINER */}
              <div className="vdl-modal-player-frame">
                <img
                  src={detailModalVideo.thumbnail}
                  alt={detailModalVideo.title}
                  className="modal-player-img"
                />
                <div className="player-big-play-btn">
                  <Play size={24} fill="#ffffff" color="#ffffff" />
                </div>
                <div className="player-badge-overlay font-mono">
                  {detailModalVideo.duration} • {detailModalVideo.quality}
                </div>
              </div>

              {/* VIDEO METADATA & SPECS */}
              <div className="vdl-modal-info-stack">
                <div className="title-category-row">
                  <h2 className="modal-video-title font-sans">
                    {detailModalVideo.title}
                  </h2>
                  <span
                    className="cat-pill font-sans"
                    style={{
                      color: detailModalVideo.categoryColor,
                      borderColor: `${detailModalVideo.categoryColor}44`,
                      backgroundColor: `${detailModalVideo.categoryColor}15`,
                    }}
                  >
                    {detailModalVideo.category}
                  </span>
                </div>
                <p className="modal-video-sub font-sans">
                  {detailModalVideo.subtitle}
                </p>

                {/* TECH SPECS GRID */}
                <div className="modal-specs-grid">
                  <div className="spec-card">
                    <div className="spec-icon">
                      <Clock size={16} color="#60a5fa" />
                    </div>
                    <div className="spec-stack">
                      <span className="lbl">Thời lượng</span>
                      <span className="val font-mono">{detailModalVideo.duration}</span>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon">
                      <HardDrive size={16} color="#22c55e" />
                    </div>
                    <div className="spec-stack">
                      <span className="lbl">Kích thước file</span>
                      <span className="val font-mono">{detailModalVideo.sizeMB} MB</span>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon">
                      <Film size={16} color="#a855f7" />
                    </div>
                    <div className="spec-stack">
                      <span className="lbl">Độ phân giải</span>
                      <span className="val font-mono">{detailModalVideo.resolution}</span>
                    </div>
                  </div>

                  <div className="spec-card">
                    <div className="spec-icon">
                      <Tag size={16} color="#eab308" />
                    </div>
                    <div className="spec-stack">
                      <span className="lbl">Mã hóa (Codec)</span>
                      <span className="val font-mono">{detailModalVideo.codec}</span>
                    </div>
                  </div>
                </div>

                {/* FILE NAME & DATE ROW */}
                <div className="modal-filename-row font-mono">
                  <span>File: <strong>{detailModalVideo.filename}</strong></span>
                  <span>Ngày đăng: <strong>{detailModalVideo.dateAdded}</strong></span>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="vdl-modal-footer">
              <button
                className="modal-btn-close font-sans"
                onClick={() => setDetailModalVideo(null)}
              >
                Đóng
              </button>

              <button
                className="modal-btn-download font-sans"
                onClick={() => {
                  handleSingleDownload(detailModalVideo);
                  setDetailModalVideo(null);
                }}
              >
                <Download size={16} />
                <span>Tải xuống ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
