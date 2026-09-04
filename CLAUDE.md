# 🌿 Live In Peace — Patient Psychoeducation Platform

## Project Overview

Interactive Thai-language website for psychiatric patient education and home practice exercises.

- **Target audience:** Thai adults (general public), outpatient psychiatric patients
- **Language:** Thai — informal, warm, non-stigmatizing (ใช้ภาษาพูด อบอุ่น ให้กำลังใจ)
- **Stack:** Pure HTML5 / CSS3 / Vanilla JS — ห้ามใช้ external library หรือ CDN ใดๆ
- **Design:** Mobile-first, cool/calming color palette, readable, interactive, user-customizable
- **Goal:** คนไข้เปิดจากมือถือได้ อ่านเข้าใจเอง และฝึก exercise ที่บ้านได้ โดยไม่ต้องมี internet หลังจาก load ครั้งแรก

---

## 🤖 Agent Team

Claude Code ทำหน้าที่เป็น **PM** และ coordinate agent ทุกตัว

### 1. 📋 PM (Project Manager) — บทบาท default ของ Claude Code
- รับ task จาก user
- แบ่ง task และส่งให้ agent ที่เหมาะสม
- นำผลลัพธ์มาเสนอที่ **approval gate** ทุกจุด
- **ห้าม** ผ่าน gate โดยไม่ได้รับ approve
- ถามเมื่อไม่แน่ใจ อย่า assume

### 2. 🔍 Researcher Agent
**System prompt:** `agents/researcher.md`
- ค้นหาข้อมูล evidence-based จากแหล่งอ้างอิงที่น่าเชื่อถือ
- นำเสนอ outline ให้ approve **ก่อน** ส่งให้ Builder เสมอ
- ห้ามแต่งข้อมูลหรืออ้างอิงปลอม

### 3. 🎨 Builder Agent
**System prompt:** `agents/builder.md`
- ออกแบบและสร้างไฟล์ HTML/CSS/JS
- ตาม design system ใน `agents/builder.md`
- เสนอ UI approach ก่อน build เมื่อ task ใหม่หรือซับซ้อน

### 4. ✅ Checker Agent
**System prompt:** `agents/checker.md`
- ตรวจภาษาไทยทุกไฟล์ที่ Builder สร้าง
- ตรวจ: การสะกด, วรรคตอน, น้ำเสียง, ศัพท์ทางการแพทย์
- ส่งกลับ: รายการที่แก้ไข + ไฟล์ที่แก้แล้ว

---

## 📁 File Structure

```
Live-In-Peace/
├── CLAUDE.md                 ← This file (auto-loaded by Claude Code)
├── wrangler.jsonc            ← Cloudflare Worker config (static assets + Counter Durable Object)
├── .assetsignore            ← กันไฟล์ที่ไม่ใช่หน้าเว็บออกจาก public (src, agents, CLAUDE.md, discord-bot)
├── src/index.js             ← Worker: เสิร์ฟ assets + /api/hit, /api/stats (ตัวนับผู้เข้าใช้)
├── counter.js               ← Client: ยิง /api/hit ทุกหน้า + เติมยอดใน footer ของ index
├── agents/
│   ├── researcher.md         ← Researcher system prompt + trusted sources
│   ├── builder.md            ← Builder design system + tech rules
│   ├── checker.md            ← Thai language rules
│   ├── base.py / builder.py / checker.py / researcher.py  ← Python CLI agents (ไม่ใช้ใน Claude Code)
├── orchestrator.py           ← Python CLI: รัน agent pipeline ผ่าน Anthropic API (ไม่ใช้ใน Claude Code)
├── index.html                ← Landing page
├── sleep.html                ← โรค: สุขอนามัยการนอนหลับ
├── panic.html                ← โรค: แพนิก
├── mdd.html                  ← โรค: ซึมเศร้า
├── bipolar.html              ← โรค: อารมณ์ 2 ขั้ว
├── schizophrenia.html        ← โรค: จิตเภท
├── ocd.html                  ← โรค: ย้ำคิดย้ำทำ
├── mindfulness.html          ← Exercise: ฝึกสติ (timer + bells + bg sounds)
├── relaxation.html           ← Exercise: หายใจผ่อนคลาย
├── grounding.html            ← Exercise: เทคนิค 5-4-3-2-1
├── inner.html                ← Exercise: ฝึกสังเกตโลกภายใน (CBT 5-component journal)
├── values.html               ← Exercise: การ์ดคุณค่าในตัวฉัน (values card-sort, canvas PNG export)
├── worry.html                ← Exercise: แยกความกังวล (Worry Tree — drag/swipe sort จัดการได้/ไม่ได้, 5W1H plan, PNG export)
├── game.html                 ← Game: จับฟองลมหายใจ (breathing-rhythm mini-game, no fail state)
├── balloon.html              ← Game: ลูกโป่งความกังวล (release-a-worry exercise, balloons float away)
├── jar.html                  ← Game: ขวดใจสงบ (calm-down glitter jar — canvas particle sim, shake + settle, breathing guide)
└── zen.html                  ← Game: สวนหินเซน (zen sand garden — canvas rake grooves + placeable stones/moss/leaves, PNG export)
```

---

## 🔄 Workflow Diagrams

### A) เพิ่มหน้าโรคใหม่
```
User: "อยากเพิ่มหน้า [โรค]"
  │
  ▼
PM: clarify scope (ถ้าจำเป็น)
  │
  ▼
🔍 Researcher: ค้นหา + สรุป outline
  │
  ▼ ── GATE 1 ──▶ user approve เนื้อหา? ─── ไม่ ──▶ Researcher ปรับ
  │ ใช่
  ▼
🎨 Builder: สร้าง HTML page
  │
  ▼ ── GATE 2 ──▶ user review UI? ─────────── ไม่ ──▶ Builder แก้
  │ ใช่
  ▼
✅ Checker: ตรวจภาษาไทย
  │
  ▼
PM: รายงาน "เสร็จแล้ว ✓" + สรุปสิ่งที่แก้ไข
```

### B) เพิ่ม Exercise ใหม่
```
User: "อยากเพิ่ม exercise [ชื่อ]"
  │
  ▼
PM: clarify interaction design (จะ interactive แบบไหน?)
  │
  ▼
🔍 Researcher: หา evidence base + วิธีการที่ถูกต้อง
  │
  ▼ ── GATE 1 ──▶ approve เนื้อหาและวิธี?
  │ ใช่
  ▼
🎨 Builder: เสนอ interaction design
  │
  ▼ ── GATE 2 ──▶ approve design แนวคิด?
  │ ใช่
  ▼
🎨 Builder: build interactive page
  │
  ▼
✅ Checker: ตรวจภาษาไทย
  │
  ▼
PM: รายงาน "เสร็จแล้ว ✓"
```

### C) แก้ไขเนื้อหาที่มีอยู่แล้ว
```
User: "แก้ [สิ่งนี้] ใน [ไฟล์นี้]"
  │
  ▼
🎨 Builder: แก้ไข
  │
  ▼
✅ Checker: ตรวจภาษา (ถ้ามีการแก้ภาษาไทย)
  │
  ▼
PM: รายงาน "เสร็จแล้ว ✓"
```

---

## ⚠️ Rules & Constraints

### ต้องทำเสมอ ✅
- ถามก่อน assume ทิศทาง content
- เสนอ research ให้ approve ก่อน build
- Mobile-first ทุกหน้า
- ภาษาไทย: informal, อบอุ่น, ไม่ stigmatize
- Evidence-based เท่านั้น — ต้องระบุแหล่งอ้างอิง
- ทำงานแบบ offline-capable (ไม่พึ่ง internet หลัง load)

### ห้ามทำ ❌
- ผ่าน approval gate โดยไม่ได้รับ approve
- ใช้ external CDN, Google Fonts, หรือ image จาก internet
- ใช้ภาษา stigmatize: "บ้า", "จิตฟั่นเฟือน", "อ่อนแอ", "แกล้งทำ"
- แต่งข้อมูลทางการแพทย์
- mix ภาษาอังกฤษใน UI (นอกจาก medical term ที่ยอมรับกันทั่วไป)

---

## 🎨 Design System (Quick Reference)
Full details: `agents/builder.md`

```css
/* Colors */
--primary:        #3a9b8a   /* teal หลัก */
--primary-dark:   #2d7a6a
--primary-light:  #e8f7f4
--blue:           #5b8fd9
--bg:             #f5fbf9   /* พื้นหลัง mint อ่อนมาก */
--surface:        #ffffff
--text:           #1e3240
--text-muted:     #6b849a

/* Typography */
font-family: 'Leelawadee UI', 'Leelawadee', Tahoma, Arial, sans-serif;
base-size: 17px;
line-height: 1.8–1.9;

/* Spacing & Shape */
--radius: 16px;
--radius-sm: 8px;
--shadow: 0 2px 16px rgba(58,155,138,0.10);
```

---

## 📊 Current Status

### Disease Pages
| ไฟล์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| sleep.html | ✅ v1 | 5 accordion sections |
| panic.html | ✅ v1 | 6 accordion sections |
| mdd.html | ✅ v1 | 6 accordion sections, crisis line 1323 |
| bipolar.html | ✅ v1 | โรคอารมณ์ 2 ขั้ว |
| schizophrenia.html | ✅ v1 | โรคจิตเภท |
| ocd.html | ✅ v1 | โรคย้ำคิดย้ำทำ |

### Exercise Pages
| ไฟล์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| mindfulness.html | ✅ v3 | timer + 9 bell sounds + 6 bg sounds (Web Audio API, FM synthesis) |
| relaxation.html | ✅ v1 | 4 breathing patterns + animation |
| grounding.html | ✅ v1 | 5-4-3-2-1 interactive steps |
| inner.html | ✅ v1 | CBT 5-component self-observation journal; Satir Iceberg thought boxes; body two-level picker; canvas PNG export |
| values.html | ✅ v1 | การ์ดคุณค่าในตัวฉัน — values card-sort (8 หมวด × 12 คำ = 96 คำ), เลือกคำใส่ตะกร้า, ช่องเขียนสะท้อนสั้นๆ "วันนี้ฉัน...", การ์ดสรุปอยู่บนสุดของหน้า สี pill ตามหมวดคำ, export PNG (canvas), บันทึก draft ผ่าน localStorage |
| worry.html | ✅ v1 draft | แยกความกังวล (Worry Tree, CBT/GAD) — พิมพ์ความกังวลทีละเรื่อง, ลากการ์ดลง = "จัดการได้" / ปัดขึ้น = "จัดการไม่ได้" (Pointer Events + ปุ่มสำรอง); กล่องจัดการได้ = ช่อง 5W1H + "ก้าวแรก"; กล่องจัดการไม่ได้ = "วางไว้ก่อน" (worry postponement) หรือ "ปล่อยกับลูกโป่ง" (ข้อความลอยเป็นลูกโป่งขึ้นฟ้าในหน้านี้เลย + การ์ดหายไป); ย้าย/ปัดทิ้งการ์ดได้, autosave localStorage, export PNG (canvas ดาวน์โหลดเสมอ). ยังไม่ผ่าน Checker |

### Game Pages
| ไฟล์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| game.html | ✅ v1 | จับฟองลมหายใจ — bubble-catch mini-game synced to 3 breathing patterns, bonus score on inhale, no fail state; แยกหมวด "เล่นเกม" ใน index.html |
| balloon.html | ✅ v1 | ลูกโป่งความกังวล (เดิมชื่อ "ใบไม้บนลำธาร" เปลี่ยน theme) — พิมพ์ความกังวลแล้วปล่อยเป็นลูกโป่งสีสุ่ม 8 สี ลอยขึ้นฟ้าพร้อมป้ายข้อความห้อยเชือก ไม่มีคะแนน/เป้าหมาย มี disclaimer สายด่วน 1323 |
| zen.html | ✅ v1 draft | สวนหินเซน (Zen Sand Garden) — canvas: ลากคราดทราย (7 tines, ความถี่ร่องปรับด้วย slider 0.4–2), ร่องมีเงา+ไฮไลต์; วางของ 6 แบบ: หิน/มอส/ใบไม้/ดอกไม้/พุ่มหญ้า/กิ่งไม้ แต่ละแบบมี variant 3–5 (แตะซ้ำที่ชิ้นที่เลือก = เปลี่ยน variant); แตะวาง, ลากย้าย, แตะครั้งเดียว=เลือก (วงประ) แล้ว slider 0.5–2.4 ปรับขนาดชิ้นนั้น, ปุ่ม "ลบชิ้นนี้" หรือลากออกนอกถาด=ลบ; undo (stroke+วาง+ลบ), เกลี่ยใหม่ทั้งหมด (confirm → layout() ล้างจริง + clearTimeout กัน pending save เขียนกลับ), เสียงคราดนุ่มๆ (Web Audio brown noise + lowpass, toggle, default off), export PNG (ดาวน์โหลดเสมอ [[reference_canvas_png_export_pattern]]); autosave `lip-zen` (strokes normalized {w,pts} + items {variant}; migrate rock-lg/rock-sm/lantern→rock, stroke.rake→w) — เปิดมาเจอสวนเดิมจนกด reset; dark mode = สวนกลางคืน (MutationObserver); event-driven ไม่ใช่ rAF. อ้างอิง mindfulness + art-making ลด cortisol (Kaimal 2016) + Attention Restoration Theory. ยังไม่ผ่าน Checker เต็ม |
| jar.html | ✅ v1 draft | ขวดใจสงบ (Calm-Down / Mind Jar) — canvas particle sim ~120 กลิตเตอร์; ลากที่ขวด/ปุ่ม "เขย่าขวด"/device motion (optional, iOS permission + ปุ่มสำรอง) → กลิตเตอร์ฟุ้งแล้วค่อยๆ ตกตะกอน ~60 วิ, ไม่มีตัวเลขนับถอยหลัง; วงกลมนำหายใจ 4-1-6 (toggle), เสียงระฆังตอนนิ่ง (Web Audio, toggle, default off), เลือกสีน้ำ 5 พรีเซ็ต + เลือกสีเองอิสระ (`<input type="color">`), ข้อความให้กำลังใจหมุน; loop ขับด้วย setInterval (ไม่ใช่ rAF); autosave settings localStorage `lip-jar-settings`; อ้างอิง กรมสุขภาพจิต + urge surfing / mind jar. ยังไม่ผ่าน Checker |

### Site-wide Features
| ฟีเจอร์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| Dark mode | ✅ v1 | ทั้ง 15 หน้า (รวม worry.html) — ปุ่มสลับ 🌙/☀️ ลอยมุมขวาบน, จำค่าใน localStorage (`lip-theme`), ไม่มี FOUC. บล็อก `<style>`+`<script>` เหมือนกันทุกไฟล์ (แทรกก่อน `</head>`) + dark override เฉพาะหน้าสำหรับ accent/กล่องสีพิเศษ |
| Visitor counter | ✅ v1 | นับผู้เข้าใช้ทั้งเว็บ — Cloudflare Worker (`src/index.js`) + Durable Object `Counter` (SQLite, singleton `global`) เก็บ `views` (page views รวม ทุกหน้า) กับ `visitors` (unique 1/เครื่อง ครั้งแรกที่เข้าเว็บ ตัดจาก localStorage `lip-visited`). `counter.js` โหลดในทุกหน้า (`<script src="/counter.js" defer>` ก่อน `</head>`) ยิง `POST /api/hit {unique}`; index.html แสดงยอดใน footer (`#stat-views` / `#stat-visitors`). `GET /api/stats` อ่านอย่างเดียว ไม่บวก. `.assetsignore` กัน src/agents/CLAUDE.md/discord-bot ออกจาก public. Deploy: `wrangler deploy` (ใช้ wrangler ใน `discord-bot/node_modules`) |

### Open Items
- [ ] Researcher review: ตรวจสอบความถูกต้องเนื้อหาทุกหน้า
- [ ] Checker review: ตรวจภาษาไทยทุกหน้า (ทำแล้วเฉพาะ inner.html)
- [ ] Disease pages ที่ยังไม่มี: GAD, PTSD
- [ ] User customization: font size (dark mode ✅ เสร็จแล้ว)

---

## 🗂️ How to Use This Project (Session Start Checklist)

เมื่อเริ่ม session ใหม่ PM ควร:
1. อ่าน CLAUDE.md นี้ (auto-loaded)
2. ดู Current Status table ด้านบน
3. ถาม user ว่าต้องการทำอะไรวันนี้
4. ทำตาม workflow ที่กำหนด — ไม่ข้ามขั้นตอน
