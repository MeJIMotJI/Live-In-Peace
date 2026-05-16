"""
Checker Agent
ตรวจสอบภาษาไทยในไฟล์ HTML ที่ Builder สร้าง
ตรวจ: การสะกด, วรรคตอน, น้ำเสียง, ศัพท์ทางการแพทย์, ภาษา stigmatize
"""

from pathlib import Path
from .base import BaseAgent
import anthropic


class CheckerAgent(BaseAgent):

    name  = "checker"
    model = "claude-sonnet-4-5"

    # ── Check from file ───────────────────────────────────────────────────────

    def check_file(self, filepath: str | Path) -> str:
        """
        ตรวจภาษาไทยในไฟล์ HTML ที่กำหนด
        ส่งกลับ: รายการที่แก้ไข + complete HTML ที่แก้แล้ว
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"ไม่พบไฟล์: {filepath}")

        content = path.read_text(encoding="utf-8")
        return self._run_check(content, path.name)

    # ── Check from string ─────────────────────────────────────────────────────

    def check_content(self, html_content: str,
                      filename: str = "ไม่ระบุ") -> str:
        """
        ตรวจภาษาไทยจาก HTML string โดยตรง
        (ใช้ตอนที่ Builder เพิ่งสร้างเสร็จและยังไม่ได้บันทึกไฟล์)
        """
        return self._run_check(html_content, filename)

    # ── Internal ──────────────────────────────────────────────────────────────

    def _run_check(self, html_content: str, filename: str) -> str:
        message = f"""
ตรวจสอบภาษาไทยในไฟล์ HTML นี้:

ชื่อไฟล์: {filename}

สิ่งที่ต้องตรวจ:
1. การสะกดคำ (โดยเฉพาะศัพท์การแพทย์)
2. วรรคตอน (เว้นวรรคที่ถูกต้อง, ค่อยๆ vs ค่อย ๆ)
3. น้ำเสียง (อบอุ่น ไม่ตัดสิน ให้กำลังใจ)
4. ภาษา stigmatize ที่ต้องแก้ไข
5. ความสอดคล้องของศัพท์ตลอดไฟล์

ส่งกลับในรูปแบบที่กำหนดใน system prompt:
— ตารางรายการที่แก้ไข
— complete HTML file ที่แก้แล้ว

─── เนื้อหาไฟล์ ───────────────────────────────────────────

{html_content}
        """.strip()

        return self.run(message)
