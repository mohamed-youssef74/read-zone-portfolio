import { NextResponse } from "next/server"
import { olSearch } from "@/services/openlibrary"

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() || ""
  if (!q) return NextResponse.json([])
  try {
    return NextResponse.json(await olSearch(q))
  } catch {
    return NextResponse.json({ error: "search_unavailable" }, { status: 502 })
  }
}
