import { DurableObject } from 'cloudflare:workers';

/**
 * ตัวนับผู้เข้าใช้เว็บ Live In Peace
 * - views    = จำนวนครั้งที่เปิดหน้าใดก็ได้ในเว็บ (page views รวม)
 * - visitors = จำนวนผู้เข้าใช้แบบไม่ซ้ำ (นับ 1 ต่อเครื่อง ครั้งแรกที่เข้าเว็บ ตัดสินจากฝั่ง client)
 * เก็บใน Durable Object ตัวเดียว (singleton) เพื่อให้บวกแบบ atomic ไม่ชนเพดานการเขียนแบบ KV
 */
export class Counter extends DurableObject {
  async hit(unique) {
    const views = ((await this.ctx.storage.get('views')) || 0) + 1;
    let visitors = (await this.ctx.storage.get('visitors')) || 0;
    if (unique) visitors += 1;
    await this.ctx.storage.put({ views, visitors });
    return { views, visitors };
  }

  async stats() {
    return {
      views: (await this.ctx.storage.get('views')) || 0,
      visitors: (await this.ctx.storage.get('visitors')) || 0,
    };
  }

  async reset() {
    await this.ctx.storage.put({ views: 0, visitors: 0 });
    return { views: 0, visitors: 0 };
  }
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function stub(env) {
  return env.COUNTER.get(env.COUNTER.idFromName('global'));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/hit' && request.method === 'POST') {
      let unique = false;
      try {
        const body = await request.json();
        unique = body === true || (body && body.unique === true);
      } catch (e) {
        /* body ว่างหรือไม่ใช่ JSON — ถือว่าไม่ unique */
      }
      const data = await stub(env).hit(unique);
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      const data = await stub(env).stats();
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }

    // รีเซ็ตตัวนับ — ล็อกด้วย secret RESET_KEY (ตั้งผ่าน `wrangler secret put RESET_KEY`)
    // ไม่ตั้ง secret ไว้ = ปิดใช้งาน endpoint นี้
    if (url.pathname === '/api/reset' && env.RESET_KEY && url.searchParams.get('key') === env.RESET_KEY) {
      const data = await stub(env).reset();
      return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
    }

    return env.ASSETS.fetch(request);
  },
};
