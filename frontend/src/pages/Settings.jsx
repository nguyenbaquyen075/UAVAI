import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../api";

const ALL_CLASSES = ["person", "car", "motorcycle", "bus", "truck"];

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setForm);
  }, []);

  if (!form) return <p className="muted">Đang tải...</p>;

  function toggleClass(cls) {
    const enabled = form.enabled_classes.includes(cls)
      ? form.enabled_classes.filter((c) => c !== cls)
      : [...form.enabled_classes, cls];
    setForm({ ...form, enabled_classes: enabled });
  }

  async function save() {
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="panel">
      <h2>Cấu hình hệ thống</h2>
      <p className="muted">Nguồn video từng UAV quản lý ở trang "UAV".</p>

      <label>
        Ngưỡng cảnh báo đỏ (m)
        <input
          type="number"
          value={form.alert_threshold_m}
          onChange={(e) => setForm({ ...form, alert_threshold_m: parseFloat(e.target.value) })}
        />
      </label>

      <label>
        Ngưỡng cảnh báo vàng (m)
        <input
          type="number"
          value={form.warning_threshold_m}
          onChange={(e) => setForm({ ...form, warning_threshold_m: parseFloat(e.target.value) })}
        />
      </label>

      <label>
        Ngưỡng bỏ frame trễ (giây)
        <input
          type="number"
          step="0.05"
          value={form.max_acceptable_delay}
          onChange={(e) => setForm({ ...form, max_acceptable_delay: parseFloat(e.target.value) })}
        />
      </label>

      <fieldset>
        <legend>Class theo dõi</legend>
        {ALL_CLASSES.map((cls) => (
          <label key={cls} className="checkbox">
            <input
              type="checkbox"
              checked={form.enabled_classes.includes(cls)}
              onChange={() => toggleClass(cls)}
            />
            {cls}
          </label>
        ))}
      </fieldset>

      <button onClick={save}>Lưu cấu hình</button>
      {saved && <span className="saved-msg">Đã lưu</span>}
    </section>
  );
}
