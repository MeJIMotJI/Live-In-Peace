// ดึงบทความจาก Mustard Seed Community (mustardseed.community, ในเครือ Our Daily Bread Ministries)
// ผ่าน RSS feed สาธารณะ — แชร์แค่ title + link + summary สั้นๆ ไม่ copy เนื้อหาบทความเต็ม
// (RSS ทำมาเพื่อ syndication อยู่แล้ว ต่างจากการ scrape/reprint เนื้อหาเต็มที่ต้องขออนุญาตแบบ odb.js)
const FEED_URL = "https://mustardseed.community/feed/";
const SUMMARY_MAX_LENGTH = 220;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// U+200B..U+200D (zero-width space/ZWNJ/ZWJ), U+FEFF (BOM), U+FFFC (object replacement) —
// อักขระที่มองไม่เห็นซึ่งหลุดมากับไอคอนในหัวข้อของ WordPress feed
const INVISIBLE_CHARS = new RegExp("[\\u200B-\\u200D\\uFEFF\\uFFFC]", "g");

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(INVISIBLE_CHARS, "");
}

function extractRawTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  const value = match[1].trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : value;
}

function extractTag(block, tag) {
  const raw = extractRawTag(block, tag);
  if (!raw) return "";
  return decodeEntities(raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

// เนื้อหาจริงเป็น HTML ของ Divi page builder ซ้อน <div>/<span> เยอะมาก — ถ้าแทนแท็กด้วยช่องว่างตรงๆ
// (แบบ extractTag) จะได้ช่องว่างแทรกกลางคำภาษาไทยผิดที่ ต้องลบแท็ก inline (span/b/img ฯลฯ) แบบไม่เว้นวรรค
// แล้วค่อยแทรกขึ้นบรรทัดใหม่เฉพาะจุดที่เป็นขอบเขต block (</p>, <br>, </div> ฯลฯ) แทน
function stripBlockHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(br\s*\/?|\/p|\/div|\/h[1-6]|\/li|\/blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

// <description> ของ WordPress เป็นแค่ boilerplate "The post ... appeared first on ..." เวลาไม่ได้ตั้ง excerpt เอง
// ใช้ <content:encoded> (เนื้อหาเต็มของโพสต์) มาตัดเป็น summary สั้นๆ แทน จะได้ใจความจริงของบทความ
function extractSummary(block) {
  const raw = extractRawTag(block, "content:encoded");
  if (raw) {
    const text = decodeEntities(stripBlockHtml(raw))
      .replace(/^\s*WRITER:[\s\S]*?EDITOR:[^\n]*\n?/i, "") // ตัดบรรทัดเครดิตผู้เขียนหัวบทความออก
      .replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }
  return extractTag(block, "description").replace(/^The post .* appeared first on .*\.$/i, "").trim();
}

function truncate(text) {
  if (text.length <= SUMMARY_MAX_LENGTH) return text;
  return `${text.slice(0, SUMMARY_MAX_LENGTH).trim()}…`;
}

async function fetchFeedItems() {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LiveInPeaceBot/1.0)" },
  });
  if (!res.ok) throw new Error(`โหลดบทความ Mustard Seed ไม่สำเร็จ (${res.status})`);

  const xml = await res.text();
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  return blocks.map((block) => ({
    title: extractTag(block, "title"),
    link: extractTag(block, "link"),
    pubDate: extractTag(block, "pubDate"),
    summary: truncate(extractSummary(block)),
  }));
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/** เช็คว่าโพสต์ล่าสุดออกมาภายใน 7 วันที่ผ่านมามั้ย — ถ้าใช่ถือว่า "ใหม่ของสัปดาห์นี้" ถ้าไม่ สุ่มบทความเก่ามาแทน */
async function getWeeklyMustardSeedPost() {
  const items = await fetchFeedItems();
  if (items.length === 0) return null;

  const [latest] = items;
  const pubTime = new Date(latest.pubDate).getTime();
  const isNew = !Number.isNaN(pubTime) && Date.now() - pubTime <= WEEK_MS;

  return { article: isNew ? latest : pickRandom(items), isNew };
}

async function getRandomMustardSeedPost() {
  const items = await fetchFeedItems();
  if (items.length === 0) throw new Error("ไม่พบบทความจาก Mustard Seed");
  return pickRandom(items);
}

export { getWeeklyMustardSeedPost, getRandomMustardSeedPost };
