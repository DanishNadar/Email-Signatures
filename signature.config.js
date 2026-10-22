/*
 * Signature configuration — the single source of truth for every variant.
 *
 * Edit this file, then run `npm run build` to regenerate dist/ and outlook/,
 * and `npm run studio` to preview. The Studio can also export an updated copy.
 *
 * Rules of thumb
 *  - Leave a value as "" to hide it. Nothing is ever shown as a placeholder.
 *  - Image paths are relative to the repo root; exported HTML prefixes them
 *    with `assetBaseUrl`, so they must be pushed to GitHub Pages first.
 *  - A logo only renders once its `src` points at a real, official file.
 *  - Only list roles that are currently active.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SIGNATURE_CONFIG = factory();
})(typeof self !== "undefined" ? self : this, function () {
  return {
    // Public HTTPS location of this repo's GitHub Pages site.
    assetBaseUrl: "https://danishnadar.github.io/Email-Signatures/",

    person: {
      name: "Danish Nadar",
      legalName: "Danish Thangakumar Nadar",
      title: "AI Engineer",
      specialty: "Machine Learning & Software Automation",
      location: "Chicago, IL",
    },

    education: {
      school: "Illinois Institute of Technology",
      schoolShort: "Illinois Tech",
      // In progress — phrased as a class year, never as a conferred degree.
      program: "B.S. + M.A.S. Artificial Intelligence",
      programShort: "B.S. + M.A.S. AI",
      classYear: "'27",
      minor: "",
      honor: "Ma & Lila Self Leadership Academy Scholar",
    },

    // Active roles only. Order is display order; `variants` lists where each appears.
    // group "work" = professional roles, "student" = student organizations.
    // `orgBrief` is the compact org name used in the student-leadership line.
    // `logo` is a tile made from the org's official logo (scripts/build_assets.py); leave it out when none exists.
    roles: [
      { id: "competiscan", group: "work", role: "Research & Development Engineer", roleShort: "R&D Engineer", org: "Competiscan", orgShort: "Competiscan", logo: "assets/logos/tiles/competiscan.png", url: "https://www.competiscan.com/", variants: ["A", "B", "C", "D"] },
      { id: "eloria", group: "work", role: "Machine Learning Engineer", org: "Grupo Eloria", orgShort: "Grupo Eloria", logo: "assets/logos/tiles/grupo-eloria.png", url: "https://grupoeloria.com/", variants: ["A", "B", "D"] },
      { id: "alt4u", group: "work", role: "Co-Founder & Chief AI Officer", org: "A Little Tech For You", orgShort: "ALT4U", url: "", variants: [] },
      { id: "griffin", group: "work", role: "Lead Software Engineer", org: "Griffin Museum of Science and Industry", orgShort: "Griffin MSI", hudOrg: "Griffin Museum of Science & Industry", logo: "assets/logos/tiles/griffin-msi.png", url: "https://www.msichicago.org/", variants: ["B", "D"] },
      { id: "ttp", group: "work", role: "Software Automation Engineer", org: "Technology Transition Paradigm, LLC", orgShort: "Technology Transition Paradigm", hudOrg: "Technology Transition Paradigm", logo: "assets/logos/tiles/technology-transition-paradigm.png", url: "", variants: ["B", "D"] },
      { id: "academy", group: "work", role: "AI & Data Engineering Lead", org: "Illinois Tech Leadership Academy", orgShort: "Leadership Academy", logo: "assets/logos/tiles/leadership-academy.png", url: "https://www.iit.edu/leadership-studies/ma-and-lila-self-leadership-academy", variants: ["D"] },
      { id: "orbit", group: "work", role: "Founder & Technical Director", org: "Orbit Initiative", orgShort: "Orbit", url: "", variants: [] },
      { id: "luna", group: "work", role: "AI & Autonomous Systems Lead", org: "Illinois Tech Lunabotics", orgShort: "Lunabotics", logo: "assets/logos/tiles/lunabotics.png", url: "", variants: ["B", "D"] },
      { id: "elevate", group: "work", role: "Elevate Cohort Manager", org: "Illinois Tech Leadership Academy", orgShort: "Leadership Academy", url: "", variants: [] },

      { id: "mliit", group: "student", role: "President & Treasurer", org: "ML@IIT", orgShort: "ML@IIT", orgBrief: "ML@IIT", logo: "assets/logos/tiles/ml-iit.png", url: "https://312.iit.edu/machinelearning/home/", variants: ["B", "C", "D"] },
      { id: "itr", group: "student", role: "Treasurer", org: "Illinois Tech Robotics", orgShort: "Robotics", orgBrief: "Robotics", logo: "assets/logos/tiles/illinois-tech-robotics.png", url: "https://illinoistechrobotics.org/", variants: ["D"] },
      { id: "igda", group: "student", role: "Treasurer", org: "Illinois Tech IGDA", orgShort: "IGDA", orgBrief: "IGDA", logo: "assets/logos/tiles/illinois-tech-igda.png", url: "", variants: ["D"] },
      { id: "podium", group: "student", role: "Treasurer", org: "Podium Pros", orgShort: "Podium Pros", orgBrief: "Podium Pros", logo: "assets/logos/tiles/podium-pros.png", url: "https://312.iit.edu/podium/home/", variants: ["D"] },
      { id: "itrc", group: "student", role: "Technology Specialist", org: "Illinois Tech Railroad Club", orgShort: "ITRC", orgBrief: "Railroad Club", url: "", variants: [] },
    ],

    contact: {
      email: "dnadar@hawk.illinoistech.edu",
      email2: "danish.t.nadar@gmail.com",
      phone: "(505) 430-0266",
      linkedin: "https://www.linkedin.com/in/danish-nadar/",
      github: "https://github.com/DanishNadar",
      portfolio: "https://danishnadar.com",
      website: "",               // ALT4U site, once public
      websiteLabel: "ALT4U",
      booking: "https://bookings.cloud.microsoft/book/MeetwithDanish@iit0.onmicrosoft.com/?ismsaljsauthenabled",
    },

    images: {
      headshot: "assets/brand/headshot-ring.png",
      monogram: "assets/brand/dn-monogram.png",
    },

    // Official marks only. Drop the file in assets/logos/ and set `src`.
    // `height` is the display height in px; width follows the file's ratio.
    logos: [
      { id: "iit",   name: "Illinois Institute of Technology", alt: "Illinois Tech", src: "assets/logos/illinois-tech-red.png", width: 516, heightPx: 64, height: 11, url: "https://www.iit.edu/", variants: ["A", "B", "C"] },
      { id: "mliit", name: "ML@IIT",                            src: "", width: 0, heightPx: 0, height: 22, url: "", variants: ["B"] },
      { id: "alt4u", name: "A Little Tech For You",             src: "", width: 0, heightPx: 0, height: 22, url: "", variants: ["B", "C"] },
      { id: "itr",   name: "Illinois Tech Robotics",            src: "", width: 0, heightPx: 0, height: 22, url: "https://illinoistechrobotics.org/", variants: ["B"] },
      { id: "luna",  name: "Illinois Tech Lunabotics",          src: "", width: 0, heightPx: 0, height: 22, url: "", variants: [] },
    ],

    // Red / blue brand: Illinois Tech scarlet + navy, with a brighter blue for links.
    theme: {
      ink: "#0B1F3A",       // name
      slate: "#1E293B",     // role titles, org names
      muted: "#5B6B80",     // supporting text
      rule: "#E2E8F0",      // hairlines
      separator: "#A3AFBF", // | and · between inline items
      accent: "#1F5FAD",    // brand blue — bars, ring
      link: "#1F5FAD",      // link text (6.4:1 on white)
      crimson: "#C8102E",   // brand scarlet — labels, primary button
      navy: "#0B2D5C",      // brand navy — secondary button, name accents
    },

    // Flagship (D) — the dark "perception HUD" card in neon scarlet / electric blue.
    hud: {
      width: 860,           // card width in px: fills Outlook's message body at 100% zoom
      bg: "#060A1C",        // card
      line: "#1A2550",      // borders, dividers
      text: "#EEF3FA",
      muted: "#93A4BE",
      red: "#FF2E4D",       // neon scarlet
      blue: "#2E8BFF",      // electric blue
      violet: "#A35BFF",    // middle of the scarlet → blue sweep
      sep: "#4A5A80",       // · and // separators
      link: "#7DB6FF",      // link text on the dark card
      portrait: "assets/brand/headshot-hud.png",
      strip: "assets/brand/gradient-strip.png",
      // Headline segments alternate scarlet / blue.
      headline: ["AI Engineer", "Autonomous Systems", "Automation"],
      focus: ["AI / ML", "Autonomy · ADAS", "Sensor Fusion", "LLM Agents"],
      // Extra cells appended to the roles grid. Past work carries its dates so it never reads as current.
      highlights: [],
      wordmark: { src: "assets/logos/illinois-tech-white.png", width: 515, heightPx: 40, height: 9, alt: "Illinois Institute of Technology", url: "https://www.iit.edu/" },
    },

    variants: {
      D: { label: "Flagship HUD", avatar: "headshot" },
      A: { label: "Executive Minimal", avatar: "headshot" },
      B: { label: "Technical Leadership", avatar: "headshot" },
      C: { label: "Personal Brand", avatar: "monogram" },
    },
  };
});
