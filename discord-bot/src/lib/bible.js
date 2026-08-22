// ดึงข้อพระคัมภีร์ภาษาไทย (ฉบับ th-kjv) จาก wldeh/bible-api
// - รายชื่อหนังสือ/บท: อ่านจาก GitHub Contents API (แคชไว้ในหน่วยความจำ กัน rate limit)
// - เนื้อข้อพระคัมภีร์: อ่านผ่าน jsDelivr CDN (เร็ว ไม่จำกัดจำนวนครั้ง)
const TRANSLATION = "th-kjv";
const GITHUB_API = "https://api.github.com/repos/wldeh/bible-api/contents";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/wldeh/bible-api@main";

// ข้อมูลต้นทางมีอักขระ zero-width แทรกอยู่ในข้อความ ต้องล้างออกก่อนแสดงผล
const ZERO_WIDTH_RE = new RegExp("[​-‍﻿]", "g");

let booksCache = null; // string[] ชื่อโฟลเดอร์หนังสือดิบ (ยังไม่ clean)
const chaptersCache = new Map(); // folder -> number[]

function cleanText(text) {
  return text.replace(ZERO_WIDTH_RE, "").trim();
}

async function ghFetch(path, githubToken) {
  const headers = { "User-Agent": "live-in-peace-discord-bot" };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }
  const res = await fetch(`${GITHUB_API}/${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} สำหรับ ${path}`);
  }
  return res.json();
}

async function loadBooks(githubToken) {
  if (booksCache) return booksCache;
  const entries = await ghFetch(`bibles/${TRANSLATION}/books`, githubToken);
  booksCache = entries
    .filter((e) => e.type === "dir")
    .map((e) => e.name);
  return booksCache;
}

async function getChaptersForBook(folder, githubToken) {
  if (chaptersCache.has(folder)) return chaptersCache.get(folder);
  const entries = await ghFetch(
    `bibles/${TRANSLATION}/books/${encodeURIComponent(folder)}/chapters`,
    githubToken,
  );
  const chapters = entries
    .filter((e) => e.type === "file" && e.name.endsWith(".json"))
    .map((e) => Number(e.name.replace(".json", "")))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  chaptersCache.set(folder, chapters);
  return chapters;
}

async function fetchChapter(folder, chapter) {
  const url = `${CDN_BASE}/bibles/${TRANSLATION}/books/${encodeURIComponent(folder)}/chapters/${chapter}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดบทไม่สำเร็จ (${res.status}) สำหรับ ${folder} บทที่ ${chapter}`);
  }
  const json = await res.json();
  return json.data;
}

// mulberry32: PRNG แบบ deterministic จาก seed ตัวเลข ใช้ให้ "ข้อพระคัมภีร์ประจำวัน" เหมือนกันทั้งวัน
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

/**
 * สุ่มข้อพระคัมภีร์หนึ่งข้อ
 * @param {string|null} dateSeed ถ้าใส่ (เช่น "2026-08-22") จะได้ผลลัพธ์เดิมซ้ำในวันเดียวกันเสมอ
 * @param {string|undefined} githubToken (ไม่บังคับ) เพิ่ม rate limit ตอนอ่าน GitHub API
 */
export async function getRandomVerse(dateSeed = null, githubToken = undefined) {
  const rand = dateSeed ? mulberry32(hashSeed(dateSeed)) : Math.random;

  const books = await loadBooks(githubToken);
  const book = pick(rand, books);

  const chapters = await getChaptersForBook(book, githubToken);
  const chapter = pick(rand, chapters);

  const verses = await fetchChapter(book, chapter);
  const verseObj = pick(rand, verses);

  return {
    book: cleanText(book),
    chapter,
    verse: verseObj.verse,
    text: cleanText(verseObj.text),
    translation: "ฉบับ KJV ไทย",
  };
}

export function todayDateSeed() {
  // ใช้เขตเวลาไทยเพื่อให้ "วันนี้" เปลี่ยนตอนเที่ยงคืนเมืองไทย ไม่ใช่ตาม server
  const now = new Date();
  const bangkok = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const y = bangkok.getFullYear();
  const m = String(bangkok.getMonth() + 1).padStart(2, "0");
  const d = String(bangkok.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
