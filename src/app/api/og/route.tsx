/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get("nickname") || "User";
    const bio = searchParams.get("bio") || "Tuneport artist";
    const picture =
      searchParams.get("picture") ||
      `https://avatar.iran.liara.run/username?username=${nickname}`;

    const logoImage =
      "https://pbs.twimg.com/profile_images/1942391632520695808/2XvLiCf2_400x400.png";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#000",
            position: "relative",
          }}
        >
          {/* Fondo con blur */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(2px)",
              opacity: 0.5,
            }}
          />

          {/* Contenido principal */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "80%",
              padding: "40px",
              position: "relative",
              justifyContent: "space-between",
            }}
          >
            {/* Logo y nombre del sitio */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <img
                src={logoImage}
                alt="Tuneport Logo"
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50px",
                  border: "1px solid white",
                }}
              />
              <span
                style={{
                  fontSize: "30px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                Tuneport.xyz
              </span>
            </div>

            {/* Información del usuario y foto de perfil */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* Información del usuario */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "60%",
                }}
              >
                <h1
                  style={{
                    fontSize: "44px",
                    color: "white",
                    margin: 0,
                    lineHeight: 1.2,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {nickname}
                </h1>
                <p
                  style={{
                    fontSize: "24px",
                    color: "#e0e0e0",
                    marginTop: "12px",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {bio}
                </p>
              </div>

              {/* Imagen de perfil */}
              <img
                src={picture}
                alt={`${nickname} profile`}
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "100px",
                  objectFit: "cover",
                  border: "4px solid white",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
