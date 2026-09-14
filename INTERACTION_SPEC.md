# Kaan Bilge — Interaction specification

Implementation update: Inspect Node v1 supersedes this historical handoff's external node navigation. Selected-node activation, Enter/Space, and the bottom chevron now open an internal detail scene with an 800ms vertical transition and shared SVG title. The same chevron or Escape reverses it, preserving selection and camera. Outbound links live inside detail. See README.md for the current data model and behavior. Earlier graph refinements described there also remain in force.

Status: design specification only. Applies to the single full-screen composition in [DESIGN_DIRECTION.md](DESIGN_DIRECTION.md). All distances below are **screen-space CSS pixels** unless stated otherwise. Timings are proposed design values, not measurements of the supplied still frames.

## Governing behavior

The camera can move; the layout has already settled. The visitor explores a stable object. A real node controls the central identity while it is previewed. The name, peripheral copy, and atmosphere remain anchored to the viewport during graph pan and zoom.

One content item may be active at a time. An active item is established by deliberate mouse hover, keyboard focus, or a first touch tap. Decorative structural dots cannot become active. No graph motion is triggered merely by the pointer approaching a node.

### State model

| State | Center | Graph |
| --- | --- | --- |
| Idle | KAAN BILGE | Default graph values; all positions stable. |
| Proximity | KAAN BILGE | Very slight white brightening near pointer. |
| Preview | Project title and description | One amber node; actual immediate relationships emphasized. |
| Camera manipulation | KAAN BILGE | Nodes track camera only; hover suspended. |
| Activating destination | Current preview | Retain active node until navigation occurs. No transition spectacle. |

Priority: camera gesture suppresses pointer hover; touch-pinned preview persists until another touch decision; keyboard focus owns the preview until the pointer is deliberately moved over a different target. A motionless pointer must not immediately overwrite keyboard selection. On blur or leaving the page, cancel transient pointer states; do not trap focus or block navigation.

## Idle state

- Render the initial settled graph with the name already present. No simulated boot, drawing of edges, scrambling text, or intro animation.
- Content nodes: 3.6 px diameter, `#E6ECF3` at 82%. On touch, diameter 3.8 px.
- Real edges: 0.65 px, `#9CAEC8` at 14%.
- Structural vertices: 1.5 px, `#E6ECF3` at 22%; structural edges: 0.55 px, `#9CAEC8` at 5.2%.
- **Default idle motion is zero.** Do not run a live layout solver to animate stillness. Layout work may happen before reveal or following a data change, not perpetually.
- Identity, support text, and network do not pulse. The browser’s native cursor remains visible and unmodified.

Optional atmosphere drift is off by default. If explicitly enabled later: translate each atmospheric field by no more than 1.5% of viewport width over at least 180 seconds, with a continuous low-speed trajectory; no opacity pulsing, hue cycling, synchronized reversal, or abrupt loop boundary. It must be hard to detect even by deliberate observation. Stop entirely for reduced motion or a hidden tab. The static version is fully designed and complete.

## Graph pan

**Gesture:** primary-button drag on empty graph background; one-finger drag on touch background. The name and footer links are not draggable controls. Structural dots count as empty background.

1. On pointer-down, record position; do not start camera motion or cancel a click yet.
2. Cross a movement threshold of **5 px mouse / 8 px touch** to enter pan. Clear pointer or touch preview, cancel any pending node activation, and show the name.
3. Apply pointer delta **1:1** to the graph camera. Position follows the hand in the same direction. No spring, easing lag, rubber band, magnetic target, or perspective transform.
4. On release, stop in place. **No kinetic inertia or post-release drift.**

Use the native grab cursor over pannable background and grabbing during drag. Use the native pointer cursor over a content target or ordinary link. The central text uses the normal arrow cursor; text selection remains available.

A drag beginning on a node crosses the same threshold and becomes a camera pan, not a node drag. Individual work nodes are not repositionable by visitors. After a drag, suppress hover until the pointer moves at least 3 px intentionally or comes to rest for 120 ms; do not flash the node that happened to end underneath the cursor.

Bounds: allow panning throughout the finite content world plus 25% of a viewport of margin at the current scale. Clamp camera translation at the boundary without bounce or visible snapping. Do not let a visitor lose the entire data graph in an unlimited empty plane. Decorative field positions and extents do not expand indefinitely as the camera moves.

## Graph zoom

Initial camera scale is **1.0**, with bounds **0.65–2.4** relative to the initial layout scale. Resize may recompute the base viewport mapping; preserve the current world focal point and proportional zoom wherever possible.

| Input | Behavior |
| --- | --- |
| Mouse wheel over empty graph | Exponential zoom; a normalized 100 px wheel delta changes scale by about 1.10×. Limit a single wheel event to at most 1.15×. |
| Precision trackpad two-finger scroll | Same graph zoom behavior, with accumulated small deltas. No two-finger camera drift. |
| Direct touch pinch | Zoom around the pinch centroid; direct response, no trailing spring. |
| Keyboard `+` / `−` while graph focused | 1.15× steps around the focused node. |
| `Home` while graph focused | Return to initial framing; one restrained 180 ms ease, without bounce. |

Anchor wheel zoom at the pointer’s world location. That location stays under the pointer; the name stays fixed to the viewport. Use at most an **80 ms ease-out** to interpolate a discrete wheel step; rapid wheel events update the current target instead of creating an animation queue. Pinch and drag should respond directly. Clamp scale continuously at limits.

During zoom, suspend hover and show the name. Re-enable hover 120 ms after the final wheel/pinch event, subject to target acquisition rules. No layout recomputation, graph explosion, camera tilt, or fly-through occurs. Dot diameters, stroke widths, hit-target sizes, and central typography do not scale with camera zoom.

Reserve **Ctrl/Cmd browser zoom** and browser accessibility gestures for the browser. Do not globally cancel wheel, touch, or keyboard events. Only consume ordinary graph zoom gestures while the pointer is on the graph surface. Wheels over fixed text/navigation remain native. If ordinary page overflow is needed for enlarged text or a short viewport, wheel scrolling stays native; graph zoom remains available through pinch and focused keyboard commands. Avoid trapping the page at a zoom limit.

At scale below 1.0, reduce decorative-edge opacity linearly to 75% of default at 0.65; real edges may fall to 85% of default. Content dots keep their normal contrast. No cluster bubbles, hidden project categories, or global labels appear.

## Pointer proximity

For fine pointers only, use a **36 px radius** around the pointer with a smooth falloff to zero at its boundary.

- Real node opacity may rise from 82% to at most **88%**.
- Its actual incident edges may rise from 14% to at most **15%**.
- No change in position, size, color, bloom, description, camera, or central name.
- Do not brighten decorative vertices or their mesh. A proximity field must never read as a light illuminating a patch of canvas.
- Blend in and out over **100 ms**, with no accumulation when neighborhoods overlap.

This is a small acquisition cue. At ordinary viewing distance it should be barely noticeable. It ends when deliberate hover, keyboard preview, touch preview, or camera manipulation takes control.

## Node acquisition and deliberate hover

Real dots are visually small but have invisible, stable hit targets:

| Input | Minimum target diameter | Acquisition rule |
| --- | --- | --- |
| Fine pointer | 24 px | Closest content-node center inside the target radius. |
| Coarse pointer / touch | 44 px | Closest content-node center inside the target radius. |
| Keyboard | No pointer target required | Semantic focus on a real content link. |

Invisible hit areas are not drawn as circles. When areas overlap, choose the nearest projected center; break exact ties by stable ID. Once acquired, retain that target until the pointer leaves its hit radius plus **3 px**, or another candidate is at least **6 px closer**. At normal zoom, prioritize adequate content-node spacing to avoid ties. At dense/zoomed-out views, zoom and keyboard traversal provide access to overlapping items; never jitter their positions in response to the pointer.

Require **70 ms** continuously inside a mouse hit target before beginning its deliberate hover visuals. Require **90 ms total dwell** before starting the central-content transition. A quick traversal across a node must not repeatedly flash project names. Keyboard and touch selection bypass dwell. Acquisition is attached to the hit target, so visitors do not need to land on a 3.6 px dot.

### Hover visual destination

| Element | Hover target |
| --- | --- |
| Active node | **5.3 px diameter**, `#C98B61`, full opacity. |
| Actual incident edges | **0.85 px**, `#C98B61` at **32%**. All direct real edges; no multi-hop propagation. |
| Immediate real neighbors | Graph white at **95%**; normal diameter; remain cool. |
| Unrelated content nodes | Graph white at **65%**. They remain clearly discoverable. |
| Unrelated real edges | Edge blue-gray at **10%**. |
| Entire structural field | 85% of its idle opacity. No structural vertex receives warm highlighting. |
| Central title | Preview silver, never amber. |

Interpolate node size, node color, and incident-edge visibility over **140 ms**, using a standard ease-out with no overshoot. Neighbor brightening and unrelated-region dimming take **180 ms**. Returning to idle takes **180 ms** after the leave grace period. Amber is a state color, not an expanding wave.

For a high-degree node with more than six direct relationships, reduce each active edge’s 32% opacity by the square root of its degree divided by six, with a floor of 12%. Retain all true direct edges and the full amber dot. This prevents a dense hub from turning into a bright orange web; the normal hover proof is below this threshold.

**Bloom is disabled in the specified default.** The dot’s increased size and amber color provide enough signal. If enabled following visual review, restrict bloom to a maximum 5 px radius around the active node, amber at no more than 8% opacity. No global bloom pass, white flare, lens effect, or pointer-following glow. The static proofs show the no-bloom choice.

## Node selection and destination opening

Every content node needs a stable ID, title, short description, valid destination, and real relationship IDs. Do not render an unpublished placeholder as an actionable dot. Missing or inaccessible project data must not silently open the wrong destination.

### Mouse / pen with hover

A normal click opens the acquired node’s declared destination in the current tab, as an ordinary link. It does not open a new modal or invent a project detail surface. Preserve native modifier-click and middle-click behavior. Navigation can occur without waiting for hover dwell or a text animation to finish. Keep the active preview visible until the browser leaves. No full-screen blackout, zoom into the dot, or artificial navigation delay.

### Touch / pen without hover

First tap **pins the central preview** and active node. Second tap on that same node opens its declared destination. A first tap on a different node switches the preview. Tapping empty background clears it and restores the name; crossing the drag threshold starts camera pan instead. No double-tap-to-zoom behavior on a content node.

While a touch preview is pinned, replace the bottom-left tagline with **“Tap again to open.”** in the same secondary type style. It returns to the tagline when the preview clears. This is instructional feedback in an existing text position, not a new panel or section. The central preview itself stays non-clickable, preserving the graph as the primary navigation mechanism.

### Return to homepage

Restore the prior camera position on browser Back when possible, with the name at center and transient hover cleared. The visitor should not have to find the same region again. Do not persist an unfinished hover as a permanent project title after return.

## Optional local node displacement

**Disabled in the specified default.** Target stability and composure take precedence. If enabled later, all of these limits apply:

- Fix the active node’s screen position under the pointer throughout hover; its collision-radius increase never moves itself.
- Only direct, real graph neighbors within **80 screen px** may respond. Decorative vertices and other content remain fixed.
- Increase the active node’s local exclusion radius from **14 to 22 px**. Push a nearby neighbor outward only as much as needed, with **6 px maximum displacement** per neighbor.
- Resolve each neighbor against its stored resting position. Displacement is temporary and must not accumulate across hovers or change the permanent layout.
- Ease outward over **220 ms** and return over **280 ms**, monotonic and without bounce. No visible oscillation or chain reaction through the graph.
- Freeze displacement during pointer-down, camera gestures, and focus changes. Finish returning to the resting position before the next camera manipulation; for a direct gesture, snap the tiny offset back without camera lag.
- Always disable for coarse-pointer/touch, reduced motion, and keyboard interaction.

If this makes the graph appear to dodge the visitor or destabilizes a target, remove the effect entirely. Hover growth alone conveys increased visual weight.

## Project preview appearance

Use the title and short description from the active node’s content data. Do not assemble marketing copy or project claims from tags. The delivered hover proof uses **“PROJECT NAME”** and **“One-line project description.”** as explicitly non-real specimen content.

The title uses the selected typography variant; the description always uses Source Sans 3. They occupy the viewport-fixed center. No tooltip, pointer tether, background panel, thumbnail, date, chip, icon, or action button accompanies them.

Keep the title’s capital ink center at 49% of viewport height. The description is 20 px below its ink bounds on desktop, 16 px on mobile. Long-title and narrow-screen rules are in the design direction. The full center is non-interactive and must not intercept a hidden graph link.

## Center typography transition

Use a **whole-block opacity exchange**, with no movement, blur, scale, glyph morphing, tracking animation, random symbols, typewriter effect, or per-letter stagger.

1. After preview qualification, fade the current center block to zero over **70 ms** using ease-in.
2. Replace its semantic content at zero opacity; the title anchor remains fixed.
3. Fade the new title and description together to full opacity over **130 ms** using ease-out.

Total transition is **200 ms**, starting after the 90 ms pointer dwell when applicable. There is no extra blank hold. Avoid a simultaneous crossfade of two readable names; it creates an untidy overprinted word shape.

When moving directly from project A to project B, replace A with B through the same exchange; do not insert KAAN BILGE between them. If a new candidate arrives during a transition, retain only the newest qualified candidate and continue from current opacity. Never queue a sequence of stale titles. Do not restart an ongoing fade to a larger duration.

Keep the name and project title in the same fixed central envelope. Font-size differences must not move the graph camera, footer, or anchor. Text masks track the actually visible glyphs and their opacity, not an opaque rectangular box.

## Preview disappearance and interruption

On leaving a fine-pointer target, allow **100 ms** before restoring the name. Re-entering the same target during that grace period cancels the leave. Entering another target starts its acquisition and replaces the preview directly when qualified.

After the grace period, reverse the same 70 ms out / 130 ms in exchange to KAAN BILGE. The description disappears with the title. Graph visual emphasis returns to idle over 180 ms. Restore the current node’s idle state even if data changes remove it.

Moving the pointer outside the browser clears transient hover. `Escape` clears a pinned or keyboard preview and returns the name; it does not unexpectedly move the camera. Pan, pinch, window blur, or loss of a target cancels pending dwell and activation. Data removal of an active node clears its preview, announces that it is no longer available to assistive technology if focused, and preserves the camera.

## Occlusion, focus, and accessibility

Central typography sits above the graph. If a content node moves beneath a visible central text envelope during panning, temporarily suppress that node’s dot and hit area within the envelope plus 8 px. Real edges still pass behind the glyphs. Do not allow an invisible dot to intercept a click on a letter. After it leaves the envelope, restore the node normally. The same rule applies beneath peripheral link hit areas.

Every real node must remain a semantic, named link with its title and destination; a canvas-only navigation surface is insufficient. Decorative dots and edges are hidden from assistive technology. Use a single graph entry in the ordinary Tab order, with managed focus inside the graph, so a hundred nodes do not require a hundred Tab presses before reaching GitHub.

| Keyboard input while graph focused | Result |
| --- | --- |
| Arrow keys | Move focus to the nearest real content node in that screen direction. Stable spatial ordering, not decoration. |
| If no candidate exists in that direction | Stay on the current node. Do not wrap unpredictably. |
| `[` / `]` | Previous/next real content item in a stable title-then-ID order; includes offscreen and visually overlapping nodes. |
| `Enter` | Open the focused destination with native link behavior. |
| `+` / `−` | Zoom around the focused node. |
| `Home` | Restore initial framing. |
| `Escape` | Clear preview; keep graph entry focused. Reacquisition requires a new directional or item-order key. |
| `Tab` / `Shift+Tab` | Leave the graph for peripheral links or surrounding browser/page controls. No focus trap. |

On entering the graph by keyboard, focus the first available content item in stable title-then-ID order and preview it. Show a **1 px unblurred silver focus ring, 12 px outside diameter**, in addition to the amber state. This distinguishes keyboard focus without relying on color alone. No focus ring on mouse hover. Peripheral links use an equally clear thin underline/focus outline, without pills. When focus leaves the graph, clear its keyboard preview and restore the name.

If a focused node is offscreen or under the center, pan only the minimum distance needed to place it inside a 48 px viewport safety margin and outside fixed text envelopes. Use a **160 ms ease-out**; no zoom or recentering of the entire graph. Update the keyboard traversal geometry afterward. For reduced motion, move immediately.

While graph keyboard focus is active, replace the optional tagline with **“Arrows explore. [ / ] browse all. Enter opens.”** The accessible graph description also explains zoom, Home, and Escape. The help uses the existing bottom-left region; it may wrap to two lines on small screens. Return the tagline when focus leaves. Announce the active project title and description once, politely, after a committed keyboard/touch preview; do not flood a live region with mouse proximity events.

For system high-contrast/forced-colors mode, remove atmosphere and decorative mesh, render real links/nodes and focus indicators in system colors, and preserve the semantic navigation. For a failed graph renderer, the same real content links must remain available in a plain textual fallback within the hero; do not display a beautiful but unusable empty canvas. These are functional fallbacks, not extra site sections.

## Reduced-motion behavior

- Static atmosphere, stable graph, no local displacement or bloom.
- Direct pan and pinch remain available because they respond to the visitor’s hand; no interpolation lag or post-gesture motion.
- Wheel and keyboard zoom changes apply immediately. Home reset and focus recovery move immediately.
- Center text uses an immediate content replacement; no fade. Keep pointer dwell and leave grace, which prevent accidental activation rather than animate content.
- Active dot changes color and diameter immediately. Neighbor/edge emphasis changes immediately. No animated growth, pulsing, or sweeping color.
- For incoming data, retain existing positions, update edges, and place new nodes without animated settling. Defer structural changes until current interaction ends.

The reduced-motion result must preserve the complete navigation and identical visual hierarchy.

## Acceptance scenarios for the frontend handoff

These are behavioral review cases, not implementation code or a prescribed framework.

1. Leave the page untouched for 30 seconds: graph positions and typography remain composed, with no obvious repeated movement.
2. Move near a node, then hover it: proximity keeps the name; deliberate acquisition turns only the real selected neighborhood warm and changes the center.
3. Sweep rapidly across five targets: no queued project-title slideshow. Stop on one target: its preview stabilizes.
4. Drag from empty space and then from a node: both move only the camera after the threshold, and neither accidentally opens a project.
5. Wheel and pinch at several locations: the world point under the input anchor stays put; name, support text, and atmosphere remain fixed.
6. Click a project with mouse, and preview/open with two taps on touch: destination behavior matches this spec. Background tap restores the name.
7. Pan a dot behind the name: it cannot capture clicks while hidden; keyboard browsing can recover and open it.
8. Review datasets of 0, 5, 30, 100, and 250 content nodes, including sparse relations and a high-degree hub. Texture remains restrained; all real work remains reachable; no false relationship is invented.
9. Add/remove nodes and edges while one item is hovered: acquired targets remain stable and changes settle only after the current interaction.
10. Traverse with keyboard alone, including overlapping/offscreen nodes, then Tab out. Focus is visible and no region traps navigation.
11. Review at 1440 × 900, 768 × 1024, 390 × 844, 320 × 568, a 480 px-tall landscape viewport, and enlarged text. Name and previews do not clip, and peripheral links remain usable.
12. Enable reduced motion and system high contrast, then simulate a renderer failure: real work remains navigable without decorative effects.

Do not add motion or controls to solve a problem until these simpler rules have been tried. The design is complete with static atmosphere, no bloom, and no local displacement.
