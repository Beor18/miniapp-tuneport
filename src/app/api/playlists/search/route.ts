import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la query string
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const tag = searchParams.get("tag");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    // Construir parámetros para la API externa
    const params = new URLSearchParams({
      q: query,
      page,
      limit,
      ...(tag && { tag }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    });

    // Llamar a la API externa
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/search?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          revalidate: 60,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `External API error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { success: false, error: "Error fetching playlists from external API" },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error in playlists search API route:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
