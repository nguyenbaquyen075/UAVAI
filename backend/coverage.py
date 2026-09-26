"""Sinh đường bay quét phủ 1 vùng (đa giác) kiểu đan chéo: lượt 1 zic-zắc theo hướng 45°,
lượt 2 zic-zắc theo hướng 135° (vuông góc lượt 1) -> mỗi chỗ trong vùng được nhìn từ 2 hướng.

Tính trên mặt phẳng cục bộ (mét, gốc tại tâm vùng) — sai số không đáng kể với vùng vài km.
ponytail: vùng lõm có thể khiến đoạn nối giữa 2 khúc quét trên cùng 1 đường cắt ra ngoài vùng
một đoạn ngắn; cần né hẳn thì tách vùng lõm thành nhiều vùng lồi.
"""

import math

M_PER_DEG_LAT = 111_320.0


def _to_xy(points, origin):
    lat0, lon0 = origin
    mx = M_PER_DEG_LAT * math.cos(math.radians(lat0))
    return [((lon - lon0) * mx, (lat - lat0) * M_PER_DEG_LAT) for lat, lon in points]


def _to_latlon(xy, origin):
    lat0, lon0 = origin
    mx = M_PER_DEG_LAT * math.cos(math.radians(lat0))
    return [(lat0 + y / M_PER_DEG_LAT, lon0 + x / mx) for x, y in xy]


def _rotate(pts, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return [(x * c - y * s, x * s + y * c) for x, y in pts]


def polygon_area_m2(poly_xy):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(poly_xy, poly_xy[1:] + poly_xy[:1]))) / 2


def _sweep_lines(poly_xy, angle_deg, spacing):
    """Các đoạn quét song song hướng angle_deg bên trong đa giác, xếp zic-zắc (đảo chiều mỗi đường)."""
    rot = _rotate(poly_xy, -angle_deg)  # xoay để đường quét nằm ngang
    ys = [y for _, y in rot]
    lines = []
    # dàn đều các đường quét để 2 mép vùng đều cách đường gần nhất <= spacing/2 (không hở ở mép xa)
    height = max(ys) - min(ys)
    n = max(1, math.ceil(height / spacing))
    y = min(ys) + (height - (n - 1) * spacing) / 2
    flip = False
    edges = list(zip(rot, rot[1:] + rot[:1]))
    for _ in range(n):
        xs = sorted(
            x0 + (y - y0) * (x1 - x0) / (y1 - y0)
            for (x0, y0), (x1, y1) in edges
            if (y0 <= y < y1) or (y1 <= y < y0)
        )
        # bay vượt mép vùng nửa dải quét ở 2 đầu -> camera phủ kín cả phần mép giữa 2 đường quét
        ext = spacing / 2
        segs = [(xs[i] - ext, xs[i + 1] + ext) for i in range(0, len(xs) - 1, 2)]
        if flip:
            segs = [(b, a) for a, b in reversed(segs)]
        for a, b in segs:
            lines.append([(a, y), (b, y)])
        flip = not flip
        y += spacing
    return [_rotate(seg, angle_deg) for seg in lines]


def _chain(lines):
    return [p for seg in lines for p in seg]


def plan_crisscross(area_latlon, spacing_m, angles=(45.0, 135.0)):
    """-> (route [(lat, lon)], thống kê). Lượt sau chọn thứ tự/chiều bắt đầu gần điểm cuối lượt trước nhất."""
    if len(area_latlon) < 3:
        raise ValueError("Vùng quét cần ít nhất 3 điểm")
    if spacing_m <= 0:
        raise ValueError("Khoảng cách quét phải lớn hơn 0")
    origin = (sum(p[0] for p in area_latlon) / len(area_latlon), sum(p[1] for p in area_latlon) / len(area_latlon))
    poly = _to_xy(area_latlon, origin)
    if polygon_area_m2(poly) < (spacing_m / 2) ** 2:
        raise ValueError("Vùng quá nhỏ so với khoảng cách quét — giảm khoảng cách hoặc vẽ vùng lớn hơn")

    path, line_count = [], 0
    for angle in angles:
        lines = _sweep_lines(poly, angle, spacing_m)
        if not lines:
            continue
        line_count += len(lines)
        options = [lines, [s[::-1] for s in lines[::-1]]]  # quét xuôi hoặc ngược lại từ đầu kia
        if path:
            last = path[-1]
            options.sort(key=lambda ls: math.dist(last, ls[0][0]))
        path += _chain(options[0])

    if len(path) < 2:
        raise ValueError("Vùng quá nhỏ so với khoảng cách quét — giảm khoảng cách hoặc vẽ vùng lớn hơn")
    length = sum(math.dist(a, b) for a, b in zip(path, path[1:]))
    return _to_latlon(path, origin), {
        "lines": line_count,
        "length_m": round(length),
        "area_m2": round(polygon_area_m2(poly)),
    }
