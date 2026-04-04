import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadSiteData, saveSiteData, normalizeUrl } from "@/lib/store";

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (user.role !== "admin")
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );

  const body = await req.json().catch(() => ({}));
  const discordUrl = normalizeUrl(body.discordUrl);
  const lineUrl = normalizeUrl(body.lineUrl);

  const siteData = loadSiteData();
  siteData.links = { discordUrl, lineUrl };
  const saved = saveSiteData(siteData);

  return NextResponse.json({
    message: "導線リンクを更新しました",
    links: saved.links,
  });
}
