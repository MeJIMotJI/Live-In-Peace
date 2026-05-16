"""
Base Agent — parent class ที่ทุก agent สืบทอด
โหลด system prompt จาก agents/<name>.md
รัน Anthropic API พร้อม streaming
"""

from pathlib import Path
import anthropic

AGENTS_DIR = Path(__file__).parent
ROOT_DIR   = AGENTS_DIR.parent


class BaseAgent:
    """
    Parent class สำหรับทุก agent ใน Live In Peace

    Subclass ต้องกำหนด:
        name  (str) — ชื่อ agent, ต้องตรงกับชื่อไฟล์ agents/<name>.md
        model (str) — Claude model ที่ใช้
    """

    name:  str = "base"
    model: str = "claude-sonnet-4-5"

    def __init__(self, client: anthropic.Anthropic):
        self.client = client
        self.system_prompt = self._load_system_prompt()

    # ── Internal ──────────────────────────────────────────────────────────────

    def _load_system_prompt(self) -> str:
        """
        โหลด system prompt จาก agents/<name>.md
        แล้วต่อด้วย project context จาก CLAUDE.md
        """
        md_path = AGENTS_DIR / f"{self.name}.md"
        if not md_path.exists():
            raise FileNotFoundError(
                f"ไม่พบ system prompt: {md_path}\n"
                f"กรุณาสร้างไฟล์ agents/{self.name}.md ก่อน"
            )

        role_prompt = md_path.read_text(encoding="utf-8")

        # ใส่ project context จาก CLAUDE.md เพื่อให้ agent รู้จัก project
        claude_md = ROOT_DIR / "CLAUDE.md"
        if claude_md.exists():
            context = claude_md.read_text(encoding="utf-8")
            return (
                f"## Project Context (CLAUDE.md)\n\n{context}\n\n"
                f"{'─' * 60}\n\n"
                f"{role_prompt}"
            )

        return role_prompt

    # ── Public API ────────────────────────────────────────────────────────────

    def run(self, message: str, silent: bool = False) -> str:
        """
        ส่ง message ไปยัง agent และรับ response กลับมา
        พร้อม streaming output ให้เห็นผลแบบ real-time

        Args:
            message: คำถาม / งานที่ต้องการให้ agent ทำ
            silent:  ถ้า True จะไม่ print output (ใช้ตอน test)

        Returns:
            str: response text ทั้งหมดจาก agent
        """
        if not silent:
            self._print_header()

        collected = []

        with self.client.messages.stream(
            model=self.model,
            max_tokens=8192,
            system=self.system_prompt,
            messages=[{"role": "user", "content": message}],
        ) as stream:
            for chunk in stream.text_stream:
                if not silent:
                    print(chunk, end="", flush=True)
                collected.append(chunk)

        if not silent:
            print()  # newline หลัง stream จบ

        return "".join(collected)

    def _print_header(self):
        label = f"  🤖  {self.name.upper()} AGENT  [{self.model}]  "
        bar   = "═" * max(len(label), 60)
        print(f"\n{bar}\n{label}\n{bar}")
