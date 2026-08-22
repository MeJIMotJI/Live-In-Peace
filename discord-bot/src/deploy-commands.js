require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("ต้องตั้งค่า DISCORD_TOKEN และ CLIENT_ID ใน .env ก่อน");
  process.exit(1);
}

const commandsDir = path.join(__dirname, "commands");
const commands = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => require(path.join(commandsDir, f)).data.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);

    const result = await rest.put(route, { body: commands });
    console.log(
      `✅ ลงทะเบียน ${result.length} คำสั่งสำเร็จ (${GUILD_ID ? `เฉพาะ server ${GUILD_ID}` : "ทั่วโลก อาจใช้เวลาถึง 1 ชม. กว่าจะอัปเดต"})`,
    );
  } catch (err) {
    console.error("ลงทะเบียนคำสั่งไม่สำเร็จ:", err);
    process.exit(1);
  }
})();
