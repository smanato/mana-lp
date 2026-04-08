"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "member";
}

interface Announcement {
  id: string;
  date: string;
  title: string;
  description: string;
  badge: "NEW" | "INFO";
}

interface ImageSlot {
  id: string;
  label: string;
  note: string;
  url: string;
  filename: string;
  updatedAt: string | null;
}

interface Archive {
  id: string;
  sessionNo: number;
  title: string;
  youtubeUrl: string;
  date: string;
  duration: string;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  createdAt: string;
}

interface SiteLinks {
  discordUrl: string;
  lineUrl: string;
  zoomUrl: string;
}

interface SiteData {
  announcements: Announcement[];
  imageSlots: ImageSlot[];
  archives: Archive[];
  documents: Document[];
  links: SiteLinks;
  progress: {
    completedSessionIds: number[];
    totalSessions: number;
    ratio: number;
    updatedAt: string | null;
  };
  curriculum: Array<{ sessionNo: number; title: string }>;
}

type TabId =
  | "overview"
  | "announcements"
  | "images"
  | "archives"
  | "documents"
  | "users"
  | "links"
  | "progress";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "users", label: "会員管理" },
  { id: "announcements", label: "お知らせ管理" },
  { id: "images", label: "画像管理" },
  { id: "archives", label: "アーカイブ管理" },
  { id: "documents", label: "資料管理" },
  { id: "links", label: "リンク設定" },
  { id: "progress", label: "進捗管理" },
];

interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "member";
}

const CATEGORY_LABELS: Record<string, string> = {
  template: "テンプレート",
  slide: "スライド",
  worksheet: "ワークシート",
  other: "その他",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  template: { bg: "#DBEAFE", text: "#1D4ED8" },
  slide: { bg: "#FEF3C7", text: "#B45309" },
  worksheet: { bg: "#D1FAE5", text: "#065F46" },
  other: { bg: "#F3F4F6", text: "#374151" },
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
  );
  return match ? match[1] : null;
}

// -- Inline style helpers --

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F8FAFC",
    fontFamily: "'Inter', 'Noto Sans JP', sans-serif",
    color: "#1E293B",
  } as React.CSSProperties,
  header: {
    height: 56,
    background: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  } as React.CSSProperties,
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0F172A",
    letterSpacing: "-0.01em",
  } as React.CSSProperties,
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  } as React.CSSProperties,
  headerUser: {
    fontSize: 13,
    color: "#64748B",
  } as React.CSSProperties,
  headerLink: {
    fontSize: 13,
    color: "#DC2626",
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer",
  } as React.CSSProperties,
  headerLogout: {
    fontSize: 13,
    color: "#64748B",
    background: "none",
    border: "1px solid #E2E8F0",
    borderRadius: 6,
    padding: "4px 12px",
    cursor: "pointer",
    fontWeight: 500,
  } as React.CSSProperties,
  body: {
    display: "flex",
    minHeight: "calc(100vh - 56px)",
  } as React.CSSProperties,
  sidebar: {
    width: 240,
    minWidth: 240,
    background: "#FFFFFF",
    borderRight: "1px solid #E2E8F0",
    padding: "20px 0",
  } as React.CSSProperties,
  sidebarLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#94A3B8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    padding: "0 20px",
    marginBottom: 8,
  } as React.CSSProperties,
  tabButton: (active: boolean) =>
    ({
      display: "block",
      width: "100%",
      textAlign: "left" as const,
      padding: "10px 20px",
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? "#DC2626" : "#475569",
      background: active ? "#FEF2F2" : "transparent",
      border: "none",
      borderLeft: active ? "3px solid #DC2626" : "3px solid transparent",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }) as React.CSSProperties,
  main: {
    flex: 1,
    padding: "28px 32px",
    maxWidth: 960,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0F172A",
    marginBottom: 20,
  } as React.CSSProperties,
  card: {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    padding: 20,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  } as React.CSSProperties,
  statCard: (color: string) =>
    ({
      background: "#FFFFFF",
      borderRadius: 12,
      border: "1px solid #E2E8F0",
      padding: "20px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      borderTop: `3px solid ${color}`,
    }) as React.CSSProperties,
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0F172A",
    lineHeight: 1.2,
  } as React.CSSProperties,
  statLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  } as React.CSSProperties,
  formGroup: {
    marginBottom: 14,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    outline: "none",
    background: "#FFFFFF",
    color: "#1E293B",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  select: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    outline: "none",
    background: "#FFFFFF",
    color: "#1E293B",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  btnPrimary: {
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#FFFFFF",
    background: "#DC2626",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.15s",
  } as React.CSSProperties,
  btnSecondary: {
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    background: "#F3F4F6",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    cursor: "pointer",
  } as React.CSSProperties,
  btnDanger: {
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#DC2626",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 6,
    cursor: "pointer",
  } as React.CSSProperties,
  btnSmall: {
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#FFFFFF",
    background: "#2563EB",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  } as React.CSSProperties,
  badge: (bg: string, text: string) =>
    ({
      display: "inline-block",
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 4,
      background: bg,
      color: text,
    }) as React.CSSProperties,
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid #F1F5F9",
  } as React.CSSProperties,
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  } as React.CSSProperties,
  imageCard: {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  imagePreview: {
    width: "100%",
    height: 160,
    objectFit: "cover" as const,
    background: "#F1F5F9",
    display: "block",
  } as React.CSSProperties,
  imagePlaceholder: {
    width: "100%",
    height: 160,
    background: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94A3B8",
    fontSize: 13,
  } as React.CSSProperties,
  archiveCard: {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    display: "flex",
    gap: 0,
  } as React.CSSProperties,
  archiveThumbnail: {
    width: 200,
    minWidth: 200,
    height: 112,
    objectFit: "cover" as const,
    background: "#0F172A",
    display: "block",
  } as React.CSSProperties,
  archiveBody: {
    flex: 1,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
  } as React.CSSProperties,
  docCard: {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  } as React.CSSProperties,
  successMsg: {
    padding: "10px 16px",
    background: "#D1FAE5",
    color: "#065F46",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 16,
  } as React.CSSProperties,
  errorMsg: {
    padding: "10px 16px",
    background: "#FEF2F2",
    color: "#991B1B",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 16,
  } as React.CSSProperties,
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "50vh",
    fontSize: 15,
    color: "#64748B",
  } as React.CSSProperties,
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #F1F5F9",
  } as React.CSSProperties,
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#DC2626",
    cursor: "pointer",
  } as React.CSSProperties,
};

export default function AdminDashboard({
  initialUser,
}: {
  initialUser: SessionUser;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states
  const [annTitle, setAnnTitle] = useState("");
  const [annDesc, setAnnDesc] = useState("");
  const [annBadge, setAnnBadge] = useState<"NEW" | "INFO">("NEW");

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const [arcSessionNo, setArcSessionNo] = useState(1);
  const [arcTitle, setArcTitle] = useState("");
  const [arcUrl, setArcUrl] = useState("");
  const [arcDate, setArcDate] = useState("");
  const [arcDuration, setArcDuration] = useState("");

  const [docTitle, setDocTitle] = useState("");
  const [docDesc, setDocDesc] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState("template");

  const [discordUrl, setDiscordUrl] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");

  const [completedIds, setCompletedIds] = useState<number[]>([]);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserAutoPw, setNewUserAutoPw] = useState(true);
  const [newUserRole, setNewUserRole] = useState<"admin" | "member">("member");
  const [generatedCredential, setGeneratedCredential] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const flash = useCallback(
    (type: "success" | "error", text: string) => {
      setFeedback({ type, text });
      setTimeout(() => setFeedback(null), 3000);
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/site");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
      setDiscordUrl(json.links?.discordUrl || "");
      setLineUrl(json.links?.lineUrl || "");
      setZoomUrl(json.links?.zoomUrl || "");
      setCompletedIds(json.progress?.completedSessionIds || []);
    } catch {
      flash("error", "データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      setUsers(json.users || []);
    } catch {
      flash("error", "会員一覧の読み込みに失敗しました");
    }
  }, [flash]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [loadData, loadUsers]);

  // ─── User management ───
  const handleAddUser = async () => {
    if (!newUserUsername.trim() || !newUserName.trim()) {
      flash("error", "ユーザー名と表示名を入力してください");
      return;
    }
    if (!newUserAutoPw && newUserPassword.length < 8) {
      flash("error", "パスワードは8文字以上で入力してください");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUserUsername.trim(),
          name: newUserName.trim(),
          password: newUserAutoPw ? undefined : newUserPassword,
          autoPassword: newUserAutoPw,
          role: newUserRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "会員追加に失敗しました");
        return;
      }
      flash("success", "会員を追加しました");
      if (json.password) {
        setGeneratedCredential({
          username: newUserUsername.trim(),
          password: json.password,
        });
      }
      setNewUserUsername("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("member");
      loadUsers();
    } catch {
      flash("error", "会員追加に失敗しました");
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    if (!confirm(`${username} のパスワードをリセットしますか？`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resetPassword: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "パスワードリセットに失敗しました");
        return;
      }
      flash("success", "パスワードをリセットしました");
      if (json.password) {
        setGeneratedCredential({ username, password: json.password });
      }
      loadUsers();
    } catch {
      flash("error", "パスワードリセットに失敗しました");
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`${username} を削除しますか？（元に戻せません）`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "削除に失敗しました");
        return;
      }
      flash("success", "会員を削除しました");
      loadUsers();
    } catch {
      flash("error", "削除に失敗しました");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  // -- API helpers --

  const addAnnouncement = async () => {
    if (!annTitle.trim() || !annDesc.trim()) {
      flash("error", "タイトルと本文を入力してください");
      return;
    }
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          description: annDesc,
          badge: annBadge,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) => (d ? { ...d, announcements: json.announcements } : d));
      setAnnTitle("");
      setAnnDesc("");
      flash("success", "お知らせを追加しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) => (d ? { ...d, announcements: json.announcements } : d));
      flash("success", "お知らせを削除しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const setImage = async (slotId: string) => {
    const url = imageUrls[slotId] || "";
    if (!url.trim()) {
      flash("error", "URLを入力してください");
      return;
    }
    try {
      const res = await fetch("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await loadData();
      setImageUrls((prev) => ({ ...prev, [slotId]: "" }));
      flash("success", "画像を更新しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const deleteImage = async (slotId: string) => {
    try {
      const res = await fetch(`/api/admin/images?slotId=${slotId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      await loadData();
      flash("success", "画像を削除しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const addArchive = async () => {
    if (!arcTitle.trim() || !arcUrl.trim() || !arcDate.trim()) {
      flash("error", "必須項目を入力してください");
      return;
    }
    try {
      const res = await fetch("/api/admin/archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionNo: arcSessionNo,
          title: arcTitle,
          youtubeUrl: arcUrl,
          date: arcDate,
          duration: arcDuration,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) => (d ? { ...d, archives: json.archives } : d));
      setArcTitle("");
      setArcUrl("");
      setArcDate("");
      setArcDuration("");
      flash("success", "アーカイブを追加しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const deleteArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/archives?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) => (d ? { ...d, archives: json.archives } : d));
      flash("success", "アーカイブを削除しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const addDocument = async () => {
    if (!docTitle.trim() || !docUrl.trim()) {
      flash("error", "タイトルとURLを入力してください");
      return;
    }
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          description: docDesc,
          url: docUrl,
          category: docCategory,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) => (d ? { ...d, documents: json.documents } : d));
      setDocTitle("");
      setDocDesc("");
      setDocUrl("");
      flash("success", "資料を追加しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/documents?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) => (d ? { ...d, documents: json.documents } : d));
      flash("success", "資料を削除しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const saveLinks = async () => {
    try {
      const res = await fetch("/api/admin/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordUrl, lineUrl, zoomUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) =>
        d ? { ...d, links: json.links } : d
      );
      flash("success", "リンクを保存しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const saveProgress = async () => {
    try {
      const res = await fetch("/api/admin/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedSessionIds: completedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData((d) =>
        d ? { ...d, progress: json.progress } : d
      );
      flash("success", "進捗を保存しました");
    } catch (e: unknown) {
      flash("error", e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  const toggleSession = (no: number) => {
    setCompletedIds((prev) =>
      prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no].sort()
    );
  };

  // -- Render helpers --

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  const renderFeedback = () => {
    if (!feedback) return null;
    return (
      <div
        style={
          feedback.type === "success" ? styles.successMsg : styles.errorMsg
        }
      >
        {feedback.text}
      </div>
    );
  };

  // -- Tab content renderers --

  const renderOverview = () => {
    const completedCount = data?.progress?.completedSessionIds?.length || 0;
    const totalSessions = data?.progress?.totalSessions || 6;
    const annCount = data?.announcements?.length || 0;
    const arcCount = data?.archives?.length || 0;
    const docCount = data?.documents?.length || 0;

    return (
      <div>
        <h2 style={styles.sectionTitle}>概要</h2>
        <div style={styles.statGrid}>
          <div style={styles.statCard("#DC2626")}>
            <div style={styles.statValue}>
              {completedCount}/{totalSessions}
            </div>
            <div style={styles.statLabel}>完了セッション</div>
          </div>
          <div style={styles.statCard("#2563EB")}>
            <div style={styles.statValue}>{annCount}</div>
            <div style={styles.statLabel}>お知らせ数</div>
          </div>
          <div style={styles.statCard("#059669")}>
            <div style={styles.statValue}>{arcCount}</div>
            <div style={styles.statLabel}>アーカイブ数</div>
          </div>
          <div style={styles.statCard("#7C3AED")}>
            <div style={styles.statValue}>{docCount}</div>
            <div style={styles.statLabel}>資料数</div>
          </div>
        </div>

        <div style={styles.card}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: 12,
            }}
          >
            最新のお知らせ
          </div>
          {data?.announcements?.slice(0, 5).map((a) => (
            <div
              key={a.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={styles.badge(
                  a.badge === "NEW" ? "#FEF2F2" : "#EFF6FF",
                  a.badge === "NEW" ? "#DC2626" : "#2563EB"
                )}
              >
                {a.badge}
              </span>
              <span style={{ fontSize: 14, color: "#374151", flex: 1 }}>
                {a.title}
              </span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{a.date}</span>
            </div>
          ))}
          {(!data?.announcements || data.announcements.length === 0) && (
            <div style={{ fontSize: 14, color: "#94A3B8", padding: "12px 0" }}>
              お知らせはありません
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const roleBadge = (role: "admin" | "member") => ({
      display: "inline-block" as const,
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: role === "admin" ? "#FEE2E2" : "#DBEAFE",
      color: role === "admin" ? "#B91C1C" : "#1D4ED8",
    });

    return (
      <div>
        <h2 style={styles.sectionTitle}>会員管理</h2>
        {renderFeedback()}

        {/* 生成されたパスワードを表示 */}
        {generatedCredential && (
          <div
            style={{
              ...styles.card,
              marginBottom: 24,
              borderLeft: "4px solid #DC2626",
              background: "#FEF2F2",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#B91C1C",
                marginBottom: 8,
              }}
            >
              新しいパスワード（この画面を閉じると再表示できません）
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 13, color: "#64748B" }}>
                ユーザー名:{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {generatedCredential.username}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                パスワード:{" "}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F172A",
                  }}
                >
                  {generatedCredential.password}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `ユーザー名: ${generatedCredential.username}\nパスワード: ${generatedCredential.password}`
                  );
                  flash("success", "クリップボードにコピーしました");
                }}
                style={{
                  ...styles.btnPrimary,
                  padding: "6px 12px",
                  fontSize: 12,
                }}
              >
                コピー
              </button>
              <button
                type="button"
                onClick={() => setGeneratedCredential(null)}
                style={{
                  ...styles.btnSecondary,
                  padding: "6px 12px",
                  fontSize: 12,
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* 新規追加フォーム */}
        <div style={{ ...styles.card, marginBottom: 24 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: 14,
            }}
          >
            会員を追加
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <label style={styles.label}>ユーザー名（ログイン用）</label>
              <input
                type="text"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                placeholder="例: tanaka01"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>表示名</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="例: 田中太郎"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>権限</label>
              <select
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(e.target.value as "admin" | "member")
                }
                style={styles.input}
              >
                <option value="member">会員（member）</option>
                <option value="admin">管理者（admin）</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>パスワード</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newUserAutoPw ? "（自動生成されます）" : newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="8文字以上"
                  disabled={newUserAutoPw}
                  style={{
                    ...styles.input,
                    background: newUserAutoPw ? "#F1F5F9" : "#FFFFFF",
                  }}
                />
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  fontSize: 12,
                  color: "#64748B",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newUserAutoPw}
                  onChange={(e) => setNewUserAutoPw(e.target.checked)}
                />
                パスワードを自動生成する
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={handleAddUser}
              style={styles.btnPrimary}
            >
              会員を追加
            </button>
          </div>
        </div>

        {/* 既存会員一覧 */}
        <div style={styles.card}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: 14,
            }}
          >
            登録済み会員 ({users.length})
          </div>
          {users.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>
              まだ会員が登録されていません。
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span style={roleBadge(u.role)}>
                        {u.role === "admin" ? "ADMIN" : "MEMBER"}
                      </span>
                      <strong style={{ fontSize: 14, color: "#0F172A" }}>
                        {u.name}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        fontFamily: "monospace",
                      }}
                    >
                      @{u.username}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(u.id, u.username)}
                      style={{
                        ...styles.btnSecondary,
                        fontSize: 12,
                        padding: "6px 12px",
                      }}
                    >
                      PWリセット
                    </button>
                    {u.id !== initialUser.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        style={{
                          ...styles.btnDanger,
                          fontSize: 12,
                          padding: "6px 12px",
                        }}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnnouncements = () => (
    <div>
      <h2 style={styles.sectionTitle}>お知らせ管理</h2>
      {renderFeedback()}

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 14,
          }}
        >
          お知らせを追加
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>タイトル</label>
          <input
            type="text"
            style={styles.input}
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="お知らせのタイトル"
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>本文</label>
          <textarea
            style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
            value={annDesc}
            onChange={(e) => setAnnDesc(e.target.value)}
            placeholder="お知らせの詳細"
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div style={{ ...styles.formGroup, marginBottom: 0 }}>
            <label style={styles.label}>バッジ</label>
            <select
              style={{ ...styles.select, width: 120 }}
              value={annBadge}
              onChange={(e) => setAnnBadge(e.target.value as "NEW" | "INFO")}
            >
              <option value="NEW">NEW</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
          <button type="button" style={styles.btnPrimary} onClick={addAnnouncement}>
            追加する
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 8,
          }}
        >
          既存のお知らせ ({data?.announcements?.length || 0})
        </div>
        {data?.announcements?.map((a) => (
          <div key={a.id} style={styles.listItem}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={styles.badge(
                    a.badge === "NEW" ? "#FEF2F2" : "#EFF6FF",
                    a.badge === "NEW" ? "#DC2626" : "#2563EB"
                  )}
                >
                  {a.badge}
                </span>
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}
                >
                  {a.title}
                </span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{a.date}</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                {a.description}
              </div>
            </div>
            <button
              type="button"
              style={styles.btnDanger}
              onClick={() => deleteAnnouncement(a.id)}
            >
              削除
            </button>
          </div>
        ))}
        {(!data?.announcements || data.announcements.length === 0) && (
          <div style={{ fontSize: 14, color: "#94A3B8", padding: "16px 0" }}>
            お知らせはありません
          </div>
        )}
      </div>
    </div>
  );

  const renderImages = () => (
    <div>
      <h2 style={styles.sectionTitle}>画像管理</h2>
      {renderFeedback()}
      <div style={styles.imageGrid}>
        {(data?.imageSlots || []).map((slot) => (
          <div key={slot.id} style={styles.imageCard}>
            {slot.url ? (
              <img
                src={slot.url}
                alt={slot.label}
                style={styles.imagePreview}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div style={styles.imagePlaceholder}>未設定</div>
            )}
            <div style={{ padding: 14 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0F172A",
                  marginBottom: 2,
                }}
              >
                {slot.label}
              </div>
              <div
                style={{ fontSize: 12, color: "#94A3B8", marginBottom: 10 }}
              >
                {slot.note}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  style={{ ...styles.input, flex: 1, fontSize: 13 }}
                  placeholder="画像URL"
                  value={imageUrls[slot.id] || ""}
                  onChange={(e) =>
                    setImageUrls((prev) => ({
                      ...prev,
                      [slot.id]: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  style={styles.btnSmall}
                  onClick={() => setImage(slot.id)}
                >
                  設定
                </button>
                {slot.url && (
                  <button
                    type="button"
                    style={styles.btnDanger}
                    onClick={() => deleteImage(slot.id)}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderArchives = () => (
    <div>
      <h2 style={styles.sectionTitle}>アーカイブ管理</h2>
      {renderFeedback()}

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 14,
          }}
        >
          アーカイブを追加
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={styles.formGroup}>
            <label style={styles.label}>セッション番号</label>
            <select
              style={styles.select}
              value={arcSessionNo}
              onChange={(e) => setArcSessionNo(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  Session {n}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>タイトル</label>
            <input
              type="text"
              style={styles.input}
              value={arcTitle}
              onChange={(e) => setArcTitle(e.target.value)}
              placeholder="セッションタイトル"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>YouTube URL (限定公開)</label>
            <input
              type="text"
              style={styles.input}
              value={arcUrl}
              onChange={(e) => setArcUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>日付</label>
            <input
              type="date"
              style={styles.input}
              value={arcDate}
              onChange={(e) => setArcDate(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>再生時間</label>
            <input
              type="text"
              style={styles.input}
              value={arcDuration}
              onChange={(e) => setArcDuration(e.target.value)}
              placeholder="1:30:00"
            />
          </div>
          <div
            style={{
              ...styles.formGroup,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button type="button" style={styles.btnPrimary} onClick={addArchive}>
              追加する
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#0F172A",
          marginBottom: 12,
        }}
      >
        登録済みアーカイブ ({data?.archives?.length || 0})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data?.archives?.map((arc) => {
          const videoId = extractYouTubeId(arc.youtubeUrl);
          const thumbUrl = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : null;
          return (
            <div key={arc.id} style={styles.archiveCard}>
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={arc.title}
                  style={styles.archiveThumbnail}
                />
              ) : (
                <div
                  style={{
                    ...styles.archiveThumbnail,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    fontSize: 12,
                  }}
                >
                  No thumbnail
                </div>
              )}
              <div style={styles.archiveBody}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={styles.badge("#FEF2F2", "#DC2626")}
                    >
                      Session {arc.sessionNo}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0F172A",
                      }}
                    >
                      {arc.title}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <span>{arc.date}</span>
                    {arc.duration && <span>{arc.duration}</span>}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <a
                    href={arc.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...styles.btnSmall,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    YouTube を開く
                  </a>
                  <button
                    type="button"
                    style={styles.btnDanger}
                    onClick={() => deleteArchive(arc.id)}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {(!data?.archives || data.archives.length === 0) && (
          <div
            style={{
              ...styles.card,
              textAlign: "center",
              color: "#94A3B8",
              fontSize: 14,
            }}
          >
            アーカイブはまだありません
          </div>
        )}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div>
      <h2 style={styles.sectionTitle}>資料管理</h2>
      {renderFeedback()}

      <div style={{ ...styles.card, marginBottom: 24 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 14,
          }}
        >
          資料を追加
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={styles.formGroup}>
            <label style={styles.label}>タイトル</label>
            <input
              type="text"
              style={styles.input}
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="資料のタイトル"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>カテゴリ</label>
            <select
              style={styles.select}
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
            >
              <option value="template">テンプレート</option>
              <option value="slide">スライド</option>
              <option value="worksheet">ワークシート</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
            <label style={styles.label}>説明</label>
            <input
              type="text"
              style={styles.input}
              value={docDesc}
              onChange={(e) => setDocDesc(e.target.value)}
              placeholder="資料の簡単な説明"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>URL</label>
            <input
              type="text"
              style={styles.input}
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div
            style={{
              ...styles.formGroup,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <button type="button" style={styles.btnPrimary} onClick={addDocument}>
              追加する
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#0F172A",
          marginBottom: 12,
        }}
      >
        登録済み資料 ({data?.documents?.length || 0})
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {data?.documents?.map((doc) => {
          const catColor = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other;
          const catLabel = CATEGORY_LABELS[doc.category] || doc.category;
          return (
            <div key={doc.id} style={styles.docCard}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={styles.badge(catColor.bg, catColor.text)}>
                  {catLabel}
                </span>
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}
                >
                  {doc.title}
                </span>
              </div>
              {doc.description && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748B",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  {doc.description}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    color: "#2563EB",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  リンクを開く
                </a>
                <button
                  type="button"
                  style={styles.btnDanger}
                  onClick={() => deleteDocument(doc.id)}
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {(!data?.documents || data.documents.length === 0) && (
        <div
          style={{
            ...styles.card,
            textAlign: "center",
            color: "#94A3B8",
            fontSize: 14,
            marginTop: 12,
          }}
        >
          資料はまだありません
        </div>
      )}
    </div>
  );

  const renderLinks = () => (
    <div>
      <h2 style={styles.sectionTitle}>リンク設定</h2>
      {renderFeedback()}
      <div style={styles.card}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Discord URL</label>
          <input
            type="text"
            style={styles.input}
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            placeholder="https://discord.gg/..."
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>LINE URL</label>
          <input
            type="text"
            style={styles.input}
            value={lineUrl}
            onChange={(e) => setLineUrl(e.target.value)}
            placeholder="https://line.me/..."
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Zoom URL</label>
          <input
            type="text"
            style={styles.input}
            value={zoomUrl}
            onChange={(e) => setZoomUrl(e.target.value)}
            placeholder="https://zoom.us/..."
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="button" style={styles.btnPrimary} onClick={saveLinks}>
            保存する
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => {
    const totalSessions = data?.progress?.totalSessions || 6;
    const sessions = Array.from({ length: totalSessions }, (_, i) => i + 1);

    return (
      <div>
        <h2 style={styles.sectionTitle}>進捗管理</h2>
        {renderFeedback()}
        <div style={styles.card}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0F172A",
              marginBottom: 14,
            }}
          >
            完了セッション
          </div>
          {sessions.map((no) => {
            const currItem = data?.curriculum?.find(
              (c) => c.sessionNo === no
            );
            return (
              <div key={no} style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={completedIds.includes(no)}
                  onChange={() => toggleSession(no)}
                  id={`session-${no}`}
                />
                <label
                  htmlFor={`session-${no}`}
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Session {no}
                  {currItem?.title ? ` - ${currItem.title}` : ""}
                </label>
              </div>
            );
          })}
          <div style={{ marginTop: 16 }}>
            <button type="button" style={styles.btnPrimary} onClick={saveProgress}>
              保存する
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    users: renderUsers,
    announcements: renderAnnouncements,
    images: renderImages,
    archives: renderArchives,
    documents: renderDocuments,
    links: renderLinks,
    progress: renderProgress,
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>管理ダッシュボード</div>
        <div style={styles.headerRight}>
          <span style={styles.headerUser}>{initialUser.name}</span>
          <a href="/member" style={styles.headerLink}>
            会員サイトへ
          </a>
          <button type="button" style={styles.headerLogout} onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={styles.body}>
        {/* Sidebar */}
        <nav style={styles.sidebar}>
          <div style={styles.sidebarLabel}>メニュー</div>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              style={styles.tabButton(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#F8FAFC";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main style={styles.main}>{tabContent[activeTab]()}</main>
      </div>
    </div>
  );
}
