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
  const slotId = typeof body.slotId === "string" ? body.slotId.trim() : "";
  const url = normalizeUrl(body.url);

  if (!slotId) {
    return NextResponse.json(
      { error: "slotIdが必要です" },
      { status: 400 }
    );
  }

  const siteData = await loadSiteData();
  const slot = siteData.imageSlots[slotId];

  if (!slot) {
    return NextResponse.json(
      { error: "指定された画像スロットが存在しません" },
      { status: 404 }
    );
  }

  siteData.imageSlots[slotId] = {
    ...slot,
    url,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveSiteData(siteData);
  return NextResponse.json({
    message: "画像URLを更新しました",
    slot: saved.imageSlots[slotId],
  });
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
  const slotId = searchParams.get("slotId") || "";

  const siteData = await loadSiteData();
  const slot = siteData.imageSlots[slotId];

  if (!slot) {
    return NextResponse.json(
      { error: "指定された画像スロットが存在しません" },
      { status: 404 }
    );
  }

  siteData.imageSlots[slotId] = {
    ...slot,
    url: "",
    filename: "",
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveSiteData(siteData);
  return NextResponse.json({
    message: "画像を削除しました",
    slot: saved.imageSlots[slotId],
  });
}
