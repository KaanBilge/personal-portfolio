import {
  clamp,
  normalizeContent,
  relationships,
  stableOrder,
  settle,
  structuralField,
  acquire,
  directional,
} from "./layout.js";
import { Typography } from "./typography.js";
import { LocalPhysics } from "./physics.js";
import { projectAccent, projectGroup, projectGroups } from "./project-groups.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
};
const expanded = (b, n) => ({
  left: b.left - n,
  right: b.right + n,
  top: b.top - n,
  bottom: b.bottom + n,
});
const inside = (p, b) =>
  p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom;
const ease = (t) => 1 - (1 - t) ** 3;

export class Portfolio {
  constructor(data, config, { demo = false, fallback = false, onInspect } = {}) {
    this.onInspect = onInspect;
    this.root = document.querySelector("#portfolio");
    this.surface = document.querySelector("#graph");
    this.network = document.querySelector("#network");
    this.links = document.querySelector("#destinations");
    this.structure = document.querySelector("#structure");
    this.edgeLayer = document.querySelector("#relationships");
    this.dotLayer = document.querySelector("#dots");
    this.clearance = document.querySelector("#clearance-circles");
    this.support = document.querySelector("#support");
    this.announcement = document.querySelector("#announcement");
    this.groupKey = document.querySelector("#group-key");
    for (const [id, group] of Object.entries(projectGroups)) {
      const label = document.createElement("span");
      label.dataset.group = id;
      label.style.setProperty("--group-color", group.color);
      label.textContent = group.label;
      this.groupKey.append(label);
    }
    this.config = { ...config };
    this.demo = demo;
    this.fallback = fallback;
    this.positions = new Map();
    this.physics = new LocalPhysics();
    this.camera = { x: 0, y: 0, scale: 1 };
    this.pointers = new Map();
    this.active = null;
    this.owner = null;
    this.candidate = null;
    this.focused = null;
    this.keyboard = false;
    this.cameraBusy = false;
    this.pointer = null;
    this.pendingData = null;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");
    this.contrast = matchMedia("(forced-colors: active)");
    this.coarse = matchMedia("(pointer: coarse)");
    this.type = new Typography(() => {
      if (this.data) {
        this.updateSupport();
        this.render();
      }
    });
    this.type.layout();
    this.width = this.root.clientWidth;
    this.height = this.root.clientHeight;
    this.setContent(data);
    this.restoreCamera();
    this.render();
    this.events();
    this.updateSupport();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.root);
    const fontProbe = document.createElement("span");
    fontProbe.className = "font-probe";
    fontProbe.setAttribute("aria-hidden", "true");
    this.root.append(fontProbe);
    this.fontObserver = new ResizeObserver(() => this.type.layout());
    this.fontObserver.observe(fontProbe);
    this.reduced.addEventListener("change", () => this.preparePhysics());
    this.contrast.addEventListener("change", () => this.render());
    if (fallback) this.enableFallback();
  }
  projection(p, camera = this.camera) {
    return {
      x: this.width / 2 + camera.x + p.x * camera.scale,
      y: this.height / 2 + camera.y + p.y * camera.scale,
    };
  }
  world(p) {
    return {
      x: (p.x - this.width / 2 - this.camera.x) / this.camera.scale,
      y: (p.y - this.height / 2 - this.camera.y) / this.camera.scale,
    };
  }
  get points() {
    return this.data.map((n) => ({
      id: n.id,
      ...this.projectNode(n.id),
    }));
  }
  get visiblePoints() {
    return this.points.filter(
      (p) =>
        p.x >= 0 &&
        p.x <= this.width &&
        p.y >= 0 &&
        p.y <= this.height &&
        !this.occluded(p),
    );
  }
  get busy() {
    return !!(
      this.pointers.size ||
      this.inspecting ||
      this.cameraBusy ||
      this.keyboard ||
      this.owner === "touch" ||
      this.candidate
    );
  }
  occlusionBoxes(includeType = true) {
    const boxes = includeType ? [expanded(this.type.bounds, 8)] : [];
    for (const el of document.querySelectorAll("footer p,footer a,#group-key span"))
      if (el.textContent && el.getClientRects().length) {
        const b = el.getBoundingClientRect(),
          r = this.root.getBoundingClientRect();
        boxes.push({
          left: b.left - r.left - 8,
          right: b.right - r.left + 8,
          top: b.top - r.top - 8,
          bottom: b.bottom - r.top + 8,
        });
      }
    return boxes;
  }
  occluded(p) {
    // Text covers graph ink through its live glyph mask, not a rectangular
    // exclusion zone. Keep the full envelope only for keyboard focus recovery.
    return this.occlusionBoxes(false).some((b) => inside(p, b));
  }
  setContent(incoming) {
    const data = normalizeContent(incoming);
    if (this.inspecting) {
      this.pendingData = data;
      return;
    }
    if (this.active && !data.some((n) => n.id === this.active)) {
      if (this.keyboard || this.owner === "touch")
        this.announcement.textContent = "This item is no longer available.";
      this.pendingData = null;
      this.keyboard = false;
      this.clearPreview(true);
      this.candidate = null;
    }
    if (this.busy && this.data) {
      this.pendingData = data;
      return;
    }
    this.pendingData = null;
    this.data = data;
    this.ordered = stableOrder(data);
    this.edges = relationships(data);
    const b = expanded(this.type.bounds, 16);
    const safe = {
      left: b.left - this.width / 2,
      right: b.right - this.width / 2,
      top: b.top - this.height / 2,
      bottom: b.bottom - this.height / 2,
    };
    this.positions = settle(
      data,
      this.positions,
      { width: this.width, height: this.height },
      safe,
    );
    this.worldBounds = {
      left: Math.min(
        -this.width / 2,
        ...[...this.positions.values()].map((p) => p.x),
      ),
      right: Math.max(
        this.width / 2,
        ...[...this.positions.values()].map((p) => p.x),
      ),
      top: Math.min(
        -this.height / 2,
        ...[...this.positions.values()].map((p) => p.y),
      ),
      bottom: Math.max(
        this.height / 2,
        ...[...this.positions.values()].map((p) => p.y),
      ),
    };
    this.makeStructure();
    this.makeLinks();
    const initial = !this.active;
    if (!this.entries.has(this.active))
      this.active = this.entries.has(this.config.initialSelection)
        ? this.config.initialSelection : this.ordered[0]?.id;
    this.preparePhysics(initial);
    this.type.show(this.data.find((item) => item.id === this.active), initial);
    if (initial && this.active &&
        performance.getEntriesByType("navigation")[0]?.type !== "back_forward")
      this.recover(this.active, 0);
    this.updateSupport();
    this.render();
  }
  flush() {
    if (!this.busy && this.pendingData) this.setContent(this.pendingData);
  }
  setDensity(value) {
    this.config.fieldDensity = clamp(Number(value) || 1, 0.5, 1.6);
    this.makeStructure();
    this.preparePhysics();
    this.render();
  }
  makeStructure() {
    // At the pan limit the far viewport edge extends 75% of a viewport past
    // the content bounds. Cover that at MIN zoom, plus two full mesh links.
    // Hash samples keep the visible density and existing coordinates unchanged.
    const b = this.worldBounds;
    const overscanX = this.width * 0.75 / 0.65 + 320;
    const overscanY = this.height * 0.75 / 0.65 + 320;
    this.fieldBounds = {
      left: b.left - overscanX,
      right: b.right + overscanX,
      top: b.top - overscanY,
      bottom: b.bottom + overscanY,
    };
    this.field = structuralField(
      this.fieldBounds,
      this.config.fieldDensity,
      this.width < 600 || this.coarse.matches,
      this.data.length,
    );
    this.structure.replaceChildren();
    this.meshPath = svg("path", {
      fill: "none",
      stroke: "#9CAEC8",
      "stroke-width": 0.55,
      "vector-effect": "non-scaling-stroke",
    });
    this.structure.append(this.meshPath);
    this.meshDots = svg("path", { fill: "#E6ECF3" });
    this.structure.append(this.meshDots);
  }
  makeLinks() {
    const focused = document.activeElement?.dataset.id;
    this.ignoreFocus = true;
    this.links.replaceChildren();
    this.dotLayer.replaceChildren();
    this.edgeLayer.replaceChildren();
    this.entries = new Map();
    this.focused = this.data.some((n) => n.id === this.focused)
      ? this.focused
      : this.ordered[0]?.id || null;
    for (const item of this.ordered) {
      const a = document.createElement("button");
      a.className = "destination";
      a.type = "button";
      a.setAttribute("aria-controls", "project-detail");
      a.dataset.id = item.id;
      if (projectGroup(item)) a.dataset.group = item.group;
      a.setAttribute("aria-label", item.title);
      a.setAttribute("aria-description", [projectGroup(item)?.label, item.description].filter(Boolean).join(". "));
      a.tabIndex = this.fallback || item.id === this.focused ? 0 : -1;
      const label = document.createElement("span");
      label.className = "sr-only";
      label.textContent = item.title;
      a.append(label);
      this.links.append(a);
      const dot = svg("circle", { fill: "#E6ECF3", r: 2.475, "data-id": item.id });
      dot.classList.add("content-dot");
      this.dotLayer.append(dot);
      const ring = svg("circle", {
        fill: "none",
        stroke: "#ADB5C3",
        "stroke-width": 1,
        r: 5.5,
        visibility: "hidden",
      });
      this.dotLayer.append(ring);
      this.entries.set(item.id, { a, dot, ring });
    }
    this.coolEdges = svg("g");
    this.warmEdges = svg("g");
    this.edgeLayer.append(this.coolEdges, this.warmEdges);
    this.edgeElements = this.edges.map(([a, b]) => {
      const line = svg("line", { "stroke-width": 0.65, stroke: "#9CAEC8" });
      line.classList.add("real-edge");
      this.coolEdges.append(line);
      return { a, b, line };
    });
    if (focused && this.entries.size)
      this.entries
        .get(this.entries.has(focused) ? focused : this.focused)
        .a.focus({ preventScroll: true });
    this.ignoreFocus = false;
  }
  projectNode(id) {
    return this.projection(this.physics.position(id, this.positions.get(id)));
  }
  preparePhysics(initial = false) {
    if (this.inspecting) return;
    cancelAnimationFrame(this.physicsFrame);
    if (!this.active) return;
    this.physics.select(this.active, [
      ...this.data.map((item) => ({ id: item.id, ...this.positions.get(item.id) })),
      ...this.field.vertices,
    ], this.camera.scale, this.reduced.matches);
    if (initial && !this.reduced.matches)
      for (let i = 0; i < 120 && this.physics.step(1 / 60); i++);
    this.render();
    this.resumePhysics();
  }
  resumePhysics() {
    cancelAnimationFrame(this.physicsFrame);
    this.physicsFrame = null;
    if (this.inspecting) return;
    if (this.reduced.matches || this.cameraBusy || this.pointers.size || document.hidden) return;
    let previous = performance.now();
    const step = (now) => {
      const moving = this.physics.step(Math.min(0.04, (now - previous) / 1000));
      previous = now;
      this.render();
      if (moving) this.physicsFrame = requestAnimationFrame(step);
      else this.physicsFrame = null;
    };
    this.physicsFrame = requestAnimationFrame(step);
  }
  render() {
    if (!this.data || !this.field) return;
    const accent = projectAccent(this.data.find((item) => item.id === this.active));
    const z = this.camera.scale,
      zoomFactor = clamp((z - 0.65) / 0.35, 0, 1),
      contrast = this.contrast.matches;
    this.network.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    for (const base of document.querySelectorAll(".mask-base")) {
      base.setAttribute("width", this.width);
      base.setAttribute("height", this.height);
    }
    for (const mask of document.querySelectorAll("mask")) {
      mask.setAttribute("x", 0);
      mask.setAttribute("y", 0);
      mask.setAttribute("width", this.width);
      mask.setAttribute("height", this.height);
    }
    const bounds = {
      left: -160,
      right: this.width + 160,
      top: -160,
      bottom: this.height + 160,
    };
    this.meshPath.setAttribute(
      "d",
      this.field.edges
        .map(([a, b]) => {
          const p = this.projection(this.physics.position(a.id, a)),
            q = this.projection(this.physics.position(b.id, b));
          return inside(p, bounds) || inside(q, bounds)
            ? `M${p.x},${p.y}L${q.x},${q.y}`
            : "";
        })
        .join(""),
    );
    this.meshDots.setAttribute(
      "d",
      this.field.vertices
        .map((p) => {
          const q = this.projection(this.physics.position(p.id, p));
          return inside(q, bounds)
            ? `M${q.x - 1.03125},${q.y}a1.03125,1.03125 0 1,0 2.0625,0a1.03125,1.03125 0 1,0 -2.0625,0`
            : "";
        })
        .join(""),
    );
    this.meshPath.style.opacity = 0.052 * (0.75 + 0.25 * zoomFactor);
    this.meshDots.style.opacity = 0.22;
    this.structure.style.opacity = this.active ? 0.85 : 1;
    const neighbors = new Set(
      this.edges.filter((e) => e.includes(this.active)).flat(),
    );
    neighbors.delete(this.active);
    const activeEdgeOpacity =
      neighbors.size > 6
        ? Math.max(0.12, 0.32 / Math.sqrt(neighbors.size / 6))
        : 0.32;
    // Composite each color neighborhood once: overlapping true edges must not
    // accumulate into a bright flare at a high-degree hub.
    const edgeZoom = 0.85 + 0.15 * zoomFactor,
      coolOpacity = this.active ? 0.1 : 0.15;
    this.coolEdges.style.opacity = contrast ? 1 : coolOpacity * edgeZoom;
    this.warmEdges.style.opacity = contrast ? 1 : activeEdgeOpacity * edgeZoom;
    const clearance = [];
    for (const item of this.data) {
      const { a, dot, ring } = this.entries.get(item.id),
        p = this.projectNode(item.id);
      const hidden = this.occluded(p),
        off =
          p.x < -24 ||
          p.x > this.width + 24 ||
          p.y < -24 ||
          p.y > this.height + 24;
      const active = item.id === this.active,
        neighbor = neighbors.has(item.id);
      const proximity =
        !this.active && !this.cameraBusy && this.pointer && !this.coarse.matches
          ? Math.max(
              0,
              1 - Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y) / 36,
            )
          : 0;
      a.style.left = `${p.x}px`;
      a.style.top = `${p.y}px`;
      a.classList.toggle("occluded", hidden || off);
      a.style.zIndex = item.id === this.candidate ? "2" : "1";
      a.dataset.occluded = String(hidden || off);
      if (active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
      dot.setAttribute("cx", p.x);
      dot.setAttribute("cy", p.y);
      const normalRadius = (this.coarse.matches ? 1.9 : 1.8) * 1.375;
      dot.style.r = `${normalRadius * (1 + (this.physics.states.get(item.id)?.growth || 0))}px`;
      const opacityTime =
        this.active || performance.now() < (this.returningUntil || 0)
          ? 180
          : 100;
      dot.style.transitionDuration = this.reduced.matches
        ? "0s"
        : `${opacityTime}ms`;
      dot.style.fill = contrast
        ? active
          ? "Highlight"
          : "CanvasText"
        : projectGroup(item)?.color || (active ? accent : "#E6ECF3");
      dot.style.opacity = contrast
        ? 1
        : active
          ? 1
          : neighbor
            ? 0.95
            : this.active
              ? 0.65
              : 0.82 + 0.06 * proximity;
      dot.setAttribute("visibility", hidden || off ? "hidden" : "visible");
      ring.setAttribute("cx", p.x);
      ring.setAttribute("cy", p.y);
      ring.setAttribute("r", normalRadius * 2 + 2);
      ring.style.stroke = contrast ? "Highlight" : "#ADB5C3";
      ring.setAttribute(
        "visibility",
        !hidden && !off && this.keyboard && active ? "visible" : "hidden",
      );
      if (!off)
        clearance.push(
          svg("circle", { cx: p.x, cy: p.y, r: 10, fill: "black" }),
        );
    }
    this.clearance.replaceChildren(...clearance);
    for (const { a, b, line } of this.edgeElements) {
      const p = this.projectNode(a),
        q = this.projectNode(b),
        active = a === this.active || b === this.active;
      line.setAttribute("x1", p.x);
      line.setAttribute("y1", p.y);
      line.setAttribute("x2", q.x);
      line.setAttribute("y2", q.y);
      const prox =
        this.pointer && !this.active && !this.cameraBusy
          ? Math.max(
              0,
              1 -
                Math.min(
                  Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y),
                  Math.hypot(q.x - this.pointer.x, q.y - this.pointer.y),
                ) /
                  36,
            )
          : 0;
      const parent = active ? this.warmEdges : this.coolEdges;
      if (line.parentElement !== parent) parent.append(line);
      line.style.stroke = contrast
        ? active
          ? "Highlight"
          : "CanvasText"
        : active
          ? accent
          : "#9CAEC8";
      line.style.strokeWidth = active ? ".85px" : ".65px";
      line.style.opacity =
        contrast || active
          ? 1
          : (this.active ? 0.1 : 0.14 + 0.01 * prox) / coolOpacity;
    }
  }
  updateSupport() {
    this.support.textContent =
      this.owner === "touch"
        ? "Tap again to open."
        : this.keyboard
          ? "Arrows explore. [ / ] browse all. Enter opens."
          : this.demo
            ? "Demonstration data — local preview."
            : !this.data.some((item) => item.presentation !== "identity")
              ? "Work will appear here."
              : this.config.tagline;
    this.groupKey.hidden = !!this.support.textContent || !this.data.some((item) => projectGroup(item));
    // If enlarged text needs more room, allow native overflow instead of clipping.
    const footer = document.querySelector("footer");
    const naturalHeight = window.visualViewport?.height || innerHeight;
    const centerExtent = this.type.bounds.bottom - this.height * 0.49;
    const min = Math.max(240, (centerExtent + footer.offsetHeight + 48) / 0.51);
    this.root.style.minHeight = `${Math.ceil(min)}px`;
    this.surface.style.touchAction =
      min > naturalHeight ? "pan-y pinch-zoom" : "none";
  }
  cancelDwell() {
    clearTimeout(this.visualTimer);
    clearTimeout(this.textTimer);
    clearTimeout(this.leaveTimer);
    this.candidate = null;
  }
  select(id, owner, showText = true) {
    if (this.inspecting) return;
    if (!this.entries.has(id)) return;
    const changed = this.active !== id || this.owner !== owner;
    const selectionChanged = this.active !== id;
    this.active = id;
    this.owner = owner;
    if (selectionChanged) this.preparePhysics();
    if (showText) this.type.show(this.data.find((n) => n.id === id));
    this.updateSupport();
    this.render();
    if (showText && changed && (owner === "keyboard" || owner === "touch")) {
      const n = this.data.find((n) => n.id === id);
      this.announcement.textContent = `${n.title}. ${n.description}`;
    }
  }
  clearPreview(immediate = false) {
    if (this.inspecting) return;
    this.cancelDwell();
    // Release input ownership, never the persistent selected content.
    this.owner = null;
    this.updateSupport();
    this.render();
    this.flush();
  }
  hover(p) {
    if (this.inspecting) return;
    if (this.cameraBusy || this.pointers.size || this.owner === "touch") return;
    const id = acquire(
      this.visiblePoints,
      p,
      12,
      this.candidate || this.active,
    );
    if (this.keyboard && (!id || id === this.active)) return;
    if (id === this.candidate) {
      if (id) clearTimeout(this.leaveTimer);
      return;
    }
    clearTimeout(this.visualTimer);
    clearTimeout(this.textTimer);
    this.candidate = id;
    if (id) {
      clearTimeout(this.leaveTimer);
      if (id === this.active) {
        this.render();
        return;
      }
      this.visualTimer = setTimeout(() => {
        if (this.candidate === id) {
          this.keyboard = false;
          this.select(id, "pointer");
        }
      }, 90);
    } else this.flush();
    this.render();
  }
  local(event) {
    const b = this.root.getBoundingClientRect();
    return { x: event.clientX - b.left, y: event.clientY - b.top };
  }
  clampCamera(camera) {
    const b = this.worldBounds,
      z = camera.scale,
      mx = this.width * 0.25,
      my = this.height * 0.25;
    return {
      ...camera,
      x: clamp(
        camera.x,
        mx - this.width / 2 - b.right * z,
        this.width - mx - this.width / 2 - b.left * z,
      ),
      y: clamp(
        camera.y,
        my - this.height / 2 - b.bottom * z,
        this.height - my - this.height / 2 - b.top * z,
      ),
    };
  }
  animateCamera(target, duration) {
    cancelAnimationFrame(this.cameraFrame);
    target = this.clampCamera(target);
    if (this.reduced.matches || !duration) {
      this.camera = target;
      this.render();
      this.saveCamera();
      return;
    }
    const from = { ...this.camera },
      start = performance.now();
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1),
        p = ease(t);
      this.camera = {
        x: from.x + (target.x - from.x) * p,
        y: from.y + (target.y - from.y) * p,
        scale: from.scale + (target.scale - from.scale) * p,
      };
      this.render();
      if (t < 1) this.cameraFrame = requestAnimationFrame(step);
      else this.saveCamera();
    };
    this.cameraFrame = requestAnimationFrame(step);
  }
  zoom(factor, anchor, duration = 0) {
    const before = this.world(anchor),
      scale = clamp(this.camera.scale * factor, 0.65, 2.4);
    this.animateCamera(
      {
        scale,
        x: anchor.x - this.width / 2 - before.x * scale,
        y: anchor.y - this.height / 2 - before.y * scale,
      },
      duration,
    );
  }
  beginCamera() {
    cancelAnimationFrame(this.cameraFrame);
    cancelAnimationFrame(this.physicsFrame);
    this.cameraBusy = true;
    this.clearPreview(true);
    this.pointer = null;
  }
  endCamera(delay = 120) {
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.cameraBusy = false;
      this.flush();
      this.preparePhysics();
      if (this.pointer && !this.coarse.matches) this.hover(this.pointer);
    }, delay);
    this.saveCamera();
  }
  recover(id, duration = 160) {
    const p = this.projectNode(id);
    let target = {
      x: clamp(p.x, 48, this.width - 48),
      y: clamp(p.y, 48, this.height - 48),
    };
    for (const b of this.occlusionBoxes())
      if (inside(target, b)) {
        const exits = [
          { x: b.left - 1, y: target.y },
          { x: b.right + 1, y: target.y },
          { x: target.x, y: b.top - 1 },
          { x: target.x, y: b.bottom + 1 },
        ]
          .filter(
            (q) =>
              q.x >= 48 &&
              q.x <= this.width - 48 &&
              q.y >= 48 &&
              q.y <= this.height - 48,
          )
          .sort(
            (a, b) =>
              Math.hypot(a.x - p.x, a.y - p.y) -
              Math.hypot(b.x - p.x, b.y - p.y),
          );
        if (exits.length) target = exits[0];
      }
    this.animateCamera(
      {
        ...this.camera,
        x: this.camera.x + target.x - p.x,
        y: this.camera.y + target.y - p.y,
      },
      duration,
    );
  }
  focusItem(id) {
    if (!id) return;
    this.cancelDwell();
    this.keyboard = true;
    this.focused = id;
    for (const [key, { a }] of this.entries) a.tabIndex = key === id ? 0 : -1;
    this.select(id, "keyboard");
    this.recover(id);
    this.ignoreFocus = true;
    this.entries.get(id).a.focus({ preventScroll: true });
    this.ignoreFocus = false;
    // The new preview can have a larger envelope than the identity.
    clearTimeout(this.recoveryTimer);
    this.recoveryTimer = setTimeout(
      () => {
        if (this.keyboard && this.focused === id) this.recover(id);
      },
      this.reduced.matches ? 0 : 205,
    );
  }
  events() {
    this.surface.addEventListener("pointermove", (event) => {
      const p = this.local(event);
      this.pointer = p;
      if (this.pointers.has(event.pointerId))
        this.pointers.set(event.pointerId, p);
      if (this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()],
          centroid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (!this.pinch) return;
        const scale = clamp(
          (this.pinch.scale * distance) / this.pinch.distance,
          0.65,
          2.4,
        );
        this.camera = this.clampCamera({
          scale,
          x: centroid.x - this.width / 2 - this.pinch.world.x * scale,
          y: centroid.y - this.height / 2 - this.pinch.world.y * scale,
        });
        this.render();
        return;
      }
      if (this.down && this.pointers.has(event.pointerId)) {
        const dx = p.x - this.down.start.x,
          dy = p.y - this.down.start.y;
        if (!this.dragged && Math.hypot(dx, dy) > (this.down.touch ? 8 : 5)) {
          this.dragged = true;
          this.beginCamera();
          this.surface.classList.add("dragging");
          this.surface.setPointerCapture(event.pointerId);
        }
        if (this.dragged) {
          this.camera = this.clampCamera({
            ...this.down.camera,
            x: this.down.camera.x + dx,
            y: this.down.camera.y + dy,
          });
          this.render();
        }
        return;
      }
      if (event.pointerType === "touch") return;
      if (
        this.cameraBusy &&
        this.lastRelease &&
        Math.hypot(p.x - this.lastRelease.x, p.y - this.lastRelease.y) >= 3
      ) {
        clearTimeout(this.resumeTimer);
        this.cameraBusy = false;
        this.lastRelease = null;
      }
      this.hover(p);
      this.render();
    });
    this.surface.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      cancelAnimationFrame(this.physicsFrame);
      const p = this.local(event);
      this.pointers.set(event.pointerId, p);
      this.pointer = p;
      this.pointerFocus = true;
      const touch =
        event.pointerType === "touch" ||
        (event.pointerType === "pen" &&
          !matchMedia("(any-hover: hover)").matches);
      if (this.pointers.size === 1) {
        this.down = {
          start: p,
          camera: { ...this.camera },
          touch,
          id: acquire(this.visiblePoints, p, touch ? 22 : 12),
        };
        this.dragged = false;
        this.hadPinch = false;
      } else if (this.pointers.size === 2) {
        this.beginCamera();
        this.hadPinch = true;
        this.dragged = true;
        const [a, b] = [...this.pointers.values()],
          centroid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        this.pinch = {
          world: this.world(centroid),
          scale: this.camera.scale,
          distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        };
      }
      this.cancelDwell();
    });
    this.surface.addEventListener("pointerup", (event) => {
      if (!this.pointers.has(event.pointerId)) return;
      const p = this.local(event),
        down = this.down;
      this.pointers.delete(event.pointerId);
      this.pointerFocus = false;
      if (this.pointers.size) {
        const remaining = [...this.pointers.values()][0];
        this.down = {
          start: remaining,
          camera: { ...this.camera },
          touch: true,
        };
        this.pinch = null;
        return;
      }
      this.surface.classList.remove("dragging");
      this.pinch = null;
      this.down = null;
      if (this.dragged || this.hadPinch) {
        this.blockClickUntil = performance.now() + 400;
        this.lastRelease = p;
        if (down?.touch) this.pointer = null;
        this.endCamera();
        return;
      }
      const id = acquire(this.visiblePoints, p, down?.touch ? 22 : 12);
      if (down?.touch) {
        this.blockClickUntil = performance.now() + 700;
        if (id && id === down.id) {
          if (this.owner === "touch" && this.active === id) {
            this.saveCamera();
            this.entries.get(id).a.click();
          } else {
            this.keyboard = false;
            this.select(id, "touch");
          }
        } else this.clearPreview();
      }
      this.flush();
      this.resumePhysics();
    });
    const cancel = () => {
      if (this.inspecting) return;
      this.pointers.clear();
      this.down = null;
      this.pinch = null;
      this.surface.classList.remove("dragging");
      this.pointer = null;
      this.clearPreview(true);
      this.endCamera();
    };
    this.surface.addEventListener("pointercancel", cancel);
    this.surface.addEventListener("pointerleave", () => {
      if (!this.pointers.size && this.owner === "pointer") {
        this.pointer = null;
        this.clearPreview();
      }
    });
    this.surface.addEventListener("click", (event) => {
      const anchor = event.target.closest(".destination");
      // Native button activation after a second touch tap is allowed.
      if (event.isTrusted && performance.now() < (this.blockClickUntil || 0)) {
        event.preventDefault();
        return;
      }
      if (!anchor) {
        if (event.detail && !this.down && !this.dragged) {
          const id = acquire(
            this.visiblePoints,
            this.local(event),
            this.coarse.matches ? 22 : 12,
            this.active,
          );
          if (id) {
            event.preventDefault();
            this.entries
              .get(id)
              .a.dispatchEvent(
                new MouseEvent("click", {
                  bubbles: true,
                  cancelable: true,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  shiftKey: event.shiftKey,
                }),
              );
          }
        }
        return;
      }
      const id = event.detail && !this.fallback
        ? acquire(
            this.visiblePoints,
            this.local(event),
            this.coarse.matches ? 22 : 12,
            this.active,
          )
        : anchor.dataset.id;
      if (!id) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const selected = this.active === id;
      if (!selected) this.select(id, this.keyboard ? "keyboard" : "pointer");
      this.saveCamera();
      if (selected || this.fallback)
        this.onInspect?.(this.data.find((item) => item.id === id), anchor);
    });
    this.surface.addEventListener("auxclick", () => this.saveCamera());
    this.surface.addEventListener(
      "wheel",
      (event) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          this.fallback ||
          document.documentElement.scrollHeight > innerHeight + 2
        )
          return;
        const p = this.local(event);
        if (acquire(this.visiblePoints, p, this.coarse.matches ? 22 : 12))
          return;
        const delta =
            event.deltaY *
            (event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? this.height
                : 1),
          factor = Math.exp(
            clamp(
              (-delta * Math.log(1.1)) / 100,
              -Math.log(1.15),
              Math.log(1.15),
            ),
          );
        if (
          (this.camera.scale <= 0.65 && factor < 1) ||
          (this.camera.scale >= 2.4 && factor > 1)
        )
          return;
        event.preventDefault();
        this.beginCamera();
        this.zoom(factor, p);
        this.pointer = p;
        this.lastRelease = null;
        this.endCamera();
      },
      { passive: false },
    );
    this.surface.addEventListener("focusin", (event) => {
      if (
        this.ignoreFocus ||
        this.pointerFocus ||
        this.owner === "touch" ||
        this.fallback
      )
        return;
      if (event.target.matches(".destination"))
        this.focusItem(event.target.dataset.id);
    });
    this.surface.addEventListener("focusout", (event) => {
      if (this.inspecting) return;
      if (!this.ignoreFocus && !this.surface.contains(event.relatedTarget)) {
        this.keyboard = false;
        this.focused = this.ordered[0]?.id || null;
        for (const [id, { a }] of this.entries)
          a.tabIndex = id === this.focused ? 0 : -1;
        this.clearPreview();
      }
    });
    this.surface.addEventListener("keydown", (event) => {
      if (this.fallback || event.ctrlKey || event.metaKey || event.altKey)
        return;
      const key = event.key;
      if (key === "Tab") return;
      if (key === "Escape") {
        event.preventDefault();
        this.clearPreview();
        this.keyboard = true;
        this.updateSupport();
        return;
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "[", "]"].includes(
          key,
        )
      ) {
        event.preventDefault();
        let id;
        if (key === "[" || key === "]") {
          const i = this.ordered.findIndex((n) => n.id === this.focused);
          id =
            this.ordered[
              (i + (key === "]" ? 1 : -1) + this.ordered.length) %
                this.ordered.length
            ]?.id;
        } else id = directional(this.points, this.focused, key);
        this.focusItem(id);
        return;
      }
      if (["+", "=", "-", "−", "Home"].includes(key)) {
        event.preventDefault();
        this.beginCamera();
        if (key === "Home") this.animateCamera({ x: 0, y: 0, scale: 1 }, 180);
        else {
          const p = this.positions.has(this.focused) ? this.projectNode(this.focused) : null;
          if (p)
            this.zoom(
              key === "-" || key === "−" ? 1 / 1.15 : 1.15,
              p,
            );
        }
        this.endCamera();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.owner === "touch") this.clearPreview();
    });
    window.addEventListener("blur", () => {
      this.keyboard = false;
      cancel();
    });
    window.addEventListener("pagehide", () => this.saveCamera());
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        this.keyboard = false;
        this.clearPreview(true);
        this.restoreCamera();
        this.render();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancel();
    });
  }
  resize(allowInspect = false) {
    if (this.inspecting && !allowInspect) return;
    const width = this.root.clientWidth,
      height = this.root.clientHeight;
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.makeStructure();
    this.type.layout();
    this.camera = this.clampCamera(this.camera);
    this.preparePhysics();
    this.render();
  }
  saveCamera() {
    try {
      sessionStorage.setItem(
        `portfolio-camera:${this.demo ? "demo" : "real"}`,
        JSON.stringify(this.camera),
      );
    } catch {
      /* Storage may be unavailable; navigation still works. */
    }
  }
  restoreCamera() {
    try {
      if (
        performance.getEntriesByType("navigation")[0]?.type === "back_forward"
      ) {
        const saved = JSON.parse(
          sessionStorage.getItem(
            `portfolio-camera:${this.demo ? "demo" : "real"}`,
          ),
        );
        if (saved && [saved.x, saved.y, saved.scale].every(Number.isFinite))
          this.camera = this.clampCamera({
            ...saved,
            scale: clamp(saved.scale, 0.65, 2.4),
          });
      }
    } catch {
      /* Initial camera is the safe fallback. */
    }
  }
  enableFallback() {
    this.fallback = true;
    this.root.classList.add("fallback");
    for (const { a } of this.entries.values()) a.tabIndex = 0;
    this.clearPreview(true);
  }
  inspect() {
    return {
      camera: { ...this.camera },
      active: this.active,
      owner: this.owner,
      focused: this.focused,
      fieldDensity: this.config.fieldDensity,
      points: this.points,
      visible: this.visiblePoints,
      positions: Object.fromEntries(this.positions),
      offsets: Object.fromEntries(this.physics.states),
      physicsRunning: !!this.physicsFrame,
      fieldBounds: this.fieldBounds,
      worldBounds: this.worldBounds,
      structuralPoints: this.field.vertices
        .map((p) => ({ id: p.id, ...this.projection(this.physics.position(p.id, p)) }))
        .filter((p) => inside(p, { left: 0, right: this.width, top: 0, bottom: this.height })),
      edges: this.edges,
      structuralVertices: this.field.vertices.length,
      visibleStructuralVertices: this.field.vertices.filter((p) =>
        inside(this.projection(p), {
          left: 0,
          right: this.width,
          top: 0,
          bottom: this.height,
        }),
      ).length,
      titleBounds: this.type.titleBounds,
      centerBounds: this.type.bounds,
      pending: !!this.pendingData,
    };
  }
}
