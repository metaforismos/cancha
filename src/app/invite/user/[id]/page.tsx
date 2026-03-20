import type { Metadata } from "next";
import { getPlayerByAuthId } from "@/lib/db/queries";
import { InviteRedirect } from "@/components/invite-redirect";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayerByAuthId(id);
  const name = player?.name || "Un jugador";

  const title = `${name} te invita a Cancha`;
  const description =
    "Únete a Cancha y participa en partidos de fútbol cerca de ti.";

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

export default async function InviteUserPage({ params }: Props) {
  const { id } = await params;

  return <InviteRedirect to={`/login?ref=${id}`} />;
}
