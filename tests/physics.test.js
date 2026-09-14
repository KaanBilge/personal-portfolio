import test from "node:test";
import assert from "node:assert/strict";
import { LocalPhysics } from "../src/physics.js";

const points = [
  { id: "a", x: 0, y: 0 },
  { id: "b", x: 45, y: 0 },
  { id: "field:near", x: -32, y: 20 },
  { id: "far", x: 500, y: 0 },
];
function settle(physics) {
  for (let frame = 0; frame < 180; frame++) if (!physics.step(1 / 60)) return;
  assert.fail("Local physics did not stop within three seconds");
}
test("selection pushes only its local neighborhood and preserves the acquired center", () => {
  const physics = new LocalPhysics();
  physics.select("a", points, 1);
  let last = 0;
  for (let frame = 0; frame < 90; frame++) {
    physics.step(1 / 60);
    assert.deepEqual(physics.position("a", points[0]), { x: 0, y: 0 });
    assert.deepEqual(physics.position("far", points[3]), points[3]);
    const offset = physics.states.get("b").x;
    assert.ok(offset >= last, "expansion must not oscillate");
    last = offset;
  }
  assert.ok(last > 5 && last < 14);
  assert.ok(physics.states.get("field:near").x < 0);
  const acquired = physics.position("b", points[1]);
  physics.select("b", points, 1);
  settle(physics);
  assert.deepEqual(physics.position("b", points[1]), acquired);
});
test("old neighborhoods return exactly to rest; repeated selections never move layout anchors", () => {
  const physics = new LocalPhysics();
  const original = structuredClone(points);
  for (let cycle = 0; cycle < 12; cycle++) {
    physics.select("a", points, 0.65);
    settle(physics);
    physics.select("far", points, 0.65);
    settle(physics);
    for (const point of points) assert.deepEqual(physics.position(point.id, point),
      physics.states.has(point.id) ? { x: point.x, y: point.y } : point);
  }
  assert.deepEqual(points, original);
  assert.equal(physics.step(1 / 60), false);
});
test("reduced motion retains a doubled selection with no displacement", () => {
  const physics = new LocalPhysics();
  physics.select("a", points, 1);
  settle(physics);
  physics.select("b", points, 1, true);
  assert.equal(physics.state("b").growth, 1);
  assert.equal(physics.state("b").x, 0);
  assert.equal(physics.states.size, 1);
});
