import { ImageResponse } from "next/og";
import { getPlayerByAuthId } from "@/lib/db/queries";

export const runtime = "nodejs";
export const alt = "Invitación a Cancha";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerByAuthId(id);
  const name = player?.name || "Un jugador";

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
        <div style={{ fontSize: 100, marginBottom: 16 }}>&#9917;</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          Cancha
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#4ade80",
            marginTop: 24,
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {name} te invita a jugar
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#a1a1aa",
            marginTop: 12,
            maxWidth: 600,
            textAlign: "center",
          }}
        >
          Crea tu perfil y participa en partidos cerca de ti
        </div>
      </div>
    ),
    { ...size }
  );
}
