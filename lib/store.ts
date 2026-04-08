import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { hashPassword } from "./auth";

const DATA_DIR = path.join(process.cwd(), "data");
const SITE_DATA_FILE = path.join(DATA_DIR, "site-data.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// ─────────────────────────────────────────────────────
// Persistence strategy:
// - If UPSTASH_REDIS_REST_URL + TOKEN env vars are set → use Redis (Vercel prod)
// - Otherwise → use local JSON file (dev/fallback)
// ─────────────────────────────────────────────────────
const REDIS_KEY_SITE = "mana-lp:site-data:v1";
const REDIS_KEY_USERS = "mana-lp:users:v1";

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

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

export async function loadUsers(): Promise<UserRecord[]> {
  const redis = getRedis();

  // Redis path (production)
  if (redis) {
    try {
      const stored = await redis.get<UserRecord[]>(REDIS_KEY_USERS);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        cachedUsers = stored;
        return stored;
      }
      // Seed Redis from file/defaults on first run
      let seed = readJson<UserRecord[]>(USERS_FILE, []);
      if (!Array.isArray(seed) || seed.length === 0) {
        seed = createDefaultUsers();
      }
      await redis.set(REDIS_KEY_USERS, seed);
      cachedUsers = seed;
      return seed;
    } catch (e) {
      console.error("Redis load users failed, falling back to file:", e);
    }
  }

  // File path (dev/fallback)
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

export async function saveUsers(users: UserRecord[]): Promise<UserRecord[]> {
  cachedUsers = users;

  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(REDIS_KEY_USERS, users);
      return users;
    } catch (e) {
      console.error("Redis save users failed, falling back to file:", e);
    }
  }

  // File fallback
  try {
    writeJson(USERS_FILE, users);
  } catch {
    // read-only FS: cache-only
  }
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

function defaultDocuments(): Document[] {
  return [
    {
      id: "default-gdrive-materials",
      title: "教材・資料フォルダ（Google Drive）",
      description:
        "まな式AIマネタイズ完全攻略プログラムの教材・テンプレート・ワークシート一式。常に最新版にアップデートされます。",
      url: "https://drive.google.com/drive/folders/1Ar6qMZF3L97d5YTwLHegX4Kk8VwQ1TSZ",
      category: "template",
      createdAt: "2026-04-05T00:00:00.000Z",
    },
    {
      id: "default-gpts-notion",
      title: "特典GPTs集（Notion）",
      description:
        "受講生限定で使えるGPTsをNotionでまとめました。価値設計・商品設計・発信設計・販売設計をサポート。",
      url: "https://foam-violet-8b3.notion.site/GPTs-337eb03cfae180d5921cfb55b3f934b6?source=copy_link",
      category: "other",
      createdAt: "2026-04-05T00:00:00.000Z",
    },
  ];
}

function applyDefaults(raw: SiteData): SiteData {
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
  // Seed default documents (Google Drive + Notion GPTs)
  // only when the array is empty (first run or fresh Redis)
  if (raw.documents.length === 0) {
    raw.documents = defaultDocuments();
  }
  return raw;
}

export async function loadSiteData(): Promise<SiteData> {
  const redis = getRedis();

  // Redis path (production)
  if (redis) {
    try {
      const stored = await redis.get<SiteData>(REDIS_KEY_SITE);
      if (stored) {
        cachedSiteData = applyDefaults(stored);
        return cachedSiteData;
      }
      // Seed Redis from file on first run
      const seed = readJson<SiteData | null>(SITE_DATA_FILE, null);
      if (seed) {
        const withDefaults = applyDefaults(seed);
        await redis.set(REDIS_KEY_SITE, withDefaults);
        cachedSiteData = withDefaults;
        return withDefaults;
      }
    } catch (e) {
      console.error("Redis load failed, falling back to file:", e);
    }
  }

  // File path (dev/fallback)
  const raw = readJson<SiteData | null>(SITE_DATA_FILE, null);
  if (!raw) {
    throw new Error("site-data.json not found");
  }
  const withDefaults = applyDefaults(raw);
  cachedSiteData = withDefaults;
  return withDefaults;
}

export async function saveSiteData(data: SiteData): Promise<SiteData> {
  data.updatedAt = new Date().toISOString();
  cachedSiteData = data;

  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(REDIS_KEY_SITE, data);
      return data;
    } catch (e) {
      console.error("Redis save failed, falling back to file:", e);
    }
  }

  // File fallback (dev/local)
  try {
    writeJson(SITE_DATA_FILE, data);
  } catch {
    // read-only FS: cache-only
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
