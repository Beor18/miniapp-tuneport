import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json(
        { error: "collectionId es requerido" },
        { status: 400 }
      );
    }

    // Hacer la consulta al servidor backend usando la variable de entorno API_ELEI
    const res = await fetch(
      `${process.env.API_ELEI}/api/nft/last-token-id?collectionId=${collectionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const response = await res.json();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al obtener el último tokenId:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "Error al obtener el último tokenId" },
        { status: 500 }
      );
    }
  }
}
