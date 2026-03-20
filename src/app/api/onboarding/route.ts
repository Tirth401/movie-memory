import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateMovieInput } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = validateMovieInput(body.movie);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoriteMovie: result.movie },
  });

  return NextResponse.json({ success: true });
}
