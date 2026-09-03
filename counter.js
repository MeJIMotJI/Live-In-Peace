/* ตัวนับผู้เข้าใช้ Live In Peace — โหลดในทุกหน้า (defer)
   ยิง /api/hit ทุกครั้งที่เปิดหน้า, นับ "ผู้เข้าใช้" 1 ครั้งต่อเครื่อง (ครั้งแรกที่เข้าเว็บ)
   ถ้าหน้ามีช่อง #stat-views / #stat-visitors (มีแค่ index) ก็เติมตัวเลขให้ */
(function () {
  var KEY = 'lip-visited';
  var unique = false;
  try {
    if (!localStorage.getItem(KEY)) {
      unique = true;
      localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    }
  } catch (e) {
    /* localStorage ปิดอยู่ — ยังนับ page view ได้ แค่ไม่นับ unique */
  }

  function render(d) {
    if (!d) return;
    var v = document.getElementById('stat-views');
    var u = document.getElementById('stat-visitors');
    var fmt = function (n) {
      try { return Number(n).toLocaleString('th-TH'); } catch (e) { return String(n); }
    };
    if (v && typeof d.views === 'number') v.textContent = fmt(d.views);
    if (u && typeof d.visitors === 'number') u.textContent = fmt(d.visitors);
  }

  fetch('/api/hit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unique: unique }),
    keepalive: true,
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(render)
    .catch(function () { /* ออฟไลน์/พลาด — ไม่เป็นไร */ });
})();
