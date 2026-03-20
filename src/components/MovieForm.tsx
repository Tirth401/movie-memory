"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MovieForm() {
  const router = useRouter();
  const [movie, setMovie] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="movie" className="block text-sm font-medium text-gray-700 mb-1">
          Favorite Movie
        </label>
        <input
          id="movie"
          type="text"
          value={movie}
          onChange={(e) => setMovie(e.target.value)}
          placeholder="e.g. The Shawshank Redemption"
          maxLength={100}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {movie.length}/100
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
