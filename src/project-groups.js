// Category color is independent of selection. Selection still owns the single
// enlarged node, full brightness, keyboard ring and current-item semantics.
export const projectGroups = Object.freeze({
  software: { label: "Software", color: "#C98B61" },
  math: { label: "Math", color: "#789DCB" },
  hobby: { label: "Hobby", color: "#A18AC3" },
});

export const projectGroup = (item) => Object.hasOwn(projectGroups, item?.group) ? projectGroups[item.group] : null;
export const projectAccent = (item) => projectGroup(item)?.color ?? projectGroups.software.color;
