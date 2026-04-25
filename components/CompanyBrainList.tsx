"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import CompanyBrainCard from "./CompanyBrainCard";

interface Card {
  _id: string;
  companyName: string;
  role: string;
  description: string;
  sources: string[];
  createdAt: string;
}

export default function CompanyBrainList() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/company-brain", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => setCards((prev) => prev.filter((c) => c._id !== id));

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push("/company-brain/new")}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Research a Company
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="glass-card rounded-2xl border border-bg-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-pink/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h3 className="text-base font-semibold text-text mb-2">No research yet</h3>
          <p className="text-sm text-text-muted mb-5 max-w-sm mx-auto">
            Enter a company name and role — PrepHub will scrape Reddit, GitHub, and use Gemini to generate tailored interview questions.
          </p>
          <button
            onClick={() => router.push("/company-brain/new")}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Research a Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <CompanyBrainCard key={card._id} card={card} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
