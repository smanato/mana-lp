import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { loadUsers } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "ユーザー名とパスワードを入力してください" },
      { status: 400 }
    );
  }

  const users = await loadUsers();
  const candidate = users.find((u) => u.username === username);
  if (!candidate || !verifyPassword(password, candidate.salt, candidate.hash)) {
    return NextResponse.json(
      { error: "ログイン情報が正しくありません" },
      { status: 401 }
    );
  }

  const user = {
    id: candidate.id,
    username: candidate.username,
    name: candidate.name,
    role: candidate.role,
  };

  await createSession(user);

  return NextResponse.json({ message: "ログインしました", user });
}
