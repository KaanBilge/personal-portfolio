import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeContent,
  relationships,
  settle,
  structuralField,
  acquire,
  directional,
} from "../src/layout.js";
import { demonstrationData } from "../src/demo-data.js";

test("only valid content is actionable and real pairs are deduplicated", () => {
  const data = normalizeContent([
    {
      id: "a",
      title: "A",
      description: "Description",
      href: "/a",
      relations: ["b", "b", "a", "missing"],
    },
    {
      id: "b",
      title: "B",
      description: "Description",
      href: "/b",
      relations: ["a"],
    },
    { id: "x", title: "X", description: "Unsafe", href: "javascript:alert(1)" },
    { id: "a", title: "Duplicate", description: "Duplicate", href: "/other" },
  ]);
  assert.equal(data.length, 2);
  assert.deepEqual(relationships(data), [["a", "b"]]);
});
test("inspect content permits missing destinations and preserves optional project fields", () => {
  const project = {
    id: "study", title: "Study", description: "An introduction.",
    year: 2026, category: "Research", role: "Author", technologies: ["SVG"],
    longDescription: "Reserved for later.", media: { src: "/study.webp", alt: "Study" },
    mediaType: "animated", easterEgg: false, annotations: ["A margin note"],
  };
  const [result] = normalizeContent([project]);
  for (const [key, value] of Object.entries(project)) assert.deepEqual(result[key], value);
  assert.equal(result.url, undefined);
  assert.equal(normalizeContent([{ ...project, href: "/legacy" }])[0].url, "/legacy");
  assert.equal(normalizeContent([{ ...project, url: "https://example.org", githubUrl: "https://github.com" }]).length, 1);
  assert.equal(normalizeContent([{ ...project, githubUrl: "javascript:alert(1)" }]).length, 0);
});

test("all dataset sizes settle finitely, deterministically and outside the initial title", () => {
  const safe = { left: -348, right: 348, top: -58, bottom: 57 };
  for (const n of [0, 5, 30, 100, 250]) {
    const data = demonstrationData(n, true),
      a = settle(data, new Map(), { width: 1440, height: 900 }, safe),
      b = settle(
        [...data].reverse(),
        new Map(),
        { width: 1440, height: 900 },
        safe,
      );
    assert.equal(a.size, n);
    for (const [id, p] of a) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(
        p.x <= safe.left ||
          p.x >= safe.right ||
          p.y <= safe.top ||
          p.y >= safe.bottom,
      );
      assert.ok(Math.hypot(p.x - b.get(id).x, p.y - b.get(id).y) < 0.0001);
    }
  }
});
test("editing content preserves existing positions and removes incident edges", () => {
  const initial = demonstrationData(5),
    positions = settle(initial),
    added = demonstrationData(6),
    next = settle(added, positions);
  for (const [id, p] of positions) assert.deepEqual(next.get(id), p);
  const removed = added.filter((n) => n.id !== "demo-003");
  assert.ok(!relationships(removed).flat().includes("demo-003"));
  assert.ok(!settle(removed, next).has("demo-003"));
});
test("density samples are nested; short, sparse structural edges are bounded", () => {
  const bounds = { left: -1296, right: 1296, top: -810, bottom: 810 };
  const low = structuralField(bounds, 0.5, false, 22),
    mid = structuralField(bounds, 1, false, 22),
    high = structuralField(bounds, 1.6, false, 22);
  assert.ok(
    low.vertices.length < mid.vertices.length &&
      mid.vertices.length < high.vertices.length,
  );
  const lookup = new Map(high.vertices.map((p) => [p.id, p]));
  for (const p of low.vertices) assert.deepEqual(lookup.get(p.id), p);
  for (const [a, b] of high.edges)
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) <= 160);
  const degree = (mid.edges.length * 2) / mid.vertices.length;
  assert.ok(degree >= 2 && degree <= 3, `mean degree ${degree}`);
});
test("target acquisition uses nearest centers, stable ties and retention hysteresis", () => {
  const points = [
    { id: "b", x: 10, y: 0 },
    { id: "a", x: -10, y: 0 },
  ];
  assert.equal(acquire(points, { x: 0, y: 0 }, 12), "a");
  assert.equal(acquire(points, { x: 2, y: 0 }, 12, "a"), "a");
  assert.equal(acquire(points, { x: 4, y: 0 }, 12, "a"), "b");
  assert.equal(acquire(points, { x: 25, y: 0 }, 12, "b"), "b");
  assert.equal(acquire(points, { x: 26, y: 0 }, 12, "b"), null);
});
test("spatial traversal chooses nearest directional content and stays at an edge", () => {
  const p = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 10, y: 0 },
    { id: "c", x: 30, y: 1 },
  ];
  assert.equal(directional(p, "a", "ArrowRight"), "b");
  assert.equal(directional(p, "a", "ArrowLeft"), "a");
});
