import { describe, it, expect } from "vitest";
import { validateMovieInput } from "@/lib/validation";

describe("validateMovieInput", () => {
  it("accepts a valid movie name", () => {
    const result = validateMovieInput("The Shawshank Redemption");
    expect(result).toEqual({ valid: true, movie: "The Shawshank Redemption" });
  });

  it("trims whitespace from movie name", () => {
    const result = validateMovieInput("  Inception  ");
    expect(result).toEqual({ valid: true, movie: "Inception" });
  });

  it("rejects non-string input", () => {
    expect(validateMovieInput(123)).toEqual({
      valid: false,
      error: "Movie name must be a string.",
    });
    expect(validateMovieInput(null)).toEqual({
      valid: false,
      error: "Movie name must be a string.",
    });
    expect(validateMovieInput(undefined)).toEqual({
      valid: false,
      error: "Movie name must be a string.",
    });
  });

  it("rejects empty string", () => {
    expect(validateMovieInput("")).toEqual({
      valid: false,
      error: "Movie name is required.",
    });
  });

  it("rejects whitespace-only string", () => {
    expect(validateMovieInput("   ")).toEqual({
      valid: false,
      error: "Movie name is required.",
    });
  });

  it("rejects movie name over 100 characters", () => {
    const longName = "A".repeat(101);
    const result = validateMovieInput(longName);
    expect(result).toEqual({
      valid: false,
      error: "Movie name must be 100 characters or fewer.",
    });
  });

  it("accepts movie name exactly 100 characters", () => {
    const name = "A".repeat(100);
    const result = validateMovieInput(name);
    expect(result).toEqual({ valid: true, movie: name });
  });
});
