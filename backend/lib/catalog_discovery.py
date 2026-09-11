"""Catalog browsing and conservative guardrails around the existing demo engine.

These are product search templates, not standards data or a replacement RAG engine.
Every displayed standard must come from the existing Mongo collection.
"""
import re

PRODUCTS = {
    "solar-panels": ("Solar panels", r"\b(?:solar (?:panel|module)|photovoltaic)"),
    "lamps": ("Lamps", r"\b(?:lamps?|luminaires?)\b"),
    "led-lighting": ("LED lighting", r"\b(?:LED|street lighting|road lighting)\b"),
    "electrical-appliances": ("Electrical appliances", r"\b(?:household|electrical) appliances?\b"),
    "cables-wires": ("Cables and wires", r"\b(?:cables?|cords?|electrical wiring)\b"),
    "cement": ("Cement", r"\bcement\b"),
    "steel": ("Steel products", r"\bsteel\b"),
    "construction": ("Construction materials", r"\b(?:cement|concrete|structural steel|reinforcement)\b"),
    "ppe": ("Personal protective equipment", r"\b(?:protective equipment|helmets?|harness|fall (?:arrest|protection)|safety footwear)\b"),
    "water": ("Water and pipes", r"\b(?:drinking water|water suppl|pipes?|pipe work)"),
    "transformers": ("Transformers", r"\btransformers?\b"),
    "fire-safety": ("Fire extinguishers", r"\bfire extinguishers?\b"),
}

NO_RESULTS = "No relevant Indian Standard was found in the available IS Catalog for this query."
CLARIFY = "Please specify the product, material and intended use so we can check the available catalog without guessing."


def product_filter(product: str):
    # Product identity comes from titles, not incidental mentions in broad scopes.
    return {"title": {"$regex": PRODUCTS[product][1], "$options": "i"}}


def ambiguous_search(text: str) -> bool:
    return text.strip().lower() in {
        "safety", "electrical", "equipment", "material", "materials", "quality",
        "standard", "standards", "lighting", "protection", "construction",
        "electrical equipment", "safety equipment", "utility", "utilities",
    }


def demo_profile(text: str):
    """Fail closed: broad terms such as 'safety', 'driver' or 'light' aren't products."""
    patterns = {
        "street lighting": r"\b(?:street\s*lights?|street lighting|roadway luminaires?|road lighting|LED (?:lighting|lamps?|luminaires?))\b",
        "tmt": r"\b(?:tmt|rebars?|reinforcement (?:steel|bars)|steel reinforcement)\b",
        "helmet": r"\b(?:helmets?|harness(?:es)?|fall arrest|personal protective equipment|ppe)\b",
        "hdpe pipe": r"\b(?:hdpe|polyethylene)\b.{0,70}\bpipes?\b",
        "transformer": r"\b(?:distribution|power) transformers?\b",
    }
    matches = [key for key, pattern in patterns.items() if re.search(pattern, text, re.I | re.S)]
    return matches[0] if len(matches) == 1 else None


async def assess_requirement(db, text: str):
    profile = demo_profile(text)
    if profile:
        return "matched", "", profile, []
    # Exact catalog-number requests are resolved only against existing records.
    numbers = re.findall(r"\bIS\s*(?:/IEC\s*)?(\d+)\b", text, re.I)
    filters = [{"code": {"$regex": rf"^IS(?:/IEC)?\s*{re.escape(n)}(?=\D|$)", "$options": "i"}} for n in numbers]
    if not filters:
        filters = [product_filter(key) for key, (_, pattern) in PRODUCTS.items() if re.search(pattern, text, re.I)]
    if filters:
        docs = await db.standards.find({"$or": filters}, {"_id": 0, "code": 1, "title": 1}).limit(30).to_list(30)
        if docs:
            return "catalog_only", "Catalog entries are available for review. This demo cannot establish their applicability to this requirement; open their scope or refine the product and intended use.", None, docs
        return "no_results", NO_RESULTS, None, []
    # No narrow product identified: ask for details only for genuinely broad input.
    words = re.findall(r"[a-z]+", text.lower())
    generic = {"i", "we", "need", "want", "to", "for", "the", "a", "an", "and", "of", "our", "is", "please", "find", "applicable", "indian", "standards", "standard", "procurement", "procure", "supply", "purchase", "buy", "safety", "electrical", "equipment", "quality", "materials", "material", "construction", "lighting", "products", "product", "use"}
    if words and all(word in generic for word in words):
        return "needs_clarification", CLARIFY, None, []
    return "no_results", NO_RESULTS, None, []