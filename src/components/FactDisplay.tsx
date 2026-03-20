"use client";

import { useState } from "react";

export default function FactDisplay() {
  const [fact, setFact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateFact() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/fact", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate fact.");
        return;
      }

      setFact(data.fact);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Fun Fact</p>
        <button
          onClick={generateFact}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : fact ? "New Fact" : "Generate Fact"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {fact && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{fact}</p>
        </div>
      )}

      {!fact && !loading && !error && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-400 text-center">
            Click the button to discover a fun fact about your movie!
          </p>
        </div>
      )}
    </div>
  );
}
