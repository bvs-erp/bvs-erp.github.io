(function () {
  'use strict';
  if (window.WX9263) return;
  var cache = {}, busy = false;
  function kst(off) { return new Date(Date.now() + 9 * 3600e3 + (off || 0) * 86400e3).toISOString().slice(0, 10); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  async function load(site) {
    var k = site || '*';
    if (cache[k] && Date.now() - cache[k].t < 30 * 60e3) return cache[k].v;
    var r = await window.sb.rpc('weather_today', { p_site_id: site || null });
    var v = (r && r.data && r.data.items) || [];
    cache[k] = { t: Date.now(), v: v };
    return v;
  }
  async function paint() {
    var box = document.getElementById('wxBox'), inp = document.getElementById('wxTemp');
    if (!box || !inp || busy || !window.sb) return;
    var date = (window.LOG && window.LOG.date) || kst(0);
    if (date !== kst(0) && date !== kst(1)) { var o = document.getElementById('wx9263'); if (o) o.remove(); return; }
    var site = null;
    try { var e = typeof window.entryOf === 'function' ? window.entryOf(date) : null; site = e && e.site_id; } catch (x) {}
    if (!site) return;
    if (box.dataset.wx9263 === site + '|' + date) return;
    busy = true;
    try {
      var items = await load(site);
      var it = items.filter(function (x) { return x.date === date; })[0];
      var line = document.getElementById('wx9263');
      if (!line) { line = document.createElement('div'); line.id = 'wx9263'; line.style.cssText = 'font-size:12.5px;color:var(--tx2,#555);margin:4px 0 2px'; box.appendChild(line); }
      if (!it) { line.textContent = '기상청 예보를 아직 받지 못했습니다'; return; }
      var parts = ['기상청 예보 ' + it.name];
      parts.push('최고 ' + (it.tmax != null ? Math.round(it.tmax) + '℃' : '–') + ' 최저 ' + (it.tmin != null ? Math.round(it.tmin) + '℃' : '–'));
      if (it.pop != null) parts.push('강수 ' + it.pop + '%');
      if (it.sky) parts.push(it.sky);
      line.innerHTML = esc(parts.join(' · ')) + (it.alert ? ' · <b style="color:#C62828">' + esc(it.alert) + '</b>' : '');
      if (inp.value === '' && it.tmax != null) {
        inp.value = String(Math.round(Number(it.tmax) * 10) / 10);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof window.wx132Paint === 'function') { try { window.wx132Paint(); } catch (x) {} }
      }
      box.dataset.wx9263 = site + '|' + date;
    } catch (e) { console.warn('wx9263', e); }
    finally { busy = false; }
  }
  new MutationObserver(function () { if (document.getElementById('wxBox')) paint(); })
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') paint(); });
  window.WX9263 = { paint: paint, load: load };
})();