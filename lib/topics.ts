export interface Topic {
  id: string;
  label: string;
  desc: string;
  color: string;
  iconBg: string;
  border: string;
  glow: string;
  total: number;
}

export interface Section {
  id: string;
  label: string;
  accent: string;
  topics: Topic[];
}

export const SECTIONS: Section[] = [
  {
    id: "basics",
    label: "Basics",
    accent: "text-accent-blue",
    topics: [
      {
        id: "java",
        label: "Java",
        desc: "Core language, OOP, collections, threads, JVM internals & exceptions.",
        color: "text-orange-400",
        iconBg: "bg-orange-500/10 group-hover:bg-orange-500/15",
        border: "group-hover:border-orange-500/40",
        glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]",
        total: 100,
      },
      {
        id: "oops",
        label: "OOPS",
        desc: "Encapsulation, inheritance, polymorphism, abstraction & design principles.",
        color: "text-primary-light",
        iconBg: "bg-primary/10 group-hover:bg-primary/15",
        border: "group-hover:border-primary/40",
        glow: "hover:shadow-glow",
        total: 100,
      },
      {
        id: "dbms",
        label: "DBMS",
        desc: "Relational models, normalization, ACID properties, transactions & indexing.",
        color: "text-accent-cyan",
        iconBg: "bg-accent-cyan/10 group-hover:bg-accent-cyan/15",
        border: "group-hover:border-accent-cyan/40",
        glow: "hover:shadow-glow-cyan",
        total: 110,
      },
      {
        id: "cn",
        label: "Computer Networks",
        desc: "OSI model, TCP/IP, DNS, HTTP, routing algorithms & network security.",
        color: "text-accent-blue",
        iconBg: "bg-accent-blue/10 group-hover:bg-accent-blue/15",
        border: "group-hover:border-accent-blue/40",
        glow: "hover:shadow-glow-blue",
        total: 100,
      },
      {
        id: "os",
        label: "Operating Systems",
        desc: "Processes, threads, scheduling, deadlocks, memory management & file systems.",
        color: "text-accent-green",
        iconBg: "bg-accent-green/10 group-hover:bg-accent-green/15",
        border: "group-hover:border-accent-green/40",
        glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
        total: 95,
      },
    ],
  },
  {
    id: "ai-ml",
    label: "AI / ML",
    accent: "text-accent-pink",
    topics: [
      {
        id: "numpy",
        label: "NumPy",
        desc: "Arrays, broadcasting, vectorized operations, linear algebra & random.",
        color: "text-yellow-400",
        iconBg: "bg-yellow-500/10 group-hover:bg-yellow-500/15",
        border: "group-hover:border-yellow-500/40",
        glow: "hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]",
        total: 80,
      },
      {
        id: "pandas",
        label: "Pandas",
        desc: "DataFrames, Series, data cleaning, merging, groupby & time series.",
        color: "text-accent-orange",
        iconBg: "bg-accent-orange/10 group-hover:bg-accent-orange/15",
        border: "group-hover:border-accent-orange/40",
        glow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]",
        total: 90,
      },
      {
        id: "sklearn",
        label: "Scikit-learn",
        desc: "Supervised & unsupervised learning, pipelines, model evaluation & tuning.",
        color: "text-accent-pink",
        iconBg: "bg-accent-pink/10 group-hover:bg-accent-pink/15",
        border: "group-hover:border-accent-pink/40",
        glow: "hover:shadow-[0_0_20px_rgba(236,72,153,0.2)]",
        total: 75,
      },
      {
        id: "rag",
        label: "RAG Systems",
        desc: "Retrieval-augmented generation, embeddings, vector DBs & LLM pipelines.",
        color: "text-primary-light",
        iconBg: "bg-primary/10 group-hover:bg-primary/15",
        border: "group-hover:border-primary/40",
        glow: "hover:shadow-glow",
        total: 60,
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    accent: "text-accent-green",
    topics: [
      {
        id: "mongodb",
        label: "MongoDB Atlas",
        desc: "Documents, collections, aggregation pipeline, indexes & Atlas features.",
        color: "text-accent-green",
        iconBg: "bg-accent-green/10 group-hover:bg-accent-green/15",
        border: "group-hover:border-accent-green/40",
        glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]",
        total: 85,
      },
      {
        id: "sql",
        label: "SQL",
        desc: "Joins, subqueries, window functions, stored procedures & query optimisation.",
        color: "text-accent-blue",
        iconBg: "bg-accent-blue/10 group-hover:bg-accent-blue/15",
        border: "group-hover:border-accent-blue/40",
        glow: "hover:shadow-glow-blue",
        total: 130,
      },
    ],
  },
];

export const ALL_TOPICS = SECTIONS.flatMap((s) => s.topics);
export const TOPIC_MAP = Object.fromEntries(ALL_TOPICS.map((t) => [t.id, t]));
