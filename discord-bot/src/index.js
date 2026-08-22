require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const cron = require("node-cron");

const { DISCORD_TOKEN, DAILY_VERSE_CHANNEL_ID, DAILY_VERSE_CRON } = process.env;

if (!DISCORD_TOKEN) {
  console.error("ต้องตั้งค่า DISCORD_TOKEN ใน .env ก่อน");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const commandsDir = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"))) {
  const command = require(path.join(commandsDir, file));
  client.commands.set(command.data.name, command);
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`คำสั่ง /${interaction.commandName} พัง:`, err);
    const payload = { content: "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ", ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.once("clientReady", () => {
  console.log(`✅ ล็อกอินแล้วในชื่อ ${client.user.tag}`);

  if (DAILY_VERSE_CHANNEL_ID) {
    const cronExpr = DAILY_VERSE_CRON || "0 7 * * *";
    cron.schedule(
      cronExpr,
      async () => {
        let channel;
        try {
          channel = await client.channels.fetch(DAILY_VERSE_CHANNEL_ID);
        } catch (err) {
          console.error("หาห้องโพสต์ข้อพระคัมภีร์ประจำวันไม่เจอ:", err);
          return;
        }

        try {
          const { buildTodayEmbed } = require("./commands/versetoday");
          const embed = await buildTodayEmbed();
          await channel.send({ embeds: [embed] });
        } catch (err) {
          console.error("โพสต์ข้อพระคัมภีร์ประจำวันไม่สำเร็จ:", err);
        }

        try {
          const { buildMannaEmbed } = require("./commands/mana");
          const embed = await buildMannaEmbed();
          await channel.send({ embeds: [embed] });
        } catch (err) {
          console.error("โพสต์บทเฝ้าเดี่ยววันนี้ไม่สำเร็จ:", err);
        }
      },
      { timezone: "Asia/Bangkok" },
    );
    console.log(`🌅 ตั้งเวลาโพสต์ข้อพระคัมภีร์ประจำวัน: "${cronExpr}" (Asia/Bangkok) ที่ห้อง ${DAILY_VERSE_CHANNEL_ID}`);
  } else {
    console.log("ℹ️ ไม่ได้ตั้งค่า DAILY_VERSE_CHANNEL_ID จะไม่มีการโพสต์ข้อพระคัมภีร์อัตโนมัติ (ใช้ /versetoday เองได้)");
  }
});

client.login(DISCORD_TOKEN);
