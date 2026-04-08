import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession, hashPassword } from "@/lib/auth";
import { loadUsers, saveUsers, UserRecord } from "@/lib/store";

function sanitize(u: UserRecord) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
  };
}

function generatePassword(): string {
  // 10文字のランダムなパスワード（英数字）
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pw = "";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    pw += chars[bytes[i] % chars.length];
  }
  return pw;
}

// ─── GET: list all users (without hash/salt) ───
export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  if (user.role !== "admin")
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );

  const users = await loadUsers();
  return NextResponse.json({ users: users.map(sanitize) });
}

// ─── POST: create a new user ───
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
  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = body.role === "admin" ? "admin" : "member";
  const autoPassword = body.autoPassword === true;
  let password =
    typeof body.password === "string" ? body.password : "";

  if (!username || !name) {
    return NextResponse.json(
      { error: "ユーザー名と表示名を入力してください" },
      { status: 400 }
    );
  }
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "ユーザー名は3〜32文字の半角英数字（. _ - 使用可）で入力してください",
      },
      { status: 400 }
    );
  }

  if (autoPassword) {
    password = generatePassword();
  } else if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  const users = await loadUsers();

  // 重複チェック
  if (users.some((u) => u.username === username)) {
    return NextResponse.json(
      { error: "このユーザー名は既に使われています" },
      { status: 409 }
    );
  }

  const pw = hashPassword(password);
  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    username,
    name,
    role,
    salt: pw.salt,
    hash: pw.hash,
  };

  const updated = [...users, newUser];
  await saveUsers(updated);

  return NextResponse.json(
    {
      message: "会員を追加しました",
      user: sanitize(newUser),
      // 自動生成の場合のみ、平文パスワードを1回だけ返す
      password: autoPassword ? password : undefined,
    },
    { status: 201 }
  );
}

// ─── PUT: reset password or update name/role ───
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
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) {
    return NextResponse.json(
      { error: "対象の会員が見つかりません" },
      { status: 404 }
    );
  }

  const target = { ...users[idx] };
  let generatedPassword: string | undefined;

  // 名前の更新
  if (typeof body.name === "string" && body.name.trim()) {
    target.name = body.name.trim();
  }

  // パスワードリセット
  if (body.resetPassword === true) {
    const newPw = generatePassword();
    const hashed = hashPassword(newPw);
    target.salt = hashed.salt;
    target.hash = hashed.hash;
    generatedPassword = newPw;
  } else if (
    typeof body.password === "string" &&
    body.password.length >= 8
  ) {
    const hashed = hashPassword(body.password);
    target.salt = hashed.salt;
    target.hash = hashed.hash;
  }

  users[idx] = target;
  await saveUsers(users);

  return NextResponse.json({
    message: "会員情報を更新しました",
    user: sanitize(target),
    password: generatedPassword,
  });
}

// ─── DELETE: remove a user ───
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

  // 自分自身は削除不可
  if (id === user.id) {
    return NextResponse.json(
      { error: "自分自身のアカウントは削除できません" },
      { status: 400 }
    );
  }

  const users = await loadUsers();
  const next = users.filter((u) => u.id !== id);

  if (next.length === users.length) {
    return NextResponse.json(
      { error: "対象の会員が見つかりません" },
      { status: 404 }
    );
  }

  await saveUsers(next);
  return NextResponse.json({ message: "会員を削除しました" });
}
