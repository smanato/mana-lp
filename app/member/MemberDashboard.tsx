"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  archives: Array<{
    id: string;
    sessionNo: number;
    title: string;
    youtubeUrl: string;
    date: string;
    duration: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    category: string;
    createdAt: string;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Scroll Reveal Hook                                                 */
/* ------------------------------------------------------------------ */

function useScrollReveal(ready: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
      );
      el.querySelectorAll(".reveal, .reveal-stagger").forEach((child) =>
        observer.observe(child)
      );
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [ready]);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  Topbar Scroll Shadow Hook                                          */
/* ------------------------------------------------------------------ */

function useScrollShadow() {
  useEffect(() => {
    const topbar = document.querySelector(".topbar");
    if (!topbar) return;

    function onScroll() {
      if (window.scrollY > 8) {
        topbar!.classList.add("is-scrolled");
      } else {
        topbar!.classList.remove("is-scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

/* ------------------------------------------------------------------ */
/*  Robot Icon Fallback                                                 */
/* ------------------------------------------------------------------ */

function handleRobotIconError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.target as HTMLImageElement;
  if (el.src.endsWith(".png")) {
    el.src = "/robot-icon.svg";
  } else {
    el.style.display = "none";
  }
}

/* ================================================================== */
/*  MAIN DASHBOARD                                                     */
/* ================================================================== */

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
  const contentRef = useScrollReveal(!!site);
  useScrollShadow();

  /* ── Data Fetching ── */

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

  /* ── Flash Message ── */

  function flash(text: string, kind = "success") {
    setMsg({ text, kind });
    setTimeout(() => setMsg(null), 4000);
  }

  /* ── Logout ── */

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  /* ── Loading State ── */

  if (!site) {
    return (
      <div className="skeleton">
        <div className="skeleton__logo">
          <img
            src="/robot-icon.png"
            alt=""
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              objectFit: "cover",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="skeleton__spinner" />
        <p className="skeleton__text">Loading...</p>
      </div>
    );
  }

  /* ── Derived Data ── */

  const program = site.program;
  const heroSlot = site.imageSlots.find((s) => s.id === "hero");
  const completed = new Set(site.progress.completedSessionIds);

  /* ── Render ── */

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────── */}
      <header className="topbar">
        <div className="brand">
          <div
            className="brand__mark"
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/robot-icon.png"
              alt="M"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                objectFit: "cover",
              }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                if (el.src.endsWith(".png")) {
                  el.src = "/robot-icon.svg";
                } else {
                  el.style.display = "none";
                  el.parentElement!.textContent = "M";
                }
              }}
            />
          </div>
          <div>
            <p className="brand__sub">Member Site</p>
            <p className="brand__title">まな式AIマネタイズ</p>
          </div>
        </div>

        <nav className="topbar__nav">
          <a
            href="#schedule"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            スケジュール
          </a>
          <a
            href="#curriculum"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            カリキュラム
          </a>
          <a
            href="#resources"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            教材
          </a>
          <a
            href="#announcements"
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            お知らせ
          </a>
        </nav>

        <div className="topbar__actions">
          <p className="current-user">
            {user.name} ({user.role})
          </p>
          <button
            className="btn btn--ghost"
            onClick={logout}
            type="button"
            style={{ padding: "6px 14px", fontSize: 13 }}
          >
            ログアウト
          </button>
          {isAdmin && (
            <a href="/admin" className="btn btn--secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
              管理画面
            </a>
          )}
        </div>
      </header>

      {msg && (
        <p className={`global-message global-message--${msg.kind}`}>
          {msg.text}
        </p>
      )}

      <div className="content-stack" ref={contentRef}>
        {/* ── Hero ──────────────────────────────────── */}
        <section className="reveal" style={{ padding: "48px 0" }}>
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
              <h1 className="hero__title gradient-text">
                {program.name || "プログラム"}
              </h1>
              <p className="hero__desc">
                セミナーとレビューを軸に、毎週の実装を積み上げて成果物完成まで進めます。
              </p>
              <div
                className="meta-grid"
                style={{ gridTemplateColumns: "1fr 1fr" }}
              >
                {(
                  [
                    ["期間", program.period],
                    ["講義", program.lectures],
                  ] as const
                ).map(([label, value]) => (
                  <div className="meta-item" key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Progress ─────────────────────────────── */}
        <section className="panel reveal">
          <h2 className="panel__title">進捗トラッカー</h2>
          <div className="progress-labels">
            <p>完了セッション</p>
            <strong className="gradient-text">
              {site.progress.completedSessionIds.length} /{" "}
              {site.progress.totalSessions}
            </strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${site.progress.ratio}%` }} />
          </div>
          <div className="milestone-grid reveal-stagger">
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

        {/* ── Methods ──────────────────────────────── */}
        <section className="panel reveal">
          <h2 className="panel__title">4設計メソッド</h2>
          <div className="method-grid reveal-stagger">
            {site.methods.map((m) => (
              <article
                className="method-card"
                key={m.step}
                style={{ position: "relative", overflow: "hidden" }}
              >
                <p className="method-card__step">STEP {m.step}</p>
                <h3>{m.title}</h3>
                <p>{strip(m.description)}</p>
                <span
                  style={{
                    position: "absolute",
                    right: -8,
                    bottom: -12,
                    fontSize: 72,
                    fontWeight: 900,
                    opacity: 0.04,
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {m.step}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* ── Session Types ────────────────────────── */}
        <section className="panel reveal">
          <h2 className="panel__title">セッション種別</h2>
          <div className="session-type-grid reveal-stagger">
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
                    className="btn btn--zoom"
                    style={{ marginTop: 12, display: "inline-flex" }}
                  >
                    Zoomで参加する
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ── Schedule ─────────────────────────────── */}
        <section id="schedule" className="panel reveal">
          <h2 className="panel__title">全日程スケジュール</h2>
          <div className="schedule-stack">
            {site.modules.map((mod) => (
              <section className="module reveal" key={mod.id}>
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
                        <td style={{ fontWeight: 600, color: "#6b7280" }}>
                          {s.no}
                        </td>
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
                                className="btn btn--zoom"
                                style={{ marginLeft: 8 }}
                              >
                                Zoom
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

        {/* ── Curriculum ───────────────────────────── */}
        <section id="curriculum" className="panel reveal">
          <h2 className="panel__title">カリキュラム詳細</h2>
          <div className="curriculum-grid reveal-stagger">
            {site.curriculum.map((item) => {
              const slot = site.imageSlots.find(
                (s) => s.id === `session-${item.sessionNo}`
              );
              return (
                <article className="curriculum-card" key={item.sessionNo}>
                  <div
                    className="curriculum-card__media"
                    style={{ position: "relative" }}
                  >
                    {slot?.url ? (
                      <img
                        src={slot.url}
                        alt={`第${item.sessionNo}回サムネイル`}
                      />
                    ) : (
                      <div className="placeholder">サムネイル未設定</div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.03) 100%)",
                        pointerEvents: "none",
                      }}
                    />
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

        {/* ── Resources + Bonuses ──────────────────── */}
        <section id="resources" className="panel two-column reveal">
          <div>
            <h2 className="panel__title">教材・テンプレート</h2>
            <div className="resource-stack reveal-stagger">
              {/* 管理画面から追加された資料をリンクボタン付きで表示 */}
              {site.documents && site.documents.map((doc) => (
                <article
                  className="resource-item"
                  key={doc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className="badge badge--qa"
                        style={{ fontSize: 10 }}
                      >
                        {doc.category}
                      </span>
                      <h3>{doc.title}</h3>
                    </div>
                    {doc.description && <p>{doc.description}</p>}
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary"
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      padding: "8px 16px",
                    }}
                  >
                    開く →
                  </a>
                </article>
              ))}
              {/* 静的な教材・テンプレート一覧 */}
              {site.resources.map((r) => (
                <article className="resource-item" key={r.id}>
                  <h3>{strip(r.title)}</h3>
                  <p>{strip(r.note)}</p>
                </article>
              ))}
              {/* 両方とも空の場合 */}
              {(!site.documents || site.documents.length === 0) &&
                site.resources.length === 0 && (
                  <p style={{ color: "#94A3B8", fontSize: 13 }}>
                    管理画面から資料を追加してください。
                  </p>
                )}
            </div>
          </div>
          <div>
            <h2 className="panel__title">豪華特典</h2>
            <div className="bonus-stack reveal-stagger">
              {site.bonuses.map((b) => (
                <article className="bonus-item" key={b.id}>
                  <h3>{strip(b.title)}</h3>
                  <p>{strip(b.description)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Announcements ────────────────────────── */}
        <section id="announcements" className="panel reveal">
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
                      style={{ padding: "4px 10px", fontSize: 12 }}
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

        {/* ── Archives ─────────────────────────────── */}
        {site.archives && site.archives.length > 0 && (
          <section className="panel reveal">
            <h2 className="panel__title">セミナーアーカイブ</h2>
            <div className="curriculum-grid reveal-stagger">
              {site.archives.map((archive) => {
                // Extract YouTube video ID for thumbnail
                const videoId = archive.youtubeUrl?.match(/(?:youtu\.be\/|v=)([^&?]+)/)?.[1] || "";
                return (
                  <article className="curriculum-card" key={archive.id}>
                    <div className="curriculum-card__media" style={{ position: 'relative', minHeight: 180 }}>
                      {videoId ? (
                        <a href={archive.youtubeUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt={archive.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: 0, height: 0, borderLeft: '18px solid white', borderTop: '11px solid transparent', borderBottom: '11px solid transparent', marginLeft: 4 }} />
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="placeholder">サムネイル未取得</div>
                      )}
                    </div>
                    <div className="curriculum-card__body">
                      <h3>{archive.title}</h3>
                      <p style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                        <span>{archive.date}</span>
                        {archive.duration && <span>{archive.duration}</span>}
                      </p>
                      <a href={archive.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        className="btn btn--zoom" style={{ marginTop: 12, display: 'inline-flex' }}>
                        アーカイブを視聴する
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 配布資料セクションは「教材・テンプレート」に統合済み ── */}

        {/* ── Support ──────────────────────────────── */}
        <section className="panel panel--support reveal">
          <h2 className="panel__title">サポート導線</h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
            }}
          >
            <img
              src="/robot-icon.png"
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                objectFit: "cover",
                flexShrink: 0,
              }}
              onError={handleRobotIconError}
            />
            <p style={{ color: "#64748B", fontSize: 14 }}>
              Discordでの質問が最速です。必要に応じて公式LINEも利用してください。
            </p>
          </div>
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

      </div>
    </>
  );
}

