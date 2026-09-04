/* ตัวนับผู้เข้าใช้ Live In Peace — โหลดในทุกหน้า (defer)
   ยิง /api/hit ทุกครั้งที่เปิดหน้า, นับ "ผู้เข้าใช้" 1 ครั้งต่อเครื่อง (ครั้งแรกที่เข้าเว็บ)
   ถ้าหน้ามีช่อง #stat-views / #stat-visitors (มีแค่ index) ก็เติมตัวเลขให้ */
(function () {
  var KEY = 'lip-seen'; // bump ชื่อ key เมื่อต้องการให้เครื่องเก่านับใหม่หลัง reset
  var unique = false;
  try {
    if (!localStorage.getItem(KEY)) {
      unique = true;
      localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    }
  } catch (e) {
    /* localStorage ปิดอยู่ — ยังนับ page view ได้ แค่ไม่นับ unique */
  }

  function fmt(n) {
    try { return Number(n).toLocaleString('th-TH'); } catch (e) { return String(n); }
  }
  function render(d) {
    if (!d) return;
    var v = document.getElementById('stat-views');
    var u = document.getElementById('stat-visitors');
    if (v && typeof d.views === 'number') v.textContent = fmt(d.views);
    if (u && typeof d.visitors === 'number') u.textContent = fmt(d.visitors);
  }

  function readOnly() {
    // สำรอง: ถ้า POST ล้มเหลว (เช่น Safari เก่า, ตัวบล็อก) อย่างน้อยก็ยังแสดงยอดได้
    fetch('/api/stats')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(render)
      .catch(function () {});
  }

  try {
    fetch('/api/hit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unique: unique }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) render(d); else readOnly(); })
      .catch(readOnly);
  } catch (e) {
    readOnly();
  }
})();
