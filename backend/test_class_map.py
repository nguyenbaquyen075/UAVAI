from config import model_class_map

COCO_NAMES = {0: "person", 1: "bicycle", 2: "car", 3: "motorcycle", 4: "airplane", 5: "bus", 6: "train", 7: "truck"}
VISDRONE_NAMES = {0: "pedestrian", 1: "people", 2: "bicycle", 3: "car", 4: "van", 5: "truck",
                  6: "tricycle", 7: "awning-tricycle", 8: "bus", 9: "motor"}


def test_coco_model_keeps_original_five_classes():
    # Model COCO cũ phải bắt đúng 5 loại như trước (không thêm xe đạp)
    assert model_class_map(COCO_NAMES) == {0: "person", 2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}


def test_visdrone_model_maps_into_same_five_classes():
    m = model_class_map(VISDRONE_NAMES)
    assert set(m.values()) == {"person", "car", "motorcycle", "bus", "truck"}
    assert m[0] == m[1] == "person" and m[4] == "car" and m[9] == "motorcycle"
    assert 2 not in m  # xe đạp bỏ qua
