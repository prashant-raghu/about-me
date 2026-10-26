// Every visible string on the page. Copy comes from Prashant's resume only.
// No hyphens or dashes in copy: `npm run check:copy` fails the build on one.

export type Link = {
  label: string;
  href: string;
};

export type Job = {
  when: string;
  role: string;
  org: string;
  summary: string;
};

export type Profile = {
  name: string;
  tagline: string;
  location: string;
  headings: {
    now: string;
    work: string;
    skills: string;
    contact: string;
  };
  now: {
    before: string;
    emphasis: string;
    after: string;
  };
  work: Job[];
  skills: string[];
  contact: Link[];
  footer: {
    credit: Link & { prefix: string };
    source: Link;
  };
};

export const profile: Profile = {
  name: "Prashant Raghu",
  tagline: "Software engineer, six years shipping developer tools end to end.",
  location: "India, remote, UTC+5:30",
  headings: {
    now: "Now",
    work: "Work",
    skills: "Works with",
    contact: "Contact",
  },
  now: {
    before: "Building evals and RL environments for frontier coding agents at ",
    emphasis: "SpaceXAI",
    after: ".",
  },
  work: [
    {
      when: "2026 to now",
      role: "Software Engineer, Evals & RL Environments",
      org: "SpaceXAI",
      summary:
        "Evals and RL environments for frontier coding agents: long running autonomous sessions on large, production grade codebases, in reproducible environments. Expert level problems, reference implementations and evaluations across Rust, ML internals, developer tooling and game development, used to train and evaluate Grok. L1 reviewer for the domain.",
    },
    {
      when: "2023 to 2026",
      role: "Software Engineer II",
      org: "Postman",
      summary:
        "Led SpecHub, Postman's API specification platform, to 10K+ enterprise weekly users. Led the Collections type system to 100K weekly users. Built the retrieval and tool calling layer behind Postman's AI assistant.",
    },
    {
      when: "2021 to 2023",
      role: "Software Engineer",
      org: "Postman",
      summary:
        "Built Postman's Git integration: GitHub, Bitbucket and Azure DevOps connectors, API versioning, and branch, commit and merge conflict flows inside the product.",
    },
  ],
  skills: [
    "TypeScript",
    "Rust",
    "Node.js",
    "React",
    "Next.js",
    "PostgreSQL",
    "AWS",
    "LLM agents & tool calling",
    "Evals & RL environments",
  ],
  contact: [
    { label: "Email", href: "mailto:prashantraghu999@gmail.com" },
    { label: "GitHub", href: "https://github.com/prashant-raghu" },
    { label: "LinkedIn", href: "https://linkedin.com/in/prashant-raghu" },
  ],
  footer: {
    credit: { prefix: "Built with", label: "Fredrin", href: "https://fredrin.com" },
    source: { label: "Source", href: "https://github.com/prashant-raghu/about-me" },
  },
};
