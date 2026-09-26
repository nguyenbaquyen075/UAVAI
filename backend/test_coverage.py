import math

from coverage import _to_xy, _sweep_lines, plan_crisscross

# Vùng vuông ~1 km x 1 km quanh Hà Nội
SQUARE = [(21.020, 105.845), (21.020, 105.8546), (21.029, 105.8546), (21.029, 105.845)]


def _dist_point_seg(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy or 1)))
    return math.dist(p, (ax + t * dx, ay + t * dy))


def _inside(p, poly):
    x, y = p
    inside = False
    for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            inside = not inside
    return inside


def test_every_point_seen_from_both_diagonals():
    spacing = 100
    origin = (sum(p[0] for p in SQUARE) / 4, sum(p[1] for p in SQUARE) / 4)
    poly = _to_xy(SQUARE, origin)
    passes = [_sweep_lines(poly, a, spacing) for a in (45, 135)]
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    for i in range(21):
        for j in range(21):
            p = (min(xs) + (max(xs) - min(xs)) * i / 20, min(ys) + (max(ys) - min(ys)) * j / 20)
            for lines in passes:
                nearest = min(_dist_point_seg(p, a, b) for a, b in lines)
                assert nearest <= spacing / 2 + 1, (p, nearest)  # nằm trong dải quét của ít nhất 1 đường


def test_route_stays_inside_and_zigzags():
    route, stats = plan_crisscross(SQUARE, 100)
    origin = (sum(p[0] for p in SQUARE) / 4, sum(p[1] for p in SQUARE) / 4)
    poly = _to_xy(SQUARE, origin)
    pts = _to_xy(route, origin)
    # điểm rẽ chỉ được vượt mép vùng tối đa nửa khoảng quét (bay vượt mép có chủ đích)
    for p in pts:
        if not _inside(p, poly):
            edge = min(_dist_point_seg(p, a, b) for a, b in zip(poly, poly[1:] + poly[:1]))
            assert edge <= 100 / 2 + 1, (p, edge)
    assert stats["lines"] >= 2 * 12  # ~14 đường mỗi hướng với vùng 1 km, cách 100 m
    assert 900_000 < stats["area_m2"] < 1_100_000
    # 2 lượt vuông góc: hướng đoạn quét đầu và đoạn quét đầu lượt 2 lệch nhau ~90°
    half = stats["lines"] // 2 * 2
    a = math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0])
    b = math.atan2(pts[half + 1][1] - pts[half][1], pts[half + 1][0] - pts[half][0])
    diff = abs((math.degrees(a - b) + 180) % 360 - 180)
    assert 85 < diff < 95 or 85 < 180 - diff < 95, diff


def test_rejects_bad_input():
    for area, spacing in [(SQUARE[:2], 100), (SQUARE, 0), ([(21.02, 105.845), (21.02, 105.8451), (21.0201, 105.845)], 500)]:
        try:
            plan_crisscross(area, spacing)
            assert False, (area, spacing)
        except ValueError:
            pass


if __name__ == "__main__":
    n = 0
    for k, f in list(globals().items()):
        if k.startswith("test_"):
            f(); n += 1
    print(n, "tests passed")
