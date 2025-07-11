import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.API_ELEI}/api/collections?network=allfeat&community=tuneport`,
      { next: { revalidate: 10 }, cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const response = await res.json();

    const newData = response.map((item: any) => {
      const newArray = { ...item };

      delete newArray._id;
      delete newArray.__v;
      delete newArray.id;
      delete newArray.nfts;
      delete newArray.erc_type;

      return newArray;
    });

    return NextResponse.json(newData);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}
