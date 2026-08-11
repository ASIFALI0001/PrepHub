export interface Topic {
  id: string;
  label: string;
  desc: string;
  /** On-palette text-* accent token used for the topic's icon/emphasis. */
  accent: string;
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
      { id: "java", label: "Java", desc: "Core language, OOP, collections, threads, JVM internals & exceptions.", accent: "text-accent-orange", total: 100 },
      { id: "oops", label: "OOPS", desc: "Encapsulation, inheritance, polymorphism, abstraction & design principles.", accent: "text-accent-violet", total: 100 },
      { id: "dbms", label: "DBMS", desc: "Relational models, normalization, ACID properties, transactions & indexing.", accent: "text-accent-cyan", total: 100 },
      { id: "cn", label: "Computer Networks", desc: "OSI model, TCP/IP, DNS, HTTP, routing algorithms & network security.", accent: "text-accent-blue", total: 100 },
      { id: "os", label: "Operating Systems", desc: "Processes, threads, scheduling, deadlocks, memory management & file systems.", accent: "text-accent-green", total: 100 },
    ],
  },
  {
    id: "ai-ml",
    label: "AI / ML",
    accent: "text-accent-pink",
    topics: [
      { id: "numpy", label: "NumPy", desc: "Arrays, broadcasting, vectorized operations, linear algebra & random.", accent: "text-accent-cyan", total: 100 },
      { id: "pandas", label: "Pandas", desc: "DataFrames, Series, data cleaning, merging, groupby & time series.", accent: "text-accent-orange", total: 100 },
      { id: "sklearn", label: "Scikit-learn", desc: "Supervised & unsupervised learning, pipelines, model evaluation & tuning.", accent: "text-accent-pink", total: 75 },
      { id: "rag", label: "RAG Systems", desc: "Retrieval-augmented generation, embeddings, vector DBs & LLM pipelines.", accent: "text-primary", total: 60 },
    ],
  },
  {
    id: "dsa",
    label: "DSA",
    accent: "text-accent-violet",
    topics: [
      { id: "dsa", label: "Data Structures & Algorithms", desc: "Arrays, Strings, Linked List, Stack, Queue, Trees, Graphs, DP — structured concept-by-concept prep.", accent: "text-accent-violet", total: 0 },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    accent: "text-accent-green",
    topics: [
      { id: "mongodb", label: "MongoDB Atlas", desc: "Documents, collections, aggregation pipeline, indexes & Atlas features.", accent: "text-accent-green", total: 85 },
      { id: "sql", label: "SQL", desc: "Joins, subqueries, window functions, stored procedures & query optimisation.", accent: "text-accent-blue", total: 130 },
    ],
  },
];

export const ALL_TOPICS = SECTIONS.flatMap((s) => s.topics);
export const TOPIC_MAP = Object.fromEntries(ALL_TOPICS.map((t) => [t.id, t]));
