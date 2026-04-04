import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadSiteData, saveSiteData, buildSiteResponse } from "@/lib/store";

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const siteData = loadSiteData();
  const total = siteData.curriculum.length || 6;
  const source = Array.isArray(body.completedSessionIds)
    ? body.completedSessionIds
    : [];

  const ids = [
    ...new Set(
      source
        .map((v: unknown) => Number.parseInt(String(v), 10))
        .filter((v: number) => Number.isInteger(v))
    ),
  ].sort((a, b) => (a as number) - (b as number)) as number[];

  if (ids.some((id) => id < 1 || id > total)) {
    return NextResponse.json(
      { error: `進捗IDは1〜${total}の範囲で指定してください` },
      { status: 400 }
    );
  }

  siteData.progress.completedSessionIds = ids;
  siteData.progress.updatedAt = new Date().toISOString();
  const saved = saveSiteData(siteData);

  return NextResponse.json({
    message: "進捗を更新しました",
    progress: buildSiteResponse(saved).progress,
  });
}
