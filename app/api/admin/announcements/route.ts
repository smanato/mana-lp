import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { loadSiteData, saveSiteData } from "@/lib/store";

function toDisplayDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const badge =
    typeof body.badge === "string" && body.badge.trim().toUpperCase() === "NEW"
      ? ("NEW" as const)
      : ("INFO" as const);

  if (!title || !description) {
    return NextResponse.json(
      { error: "タイトルと本文を入力してください" },
      { status: 400 }
    );
  }
  if (title.length > 120 || description.length > 500) {
    return NextResponse.json(
      { error: "入力文字数が上限を超えています" },
      { status: 400 }
    );
  }

  const siteData = await loadSiteData();
  const item = {
    id: crypto.randomUUID(),
    date: toDisplayDate(),
    title,
    description,
    badge,
  };

  siteData.announcements = [item, ...siteData.announcements].slice(0, 30);
  const saved = await saveSiteData(siteData);

  return NextResponse.json(
    { message: "お知らせを追加しました", announcements: saved.announcements },
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
    return NextResponse.json(
      { error: "IDが必要です" },
      { status: 400 }
    );
  }

  const siteData = await loadSiteData();
  const before = siteData.announcements.length;
  siteData.announcements = siteData.announcements.filter((a) => a.id !== id);

  if (siteData.announcements.length === before) {
    return NextResponse.json(
      { error: "対象のお知らせが見つかりません" },
      { status: 404 }
    );
  }

  const saved = await saveSiteData(siteData);
  return NextResponse.json({
    message: "お知らせを削除しました",
    announcements: saved.announcements,
  });
}
