/** Real portfolio data. One reusable inspect scene serves every node.
 * Required: id, title, description. Optional: longDescription, url, githubUrl,
 * year, group ('software', 'math', 'hobby'), category (or type), role, technologies, media, mediaType, easterEgg,
 * annotations and relations. Legacy href is an alias for url.
 * media: '/image.png' or { src, alt, poster?, fit?: 'contain' | 'cover', companion?: { src, alt } }.
 * mediaType: 'image' (default), 'animated' (e.g. GIF/WebP), or 'video'.
 * Video is silent and loops; reduced motion leaves playback to the visitor.
 * easterEgg: false hides the shared loose-loop placeholder; otherwise it appears.
 * annotations: optional short margin notes (strings or { text }). V1 shows one.
 * longDescription is reserved for later; V1 uses the concise description only.
 * Relations describe actual connections. Duplicate pairs draw once.
 */
export const selfNode = {
  id: "self",
  title: "Kaan Bilge",
  description: "Software, mathematics, and things made out of curiosity.",
  href: "/",
  relations: [],
  presentation: "identity",
  group: "hobby",
  category: "Personal website",
  media: {
    src: "/media/portfolio-study.png",
    alt: "The portfolio graph with Kaan Bilge at its center.",
  },
};

export const content = [
  selfNode,
  {
    id: "progressive",
    title: "Progressive",
    description: "A workout journal for logging sessions and following long-term progress.",
    group: "software",
    category: "Mobile app",
    technologies: ["React Native", "Expo", "TypeScript"],
    githubUrl: "https://github.com/KaanBilge/progressive",
    relations: ["self"],
    media: {
      src: "/media/progressive-progress.png",
      alt: "Progressive's training progress screen, showing weekly sessions, frequency and strength progression.",
      companion: {
        src: "/media/progressive-summary.png",
        alt: "Progressive's completed-workout summary, showing logged sets and exercises.",
      },
    },
  },
  {
    id: "thesis",
    title: "Thesis",
    description: "AI-assisted stock research, with independent bull and bear cases grounded in shared evidence.",
    group: "software",
    category: "Research tool",
    technologies: ["Next.js", "TypeScript", "SQLite"],
    relations: ["self"],
    media: {
      src: "/media/thesis.png",
      alt: "Thesis's research interface, with ticker search and its research, debate and adjudication workflow.",
    },
  },
  {
    id: "wizard-battle",
    title: "Wizard Battle",
    description: "A first-person wizard-duel prototype built around a rotating hand of spells.",
    group: "software",
    category: "Game prototype",
    technologies: ["Unity", "C#", "URP"],
    githubUrl: "https://github.com/KaanBilge/wizard-battle",
    relations: ["self"],
    media: {
      src: "/media/wizard-battle.png",
      alt: "Wizard Battle gameplay in a grassy arena, with a first-person wand, spell cards and duel HUD.",
    },
  },
];
