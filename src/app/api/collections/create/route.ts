import { NextResponse, NextRequest } from "next/server";
import { verifyJWT } from "@Src/app/api/lib/jwt";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // const isValid = verifyJWT(request);

  // if (!isValid) {
  //   return NextResponse.json({ message: "Error verify" });
  // }

  const dataToSend = { ...body };

  try {
    const res = await fetch(`${process.env.API_ELEI}/api/collections/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });
    const data = await res.json();

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "API ROUTE ERROR", message: e },
      { status: 500 }
    );
  }
}
