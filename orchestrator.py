#!/usr/bin/env python3
"""
🌿 Live In Peace — Multi-Agent Orchestrator
============================================
รัน Research → Build → Check pipeline ผ่าน Anthropic API

ติดตั้ง:
    pip install anthropic

ตั้งค่า:
    set ANTHROPIC_API_KEY=sk-ant-...   (Windows)
    export ANTHROPIC_API_KEY=sk-ant-... (Mac/Linux)

คำสั่ง:
    python orchestrator.py research  <topic_en> "<topic_th>"
    python orchestrator.py build     <topic_en> "<topic_th>"
    python orchestrator.py check     <path/to/file.html>
    python orchestrator.py pipeline  <topic_en> "<topic_th>" [--type disease|exercise]
    python orchestrator.py status
"""

import os
import sys
import re
import json
import textwrap
from pathlib import Path
from datetime import datetime

try:
    import anthropic
except ImportError:
    print("❌ ไม่พบ anthropic package — รัน: pip install anthropic")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

ROOT        = Path(__file__).parent
AGENTS_DIR  = ROOT / "agents"
OUTPUT_DIR  = ROOT  # HTML files อยู่ที่ root ตอนนี้

MODEL_RESEARCH  = "claude-opus-4-5"   # ต้องการ knowledge depth
MODEL_BUILD     = "claude-sonnet-4-5" # coding + design
MODEL_CHECK     = "claude-sonnet-4-5" # language review

MAX_TOKENS = 8192

# ─── Helpers ──────────────────────────────────────────────────────────────────

def load_agent_prompt(name: str) -> str:
    """โหลด system prompt จาก agents/<name>.md"""
    path = AGENTS_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"ไม่พบ {path}")
    return path.read_text(encoding="utf-8")


def load_claude_md() -> str:
    """โหลด CLAUDE.md เพื่อให้ agent เข้าใจ project context"""
    path = ROOT / "CLAUDE.md"
    return path.read_text(encoding="utf-8") if path.exists() else ""


def divider(title: str, char: str = "─", width: int = 60):
    print(f"\n{char * width}")
    print(f"  {title}")
    print(f"{char * width}")


def ask_approval(prompt: str) -> bool:
    """ถาม user ให้ approve — คืน True ถ้า approve"""
    print(f"\n{'▸' * 3}  {prompt}")
    print("    พิมพ์ y / yes / ใช่ เพื่อ approve  |  อื่นๆ เพื่อยกเลิก: ", end="", flush=True)
    answer = input().strip().lower()
    return answer in ("y", "yes", "ใช่", "ok", "okay", "1")


def stream_agent(client: anthropic.Anthropic, agent_name: str,
                 user_message: str, model: str) -> str:
    """
    เรียก agent พร้อม streaming output
    คืนค่า response text ทั้งหมด
    """
    divider(f"🤖 Agent: {agent_name.upper()}  [{model}]", "═")

    system_prompt = load_agent_prompt(agent_name)

    # เพิ่ม project context เข้าไปใน system prompt
    claude_md = load_claude_md()
    if claude_md:
        system_with_context = (
            f"## Project Context (CLAUDE.md)\n\n{claude_md}\n\n"
            f"---\n\n"
            f"## Your Role\n\n{system_prompt}"
        )
    else:
        system_with_context = system_prompt

    full_response = []

    with client.messages.stream(
        model=model,
        max_tokens=MAX_TOKENS,
        system=system_with_context,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response.append(text)

    print()  # newline after stream ends
    return "".join(full_response)


def extract_html(text: str) -> str | None:
    """แยก HTML content จาก response text"""
    # ลอง ```html ... ``` ก่อน
    match = re.search(r"```html\s*(<!DOCTYPE[\s\S]*?)```", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    # ลอง <!DOCTYPE ... > โดยตรง
    match = re.search(r"(<!DOCTYPE html>[\s\S]*)", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None


def save_html(content: str, filename: str) -> Path:
    """บันทึก HTML ไฟล์"""
    path = OUTPUT_DIR / filename
    path.write_text(content, encoding="utf-8")
    print(f"\n✅ บันทึกไฟล์: {path}")
    return path


def log_run(action: str, topic: str, result: str):
    """บันทึก log ไปยัง runs.jsonl"""
    log_path = ROOT / "runs.jsonl"
    entry = {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "topic": topic,
        "result_length": len(result),
    }
    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# ─── Commands ─────────────────────────────────────────────────────────────────

def cmd_research(client: anthropic.Anthropic, topic_en: str, topic_th: str,
                 content_type: str = "disease") -> str:
    """รัน Researcher agent สำหรับหัวข้อที่กำหนด"""

    if content_type == "disease":
        prompt = textwrap.dedent(f"""
            ค้นหาและสรุปข้อมูล psychoeducation สำหรับ:
            ภาษาอังกฤษ: {topic_en}
            ภาษาไทย: {topic_th}

            กลุ่มเป้าหมาย: ผู้ใหญ่ไทยทั่วไป อายุ 20 ปีขึ้นไป
            ใช้ format ที่กำหนดใน system prompt ของคุณ (Output Format section)
            ระบุแหล่งอ้างอิงทุกข้อมูลสำคัญ
        """).strip()
    else:
        prompt = textwrap.dedent(f"""
            ค้นหา evidence base และวิธีปฏิบัติที่ถูกต้องสำหรับ exercise:
            ภาษาอังกฤษ: {topic_en}
            ภาษาไทย: {topic_th}

            ต้องการ:
            1. หลักฐานทางวิทยาศาสตร์ที่รองรับ (งานวิจัย / meta-analysis)
            2. วิธีปฏิบัติที่ถูกต้อง step-by-step
            3. ข้อควรระวังและข้อห้าม
            4. ความถี่/ระยะเวลาที่แนะนำ
            5. แหล่งอ้างอิง

            ใช้ format ที่กำหนดใน system prompt ของคุณ
        """).strip()

    result = stream_agent(client, "researcher", prompt, MODEL_RESEARCH)
    log_run("research", f"{topic_en}/{topic_th}", result)
    return result


def cmd_build(client: anthropic.Anthropic, topic_en: str, topic_th: str,
              research_content: str, content_type: str = "disease") -> str:
    """รัน Builder agent สร้าง HTML จาก research content ที่ approve แล้ว"""

    filename = f"{topic_en.lower().replace(' ', '_')}.html"

    if content_type == "disease":
        prompt = textwrap.dedent(f"""
            สร้างไฟล์ HTML สำหรับหน้า psychoeducation:
            ชื่อโรค (EN): {topic_en}
            ชื่อโรค (TH): {topic_th}
            ชื่อไฟล์: {filename}

            เนื้อหาที่ได้รับการ approve แล้ว:
            {research_content}

            ใช้ design system และ patterns จาก system prompt ของคุณ (builder.md)
            ส่งออกเป็น complete HTML file พร้อมใช้งานทันที
            ใช้ accordion pattern สำหรับ sections ต่างๆ
        """).strip()
    else:
        prompt = textwrap.dedent(f"""
            สร้างไฟล์ HTML สำหรับหน้า interactive exercise:
            ชื่อ (EN): {topic_en}
            ชื่อ (TH): {topic_th}
            ชื่อไฟล์: {filename}

            เนื้อหาและข้อมูลที่ได้รับการ approve แล้ว:
            {research_content}

            ใช้ design system และ patterns จาก system prompt ของคุณ (builder.md)
            ต้องการ interactive elements ที่ทำงานได้ offline
            ส่งออกเป็น complete HTML file พร้อมใช้งานทันที
        """).strip()

    result = stream_agent(client, "builder", prompt, MODEL_BUILD)
    log_run("build", f"{topic_en}/{topic_th}", result)
    return result


def cmd_check(client: anthropic.Anthropic, filepath: str) -> str:
    """รัน Checker agent ตรวจภาษาไทยในไฟล์ที่กำหนด"""

    path = Path(filepath)
    if not path.exists():
        print(f"❌ ไม่พบไฟล์: {filepath}")
        sys.exit(1)

    content = path.read_text(encoding="utf-8")
    filename = path.name

    prompt = textwrap.dedent(f"""
        ตรวจสอบภาษาไทยในไฟล์ HTML นี้:
        ชื่อไฟล์: {filename}

        ตรวจ: การสะกด, วรรคตอน, น้ำเสียง, ศัพท์ทางการแพทย์, ภาษา stigmatize
        ส่งกลับ: รายการที่แก้ไข + complete HTML file ที่แก้แล้ว (ใช้ format จาก system prompt)

        ─── เนื้อหาไฟล์ ───
        {content}
    """).strip()

    result = stream_agent(client, "checker", prompt, MODEL_CHECK)
    log_run("check", filename, result)

    # บันทึก corrected file ถ้ามี HTML ใน response
    corrected_html = extract_html(result)
    if corrected_html:
        checked_filename = filename.replace(".html", "_checked.html")
        save_html(corrected_html, checked_filename)
        print(f"💡 ไฟล์ที่แก้แล้ว: {checked_filename}")
        print("   ตรวจสอบแล้ว rename ทับของเดิมถ้าพอใจ")

    return result


def cmd_pipeline(client: anthropic.Anthropic, topic_en: str, topic_th: str,
                 content_type: str = "disease"):
    """
    รัน full pipeline: Research → (approve) → Build → (approve) → Check
    """

    divider(f"🚀 PIPELINE START: {topic_th} ({topic_en})", "═", 60)
    print(f"   Type: {content_type}")
    print(f"   Model (Research): {MODEL_RESEARCH}")
    print(f"   Model (Build):    {MODEL_BUILD}")
    print(f"   Model (Check):    {MODEL_CHECK}")

    # ── Step 1: Research ──────────────────────────────────────────────────────
    divider("STEP 1/3 — Research", "─")
    research_result = cmd_research(client, topic_en, topic_th, content_type)

    if not ask_approval("GATE 1: Approve เนื้อหาข้างต้น และดำเนินการ Build ต่อ?"):
        print("\n❌ Pipeline หยุดที่ Gate 1 — แก้ไข research แล้วรันใหม่")
        return

    # ── Step 2: Build ─────────────────────────────────────────────────────────
    divider("STEP 2/3 — Build", "─")
    build_result = cmd_build(client, topic_en, topic_th, research_result, content_type)

    # บันทึก HTML draft
    filename = f"{topic_en.lower().replace(' ', '_')}.html"
    html_content = extract_html(build_result)
    if html_content:
        draft_path = save_html(html_content, filename)
        print(f"\n📄 Draft ไฟล์: {draft_path}")
        print("   เปิดดูใน browser ก่อน approve")

    if not ask_approval("GATE 2: Approve UI/design และดำเนินการ Checker ต่อ?"):
        print("\n❌ Pipeline หยุดที่ Gate 2 — แก้ไข build แล้วรันใหม่")
        return

    # ── Step 3: Check ─────────────────────────────────────────────────────────
    divider("STEP 3/3 — Thai Language Check", "─")
    check_result = cmd_check(client, str(OUTPUT_DIR / filename))

    # ── Done ──────────────────────────────────────────────────────────────────
    divider("✅ PIPELINE COMPLETE", "═", 60)
    print(f"   หน้า {topic_th} พร้อมใช้งาน")
    print(f"   ไฟล์: {filename}")
    print(f"   อย่าลืม: อัปเดต Current Status ใน CLAUDE.md")


def cmd_status():
    """แสดงสถานะ project จาก CLAUDE.md"""
    claude_md = load_claude_md()
    if not claude_md:
        print("❌ ไม่พบ CLAUDE.md")
        return

    # แสดงเฉพาะส่วน Current Status
    match = re.search(r"## 📊 Current Status([\s\S]*?)(?=\n## |\Z)", claude_md)
    if match:
        divider("📊 Project Status")
        print(match.group(0))
    else:
        print(claude_md[:2000])


# ─── Main ─────────────────────────────────────────────────────────────────────

USAGE = """
🌿 Live In Peace — Orchestrator

คำสั่ง:
  research  <topic_en> "<topic_th>"              รัน Researcher agent
  build     <topic_en> "<topic_th>"              รัน Builder agent (ใช้ stdin หรือไฟล์)
  check     <path/to/file.html>                  รัน Checker agent
  pipeline  <topic_en> "<topic_th>" [--type disease|exercise]
                                                 รัน full pipeline พร้อม approval gates
  status                                         แสดงสถานะ project

ตัวอย่าง:
  python orchestrator.py research  OCD "โรคย้ำคิดย้ำทำ"
  python orchestrator.py pipeline  GAD "โรควิตกกังวลทั่วไป" --type disease
  python orchestrator.py pipeline  "body scan" "การสแกนร่างกาย" --type exercise
  python orchestrator.py check     mdd.html
  python orchestrator.py status
"""


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(USAGE)
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ไม่พบ ANTHROPIC_API_KEY environment variable")
        print("   ตั้งค่า: set ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    command = sys.argv[1].lower()

    try:
        if command == "research":
            if len(sys.argv) < 4:
                print("❌ ต้องระบุ: python orchestrator.py research <topic_en> \"<topic_th>\"")
                sys.exit(1)
            cmd_research(client, sys.argv[2], sys.argv[3])

        elif command == "check":
            if len(sys.argv) < 3:
                print("❌ ต้องระบุ: python orchestrator.py check <file.html>")
                sys.exit(1)
            cmd_check(client, sys.argv[2])

        elif command == "pipeline":
            if len(sys.argv) < 4:
                print("❌ ต้องระบุ: python orchestrator.py pipeline <topic_en> \"<topic_th>\"")
                sys.exit(1)
            content_type = "disease"
            if "--type" in sys.argv:
                idx = sys.argv.index("--type")
                if idx + 1 < len(sys.argv):
                    content_type = sys.argv[idx + 1]
            cmd_pipeline(client, sys.argv[2], sys.argv[3], content_type)

        elif command == "status":
            cmd_status()

        else:
            print(f"❌ ไม่รู้จักคำสั่ง: {command}")
            print(USAGE)

    except KeyboardInterrupt:
        print("\n\n⚠️  ถูกยกเลิกโดย user (Ctrl+C)")
    except anthropic.AuthenticationError:
        print("\n❌ API key ไม่ถูกต้อง — ตรวจสอบ ANTHROPIC_API_KEY")
    except anthropic.RateLimitError:
        print("\n❌ Rate limit — รอสักครู่แล้วลองใหม่")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()
