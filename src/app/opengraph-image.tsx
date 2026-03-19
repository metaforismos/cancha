import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Cancha — Partidos de futbol cerca de ti";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        <div style={{ fontSize: 120, marginBottom: 16 }}>&#9917;</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          Cancha
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginTop: 16,
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Crea tu perfil de jugador y participa en partidos de tu zona
        </div>
      </div>
    ),
    { ...size }
  );
}
