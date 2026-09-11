from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import re
import urllib.parse
from lib.db import db
from models.standards import IndianStandard, StandardsQueryResponse
from lib.catalog_discovery import PRODUCTS, NO_RESULTS, CLARIFY, product_filter, ambiguous_search

router = APIRouter(tags=["standards"])


@router.get("/standards", response_model=StandardsQueryResponse)
async def list_standards(
    search: Optional[str] = Query(None, description="Search term for code, title, or keywords"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (current, under_revision, withdrawn)"),
    qco_only: Optional[bool] = Query(False, description="Filter only QCO mandatory standards"),
    product: Optional[str] = Query(None, description="Product discovery template"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    query = {}
    if product:
        if product not in PRODUCTS:
            raise HTTPException(status_code=400, detail="Unknown product template. Choose a product from the catalog.")
        query.update(product_filter(product))
    if category and category != "All":
        query["category"] = category
    if status and status != "All":
        query["status"] = status
    if qco_only:
        query["qco_mandatory"] = True

    if search and search.strip():
        term = re.escape(search.strip())
        # Normalise "IS10322" / "is 10322" style queries against stored codes
        loose_code = re.sub(r"^IS\s*(?=\d)", "IS ", search.strip(), flags=re.I)
        loose_code = re.escape(loose_code).replace(r"\ ", r"\s*")
        query["$or"] = [
            {"code": {"$regex": loose_code, "$options": "i"}},
            {"title": {"$regex": term, "$options": "i"}},
            {"keywords": {"$regex": term, "$options": "i"}},
            {"technical_committee": {"$regex": term, "$options": "i"}},
            {"ics_code": {"$regex": term, "$options": "i"}},
            {"scope": {"$regex": term, "$options": "i"}},
        ]

    clarification = bool(search and ambiguous_search(search) and not product)
    if clarification:
        query["code"] = {"$in": []}
    cursor = db.standards.find(query, {"_id": 0}).sort("code", 1).skip(skip).limit(limit)
    standards_list = await cursor.to_list(limit)
    total_count = await db.standards.count_documents(query)
    categories = sorted(await db.standards.distinct("category"))

    return StandardsQueryResponse(
        standards=[IndianStandard(**std) for std in standards_list],
        total_count=total_count,
        categories=categories,
        products=[{"id": key, "label": value[0]} for key, value in PRODUCTS.items()],
        outcome="needs_clarification" if clarification else ("matched" if total_count else "no_results"),
        message=CLARIFY if clarification else ("" if total_count else NO_RESULTS),
    )


@router.get("/standards/presets")
async def get_procurement_presets():
    """Returns curated SIH 26108 demonstration presets for 1-click evaluation."""
    return [
        {
            "id": "preset-street-lighting",
            "title": "Municipal LED Street Lighting & Roadway Luminaires",
            "sector": "Electrotechnical & Smart Infrastructure",
            "department": "Electrotechnical Department (ETD), BIS",
            "conformity_scheme": "Scheme-II · Compulsory Registration Scheme (CRS)",
            "document_name": "LED_Street_Lighting_Requirement.pdf",
            "sample_text": """Procurement and installation of energy-efficient outdoor LED Street Light Luminaires (70W and 120W) with cast aluminum pressure die-cast housing for urban arterial and collector road illumination.
Technical Requirements:
1. Luminaire efficacy shall not be less than 120 Lumens/Watt at rated CCT of 5000K (Cool Day White) with CRI > 70.
2. Ingress protection rating of optical and controlgear compartment shall be IP66.
3. Impact resistance rating minimum IK08.
4. Input operating voltage range: 140V to 280V AC, 50 Hz.
5. Total Harmonic Distortion (THD) shall be strictly less than 10%.
6. Power factor shall be greater than 0.95 at full load.
7. Surge protection device (SPD) minimum 10 kV/10 kA built-in or external.
8. Driver shall have short circuit, open circuit, and over-voltage protection up to 380V.
9. Luminaire shall comply with mandatory BIS Quality Control Orders (QCO) and carry ISI / BIS standard mark.""",
        },
        {
            "id": "preset-tmt-steel",
            "title": "High-Strength TMT Rebars for Highway Bridges & Flyovers",
            "sector": "Civil Engineering & Structural",
            "department": "Civil Engineering Department (CED), BIS",
            "conformity_scheme": "Scheme-I · ISI Mark (Steel Products QCO)",
            "document_name": "TMT_Reinforcement_Bars_Requirement.pdf",
            "sample_text": """Supply of Thermo-Mechanically Treated (TMT) High Strength Deformed Steel Reinforcement Bars Grade Fe 550D conforming to Indian Standards for construction of RCC Piers, Abutments, and Deck Slabs for 4-lane elevated bridge corridor.
Technical Requirements:
1. Nominal sizes required: 12mm, 16mm, 20mm, 25mm, and 32mm diameter.
2. Grade: Fe 550D with high ductility suitable for seismic zone IV and V design criteria.
3. 0.2% Proof Stress / Yield Stress minimum 550 N/mm²; Tensile strength minimum 600 N/mm² (TS/YS ratio >= 1.08).
4. Elongation percentage minimum 14.5% and Total Elongation at Maximum Force (AgT) >= 5%.
5. Carbon Equivalent (CE) shall not exceed 0.42% to guarantee superior on-site weldability.
6. Phosphorus (P) max 0.040% and Sulphur (S) max 0.040%; combined P+S max 0.075%.
7. Manufacturer must possess valid BIS Certification License with embossed ISI mark on every meter run of bar.""",
        },
        {
            "id": "preset-ppe-safety",
            "title": "Industrial Safety Helmets & Fall Arrest Harnesses for Mines",
            "sector": "Occupational Safety & Mining",
            "department": "Production & General Engineering Department (PGD), BIS",
            "conformity_scheme": "Scheme-I · ISI Mark (PPE Quality Control Order)",
            "document_name": "Industrial_Safety_PPE_Requirement.pdf",
            "sample_text": """Procurement of High-Density Polymer Industrial Safety Helmets with 6-point textile cradle suspension and Full Body Fall Arrest Harnesses for hazardous underground coal mines and open-cast ore processing plants.
Technical Requirements:
1. Safety Helmets: Non-metallic high-impact shell (HDPE/ABS), electrically non-conducting (Class E/G), adjustable nape strap 530mm-600mm.
2. Shock absorption test: Transmitted force shall not exceed 5.0 kN upon drop of 5.0 kg striker from 1.0 meter.
3. Penetration resistance: Conical striker 3.0 kg dropped from 1.0 meter shall not pierce shell to make electrical contact with headform.
4. Fall Arrest Harness: High-tenacity polyamide/polyester webbing (minimum 44mm width) with breaking strength >= 22 kN, dorsal D-ring, and dual-lanyard energy absorber.
5. All items must carry authentic BIS Standard Mark under mandatory PPE Quality Control Orders.""",
        },
        {
            "id": "preset-distribution-transformer",
            "title": "11kV / 433V 250kVA Oil-Immersed Distribution Transformers",
            "sector": "Power Distribution & Utilities",
            "department": "Electrotechnical Department (ETD), BIS",
            "conformity_scheme": "Scheme-I · ISI Mark (IS 1180 QCO)",
            "document_name": "Distribution_Transformer_Requirement.pdf",
            "sample_text": """Procurement of Outdoor Type 3-Phase 50 Hz 250 kVA, 11 kV / 433 V Copper Wound, Mineral Oil Immersed Distribution Transformers with corrugated fin cooling radiators for rural and semi-urban electrification.
Technical Requirements:
1. Continuous rated output: 250 kVA, Vector Group Dyn11, ONAN cooling.
2. Maximum allowable Total Losses at 50% load shall not exceed 900 Watts and at 100% load shall not exceed 2400 Watts (conforming to BEE Energy Efficiency Star 2 Level).
3. Primary winding insulation Class A, high-grade CRGO electrical steel lamination core.
4. Transformer insulating mineral oil shall strictly comply with breakdown voltage (BDV) >= 30 kV before filling.
5. Short-circuit withstand test certificate from NABL accredited laboratory (CPRI / ERDA) required.
6. Mandatory BIS Certification Mark (IS 1180 Part 1) and BEE Energy Star label.""",
        },
        {
            "id": "preset-hdpe-pipes",
            "title": "High Density Polyethylene (HDPE) PE-100 Water Supply Pipes",
            "sector": "Public Health & Water Utilities",
            "department": "Petroleum, Coal and Related Products Department (PCD), BIS",
            "conformity_scheme": "Scheme-I · ISI Mark (Polyethylene Pipes QCO)",
            "document_name": "HDPE_Water_Supply_Pipe_Requirement.pdf",
            "sample_text": """Supply and delivery of High Density Polyethylene (HDPE) Pipes Grade PE-100 PN-10 (Pressure rating 1.0 MPa) for potable rural piped drinking water distribution network under Jal Jeevan Mission.
Technical Requirements:
1. Raw Material: Virgin PE-100 grade resin with Carbon Black content 2.0% to 2.5% uniformly dispersed.
2. Nominal Outer Diameters: 63mm, 90mm, 110mm, 160mm, and 200mm in Standard Dimension Ratio SDR 11 / SDR 13.6.
3. Hydrostatic internal pressure test at 80°C for 165 hours without failure or circumferential ballooning.
4. Melt Flow Rate (MFR 190°C/5kg): 0.2 to 1.1 g/10 min.
5. Oxidation Induction Time (OIT) at 200°C shall exceed 20 minutes to ensure 50-year service life.
6. Must possess valid BIS License and embossed ISI certification marking with Batch No. and PE Grade.""",
        },
    ]


@router.get("/standards/{code:path}", response_model=IndianStandard)
async def get_standard_by_code(code: str):
    decoded_code = urllib.parse.unquote(code).strip()
    doc = await db.standards.find_one({"code": decoded_code}, {"_id": 0})
    if not doc:
        # Exact normalized identity only; never guess a part/version from a prefix.
        doc = await db.standards.find_one(
            {"code": {"$regex": "^" + re.escape(decoded_code).replace(r"\ ", r"\s*") + "$", "$options": "i"}},
            {"_id": 0},
        )
    if not doc:
        raise HTTPException(status_code=404, detail=f"Indian Standard '{decoded_code}' not found in curated knowledge base.")
    return IndianStandard(**doc)
