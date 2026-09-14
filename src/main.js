import "./styles.css";
import { content, selfNode } from "./content.js";
import { config } from "./config.js";
import { validHref, normalizeContent } from "./layout.js";
import { Portfolio } from "./graph.js";
import { InspectScene, mountStaticInspect } from "./inspect-scene.js";

await Promise.all([
  document.fonts.load('400 96px "STIX Two Text"'),
  document.fonts.load('400 15px "Source Sans 3"'),
]).catch(() => {});
let data = content,
  demo = false;
const params = new URLSearchParams(location.search);
if (import.meta.env.DEV && params.has("demo")) {
  demo = true;
  const { demonstrationData } = await import("./demo-data.js");
  // Keep the stress-test fixture independent of the real project's count.
  data = [selfNode, ...demonstrationData(
    Math.min(500, Math.max(0, Number(params.get("count") ?? 22))),
    params.has("hub"),
  )];
  document.title = "Kaan Bilge — local demonstration";
}
for (const [key, label] of [
  ["github", "GitHub"],
  ["linkedin", "LinkedIn"],
]) {
  const href = config.social[key];
  if (!validHref(href)) continue;
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  document.querySelector("#social").append(link);
}
try {
  let scene;
  const portfolio = new Portfolio(data, config, {
    demo,
    fallback: import.meta.env.DEV && params.has("fallback"),
    onInspect: (item, opener) => scene?.open(item, opener),
  });
  scene = new InspectScene(portfolio);
  // A small content/configuration API; no on-screen debug or density controls.
  window.portfolio = {
    setContent: (incoming) => {
      const data = normalizeContent(incoming);
      portfolio.setContent(
        data.some((item) => item.id === selfNode.id) ? data : [selfNode, ...data],
      );
    },
    setDensity: (value) => portfolio.setDensity(value),
  };
  if (import.meta.env.DEV) {
    window.portfolio.inspect = () => portfolio.inspect();
    window.portfolio.failRenderer = () => portfolio.enableFallback();
  }
} catch (error) {
  document.querySelector("#portfolio").classList.add("fallback");
  mountStaticInspect(normalizeContent(data));
  document.querySelector("#support").textContent = data.length
    ? ""
    : "Work will appear here.";
  console.error("Graph renderer unavailable; using text selection and internal detail.", error);
}
