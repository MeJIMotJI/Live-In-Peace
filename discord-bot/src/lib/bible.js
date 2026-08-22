// ดึงข้อพระคัมภีร์ภาษาไทย (ฉบับ th-kjv / tha_kjv) จาก bible.helloao.org — "Free Use Bible API"
// ฟรี ไม่ต้องมี API key ไม่จำกัดจำนวนครั้ง ใช้รหัสหนังสือมาตรฐาน USFM (เช่น GEN, PSA, JHN)
const TRANSLATION = "tha_kjv";
const API_BASE = "https://bible.helloao.org/api";

// ข้อมูลต้นทางมีอักขระ zero-width แทรกอยู่ในข้อความ ต้องล้างออกก่อนแสดงผล
const ZERO_WIDTH_RE = new RegExp("[​-‍﻿]", "g");

let booksCache = null; // [{id, name, numberOfChapters, ...}]
const chapterCache = new Map(); // "BOOKID:chapter" -> { bookName, verses: [{number, text}] }

function cleanText(text) {
  return text.replace(ZERO_WIDTH_RE, "").trim();
}

async function loadBooks() {
  if (booksCache) return booksCache;
  const res = await fetch(`${API_BASE}/${TRANSLATION}/books.json`);
  if (!res.ok) throw new Error(`โหลดรายชื่อหนังสือไม่สำเร็จ (${res.status})`);
  const json = await res.json();
  booksCache = json.books;
  return booksCache;
}

async function fetchChapter(bookId, chapter) {
  const key = `${bookId}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);

  const res = await fetch(`${API_BASE}/${TRANSLATION}/${bookId}/${chapter}.json`);
  if (!res.ok) {
    throw new Error(`โหลดบทไม่สำเร็จ (${res.status}) สำหรับ ${bookId} บทที่ ${chapter}`);
  }
  const json = await res.json();
  const verses = json.chapter.content
    .filter((item) => item.type === "verse")
    .map((item) => ({ number: item.number, text: item.content.join(" ") }));

  const result = { bookName: json.book.name, verses };
  chapterCache.set(key, result);
  return result;
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
 * สุ่มข้อพระคัมภีร์หนึ่งข้อจากทั้ง 66 เล่ม
 * @param {string|null} dateSeed ถ้าใส่ (เช่น "2026-08-22") จะได้ผลลัพธ์เดิมซ้ำในวันเดียวกันเสมอ
 */
export async function getRandomVerse(dateSeed = null) {
  const rand = dateSeed ? mulberry32(hashSeed(dateSeed)) : Math.random;

  const books = await loadBooks();
  const book = pick(rand, books);
  const chapterNum = 1 + Math.floor(rand() * book.numberOfChapters);

  const { bookName, verses } = await fetchChapter(book.id, chapterNum);
  const v = pick(rand, verses);

  return {
    book: cleanText(bookName),
    chapter: chapterNum,
    verse: v.number,
    text: cleanText(v.text),
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

// คัดมาเฉพาะข้อที่ให้กำลังใจ/ปลอบโยนได้กับแทบทุกสถานการณ์ (ไม่จับคู่กับเนื้อหาคำขอ แค่การันตีว่า
// ไม่มีทางได้ข้อที่ไม่เข้ากับบรรยากาศการอธิษฐาน เช่น ข้อลำดับวงศ์ตระกูล) ใช้กับคำสั่ง /pray เท่านั้น
const COMFORT_REFS = [
  { book: "PSA", chapter: 23, verse: 1 },
  { book: "PSA", chapter: 46, verse: 1 },
  { book: "PSA", chapter: 34, verse: 18 },
  { book: "PSA", chapter: 27, verse: 1 },
  { book: "PSA", chapter: 121, verse: 2 },
  { book: "PSA", chapter: 55, verse: 22 },
  { book: "PSA", chapter: 91, verse: 1 },
  { book: "PSA", chapter: 37, verse: 4 },
  { book: "PSA", chapter: 30, verse: 5 },
  { book: "PSA", chapter: 147, verse: 3 },
  { book: "PSA", chapter: 62, verse: 1 },
  { book: "PSA", chapter: 46, verse: 10 },
  { book: "PSA", chapter: 73, verse: 26 },
  { book: "ISA", chapter: 41, verse: 10 },
  { book: "ISA", chapter: 40, verse: 31 },
  { book: "ISA", chapter: 26, verse: 3 },
  { book: "ISA", chapter: 43, verse: 2 },
  { book: "ISA", chapter: 53, verse: 5 },
  { book: "JER", chapter: 29, verse: 11 },
  { book: "LAM", chapter: 3, verse: 22 },
  { book: "LAM", chapter: 3, verse: 23 },
  { book: "MAT", chapter: 11, verse: 28 },
  { book: "MAT", chapter: 6, verse: 34 },
  { book: "MAT", chapter: 6, verse: 26 },
  { book: "MRK", chapter: 11, verse: 24 },
  { book: "JHN", chapter: 14, verse: 27 },
  { book: "JHN", chapter: 16, verse: 33 },
  { book: "JHN", chapter: 3, verse: 16 },
  { book: "ROM", chapter: 8, verse: 28 },
  { book: "ROM", chapter: 15, verse: 13 },
  { book: "1CO", chapter: 10, verse: 13 },
  { book: "2CO", chapter: 1, verse: 4 },
  { book: "2CO", chapter: 12, verse: 9 },
  { book: "GAL", chapter: 6, verse: 9 },
  { book: "EPH", chapter: 3, verse: 20 },
  { book: "PHP", chapter: 4, verse: 6 },
  { book: "PHP", chapter: 4, verse: 7 },
  { book: "PHP", chapter: 4, verse: 13 },
  { book: "PHP", chapter: 4, verse: 19 },
  { book: "COL", chapter: 3, verse: 15 },
  { book: "1TH", chapter: 5, verse: 18 },
  { book: "HEB", chapter: 4, verse: 16 },
  { book: "HEB", chapter: 13, verse: 5 },
  { book: "JAS", chapter: 1, verse: 5 },
  { book: "JAS", chapter: 5, verse: 16 },
  { book: "1PE", chapter: 5, verse: 7 },
  { book: "1JN", chapter: 5, verse: 14 },
  { book: "DEU", chapter: 31, verse: 6 },
  { book: "JOS", chapter: 1, verse: 9 },
  { book: "PRO", chapter: 3, verse: 5 },
];

export async function getComfortVerse() {
  const ref = COMFORT_REFS[Math.floor(Math.random() * COMFORT_REFS.length)];
  const { bookName, verses } = await fetchChapter(ref.book, ref.chapter);
  const v = verses.find((x) => x.number === ref.verse);
  if (!v) throw new Error(`ไม่พบข้อ ${ref.book} ${ref.chapter}:${ref.verse}`);

  return {
    book: cleanText(bookName),
    chapter: ref.chapter,
    verse: v.number,
    text: cleanText(v.text),
    translation: "ฉบับ KJV ไทย",
  };
}
