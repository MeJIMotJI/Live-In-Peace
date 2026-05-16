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
- รับ task จาก user (พี่แดง)
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
├── agents/
│   ├── researcher.md         ← Researcher system prompt + trusted sources
│   ├── builder.md            ← Builder design system + tech rules
│   └── checker.md            ← Thai language rules
├── orchestrator.py           ← Python CLI: รัน agent pipeline ผ่าน Anthropic API
├── index.html                ← Landing page
├── sleep.html
├── panic.html
├── mdd.html
├── mindfulness.html
├── relaxation.html
└── grounding.html
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
| sleep.html | ✅ Draft v1 | 5 accordion sections |
| panic.html | ✅ Draft v1 | 6 accordion sections |
| mdd.html | ✅ Draft v1 | 6 accordion sections, crisis line 1323 |

### Exercise Pages
| ไฟล์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| mindfulness.html | ✅ Draft v2 | timer + 5 bell sounds (Web Audio API) |
| relaxation.html | ✅ Draft v1 | 4 breathing patterns + animation |
| grounding.html | ✅ Draft v1 | 5-4-3-2-1 interactive steps |

### Open Items
- [ ] Design system redesign: เพิ่ม illustration/visual elements
- [ ] User customization: font size, dark mode
- [ ] Researcher review: ตรวจสอบความถูกต้องเนื้อหาทุกหน้า
- [ ] Checker review: ตรวจภาษาไทยทุกหน้า
- [ ] วางแผน disease pages เพิ่มเติม (GAD? OCD? PTSD?)
- [ ] วางแผน exercise เพิ่มเติม

---

## 🗂️ How to Use This Project (Session Start Checklist)

เมื่อเริ่ม session ใหม่ PM ควร:
1. อ่าน CLAUDE.md นี้ (auto-loaded)
2. ดู Current Status table ด้านบน
3. ถาม user ว่าต้องการทำอะไรวันนี้
4. ทำตาม workflow ที่กำหนด — ไม่ข้ามขั้นตอน
