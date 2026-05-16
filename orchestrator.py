#!/usr/bin/env python3
"""
🌿 Live In Peace — Orchestrator (PM Agent)
==========================================
ประสานงาน Researcher → Builder → Checker
มี approval gate ทุกจุดก่อนดำเนินการต่อ

ติดตั้ง:
    pip install anthropic

ตั้งค่า API key:
    Windows:  set ANTHROPIC_API_KEY=sk-ant-...
    Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-...

คำสั่ง:
    python orchestrator.py add-disease  <name_en> "<name_th>"
    python orchestrator.py add-exercise <name_en> "<name_th>"
    python orchestrator.py check        <file.html>
    python orchestrator.py research     <name_en> "<name_th>" [--type disease|exercise]
    python orchestrator.py status

ตัวอย่าง:
    python orchestrator.py add-disease  OCD "โรคย้ำคิดย้ำทำ"
    python orchestrator.py add-exercise "body scan" "การสแกนร่างกาย"
    python orchestrator.py check        panic.html
"""

import os
import sys
import argparse
from pathlib import Path

# ── ตรวจสอบ dependencies ───────────────────────────────────────────────────────

try:
    import anthropic
except ImportError:
    print("❌  ยังไม่ได้ติดตั้ง anthropic")
    print("    รัน: pip install anthropic")
    sys.exit(1)

# ── Import agent team ──────────────────────────────────────────────────────────

try:
    from agents import ResearcherAgent, BuilderAgent, CheckerAgent
except ImportError as e:
    print(f"❌  โหลด agent ไม่ได้: {e}")
    print("    ตรวจสอบว่าอยู่ใน folder Live-In-Peace และมีไฟล์ agents/*.py")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent


# ══════════════════════════════════════════════════════════════════════════════
# Orchestrator (PM)
# ══════════════════════════════════════════════════════════════════════════════

class Orchestrator:
    """
    PM Agent — ประสานงานทีม agent ทั้งหมด
    มี approval gate ทุกจุดสำคัญ
    """

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("❌  ไม่พบ ANTHROPIC_API_KEY")
            print("    ตั้งค่า: set ANTHROPIC_API_KEY=sk-ant-...")
            sys.exit(1)

        client = anthropic.Anthropic(api_key=api_key)

        # สร้าง agent แต่ละตัว — แต่ละตัวมี model และ system prompt ของตัวเอง
        self.researcher = ResearcherAgent(client)
        self.builder    = BuilderAgent(client)
        self.checker    = CheckerAgent(client)

        print("✅  ทีม agent พร้อมแล้ว")
        print(f"    🔍 Researcher : {self.researcher.model}")
        print(f"    🎨 Builder    : {self.builder.model}")
        print(f"    ✅ Checker    : {self.checker.model}")

    # ── Pipelines ─────────────────────────────────────────────────────────────

    def add_disease(self, name_en: str, name_th: str):
        """
        Pipeline สำหรับเพิ่มหน้าโรคใหม่
        Research → GATE → Build → GATE → Check → บันทึกไฟล์
        """
        self._banner(f"ADD DISEASE: {name_th} ({name_en})")

        # ── Step 1: Research ──────────────────────────────────────────────────
        self._step("1/3", "Researcher", "ค้นหาข้อมูล psychoeducation")
        research = self.researcher.research_disease(name_en, name_th)

        if not self._gate("GATE 1 — Approve เนื้อหา? (ถ้า approve จะส่งให้ Builder สร้าง HTML)"):
            print("⛔  หยุดที่ Gate 1 — แก้ไข research แล้วรันใหม่")
            return

        # ── Step 2: Build ─────────────────────────────────────────────────────
        self._step("2/3", "Builder", "สร้าง HTML page")
        build_result = self.builder.build_disease_page(name_en, name_th, research)

        # บันทึก draft ให้ดูก่อน approve
        html = BuilderAgent.extract_html(build_result)
        filename = f"{name_en.lower().replace(' ', '_')}.html"
        draft_path = None

        if html:
            draft_path = ROOT / filename
            draft_path.write_text(html, encoding="utf-8")
            print(f"\n📄  บันทึก draft: {draft_path}")
            print("    เปิดดูใน browser ก่อนกด approve")

        if not self._gate("GATE 2 — Approve HTML และ design? (ถ้า approve จะส่งให้ Checker ตรวจภาษา)"):
            print("⛔  หยุดที่ Gate 2 — แก้ไข build แล้วรันใหม่")
            return

        # ── Step 3: Check ─────────────────────────────────────────────────────
        self._step("3/3", "Checker", "ตรวจสอบภาษาไทย")

        if draft_path and draft_path.exists():
            check_result = self.checker.check_file(draft_path)
        else:
            check_result = self.checker.check_content(html or build_result, filename)

        # บันทึก final version
        final_html = BuilderAgent.extract_html(check_result)
        if final_html:
            final_path = ROOT / filename
            final_path.write_text(final_html, encoding="utf-8")
            print(f"\n✅  บันทึก final: {final_path}")

        self._done(f"หน้า {name_th} พร้อมใช้งาน → {filename}")

    def add_exercise(self, name_en: str, name_th: str):
        """
        Pipeline สำหรับเพิ่ม interactive exercise ใหม่
        Research → GATE → Build → GATE → Check → บันทึกไฟล์
        """
        self._banner(f"ADD EXERCISE: {name_th} ({name_en})")

        # ── Step 1: Research ──────────────────────────────────────────────────
        self._step("1/3", "Researcher", "ค้นหา evidence base และวิธีปฏิบัติ")
        research = self.researcher.research_exercise(name_en, name_th)

        if not self._gate("GATE 1 — Approve เนื้อหาและวิธีปฏิบัติ?"):
            print("⛔  หยุดที่ Gate 1")
            return

        # ── Step 2: Build ─────────────────────────────────────────────────────
        self._step("2/3", "Builder", "สร้าง interactive HTML page")
        build_result = self.builder.build_exercise_page(name_en, name_th, research)

        html = BuilderAgent.extract_html(build_result)
        filename = f"{name_en.lower().replace(' ', '_')}.html"
        draft_path = None

        if html:
            draft_path = ROOT / filename
            draft_path.write_text(html, encoding="utf-8")
            print(f"\n📄  บันทึก draft: {draft_path}")
            print("    เปิดดูใน browser ก่อนกด approve")

        if not self._gate("GATE 2 — Approve interactive design?"):
            print("⛔  หยุดที่ Gate 2")
            return

        # ── Step 3: Check ─────────────────────────────────────────────────────
        self._step("3/3", "Checker", "ตรวจสอบภาษาไทย")

        if draft_path and draft_path.exists():
            check_result = self.checker.check_file(draft_path)
        else:
            check_result = self.checker.check_content(html or build_result, filename)

        final_html = BuilderAgent.extract_html(check_result)
        if final_html:
            (ROOT / filename).write_text(final_html, encoding="utf-8")
            print(f"\n✅  บันทึก final: {ROOT / filename}")

        self._done(f"Exercise {name_th} พร้อมใช้งาน → {filename}")

    def check(self, filepath: str):
        """ตรวจภาษาไทยไฟล์เดียว ไม่ต้องผ่าน pipeline ทั้งหมด"""
        self._banner(f"CHECK: {filepath}")

        path = Path(filepath)
        if not path.exists():
            # ลอง relative จาก root
            path = ROOT / filepath
        if not path.exists():
            print(f"❌  ไม่พบไฟล์: {filepath}")
            return

        check_result = self.checker.check_file(path)

        final_html = BuilderAgent.extract_html(check_result)
        if final_html:
            out_path = path.parent / path.name.replace(".html", "_checked.html")
            out_path.write_text(final_html, encoding="utf-8")
            print(f"\n📄  บันทึกไฟล์ที่แก้แล้ว: {out_path}")
            print("    ตรวจสอบแล้ว rename ทับของเดิมถ้าพอใจ")

        self._done("ตรวจภาษาเสร็จแล้ว")

    def research(self, name_en: str, name_th: str, content_type: str = "disease"):
        """รัน Researcher เพียงตัวเดียว (สำหรับ explore ก่อนตัดสินใจ)"""
        self._banner(f"RESEARCH ONLY: {name_th} ({name_en})")

        if content_type == "exercise":
            self.researcher.research_exercise(name_en, name_th)
        else:
            self.researcher.research_disease(name_en, name_th)

        print("\n💡  นี่คือ research เท่านั้น ยังไม่ได้ build")
        print("    ถ้า approve รัน: python orchestrator.py add-disease ...")

    def status(self):
        """แสดงสถานะ project จาก CLAUDE.md"""
        import re
        claude_md = ROOT / "CLAUDE.md"
        if not claude_md.exists():
            print("❌  ไม่พบ CLAUDE.md")
            return

        content = claude_md.read_text(encoding="utf-8")
        match = re.search(r"(## 📊 Current Status[\s\S]*?)(?=\n## |\Z)", content)
        if match:
            print(match.group(0))
        else:
            print(content[:3000])

    # ── UI Helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _banner(title: str):
        bar = "═" * 60
        print(f"\n{bar}")
        print(f"  🌿  {title}")
        print(f"{bar}")

    @staticmethod
    def _step(step: str, agent: str, desc: str):
        print(f"\n{'─' * 60}")
        print(f"  STEP {step}  |  {agent}  |  {desc}")
        print(f"{'─' * 60}")

    @staticmethod
    def _done(message: str):
        print(f"\n{'═' * 60}")
        print(f"  🎉  เสร็จสิ้น — {message}")
        print(f"{'═' * 60}\n")

    @staticmethod
    def _gate(prompt: str) -> bool:
        """
        Approval gate — รอให้ user กด approve ก่อนดำเนินการต่อ
        คืน True ถ้า approve, False ถ้ายกเลิก
        """
        print(f"\n{'▸' * 3}  {prompt}")
        print("    พิมพ์  y / yes / ใช่  เพื่อ approve")
        print("    พิมพ์  n / no  / ไม่   เพื่อหยุด")
        print("    > ", end="", flush=True)
        answer = input().strip().lower()
        return answer in ("y", "yes", "ใช่", "ok", "1")


# ══════════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════════

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="orchestrator",
        description="🌿 Live In Peace — Multi-Agent Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
ตัวอย่าง:
  python orchestrator.py add-disease  OCD "โรคย้ำคิดย้ำทำ"
  python orchestrator.py add-disease  GAD "โรควิตกกังวลทั่วไป"
  python orchestrator.py add-exercise "body scan" "การสแกนร่างกาย"
  python orchestrator.py check        panic.html
  python orchestrator.py research     PTSD "โรคเครียดหลังเหตุสะเทือนขวัญ"
  python orchestrator.py status
        """
    )

    sub = parser.add_subparsers(dest="command", metavar="command")

    # add-disease
    p_disease = sub.add_parser("add-disease", help="เพิ่มหน้าโรคใหม่ (full pipeline)")
    p_disease.add_argument("name_en", help="ชื่อโรคภาษาอังกฤษ เช่น OCD")
    p_disease.add_argument("name_th", help="ชื่อโรคภาษาไทย เช่น 'โรคย้ำคิดย้ำทำ'")

    # add-exercise
    p_exercise = sub.add_parser("add-exercise", help="เพิ่ม exercise ใหม่ (full pipeline)")
    p_exercise.add_argument("name_en", help="ชื่อ exercise ภาษาอังกฤษ")
    p_exercise.add_argument("name_th", help="ชื่อ exercise ภาษาไทย")

    # check
    p_check = sub.add_parser("check", help="ตรวจภาษาไทยไฟล์เดียว")
    p_check.add_argument("filepath", help="path ของไฟล์ HTML เช่น panic.html")

    # research (explore ก่อนตัดสินใจ)
    p_research = sub.add_parser("research", help="รัน Researcher เพียงตัวเดียว (ไม่ build)")
    p_research.add_argument("name_en", help="ชื่อภาษาอังกฤษ")
    p_research.add_argument("name_th", help="ชื่อภาษาไทย")
    p_research.add_argument(
        "--type", choices=["disease", "exercise"],
        default="disease", help="ประเภท (default: disease)"
    )

    # status
    sub.add_parser("status", help="แสดงสถานะ project")

    return parser


def main():
    parser = build_parser()
    args   = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    try:
        pm = Orchestrator()

        if args.command == "add-disease":
            pm.add_disease(args.name_en, args.name_th)

        elif args.command == "add-exercise":
            pm.add_exercise(args.name_en, args.name_th)

        elif args.command == "check":
            pm.check(args.filepath)

        elif args.command == "research":
            pm.research(args.name_en, args.name_th, args.type)

        elif args.command == "status":
            pm.status()

    except KeyboardInterrupt:
        print("\n\n⚠️  ยกเลิกโดย user (Ctrl+C)")
    except anthropic.AuthenticationError:
        print("\n❌  API key ไม่ถูกต้อง — ตรวจสอบ ANTHROPIC_API_KEY")
    except anthropic.RateLimitError:
        print("\n❌  Rate limit — รอสักครู่แล้วลองใหม่")
    except FileNotFoundError as e:
        print(f"\n❌  {e}")
    except Exception as e:
        print(f"\n❌  Error: {e}")
        raise


if __name__ == "__main__":
    main()
