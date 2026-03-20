import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockUpdateMany = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    movieFact: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

const mockGenerateMovieFact = vi.fn();
vi.mock("@/lib/gemini", () => ({
  generateMovieFact: (...args: unknown[]) => mockGenerateMovieFact(...args),
}));

import { getOrGenerateFact } from "@/lib/fact-service";

describe("Fact Cache Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it("returns cached fact when less than 60 seconds old", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: "Inception" });
    mockFindFirst.mockResolvedValue({
      id: "fact-1",
      fact: "Cached fact about Inception",
      createdAt: new Date(Date.now() - 30_000),
    });

    const result = await getOrGenerateFact("user-1");

    expect(result).toEqual({
      success: true,
      fact: "Cached fact about Inception",
      cached: true,
    });
    expect(mockGenerateMovieFact).not.toHaveBeenCalled();
  });

  it("generates new fact when cache is older than 60 seconds", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: "Inception" });
    mockFindFirst.mockResolvedValue({
      id: "fact-1",
      fact: "Old fact",
      createdAt: new Date(Date.now() - 90_000),
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockGenerateMovieFact.mockResolvedValue("New fact about Inception");
    mockCreate.mockResolvedValue({
      id: "fact-2",
      fact: "New fact about Inception",
      createdAt: new Date(),
    });

    const result = await getOrGenerateFact("user-1");

    expect(result).toEqual({
      success: true,
      fact: "New fact about Inception",
      cached: false,
    });
    expect(mockGenerateMovieFact).toHaveBeenCalledWith("Inception");
  });

  it("generates new fact when no cache exists", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: "Inception" });
    mockFindFirst.mockResolvedValue(null);
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockGenerateMovieFact.mockResolvedValue("First fact about Inception");
    mockCreate.mockResolvedValue({
      id: "fact-1",
      fact: "First fact about Inception",
      createdAt: new Date(),
    });

    const result = await getOrGenerateFact("user-1");

    expect(result).toEqual({
      success: true,
      fact: "First fact about Inception",
      cached: false,
    });
  });

  it("returns cached fact when Gemini fails", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: "Inception" });
    mockFindFirst.mockResolvedValue({
      id: "fact-1",
      fact: "Fallback fact",
      createdAt: new Date(Date.now() - 90_000),
    });
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockGenerateMovieFact.mockRejectedValue(new Error("Gemini timeout"));

    const result = await getOrGenerateFact("user-1");

    expect(result).toEqual({
      success: true,
      fact: "Fallback fact",
      cached: true,
    });
  });

  it("returns error when Gemini fails and no cache exists", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: "Inception" });
    mockFindFirst.mockResolvedValue(null);
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockGenerateMovieFact.mockRejectedValue(new Error("Gemini timeout"));

    const result = await getOrGenerateFact("user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Could not generate");
    }
  });

  it("returns cached fact during concurrent generation (burst protection)", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: "Inception" });
    mockFindFirst.mockResolvedValue({
      id: "fact-1",
      fact: "Existing fact",
      createdAt: new Date(Date.now() - 90_000),
    });
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const result = await getOrGenerateFact("user-1");

    expect(result).toEqual({
      success: true,
      fact: "Existing fact",
      cached: true,
    });
    expect(mockGenerateMovieFact).not.toHaveBeenCalled();
  });

  it("returns error when no movie is set", async () => {
    mockFindUnique.mockResolvedValue({ favoriteMovie: null });

    const result = await getOrGenerateFact("user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No favorite movie");
    }
  });
});
