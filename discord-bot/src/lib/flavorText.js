const FORTUNE_INTROS = [
  "🎋 สุ่มข้อพระคัมภีร์ให้แล้ว ลองอ่านดูนะ",
  "📜 ข้อนี้แหละที่มาเจอคุณวันนี้",
  "🕊️ ลองรับข้อนี้ไปอ่านดูสิ",
  "✨ สุ่มมาให้หนึ่งข้อ",
  "🎲 เปิดเจอข้อนี้พอดี",
];

const DAILY_INTROS = ["🌅 ข้อพระคัมภีร์ประจำวันนี้"];

export function randomFortuneIntro() {
  return FORTUNE_INTROS[Math.floor(Math.random() * FORTUNE_INTROS.length)];
}

export function dailyIntro() {
  return DAILY_INTROS[0];
}
