import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { fid, privyAppId, privyAppSecret } = await request.json();

    if (!fid || !privyAppId || !privyAppSecret) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Llamar a la API de Privy para refrescar datos de Farcaster
    const response = await fetch(
      "https://auth.privy.io/api/v1/users/farcaster/refresh",
      {
        method: "POST",
        body: JSON.stringify({ fid }),
        headers: {
          Authorization: `Basic ${btoa(`${privyAppId}:${privyAppSecret}`)}`,
          "privy-app-id": privyAppId,
          "content-type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Privy API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
      message: "Farcaster data refreshed successfully",
    });
  } catch (error) {
    console.error("Error refreshing Farcaster data:", error);

    return NextResponse.json(
      {
        error: "Failed to refresh Farcaster data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
