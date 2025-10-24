import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  const { contentId } = params;
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const BACKEND_URL = process.env.API_ELEI || "http://localhost:3001";

  if (!address) {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `${BACKEND_URL}/api/x402/check-unlock/${contentId}?address=${address}`;
    console.log("🌐 [PROXY] Calling backend:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // ✅ Forzar sin caché
    });

    console.log("📡 [PROXY] Backend response status:", response.status);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Backend error" }));
      console.error("❌ [PROXY] Backend error:", errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log("📥 [PROXY] Backend data:", data);
    console.log("🔍 [PROXY] Returning to frontend:", {
      isUnlocked: data.isUnlocked,
      hasPaid: data.hasPaid,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [PROXY] Error proxying check-unlock request:", error);
    return NextResponse.json(
      { error: "Failed to check unlock status from backend" },
      { status: 500 }
    );
  }
}
