import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "24px", color: "#f87171", background: "#131b2e", borderRadius: "8px", border: "1px solid #7f1d1d", margin: "20px" }}>
          <h2 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "#f8fafc" }}>⚠️ Đã xảy ra lỗi khi tải giao diện</h2>
          <pre style={{ background: "#0b0f19", padding: "12px", borderRadius: "6px", color: "#f87171", fontSize: "12px", overflowX: "auto" }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: "#22c55e", color: "#0f172a", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginTop: "12px" }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
