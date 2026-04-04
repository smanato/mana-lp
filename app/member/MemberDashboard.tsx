"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  name: string;
  role: "admin" | "member";
}

interface ImageSlot {
  id: string;
  label: string;
  note: string;
  url: string;
}

interface SiteData {
  program: Record<string, string>;
  methods: Array<{ step: number; title: string; description: string }>;
  sessionTypes: Array<{
    title: string;
    details: Array<{ label: string; value: string }>;
  }>;
  modules: Array<{
    id: number;
    title: string;
    deliverable: string;
    sessions: Array<{
      no: number;
      date: string;
      weekday: string;
      time: string;
      type: string;
      kind: string;
      topic: string;
    }>;
  }>;
  curriculum: Array<{
    sessionNo: number;
    title: string;
    bullets: string[];
    deliverable: string;
  }>;
  resources: Array<{ id: string; title: string; note: string }>;
  bonuses: Array<{ id: string; title: string; description: string }>;
  links: { discordUrl: string; lineUrl: string; zoomUrl: string };
  imageSlots: ImageSlot[];
  progress: {
    completedSessionIds: number[];
    totalSessions: number;
    ratio: number;
  };
  announcements: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
    badge: string;
  }>;
}

function strip(v: string) {
  return v
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .trim();
}

function badgeClass(kind: string) {
  if (kind === "seminar") return "badge badge--seminar";
  if (kind === "qa") return "badge badge--qa";
  return "badge badge--review";
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "通信に失敗しました");
  return data;
}

export default function MemberDashboard({
  initialUser,
}: {
  initialUser: User;
}) {
  const router = useRouter();
  const [user] = useState<User>(initialUser);
  const [site, setSite] = useState<SiteData | null>(null);
  const [msg, setMsg] = useState<{ text: string; kind: string } | null>(null);
  const isAdmin = user.role === "admin";

  const loadSite = useCallback(async () => {
    try {
      const data = await api("/api/site");
      setSite(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes("ログイン")) {
        router.push("/");
        return;
      }
      flash(err instanceof Error ? err.message : "読み込み失敗", "error");
    }
  }, [router]);

  useEffect(() => {
    loadSite();
  }, [loadSite]);

  function flash(text: string, kind = "success") {
    setMsg({ text, kind });
    setTimeout(() => setMsg(null), 4000);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  if (!site) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#b3bed0" }}>
        読み込み中...
      </div>
    );
  }

  const program = site.program;
  const heroSlot = site.imageSlots.find((s) => s.id === "hero");
  const completed = new Set(site.progress.completedSessionIds);

  return (
    <>
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">M</div>
          <div>
            <p className="brand__sub">Member Site</p>
            <p className="brand__title">まな式AIマネタイズ</p>
          </div>
        </div>
        <nav className="topbar__nav">
          <a href="#schedule">スケジュール</a>
          <a href="#curriculum">カリキュラム</a>
          <a href="#resources">教材</a>
          <a href="#announcements">お知らせ</a>
        </nav>
        <div className="topbar__actions">
          <p className="current-user">
            {user.name} ({user.role})
          </p>
          <button className="btn btn--ghost" onClick={logout} type="button">
            ログアウト
          </button>
        </div>
      </header>

      {msg && (
        <p className={`global-message global-message--${msg.kind}`}>
          {msg.text}
        </p>
      )}

      <div className="content-stack">
        {/* Hero */}
        <section className="panel panel--hero">
          <div className="hero">
            <div className="hero__media">
              {heroSlot?.url ? (
                <img src={heroSlot.url} alt="メインビジュアル" />
              ) : (
                <div className="placeholder">
                  メインビジュアル未設定
                  <br />
                  管理画面から画像URLを設定できます
                </div>
              )}
            </div>
            <div>
              <p className="hero__tag">会員限定プログラム</p>
              <h1 className="hero__title">{program.name || "プログラム"}</h1>
              <p className="hero__desc">
                セミナーとレビューを軸に、毎週の実装を積み上げて成果物完成まで進めます。
              </p>
              <div className="meta-grid">
                {[
                  ["期間", program.period],
                  ["講義", program.lectures],
                  ["定員", program.capacity],
                  ["卒業条件", program.graduationCondition],
                ].map(([label, value]) => (
                  <div className="meta-item" key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="panel">
          <h2 className="panel__title">進捗トラッカー</h2>
          <div className="progress-labels">
            <p>完了セッション</p>
            <strong>
              {site.progress.completedSessionIds.length} /{" "}
              {site.progress.totalSessions}
            </strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${site.progress.ratio}%` }} />
          </div>
          <div className="milestone-grid">
            {site.curriculum.map((item) => (
              <div
                key={item.sessionNo}
                className={`milestone ${completed.has(item.sessionNo) ? "is-done" : ""}`}
              >
                <p>第{item.sessionNo}回</p>
                <strong>{strip(item.title).slice(0, 24)}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Methods */}
        <section className="panel">
          <h2 className="panel__title">4設計メソッド</h2>
          <div className="method-grid">
            {site.methods.map((m) => (
              <article className="method-card" key={m.step}>
                <p className="method-card__step">STEP {m.step}</p>
                <h3>{m.title}</h3>
                <p>{strip(m.description)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Session Types */}
        <section className="panel">
          <h2 className="panel__title">セッション種別</h2>
          <div className="session-type-grid">
            {site.sessionTypes.map((t) => (
              <article className="session-card" key={t.title}>
                <h3>{t.title}</h3>
                <ul>
                  {t.details.map((d, i) => (
                    <li key={i}>
                      {d.label ? (
                        <>
                          <strong>{d.label}:</strong> {strip(d.value)}
                        </>
                      ) : (
                        strip(d.value)
                      )}
                    </li>
                  ))}
                </ul>
                {t.title.includes("セミナー") && site.links.zoomUrl && (
                  <a
                    href={site.links.zoomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary"
                    style={{ marginTop: 10, display: "inline-block", fontSize: 12 }}
                  >
                    Zoomで参加する
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Schedule */}
        <section id="schedule" className="panel">
          <h2 className="panel__title">全日程スケジュール</h2>
          <div className="schedule-stack">
            {site.modules.map((mod) => (
              <section className="module" key={mod.id}>
                <div className="module__head">
                  <strong>
                    Module {mod.id} | {mod.title}
                  </strong>
                  <p>成果物: {strip(mod.deliverable)}</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>日付</th>
                      <th>時間</th>
                      <th>種別</th>
                      <th>内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mod.sessions.map((s) => (
                      <tr key={s.no}>
                        <td>{s.no}</td>
                        <td>
                          {s.date}（{s.weekday}）
                        </td>
                        <td>{s.time}</td>
                        <td>
                          <span className={badgeClass(s.kind)}>{s.type}</span>
                        </td>
                        <td>
                          {strip(s.topic)}
                          {s.kind === "seminar" && site.links.zoomUrl && (
                            <>
                              {" "}
                              <a
                                href={site.links.zoomUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn--primary"
                                style={{ fontSize: 11, padding: "4px 10px", marginLeft: 6 }}
                              >
                                Zoom参加
                              </a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </section>

        {/* Curriculum */}
        <section id="curriculum" className="panel">
          <h2 className="panel__title">カリキュラム詳細</h2>
          <div className="curriculum-grid">
            {site.curriculum.map((item) => {
              const slot = site.imageSlots.find(
                (s) => s.id === `session-${item.sessionNo}`
              );
              return (
                <article className="curriculum-card" key={item.sessionNo}>
                  <div className="curriculum-card__media">
                    {slot?.url ? (
                      <img
                        src={slot.url}
                        alt={`第${item.sessionNo}回サムネイル`}
                      />
                    ) : (
                      <div className="placeholder">サムネイル未設定</div>
                    )}
                  </div>
                  <div className="curriculum-card__body">
                    <h3>
                      第{item.sessionNo}回: {strip(item.title)}
                    </h3>
                    <ul>
                      {item.bullets.map((b, i) => (
                        <li key={i}>{strip(b)}</li>
                      ))}
                    </ul>
                    <p className="curriculum-card__deliverable">
                      成果物: {strip(item.deliverable)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Resources + Bonuses */}
        <section id="resources" className="panel two-column">
          <div>
            <h2 className="panel__title">教材・テンプレート</h2>
            <div className="resource-stack">
              {site.resources.map((r) => (
                <article className="resource-item" key={r.id}>
                  <h3>{strip(r.title)}</h3>
                  <p>{strip(r.note)}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <h2 className="panel__title">豪華特典</h2>
            <div className="bonus-stack">
              {site.bonuses.map((b) => (
                <article className="bonus-item" key={b.id}>
                  <h3>{strip(b.title)}</h3>
                  <p>{strip(b.description)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section id="announcements" className="panel">
          <h2 className="panel__title">お知らせ</h2>
          <div className="announcement-stack">
            {site.announcements.map((a) => (
              <article className="announcement-item" key={a.id}>
                <p className="announcement-item__date">{a.date}</p>
                <div>
                  <h3>{strip(a.title)}</h3>
                  <p>{strip(a.description)}</p>
                </div>
                <div className="form-inline">
                  <span
                    className={`badge ${a.badge === "NEW" ? "badge--seminar" : "badge--qa"}`}
                  >
                    {a.badge}
                  </span>
                  {isAdmin && (
                    <button
                      className="btn btn--danger"
                      type="button"
                      onClick={async () => {
                        try {
                          await api(
                            `/api/admin/announcements?id=${encodeURIComponent(a.id)}`,
                            { method: "DELETE" }
                          );
                          flash("お知らせを削除しました");
                          loadSite();
                        } catch (err) {
                          flash(
                            err instanceof Error ? err.message : "失敗",
                            "error"
                          );
                        }
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Support */}
        <section className="panel panel--support">
          <h2 className="panel__title">サポート導線</h2>
          <p>
            Discordでの質問が最速です。必要に応じて公式LINEも利用してください。
          </p>
          <div className="support-links">
            <a
              href={site.links.discordUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              Discordを開く
            </a>
            <a
              href={site.links.lineUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--secondary"
            >
              公式LINEを開く
            </a>
          </div>
        </section>

        {/* Admin Panel */}
        {isAdmin && (
          <AdminPanel site={site} flash={flash} reload={loadSite} />
        )}
      </div>
    </>
  );
}

function AdminPanel({
  site,
  flash,
  reload,
}: {
  site: SiteData;
  flash: (t: string, k?: string) => void;
  reload: () => Promise<void>;
}) {
  const doneSet = new Set(site.progress.completedSessionIds);

  async function handleProgress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ids = form
      .getAll("completedSessionIds")
      .map((v) => parseInt(String(v), 10));
    try {
      await api("/api/admin/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedSessionIds: ids }),
      });
      flash("進捗を更新しました");
      reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "失敗", "error");
    }
  }

  async function handleLinks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/admin/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordUrl: form.get("discordUrl"),
          lineUrl: form.get("lineUrl"),
          zoomUrl: form.get("zoomUrl"),
        }),
      });
      flash("導線リンクを更新しました");
      reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "失敗", "error");
    }
  }

  async function handleAnnouncement(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          badge: form.get("badge"),
        }),
      });
      e.currentTarget.reset();
      flash("お知らせを追加しました");
      reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "失敗", "error");
    }
  }

  async function handleImageUrl(e: FormEvent<HTMLFormElement>, slotId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, url: form.get("url") }),
      });
      flash(`${slotId} の画像URLを更新しました`);
      reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "失敗", "error");
    }
  }

  async function clearImage(slotId: string) {
    try {
      await api(
        `/api/admin/images?slotId=${encodeURIComponent(slotId)}`,
        { method: "DELETE" }
      );
      flash(`${slotId} の画像を削除しました`);
      reload();
    } catch (err) {
      flash(err instanceof Error ? err.message : "失敗", "error");
    }
  }

  return (
    <section className="panel">
      <h2 className="panel__title">管理パネル</h2>
      <div className="admin-layout">
        {/* Progress */}
        <section className="admin-card">
          <h3>進捗更新</h3>
          <form onSubmit={handleProgress}>
            <div className="checkbox-grid">
              {site.curriculum.map((item) => (
                <label key={item.sessionNo}>
                  <input
                    type="checkbox"
                    name="completedSessionIds"
                    value={item.sessionNo}
                    defaultChecked={doneSet.has(item.sessionNo)}
                  />
                  第{item.sessionNo}回
                </label>
              ))}
            </div>
            <div className="form-inline" style={{ marginTop: 10 }}>
              <button type="submit" className="btn btn--primary">
                進捗を保存
              </button>
            </div>
          </form>
        </section>

        {/* Links */}
        <section className="admin-card">
          <h3>導線リンク更新</h3>
          <form className="form-stack" onSubmit={handleLinks}>
            <label className="form-field">
              <span>Discord URL</span>
              <input
                type="url"
                name="discordUrl"
                defaultValue={site.links.discordUrl}
                placeholder="https://..."
              />
            </label>
            <label className="form-field">
              <span>公式LINE URL</span>
              <input
                type="url"
                name="lineUrl"
                defaultValue={site.links.lineUrl}
                placeholder="https://..."
              />
            </label>
            <label className="form-field">
              <span>Zoom URL（セミナー用）</span>
              <input
                type="url"
                name="zoomUrl"
                defaultValue={site.links.zoomUrl}
                placeholder="https://zoom.us/..."
              />
            </label>
            <button type="submit" className="btn btn--secondary">
              リンクを保存
            </button>
          </form>
        </section>

        {/* Images */}
        <section className="admin-card">
          <h3>画像URL設定（7箇所）</h3>
          <div className="upload-grid">
            {site.imageSlots.map((slot) => (
              <article className="upload-item" key={slot.id}>
                <strong>{slot.label}</strong>
                <p>{slot.note}</p>
                {slot.url ? (
                  <img src={slot.url} alt={slot.label} />
                ) : (
                  <div className="placeholder">未設定</div>
                )}
                <form
                  onSubmit={(e) => handleImageUrl(e, slot.id)}
                  className="form-stack"
                  style={{ marginTop: 6 }}
                >
                  <input
                    type="url"
                    name="url"
                    placeholder="画像URL (https://...)"
                    defaultValue={slot.url || ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "#101723",
                      color: "var(--text)",
                      font: "inherit",
                      fontSize: 12,
                    }}
                  />
                  <div className="form-inline">
                    <button type="submit" className="btn btn--secondary">
                      設定
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      onClick={() => clearImage(slot.id)}
                    >
                      削除
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        </section>

        {/* Announcements */}
        <section className="admin-card">
          <h3>お知らせ追加</h3>
          <form className="form-stack" onSubmit={handleAnnouncement}>
            <label className="form-field">
              <span>タイトル</span>
              <input type="text" name="title" required maxLength={120} />
            </label>
            <label className="form-field">
              <span>本文</span>
              <textarea name="description" required maxLength={500} />
            </label>
            <label className="form-field">
              <span>バッジ</span>
              <select name="badge">
                <option value="NEW">NEW</option>
                <option value="INFO">INFO</option>
              </select>
            </label>
            <button type="submit" className="btn btn--primary">
              お知らせを追加
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
