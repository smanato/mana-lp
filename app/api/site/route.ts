import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadSiteData, buildSiteResponse } from "@/lib/store";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const siteData = loadSiteData();
  return NextResponse.json(buildSiteResponse(siteData));
}
