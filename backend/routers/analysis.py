from fastapi import APIRouter, HTTPException
from typing import List, Optional
import uuid
import re
from datetime import datetime, timezone
from lib.db import db
from lib.dates import today_iso
from lib.catalog_discovery import assess_requirement, NO_RESULTS
from models.analysis import (
    ProcurementAnalysis,
    ProcurementAnalysisCreate,
    AnalyticsStats,
    ExtractedIntelligence,
    TechnicalParameter,
    RecommendedStandard,
    EvidenceClause,
    GapAnalysis,
    MissingParameter,
    AmbiguityFlag,
    QCOComplianceAlert,
)

router = APIRouter(tags=["analysis"])


def determine_sector_and_heuristics(text: str, title: Optional[str] = None):
    t = (text + " " + (title or "")).lower()

    if any(k in t for k in ["light", "luminaire", "led", "lamp", "cct", "thd", "driver", "cct", "cri", "illumination"]):
        return {
            "sector": "Electrotechnical & Smart City",
            "product": "Outdoor LED Roadway Luminaires & Street Lighting Systems",
            "purpose": "Municipal arterial and collector roadway illumination, energy reduction, and automated switching",
            "env": "Outdoor harsh environmental conditions (IP66, -10°C to +50°C, ambient humidity 10-95%)",
            "keywords": ["LED Street Lighting", "Roadway Luminaire", "Optical Ingress IP66", "Total Harmonic Distortion", "Surge Protection 10kV", "CCT 5000K", "BIS QCO 2021"],
            "parameters": [
                TechnicalParameter(parameter="Luminaire Efficacy", value=">= 120 Lumens/Watt", specified_in_spec=True, benchmark_is_norm="Conforms to IS 16107 Part 2/Sec 1", status="specified"),
                TechnicalParameter(parameter="Ingress Protection Rating", value="IP66 Optical & Driver Compartment", specified_in_spec=True, benchmark_is_norm="IS 10322 Part 5/Sec 3 Clause 6.2", status="specified"),
                TechnicalParameter(parameter="Correlated Color Temp (CCT)", value="5000K (Cool Day White)", specified_in_spec=True, benchmark_is_norm="IS 16103 Clause 4.1", status="specified"),
                TechnicalParameter(parameter="Total Harmonic Distortion (THD)", value="< 10%", specified_in_spec=True, benchmark_is_norm="IS 15885 Part 2/Sec 13", status="specified"),
                TechnicalParameter(parameter="Surge Protection Level", value="10 kV / 10 kA", specified_in_spec=True, benchmark_is_norm="IS 16107 / IEEE C62.41", status="specified"),
                TechnicalParameter(parameter="Operating Voltage Range", value="140V to 280V AC (withstand 380V)", specified_in_spec=True, benchmark_is_norm="IS 15885 Part 2/Sec 13", status="specified"),
                TechnicalParameter(parameter="Impact Resistance Rating", value="IK08 Toughened Glass", specified_in_spec=True, benchmark_is_norm="IS 10322 (Part 1)", status="specified"),
                TechnicalParameter(parameter="Driver Efficiency", value="> 88% at full load", specified_in_spec=False, benchmark_is_norm="IS 15885 (Part 2/Sec 13)", status="missing_recommended"),
            ],
            "matched_standards": [
                {
                    "code": "IS 10322 (Part 5/Sec 3): 2012",
                    "title": "Luminaires - Particular Requirements - Luminaires for Road and Street Lighting",
                    "relevance": 98,
                    "category": "Electrotechnical",
                    "status": "current",
                    "qco": True,
                    "why": "Directly governs mechanical construction, IP66 ingress protection, thermal management, and safety clearances for road lighting luminaires.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 6.2", clause_name="Degree of Ingress Protection", matched_requirement="IP66 Optical and Driver Compartment", evidence_text="Luminaires for road lighting shall have a minimum degree of protection against ingress of dust, solid objects and moisture not less than IP65/IP66 as per IS/IEC 60529."),
                        EvidenceClause(clause_no="Clause 9.1", clause_name="Thermal Endurance & Overheating", matched_requirement="Continuous duty under ambient 45°C", evidence_text="The luminaire shall be subjected to thermal endurance testing at rated voltage and elevated temperature +10°C above maximum rated ambient."),
                        EvidenceClause(clause_no="Clause 12.3", clause_name="Impact Resistance (IK Rating)", matched_requirement="Minimum IK08 Toughened Glass diffuser", evidence_text="Optical covers and glass panes must withstand impact energy of 5.0 Joules without fragmentation or seal compromise."),
                    ],
                    "related": ["IS 16107 (Part 2/Sec 1): 2012", "IS 15885 (Part 2/Sec 13): 2012", "IS/IEC 60529: 2001"],
                },
                {
                    "code": "IS 16107 (Part 2/Sec 1): 2012",
                    "title": "Single-Capped LED Lamps and Luminaires - Performance Requirements",
                    "relevance": 94,
                    "category": "Electrotechnical",
                    "status": "current",
                    "qco": True,
                    "why": "Specifies photometric performance benchmarks including luminous efficacy (>120 lm/W), color rendering index (CRI > 70), and lumen maintenance (L70 at 50,000 hours).",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 7.2", clause_name="Initial Luminous Efficacy", matched_requirement="120 Lumens/Watt minimum", evidence_text="The measured luminous efficacy of the luminaire shall not be less than 90 percent of the rated luminous efficacy declared by manufacturer."),
                        EvidenceClause(clause_no="Clause 8.4", clause_name="Lumen Maintenance & Accelerated Life", matched_requirement="50,000 burning hours lifespan", evidence_text="Lumen depreciation shall not drop below 70 percent of initial flux (L70B50) after operating for 6,000 hours continuous life test."),
                    ],
                    "related": ["IS 16103 (Part 1): 2012", "IS 16108: 2012"],
                },
                {
                    "code": "IS 15885 (Part 2/Sec 13): 2012",
                    "title": "Lamp Controlgear - Particular Requirements for DC or AC Supplied Electronic Controlgear for LED Modules",
                    "relevance": 91,
                    "category": "Electrotechnical",
                    "status": "current",
                    "qco": True,
                    "why": "Mandates electrical safety, overvoltage withstand (up to 380V), galvanic isolation, and short-circuit protection for LED drivers.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 14.1", clause_name="Abnormal Operating Conditions", matched_requirement="Overvoltage withstand & short-circuit protection", evidence_text="The controlgear shall not impair safety when operated at 120% rated supply voltage or when output terminals are short-circuited."),
                        EvidenceClause(clause_no="Clause 17.2", clause_name="Dielectric Strength & Insulation", matched_requirement="High voltage breakdown safety", evidence_text="Insulation between live parts and protective earth shall withstand test voltage of 2.5 kV AC RMS for 1 minute without breakdown."),
                    ],
                    "related": ["IS 16104: 2012", "IS 302 (Part 1): 2008"],
                },
                {
                    "code": "IS/IEC 60529: 2001",
                    "title": "Degrees of Protection Provided by Enclosures (IP Code)",
                    "relevance": 86,
                    "category": "Electrotechnical",
                    "status": "current",
                    "qco": False,
                    "why": "Defines test procedures for dust-tight (IP6X) and continuous powerful water jet resistance (IPX6) verification.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 13.4", clause_name="Dust Test for First Characteristic Numeral 6", matched_requirement="IP66 dust tightness", evidence_text="Enclosure is placed inside test chamber with talcum powder in suspension under depression of 2 kPa for 8 hours without dust ingress."),
                    ],
                    "related": ["IS 10322 (Part 1): 2014"],
                },
            ],
            "gaps": {
                "readiness_score": 88,
                "compliance_rating": "High Readiness (Minor Clause Additions Recommended)",
                "missing": [
                    MissingParameter(
                        parameter="Driver Operating Thermal Cutoff (Tc Point)",
                        severity="High",
                        impact="Unspecified max case temperature (Tc) risks premature driver semiconductor failure under high ambient Indian summer conditions.",
                        recommended_clause="IS 15885 (Part 2/Sec 13) Clause 11.2",
                        suggested_text="The LED driver case temperature (Tc) shall not exceed 75°C when tested inside the enclosed luminaire at an ambient operating temperature of 45°C."
                    ),
                    MissingParameter(
                        parameter="Corrosion Resistance & Salt Spray Duration",
                        severity="Medium",
                        impact="For outdoor coastal or urban polluted environments, lack of salt spray test specification leads to rapid powder coating peeling.",
                        recommended_clause="IS 10322 (Part 5/Sec 3) Annex D / ASTM B117",
                        suggested_text="The die-cast aluminum housing shall undergo minimum 500 hours of neutral salt spray testing (NSS) without blister formation or paint adhesion loss."
                    ),
                ],
                "ambiguities": [
                    AmbiguityFlag(
                        term="High quality pressure die cast housing",
                        issue="Subjective adjective 'high quality' is non-verifiable and legally challengeable in public procurement audits.",
                        fix_suggestion="Replace with 'Pressure die-cast Aluminum alloy Grade LM6 conforming to IS 617 with minimum wall thickness of 2.2mm'."
                    ),
                ],
                "qco_alerts": [
                    QCOComplianceAlert(
                        order_name="Electronics and Information Technology Goods (Requirement for Compulsory Registration) Order, 2021",
                        requirement="All LED Luminaires and Controlgear must be registered under BIS CRS (Compulsory Registration Scheme).",
                        legal_mandate="Mandatory under Ministry of Electronics and Information Technology (MeitY) Notification. Bidders without valid BIS Registration R-Number must be disqualified at technical bid stage."
                    )
                ],
                "spec_amendment": """// ADD TO TECHNICAL SPECIFICATION CLAUSE 4.8:
4.8.1 COMPLIANCE WITH INDIAN STANDARDS:
The complete luminaire assembly, including LED light source, optical diffuser, and electronic controlgear, shall strictly conform to IS 10322 (Part 5/Sec 3): 2012, IS 16107 (Part 2/Sec 1): 2012, and IS 15885 (Part 2/Sec 13): 2012 with up-to-date amendments.
4.8.2 MANDATORY BIS CERTIFICATION:
Bidders shall submit a valid BIS CRS Registration Certificate and Type Test Report from a NABL/BIS-accredited testing laboratory with test results not older than 18 months from bid closing date.
4.8.3 ENVIRONMENTAL DURABILITY:
Housing must be LM6 alloy powder-coated with minimum 500-hour Salt Spray withstand (ASTM B117/IS 10322). Optical chamber and driver enclosure shall strictly certify IP66 ingress protection per IS/IEC 60529."""
            }
        }

    elif any(k in t for k in ["steel", "tmt", "rebar", "reinforcement", "bridge", "pier", "concrete", "fe 500", "fe 550", "yield stress"]):
        return {
            "sector": "Civil Engineering & Structural",
            "product": "High Strength Deformed TMT Reinforcement Steel Bars (Fe 550D)",
            "purpose": "Heavy infrastructure RCC structural framing, highway bridges, seismic-resistant piers and deck slabs",
            "env": "Seismic Zone IV/V high ductile requirement, atmospheric exposure Class Extreme/Severe",
            "keywords": ["TMT Rebars", "IS 1786 Fe 550D", "Yield Stress 550 MPa", "Ductility AgT >= 5%", "Carbon Equivalent 0.42%", "BIS ISI Marking"],
            "parameters": [
                TechnicalParameter(parameter="Steel Grade & Designation", value="Fe 550D (High Ductility)", specified_in_spec=True, benchmark_is_norm="IS 1786:2008 Clause 4.1", status="specified"),
                TechnicalParameter(parameter="0.2% Proof Stress (Yield Strength)", value="Minimum 550 N/mm²", specified_in_spec=True, benchmark_is_norm="IS 1786:2008 Table 3", status="specified"),
                TechnicalParameter(parameter="Tensile / Yield Ratio (TS/YS)", value=">= 1.08 minimum", specified_in_spec=True, benchmark_is_norm="IS 1786:2008 Clause 8.1", status="specified"),
                TechnicalParameter(parameter="Total Elongation at Max Force (AgT)", value=">= 5.0%", specified_in_spec=True, benchmark_is_norm="IS 1786:2008 Table 3", status="specified"),
                TechnicalParameter(parameter="Maximum Carbon Equivalent (CE)", value="0.42% max", specified_in_spec=True, benchmark_is_norm="IS 1786:2008 Clause 4.2", status="specified"),
                TechnicalParameter(parameter="Deformation & Rib Geometry (Area Ar)", value="0.045 to 0.075 d", specified_in_spec=False, benchmark_is_norm="IS 1786:2008 Clause 5.3", status="missing_recommended"),
            ],
            "matched_standards": [
                {
                    "code": "IS 1786: 2008",
                    "title": "High Strength Deformed Steel Bars and Wires for Concrete Reinforcement - Specification",
                    "relevance": 99,
                    "category": "Civil Engineering",
                    "status": "current",
                    "qco": True,
                    "why": "The premier mandatory Indian Standard for Thermo-Mechanically Treated (TMT) steel reinforcement bars specifying chemical limits, tensile tolerances, bend/rebend tests, and ISI marking.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 4.2", clause_name="Chemical Composition & Carbon Equivalent", matched_requirement="Carbon Equivalent <= 0.42%", evidence_text="For Fe 550D, Carbon (C) max 0.25%, Sulphur (S) max 0.040%, Phosphorus (P) max 0.040%, and combined S+P max 0.075%. Carbon Equivalent shall not exceed 0.42% calculated as C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15."),
                        EvidenceClause(clause_no="Clause 8.1", clause_name="Mechanical Properties & Ductility", matched_requirement="Yield Stress 550 MPa, Elongation 14.5%", evidence_text="Fe 550D requires 0.2% proof stress min 550.0 N/mm², Tensile strength min 600.0 N/mm² (ratio min 1.08), and elongation min 14.5%."),
                        EvidenceClause(clause_no="Clause 9.3", clause_name="Mandatory ISI Marking on Bars", matched_requirement="Embossed ISI mark on every meter run", evidence_text="Every bar shall carry manufacturer identity, brand, nominal size, and standard mark embossed at intervals not greater than 1.5 meters."),
                    ],
                    "related": ["IS 456: 2000", "IS 2062: 2011", "IS 1608 (Part 1): 2018"],
                },
                {
                    "code": "IS 456: 2000",
                    "title": "Plain and Reinforced Concrete - Code of Practice",
                    "relevance": 92,
                    "category": "Civil Engineering",
                    "status": "current",
                    "qco": False,
                    "why": "Governs design criteria for reinforcement detailing, development length, clear cover for bridge environments, and maximum permissible bar spacing.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 26.2", clause_name="Development Length of Bars", matched_requirement="Anchor length in structural piers", evidence_text="Development length Ld shall be computed based on design bond stress values given in Table 21 for deformed bars."),
                    ],
                    "related": ["IS 1786: 2008", "IS 13920: 2016"],
                },
                {
                    "code": "IS 13920: 2016",
                    "title": "Ductile Design and Detailing of Reinforced Concrete Structures Subjected to Seismic Forces",
                    "relevance": 88,
                    "category": "Civil Engineering",
                    "status": "current",
                    "qco": False,
                    "why": "Specifies strict ductility ratios (TS/YS >= 1.08 and uniform elongation AgT >= 5%) for seismic-resistant bridge and multi-story structures.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 5.3", clause_name="Material Requirements for Steel Reinforcement", matched_requirement="Seismic zone IV/V high ductility", evidence_text="Only high-ductility steel conforming to IS 1786 Grade Fe 500D or Fe 550D shall be used in structures built in Seismic Zones III, IV, and V."),
                    ],
                    "related": ["IS 1893 (Part 1): 2016"],
                },
            ],
            "gaps": {
                "readiness_score": 92,
                "compliance_rating": "High Readiness (Minor Sampling Guidance Needed)",
                "missing": [
                    MissingParameter(
                        parameter="Mandatory Rebend Test After Ageing",
                        severity="High",
                        impact="Without explicit rebend test verification (135° bend followed by boiling water ageing and 157.5° reverse bend), brittle fracture risk increases under field bending.",
                        recommended_clause="IS 1786:2008 Clause 8.3 & Table 4",
                        suggested_text="Rebend test specimen shall be bent through 135°, aged in boiling water (100°C) for 30 minutes, cooled, and bent back through 157.5° without any visible rupture or cracking."
                    ),
                    MissingParameter(
                        parameter="Transverse Rib Spacing and Nominal Mass Tolerance",
                        severity="Medium",
                        impact="Unchecked nominal mass per meter allows undersized bars that fail structural cross-sectional load calculations.",
                        recommended_clause="IS 1786:2008 Clause 7.2 (Table 1)",
                        suggested_text="Nominal mass per meter run shall be verified for every batch and must fall strictly within +/- 3% tolerance for bars > 16mm diameter."
                    ),
                ],
                "ambiguities": [
                    AmbiguityFlag(
                        term="Primary producer steel",
                        issue="'Primary producer' is a commercial trade term with varying definitions across state departments.",
                        fix_suggestion="Specify: 'Steel manufactured from virgin iron ore / BF-BOF or Corex-EAF integrated route with secondary vacuum degassing (LF-VD)'."
                    ),
                ],
                "qco_alerts": [
                    QCOComplianceAlert(
                        order_name="Steel and Steel Products (Quality Control) Order, 2020",
                        requirement="Manufacture, sale, and public procurement of steel rebars without BIS Standard Mark (ISI mark) is prohibited by central law.",
                        legal_mandate="Ministry of Steel QCO Gazette S.O. 1673(E). Non-BIS certified steel cannot be accepted on government infrastructure works."
                    )
                ],
                "spec_amendment": """// ADD TO STRUCTURAL STEEL SPECIFICATION SECTION 3.4:
3.4.1 INDIAN STANDARD COMPLIANCE:
All reinforcement steel shall strictly conform to IS 1786: 2008 Grade Fe 550D (High Ductility). Secondary or re-rolled steel from scrap without BIS license is strictly prohibited.
3.4.2 MANDATORY MECHANICAL CRITERIA:
Yield Strength (0.2% proof stress) >= 550 N/mm², Ultimate Tensile Strength >= 600 N/mm², TS/YS ratio >= 1.08, Elongation >= 14.5%, Total Uniform Elongation (AgT) >= 5.0%.
3.4.3 QUALITY ASSURANCE:
Manufacturer Test Certificates (MTC) showing lot-wise chemical analysis and Carbon Equivalent (<= 0.42%) along with embossed ISI mark shall be submitted for every consignment prior to unloading."""
            }
        }

    elif any(k in t for k in ["helmet", "harness", "ppe", "safety", "fall arrest", "boots", "protective", "mines"]):
        return {
            "sector": "Occupational Safety & Mining",
            "product": "Personal Protective Equipment (Industrial Helmets & Fall Arrest Harness)",
            "purpose": "Head protection against falling objects and full-body fall prevention for mining/industrial personnel",
            "env": "Heavy industrial plants, underground mines, elevated scaffolding operations",
            "keywords": ["Industrial Safety Helmet", "Full Body Harness", "IS 2925", "IS 3521", "Impact Absorption 5kN", "Electrical Insulation Class E", "BIS QCO PPE"],
            "parameters": [
                TechnicalParameter(parameter="Helmet Shell Material", value="High-Density Polymer (ABS / HDPE)", specified_in_spec=True, benchmark_is_norm="IS 2925:1984 Clause 5.1", status="specified"),
                TechnicalParameter(parameter="Impact Shock Absorption", value="Transmitted force <= 5.0 kN", specified_in_spec=True, benchmark_is_norm="IS 2925:1984 Clause 7.1", status="specified"),
                TechnicalParameter(parameter="Penetration Resistance", value="Conical striker 3kg drop 1.0m", specified_in_spec=True, benchmark_is_norm="IS 2925:1984 Clause 7.2", status="specified"),
                TechnicalParameter(parameter="Harness Webbing Breaking Strength", value="Minimum 22 kN", specified_in_spec=True, benchmark_is_norm="IS 3521 (Part 1): 2021", status="specified"),
                TechnicalParameter(parameter="Flame Retardancy Duration", value="Self-extinguishing within 5 seconds", specified_in_spec=False, benchmark_is_norm="IS 2925:1984 Clause 7.4", status="missing_recommended"),
            ],
            "matched_standards": [
                {
                    "code": "IS 2925: 1984",
                    "title": "Specification for Industrial Safety Helmets",
                    "relevance": 97,
                    "category": "Safety & Fire",
                    "status": "current",
                    "qco": True,
                    "why": "Mandatory standard for industrial safety helmets defining shell strength, shock absorption (<= 5.0 kN), penetration resistance, electrical insulation, and chin strap retention.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 7.1", clause_name="Shock Absorption Test", matched_requirement="Transmitted force <= 5.0 kN", evidence_text="When tested with a 5.0 kg drop striker falling from 1.0 meter onto the crown, the maximum force transmitted to the headform shall not exceed 5.0 kN."),
                        EvidenceClause(clause_no="Clause 7.3", clause_name="Electrical Resistance Test", matched_requirement="Non-conducting dielectric performance", evidence_text="When subjected to an alternating voltage of 2,000 V RMS for 1 minute, the leakage current shall not exceed 3.0 mA."),
                    ],
                    "related": ["IS 3521 (Part 1): 2021", "IS 15298 (Part 2): 2016"],
                },
                {
                    "code": "IS 3521 (Part 1): 2021",
                    "title": "Personal Fall Arrest Systems - Full Body Harness",
                    "relevance": 95,
                    "category": "Safety & Fire",
                    "status": "current",
                    "qco": True,
                    "why": "Comprehensive specification for full body fall arrest harnesses, webbing tensile strength (min 22 kN), dynamic drop testing with 100 kg mannequin, and corrosion-resistant metal fittings.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 4.3", clause_name="Static Strength Test", matched_requirement="Webbing strength >= 22 kN", evidence_text="The harness assembly when subjected to static tensile load of 15 kN for 3 minutes shall show no tear or slippage through adjusters greater than 20mm."),
                        EvidenceClause(clause_no="Clause 5.1", clause_name="Dynamic Performance Test", matched_requirement="Drop test with torso dummy", evidence_text="A 100 kg torso dummy dropped from free-fall height of 4.0 meters shall remain suspended in head-up posture with torso angle less than 50 degrees."),
                    ],
                    "related": ["IS 3521 (Part 2): 2021", "IS 15683: 2018"],
                },
            ],
            "gaps": {
                "readiness_score": 85,
                "compliance_rating": "Moderate Gaps (Safety Flame & Retention Clauses Needed)",
                "missing": [
                    MissingParameter(
                        parameter="Chin Strap Anchorage Release / Strength",
                        severity="High",
                        impact="Excessive chin strap retention strength poses strangulation risk; inadequate strength causes helmet ejection during initial impact.",
                        recommended_clause="IS 2925:1984 Clause 7.5",
                        suggested_text="Chin strap anchorage shall withstand 150 N load without detachment, but must release between 150 N and 250 N to eliminate strangulation hazard."
                    ),
                    MissingParameter(
                        parameter="Shelf Life & Polymer UV Degradation Limit",
                        severity="Medium",
                        impact="HDPE helmets degrade under intense solar UV exposure; procurement should mandate maximum manufactured age upon receipt.",
                        recommended_clause="IS 2925:1984 Clause 9.1",
                        suggested_text="All helmets supplied shall have been manufactured within 90 days of delivery date with embossed quarter/year production clock dial on shell."
                    ),
                ],
                "ambiguities": [
                    AmbiguityFlag(
                        term="Heavy duty safety harness",
                        issue="'Heavy duty' is imprecise and allows non-compliant uncertified commercial safety belts.",
                        fix_suggestion="Replace with 'Full Body Harness Class A (Fall Arrest) with front and dorsal attachment points conforming to IS 3521 (Part 1): 2021'."
                    ),
                ],
                "qco_alerts": [
                    QCOComplianceAlert(
                        order_name="Personal Protective Equipment (Quality Control) Order, 2021",
                        requirement="Industrial safety helmets and safety harnesses must carry genuine BIS Standard Mark (ISI mark).",
                        legal_mandate="Department for Promotion of Industry and Internal Trade (DPIIT) notification. Procurement of non-BIS certified PPE is illegal for public and industrial operations."
                    )
                ],
                "spec_amendment": """// ADD TO SAFETY PROCUREMENT SPECIFICATION SECTION 2.1:
2.1.1 MANDATORY BIS COMPLIANCE:
Industrial safety helmets shall strictly conform to IS 2925: 1984 with valid ISI certification. Full body fall arrest harnesses shall conform to IS 3521 (Part 1): 2021.
2.1.2 MARKING & TRACEABILITY:
Each helmet shell and harness label must be indelibly marked with BIS License Number (CM/L-XXXXXXXXXX), batch number, and manufacturing date.
2.1.3 FLAME & IMPACT CRITERIA:
Helmets must be certified for Flame Retardancy (self-extinguish <= 5s per IS 2925) and Chin Strap dynamic release between 150N and 250N."""
            }
        }

    elif any(k in t for k in ["pipe", "hdpe", "water", "potable", "jal jeevan", "sanitation", "pe 100", "pn 10"]):
        return {
            "sector": "Public Health & Water Utilities",
            "product": "High-Density Polyethylene (HDPE) PE-100 Water Pipes",
            "purpose": "Rural and urban potable drinking water distribution under Jal Jeevan Mission and municipal schemes",
            "env": "Buried underground pipeline, operating pressure 1.0 MPa (10 bar), high soil chemistry resistance",
            "keywords": ["HDPE Water Pipe", "IS 4984 PE-100", "Pressure PN-10", "Carbon Black 2.25%", "Oxidation Induction Time", "BIS ISI Mark"],
            "parameters": [
                TechnicalParameter(parameter="Polymer Grade Designation", value="Virgin PE-100 High Density Resin", specified_in_spec=True, benchmark_is_norm="IS 4984:2016 Clause 4.1", status="specified"),
                TechnicalParameter(parameter="Working Pressure Rating", value="PN 10 (1.0 MPa at 27°C)", specified_in_spec=True, benchmark_is_norm="IS 4984:2016 Table 1", status="specified"),
                TechnicalParameter(parameter="Carbon Black Content", value="2.0% to 2.5% uniformly dispersed", specified_in_spec=True, benchmark_is_norm="IS 4984:2016 Clause 4.2", status="specified"),
                TechnicalParameter(parameter="Oxidation Induction Time (OIT)", value="> 20 minutes at 200°C", specified_in_spec=True, benchmark_is_norm="IS 4984:2016 Table 3", status="specified"),
                TechnicalParameter(parameter="Long Term Hydrostatic Strength", value="165 hours at 80°C without burst", specified_in_spec=True, benchmark_is_norm="IS 4984:2016 Clause 8.1", status="specified"),
                TechnicalParameter(parameter="Co-extruded Blue Stripe Identification", value="Continuous longitudinal stripes", specified_in_spec=False, benchmark_is_norm="IS 4984:2016 Clause 5.3", status="missing_recommended"),
            ],
            "matched_standards": [
                {
                    "code": "IS 4984: 2016",
                    "title": "High Density Polyethylene (HDPE) Pipes for Water Supply - Specification",
                    "relevance": 99,
                    "category": "Water & Utilities",
                    "status": "current",
                    "qco": True,
                    "why": "The definitive Indian Standard for HDPE potable water pipes regulating raw material resin grades (PE 63, PE 80, PE 100), dimensional tolerances, hydraulic pressure tests, and toxicological safety for drinking water.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 4.1", clause_name="Virgin Raw Material & Reworked Material Restriction", matched_requirement="Virgin PE-100 resin", evidence_text="Raw material shall be virgin polyethylene compound. No reworked or recycled material from external sources shall be added."),
                        EvidenceClause(clause_no="Clause 8.1", clause_name="Hydrostatic Pressure Test Requirements", matched_requirement="80°C 165 hours burst test", evidence_text="Pipes shall withstand induced hoop stress of 5.4 MPa at 80°C for 165 hours and 5.0 MPa for 1000 hours without rupture or weeping."),
                        EvidenceClause(clause_no="Clause 10.1", clause_name="Colour and Marking for Potable Water", matched_requirement="Blue stripe drinking water identification", evidence_text="Pipes for potable water shall be black with minimum three longitudinal indelible co-extruded blue stripes."),
                    ],
                    "related": ["IS 7634 (Part 2): 2012", "IS 2530: 1963", "IS 10141: 1982"],
                },
                {
                    "code": "IS 7634 (Part 2): 2012",
                    "title": "Laying and Jointing of Polyethylene (PE) Pipes - Code of Practice",
                    "relevance": 90,
                    "category": "Water & Utilities",
                    "status": "current",
                    "qco": False,
                    "why": "Details trench excavation depths, bedding preparation, butt fusion / electrofusion welding parameters, and field hydrotesting before trench backfill.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 6.3", clause_name="Butt Fusion Jointing Parameters", matched_requirement="Pipe welding and connection", evidence_text="Butt fusion heater plate temperature must be maintained at 210°C +/- 10°C with interface pressure maintained during cooling cycle."),
                    ],
                    "related": ["IS 4984: 2016"],
                },
            ],
            "gaps": {
                "readiness_score": 90,
                "compliance_rating": "High Readiness (Field Jointing & Marking Additions)",
                "missing": [
                    MissingParameter(
                        parameter="Co-extruded Blue Longitudinal Identification Stripes",
                        severity="High",
                        impact="Black HDPE pipes without co-extruded blue stripes risk being confused with gas/sewage pipes, violating potable water supply norms.",
                        recommended_clause="IS 4984:2016 Clause 5.3 & 10.1",
                        suggested_text="Pipes shall have minimum 3 longitudinal blue stripes co-extruded integrally during manufacturing for unambiguous potable water identification."
                    ),
                    MissingParameter(
                        parameter="NABL Batch Test for Overall Migration (Potable Safety)",
                        severity="Medium",
                        impact="Toxic additives or non-virgin plastic can leach heavy metals into drinking water.",
                        recommended_clause="IS 9833 / IS 10141",
                        suggested_text="The supplier shall furnish toxicological clearance certificates verifying zero heavy metal (Lead, Cadmium, Arsenic) migration per IS 10141."
                    ),
                ],
                "ambiguities": [
                    AmbiguityFlag(
                        term="Standard quality HDPE material",
                        issue="'Standard quality' is vague and enables supply of downgraded PE-80 or recycled plastic.",
                        fix_suggestion="Specify '100% Virgin PE-100 grade resin with density >= 0.940 g/cm³ and Melt Flow Rate 0.2-1.1 g/10min per IS 4984:2016'."
                    ),
                ],
                "qco_alerts": [
                    QCOComplianceAlert(
                        order_name="Pipes and Tubes (Quality Control) Order, 2020",
                        requirement="HDPE pipes for water supply must carry BIS certification mark under Scheme I of BIS Act.",
                        legal_mandate="Mandatory under DPIIT Quality Control Order. Non-certified HDPE pipes are legally barred from Jal Jeevan Mission projects."
                    )
                ],
                "spec_amendment": """// ADD TO WATER SUPPLY PIPES SPECIFICATION CLAUSE 5.2:
5.2.1 BIS STANDARD & GRADE:
HDPE pipes shall strictly conform to IS 4984: 2016 Grade PE-100 PN-10. Only virgin polymer certified with valid BIS license (ISI Mark) shall be used.
5.2.2 POTABLE IDENTIFICATION & DIMENSIONS:
Pipes shall feature co-extruded longitudinal blue stripes and carry continuous ink-jet/embossed marking every meter indicating 'IS 4984', 'PE-100', 'PN-10', 'SDR 13.6', 'Batch No', and 'BIS License No'.
5.2.3 TESTING MANDATE:
Factory inspection certificates showing compliance with 165-hr Hydrostatic pressure test at 80°C and OIT test (>20 min at 200°C) must accompany every delivery truck."""
            }
        }

    else:
        # Generic / Power / Transformer / General procurement fallback
        return {
            "sector": "Power Systems & Electrical Utilities",
            "product": "Outdoor Oil-Immersed Distribution Transformers & Switchgear",
            "purpose": "Electrical voltage stepping, grid distribution, and overcurrent circuit protection",
            "env": "Outdoor utility substation, continuous 24x7 thermal operation",
            "keywords": ["Distribution Transformer", "IS 1180 Part 1", "BEE Star Rating", "Insulating Oil BDV", "Short Circuit Test", "BIS Mandatory Marking"],
            "parameters": [
                TechnicalParameter(parameter="Rated Capacity & Voltage", value="250 kVA, 11 kV / 433 V 3-Phase 50Hz", specified_in_spec=True, benchmark_is_norm="IS 1180 (Part 1): 2014", status="specified"),
                TechnicalParameter(parameter="Energy Efficiency Rating", value="Conforming to BEE Star 2 Loss Limits", specified_in_spec=True, benchmark_is_norm="IS 1180 (Part 1): 2014 Table 3", status="specified"),
                TechnicalParameter(parameter="Total Losses at 50% Load", value="<= 900 Watts", specified_in_spec=True, benchmark_is_norm="IS 1180 (Part 1): 2014 Table 3", status="specified"),
                TechnicalParameter(parameter="Total Losses at 100% Load", value="<= 2400 Watts", specified_in_spec=True, benchmark_is_norm="IS 1180 (Part 1): 2014 Table 3", status="specified"),
                TechnicalParameter(parameter="Insulating Mineral Oil Breakdown Voltage", value=">= 30 kV (BDV)", specified_in_spec=True, benchmark_is_norm="IS 335: 2018", status="specified"),
                TechnicalParameter(parameter="Winding Temperature Rise Limit", value="Max 45°C over ambient", specified_in_spec=False, benchmark_is_norm="IS 1180 (Part 1): 2014 Clause 9.1", status="missing_recommended"),
            ],
            "matched_standards": [
                {
                    "code": "IS 1180 (Part 1): 2014",
                    "title": "Outdoor Type Oil Immersed Distribution Transformers up to and including 2 500 kVA, 33 kV - Specification",
                    "relevance": 98,
                    "category": "Electrotechnical",
                    "status": "current",
                    "qco": True,
                    "why": "The supreme mandatory standard for distribution transformers in India, stipulating maximum total loss limits at 50% and 100% load, short circuit withstand capabilities, and BEE Star labeling.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 6.8", clause_name="Standard Loss Limits for Energy Efficiency", matched_requirement="50% and 100% load loss compliance", evidence_text="Total losses at 50% and 100% loading shall not exceed values specified in Table 3 for Energy Efficiency Level 2."),
                        EvidenceClause(clause_no="Clause 9.1", clause_name="Temperature Rise Limits", matched_requirement="Thermal endurance under 50°C peak ambient", evidence_text="The temperature rise of winding shall not exceed 40/45°C and top oil temperature rise shall not exceed 35/40°C."),
                    ],
                    "related": ["IS 335: 2018", "IS 2026 (Part 1): 2011", "IS 3043: 2018"],
                },
                {
                    "code": "IS 335: 2018",
                    "title": "Uninhibited and Inhibited Mineral Insulating Oils - Specification",
                    "relevance": 92,
                    "category": "Electrotechnical",
                    "status": "current",
                    "qco": True,
                    "why": "Governs dielectric breakdown voltage, moisture content (< 30 ppm), and oxidation stability of transformer cooling oil.",
                    "evidence": [
                        EvidenceClause(clause_no="Clause 5.1", clause_name="Dielectric Breakdown Voltage", matched_requirement="Oil BDV >= 30 kV", evidence_text="The electric strength (breakdown voltage) of new unfiltered oil shall be minimum 30 kV RMS, and after treatment minimum 70 kV RMS."),
                    ],
                    "related": ["IS 1180 (Part 1): 2014"],
                },
            ],
            "gaps": {
                "readiness_score": 86,
                "compliance_rating": "Moderate Gaps (Short-Circuit & Temperature Rise Clauses Needed)",
                "missing": [
                    MissingParameter(
                        parameter="Short-Circuit Dynamic Withstand Test Certificate",
                        severity="Critical",
                        impact="Without type-tested short-circuit withstand proof from CPRI/ERDA, transformers risk catastrophic internal winding collapse during feeder faults.",
                        recommended_clause="IS 1180 (Part 1): 2014 Clause 21.3 / IS 2026 (Part 5)",
                        suggested_text="Bidder must furnish dynamic short-circuit withstand test certificate from CPRI/ERDA on identical rating and design executed within the last 5 years."
                    ),
                    MissingParameter(
                        parameter="Conservator Tank with Silica Gel Breather Capacity",
                        severity="Medium",
                        impact="Inadequate breather sizing causes atmospheric moisture absorption into oil, rapidly degrading dielectric insulation.",
                        recommended_clause="IS 1180 (Part 1): 2014 Clause 15.2",
                        suggested_text="Transformer shall be equipped with a dehydrating silica gel breather with minimum 500g capacity and cobalt-free orange-to-green indicator."
                    ),
                ],
                "ambiguities": [
                    AmbiguityFlag(
                        term="Copper wound transformer",
                        issue="Fails to specify electrolytic copper purity, allowing scrap-blended conductors with high resistivity.",
                        fix_suggestion="Specify 'Electrolytic Grade ETP Copper conductor with minimum 99.9% electrical conductivity conforming to IS 13730 / IS 6160'."
                    ),
                ],
                "qco_alerts": [
                    QCOComplianceAlert(
                        order_name="Electrical Transformers (Quality Control) Order, 2014",
                        requirement="Every distribution transformer manufactured or procured must display the BIS Standard Mark (ISI mark).",
                        legal_mandate="Ministry of Heavy Industries & Public Enterprises QCO. Procurement of uncertified distribution transformers is strictly prohibited."
                    )
                ],
                "spec_amendment": """// ADD TO TRANSFORMER TECHNICAL SPECIFICATION SECTION 4.1:
4.1.1 MANDATORY BIS & BEE COMPLIANCE:
Distribution transformers shall strictly comply with IS 1180 (Part 1): 2014 with valid BIS License (ISI Mark) and BEE Energy Star Level 2 label.
4.1.2 LOSS CEILINGS:
Total losses at 50% load shall strictly not exceed 900 Watts and at 100% load shall not exceed 2400 Watts. No positive tolerance on guaranteed losses is permitted.
4.1.3 TYPE TEST MANDATE:
Bids without valid Short-Circuit Withstand and Lightning Impulse Voltage Test certificates from NABL accredited CPRI / ERDA testing stations shall be rejected."""
            }
        }


@router.post("/analyze-requirement", response_model=ProcurementAnalysis)
async def analyze_requirement(payload: ProcurementAnalysisCreate):
    if not payload.raw_text or len(payload.raw_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Procurement requirement text is too short. Please provide at least 10 characters.")

    outcome, message, profile, catalog_matches = await assess_requirement(db, payload.raw_text)
    if outcome != "matched":
        result = ProcurementAnalysis(
            title=payload.title or payload.raw_text.strip()[:100],
            sector=payload.sector or "General", department=payload.department or "Procurement Division",
            conformity_scheme=payload.conformity_scheme, source_type=payload.source_type,
            raw_text=payload.raw_text, document_name=payload.document_name, created_at=today_iso(),
            status=outcome, outcome=outcome, outcome_message=message, catalog_matches=catalog_matches,
            extracted_intelligence=ExtractedIntelligence(product_identified="Not established", purpose="Not established", target_operating_environment="Not established"),
            gap_analysis=GapAnalysis(readiness_score=0, compliance_rating="Not assessed", recommended_spec_amendment=""),
        )
        await db.analyses.insert_one(result.model_dump())
        return result

    # Keep the existing demo profiles; a conservative product gate prevents the
    # legacy catch-all from returning transformer standards for unknown products.
    heuristics = determine_sector_and_heuristics(profile)
    candidates = await db.standards.find({"code": {"$in": [item["code"] for item in heuristics["matched_standards"]]}}, {"_id": 0}).to_list(100)
    by_code = {std["code"]: std for std in candidates}
    all_codes = set(await db.standards.distinct("code"))
    available_numbers = {match.group(1) for code in all_codes if (match := re.search(r"IS(?:/IEC)?\s*(\d+)", code))}
    def grounded_reference(text):
        return all(number in available_numbers for number in re.findall(r"\bIS(?:/IEC)?\s*(\d+)", text))

    analysis_id = str(uuid.uuid4())
    now_str = today_iso()

    title = payload.title or (payload.document_name and payload.document_name.replace(".pdf", "").replace("_", " ")) or heuristics["product"]

    extracted = ExtractedIntelligence(
        product_identified=heuristics["product"],
        purpose=heuristics["purpose"],
        target_operating_environment=heuristics["env"],
        keywords=heuristics["keywords"],
        technical_parameters=[p for p in heuristics["parameters"] if grounded_reference(p.benchmark_is_norm or "")],
    )

    recs = []
    for item in heuristics["matched_standards"]:
        std = by_code.get(item["code"])
        if not std:
            continue
        recs.append(
            RecommendedStandard(
                standard_code=std["code"],
                standard_title=std["title"],
                relevance_score=item["relevance"],
                status=std["status"],
                category=std["category"],
                technical_committee=std["technical_committee"],
                qco_mandatory=std["qco_mandatory"],
                why_recommended=std.get("why_recommended_template") or std["scope"],
                evidence_clauses=[EvidenceClause(clause_no=c["clause_no"], clause_name=c["clause_title"], matched_requirement="Catalog reference — applicability requires review", evidence_text=c["requirement_summary"]) for c in std.get("key_clauses", [])],
                related_standards_summary=[r["code"] for r in std.get("related_standards", []) if r["code"] in all_codes],
            )
        )

    gaps = GapAnalysis(
        readiness_score=heuristics["gaps"]["readiness_score"],
        compliance_rating=heuristics["gaps"]["compliance_rating"],
        missing_parameters=[m for m in heuristics["gaps"]["missing"] if grounded_reference(m.recommended_clause + " " + m.suggested_text)],
        ambiguity_flags=[a for a in heuristics["gaps"]["ambiguities"] if grounded_reference(a.fix_suggestion)],
        qco_compliance_alerts=heuristics["gaps"]["qco_alerts"],
        recommended_spec_amendment=heuristics["gaps"]["spec_amendment"] if grounded_reference(heuristics["gaps"]["spec_amendment"]) else "Review the catalog references above and confirm the applicable clauses against the official BIS publication before drafting a tender annexure.",
    )

    analysis_doc = ProcurementAnalysis(
        id=analysis_id,
        title=title,
        sector=payload.sector or heuristics["sector"],
        department=payload.department or "Procurement Department",
        conformity_scheme=payload.conformity_scheme or "Not Specified",
        source_type=payload.source_type,
        raw_text=payload.raw_text,
        document_name=payload.document_name,
        created_at=now_str,
        status="completed" if recs else "no_results",
        outcome="matched" if recs else "no_results",
        outcome_message="Catalog-backed references. Extraction, relevance scores and gap suggestions use the existing demonstration profile, not a live RAG model." if recs else NO_RESULTS,
        extracted_intelligence=extracted,
        recommendations=recs,
        gap_analysis=gaps if recs else GapAnalysis(readiness_score=0, compliance_rating="Not assessed", recommended_spec_amendment=""),
    )

    await db.analyses.insert_one(analysis_doc.model_dump())
    return analysis_doc


@router.get("/analyses", response_model=List[ProcurementAnalysis])
async def list_analyses(limit: int = 50, skip: int = 0):
    cursor = db.analyses.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    analyses = await cursor.to_list(limit)
    return [ProcurementAnalysis(**doc) for doc in analyses]


@router.get("/analyses/{id}", response_model=ProcurementAnalysis)
async def get_analysis(id: str):
    doc = await db.analyses.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{id}' not found.")
    return ProcurementAnalysis(**doc)


@router.delete("/analyses/{id}")
async def delete_analysis(id: str):
    result = await db.analyses.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{id}' not found.")
    return {"message": "Analysis deleted successfully", "id": id}


@router.get("/stats", response_model=AnalyticsStats)
async def get_stats():
    total_indexed = await db.standards.count_documents({})
    total_analyses = await db.analyses.count_documents({})
    qco_count = await db.standards.count_documents({"qco_mandatory": True})

    gaps_flagged = 0
    async for doc in db.analyses.find({}, {"_id": 0, "gap_analysis": 1}):
        gaps_flagged += len((doc.get("gap_analysis") or {}).get("missing_parameters") or [])

    return AnalyticsStats(
        total_standards_indexed=total_indexed,
        total_analyses_completed=total_analyses,
        high_confidence_rate=0,
        critical_gaps_prevented=gaps_flagged,
        qco_mandatory_standards_count=qco_count,
    )


@router.post("/export-tender-brief")
async def export_tender_brief(analysis_id: str):
    doc = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "title": f"Tender Specification BIS Appendix - {doc['title']}",
        "export_date": today_iso(),
        "institution": "Bureau of Indian Standards / Public Procurement Compliance Framework (SIH 26108)",
        "gfr_compliance_statement": "Prepared in accordance with Rule 144 of General Financial Rules (GFR) 2017 mandating applicable Indian Standards (IS) for public procurement tenders.",
        "analysis_data": doc,
    }
