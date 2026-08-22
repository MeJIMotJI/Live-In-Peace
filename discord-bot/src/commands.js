// รายการ slash command — ใช้ทั้งตอนลงทะเบียนกับ Discord (deploy-commands.js)
// และตอน worker.js เช็คว่าคำสั่งที่เรียกเข้ามาคือชื่ออะไร
export const COMMANDS = [
  { name: "verse", description: "สุ่มข้อพระคัมภีร์หนึ่งข้อ" },
  { name: "versetoday", description: "ข้อพระคัมภีร์ประจำวันนี้ (ข้อเดียวกันทั้งวัน)" },
  { name: "mana", description: "บทเฝ้าเดี่ยววันนี้จากพันธกิจมานาประจำวัน (odbm.org)" },
];
