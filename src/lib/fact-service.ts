import { prisma } from "./db";
import { generateMovieFact } from "./claude";

const CACHE_WINDOW_MS = 60_000; // 60 seconds
const STALE_LOCK_MS = 30_000; // 30 seconds

export type FactResult =
  | { success: true; fact: string; cached: boolean }
  | { success: false; error: string };

export async function getOrGenerateFact(userId: string): Promise<FactResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteMovie: true },
  });

  if (!user?.favoriteMovie) {
    return { success: false, error: "No favorite movie set." };
  }

  const movie = user.favoriteMovie;

  // Check if we have a recent fact in the cache
  const cachedFact = await prisma.movieFact.findFirst({
    where: { userId, movie },
    orderBy: { createdAt: "desc" },
  });

  if (cachedFact) {
    const age = Date.now() - cachedFact.createdAt.getTime();
    if (age < CACHE_WINDOW_MS) {
      return { success: true, fact: cachedFact.fact, cached: true };
    }
  }

  // Try to acquire the generation lock atomically.
  // updateMany with a WHERE clause is atomic in Postgres — only one
  // concurrent request can match and flip generatingFact to true.
  const staleThreshold = new Date(Date.now() - STALE_LOCK_MS);

  const lockClaimed = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { generatingFact: false },
        { generatingFactSince: { lt: staleThreshold } },
        { generatingFactSince: null },
      ],
    },
    data: {
      generatingFact: true,
      generatingFactSince: new Date(),
    },
  });

  if (lockClaimed.count === 0) {
    // Someone else is already generating — serve stale cache if we have it
    if (cachedFact) {
      return { success: true, fact: cachedFact.fact, cached: true };
    }
    return { success: false, error: "Generating a fact, please try again shortly." };
  }

  // We hold the lock — call Gemini and store the result
  try {
    const factText = await generateMovieFact(movie);

    const newFact = await prisma.movieFact.create({
      data: { userId, movie, fact: factText },
    });

    return { success: true, fact: newFact.fact, cached: false };
  } catch (err) {
    console.error("Failed to generate movie fact:", err);

    // Fall back to whatever we have cached, even if it's old
    if (cachedFact) {
      return { success: true, fact: cachedFact.fact, cached: true };
    }
    return {
      success: false,
      error: "Could not generate a fact right now. Please try again later.",
    };
  } finally {
    await prisma.user.update({
      where: { id: userId },
      data: { generatingFact: false, generatingFactSince: null },
    });
  }
}
