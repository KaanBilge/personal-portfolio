// Local verification fixtures, never imported by the production entry point.
// These relationships and titles are synthetic, not claims about Kaan's work.
export function demonstrationData(count = 22, hub = false) {
  return Array.from({ length: count }, (_, index) => ({
    id: `demo-${String(index + 1).padStart(3, "0")}`,
    title:
      index === 0
        ? "PROJECT NAME"
        : `DEMO PROJECT ${String(index + 1).padStart(2, "0")}`,
    description:
      index === 0
        ? "One-line project description."
        : "Demonstration content for local interaction verification.",
    href: `/demo/destination.html?item=${index + 1}`,
    githubUrl: `/demo/destination.html?item=${index + 1}&link=github`,
    year: "2026",
    category: "Interaction study",
    role: "Design & development",
    technologies: ["JavaScript", "SVG"],
    media: {
      src: "/media/portfolio-study.png",
      alt: "A screenshot of this portfolio's graph and centered typography.",
    },
    annotations: ["the map, before inspection"],
    relations: [
      ...(index + 1 < count && index % 5 !== 4
        ? [`demo-${String(index + 2).padStart(3, "0")}`]
        : []),
      ...(index + 3 < count && index % 3 === 0
        ? [`demo-${String(index + 4).padStart(3, "0")}`]
        : []),
      ...(hub && index > 0 ? ["demo-001"] : []),
    ],
  }));
}
