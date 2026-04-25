import {
  Code2, Brain, Database, Network, Cpu,
  BarChart3, LineChart, GitBranch, Layers,
  Leaf, Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  java:    Code2,
  oops:    Brain,
  dbms:    Database,
  cn:      Network,
  os:      Cpu,
  numpy:   BarChart3,
  pandas:  LineChart,
  sklearn: GitBranch,
  rag:     Layers,
  mongodb: Leaf,
  sql:     Table2,
};
