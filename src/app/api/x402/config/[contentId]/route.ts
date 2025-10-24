import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  const { contentId } = params;
  const BACKEND_URL = process.env.API_ELEI || "http://localhost:3001";

  try {
    const response = await fetch(`${BACKEND_URL}/api/x402/config/${contentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying x402 config request:", error);
    return NextResponse.json(
      { error: "Failed to fetch x402 config from backend" },
      { status: 500 }
    );
  }
}

