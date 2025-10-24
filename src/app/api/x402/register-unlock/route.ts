import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const BACKEND_URL = process.env.API_ELEI || "http://localhost:3001";

  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/x402/register-unlock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying register-unlock request:", error);
    return NextResponse.json(
      { error: "Failed to register unlock with backend" },
      { status: 500 }
    );
  }
}

