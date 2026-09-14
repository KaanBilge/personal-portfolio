import { validHref } from "./layout.js";
import { projectAccent, projectGroup } from "./project-groups.js";

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// The same small loose loop on every project, with a reversible, finite response.
export function createEasterEgg(options) {
  if (options === false) return null;
  const node = element("button", "detail-easter-egg");
  node.type = "button";
  node.setAttribute("aria-label", "Unwind the loop");
  node.setAttribute("aria-pressed", "false");
  node.innerHTML = `<svg viewBox="0 0 64 64" width="56" height="56" fill="none" aria-hidden="true"><g class="loop-thread">
    <path d="M48 16C35 6 12 20 17 39c4 16 27 13 31-2 4-14-9-25-19-17-10 8-5 23 4 21 7-1 9-10 3-13" />
    <circle cx="36" cy="28" r="2" /></g></svg>`;
  node.addEventListener("click", () => {
    const unwound = node.getAttribute("aria-pressed") !== "true";
    node.setAttribute("aria-pressed", String(unwound));
  });
  return node;
}

export class ProjectDetail {
  constructor(root) { this.root = root; }

  render(item) {
    this.media = null;
    this.animated = false;
    this.root.replaceChildren();
    this.root.dataset.project = item.id;
    this.page = element("article", "detail-page");
    this.page.style.setProperty("--project-accent", projectAccent(item));
    if (projectGroup(item)) this.page.dataset.group = item.group;
    const header = element("header", "detail-header");
    this.heading = element("h1", "detail-heading");
    this.heading.id = "project-heading";
    this.heading.tabIndex = -1;
    this.heading.append(element("span", "sr-only", item.title));
    this.titleHost = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.titleHost.classList.add("detail-title-host");
    this.titleHost.setAttribute("aria-hidden", "true");
    this.heading.append(this.titleHost);
    this.description = element("p", "detail-description", item.description);
    header.append(this.heading, this.description);

    const composition = element("div", "detail-composition");
    const figure = element("figure", "detail-figure");
    const mediaFrame = element("div", "detail-media");
    this.mediaFrame = mediaFrame;
    const media = typeof item.media === "string" ? { src: item.media } : item.media;
    const missing = () => {
      mediaFrame.replaceChildren(element("p", "media-unavailable", "Project media to follow."));
      mediaFrame.classList.add("is-placeholder");
    };
    if (media && validHref(media.src)) {
      const video = item.mediaType === "video";
      this.media = element(video ? "video" : "img", "project-visual");
      this.media.style.objectFit = media.fit === "cover" ? "cover" : "contain";
      this.media.addEventListener("error", missing, { once: true });
      if (video) {
        this.media.muted = true;
        this.media.defaultMuted = true;
        this.media.loop = true;
        this.media.playsInline = true;
        this.media.preload = "metadata";
        this.media.controls = true;
        this.media.setAttribute("aria-label", media.alt || `${item.title} project video`);
        if (validHref(media.poster)) this.media.poster = media.poster;
      } else {
        this.media.alt = media.alt || `${item.title} project image`;
        this.media.decoding = "async";
      }
      this.animated = item.mediaType === "animated";
      this.mediaData = media;
      if (!this.animated) this.media.src = media.src;
      mediaFrame.append(this.media);
      if (!video && !this.animated && validHref(media.companion?.src)) {
        const companion = element("img", "project-visual companion-visual");
        companion.src = media.companion.src;
        companion.alt = media.companion.alt || `${item.title}, another view`;
        companion.decoding = "async";
        companion.addEventListener("error", () => {
          companion.remove();
          mediaFrame.classList.remove("media-pair");
        }, { once: true });
        mediaFrame.classList.add("media-pair");
        mediaFrame.append(companion);
      }
      if (this.animated) {
        this.still = validHref(media.poster) ? element("img", "project-visual") : element("p", "media-unavailable", "Animated project image.");
        if (this.still.tagName === "IMG") {
          this.still.src = media.poster;
          this.still.alt = media.alt || `${item.title} animation preview`;
        }
        this.motionButton = element("button", "media-motion-toggle");
        this.motionButton.type = "button";
        this.motionButton.addEventListener("click", () => this.showAnimation(!this.animationRunning));
        mediaFrame.append(this.still, this.motionButton);
        this.showAnimation(!matchMedia("(prefers-reduced-motion: reduce)").matches);
      }
    } else missing();
    figure.append(mediaFrame);

    const aside = element("aside", "detail-aside");
    aside.setAttribute("aria-label", "Project information");
    const metadata = element("dl", "detail-metadata");
    for (const [label, value] of [
      ["Year", item.year], ["Type", [projectGroup(item)?.label, item.category || item.type].filter(Boolean).join(" / ")], ["Role", item.role],
      ["Tools", Array.isArray(item.technologies) ? item.technologies.join(", ") : item.technologies],
    ]) {
      if (value == null || value === "") continue;
      const pair = element("div");
      const valueNode = element("dd", "", String(value));
      if (label === "Type" && projectGroup(item)) valueNode.classList.add("group-type");
      pair.append(element("dt", "", label), valueNode);
      metadata.append(pair);
    }
    if (metadata.childElementCount) aside.append(metadata);
    const links = element("nav", "detail-links");
    links.setAttribute("aria-label", "Project destinations");
    for (const [label, href] of [["Visit project", item.url || item.href], ["GitHub", item.githubUrl]]) {
      if (!validHref(href)) continue;
      const link = element("a", "", label);
      const linkLabel = element("span", "link-label", label);
      link.replaceChildren(linkLabel);
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const arrow = element("span", "link-arrow", "↗");
      arrow.setAttribute("aria-hidden", "true");
      link.append(arrow, element("span", "sr-only", " (opens in a new tab)"));
      links.append(link);
    }
    if (links.childElementCount) aside.append(links);
    const annotation = Array.isArray(item.annotations) ? item.annotations[0] : null;
    if (annotation) {
      const note = element("p", "detail-annotation", typeof annotation === "string" ? annotation : annotation.text);
      aside.append(note);
    }
    const egg = createEasterEgg(item.easterEgg);
    if (egg) aside.append(egg);
    composition.append(figure, aside);
    this.page.append(header, composition);
    this.root.append(this.page);
    this.root.scrollTop = 0;
  }

  setPlaying(playing, reduced) {
    if (this.animated) {
      if (!playing || reduced) this.showAnimation(false);
      return;
    }
    if (this.media?.tagName !== "VIDEO") return;
    if (playing && !reduced) this.media.play().catch(() => {});
    else this.media.pause();
  }

  showAnimation(running) {
    this.animationRunning = running;
    this.media.style.display = running ? "block" : "none";
    this.still.style.display = running ? "none" : "block";
    if (running) this.media.src = this.mediaData.src;
    else this.media.removeAttribute("src");
    this.motionButton.textContent = running ? "Pause animation" : "Play animation";
  }
}
