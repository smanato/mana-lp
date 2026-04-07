import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { loadSiteData, saveSiteData } from "@/lib/store";

export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (user.role !== "admin")
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );

  const siteData = await loadSiteData();
  return NextResponse.json({ archives: siteData.archives });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (user.role !== "admin")
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );

  const body = await req.json().catch(() => ({}));
  const sessionNo =
    typeof body.sessionNo === "number" ? body.sessionNo : NaN;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const youtubeUrl =
    typeof body.youtubeUrl === "string" ? body.youtubeUrl.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const duration =
    typeof body.duration === "string" ? body.duration.trim() : "";

  if (!title || !youtubeUrl || !date || !duration || isNaN(sessionNo)) {
    return NextResponse.json(
      { error: "全ての項目を入力してください" },
      { status: 400 }
    );
  }

  const siteData = await loadSiteData();
  const item = {
    id: crypto.randomUUID(),
    sessionNo,
    title,
    youtubeUrl,
    date,
    duration,
    createdAt: new Date().toISOString(),
  };

  siteData.archives = [item, ...siteData.archives];
  const saved = await saveSiteData(siteData);

  return NextResponse.json(
    { message: "アーカイブを追加しました", archives: saved.archives },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (user.role !== "admin")
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const siteData = await loadSiteData();
  const before = siteData.archives.length;
  siteData.archives = siteData.archives.filter((a) => a.id !== id);

  if (siteData.archives.length === before) {
    return NextResponse.json(
      { error: "対象のアーカイブが見つかりません" },
      { status: 404 }
    );
  }

  const saved = await saveSiteData(siteData);
  return NextResponse.json({
    message: "アーカイブを削除しました",
    archives: saved.archives,
  });
}
