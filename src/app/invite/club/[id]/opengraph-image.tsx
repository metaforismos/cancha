import { ImageResponse } from "next/og";
import { getClubById } from "@/lib/db/queries";

export const runtime = "nodejs";
export const alt = "Invitación a club en Cancha";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const club = await getClubById(id);
  const clubName = club?.group.name || "Un club";
  const memberCount = club?.memberCount ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage:
            "linear-gradient(180deg, rgba(22,163,74,0.25) 0%, #09090b 60%)",
        }}
      >
        <div style={{ fontSize: 100, marginBottom: 16 }}>&#127941;</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -1,
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          {clubName}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#4ade80",
            marginTop: 20,
          }}
        >
          {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#a1a1aa",
            marginTop: 16,
          }}
        >
          Únete en Cancha
        </div>
      </div>
    ),
    { ...size }
  );
}
