"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import InterviewCard from "./InterviewCard";

interface Interview {
  _id: string;
  title: string;
  role: string;
  type: string;
  level: string;
  questionCount: number;
  status: "pending" | "in_progress" | "completed";
  report?: { overallScore: number; grade: string } | null;
  createdAt: string;
}

export default function InterviewListClient() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/interview", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInterviews(d.interviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => {
    setInterviews((prev) => prev.filter((i) => i._id !== id));
  };

  return (
    <div>
      {/* Generate button */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/interview/setup")}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" />
          New Interview
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-card rounded-2xl border border-bg-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎤</span>
          </div>
          <h3 className="text-base font-semibold text-text mb-2">No interviews yet</h3>
          <p className="text-sm text-text-muted mb-5 max-w-sm mx-auto">
            Generate your first AI mock interview. Choose the role, type, and level — Gemini will craft the questions.
          </p>
          <button
            onClick={() => router.push("/interview/setup")}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium"
          >
            <Plus className="w-4 h-4" />
            Generate Interview
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((interview) => (
            <InterviewCard
              key={interview._id}
              interview={interview}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
