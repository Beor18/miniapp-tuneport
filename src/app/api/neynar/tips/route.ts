import { NextRequest, NextResponse } from "next/server";

interface TipRecipient {
  fid: number;
  amount: number;
  token: string;
}

interface TipRequest {
  recipients: TipRecipient[];
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const { recipients, message }: TipRequest = await request.json();

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients are required" },
        { status: 400 }
      );
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Enviar tips usando API de Neynar
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/fungible/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${neynarApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: recipients.map((r) => ({
            fid: r.fid,
            amount: r.amount,
            token: r.token,
          })),
          message: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Neynar API error: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Tips sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending tips:", error);

    return NextResponse.json(
      {
        error: "Failed to send tips",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
