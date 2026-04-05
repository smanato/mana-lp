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
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -8, borderRadius: 24, background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(217,119,6,0.08))', filter: 'blur(12px)' }} />
          <img
            src="/robot-icon.png"
            alt=""
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              if (el.src.endsWith('.png')) { el.src = '/robot-icon.svg'; }
              else { el.parentElement!.parentElement!.style.display = 'none'; }
            }}
            style={{ position: 'relative', width: 96, height: 96, borderRadius: 20, objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          />
        </div>
      </div>

      <h1 className="auth-card__title gradient-text">
        まな式AIマネタイズ完全攻略プログラム
      </h1>

      <p className="auth-card__tag">会員サイトログイン</p>

      <p className="auth-card__desc">
        セミナー・レビュー・教材を会員専用で管理します。ログインして受講を開始してください。
      </p>

      <form className="form-stack" onSubmit={handleSubmit} autoComplete="on">
        <label className="form-field">
          <span>ユーザー名</span>
          <input
            name="username"
            type="text"
            required
            placeholder="ユーザー名を入力"
            autoComplete="username"
          />
        </label>

        <label className="form-field">
          <span>パスワード</span>
          <input
            name="password"
            type="password"
            required
            placeholder="パスワードを入力"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: 8,
            background: 'linear-gradient(135deg, #DC2626, #e64a3a)',
            boxShadow: '0 4px 16px rgba(220,38,38,0.25)',
            fontSize: 15,
            letterSpacing: '0.02em',
            opacity: loading ? 0.8 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {loading ? "Loading..." : "ログイン"}
        </button>

        {error && (
          <p
            className="inline-message"
            style={{
              animation: "fadeInUp 0.3s ease both",
            }}
          >
            {error}
          </p>
        )}
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#94A3B8' }}>
        Powered by まな式AIマネタイズ
      </p>
    </section>
  );
}
