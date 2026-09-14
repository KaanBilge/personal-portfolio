import { damp } from "./physics.js";
const NS = "http://www.w3.org/2000/svg";
export class Typography {
  constructor(onChange) {
    this.title = document.querySelector("#center-title");
    this.description = document.querySelector("#center-description");
    this.group = document.querySelector("#center-content");
    this.mask = document.querySelector("#type-mask-text");
    this.svg = document.querySelector("#editorial");
    this.ctx = document.createElement("canvas").getContext("2d");
    this.onChange = onChange;
    this.item = null;
    this.pending = null;
    this.phase = null;
    this.opacity = 1;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");
    this.pointer = null;
    this.glyphs = [];
    const root = document.querySelector("#portfolio");
    root.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || event.buttons || this.reduced.matches) return;
      const rect = root.getBoundingClientRect();
      this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      this.respond();
    });
    const release = () => { this.pointer = null; this.respond(); };
    root.addEventListener("pointerleave", release);
    root.addEventListener("pointerdown", release);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.resetGlyphs();
    });
    this.reduced.addEventListener("change", () => {
      if (this.reduced.matches) {
        this.resetGlyphs();
        cancelAnimationFrame(this.frame);
        this.phase = null;
        this.item = this.pending;
        this.opacity = 1;
        this.layout();
      }
    });
  }
  measure(text, size, family, tracking = 0, wordSpacing = 0) {
    this.ctx.font = `400 ${size}px "${family}", ${family === "STIX Two Text" ? "Georgia, serif" : "sans-serif"}`;
    this.ctx.fontKerning = "normal";
    this.ctx.letterSpacing = `${tracking}px`;
    this.ctx.wordSpacing = `${wordSpacing}px`;
    return this.ctx.measureText(text);
  }
  lines(text, size, family, width, tracking, space) {
    if (
      this.measure(text, size, family, tracking, space).width - tracking <=
      width
    )
      return [text];
    const words = text.split(/\s+/),
      lines = [];
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (
        line &&
        this.measure(trial, size, family, tracking, space).width - tracking >
          width
      ) {
        lines.push(line);
        line = word;
      } else line = trial;
      if (
        this.measure(line, size, family, tracking, space).width - tracking >
        width
      ) {
        let part = "";
        for (const letter of line) {
          if (
            part &&
            this.measure(part + letter, size, family, tracking, space).width -
              tracking >
              width
          ) {
            lines.push(part);
            part = "";
          }
          part += letter;
        }
        line = part;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  drawText(element, lines, size, tracking, space, baseline, lineHeight, color) {
    element.replaceChildren();
    element.style.fontSize = `${size}px`;
    element.style.letterSpacing = `${tracking}px`;
    element.style.wordSpacing = `${space}px`;
    element.style.fill = color;
    const family = element === this.title ? "STIX Two Text" : "Source Sans 3";
    lines.forEach((line, index) => {
      const span = document.createElementNS(NS, "tspan");
      span.textContent = line;
      const width =
        this.measure(line, size, family, tracking, space).width - tracking;
      span.setAttribute("x", (this.width - width) / 2);
      span.setAttribute("y", baseline + index * lineHeight);
      element.append(span);
    });
  }
  layout() {
    if (this.suspended) return;
    this.resetGlyphs();
    this.width = document.querySelector("#portfolio").clientWidth;
    this.height = document.querySelector("#portfolio").clientHeight;
    this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.title.style.fontSize = "";
    const preview = !!this.item && this.item.presentation !== "identity";
    this.title.classList.toggle("preview", preview);
    const narrow = this.width < 600,
      margin = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--inset"),
      );
    const maxWidth = Math.min(
        preview ? 720 : Infinity,
        this.width - 2 * margin,
      ),
      titleText = this.item?.presentation === "identity"
        ? this.item.title.toUpperCase() : this.item?.title || "KAAN BILGE";
    let size = parseFloat(getComputedStyle(this.title).fontSize),
      tracking =
        size *
        (preview ? 0.035 : this.width <= 360 ? 0.04 : narrow ? 0.055 : 0.085);
    let space =
      size * 0.46 - this.measure(" ", size, "STIX Two Text").width - tracking;
    if (preview) {
      const min =
        ((narrow ? 26 : 42) *
          parseFloat(getComputedStyle(document.documentElement).fontSize)) /
        16;
      while (
        size > min &&
        this.measure(titleText, size, "STIX Two Text", tracking, space).width -
          tracking >
          maxWidth
      ) {
        size = Math.max(min, size - 1);
        tracking = size * 0.035;
        space =
          size * 0.46 -
          this.measure(" ", size, "STIX Two Text").width -
          tracking;
      }
    }
    const lines = this.lines(
      titleText,
      size,
      "STIX Two Text",
      maxWidth,
      tracking,
      space,
    );
    const large = this.measure(titleText, 1000, "STIX Two Text"),
      largeCap = this.measure("H", 1000, "STIX Two Text");
    const metrics = {
        actualBoundingBoxDescent:
          (large.actualBoundingBoxDescent * size) / 1000,
      },
      cap = {
        actualBoundingBoxAscent:
          (largeCap.actualBoundingBoxAscent * size) / 1000,
      };
    // Center by capital ink rather than the font's ascender/descender line box.
    const lineHeight =
      size * (preview ? (narrow ? 1.15 : 1.12) : narrow ? 1.08 : 1.05);
    const inkHeight =
      cap.actualBoundingBoxAscent + (lines.length - 1) * lineHeight;
    const top = this.height * 0.49 - inkHeight / 2,
      baseline = top + cap.actualBoundingBoxAscent;
    this.drawText(
      this.title,
      lines,
      size,
      tracking,
      space,
      baseline,
      lineHeight,
      preview ? "#D4DBE5" : "#ADB5C3",
    );
    let bottom =
        baseline +
        (lines.length - 1) * lineHeight +
        Math.max(0, metrics.actualBoundingBoxDescent),
      descriptionWidth = 0;
    const titleWidth = Math.max(
      ...lines.map(
        (line) =>
          this.measure(line, size, "STIX Two Text", tracking, space).width -
          tracking,
      ),
    );
    this.titleBounds = {
      left: (this.width - titleWidth) / 2,
      right: (this.width + titleWidth) / 2,
      top,
      bottom,
    };
    this.description.replaceChildren();
    this.description.style.fontSize = "";
    if (this.item) {
      const descSize = parseFloat(getComputedStyle(this.description).fontSize),
        descLine = descSize * (narrow ? 20 / 14 : 22 / 15);
      const descLines = this.lines(
        this.item.description,
        descSize,
        "Source Sans 3",
        Math.min(560, this.width - 2 * margin),
        0,
        0,
      );
      descriptionWidth = Math.max(
        ...descLines.map(
          (line) => this.measure(line, descSize, "Source Sans 3").width,
        ),
      );
      const dm = this.measure(this.item.description, descSize, "Source Sans 3");
      const descTop = bottom + (narrow ? 16 : 20),
        descBase = descTop + dm.actualBoundingBoxAscent;
      this.drawText(
        this.description,
        descLines,
        descSize,
        0,
        0,
        descBase,
        descLine,
        "#8994A5",
      );
      bottom =
        descBase +
        dm.actualBoundingBoxDescent +
        (descLines.length - 1) * descLine;
    }
    const envelopeWidth = Math.max(titleWidth, descriptionWidth);
    this.bounds = {
      left: (this.width - envelopeWidth) / 2,
      right: (this.width + envelopeWidth) / 2,
      top,
      bottom,
    };
    this.svg.setAttribute(
      "aria-label",
      this.item ? `${this.item.title}. ${this.item.description}` : "Kaan Bilge",
    );
    // Keep full lines as real text. Per-character SVG offsets preserve the
    // original shaping, spacing, text selection and exact resting positions.
    this.glyphs = [...this.title.children].map((line) => ({
      line,
      letters: Array.from({ length: line.getNumberOfChars() }, (_, i) => {
        const box = line.getExtentOfChar(i);
        return {
          cx: box.x + box.width / 2, cy: box.y + box.height / 2,
          reach: Math.max(54, size * 0.9),
          x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0,
          tx: 0, ty: 0, tr: 0,
        };
      }),
    }));
    this.syncMask();
    this.respond();
    this.onChange?.();
  }
  resetGlyphs() {
    cancelAnimationFrame(this.glyphFrame);
    this.glyphFrame = null;
    for (const { line } of this.glyphs || [])
      for (const attribute of ["dx", "dy", "rotate"]) line.removeAttribute(attribute);
    this.glyphs = [];
  }
  respond() {
    if (this.suspended) return;
    if (this.reduced.matches || document.hidden) return;
    let needed = false;
    for (const { letters } of this.glyphs) for (const glyph of letters) {
      const dx = this.pointer ? glyph.cx - this.pointer.x : 0;
      const dy = this.pointer ? glyph.cy - this.pointer.y : 0;
      const distance = Math.hypot(dx, dy);
      const proximity = this.pointer ? Math.max(0, 1 - distance / glyph.reach) : 0;
      const weight = proximity * proximity * (3 - 2 * proximity);
      glyph.tx = 2.5 * weight * dx / Math.max(18, distance);
      glyph.ty = weight * (1.8 * dy / Math.max(18, distance) - 0.9);
      glyph.tr = 1.6 * weight * dx / Math.max(18, distance);
      needed ||= glyph.x !== glyph.tx || glyph.y !== glyph.ty || glyph.r !== glyph.tr;
    }
    if (!needed || this.glyphFrame) return;
    let previous = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.04, (now - previous) / 1000);
      previous = now;
      let moving = false;
      for (const { line, letters } of this.glyphs) {
        const dx = [], dy = [], rotation = [];
        let lastX = 0, lastY = 0;
        for (const glyph of letters) {
          [glyph.x, glyph.vx] = damp(glyph.x, glyph.vx, glyph.tx, dt, 23);
          [glyph.y, glyph.vy] = damp(glyph.y, glyph.vy, glyph.ty, dt, 23);
          [glyph.r, glyph.vr] = damp(glyph.r, glyph.vr, glyph.tr, dt, 23);
          // SVG offsets accumulate through a line; compensate the prior glyph.
          dx.push(glyph.x - lastX); dy.push(glyph.y - lastY); rotation.push(glyph.r);
          lastX = glyph.x; lastY = glyph.y;
          moving ||= glyph.x !== glyph.tx || glyph.y !== glyph.ty || glyph.r !== glyph.tr;
        }
        if (letters.every((glyph) => !glyph.x && !glyph.y && !glyph.r)) {
          for (const attr of ["dx", "dy", "rotate"]) line.removeAttribute(attr);
        } else {
          line.setAttribute("dx", dx.join(" "));
          line.setAttribute("dy", dy.join(" "));
          line.setAttribute("rotate", rotation.join(" "));
        }
      }
      this.syncMask();
      this.glyphFrame = moving ? requestAnimationFrame(frame) : null;
    };
    this.glyphFrame = requestAnimationFrame(frame);
  }
  syncMask() {
    this.group.style.opacity = this.opacity;
    this.mask.replaceChildren();
    for (const source of [this.title, this.description]) {
      const clone = source.cloneNode(true);
      clone.removeAttribute("id");
      clone.setAttribute(
        "class",
        source === this.title
          ? `title-mask${this.title.classList.contains("preview") ? " preview" : ""}`
          : "description-mask",
      );
      clone.style.fill = "black";
      clone.style.opacity = this.opacity;
      clone.setAttribute("aria-hidden", "true");
      this.mask.append(clone);
    }
  }
  show(item, immediate = false) {
    if (this.suspended) return;
    this.pending = item;
    if (this.reduced.matches || immediate) {
      cancelAnimationFrame(this.frame);
      this.phase = null;
      this.item = item;
      this.opacity = 1;
      this.layout();
      return;
    }
    if (this.item?.id === item?.id && !this.phase &&
        this.item?.title === item?.title && this.item?.description === item?.description) return;
    if (this.phase === "out") return; // Keep only the latest candidate; never queue titles.
    cancelAnimationFrame(this.frame);
    this.phase = "out";
    const start = performance.now(),
      from = this.opacity;
    const out = (now) => {
      const p = Math.min(1, (now - start) / 70);
      this.opacity = from * (1 - p * p);
      this.syncMask();
      if (p < 1) this.frame = requestAnimationFrame(out);
      else {
        this.item = this.pending;
        this.opacity = 0;
        this.layout();
        this.phase = "in";
        const began = performance.now();
        const inside = (time) => {
          const t = Math.min(1, (time - began) / 130);
          this.opacity = 1 - (1 - t) ** 3;
          this.syncMask();
          if (t < 1) this.frame = requestAnimationFrame(inside);
          else {
            this.phase = null;
            this.onChange?.();
          }
        };
        this.frame = requestAnimationFrame(inside);
      }
    };
    this.frame = requestAnimationFrame(out);
  }
}
