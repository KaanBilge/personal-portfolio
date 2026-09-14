// Critically damped, finite local motion. The permanent layout is never edited.
export function damp(value, velocity, target, dt, frequency = 20) {
  const error = value - target;
  const decay = Math.exp(-frequency * dt);
  const impulse = velocity + frequency * error;
  const next = target + (error + impulse * dt) * decay;
  const speed = (velocity - frequency * impulse * dt) * decay;
  // A changing target must not produce overshoot, even when reversing mid-settle.
  if ((target - value) * (target - next) < 0 ||
      (Math.abs(next - target) < 0.002 && Math.abs(speed) < 0.02))
    return [target, 0];
  return [next, speed];
}

export class LocalPhysics {
  constructor() {
    this.states = new Map();
    this.pressure = new Map();
    this.selected = null;
  }
  state(id) {
    if (!this.states.has(id))
      this.states.set(id, { x: 0, y: 0, vx: 0, vy: 0, growth: 0, vg: 0 });
    return this.states.get(id);
  }
  position(id, rest) {
    const offset = this.states.get(id);
    return offset ? { x: rest.x + offset.x, y: rest.y + offset.y } : rest;
  }
  select(id, points, scale, immediate = false) {
    const valid = new Set(points.map((point) => point.id));
    for (const key of this.states.keys()) if (!valid.has(key)) this.states.delete(key);
    this.selected = id;
    this.pressure.clear();
    const selected = this.state(id);
    if (immediate) {
      this.states.clear();
      this.state(id).growth = 1;
      this.pin = { x: 0, y: 0 };
      return;
    }
    // Capture the acquired center, even if its old neighborhood was settling.
    this.pin = { x: selected.x, y: selected.y };
    selected.vx = selected.vy = 0;
    const rest = points.find((point) => point.id === id);
    if (!rest) return;
    const center = this.position(id, rest);
    for (const point of points) {
      if (point.id === id) continue;
      const dx = (point.x - center.x) * scale;
      const dy = (point.y - center.y) * scale;
      const distance = Math.hypot(dx, dy);
      // A soft exclusion envelope around the growing node, with compact support.
      // It includes the background mesh so sparse portfolios still make room.
      if (distance >= 160) continue;
      const falloff = (1 - distance / 160) ** 2;
      const displacement = 14 * falloff / scale;
      this.pressure.set(point.id, {
        x: (distance ? dx / distance : 1) * displacement,
        y: (distance ? dy / distance : 0) * displacement,
      });
      this.state(point.id);
    }
  }
  step(dt) {
    let moving = false;
    const selected = this.state(this.selected);
    [selected.growth, selected.vg] = damp(selected.growth, selected.vg, 1, dt, 26);
    for (const [id, state] of this.states) {
      const active = id === this.selected;
      if (!active) [state.growth, state.vg] = damp(state.growth, state.vg, 0, dt, 26);
      const force = this.pressure.get(id);
      const tx = active ? this.pin.x : (force?.x || 0) * selected.growth;
      const ty = active ? this.pin.y : (force?.y || 0) * selected.growth;
      [state.x, state.vx] = damp(state.x, state.vx, tx, dt);
      [state.y, state.vy] = damp(state.y, state.vy, ty, dt);
      moving ||= state.x !== tx || state.y !== ty || state.growth !== (active ? 1 : 0);
      if (!active && !force && !state.x && !state.y && !state.growth) this.states.delete(id);
    }
    return moving;
  }
}
