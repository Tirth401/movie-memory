import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MovieForm from "@/components/MovieForm";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { favoriteMovie: true },
  });

  if (user?.favoriteMovie) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Movie Memory</h1>
          <p className="text-gray-600">
            What&apos;s your all-time favorite movie?
          </p>
        </div>
        <MovieForm />
      </div>
    </main>
  );
}
