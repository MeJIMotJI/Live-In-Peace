const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRandomVerse, todayDateSeed } = require("../lib/bible");
const { dailyIntro } = require("../lib/flavorText");

async function buildTodayEmbed() {
  const v = await getRandomVerse(todayDateSeed());
  return new EmbedBuilder()
    .setColor(0x3a9b8a)
    .setTitle(dailyIntro())
    .setDescription(`**${v.book} ${v.chapter}:${v.verse}**\n\n${v.text}`)
    .setFooter({ text: v.translation });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("versetoday")
    .setDescription("ข้อพระคัมภีร์ประจำวันนี้ (ข้อเดียวกันทั้งวัน)"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const embed = await buildTodayEmbed();
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply("ขอโทษนะ ดึงข้อพระคัมภีร์ไม่สำเร็จ ลองใหม่อีกครั้งได้เลย 🙏");
    }
  },

  buildTodayEmbed,
};
