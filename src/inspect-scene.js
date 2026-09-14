import { ProjectDetail } from "./project-detail.js";
import { InspectBackground } from "./inspect-background.js";

const interpolate = (a, b, p) => a + (b - a) * p;
// A single, symmetric 800ms movement, with no overshoot or inertia.
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export class InspectScene {
  constructor(graph) {
    this.graph = graph;
    this.type = graph.type;
    this.stage = document.querySelector("#scenes");
    this.track = document.querySelector("#scene-track");
    this.root = document.querySelector("#project-detail");
    this.handle = document.querySelector("#inspect-handle");
    this.overlay = document.querySelector("#travel-title");
    this.detail = new ProjectDetail(this.root);
    this.background = new InspectBackground(graph, this.track);
    this.progress = 0;
    this.target = 0;
    this.handle.hidden = false;
    this.handle.addEventListener("click", () => {
      if (this.target) this.close();
      else if (graph.inspecting) this.animate(1);
      else this.open(graph.data.find((item) => item.id === graph.active), this.handle);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && graph.inspecting) {
        event.preventDefault();
        this.close();
      }
    });
    graph.reduced.addEventListener("change", () => {
      if (this.frame) this.finish(this.target);
      this.detail.setPlaying(!!this.target, graph.reduced.matches);
    });
    document.addEventListener("visibilitychange", () => {
      this.detail.setPlaying(!!this.target && !document.hidden, graph.reduced.matches);
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(graph.root);
    this.root.addEventListener("scroll", () => {
      if (!graph.inspecting || this.readabilityFrame) return;
      this.readabilityFrame = requestAnimationFrame(() => {
        this.readabilityFrame = null;
        this.background.softenBehindText(this.root, this.box.width * this.scale);
      });
    }, { passive: true });
  }

  open(item, opener) {
    if (!item || this.graph.inspecting) return;
    const graph = this.graph;
    this.item = item;
    this.opener = opener;
    this.saved = { owner: graph.owner, keyboard: graph.keyboard, focused: graph.focused };
    graph.inspecting = true;
    graph.cancelDwell();
    for (const timer of ["resumeTimer", "recoveryTimer"]) clearTimeout(graph[timer]);
    cancelAnimationFrame(graph.cameraFrame);
    cancelAnimationFrame(graph.physicsFrame);
    graph.physicsFrame = null;
    graph.cameraBusy = false;
    graph.pointer = null;
    this.type.show(item, true);
    this.type.pointer = null;
    this.type.resetGlyphs();
    this.type.syncMask();
    this.type.suspended = true;
    this.background.refresh();
    this.detail.render(item);
    this.stage.style.height = `${graph.root.offsetHeight}px`;
    this.track.style.height = `${graph.root.offsetHeight}px`;
    this.captureTitle();
    this.measureTarget();
    this.background.softenBehindText(this.root, this.box.width * this.scale);
    graph.root.inert = true;
    graph.root.setAttribute("aria-hidden", "true");
    this.handle.focus({ preventScroll: true });
    this.animate(1);
  }

  captureTitle() {
    const title = this.type.title;
    title.removeAttribute("transform");
    this.lines = [...title.children].map((node) => ({ node, x: +node.getAttribute("x") }));
    const left = Math.min(...this.lines.map((line) => line.x));
    for (const line of this.lines) line.node.setAttribute("x", left);
    const box = title.getBBox();
    this.box = { x: box.x, y: box.y, width: box.width, height: box.height };
    this.left = left;
    for (const line of this.lines) line.node.setAttribute("x", line.x);
    this.overlay.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
  }

  measureTarget() {
    const host = this.detail.titleHost;
    const width = this.detail.heading.clientWidth;
    const size = parseFloat(getComputedStyle(this.type.title).fontSize);
    const desired = parseFloat(getComputedStyle(this.detail.heading).fontSize);
    this.scale = Math.min(desired / size, (width - 2) / this.box.width);
    const height = Math.ceil(this.box.height * this.scale + 2);
    host.style.height = `${height}px`;
    host.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const rect = host.getBoundingClientRect();
    // Remove the track's current translation and the lower scene's offset.
    this.end = {
      x: rect.left - this.box.x * this.scale,
      y: rect.top - this.graph.root.offsetHeight * (1 - this.progress) - this.box.y * this.scale + 1,
    };
    const hero = this.graph.root.getBoundingClientRect();
    this.start = { x: hero.left, y: hero.top + this.graph.root.offsetHeight * this.progress };
  }

  close() {
    if (!this.graph.inspecting || (!this.target && this.frame)) return;
    this.detail.setPlaying(false, true);
    if (!this.frame) {
      // A scrolled detail may put its heading above the viewport. Begin there;
      // the title travels back into view while the whole scene moves down.
      this.measureTarget();
    }
    this.animate(0);
  }

  animate(target) {
    cancelAnimationFrame(this.frame);
    this.target = target;
    this.root.inert = true;
    this.root.setAttribute("aria-hidden", "true");
    this.handle.setAttribute("aria-expanded", String(!!target));
    this.handle.setAttribute("aria-label", target ? "Return to graph" : "Inspect selected node");
    this.stage.dataset.scene = target ? "opening" : "returning";
    this.overlay.append(this.type.title);
    this.overlay.style.visibility = "visible";
    this.track.style.willChange = "transform";
    if (this.graph.reduced.matches) {
      // No large travel, title flight, or rotation animation in reduced motion.
      this.finish(target);
      return;
    }
    const from = this.progress;
    const start = performance.now();
    const duration = 800 * Math.abs(target - from);
    const step = (now) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      this.paint(interpolate(from, target, ease(t)));
      if (t < 1) this.frame = requestAnimationFrame(step);
      else this.finish(target);
    };
    this.frame = requestAnimationFrame(step);
  }

  paint(p) {
    this.progress = p;
    this.track.style.transform = `translateY(${-this.graph.root.offsetHeight * p}px)`;
    this.handle.firstElementChild.style.transform = `rotate(${180 * p}deg)`;
    this.type.description.style.opacity = Math.max(0, 1 - p * 3);
    this.detail.description.style.opacity = Math.max(0, (p - .35) / .65);
    const scale = interpolate(1, this.scale, p);
    const x = interpolate(this.start.x, this.end.x, p);
    const y = interpolate(this.start.y, this.end.y, p);
    this.type.title.setAttribute("transform", `matrix(${scale} 0 0 ${scale} ${x} ${y})`);
    for (const line of this.lines) line.node.setAttribute("x", interpolate(line.x, this.left, p));
  }

  finish(target) {
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.target = target;
    this.paint(target);
    this.track.style.willChange = "";
    this.overlay.style.visibility = "hidden";
    const graph = this.graph;
    if (target) {
      this.stage.dataset.scene = "detail";
      this.detail.titleHost.append(this.type.title);
      this.type.title.setAttribute("transform", `matrix(${this.scale} 0 0 ${this.scale} ${-this.box.x * this.scale} ${1 - this.box.y * this.scale})`);
      this.root.inert = false;
      this.root.removeAttribute("aria-hidden");
      this.detail.heading.focus({ preventScroll: true });
      this.detail.setPlaying(!document.hidden, graph.reduced.matches);
      this.background.softenBehindText(this.root, this.box.width * this.scale);
    } else {
      this.stage.dataset.scene = "graph";
      this.type.title.removeAttribute("transform");
      this.type.group.prepend(this.type.title);
      this.type.suspended = false;
      this.type.description.style.opacity = "";
      this.type.layout();
      graph.root.inert = false;
      graph.root.removeAttribute("aria-hidden");
      Object.assign(graph, this.saved);
      graph.ignoreFocus = true;
      const focus = this.opener?.isConnected ? this.opener : graph.entries.get(graph.active)?.a;
      focus?.focus({ preventScroll: true });
      graph.ignoreFocus = false;
      graph.inspecting = false;
      graph.resize();
      graph.render();
      graph.resumePhysics();
      this.root.scrollTop = 0;
      // Reconcile queued content after restoring the inspected node and focus.
      if (graph.pendingData) {
        const data = graph.pendingData;
        graph.pendingData = null;
        graph.setContent(data);
      }
    }
  }

  resize() {
    const height = this.graph.root.offsetHeight;
    this.stage.style.height = `${height}px`;
    this.track.style.height = `${height}px`;
    if (!this.graph.inspecting) return;
    this.graph.resize(true);
    this.background.refresh();
    const target = this.target;
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.type.group.prepend(this.type.title);
    this.type.title.removeAttribute("transform");
    this.type.suspended = false;
    this.type.layout();
    this.type.suspended = true;
    this.captureTitle();
    this.track.style.transform = `translateY(${-height * this.progress}px)`;
    this.measureTarget();
    this.finish(target);
  }
}

// Last-resort path for a construction failure (as distinct from the graph's
// normal textual renderer fallback). It still never exposes outbound nodes.
export function mountStaticInspect(data) {
  const hero = document.querySelector("#portfolio");
  const root = document.querySelector("#project-detail");
  const track = document.querySelector("#scene-track");
  const handle = document.querySelector("#inspect-handle");
  const detail = new ProjectDetail(root);
  const destinations = document.querySelector("#destinations");
  destinations.replaceChildren();
  let selected = data[0], opener = handle, opened = false;
  const toggle = () => {
    if (!selected) return;
    opened = !opened;
    if (opened) {
      detail.render(selected);
      detail.heading.querySelector(".sr-only").classList.remove("sr-only");
      detail.titleHost.remove();
    } else detail.setPlaying(false, true);
    hero.inert = opened;
    hero.setAttribute("aria-hidden", String(opened));
    root.inert = !opened;
    root.setAttribute("aria-hidden", String(!opened));
    track.style.transform = opened ? "translateY(-100%)" : "";
    document.querySelector("#scenes").dataset.scene = opened ? "detail" : "graph";
    handle.firstElementChild.style.transform = opened ? "rotate(180deg)" : "";
    handle.setAttribute("aria-expanded", String(opened));
    handle.setAttribute("aria-label", opened ? "Return to graph" : "Inspect selected node");
    (opened ? detail.heading : opener).focus({ preventScroll: true });
    if (opened) detail.setPlaying(true, matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
  for (const item of data) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "destination";
    button.textContent = item.title;
    button.addEventListener("click", () => { selected = item; opener = button; toggle(); });
    destinations.append(button);
  }
  handle.hidden = !selected;
  handle.addEventListener("click", () => { if (!opened) opener = handle; toggle(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && opened) { event.preventDefault(); toggle(); }
  });
}
