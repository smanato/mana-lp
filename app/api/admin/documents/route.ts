import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { loadSiteData, saveSiteData } from "@/lib/store";

const VALID_CATEGORIES = ["template", "slide", "worksheet", "other"];

export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (user.role !== "admin")
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );

  const siteData = loadSiteData();
  return NextResponse.json({ documents: siteData.documents });
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
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : "";

  if (!title || !url) {
    return NextResponse.json(
      { error: "タイトルとURLを入力してください" },
      { status: 400 }
    );
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: "カテゴリはtemplate, slide, worksheet, otherのいずれかを指定してください" },
      { status: 400 }
    );
  }

  const siteData = loadSiteData();
  const item = {
    id: crypto.randomUUID(),
    title,
    description,
    url,
    category,
    createdAt: new Date().toISOString(),
  };

  siteData.documents = [item, ...siteData.documents];
  const saved = saveSiteData(siteData);

  return NextResponse.json(
    { message: "資料を追加しました", documents: saved.documents },
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

  const siteData = loadSiteData();
  const before = siteData.documents.length;
  siteData.documents = siteData.documents.filter((d) => d.id !== id);

  if (siteData.documents.length === before) {
    return NextResponse.json(
      { error: "対象の資料が見つかりません" },
      { status: 404 }
    );
  }

  const saved = saveSiteData(siteData);
  return NextResponse.json({
    message: "資料を削除しました",
    documents: saved.documents,
  });
}
