"""
Donatable item allowlist — loaded from donation_items.csv.

This module is responsible for deciding whether a YOLO-detected object
is an acceptable donation item. The CSV lists all NGO-approved categories
and specific item names.

Usage
-----
    from app.ai.donatable_items import is_donatable

    if is_donatable(detected_name, detected_category):
        # include in results
"""
import csv
import logging
import os
from typing import FrozenSet, Tuple

logger = logging.getLogger(__name__)

# ── Path to the allowlist CSV (co-located with this module) ───────────────────
_CSV_PATH = os.path.join(os.path.dirname(__file__), "donation_items.csv")


def _load_allowlist(csv_path: str) -> Tuple[FrozenSet[str], FrozenSet[str]]:
    """
    Parse donation_items.csv and return two frozen sets:
      - item_names:  lowercase individual item names (e.g. "shirt", "laptop")
      - categories:  lowercase category names  (e.g. "clothing", "electronics")

    Both sets are used for broad + specific matching so that:
      - An exact name like "shirt" is accepted even if YOLO calls it "Shirt".
      - A YOLO class that maps to a donatable category (e.g. "clothing") is
        accepted even if the specific word isn't in the CSV.
    """
    item_names: set[str] = set()
    categories: set[str] = set()

    if not os.path.exists(csv_path):
        logger.error(
            "donation_items.csv not found at '%s'. "
            "All detections will be treated as donatable — fix this before production.",
            csv_path,
        )
        return frozenset(), frozenset()

    try:
        with open(csv_path, newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                category = row.get("Category", "").strip().lower()
                item     = row.get("Item", "").strip().lower()
                if category:
                    categories.add(category)
                if item:
                    item_names.add(item)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to parse donation_items.csv: %s", exc)
        return frozenset(), frozenset()

    logger.info(
        "Donatable items allowlist loaded: %d categories, %d items",
        len(categories),
        len(item_names),
    )
    return frozenset(item_names), frozenset(categories)


# ── Module-level singletons — loaded once at import time ─────────────────────
_DONATABLE_NAMES, _DONATABLE_CATEGORIES = _load_allowlist(_CSV_PATH)

# ── Well-known YOLO classes that are NEVER donatable ─────────────────────────
# Pretrained COCO models detect people, animals, and vehicles.
# We explicitly block these regardless of what else is in the CSV.
_BLOCKED_YOLO_CLASSES: FrozenSet[str] = frozenset({
    # People
    "person", "people", "man", "woman", "child", "human",
    # Vehicles (not in NGO donation scope)
    "car", "truck", "bus", "motorcycle", "bicycle", "train",
    "airplane", "boat", "vehicle",
    # Animals (unless the CSV includes Animal Welfare feeding items)
    "cat", "dog", "bird", "horse", "sheep", "cow", "elephant",
    "bear", "zebra", "giraffe",
    # Backgrounds / environment
    "sky", "road", "sidewalk", "building", "wall", "tree",
})


def is_donatable(detected_name: str, detected_category: str) -> bool:
    """
    Return True if the detected object is an acceptable donation item.

    Matching strategy (checked in order):
      1. Hard-block: if the YOLO class name is in the explicit block list,
         always return False regardless of category.
      2. Category match: if the mapped ItemCategory value appears in the
         CSV categories (e.g. "clothing", "electronics"), return True.
      3. Name match: if any word in the detected name matches a CSV item
         name, return True.
      4. Default: return False — unknown objects are excluded.

    Args:
        detected_name:     The human-readable YOLO class label (e.g. "person", "shirt").
        detected_category: The ItemCategory enum value string (e.g. "clothing", "other").

    Returns:
        True if the item should be shown to the donor; False to suppress it.
    """
    name_lower     = detected_name.strip().lower()
    category_lower = detected_category.strip().lower()

    # ── Step 1: Hard block ─────────────────────────────────────────────────────
    if name_lower in _BLOCKED_YOLO_CLASSES:
        logger.debug("Blocked non-donatable detection: '%s'", detected_name)
        return False

    # ── Step 2: Category allowlist ─────────────────────────────────────────────
    # The CSV uses category names like "Books & Education" — normalise these
    # to match the system ItemCategory values (e.g. "books", "clothing").
    # We also check partial matches so "Books & Education" → "books" still hits.
    if category_lower != "other":
        for csv_cat in _DONATABLE_CATEGORIES:
            if category_lower in csv_cat or csv_cat in category_lower:
                return True

    # ── Step 3: Name allowlist ─────────────────────────────────────────────────
    # Check each word in the detected name against the CSV item list.
    # This handles multi-word YOLO labels like "teddy bear" or "cell phone".
    name_tokens = name_lower.split()
    for token in name_tokens:
        if token in _DONATABLE_NAMES:
            return True
    # Also check the full phrase
    if name_lower in _DONATABLE_NAMES:
        return True

    # ── Step 4: Default — exclude ──────────────────────────────────────────────
    logger.debug(
        "Excluded unknown detection: name='%s', category='%s'",
        detected_name,
        detected_category,
    )
    return False
