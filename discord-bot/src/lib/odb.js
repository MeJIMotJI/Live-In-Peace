// ดึงข้อมูล "บทเฝ้าเดี่ยววันนี้" จาก พันธกิจมานาประจำวัน (Our Daily Bread Ministries ไทย, odbm.org/th)
// ใช้ endpoint เดียวกับที่หน้าเว็บเขาเรียกเองตอนแสดงการ์ด "เฝ้าเดี่ยววันนี้" (title + รูปภาพสำหรับแชร์ + ลิงก์)
// ไม่ดึงเนื้อหาบทความเต็ม เพราะเป็นงานเขียนมีลิขสิทธิ์ของ ODB ต้องขออนุญาตก่อนถึงจะ reprint ได้
// อ้างอิงนโยบาย: https://ourdailybread.org/policy/rights-and-permissions
const ORIGIN = "https://www.odbm.org";

let cache = null; // { dateKey, data }

function parseSetCookies(setCookieArr) {
  return setCookieArr.map((c) => c.split(";")[0]).join("; ");
}

async function fetchAntiforgeryContext() {
  const res = await fetch(`${ORIGIN}/api/token`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LiveInPeaceBot/1.0)" },
  });
  if (!res.ok) throw new Error(`โหลด token ไม่สำเร็จ (${res.status})`);
  const token = (await res.text()).trim();
  const cookie = parseSetCookies(res.headers.getSetCookie?.() ?? []);
  return { token, cookie };
}

function bangkokDateKey() {
  const now = new Date();
  const bangkok = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  return bangkok.toISOString().slice(0, 10);
}

async function getTodayDevotional() {
  const dateKey = bangkokDateKey();
  if (cache && cache.dateKey === dateKey) return cache.data;

  const { token, cookie } = await fetchAntiforgeryContext();

  const res = await fetch(`${ORIGIN}/api/daily-devotional`, {
    headers: {
      "Content-Type": "application/json",
      RequestVerificationToken: token,
      "user-timezone": "Asia/Bangkok",
      "Accept-Language": "th",
      Referer: `${ORIGIN}/th/today`,
      Origin: ORIGIN,
      Cookie: cookie,
      "User-Agent": "Mozilla/5.0 (compatible; LiveInPeaceBot/1.0)",
    },
  });
  if (!res.ok) throw new Error(`โหลดบทเฝ้าเดี่ยวไม่สำเร็จ (${res.status})`);

  const json = await res.json();
  const data = {
    title: json.title,
    imageUrl: json.image?.url ? `${ORIGIN}${json.image.url}` : null,
    pageUrl: `${ORIGIN}${json.url}`,
  };

  cache = { dateKey, data };
  return data;
}

module.exports = { getTodayDevotional };
