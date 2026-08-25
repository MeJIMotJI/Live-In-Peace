// Cloudflare Worker: บอท Discord แบบ HTTP Interactions (ไม่มี process ค้าง ไม่ต้องพึ่ง Gateway)
// - fetch(): รับ interaction ทุกครั้งที่มีคนพิมพ์ slash command ใน Discord
// - scheduled(): Cron Trigger 2 ตัว — โพสต์บทเฝ้าเดี่ยวทุกวัน + เช็ค/แชร์บทความ Mustard Seed ทุกสัปดาห์
import { verifyKey, InteractionType, InteractionResponseType } from "discord-interactions";
import { getRandomVerse, getComfortVerse, todayDateSeed } from "./lib/bible.js";
import { getTodayDevotional } from "./lib/odb.js";
import { getWeeklyMustardSeedPost, getRandomMustardSeedPost } from "./lib/mustardseed.js";
import { randomFortuneIntro, dailyIntro } from "./lib/flavorText.js";

const DISCORD_API = "https://discord.com/api/v10";
// ต้องตรงกับ triggers.crons ตัวที่สองใน wrangler.jsonc (ตัวเดียวที่ไม่ใช่ "ทุกวัน")
const WEEKLY_CRON = "0 23 * * 1";

function verseEmbed(v, title) {
  return {
    embeds: [
      {
        color: 0x3a9b8a,
        title,
        description: `**${v.book} ${v.chapter}:${v.verse}**\n\n${v.text}`,
        footer: { text: v.translation },
      },
    ],
  };
}

async function handleVerse(interaction, env) {
  const v = await getRandomVerse();
  return verseEmbed(v, randomFortuneIntro());
}

async function handleVerseToday(interaction, env) {
  const v = await getRandomVerse(todayDateSeed());
  return verseEmbed(v, dailyIntro());
}

async function handleMana(interaction, env) {
  const devo = await getTodayDevotional();
  return {
    embeds: [
      {
        color: 0x3a9b8a,
        title: `📖 บทเฝ้าเดี่ยววันนี้: ${devo.title}`,
        url: devo.pageUrl,
        description: "กดหัวข้อเพื่ออ่านฉบับเต็ม",
        image: devo.imageUrl ? { url: devo.imageUrl } : undefined,
        footer: { text: "พันธกิจมานาประจำวัน (Our Daily Bread Ministries)" },
      },
    ],
  };
}

function mustardSeedEmbed(article, headerText) {
  return {
    embeds: [
      {
        color: 0x5b8fd9,
        title: `${headerText}: ${article.title}`,
        url: article.link,
        description: article.summary || "กดหัวข้อเพื่ออ่านฉบับเต็ม",
        footer: { text: "Mustard Seed Community" },
      },
    ],
  };
}

async function handleRead(interaction, env) {
  const article = await getRandomMustardSeedPost();
  return mustardSeedEmbed(article, "🌱 สุ่มบทความจาก Mustard Seed");
}

async function handlePray(interaction, env) {
  const request = interaction.data.options?.find((o) => o.name === "คำขอ")?.value ?? "";
  const requesterName =
    interaction.member?.user?.global_name || interaction.member?.user?.username || "เพื่อนคนหนึ่ง";

  const v = await getComfortVerse();

  return {
    embeds: [
      {
        color: 0x3a9b8a,
        title: `🙏 คำขออธิษฐานจาก ${requesterName}`,
        description: request,
        fields: [{ name: `${v.book} ${v.chapter}:${v.verse}`, value: v.text }],
        footer: { text: "กด 🙏 ด้านล่างเพื่อบอกว่าคุณอธิษฐานเผื่อด้วยนะ" },
      },
    ],
  };
}

const HANDLERS = { verse: handleVerse, versetoday: handleVerseToday, read: handleRead, pray: handlePray };

async function editOriginalResponse(applicationId, interactionToken, payload) {
  await fetch(`${DISCORD_API}/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function getOriginalResponseMessage(applicationId, interactionToken) {
  const res = await fetch(`${DISCORD_API}/webhooks/${applicationId}/${interactionToken}/messages/@original`);
  if (!res.ok) return null;
  return res.json();
}

async function addReaction(channelId, messageId, emoji, botToken) {
  await fetch(
    `${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
    { method: "PUT", headers: { Authorization: `Bot ${botToken}` } },
  );
}

async function runDeferred(interaction, handler, env) {
  try {
    const payload = await handler(interaction, env);
    await editOriginalResponse(env.DISCORD_APPLICATION_ID, interaction.token, payload);

    if (interaction.data.name === "pray") {
      const message = await getOriginalResponseMessage(env.DISCORD_APPLICATION_ID, interaction.token);
      if (message) {
        await addReaction(message.channel_id, message.id, "🙏", env.DISCORD_TOKEN);
      }
    }
  } catch (err) {
    console.error(err);
    await editOriginalResponse(env.DISCORD_APPLICATION_ID, interaction.token, {
      content: "ขอโทษนะ เกิดข้อผิดพลาด ลองใหม่อีกครั้งได้เลย 🙏",
    });
  }
}

async function postToChannel(channelId, botToken, payload) {
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bot ${botToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`โพสต์เข้าห้องไม่สำเร็จ (${res.status}): ${await res.text()}`);
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Live In Peace Discord bot is running.", { status: 200 });
    }

    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const body = await request.text();

    const isValid =
      signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
    if (!isValid) {
      return new Response("invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const handler = HANDLERS[interaction.data.name];
      if (!handler) {
        return Response.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "ไม่รู้จักคำสั่งนี้" },
        });
      }
      // ตอบ "กำลังคิด..." ทันทีภายใน 3 วิ แล้วค่อยไปดึงข้อมูลจริง (bible.js/odb.js อาจใช้เวลาเกิน 3 วิ)
      ctx.waitUntil(runDeferred(interaction, handler, env));
      return Response.json({ type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    }

    return new Response("unhandled interaction type", { status: 400 });
  },

  async scheduled(event, env, ctx) {
    if (!env.DAILY_VERSE_CHANNEL_ID) return;

    if (event.cron === WEEKLY_CRON) {
      ctx.waitUntil(
        (async () => {
          try {
            const weekly = await getWeeklyMustardSeedPost();
            if (!weekly) return;
            const headerText = weekly.isNew
              ? "📰 บทความใหม่จาก Mustard Seed สัปดาห์นี้"
              : "🌱 บทความจาก Mustard Seed";
            await postToChannel(
              env.DAILY_VERSE_CHANNEL_ID,
              env.DISCORD_TOKEN,
              mustardSeedEmbed(weekly.article, headerText),
            );
          } catch (err) {
            console.error("โพสต์บทความ Mustard Seed ไม่สำเร็จ:", err);
          }
        })(),
      );
      return;
    }

    ctx.waitUntil(
      (async () => {
        try {
          const payload = await handleMana(null, env);
          await postToChannel(env.DAILY_VERSE_CHANNEL_ID, env.DISCORD_TOKEN, payload);
        } catch (err) {
          console.error("โพสต์บทเฝ้าเดี่ยวไม่สำเร็จ:", err);
        }
      })(),
    );
  },
};
