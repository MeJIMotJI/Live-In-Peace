# บอท Discord — ข้อพระคัมภีร์ + บทเฝ้าเดี่ยว

บอทสำหรับห้อง Discord มี 3 ฟีเจอร์:

1. **`/versetoday`** — ข้อพระคัมภีร์ประจำวัน (ข้อเดียวกันตลอดทั้งวัน) และตั้งให้บอทโพสต์เองอัตโนมัติทุกวันได้
2. **`/verse`** — สุ่มข้อพระคัมภีร์ สุ่มใหม่ทุกครั้งที่เรียก
3. **`/mana`** — บทเฝ้าเดี่ยววันนี้จาก[พันธกิจมานาประจำวัน](https://www.odbm.org/th/) (Our Daily Bread Ministries ไทย) โพสต์เป็นการ์ดรูปภาพ + ลิงก์ไปอ่านฉบับเต็ม (ไม่ได้ดึงเนื้อหาบทความมาโพสต์ซ้ำ เพราะเป็นงานเขียนมีลิขสิทธิ์ของ ODB ที่ต้องขออนุญาตก่อน — ดู [Rights and Permissions](https://ourdailybread.org/policy/rights-and-permissions)) และโพสต์อัตโนมัติทุกวันคู่กับข้อพระคัมภีร์ประจำวันได้เช่นกัน

## ข้อพระคัมภีร์มาจากไหน

bible.com (YouVersion) ไม่มี public API ให้ดึงตรงๆ และการ scrape เว็บจะผิดเงื่อนไขการใช้งานของเขา บอทนี้เลยใช้
[`wldeh/bible-api`](https://github.com/wldeh/bible-api) แทน — เป็นชุดข้อมูลพระคัมภีร์ **ฉบับ Thai KJV (th-kjv)**
ที่เปิดให้ใช้ฟรี ไม่ต้องมี API key โหลดผ่าน jsDelivr CDN

**ข้อควรรู้:** th-kjv แปลมาจากฉบับ KJV ภาษาอังกฤษ ไม่ใช่ฉบับมาตรฐาน (THSV11) ที่คนไทยส่วนใหญ่คุ้นเคย และข้อมูลต้นทาง
มีอักขระที่มองไม่เห็น (zero-width space) แทรกอยู่บ้าง — โค้ดล้างให้แล้วใน `src/lib/bible.js` แต่ถ้าเจอคำติดกันแปลกๆ
ให้รู้ว่ามาจากต้นทาง ไม่ใช่บั๊กจากบอท

**`/verse` สุ่มจากทั้งเล่ม 66 เล่ม** ไม่ได้จำกัดเฉพาะข้อให้กำลังใจ (เหมือนเปิดพระคัมภีร์มั่วๆ จริงๆ) จึงมีโอกาสเจอข้อ
ลำดับวงศ์ตระกูลหรือกฎเกณฑ์ในพันธสัญญาเดิมได้ ถ้าอยากให้สุ่มเฉพาะบางเล่ม (เช่น สดุดี, สุภาษิต, พันธสัญญาใหม่) บอกได้
แก้ที่ `getRandomVerse` ใน `src/lib/bible.js`

## ติดตั้งครั้งแรก

```bash
cd discord-bot
npm install
cp .env.example .env
```

จากนั้นสร้างแอปบอทที่ [Discord Developer Portal](https://discord.com/developers/applications):

1. **New Application** → ตั้งชื่อ
2. กด **Reset Token** (แท็บ Bot) คัดลอกมาใส่ `DISCORD_TOKEN` ใน `.env`
3. แท็บ **General Information** คัดลอก **Application ID** มาใส่ `CLIENT_ID`
4. เอา Server ID ของห้อง Discord คุณ (เปิด Developer Mode ใน User Settings ก่อน คลิกขวาไอคอนเซิร์ฟเวอร์ →
   Copy Server ID) มาใส่ `GUILD_ID` — ทำให้คำสั่งอัปเดตทันทีตอนพัฒนา (ไม่ใส่ก็ได้แต่จะรอนานถึง 1 ชม.)
5. แท็บ **OAuth2 → URL Generator** เลือก scope `bot` และ `applications.commands` แล้วติ๊ก permission:
   `Send Messages`, `Embed Links` — เปิดลิงก์ที่ได้เพื่อเชิญบอทเข้าเซิร์ฟเวอร์

ลงทะเบียน slash command (ทำใหม่ทุกครั้งที่เพิ่ม/แก้คำสั่ง):

```bash
npm run deploy-commands
```

รันบอท:

```bash
npm start
```

## ตั้งให้โพสต์ข้อพระคัมภีร์ประจำวันอัตโนมัติ

ใส่ `DAILY_VERSE_CHANNEL_ID` ใน `.env` (คลิกขวาที่ห้อง → Copy Channel ID) แล้วบอทจะโพสต์ให้เองตามเวลาใน
`DAILY_VERSE_CRON` (ค่าเริ่มต้น 07:00 น. เวลาไทยทุกวัน) ถ้าไม่ใส่ค่านี้บอทจะไม่โพสต์เอง แต่ยังกด `/versetoday`
เรียกเองได้ตลอด

## รันตลอด 24 ชม. (hosting)

บอทต้องมี process ที่รันค้างไว้ตลอดเวลา (ไม่เหมือนเว็บไซต์ static ของโปรเจกต์หลัก) — ตัวเลือกที่ใช้ได้กับ
Railway/Render:

- **Railway**: เชื่อม repo นี้ → New Project → Deploy from GitHub → ตั้ง Root Directory เป็น `discord-bot` →
  ใส่ environment variables จาก `.env` → Railway รัน `npm start` อัตโนมัติจาก `package.json` มี `Procfile`
  กำกับไว้เป็น worker แล้ว ไม่มีการ sleep เพราะไม่ใช่ web service
- **Render**: ต้องสร้างเป็น **Background Worker** ไม่ใช่ Web Service (Web Service ฟรีจะ sleep เมื่อไม่มีคน
  เข้าเว็บ ซึ่งจะทำให้บอทหลุดออกจาก Discord) Background Worker ไม่มีแผนฟรีที่ Render ณ ตอนที่เขียนนี้
  ต้องใช้แผนเสียเงินขั้นต่ำ ถ้าอยากได้ของฟรีจริงๆ ลองดู Railway (มีเครดิตทดลองฟรี) หรือเครื่องของคุณเอง/VPS
  ราคาถูกแทน

ทั้งสองเจ้าต้องตั้งค่า **Node version 22+** (ดู `engines` ใน `package.json`) และใส่ environment variables
จาก `.env.example` ในหน้า dashboard ของบริการ — **ห้าม commit ไฟล์ `.env` จริงขึ้น git**

## โครงสร้างไฟล์

```
discord-bot/
├── package.json
├── .env.example
├── Procfile
└── src/
    ├── index.js              ← จุดเริ่มบอท โหลดคำสั่ง + ตั้ง cron โพสต์ประจำวัน
    ├── deploy-commands.js    ← ลงทะเบียน slash command กับ Discord
    ├── commands/             ← 1 ไฟล์ = 1 slash command
    └── lib/
        ├── bible.js          ← ดึง/สุ่มข้อพระคัมภีร์จาก th-kjv
        ├── odb.js            ← ดึงการ์ด "เฝ้าเดี่ยววันนี้" จาก odbm.org (title + รูป + ลิงก์เท่านั้น)
        └── flavorText.js     ← ข้อความประกอบตอนสุ่มข้อ
```
