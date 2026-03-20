import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SignInButton from "@/components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteMovie: true },
    });

    if (user?.favoriteMovie) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Movie Memory</h1>
          <p className="text-lg text-gray-600">
            Discover fun facts about your favorite movies
          </p>
        </div>
        <SignInButton />
      </div>
    </main>
  );
}
