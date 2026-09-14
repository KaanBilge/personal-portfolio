export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h += h << 13;
  h ^= h >>> 7;
  h += h << 3;
  h ^= h >>> 17;
  h += h << 5;
  return (h >>> 0) / 4294967296;
}
export function validHref(href) {
  if (typeof href !== "string" || !href.trim() || href.startsWith("#"))
    return false;
  try {
    return ["http:", "https:"].includes(
      new URL(href, "https://portfolio.local").protocol,
    );
  } catch {
    return false;
  }
}
export function normalizeContent(data) {
  if (!Array.isArray(data))
    throw new TypeError("Portfolio content must be an array.");
  const ids = new Set();
  return data
    .filter((item) => {
      if (
        !item ||
        typeof item.id !== "string" ||
        !item.id ||
        ids.has(item.id) ||
        typeof item.title !== "string" ||
        !item.title.trim() ||
        typeof item.description !== "string" ||
        !item.description.trim() ||
        (item.href != null && !validHref(item.href)) ||
        (item.url != null && !validHref(item.url)) ||
        (item.githubUrl != null && !validHref(item.githubUrl))
      )
        return false;
      ids.add(item.id);
      return true;
    })
    .map((item) => ({
      ...item,
      url: item.url ?? item.href,
      relations: Array.isArray(item.relations) ? [...item.relations] : [],
    }));
}
export function relationships(data) {
  const ids = new Set(data.map((n) => n.id)),
    pairs = new Map();
  for (const node of data)
    for (const other of node.relations) {
      if (other === node.id || !ids.has(other)) continue;
      const pair = [node.id, other].sort();
      pairs.set(JSON.stringify(pair), pair);
    }
  return [...pairs.values()].sort(
    (a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]),
  );
}
export const stableOrder = (nodes) =>
  [...nodes].sort(
    (a, b) =>
      a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en"),
  );

// A finite, deterministic settle. Existing points are immutable during edits;
// only additions settle, starting beside their declared neighbors.
export function settle(
  data,
  previous = new Map(),
  viewport = { width: 1440, height: 900 },
  safe = null,
) {
  const positions = new Map(),
    fresh = new Set();
  const expansion = Math.max(1, Math.sqrt(data.length / 50));
  const width =
    (data.length <= 12 ? viewport.width : Math.max(1440, viewport.width)) *
    expansion;
  const height = Math.max(680, viewport.height) * expansion;
  const edges = relationships(data);
  for (const item of data)
    if (previous.has(item.id))
      positions.set(item.id, { ...previous.get(item.id) });
  for (const item of [...data].sort((a, b) => a.id.localeCompare(b.id))) {
    if (positions.has(item.id)) continue;
    const neighbors = edges
      .filter((e) => e.includes(item.id))
      .map((e) => positions.get(e.find((id) => id !== item.id)))
      .filter(Boolean);
    const angle = hash(`${item.id}:angle`) * Math.PI * 2;
    // When adding data, initialize locally; initial data uses a broad field.
    const local = previous.size && neighbors.length;
    const x = local
      ? neighbors.reduce((s, n) => s + n.x, 0) / neighbors.length +
        Math.cos(angle) * 90
      : (hash(`${item.id}:x`) - 0.5) * width * 0.84;
    const y = local
      ? neighbors.reduce((s, n) => s + n.y, 0) / neighbors.length +
        Math.sin(angle) * 90
      : (hash(`${item.id}:y`) - 0.5) * height * 0.78;
    positions.set(item.id, { x, y });
    fresh.add(item.id);
  }
  const anchors = new Map([...positions].map(([id, p]) => [id, { ...p }]));
  for (let iteration = 0; iteration < 320; iteration++) {
    const forces = new Map([...fresh].map((id) => [id, { x: 0, y: 0 }]));
    for (const id of fresh) {
      const point = positions.get(id),
        force = forces.get(id),
        anchor = anchors.get(id);
      force.x += (anchor.x - point.x) * 0.006;
      force.y += (anchor.y - point.y) * 0.006;
      // Soft boundary pressure avoids rows of nodes pinned to a hard wall.
      const bx = width * 0.42,
        by = height * 0.36;
      if (Math.abs(point.x) > bx)
        force.x -= Math.sign(point.x) * (Math.abs(point.x) - bx) * 0.12;
      if (Math.abs(point.y) > by)
        force.y -= Math.sign(point.y) * (Math.abs(point.y) - by) * 0.12;
      for (const [otherId, other] of positions) {
        if (id === otherId) continue;
        const dx = point.x - other.x,
          dy = point.y - other.y,
          distance = Math.hypot(dx, dy) || 0.01;
        const min = data.length <= 60 ? 80 : 60;
        const push =
          18000 / (distance * distance) +
          (distance < min ? (min - distance) * 0.27 : 0);
        force.x += (dx / distance) * push;
        force.y += (dy / distance) * push;
      }
    }
    for (const [a, b] of edges) {
      const p = positions.get(a),
        q = positions.get(b),
        dx = q.x - p.x,
        dy = q.y - p.y,
        d = Math.hypot(dx, dy) || 1;
      const restLength = 190 * Math.max(1, Math.sqrt(data.length / 60));
      const pull = (d - restLength) * 0.045;
      if (fresh.has(a)) {
        forces.get(a).x += (dx / d) * pull;
        forces.get(a).y += (dy / d) * pull;
      }
      if (fresh.has(b)) {
        forces.get(b).x -= (dx / d) * pull;
        forces.get(b).y -= (dy / d) * pull;
      }
    }
    for (const id of fresh) {
      const p = positions.get(id),
        f = forces.get(id),
        step = 8 * (1 - iteration / 340);
      p.x += clamp(f.x, -step, step);
      p.y += clamp(f.y, -step, step);
      if (
        safe &&
        p.x > safe.left &&
        p.x < safe.right &&
        p.y > safe.top &&
        p.y < safe.bottom
      ) {
        const exits = [
          { d: p.x - safe.left, x: safe.left - 1, y: p.y },
          { d: safe.right - p.x, x: safe.right + 1, y: p.y },
          { d: p.y - safe.top, x: p.x, y: safe.top - 1 },
          { d: safe.bottom - p.y, x: p.x, y: safe.bottom + 1 },
        ].sort((a, b) => a.d - b.d);
        const gap = 8 + hash(`${id}:clearance`) * 28;
        p.x =
          exits[0].x +
          (exits[0].x < safe.left ? -gap : exits[0].x > safe.right ? gap : 0);
        p.y =
          exits[0].y +
          (exits[0].y < safe.top ? -gap : exits[0].y > safe.bottom ? gap : 0);
      }
    }
  }
  return positions;
}

// Nested hash samples: increasing density adds vertices without moving any.
export function structuralField(bounds, density, narrow, contentCount) {
  const congestion =
    contentCount <= 60 ? 1 : 1 - 0.5 * clamp((contentCount - 60) / 140, 0, 1);
  const rate = (narrow ? 115 : 150) * clamp(density, 0.5, 1.6) * congestion;
  const cell = 62,
    vertices = [];
  for (
    let y = Math.floor(bounds.top / cell);
    y <= Math.ceil(bounds.bottom / cell);
    y++
  )
    for (
      let x = Math.floor(bounds.left / cell);
      x <= Math.ceil(bounds.right / cell);
      x++
    ) {
      const id = `field:${x}:${y}`;
      if (hash(`${id}:keep`) > (rate * cell * cell) / 1e6) continue;
      vertices.push({
        id,
        x: (x + 0.1 + 0.8 * hash(`${id}:x`)) * cell,
        y: (y + 0.1 + 0.8 * hash(`${id}:y`)) * cell,
      });
    }
  const edges = [],
    seen = new Set(),
    degrees = new Map(),
    buckets = new Map();
  for (const p of vertices) {
    const k = `${Math.floor(p.x / 160)},${Math.floor(p.y / 160)}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(p);
  }
  for (const p of vertices) {
    const near = [],
      bx = Math.floor(p.x / 160),
      by = Math.floor(p.y / 160);
    for (let y = by - 1; y <= by + 1; y++)
      for (let x = bx - 1; x <= bx + 1; x++)
        for (const q of buckets.get(`${x},${y}`) || []) {
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          if (q !== p && d <= 160) near.push({ q, d });
        }
    near.sort((a, b) => a.d - b.d);
    const target = hash(`${p.id}:degree`) > 0.72 ? 3 : 2;
    for (const { q } of near) {
      if ((degrees.get(p.id) || 0) >= target) break;
      if ((degrees.get(q.id) || 0) >= 3) continue;
      const key = [p.id, q.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([p, q]);
      degrees.set(p.id, (degrees.get(p.id) || 0) + 1);
      degrees.set(q.id, (degrees.get(q.id) || 0) + 1);
    }
  }
  return { vertices, edges };
}

export function acquire(points, pointer, radius, currentId = null) {
  const ranked = points
    .map((n) => ({ ...n, d: Math.hypot(n.x - pointer.x, n.y - pointer.y) }))
    .sort((a, b) => a.d - b.d || a.id.localeCompare(b.id));
  const nearest = ranked.find((n) => n.d <= radius),
    current = ranked.find((n) => n.id === currentId);
  if (
    current &&
    current.d <= radius + 3 &&
    (!nearest || current.d - nearest.d < 6)
  )
    return current.id;
  return nearest?.id || null;
}
export function directional(points, id, key) {
  const origin = points.find((n) => n.id === id);
  if (!origin) return null;
  const vectors = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    },
    [vx, vy] = vectors[key];
  return (
    points
      .filter(
        (n) =>
          n.id !== id && (n.x - origin.x) * vx + (n.y - origin.y) * vy > 0.01,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - origin.x, a.y - origin.y) -
            Math.hypot(b.x - origin.x, b.y - origin.y) ||
          a.id.localeCompare(b.id),
      )[0]?.id || id
  );
}
