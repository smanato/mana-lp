"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");

    if (!username || !password) {
      setError("ユーザー名とパスワードを入力してください");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        setLoading(false);
        return;
      }
      router.push("/member");
      router.refresh();
    } catch {
      setError("通信に失敗しました");
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="auth-card__tag">会員サイトログイン</p>
      <h1 className="auth-card__title">
        まな式AIマネタイズ完全攻略プログラム
      </h1>
      <p className="auth-card__desc">
        セミナー・レビュー・教材を会員専用で管理します。ログインして受講を開始してください。
      </p>
      <form className="form-stack" onSubmit={handleSubmit} autoComplete="on">
        <label className="form-field">
          <span>ユーザー名</span>
          <input name="username" type="text" required />
        </label>
        <label className="form-field">
          <span>パスワード</span>
          <input name="password" type="password" required />
        </label>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
        {error && <p className="inline-message">{error}</p>}
      </form>
    </section>
  );
}
