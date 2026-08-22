const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRandomVerse } = require("../lib/bible");
const { randomFortuneIntro } = require("../lib/flavorText");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verse")
    .setDescription("สุ่มข้อพระคัมภีร์หนึ่งข้อ"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const v = await getRandomVerse();
      const embed = new EmbedBuilder()
        .setColor(0x3a9b8a)
        .setTitle(randomFortuneIntro())
        .setDescription(`**${v.book} ${v.chapter}:${v.verse}**\n\n${v.text}`)
        .setFooter({ text: `${v.translation} • สุ่มเพื่อให้กำลังใจ ไม่ใช่การทำนายอนาคต` });
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply("ขอโทษนะ ดึงข้อพระคัมภีร์ไม่สำเร็จ ลองใหม่อีกครั้งได้เลย 🙏");
    }
  },
};
