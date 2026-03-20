import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockGetOrGenerateFact = vi.fn();
vi.mock("@/lib/fact-service", () => ({
  getOrGenerateFact: (...args: unknown[]) => mockGetOrGenerateFact(...args),
}));

describe("Fact API Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { POST } = await import("@/app/api/fact/route");
    const response = await POST();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    const { POST } = await import("@/app/api/fact/route");
    const response = await POST();

    expect(response.status).toBe(401);
  });

  it("uses session user id to fetch facts (not request body)", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-123", email: "test@test.com" },
    });
    mockGetOrGenerateFact.mockResolvedValue({
      success: true,
      fact: "A fun fact",
      cached: false,
    });

    const { POST } = await import("@/app/api/fact/route");
    const response = await POST();

    expect(response.status).toBe(200);
    expect(mockGetOrGenerateFact).toHaveBeenCalledWith("user-123");
  });

  it("returns error when fact service fails", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-123" },
    });
    mockGetOrGenerateFact.mockResolvedValue({
      success: false,
      error: "No favorite movie set.",
    });

    const { POST } = await import("@/app/api/fact/route");
    const response = await POST();

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("No favorite movie set.");
  });
});
