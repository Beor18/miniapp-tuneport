import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la petición
    const nftData = await request.json();

    // Hacer la consulta al servidor backend usando la variable de entorno API_ELEI
    const res = await fetch(`${process.env.API_ELEI}/api/nft/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nftData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Error al crear el NFT en el servidor. Status: ${res.status}. ${
          errorData.message || ""
        }`
      );
    }

    const response = await res.json();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al crear el NFT:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "Error al crear el NFT en el servidor" },
        { status: 500 }
      );
    }
  }
}
