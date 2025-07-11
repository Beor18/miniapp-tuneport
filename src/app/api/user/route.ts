import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");
    const walletAddressSolana = searchParams.get("address_solana");

    // Verificar que al menos uno de los dos parámetros esté presente
    if (!walletAddress && !walletAddressSolana) {
      return NextResponse.json(
        { error: "At least one of 'address' or 'address_solana' is required" },
        { status: 400 }
      );
    }

    // Construir la URL dinámica dependiendo de cuál parámetro esté presente
    let queryParams = [];
    if (walletAddress) queryParams.push(`address=${walletAddress}`);
    if (walletAddressSolana)
      queryParams.push(`address_solana=${walletAddressSolana}`);

    const queryString = queryParams.join("&");

    const res = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByAddress?${queryString}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const response = await res.json();

    return NextResponse.json(response);
  } catch (error) {
    // Manejo mejorado de errores
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
