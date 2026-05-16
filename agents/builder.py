"""
Builder Agent
ออกแบบและสร้างไฟล์ HTML/CSS/JS
ตาม design system ที่กำหนดใน agents/builder.md
"""

import re
from pathlib import Path
from .base import BaseAgent
import anthropic


class BuilderAgent(BaseAgent):

    name  = "builder"
    model = "claude-sonnet-4-5"

    # ── Disease page ──────────────────────────────────────────────────────────

    def build_disease_page(self, name_en: str, name_th: str,
                           research_content: str) -> str:
        """
        สร้าง HTML page สำหรับโรคจิตเวช (accordion psychoeducation)
        ต้องผ่าน research และ approve เนื้อหาก่อนเรียก method นี้
        """
        filename = self._make_filename(name_en)
        message = f"""
สร้างไฟล์ HTML สำหรับหน้า psychoeducation:

ชื่อโรค (EN): {name_en}
ชื่อโรค (TH): {name_th}
ชื่อไฟล์: {filename}

เนื้อหาที่ได้รับการ approve แล้ว:
{research_content}

ใช้ design system จาก system prompt (builder.md)
— Topbar พร้อม back button → index.html
— Hero banner สี gradient
— Accordion sections สำหรับเนื้อหา
— mobile-first, ไม่ใช้ external dependency

ส่งออกเป็น complete HTML file พร้อมใช้งานทันที
        """.strip()

        return self.run(message)

    # ── Exercise page ─────────────────────────────────────────────────────────

    def build_exercise_page(self, name_en: str, name_th: str,
                            research_content: str) -> str:
        """
        สร้าง HTML page สำหรับ interactive exercise
        ทำงาน offline, ไม่ต้องการ backend
        """
        filename = self._make_filename(name_en)
        message = f"""
สร้างไฟล์ HTML สำหรับหน้า interactive exercise:

ชื่อ (EN): {name_en}
ชื่อ (TH): {name_th}
ชื่อไฟล์: {filename}

เนื้อหาและข้อมูลที่ได้รับการ approve แล้ว:
{research_content}

ใช้ design system จาก system prompt (builder.md)
— Topbar พร้อม back button → index.html
— Interactive elements ทำงานได้ offline (Web Audio API ถ้าจำเป็น)
— Vanilla JS เท่านั้น ไม่ใช้ framework

ส่งออกเป็น complete HTML file พร้อมใช้งานทันที
        """.strip()

        return self.run(message)

    # ── Edit existing ─────────────────────────────────────────────────────────

    def revise_page(self, filepath: str | Path,
                    instructions: str) -> str:
        """
        แก้ไข page ที่มีอยู่แล้วตามคำสั่งที่กำหนด
        โหลด HTML ปัจจุบันแล้วส่งให้ agent แก้ไข
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"ไม่พบไฟล์: {filepath}")

        current_html = path.read_text(encoding="utf-8")
        message = f"""
แก้ไขไฟล์ HTML ตามคำสั่งต่อไปนี้:

ชื่อไฟล์: {path.name}

คำสั่ง:
{instructions}

HTML ปัจจุบัน:
{current_html}

ส่งออกเป็น complete HTML file ที่แก้ไขแล้ว
        """.strip()

        return self.run(message)

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def extract_html(response: str) -> str | None:
        """
        แยก HTML content จาก response text
        รองรับทั้ง ```html ... ``` และ <!DOCTYPE ... > โดยตรง
        """
        # ลอง ```html ... ``` block ก่อน (preferred)
        match = re.search(
            r"```html\s*(<!DOCTYPE[\s\S]*?)```",
            response, re.IGNORECASE
        )
        if match:
            return match.group(1).strip()

        # fallback: หา <!DOCTYPE ... > โดยตรง
        match = re.search(
            r"(<!DOCTYPE html>[\s\S]*)",
            response, re.IGNORECASE
        )
        if match:
            return match.group(1).strip()

        return None

    @staticmethod
    def _make_filename(name_en: str) -> str:
        """แปลงชื่อภาษาอังกฤษเป็น filename"""
        return name_en.lower().strip().replace(" ", "_") + ".html"
