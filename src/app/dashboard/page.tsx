import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UserAvatar from "@/components/UserAvatar";
import SignOutButton from "@/components/SignOutButton";
import FactDisplay from "@/components/FactDisplay";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, favoriteMovie: true },
  });

  if (!user?.favoriteMovie) {
    redirect("/onboarding");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <UserAvatar name={user.name} image={user.image} />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user.name || "User"}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {user.email || "No email"}
              </p>
            </div>
            <div className="ml-auto">
              <SignOutButton />
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <p className="text-sm text-gray-500">Favorite Movie</p>
            <p className="text-lg font-medium text-gray-900">
              {user.favoriteMovie}
            </p>
          </div>

          <FactDisplay />
        </div>
      </div>
    </main>
  );
}
