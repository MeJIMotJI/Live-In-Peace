"""
Researcher Agent
ค้นหาข้อมูล evidence-based จากแหล่งอ้างอิงที่น่าเชื่อถือ
แล้วสรุปเป็น outline พร้อมให้ PM เอาไป approve ก่อน build
"""

from .base import BaseAgent
import anthropic


class ResearcherAgent(BaseAgent):

    name  = "researcher"
    model = "claude-opus-4-5"   # ต้องการ knowledge depth มากที่สุด

    # ── Disease ───────────────────────────────────────────────────────────────

    def research_disease(self, name_en: str, name_th: str) -> str:
        """
        ค้นหาข้อมูล psychoeducation สำหรับโรคจิตเวชที่กำหนด
        ส่งกลับ outline พร้อมแหล่งอ้างอิง (รอ approve ก่อน build)
        """
        message = f"""
ค้นหาและสรุปข้อมูล psychoeducation สำหรับ:

ชื่อโรค (EN): {name_en}
ชื่อโรค (TH): {name_th}

กลุ่มเป้าหมาย: ผู้ใหญ่ไทยทั่วไป อายุ 20 ปีขึ้นไป
ใช้ Output Format ที่กำหนดใน system prompt ของคุณ
ระบุแหล่งอ้างอิงทุกข้อมูลสำคัญ
        """.strip()

        return self.run(message)

    # ── Exercise ──────────────────────────────────────────────────────────────

    def research_exercise(self, name_en: str, name_th: str) -> str:
        """
        ค้นหา evidence base และวิธีปฏิบัติที่ถูกต้องสำหรับ exercise
        """
        message = f"""
ค้นหา evidence base และวิธีปฏิบัติที่ถูกต้องสำหรับ exercise:

ชื่อ (EN): {name_en}
ชื่อ (TH): {name_th}

ต้องการ:
1. หลักฐานทางวิทยาศาสตร์ที่รองรับ (งานวิจัย / meta-analysis / systematic review)
2. วิธีปฏิบัติที่ถูกต้อง step-by-step
3. ข้อควรระวังและข้อห้าม
4. ความถี่ / ระยะเวลาที่แนะนำ
5. แหล่งอ้างอิง

ใช้ Output Format ที่กำหนดใน system prompt ของคุณ
        """.strip()

        return self.run(message)

    # ── General ───────────────────────────────────────────────────────────────

    def research_topic(self, topic: str) -> str:
        """ค้นหาข้อมูลสำหรับหัวข้อทั่วไป (flexible)"""
        return self.run(topic)
