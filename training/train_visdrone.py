"""Fine-tune YOLOv8 trên VisDrone2019-DET (ảnh góc nhìn drone) để bắt người/xe từ trên cao chính xác hơn.

Chạy (Colab GPU hoặc máy có GPU — xem training/README.md):
    python train_visdrone.py                      # yolov8n, 100 epoch, imgsz 640
    python train_visdrone.py --model yolov8s.pt   # chính xác hơn, chậm hơn ~2-3x khi chạy thật

Dữ liệu (~2 GB) do Ultralytics tự tải + đổi nhãn sang định dạng YOLO lần chạy đầu (VisDrone.yaml).
Xong sẽ copy best.pt về backend/models/visdrone_best.pt — backend tự dùng model này khi khởi động
(config.MODEL_PATH), 10 class VisDrone được quy về 5 loại mục tiêu cũ (config.CLASS_ALIASES) nên
giao diện, khung bắt mục tiêu, khoảng cách, cảnh báo giữ nguyên.

--smoke: chạy thử vài phút trên CPU với tập val nhỏ (datasets/VisDrone2019-DET-val.zip) chỉ để kiểm tra
quy trình train -> xuất model -> backend load được. Model smoke KHÔNG dùng để nhận diện thật.
"""

import argparse
import shutil
import zipfile
from pathlib import Path

from ultralytics import YOLO, settings

HERE = Path(__file__).parent
DATASETS = HERE / "datasets"
BACKEND_MODEL = HERE.parent / "backend" / "models" / "visdrone_best.pt"
VISDRONE_NAMES = ["pedestrian", "people", "bicycle", "car", "van", "truck", "tricycle", "awning-tricycle", "bus", "motor"]


def build_smoke_dataset():
    """Tập nhỏ từ VisDrone val: giải nén, đổi nhãn VisDrone -> YOLO (cùng cách VisDrone.yaml của Ultralytics)."""
    from PIL import Image

    root = DATASETS / "VisDrone-smoke"
    src = root / "VisDrone2019-DET-val"
    if not src.exists():
        with zipfile.ZipFile(DATASETS / "VisDrone2019-DET-val.zip") as z:
            z.extractall(root)
    images, labels = root / "images" / "val", root / "labels" / "val"
    images.mkdir(parents=True, exist_ok=True)
    labels.mkdir(parents=True, exist_ok=True)
    for ann in (src / "annotations").glob("*.txt"):
        img = src / "images" / ann.with_suffix(".jpg").name
        if not img.exists():
            continue
        w, h = Image.open(img).size
        rows = [r.split(",") for r in ann.read_text().strip().splitlines()]
        # cột: x,y,w,h,score,category,truncation,occlusion; score=0 là vùng bỏ qua, category 1..10 (0 = ignored)
        lines = [
            f"{int(r[5]) - 1} {(int(r[0]) + int(r[2]) / 2) / w:.6f} {(int(r[1]) + int(r[3]) / 2) / h:.6f} "
            f"{int(r[2]) / w:.6f} {int(r[3]) / h:.6f}"
            for r in rows
            if r[4] != "0" and 1 <= int(r[5]) <= 10
        ]
        (labels / ann.name).write_text("\n".join(lines) + "\n")
        shutil.copy(img, images / img.name)
    names = "\n".join(f"  {i}: {n}" for i, n in enumerate(VISDRONE_NAMES))
    yaml = root / "visdrone-smoke.yaml"
    yaml.write_text(f"path: {root}\ntrain: images/val\nval: images/val\nnames:\n{names}\n")
    return yaml


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="yolov8n.pt", help="điểm xuất phát (pretrained COCO)")
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--imgsz", type=int, default=640, help="to hơn (vd 960) bắt vật nhỏ tốt hơn nhưng chạy chậm hơn")
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--device", default=None, help="0 = GPU đầu tiên, cpu, mps; để trống = tự chọn")
    ap.add_argument("--smoke", action="store_true", help="chạy thử nhanh trên CPU (xem docstring)")
    args = ap.parse_args()

    settings.update({"datasets_dir": str(DATASETS)})
    if args.smoke:
        data, extra = str(build_smoke_dataset()), dict(epochs=1, imgsz=320, batch=8, fraction=0.2, device="cpu", workers=0)
    else:
        data, extra = "VisDrone.yaml", dict(epochs=args.epochs, imgsz=args.imgsz, batch=args.batch, device=args.device)

    model = YOLO(args.model)
    model.train(data=data, project=str(HERE / "runs"), name="smoke" if args.smoke else "visdrone", exist_ok=True, patience=20, **extra)

    best = Path(model.trainer.best)
    metrics = YOLO(best).val(
        data=data, imgsz=extra["imgsz"], device=extra["device"], verbose=False,
        project=str(HERE / "runs"), name="smoke-val" if args.smoke else "visdrone-val", exist_ok=True,
    )
    print(f"\nmAP50 = {metrics.box.map50:.3f}   mAP50-95 = {metrics.box.map:.3f}   ({best})")

    if args.smoke:
        print("Smoke test OK — không copy model smoke sang backend.")
        return
    BACKEND_MODEL.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(best, BACKEND_MODEL)
    print(f"Đã copy model -> {BACKEND_MODEL}. Khởi động lại backend để dùng.")


if __name__ == "__main__":
    main()
