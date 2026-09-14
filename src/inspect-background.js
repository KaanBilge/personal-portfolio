import { structuralField } from "./layout.js";

// Continue the existing world coordinates below the hero. This is a passive
// drawing captured when inspection opens, with no hit targets or simulation.
export class InspectBackground {
  constructor(graph, track) {
    this.graph = graph;
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.id = "inspect-field";
    this.svg.setAttribute("aria-hidden", "true");
    track.prepend(this.svg);
  }

  refresh() {
    const graph = this.graph;
    if (graph.fallback) { this.svg.replaceChildren(); return; }
    const { width, height } = graph;
    // The hero's overscan may not cover a second screen at a pan/zoom limit.
    // Extend only the lower boundary: deterministic samples and all existing
    // connections near the join retain their original coordinates and topology.
    const bottom = Math.max(graph.fieldBounds.bottom, graph.world({ x: width, y: height * 2 }).y + 320);
    const field = bottom === graph.fieldBounds.bottom ? graph.field : structuralField(
      { ...graph.fieldBounds, bottom }, graph.config.fieldDensity,
      width < 600 || graph.coarse.matches, graph.data.length,
    );
    const point = (p) => graph.projection(graph.physics.position(p.id, p));
    const visible = (p) => p.x >= -160 && p.x <= width + 160 && p.y >= height - 160 && p.y <= height * 2 + 160;
    const edges = graph.meshPath.cloneNode(false);
    edges.id = "inspect-field-edges";
    edges.setAttribute("d", field.edges.map(([a, b]) => {
      const p = point(a), q = point(b);
      return visible(p) || visible(q) ? `M${p.x},${p.y}L${q.x},${q.y}` : "";
    }).join(""));
    const dots = graph.meshDots.cloneNode(false);
    dots.id = "inspect-field-dots";
    dots.setAttribute("d", field.vertices.map((p) => {
      const q = point(p);
      return visible(q) ? `M${q.x - 1.03125},${q.y}a1.03125,1.03125 0 1,0 2.0625,0a1.03125,1.03125 0 1,0 -2.0625,0` : "";
    }).join(""));
    this.svg.style.opacity = graph.structure.style.opacity;
    this.svg.setAttribute("viewBox", `0 ${height} ${width} ${height}`);
    this.svg.replaceChildren(edges, dots);
  }

  softenBehindText(root, titleWidth) {
    // Fade the drawing locally, keeping the atmosphere and edge geometry intact.
    // Coordinates are relative to this scene, so the mask travels with the mesh.
    const bounds = this.svg.getBoundingClientRect();
    const masks = [...root.querySelectorAll(".detail-header, .detail-metadata, .detail-links")].map((node) => {
      const rect = node.getBoundingClientRect();
      // The heading host spans the grid, but its ink usually occupies only the
      // left portion. Leave the empty right-hand margin's mesh untouched.
      const width = node.matches(".detail-header")
        ? Math.min(rect.width, Math.max(titleWidth, root.querySelector(".detail-description").clientWidth))
        : rect.width;
      const x = rect.left - bounds.left + width / 2;
      const y = rect.top - bounds.top + rect.height / 2;
      return `radial-gradient(ellipse ${width / 2 + 28}px ${rect.height / 2 + 24}px at ${x}px ${y}px, rgb(0 0 0 / .18) 45%, #000 100%)`;
    });
    this.svg.style.maskImage = masks.join(", ") || "none";
    this.svg.style.maskComposite = "intersect";
  }
}
