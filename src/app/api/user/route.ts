import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("address");
    const walletAddressSolana = searchParams.get("address_solana");
    const farcasterUsername = searchParams.get("farcaster_username");
    const nickname = searchParams.get("nickname");

    // 🔧 VALIDACIÓN MEJORADA: Verificar que al menos uno de los parámetros esté presente y no vacío
    const hasValidParam =
      (walletAddress && walletAddress.trim() !== "") ||
      (walletAddressSolana && walletAddressSolana.trim() !== "") ||
      (farcasterUsername && farcasterUsername.trim() !== "") ||
      (nickname && nickname.trim() !== "");

    if (!hasValidParam) {
      console.log("⚠️ [API /user] No valid parameters provided");
      return NextResponse.json(
        {
          error:
            "At least one valid parameter (address, address_solana, farcaster_username, or nickname) is required",
        },
        { status: 400 }
      );
    }

    // Construir la URL dinámica dependiendo de cuáles parámetros estén presentes
    const queryParams: string[] = [];
    if (walletAddress && walletAddress.trim() !== "") {
      queryParams.push(`address=${encodeURIComponent(walletAddress.trim())}`);
    }
    if (walletAddressSolana && walletAddressSolana.trim() !== "") {
      queryParams.push(
        `address_solana=${encodeURIComponent(walletAddressSolana.trim())}`
      );
    }
    if (farcasterUsername && farcasterUsername.trim() !== "") {
      queryParams.push(
        `farcaster_username=${encodeURIComponent(farcasterUsername.trim())}`
      );
    }
    if (nickname && nickname.trim() !== "") {
      queryParams.push(`nickname=${encodeURIComponent(nickname.trim())}`);
    }

    const queryString = queryParams.join("&");
    console.log(`🔍 [API /user] Fetching user data with query: ${queryString}`);

    const res = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByAddress?${queryString}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      // Si es 404 (usuario no encontrado), retornar response específico
      if (res.status === 404) {
        console.log("ℹ️ [API /user] User not found in database");
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const response = await res.json();
    console.log(
      `✅ [API /user] User found: ${
        response.nickname || response.name || "No name"
      }`
    );

    return NextResponse.json(response);
  } catch (error) {
    // Manejo mejorado de errores
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("❌ [API /user] Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
