import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { loadUsers, saveUsers } from "@/lib/store";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "現在のパスワードと新しいパスワードを入力してください" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "新しいパスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  if (newPassword.length > 100) {
    return NextResponse.json(
      { error: "パスワードが長すぎます" },
      { status: 400 }
    );
  }

  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === session.id);
  if (idx < 0) {
    return NextResponse.json(
      { error: "アカウントが見つかりません" },
      { status: 404 }
    );
  }

  const user = users[idx];

  // 現在のパスワードを検証
  if (!verifyPassword(currentPassword, user.salt, user.hash)) {
    return NextResponse.json(
      { error: "現在のパスワードが正しくありません" },
      { status: 401 }
    );
  }

  // 新しいパスワードでハッシュ化
  const hashed = hashPassword(newPassword);
  users[idx] = {
    ...user,
    salt: hashed.salt,
    hash: hashed.hash,
  };

  await saveUsers(users);

  return NextResponse.json({
    message: "パスワードを変更しました",
  });
}
