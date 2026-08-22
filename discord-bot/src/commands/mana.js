const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getTodayDevotional } = require("../lib/odb");

async function buildMannaEmbed() {
  const devo = await getTodayDevotional();
  const embed = new EmbedBuilder()
    .setColor(0x3a9b8a)
    .setTitle(`📖 บทเฝ้าเดี่ยววันนี้: ${devo.title}`)
    .setURL(devo.pageUrl)
    .setDescription("กดหัวข้อเพื่ออ่านฉบับเต็ม")
    .setFooter({ text: "พันธกิจมานาประจำวัน (Our Daily Bread Ministries)" });
  if (devo.imageUrl) embed.setImage(devo.imageUrl);
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mana")
    .setDescription("บทเฝ้าเดี่ยววันนี้จากพันธกิจมานาประจำวัน (odbm.org)"),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const embed = await buildMannaEmbed();
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply("ขอโทษนะ ดึงบทเฝ้าเดี่ยววันนี้ไม่สำเร็จ ลองใหม่อีกครั้งได้เลย 🙏");
    }
  },

  buildMannaEmbed,
};
