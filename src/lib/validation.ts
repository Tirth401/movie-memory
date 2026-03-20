export function validateMovieInput(
  input: unknown
): { valid: true; movie: string } | { valid: false; error: string } {
  if (typeof input !== "string") {
    return { valid: false, error: "Movie name must be a string." };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Movie name is required." };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Movie name must be 100 characters or fewer." };
  }

  return { valid: true, movie: trimmed };
}
