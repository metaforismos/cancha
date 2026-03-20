import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getClubById } from "@/lib/db/queries";
import { getSession } from "@/lib/auth";
import { InviteRedirect } from "@/components/invite-redirect";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = await getClubById(id);

  if (!club) {
    return {
      title: "Únete a Cancha",
      description: "Participa en partidos de fútbol cerca de ti.",
    };
  }

  const title = `Únete a ${club.group.name} en Cancha`;
  const description =
    club.group.description ||
    `Club con ${club.memberCount} ${club.memberCount === 1 ? "miembro" : "miembros"}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Cancha",
      type: "website",
    },
  };
}

export default async function InviteClubPage({ params }: Props) {
  const { id } = await params;

  // If user is already authenticated, redirect directly to club page
  const session = await getSession();
  if (session) {
    redirect(`/clubs/${id}`);
  }

  return <InviteRedirect to={`/login?club=${id}`} />;
}
