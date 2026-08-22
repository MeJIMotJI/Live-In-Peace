# บอท Discord — ข้อพระคัมภีร์ + บทเฝ้าเดี่ยว (Cloudflare Workers)

บอทสำหรับห้อง Discord รันบน **Cloudflare Workers** (ใช้ account เดียวกับที่ deploy เว็บ Live In Peace) มี 4 ฟีเจอร์:

1. **`/versetoday`** — ข้อพระคัมภีร์ประจำวัน (ข้อเดียวกันตลอดทั้งวัน)
2. **`/verse`** — สุ่มข้อพระคัมภีร์ สุ่มใหม่ทุกครั้งที่เรียก
3. **`/mana`** — บทเฝ้าเดี่ยววันนี้จาก[พันธกิจมานาประจำวัน](https://www.odbm.org/th/) (Our Daily Bread Ministries ไทย) โพสต์เป็นการ์ดรูปภาพ + ลิงก์ไปอ่านฉบับเต็ม (ไม่ได้ดึงเนื้อหาบทความมาโพสต์ซ้ำ เพราะเป็นงานเขียนมีลิขสิทธิ์ของ ODB ที่ต้องขออนุญาตก่อน — ดู [Rights and Permissions](https://ourdailybread.org/policy/rights-and-permissions))
4. **`/pray <คำขอ>`** — ฝากคำขออธิษฐานเข้าห้อง ให้เพื่อนในเซิร์ฟช่วยอธิษฐานเผื่อ บอทจะแนบข้อพระคัมภีร์ให้กำลังใจ 1 ข้อ
   และกด 🙏 ใต้ข้อความให้เอง เพื่อชวนให้คนอื่นกดร่วมบอกว่า "อธิษฐานเผื่อด้วยนะ" (ไม่มีการเก็บลง database — ใช้ประวัติ
   ข้อความใน Discord เป็นที่เก็บ)

ทั้งข้อพระคัมภีร์และบทเฝ้าเดี่ยวโพสต์เข้าห้องที่ตั้งไว้ **อัตโนมัติทุกวัน 06:00 น. เวลาไทย** ผ่าน Cloudflare Cron Trigger — ไม่ต้องมีเครื่อง/เซิร์ฟเวอร์เปิดค้างไว้เลย

## สถาปัตยกรรม: ทำไมไม่เหมือนบอท Discord ทั่วไป

บอท Discord ส่วนใหญ่ (รวมถึงเวอร์ชันแรกของโปรเจกต์นี้) เป็นแบบ **"Gateway bot"** — โค้ดต้องรันค้างไว้ตลอด เชื่อมต่อ
WebSocket กับ Discord แล้วรอรับ event วิธีนี้ต้องมีเซิร์ฟเวอร์/เครื่องเปิดค้าง 24 ชม.

บอทนี้ใช้แบบ **"HTTP Interactions bot"** แทน — Discord จะยิง HTTP request มาหา Worker ของเราเองทุกครั้งที่มีคน
พิมพ์ slash command ไม่ต้องมี process ค้างเลย เหมาะกับ Cloudflare Workers (serverless) พอดี และใช้ **Cron Trigger**
ในตัวของ Workers สำหรับโพสต์ประจำวันแทน `node-cron`

ข้อแลกเปลี่ยน: ฟีเจอร์ที่ต้องมี state ค้างนานๆ หรือ subscribe event แบบต่อเนื่อง (เช่น เล่นเพลงในห้องเสียง) จะทำได้ยาก
กว่าบอทแบบ Gateway — แต่ 3 ฟีเจอร์ปัจจุบันเป็นแบบ "รับคำสั่ง → ตอบ" ล้วนๆ จึงเหมาะกับสถาปัตยกรรมนี้

## ติดตั้งครั้งแรก

```bash
cd discord-bot
npm install
cp .env.example .env
```

### 1. สร้าง/ตั้งค่าแอปบอทที่ Discord Developer Portal

ไปที่ [Discord Developer Portal](https://discord.com/developers/applications):

1. **New Application** (หรือใช้แอปเดิมที่สร้างไว้แล้ว)
2. แท็บ **Bot** → **Reset Token** → คัดลอกมาใส่ `DISCORD_TOKEN` ใน `.env`
3. แท็บ **General Information**:
   - คัดลอก **Application ID** → ใส่ทั้ง `CLIENT_ID` และ `DISCORD_APPLICATION_ID` ใน `.env` (ค่าเดียวกัน)
   - คัดลอก **Public Key** → ใส่ `DISCORD_PUBLIC_KEY` ใน `.env`
4. เอา Server ID ของห้อง Discord คุณ (เปิด Developer Mode ใน User Settings ก่อน คลิกขวาไอคอนเซิร์ฟเวอร์ →
   Copy Server ID) → ใส่ `GUILD_ID`
5. คลิกขวาที่ห้องที่จะให้โพสต์ประจำวัน → Copy Channel ID → ใส่ `DAILY_VERSE_CHANNEL_ID`
6. ถ้ายังไม่เคยเชิญบอทเข้าเซิร์ฟเวอร์: แท็บ **OAuth2 → URL Generator** เลือก scope `applications.commands`
   (ไม่ต้องติ๊ก `bot` scope ก็ได้ถ้าบอทไม่ต้องมี "ตัวตน" อยู่ในรายชื่อสมาชิก แต่แนะนำติ๊กทั้งคู่ไว้เผื่ออนาคต)
   → เปิดลิงก์ที่ได้เพื่อเชิญเข้าเซิร์ฟเวอร์

### 2. ลงทะเบียน slash command

```bash
npm run deploy-commands
```

### 3. ทดสอบในเครื่องก่อน deploy จริง (ไม่บังคับ)

```bash
npm run dev
```

จะรัน Worker จำลองในเครื่อง (`http://127.0.0.1:8787`) แต่ **Discord ยิง request มาที่นี่ไม่ได้เพราะเป็น localhost**
— ใช้ขั้นตอนนี้แค่เช็คว่าโค้ดรันไม่พังเฉยๆ การทดสอบจริงต้อง deploy ขึ้น Cloudflare ก่อน

### 4. Deploy ขึ้น Cloudflare Workers

ล็อกอิน Cloudflare (ครั้งแรกครั้งเดียว จะเปิดเบราว์เซอร์ให้กด authorize):

```bash
npx wrangler login
```

ตั้งค่า secret ทีละตัว (จะถามให้วางค่าเข้าไปในเทอร์มินัล ไม่ถูกบันทึกลงไฟล์ในเรพ ปลอดภัยกว่าใส่ใน `wrangler.jsonc`):

```bash
npx wrangler secret put DISCORD_TOKEN
npx wrangler secret put DISCORD_APPLICATION_ID
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DAILY_VERSE_CHANNEL_ID
```

(ค่าที่ใส่คือค่าเดียวกับใน `.env` ของคุณ) จากนั้น deploy:

```bash
npm run deploy
```

Wrangler จะพิมพ์ URL ของ Worker ออกมา หน้าตาประมาณ `https://live-in-peace-bot.<your-subdomain>.workers.dev`

### 5. บอก Discord ว่า Worker อยู่ที่ไหน

กลับไปที่ Developer Portal → แท็บ **General Information** → ช่อง **Interactions Endpoint URL** → วาง URL จากขั้นตอน
ที่แล้ว (เอา URL เปล่าๆ ไม่ต้องมี path ต่อท้าย) → กด **Save Changes**

Discord จะยิง PING มาเช็คทันทีตอนกด Save — ถ้า Worker deploy สำเร็จและ `DISCORD_PUBLIC_KEY` ถูกต้อง จะเซฟผ่าน
ถ้าเซฟไม่ผ่าน (ขึ้น error สีแดง) ให้เช็คว่า secret `DISCORD_PUBLIC_KEY` ตั้งถูกต้องหรือยัง (ขั้นตอนที่ 4)

เท่านี้บอทก็พร้อมใช้แล้ว ลองพิมพ์ `/verse`, `/versetoday`, `/mana` ใน Discord ได้เลย และจะโพสต์ประจำวันอัตโนมัติทุกเช้า
06:00 น. เวลาไทยด้วย

## แก้ไขโค้ดแล้วต้อง deploy ใหม่ทุกครั้ง

```bash
npm run deploy
```

(ไม่ต้อง `deploy-commands` ซ้ำ เว้นแต่เพิ่ม/แก้ slash command ใหม่)

## เปลี่ยนเวลาโพสต์ประจำวัน

แก้ค่า `triggers.crons` ใน `wrangler.jsonc` (เป็นเวลา UTC เสมอ — Cloudflare ไม่รองรับ timezone ในนี้ ต้องคำนวณเอง
เช่น อยาก 07:00 เวลาไทย = 00:00 UTC ก็ใส่ `"0 0 * * *"`) แล้ว `npm run deploy` ใหม่

## ข้อพระคัมภีร์มาจากไหน

bible.com (YouVersion) ไม่มี public API ให้ดึงตรงๆ และการ scrape เว็บจะผิดเงื่อนไขการใช้งานของเขา บอทนี้เลยใช้
[bible.helloao.org](https://bible.helloao.org) (Free Use Bible API โดย AO Lab) แทน — เป็นชุดข้อมูลพระคัมภีร์
**ฉบับ Thai KJV (tha_kjv)** ที่เปิดให้ใช้ฟรี ไม่ต้องมี API key ไม่จำกัดจำนวนครั้ง

**ข้อควรรู้:** tha_kjv แปลมาจากฉบับ KJV ภาษาอังกฤษ ไม่ใช่ฉบับมาตรฐาน (THSV11) ที่คนไทยส่วนใหญ่คุ้นเคย และข้อมูลต้นทาง
มีอักขระที่มองไม่เห็น (zero-width space) แทรกอยู่บ้าง — โค้ดล้างให้แล้วใน `src/lib/bible.js` แต่ถ้าเจอคำติดกันแปลกๆ
ให้รู้ว่ามาจากต้นทาง ไม่ใช่บั๊กจากบอท

**`/verse` และ `/versetoday` สุ่มจากทั้งเล่ม 66 เล่ม** ไม่ได้จำกัดเฉพาะข้อให้กำลังใจ (เหมือนเปิดพระคัมภีร์มั่วๆ จริงๆ)
จึงมีโอกาสเจอข้อลำดับวงศ์ตระกูลหรือกฎเกณฑ์ในพันธสัญญาเดิมได้ ถ้าอยากให้สุ่มเฉพาะบางเล่ม (เช่น สดุดี, สุภาษิต,
พันธสัญญาใหม่) บอกได้ แก้ที่ `getRandomVerse` ใน `src/lib/bible.js`

**`/pray` ไม่สุ่มแบบเดียวกัน** — คัดมาเฉพาะ 50 ข้อที่ให้กำลังใจ/ปลอบโยนได้กับแทบทุกสถานการณ์ (`COMFORT_REFS` ใน
`src/lib/bible.js`) ไม่จับคู่กับเนื้อหาคำขอ แค่การันตีว่าไม่มีทางได้ข้อที่ไม่เข้ากับบรรยากาศการอธิษฐาน อยากเพิ่ม/ตัด
ข้อไหนแก้ในลิสต์นั้นได้เลย

## โครงสร้างไฟล์

```
discord-bot/
├── package.json
├── wrangler.jsonc        ← ตั้งชื่อ Worker + เวลา Cron Trigger
├── .env.example          ← ใช้กับ deploy-commands.js และ wrangler dev เท่านั้น
└── src/
    ├── worker.js          ← จุดเริ่ม Worker: รับ interaction (fetch) + โพสต์ประจำวัน (scheduled)
    ├── commands.js        ← รายชื่อ/คำอธิบาย slash command
    ├── deploy-commands.js ← สคริปต์รันเองในเครื่อง เพื่อลงทะเบียน slash command กับ Discord
    └── lib/
        ├── bible.js       ← ดึง/สุ่มข้อพระคัมภีร์จาก th-kjv
        ├── odb.js         ← ดึงการ์ด "เฝ้าเดี่ยววันนี้" จาก odbm.org (title + รูป + ลิงก์เท่านั้น)
        └── flavorText.js  ← ข้อความประกอบตอนสุ่มข้อ
```
