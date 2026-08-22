import "dotenv/config";
import { COMMANDS } from "./commands.js";

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("ต้องตั้งค่า DISCORD_TOKEN และ CLIENT_ID ใน .env ก่อน");
  process.exit(1);
}

const url = GUILD_ID
  ? `https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${CLIENT_ID}/commands`;

const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${DISCORD_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(COMMANDS),
});

if (!res.ok) {
  console.error(`ลงทะเบียนคำสั่งไม่สำเร็จ (${res.status}):`, await res.text());
  process.exit(1);
}

const result = await res.json();
console.log(
  `✅ ลงทะเบียน ${result.length} คำสั่งสำเร็จ (${GUILD_ID ? `เฉพาะ server ${GUILD_ID}` : "ทั่วโลก อาจใช้เวลาถึง 1 ชม. กว่าจะอัปเดต"})`,
);
