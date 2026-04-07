import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashPassword } from "./auth";

const DATA_DIR = path.join(process.cwd(), "data");
const SITE_DATA_FILE_SRC = path.join(DATA_DIR, "site-data.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Vercel serverless: /tmp is writable, project dir is read-only.
// On first load, copy site-data.json to /tmp for read-write access.
const TMP_SITE_DATA = path.join("/tmp", "site-data.json");

function getSiteDataFile(): string {
  // If /tmp copy exists and is newer, use it
  try {
    fs.statSync(TMP_SITE_DATA);
    return TMP_SITE_DATA;
  } catch {
    // First run: copy source to /tmp
    try {
      const src = fs.readFileSync(SITE_DATA_FILE_SRC, "utf-8");
      fs.writeFileSync(TMP_SITE_DATA, src, "utf-8");
      return TMP_SITE_DATA;
    } catch {
      return SITE_DATA_FILE_SRC;
    }
  }
}

const SITE_DATA_FILE = getSiteDataFile();

export interface ImageSlot {
  id: string;
  label: string;
  note: string;
  url: string;
  filename: string;
  updatedAt: string | null;
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
  description: string;
  badge: "NEW" | "INFO";
}

export interface Archive {
  id: string;
  sessionNo: number;
  title: string;
  youtubeUrl: string;
  date: string;
  duration: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string; // "template" | "slide" | "worksheet" | "other"
  createdAt: string;
}

export interface SiteData {
  updatedAt: string;
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
  imageSlots: Record<string, ImageSlot>;
  progress: {
    completedSessionIds: number[];
    updatedAt: string | null;
  };
  announcements: Announcement[];
  archives: Archive[];
  documents: Document[];
}

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: "admin" | "member";
  salt: string;
  hash: string;
}

// In-memory cache for Vercel serverless (warm function reuse)
let cachedSiteData: SiteData | null = null;
let cachedUsers: UserRecord[] | null = null;

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

function toDisplayDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function createDefaultUsers(): UserRecord[] {
  const adminPw = hashPassword(process.env.ADMIN_PASS || "admin12345");
  const memberPw = hashPassword(process.env.MEMBER_PASS || "member12345");
  return [
    {
      id: crypto.randomUUID(),
      username: process.env.ADMIN_USER || "admin",
      name: "管理者",
      role: "admin",
      salt: adminPw.salt,
      hash: adminPw.hash,
    },
    {
      id: crypto.randomUUID(),
      username: process.env.MEMBER_USER || "member",
      name: "受講生",
      role: "member",
      salt: memberPw.salt,
      hash: memberPw.hash,
    },
  ];
}

export function loadUsers(): UserRecord[] {
  if (cachedUsers) return cachedUsers;
  let users = readJson<UserRecord[]>(USERS_FILE, []);
  if (!Array.isArray(users) || users.length === 0) {
    users = createDefaultUsers();
    try {
      writeJson(USERS_FILE, users);
    } catch {
      // Vercel read-only FS: keep in memory
    }
  }
  cachedUsers = users;
  return users;
}

function defaultAnnouncements(): Announcement[] {
  return [
    {
      id: crypto.randomUUID(),
      date: toDisplayDate(),
      title: "会員サイトへようこそ",
      description:
        "最初にDiscordへ参加し、進捗報告テンプレートを確認してください。",
      badge: "NEW",
    },
    {
      id: crypto.randomUUID(),
      date: toDisplayDate(),
      title: "セミナーとレビュー中心で進めます",
      description:
        "各Moduleの成果物提出とDiscordレビューを軸に進行してください。",
      badge: "INFO",
    },
  ];
}

export function loadSiteData(): SiteData {
  // Always re-read from disk to pick up cross-request writes in /tmp
  const raw = readJson<SiteData | null>(SITE_DATA_FILE, null);
  if (!raw) {
    throw new Error("site-data.json not found");
  }

  // Ensure defaults
  if (
    !raw.announcements ||
    !Array.isArray(raw.announcements) ||
    raw.announcements.length === 0
  ) {
    raw.announcements = defaultAnnouncements();
  }
  if (!raw.links) {
    raw.links = { discordUrl: "#", lineUrl: "#", zoomUrl: "" };
  }
  if (!raw.progress) {
    raw.progress = { completedSessionIds: [], updatedAt: null };
  }
  if (!Array.isArray(raw.archives)) {
    raw.archives = [];
  }
  if (!Array.isArray(raw.documents)) {
    raw.documents = [];
  }

  cachedSiteData = raw;
  return raw;
}

export function saveSiteData(data: SiteData): SiteData {
  data.updatedAt = new Date().toISOString();
  cachedSiteData = data;
  // Always write to /tmp first (writable on Vercel), then try source
  try {
    writeJson(TMP_SITE_DATA, data);
  } catch {
    // ignore
  }
  try {
    writeJson(SITE_DATA_FILE, data);
  } catch {
    // Vercel read-only FS: /tmp write above handles persistence
  }
  return data;
}

export function buildSiteResponse(siteData: SiteData) {
  const imageSlots = Object.values(siteData.imageSlots || {});
  const totalSessions = siteData.curriculum.length || 6;
  const completedCount = siteData.progress.completedSessionIds.length;

  return {
    program: siteData.program,
    methods: siteData.methods,
    sessionTypes: siteData.sessionTypes,
    modules: siteData.modules,
    curriculum: siteData.curriculum,
    resources: siteData.resources,
    bonuses: siteData.bonuses,
    links: siteData.links,
    imageSlots,
    progress: {
      ...siteData.progress,
      totalSessions,
      ratio:
        totalSessions > 0
          ? Math.round((completedCount / totalSessions) * 100)
          : 0,
    },
    announcements: siteData.announcements,
    archives: siteData.archives,
    documents: siteData.documents,
    updatedAt: siteData.updatedAt,
  };
}

export function normalizeUrl(url: unknown): string {
  if (typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "#";
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  return "#";
}
