# Movie Memory

A full-stack web application where users sign in with Google, share their favorite movie, and discover fun facts about it powered by Gemini.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** TailwindCSS
- **Database:** PostgreSQL (via Docker Compose)
- **ORM:** Prisma 7
- **Authentication:** NextAuth.js with Google OAuth
- **AI:** Google Gemini API (gemini-2.0-flash)
- **Testing:** Vitest

## Variant Choice: A — Backend-Focused (Caching & Correctness)

I chose Variant A because backend correctness is foundational to a reliable application. The caching and idempotency requirements address real production concerns — race conditions from concurrent requests and unnecessary API costs from redundant Gemini calls. These problems compound in production and are harder to retrofit than frontend state management.

## Architecture Overview

### Data Model

The schema centers around four key models:

- **User** — Extended with `favoriteMovie` (nullable, null = not onboarded), `generatingFact` flag, and `generatingFactSince` timestamp for burst protection.
- **MovieFact** — Stores generated facts with `userId`, `movie`, `fact`, and `createdAt`. A composite index on `[userId, movie, createdAt]` enables efficient cache lookups.
- **Account/Session** — Standard NextAuth models for OAuth session management.

### Auth Flow

1. Unauthenticated users see a landing page with "Sign in with Google".
2. After Google OAuth, NextAuth creates a session and stores the user.
3. The landing page checks if the user has a `favoriteMovie`:
   - If yes → redirect to `/dashboard`
   - If no → redirect to `/onboarding`
4. All protected pages verify the session server-side and redirect if missing.

### Fact Generation (Variant A)

The core logic lives in `src/lib/fact-service.ts`:

1. **Cache check:** Query the most recent `MovieFact` for the user+movie pair. If it's less than 60 seconds old, return it immediately.
2. **Burst protection:** Use `prisma.user.updateMany` with a WHERE clause that only succeeds if `generatingFact` is false (or the lock is stale >30s). This is an atomic operation — only one concurrent request can acquire the lock.
3. **Generation:** Call Gemini to generate a new fact, store it, and return it.
4. **Failure handling:** If Gemini fails, return the most recent cached fact (any age). If no cache exists, return a user-friendly error.
5. **Lock cleanup:** Always release the `generatingFact` flag in a `finally` block.

### Project Structure

```
src/
  app/
    page.tsx                    # Landing page with auth redirect
    dashboard/page.tsx          # Protected dashboard
    onboarding/page.tsx         # First-time user movie input
    api/
      auth/[...nextauth]/      # NextAuth route handler
      fact/route.ts             # POST: generate/cache fact
      onboarding/route.ts       # POST: save favorite movie
  lib/
    auth.ts                     # NextAuth configuration
    db.ts                       # Prisma client singleton
    gemini.ts                   # Gemini API wrapper
    fact-service.ts             # Cache + burst protection logic
    validation.ts               # Movie input validation
  components/
    Providers.tsx               # SessionProvider wrapper
    SignInButton.tsx             # Google sign-in button
    SignOutButton.tsx            # Sign-out button
    UserAvatar.tsx              # Avatar with fallback initials
    MovieForm.tsx               # Onboarding form
    FactDisplay.tsx             # Fact display with generate button
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Google Cloud Console project with OAuth 2.0 credentials
- Gemini API key

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origin: `http://localhost:3000`
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Random secret for session encryption (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GEMINI_API_KEY` | Gemini API key from Google AI Studio |

### Running Locally

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your credentials in .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Running Tests

```bash
npm test
```

## Key Tradeoffs

- **Gemini Flash over Pro:** Significantly faster and cheaper for generating short fun facts. Quality is more than sufficient for this use case.
- **DB-level burst protection over Redis:** Using a Prisma `updateMany` with a conditional WHERE clause instead of a Redis lock. This avoids adding another infrastructure dependency while still providing atomic lock acquisition. The tradeoff is that in a multi-server deployment, a stale lock requires a 30-second timeout before another server can claim it.
- **In-process lock timeout (30s):** If a generation process crashes without releasing the lock, other requests must wait 30 seconds. This is pragmatic — the Gemini call typically completes in 2-5 seconds, and 30 seconds is long enough to avoid false positives.
- **NextAuth v4 over v5:** v4 is stable and well-documented with the Prisma adapter. v5 is still evolving and would add migration risk for no clear benefit here.

## What I Would Improve with 2 More Hours

- **Rate limiting:** Add per-user rate limiting (e.g., max 10 facts per hour) to prevent abuse and control API costs.
- **Fact history:** Add a page showing all previously generated facts for the user's movie.
- **Movie autocomplete:** Integrate TMDB API for movie name validation and autocomplete.
- **E2E tests:** Add Playwright tests for the full auth → onboarding → dashboard → fact generation flow.
- **Edit movie:** Allow users to change their favorite movie from the dashboard.

## AI Usage

- Used AI tools for code generation assistance, debugging, and exploring library APIs (Prisma v7 adapter pattern, NextAuth configuration).
- All code was reviewed and understood before committing.
- AI was used to help structure the architecture and write boilerplate (Prisma schema, NextAuth setup).
