const festivalName = "LPU Tech Fest";
const tagline = "For those who dare to build.";
export const fest = {
  name: festivalName,
  university: "Lovely Professional University",
  edition: "2027",
  dates: "12—14 March 2027",
  venue: "Phagwara, Punjab",
  tagline,
  contact: "techfest@example.invalid",
  prize: "₹5,00,000",
  sponsors: ["Foundry Partner", "Research Partner", "Community Partner"],
  chapters: [
    {
      at: 0,
      title: festivalName,
      kicker: "The arrival",
      line: tagline,
      image: "fortress",
    },
    {
      at: 11,
      title: "Beyond the gate",
      kicker: "The threshold",
      line: "Enter a gathering of makers, thinkers and challengers.",
      image: "gate",
    },
    {
      at: 26,
      title: "The empty throne",
      kicker: "The great hall",
      line: "Every seat of power begins with an unsolved problem.",
      image: "throne",
    },
    {
      at: 39,
      title: "Something stirs",
      kicker: "The awakening",
      line: "In the dark, an idea opens its eyes.",
      image: "wyrm",
    },
    {
      at: 50,
      title: "Trial by fire",
      kicker: "The crucible",
      line: "Pressure reveals what your work is made of.",
      image: "fire",
    },
    {
      at: 64,
      title: "Five crowns await",
      kicker: "The reveal",
      line: "Choose a discipline. Earn your place.",
      image: "crowns",
    },
  ],
  competitionPrizes: [
    "₹1,00,000",
    "₹1,00,000",
    "₹1,00,000",
    "₹1,00,000",
    "₹1,00,000",
  ],
  categories: [
    [
      "Hackathon",
      "The Forge",
      "Build a working prototype from a problem revealed on the day.",
      "Teams of 2–4",
    ],
    [
      "Robotics",
      "The Sentinel",
      "Design an autonomous machine and navigate the arena.",
      "Teams of 2–4",
    ],
    [
      "Algorithms",
      "The Cipher",
      "Turn complex constraints into precise, efficient solutions.",
      "Individual",
    ],
    [
      "Design",
      "The Prism",
      "Translate an unfamiliar brief into a considered digital experience.",
      "Teams of 1–3",
    ],
    [
      "Innovation",
      "The Beacon",
      "Pitch an original technology with a credible path to impact.",
      "Teams of 1–4",
    ],
  ],
  schedule: [
    [
      "12 MAR",
      "Gather",
      "Opening assembly, team formation and challenge reveals.",
    ],
    [
      "13 MAR",
      "Build",
      "Studio sessions, mentor reviews and arena qualifiers.",
    ],
    [
      "14 MAR",
      "Ascend",
      "Final demonstrations, judging and the awards ceremony.",
    ],
  ],
  faq: [
    [
      "Who can participate?",
      "The proposed festival is open to university students across disciplines. Final eligibility will be published with registration.",
    ],
    [
      "Do I need a team?",
      "Team sizes vary by competition. Check the discipline cards before registering your interest.",
    ],
    [
      "What should I bring?",
      "Bring your student ID, laptop and charger. Track-specific equipment guidance will accompany the final briefs.",
    ],
    [
      "Is this registration final?",
      "This prototype previews the registration flow. It stores no personal data and sends no submissions.",
    ],
  ],
} as const;
