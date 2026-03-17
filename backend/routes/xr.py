import logging
from fastapi import APIRouter
from models.xr import ARLab, ARLabScene

router = APIRouter(prefix="/xr", tags=["WebXR AR Labs"])
logger = logging.getLogger(__name__)

# --- Lab Definitions ---
AR_LABS: list[ARLab] = [

    # ═══════════════════ PHYSICS ═══════════════════
    ARLab(
        id="pendulum",
        name="Simple Pendulum",
        category="physics",
        subject="Mechanics",
        description="Observe how period depends on length, not mass. Adjust the pendulum length and measure oscillation frequency in real-time AR.",
        difficulty="beginner",
        duration_minutes=10,
        thumbnail="/ar-labs/thumbnails/pendulum.svg",
        tags=["mechanics", "oscillation", "SHM", "period"],
        scene=ARLabScene(
            component="pendulum-lab",
            entities=[
                {"type": "sphere", "id": "bob", "radius": 0.03, "color": "#06B6D4", "position": "0 -0.3 0"},
                {"type": "cylinder", "id": "string", "height": 0.3, "radius": 0.003, "color": "#ffffff", "position": "0 -0.15 0"},
                {"type": "sphere", "id": "pivot", "radius": 0.015, "color": "#7C3AED", "position": "0 0 0"},
                {"type": "text", "id": "period-display", "value": "Period: -- s", "color": "#06B6D4", "position": "0.3 0.1 0"},
            ],
            instructions=[
                "Point your camera at a flat surface and tap to place the lab",
                "Tap the pendulum bob to set it in motion",
                "Use the slider to change the string length",
                "Observe how period changes with length only",
            ],
            learning_outcomes=[
                "T = 2π√(L/g) — period is independent of mass",
                "Longer pendulums have longer periods",
                "Simple harmonic motion characteristics",
            ],
        ),
    ),

    ARLab(
        id="circuit-board",
        name="Electric Circuit Builder",
        category="physics",
        subject="Electricity",
        description="Build series and parallel circuits, measure voltage and current using a virtual multimeter projected onto your desk.",
        difficulty="intermediate",
        duration_minutes=15,
        thumbnail="/ar-labs/thumbnails/circuit.svg",
        tags=["electricity", "Ohm's law", "circuits", "voltage", "current"],
        scene=ARLabScene(
            component="circuit-lab",
            entities=[
                {"type": "box", "id": "battery", "width": 0.08, "height": 0.04, "depth": 0.04, "color": "#EF4444", "position": "-0.2 0 0"},
                {"type": "cylinder", "id": "bulb1", "radius": 0.025, "height": 0.05, "color": "#FCD34D", "position": "0 0 0", "emissive": "#FCD34D"},
                {"type": "cylinder", "id": "bulb2", "radius": 0.025, "height": 0.05, "color": "#FCD34D", "position": "0.15 0 0", "emissive": "#FCD34D"},
                {"type": "text", "id": "voltage-display", "value": "V: 0V  I: 0A", "color": "#06B6D4", "position": "0 0.15 0"},
            ],
            instructions=[
                "Place the lab on your desk surface",
                "Tap components to add them to the circuit",
                "Connect wires by dragging between terminals",
                "Tap the multimeter to read live values",
            ],
            learning_outcomes=[
                "Ohm's Law: V = IR",
                "Series vs Parallel circuit behavior",
                "Current and voltage distribution rules",
            ],
        ),
    ),

    ARLab(
        id="optics-bench",
        name="Optics Bench",
        category="physics",
        subject="Light & Optics",
        description="Manipulate convex and concave lenses, observe ray diagrams, and measure focal lengths in an interactive AR optics bench.",
        difficulty="intermediate",
        duration_minutes=12,
        thumbnail="/ar-labs/thumbnails/optics.svg",
        tags=["optics", "lenses", "refraction", "focal length"],
        scene=ARLabScene(
            component="optics-lab",
            entities=[
                {"type": "box", "id": "bench", "width": 0.6, "height": 0.01, "depth": 0.05, "color": "#374151"},
                {"type": "cylinder", "id": "lens", "radius": 0.06, "height": 0.005, "color": "#93C5FD", "opacity": 0.6, "position": "0 0.05 0"},
                {"type": "sphere", "id": "object", "radius": 0.02, "color": "#F59E0B", "position": "-0.2 0.05 0"},
            ],
            instructions=[
                "Scan a flat surface to place the bench",
                "Drag the object to change its distance from the lens",
                "Tap the lens to switch convex/concave",
                "Observe where the image forms on the other side",
            ],
            learning_outcomes=[
                "Lens formula: 1/f = 1/v - 1/u",
                "Real vs virtual image formation",
                "Magnification calculation",
            ],
        ),
    ),

    # ═══════════════════ CHEMISTRY ═══════════════════
    ARLab(
        id="acid-base-titration",
        name="Acid-Base Titration",
        category="chemistry",
        subject="Analytical Chemistry",
        description="Perform a virtual acid-base titration using NaOH and HCl. Watch the indicator change color at the equivalence point.",
        difficulty="intermediate",
        duration_minutes=15,
        thumbnail="/ar-labs/thumbnails/titration.svg",
        tags=["titration", "acid-base", "pH", "molarity", "equivalence point"],
        scene=ARLabScene(
            component="titration-lab",
            entities=[
                {"type": "cylinder", "id": "burette", "radius": 0.015, "height": 0.25, "color": "#D1FAE5", "opacity": 0.7, "position": "0 0.15 0"},
                {"type": "cone", "id": "flask", "radius-bottom": 0.06, "height": 0.1, "color": "#BFDBFE", "opacity": 0.8, "position": "0 0 0", "fill": "#BFDBFE"},
                {"type": "sphere", "id": "drop", "radius": 0.008, "color": "#ffffff", "position": "0 0.075 0"},
                {"type": "text", "id": "ph-display", "value": "pH: 7.0", "color": "#10B981", "position": "0.2 0.1 0"},
                {"type": "text", "id": "volume-display", "value": "Volume: 0.00 mL", "color": "#06B6D4", "position": "0.2 0.05 0"},
            ],
            instructions=[
                "Place the virtual lab on a flat surface",
                "Tap burette knob to add NaOH drop by drop",
                "Watch the pink indicator color appear near equivalence",
                "Calculate molarity from volume used",
            ],
            learning_outcomes=[
                "pH changes sharply at equivalence point",
                "Molarity calculation: C₁V₁ = C₂V₂",
                "Role of indicators in titration",
                "Neutralization reaction: HCl + NaOH → NaCl + H₂O",
            ],
        ),
    ),

    ARLab(
        id="molecular-bonds",
        name="Molecular Bond Builder",
        category="chemistry",
        subject="Organic Chemistry",
        description="Build 3D molecular structures (H₂O, CO₂, CH₄, C₆H₆) in AR and visualize bond angles, polarity, and electron clouds.",
        difficulty="beginner",
        duration_minutes=10,
        thumbnail="/ar-labs/thumbnails/molecule.svg",
        tags=["molecular geometry", "VSEPR", "bonds", "organic chemistry", "hybridization"],
        scene=ARLabScene(
            component="molecule-lab",
            entities=[
                {"type": "sphere", "id": "carbon", "radius": 0.04, "color": "#374151"},
                {"type": "sphere", "id": "hydrogen1", "radius": 0.025, "color": "#ffffff", "position": "0.1 0.1 0"},
                {"type": "sphere", "id": "hydrogen2", "radius": 0.025, "color": "#ffffff", "position": "-0.1 0.1 0"},
                {"type": "sphere", "id": "oxygen", "radius": 0.035, "color": "#EF4444", "position": "0 -0.12 0"},
                {"type": "cylinder", "id": "bond1", "radius": 0.008, "height": 0.12, "color": "#9CA3AF"},
            ],
            instructions=[
                "Place the molecule viewer on any surface",
                "Swipe left/right to switch molecules (H₂O, CO₂, CH₄, benzene)",
                "Pinch to scale the model",
                "Tap any atom to see its electron configuration",
            ],
            learning_outcomes=[
                "VSEPR theory and bond angles",
                "sp, sp², sp³ hybridization",
                "Polarity and electronegativity",
                "Resonance structures in benzene",
            ],
        ),
    ),

    # ═══════════════════ BIOLOGY ═══════════════════
    ARLab(
        id="human-heart",
        name="Human Heart Anatomy",
        category="biology",
        subject="Anatomy",
        description="Explore the internal anatomy of the human heart in 3D AR. Visualize the four chambers, valves, and blood flow paths in real-time projected onto your desk.",
        difficulty="beginner",
        duration_minutes=15,
        thumbnail="/ar-labs/thumbnails/heart.svg",
        tags=["human heart", "anatomy", "cardiology", "biology", "circulatory system"],
        scene=ARLabScene(
            component="heart-lab",
            entities=[
                {"type": "sphere", "id": "left-ventricle", "radius": 0.08, "color": "#EF4444", "position": "-0.04 -0.05 0"},
                {"type": "sphere", "id": "right-ventricle", "radius": 0.07, "color": "#EF4444", "position": "0.04 -0.05 0"},
                {"type": "sphere", "id": "left-atrium", "radius": 0.05, "color": "#EF4444", "position": "-0.04 0.05 0"},
                {"type": "sphere", "id": "right-atrium", "radius": 0.05, "color": "#EF4444", "position": "0.04 0.05 0"},
                {"type": "cylinder", "id": "aorta", "radius": 0.02, "height": 0.15, "color": "#B91C1C", "position": "-0.02 0.12 0", "rotation": "0 0 15"},
                {"type": "cylinder", "id": "vena-cava", "radius": 0.02, "height": 0.15, "color": "#1E40AF", "position": "0.06 0.12 0", "rotation": "0 0 -10"},
                {"type": "text", "id": "label", "value": "Human Heart", "color": "#1A1A2E", "position": "0 0.22 0"},
            ],
            instructions=[
                "Place the cardiac model on a flat surface",
                "Tap individual chambers to see their function",
                "Use the toggle to visualize blood flow paths",
                "Pinch to zoom into the valve structures",
            ],
            learning_outcomes=[
                "Identify the four chambers: Atria and Ventricles",
                "Understand the difference between oxygenated and deoxygenated blood",
                "Role of the Aorta and Vena Cava in systemic circulation",
                "Mechanism of cardiac valves in preventing backflow",
            ],
        ),
    ),

    ARLab(
        id="dna-replication",
        name="DNA Double Helix & Replication",
        category="biology",
        subject="Molecular Biology",
        description="Explore the 3D double helix structure and watch semi-conservative DNA replication unfold with polymerase and complementary base pairing.",
        difficulty="intermediate",
        duration_minutes=15,
        thumbnail="/ar-labs/thumbnails/dna.svg",
        tags=["DNA", "replication", "genetics", "base pairing", "helicase", "polymerase"],
        scene=ARLabScene(
            component="dna-lab",
            entities=[
                {"type": "cylinder", "id": "strand1", "radius": 0.006, "height": 0.4, "color": "#06B6D4"},
                {"type": "cylinder", "id": "strand2", "radius": 0.006, "height": 0.4, "color": "#7C3AED"},
                {"type": "sphere", "id": "adenine", "radius": 0.016, "color": "#F59E0B", "position": "0.02 0.05 0"},
                {"type": "sphere", "id": "thymine", "radius": 0.016, "color": "#EF4444", "position": "-0.02 0.05 0"},
                {"type": "sphere", "id": "guanine", "radius": 0.016, "color": "#10B981", "position": "0.02 -0.05 0"},
                {"type": "sphere", "id": "cytosine", "radius": 0.016, "color": "#6366F1", "position": "-0.02 -0.05 0"},
                {"type": "text", "id": "enzyme-label", "value": "Helicase", "color": "#06B6D4", "position": "0 0.25 0"},
            ],
            instructions=[
                "Place the DNA strand on a flat surface",
                "Rotate your phone to view the full helix",
                "Tap 'Replicate' to start the animation",
                "Tap colored base pairs to learn A-T and G-C pairing rules",
            ],
            learning_outcomes=[
                "DNA double helix structure (antiparallel strands)",
                "Complementary base pairing: A-T, G-C",
                "Semi-conservative replication mechanism",
                "Role of helicase, primase, and DNA polymerase",
            ],
        ),
    ),
]

LAB_INDEX = {lab.id: lab for lab in AR_LABS}


@router.get("/labs", response_model=list[ARLab])
async def list_labs(category: str = None):
    if category:
        return [lab for lab in AR_LABS if lab.category == category]
    return AR_LABS


@router.get("/labs/{lab_id}", response_model=ARLab)
async def get_lab(lab_id: str):
    lab = LAB_INDEX.get(lab_id)
    if not lab:
        from fastapi import HTTPException
        raise HTTPException(404, f"AR Lab '{lab_id}' not found")
    return lab


@router.get("/categories")
async def get_categories():
    from collections import Counter
    counts = Counter(lab.category for lab in AR_LABS)
    return [{"category": cat, "count": count} for cat, count in counts.items()]
