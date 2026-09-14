# Kaan Bilge — The journal

Two vertically connected scenes: the approved graph hero and an internal project inspection. The name and central previews are selectable STIX Two Text, with Source Sans 3 support. Both fonts are self-hosted; their OFL licenses ship in `public/fonts/`.

## Run locally

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. SELF is a real graph item, selected immediately, with Kaan Bilge at center. The portfolio contains Progressive, Thesis and Wizard Battle, with actual screenshots from the local projects. All three are software/orange; the personal website is hobby/purple. Math/blue is available for future work. A small text key explains the colors without adding filters or changing graph navigation.

Open `http://127.0.0.1:5173/?demo` for the clearly labeled local demonstration. Its synthetic nodes open the internal detail scene; the detail links lead to local verification fixtures. Demo media is a real screenshot of this portfolio. This mode is gated by Vite's development flag; demonstration data is excluded from the production bundle. Other local fixtures: `?demo&count=5`, `?demo&count=30`, `?demo&count=100&hub`, `?demo&count=250`, and `?demo&fallback`.

No hosting or deployment has been configured.

## Add real work

Edit `src/content.js`. Each item requires a unique stable ID, a title and a short description. All other fields are optional:

```js
export const content = [
  {
    id: 'stable-content-id',
    title: 'Supplied project title',
    description: 'Supplied short description.',
    url: 'https://example.org/project',
    githubUrl: 'https://github.com/owner/project',
    year: 2026,
    group: 'software',
    category: 'Interaction study',
    role: 'Design & development',
    technologies: ['JavaScript', 'SVG'],
    media: {
      src: '/media/project.webp',
      alt: 'Describe the actual project image.',
    },
    mediaType: 'image',
    annotations: ['One optional margin note.'],
    relations: ['another-existing-id'],
  },
];
```

The example illustrates the schema, not a real project. Invalid items are excluded. Missing relationship endpoints are ignored; reciprocal/duplicate relations draw a single edge. SELF uses this same schema, with `presentation: 'identity'` to retain the existing uppercase name typography. Its destination is the homepage. The three projects relate to SELF; no relationships between projects are invented.

`group` accepts `software`, `math` or `hobby`. The shared definitions in `src/project-groups.js` supply the legend, node colors, accessible category descriptions and detail accents. `category` remains an optional, more specific project type. Unclassified nodes keep the original neutral color and orange selection. Color is supplemented by text in the key, node descriptions and detail metadata; selection still has its distinct doubled radius and brightness.

`href` remains a backward-compatible alias for `url`, and `type` is an alias for `category`. Media accepts a URL string or the object above. Use `mediaType: 'animated'` for GIF/animated WebP, or `'video'` for silent looping video. Media can provide a static `poster` and `fit: 'cover'`; the default is `contain` to preserve an entire interface or artwork. Video starts when inspection finishes and pauses on return or when the document is hidden. Reduced motion leaves videos paused and animated images on their static poster (or a neutral placeholder), with an accessible playback control. Missing or failed media shows an honest placeholder; absent links and metadata are omitted.

Image media can also include `companion: { src, alt }` for a second view. Progressive uses this to pair two actual app screens on desktop; mobile presents the primary screen at a more readable size. Screenshots and their provenance are documented in `public/media/README.md`. Only verified destinations are supplied: Progressive and Wizard Battle link to their GitHub repositories. Thesis has no published destination in the available project data, so its links are omitted.

`longDescription` is retained in the model but reserved for later; this version displays only the concise introduction. `easterEgg: false` hides the shared loose-loop placeholder. Every other value uses the same 56px component, with a small hover response and reversible click/keyboard action. It has no idle animation, and reduced motion makes its state change immediate. Only the first optional annotation appears. No extra case-study sections are generated.

Set `fieldDensity` in `src/config.js` from 0.5 to 1.6, default 1.0. This is an art-direction setting with no visible slider. Increasing density adds deterministic mesh samples without moving content. Larger content collections automatically reduce the decorative mesh. `tagline` is optional and currently empty. Supply real GitHub/LinkedIn URLs in the same configuration to enable those links.

For a live data source, `window.portfolio.setContent(items)` reconciles items by stable ID, preserves existing positions, and settles only additions near real neighbors. The API retains SELF when omitted. Updates wait until active pointer, touch, camera, keyboard interaction or inspection finishes; persistent selection alone does not block updates. Removing the selected project selects SELF after returning from inspection. `window.portfolio.setDensity(value)` changes the design setting. Development mode also exposes `inspect()` for verification and `failRenderer()` for testing the textual fallback. These two debug methods are absent from the production build.

## Implementation

- `src/layout.js`: deterministic finite settling, actual-edge normalization, independent structural sampling, spatial traversal and acquisition hysteresis.
- `src/graph.js`: camera, pointer/touch states, semantic node buttons with managed focus, occlusion, dynamic content and fallback.
- `src/inspect-scene.js`: the reversible 800ms scene track, actual SVG title transfer, persistent chevron, focus restoration and reduced motion.
- `src/inspect-background.js`: passive continuation of the same background mesh across the scene boundary, including the current camera and physical offsets.
- `src/project-groups.js`: shared category labels and restrained accent colors.
- `src/project-detail.js`: one editorial composition populated from node data, media playback, optional metadata, links and the recurring loose-loop object.
- `src/physics.js`: finite critically damped local displacement around a pinned selected node, independent of permanent layout anchors.
- `src/typography.js`: font measurement, ink anchoring, long-content fit, whole-block opacity exchange and live glyph masks.
- `src/styles.css`: the supplied palette, atmospheric fields, responsive typography, supporting copy and accessibility modes.

SVG draws geometry and live selectable text. Glyph masks are cloned text, never supplied outlines or proof images. The renderer does no continuous layout or idle animation. There is no bloom, atmospheric drift, inertia, parallax or node dragging.

The current refinement supersedes the older handoff's temporary-preview, no-SELF and no-letter-motion rules. The fonts, atmosphere, layout and mesh density remain the original direction; project colors now identify their groups. Normal content and structural radii are 37.5% larger; the selected content radius smoothly reaches twice the new base radius. Exactly one item is active, retaining its category color. Hover selection persists on pointer leave, Escape, blur and camera gestures. Central content always follows the selection.

The finite background extends beyond the complete pan range at minimum zoom (0.65), with an additional 320 world pixels for mesh connections at each boundary. Resizing refreshes the extent using the same deterministic samples. Pan limits and the existing 0.65–2.4 zoom range remain unchanged.

Selection growth drives a soft exclusion envelope within 160 screen pixels, displacing nearby content and structural points by at most 14 pixels, with stronger response close to the selected center. Edges follow those points. The acquired center stays pinned, and old neighborhoods settle exactly back to their anchors. Motion pauses for pointer-down/camera manipulation and stops after convergence. No force depends on cursor proximity. Title glyphs alone respond to pointer proximity with at most 2.5 pixels of horizontal offset and 1.6 degrees of rotation; they restore their original SVG attributes when the pointer leaves. Reduced motion disables displacement and glyph motion.

Click the selected node, or the bottom chevron, to inspect it internally. Touch first selects, then opens on a second tap. Keyboard users enter the graph once with Tab, explore spatially with arrows or all items with brackets, inspect with Enter/Space, and leave normally with Tab. Plus/minus zoom, Home resets framing, and Escape releases graph interaction while retaining selection. In inspection, Escape or the upward chevron returns to the graph. Outbound links exist in the detail scene, with ordinary browser link behavior. Renderer fallback also opens internal detail.

The entire scene track moves by one hero height in 800ms, using a symmetric easing without overshoot. The actual SVG title is temporarily reparented into a fixed travel layer, then into the detail heading; its position, scale and line alignment share the same animation clock as the track and chevron. Return reverses the transition. The graph stays mounted but inert, with physics paused and camera/selection retained; focus returns to the originating node or handle. Detail has its own native vertical scroll, so the handle stays available on small screens. Reduced motion changes scene and title position immediately. There is no route change or interactive graph behind the detail.

Both scenes share the hero's atmospheric background. The lower scene draws a static continuation of the existing structural field, so node positions and edges meet exactly across the boundary during travel. The continuation extends the field when needed at pan/zoom limits without changing the hero. Soft local masks reduce mesh contrast around the heading and metadata; they follow native detail scrolling without running a simulation. Detail media has a faint silver edge and no figure number or explanatory caption. The information column starts slightly below the image top. Metadata labels are 14px, with values and links at 18px. Links gain a thin category-colored underline on hover or keyboard focus.

## Verification

```sh
npm test
npm run build
python -m pip install playwright pillow
python tests/browser_checks.py
python tests/refinement_checks.py
python tests/inspect_checks.py
python tests/inspect_media_checks.py
python tests/project_checks.py
python tests/visual_review.py
```

Browser checks require the local server already running and use a separate, headless installed Chrome process. Set `CHROME_PATH` for a different installation. Touch and pinch are exercised with Chromium touch emulation. The full run includes a 30-second idle check; `--quick` skips that wait. Screenshots and the acceptance report are written to ignored `test-results/`.

The visual targets are the supplied A desktop, hover and mobile proofs. Demo geometry is generated from synthetic content, so its coordinates and topology differ from the static specimen. The local demo label replaces personal copy, and unbound social labels are omitted. Demo fixtures remain independent of the real project collection. Additional media, published project URLs and social URLs can be supplied through the same model and configuration.
