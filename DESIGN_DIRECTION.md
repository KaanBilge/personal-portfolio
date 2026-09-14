# Kaan Bilge — Design direction

Status: art-direction handoff, 12 September 2026. No website implementation. The user’s written brief governs this document; the Arctic Hare images are visual evidence, not instructions or reusable branding.

## Final direction

**A mathematical object disguised as a personal website: a stable, finely connected field with KAAN BILGE typeset across its center like the title of a scientific monograph.** The structure has complexity; the presentation has composure. The personal identity comes from the name, the care of the typesetting, and the work revealed through relationships.

Use **variant A, The journal**, as the implementation default. Its open capital spacing, restrained scale, and STIX Two Text letterforms give the mathematics background a specific expression. The olympiad achievement informs the precision; it does not become a badge, equation, or hero claim.

One full-viewport composition. Two visual planes: a navigable graph and fixed editorial typography. Depth comes from very dark atmospheric color and differences in line visibility. Everything remains two-dimensional. The only emphatic color event is one node becoming mineral amber when explored.

## What the reference contributes

All eight supplied images were inspected separately and measured. They are an untimed sequence of still frames; no video file or frame timestamps were supplied. Motion speed, easing, continuous trajectories, and pointer causality cannot be established from them.

The transferable qualities are a nearly black field, enormous diffuse color regions, hairline networks, a persistent center of attention, and very little peripheral copy. The reference’s dominant dark color clusters are approximately `#0C0C0F`, `#1A1C21`, and `#252D33`; these are measured image clusters, not recovered CSS tokens. Its large brand mark is around `#D7D9DE`. Kaan’s palette below is a new design, with darker atmosphere and a separate silver identity.

Do not reuse the hare mark, rounded studio lettering, studio copy, graph coordinates, upper-left/lower-right light distribution, or logo bloom. [Frame-by-frame analysis](art-direction/reference-analysis/FRAME_ANALYSIS.md) records what is observable and what remains uncertain.

## Composition and layer order

Reference artboard: **1440 × 900 CSS px**. Use the live viewport, not a fixed image ratio.

| Layer, back to front | Required treatment |
| --- | --- |
| Canvas | Opaque `#07090D`, full viewport. |
| Atmosphere | Two broad blue fields and one weaker violet undertone. Fixed to the viewport. |
| Structural field | Faint non-interactive vertices and edges that supply texture. Moves with graph camera. |
| Content graph | Real projects, writing, and experiments; only their real relationships. Moves with graph camera. |
| Central type | Fixed at horizontal center; capital ink center at **49% of viewport height**. Independent of graph layout. |
| Peripheral copy | Fixed to safe-area insets. No header bar, frame, or panel. |

The graph extends past all four edges. At the initial camera position, its visible texture occupies roughly 85–95% of the canvas, including the central region. No radial hub, enclosing circle, prescribed constellation, or bilateral symmetry. Mildly uneven local density provides rhythm without creating large empty quadrants.

The title’s scale and quiet isolation establish hierarchy; a big empty disk around it does not. Lines can pass through the name’s bounding box and show between letters. Knock them out at the actual glyph silhouettes, with no more than a 1 px contour allowance. The letter counters remain open. No rectangular text backing, text glow, drop shadow, or broad dark halo.

On the initial layout, keep actionable node centers outside the central title envelope, **title ink bounds plus 16 px**. This is an automatic composition constraint, never manual placement of specific projects. Faint structural vertices may sit behind the letters. Later panning may carry content nodes behind the title; the interaction spec defines their visibility and recovery.

## Palette

Use solid text colors at full opacity. Transparency belongs primarily to the graph and atmospheric layers.

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#07090D` | Almost-black ground, opaque. |
| Identity silver | `#ADB5C3` | KAAN BILGE. Cool, substantially quieter than graph white. |
| Preview silver | `#D4DBE5` | Active project title. Brighter than the name, still distinct from nodes. |
| Secondary silver | `#8994A5` | One-line description, tagline, peripheral links, interaction help. |
| Graph white | `#E6ECF3` | All node cores before active interaction. Never use pure white. |
| Edge blue-gray | `#9CAEC8` | Edge source color; visibility determined by opacity below. |
| Mineral amber | `#C98B61` | Active content node; restrained tint on its real incident edges. |
| Atmospheric blue | `#344A68` | Source color only; never a flat visible surface. |
| Atmospheric violet | `#373247` | Source color only; subordinate to blue. |

Amber replaces the active node’s white; it does not spread to the central title, tagline, background, or every neighbor. In a normal hover frame, amber occupies only the selected dot and its immediate relationship lines. No resting orange elements.

Meaning: black is the canvas; blue-violet is atmosphere; white identifies structure; silver identifies the person and content; amber identifies current attention. Do not introduce category colors.

### Atmospheric recipe

| Field | Center in viewport | Horizontal / vertical radii | Peak source opacity |
| --- | --- | --- | --- |
| Main blue | 79% / 19% | 63% of width / 73% of height | 24% |
| Secondary blue | 15% / 83% | 57% of width / 70% of height | 18% |
| Violet undertone | 51% / 54% | 60% of width / 80% of height | 10% |

Use continuously soft, elliptical falloff. At 46–50% of the radius, opacity is approximately 40% of its peak; by the outer radius it is zero. The shapes overlap and extend offscreen. There must be no visible perimeter, concentrated light source, fog bank, bright nebula, or separable colored blob. These are starting construction values; the static proofs are the visual target. Keep the brightest atmospheric area below approximately `#1C2635` after compositing. The center remains darker and less chromatic than the broad light areas.

Default atmosphere is **static**. Optional imperceptible drift is specified separately and disabled in the first implementation. Use no parallax, star texture, vignette tunnel, animated noise, or photographic grain. If raster color banding appears, apply sub-visible dithering only; it must not read as texture.

## Typography

### Locked default: The journal

**STIX Two Text, roman, weight 400.** Use its text face, not STIX Two Math. This family was developed for scientific and technical publishing; that lineage is the rationale, while the calm appearance is the design judgment. [STIX project](https://github.com/stipub/stixfonts), [Tiro Typeworks](https://www.tiro.com/fonts/stix-two).

| Element | Desktop at 1440 px | Small screen at 390 px | Treatment |
| --- | --- | --- | --- |
| Name | 96 px / 1.05 line height | 44 px / 1.08 | True uppercase, weight 400. |
| Name tracking | +0.085 em | +0.055 em | Kerning on. No trailing tracking in centering calculation. |
| Name word space | 0.46 em total advance | 0.46 em total advance | Separates the two names without making two lockups. |
| Project title | 56 px / 1.12 | 30 px / 1.15 | Same serif, 400, +0.035 em tracking. |
| Project description | 15 px / 22 px | 14 px / 20 px | Source Sans 3, 400, normal tracking. |
| Tagline | 14 px / 20 px | 14 px / 20 px | Source Sans 3, 400. |
| Peripheral links | 13 px / 20 px | 13 px / 20 px | Source Sans 3, 400, sentence case. |

Interpolate the name smoothly through **390 → 44 px, 768 → 64 px, 1440 → 96 px, 1920 → 108 px**; cap at 108 px. Below 390 px, use 40 px down to 360 px and 36 px at 320 px, reducing tracking to +0.04 em if needed. Keep the complete name on one line under ordinary text settings. Do not stretch, condense, outline, italicize, emboss, or animate individual letters. Never make just one name warmer, heavier, or italic.

Center by visible capital ink, not by the font’s entire line box. Use actual glyph metrics; the line-box baseline otherwise makes the name look too low. At 1440 × 900, the name’s ink center is **(720, 441)**. The proofs use real font outlines, not approximated or generated lettering.

Source Sans 3 is the sole supporting face. No monospaced metadata, technical-looking labels, superscripts, dates, or overline above the name. Load only the chosen serif variant and supporting sans in a later implementation. A failed font load may use Georgia for the serif and a system sans for support; fallback must fit without clipping, but is not the specified visual target.

### Preview hierarchy and content limits

The project title occupies the same fixed ink-center anchor as the name. Its smaller size provides room for an informative phrase. The description begins **20 px below the title’s ink bounds** on desktop and **16 px** below on mobile. It appears as unframed text, not a tooltip, card, caption attached to a dot, or overlay window.

Title width limit: the smaller of **720 px and viewport width minus two outer margins**. Description width limit: **560 px**, also bounded by the viewport margins. Aim for a title of 2–5 words and a description of 45–72 characters. These are editorial guidelines, not assumptions about the real dataset.

If a title does not fit, reduce it from 56 to 42 px on desktop, or 30 to 26 px on mobile; then allow two centered lines. Never truncate the title or reduce it further. With two lines, center the whole title block at the same anchor and place the description below it. A one-line description may wrap to two lines on a narrow screen or under text enlargement. Do not invent a miniature text size to preserve one line. Meaningful capitalization in a real project name takes precedence over the specimen’s uppercase treatment.

The complete center-content envelope may reach 190 px tall on desktop and 210 px on mobile with long content. It has no visible background. Prevent peripheral copy from colliding with it.

## Graph visual language

There are two explicitly different structures. The user approved faint non-clickable structural dots on 12 September 2026 so that a small real portfolio can still have a rich network texture.

| Element | Size at default camera | Idle appearance | Meaning |
| --- | --- | --- | --- |
| Content node | 3.6 px diameter desktop; 3.8 px touch | Graph white at 82% | One real content destination. |
| Real relationship edge | 0.65 px | Edge blue-gray at 14% | One actual relationship in the data. |
| Structural vertex | 1.5 px diameter | Graph white at 22% | Background structure only. No content or destination. |
| Structural edge | 0.55 px | Edge blue-gray at 5.2% | Background texture only. |

Use smooth, antialiased circles and continuous straight edges. No arrowheads, dashed orbital lines, node outlines at rest, hexagons, bubbles, icon badges, permanent node labels, or line-drawing entrances. Vary density and connectivity, not randomly assigned node colors or dramatically different dot sizes. All work types share one appearance.

The structural field is a separate, deterministic, non-semantic mesh. It never joins a content node or participates in its hover neighborhood. Interrupt its edges within **10 screen px** of a content-node center, so accidental crossings do not look like real relationships. Do not fabricate content relationships for visual balance. Only real incident edges receive amber.

The rich texture must remain a graph of short connections, not a uniformly triangulated wallpaper or a scatter of unconnected stars. Aim for a structural mean degree of **2–3**, with irregular local groupings and occasional loose ends. Most structural edge lengths at default view should be **45–120 px**, with no structural edge over 160 px. Content edge length follows real topology. Avoid duplicate strokes where multiple relations describe the same pair; one line is enough in this homepage view.

### Density and changing data

Expose a single art-direction setting, **field density**, from 0.5 to 1.6, default **1.0**. At 1.0, use approximately **150 structural vertices per million viewport pixels** on desktop: about **194 at 1440 × 900**. This number excludes real content nodes. On touch/narrow screens use a base rate of **115 per million pixels**, about **38 at 390 × 844**. It is a design setting, not a visible slider.

Keep density stable during a viewing session. Sample deterministic world positions; do not regenerate random locations on hover, pan, zoom, or every resize. Maintain a finite structural extent around the content graph rather than an endless world. The initial world should extend roughly 40% beyond the viewport in every direction.

Content nodes follow stable IDs and actual relation data. Use a deterministic layout with a finite settling phase before reveal. Optimize edge length, overlap avoidance, modest local clustering, and the initial type-safe region. Do not manually assign coordinates to each project, continuously run a force simulation, or encode chronology in a spiral. Related items should generally lie closer; the composition must not promise mathematically exact distance meaning.

For additions, place the new item near its real neighbors, then settle a local neighborhood. Existing positions should remain recognizable. For deletions, remove the item and incident edges without closing the entire graph around the vacancy. Relation changes should usually change the lines, not cause a global rearrangement. Freeze layout while a visitor is pointing, dragging, pinching, or keyboard-previewing an item; apply pending data changes after the interaction finishes. Never move an acquired target out from under the pointer.

| Real content count | Visual behavior |
| --- | --- |
| 0 | Keep name and structural texture. No fake targets. Replace tagline with “Work will appear here.” |
| 1–12 | Preserve full structural texture. Spread content nodes through the usable middle field; show only actual edges, even if none. |
| 13–60 | Standard composition. Target content-node spacing of at least 48 px in the default view where feasible. |
| 61–200 | Expand the world before shrinking target dots. Reduce structural-field density gradually toward 0.5 to avoid visual congestion. Pan and zoom expose all work. |
| More than 200 | Keep the same two-dimensional language. Expand world bounds further and cull offscreen geometry. Reduce structural density to 0.5; do not merge content into unnamed cluster bubbles or add a dashboard. |

Initial camera fits the core occupied region around the identity; it is not required to show every item at once for large datasets. Every real item remains reachable by camera movement and the keyboard graph traversal described in the interaction spec. At extreme zoom-out, decrease edge opacity rather than letting overlapping edges form bright masses. Never erase the distinction between structural texture and real destinations.

## Spacing, copy, and peripheral navigation

Use a 4 px spacing base. Primary values: **8, 12, 16, 20, 24, 32, 48, 64**. Default viewport insets: 48 px desktop, 32 px tablet, 24 px mobile, plus device safe-area requirements. Match the bottom-left and bottom-right baseline at desktop widths.

Proposed tagline: **“Thinking in structures.”** This is suggested personal copy, not a claim supplied by Kaan. Use it as a single quiet line; do not add a second paragraph by default. The proofs show it for evaluation.

Peripheral navigation is limited to **GitHub** and **LinkedIn** when real URLs are supplied. Use text links, no social icons or pills, with a 24 px gap. At narrow widths, place them on a second bottom-left line, 24 px below the tagline, retaining comfortable touch targets. The sample link labels in the proofs are unbound placeholders. Do not invent usernames or URLs.

No About or Writing link is added in this direction; writing is already in the graph. No scroll cue: this composition is complete without content below. No contact CTA, work grid, statistics, testimonial, skills list, “available for work” badge, theme switch, music control, or loading percentage.

## Responsive principles

| Viewport | Treatment |
| --- | --- |
| 1024 px wide and above | One-line centered identity; 48 px margins; opposing footer anchors. |
| 600–1023 px | 32 px margins; smoothly scaled name; same graph camera model. Reduce peripheral width before reducing legibility. |
| Below 600 px | 24 px margins; lower structural density; larger invisible content-node targets; stacked bottom-left support. Name remains at 49% height. |
| Landscape / height below 560 px | 20 px top/bottom margins; cap name at 64 px and preview at 36 px; cap central envelope at 55% of height. Omit the optional tagline if needed, preserve navigation. |
| Increased text size / extreme short viewport | Readability wins. Permit central text wrapping and ordinary page overflow rather than clipping or shrinking it. No scroll trapping. |

Use the visible viewport and safe areas so browser controls cannot cover peripheral links. Graph dot and edge sizes are screen-space sizes across camera zoom. The graph camera transforms positions; it does not scale the central name, supporting text, pointer targets, or atmosphere. At small sizes, choose a different camera crop of the same data rather than compressing the entire desktop graph into a phone.

Keyboard focus and selected-state clarity are mandatory. Quiet styling must not make destinations inaccessible. Small text stays at the specified silver color without extra opacity. Evaluate readability over the brightest atmosphere, not just the black corner. Functional targets need adequate contrast; the decorative mesh does not carry information and may remain barely visible. Offer the system high-contrast rendering described in the interaction spec without adding a visible settings product.

## Image treatment

There are **no photographs, portraits, project thumbnails, rendered spheres, stock textures, or background videos** in this hero or its preview. The image treatment is the absence of illustrative imagery: geometry and real typography provide the visual material. A project-node preview is only a title and one-line description.

The supplied references are analysis material. The included SVG and PNG proofs are static design artifacts, not assets to use as a screenshot background or as the finished navigation surface. Their graph data is synthetic and illustrates layout and density only. Rebuild the eventual graph from real data.

## Anti-patterns and review gate

Reject any implementation in which:

- The name becomes a node, logo badge, outlined container, or draggable object.
- The structure looks like stars, orbits, a neural-network stock illustration, a radar, or a particle demo.
- The cursor glows, carries a halo, repels nodes, or creates lines unrelated to real topology.
- The whole graph continuously rearranges, breathes, pulses, rotates, or bounces.
- Amber becomes a background color, title color, category scheme, or neon aura.
- Graph edges are thick enough to compete with the name, or atmospheric fields have obvious boundaries.
- Typography becomes futuristic, generic geometric sans, ultra-thin fashion lettering, faux small caps, or a terminal face.
- Equations, Greek symbols, olympiad medals, formulas, decorative numbering, or faux technical metadata are added.
- A hover introduces a card, glass panel, image, tooltip tail, or detached content surface.
- Extra sections, animated scroll narratives, rounded SaaS components, or decorative motion are introduced.

At rest, the visitor should first read **KAAN BILGE**, then recognize an explorable network. On hover, a project becomes the central subject without the surrounding composition losing its stillness.

Companion files: [Interaction specification](INTERACTION_SPEC.md), [three typography treatments and proofs](TYPOGRAPHY_VARIANTS.md).
