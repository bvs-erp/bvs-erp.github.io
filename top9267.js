(function () {
  'use strict';
  if (window.TOP9267) return;
  var K = { d: null, at: 0, om: null, omAt: 0, busy: false, open: false };
  var OM = { ICN: [37.272, 127.435], CJU: [36.642, 127.489] };

  var st = document.createElement('style'); st.id = 'top9267css';
  st.textContent = [
    '#mk280{display:none!important}',
    '#tb267{display:flex;align-items:center;gap:2px;margin-left:14px;font-size:12.5px;line-height:1;white-space:nowrap;min-width:0;overflow:hidden;cursor:pointer;color:#55565c;position:relative}',
    '#tb267 .c{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border-radius:8px}',
    '#tb267:hover .c{background:#f4f4f5}',
    '#tb267 .c+.c{border-left:1px solid #ececef;border-radius:0 8px 8px 0}',
    '#tb267 i{font-style:normal;color:#8b8d94}',
    '#tb267 b{font-weight:600;color:#111113;font-variant-numeric:tabular-nums}',
    '#tb267 .up{color:#e5484d}#tb267 .dn{color:#2563eb}',
    '#tb267 svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;color:#55565c}',
        '@media (max-width:1600px){#tb267 .w3{display:none}}',
    '@media (max-width:1250px){#tb267 .w2{display:none}}',
    '@media (max-width:980px){#tb267{display:none}}',
    '@media print{#tb267,#tb267p{display:none!important}}',
    '#tb267p{position:fixed;z-index:9000;top:52px;width:440px;max-height:70vh;overflow-y:auto;overflow-x:hidden;background:#fff;border:1px solid #ebebed;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.12);padding:14px 16px;font-size:13px;color:#18181b;display:none}',
    '#tb267p.on{display:block}',
    '#tb267p h4{margin:12px 0 6px;font-size:12px;font-weight:600;color:#8b8d94}#tb267p h4:first-child{margin-top:0}',
    '#tb267p table{width:100%;border-collapse:collapse}#tb267p td{padding:6px 4px;border-bottom:1px solid #f1f1f3;font-variant-numeric:tabular-nums}',
    '#tb267p td{text-align:left!important}#tb267p i{font-style:normal}#tb267p td.r{text-align:right!important}#tb267p .s{color:#8b8d94;font-size:11.5px}#tb267p .up{color:#e5484d}#tb267p .dn{color:#2563eb}',
    'html[data-theme="dark"] #tb267 b{color:var(--tx)}html[data-theme="dark"] #tb267p{background:var(--sf);color:var(--tx);border-color:var(--ln)}'
  ].join('\n');
  document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function n(v, d) { return (+v).toLocaleString('ko-KR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function hm(t) { if (!t) return ''; var d = new Date(t); if (isNaN(d)) return String(t); var k = new Date(d.getTime() + 9 * 3600e3).toISOString(); return k.slice(5, 10) + ' ' + k.slice(11, 16); }
  function chg(cur, prev, d, pct) {
    if (cur == null || prev == null || !+prev) return '';
    var v = cur - prev, pc = Math.abs(v / prev * 100);
    if (pct ? pc < 0.05 : Math.abs(v) < Math.pow(10, -(d || 0)) / 2) return '<i>0</i>';
    var t = pct ? pc.toFixed(1) + '%' : n(Math.abs(v), d);
    return '<i class="' + (v > 0 ? 'up' : 'dn') + '">' + (v > 0 ? '▲' : '▼') + t + '</i>';
  }
  var ICO = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cloud: '<path d="M17.5 19H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8z"/>',
    rain: '<path d="M17.5 15H8a5 5 0 1 1 1-9.9A6 6 0 0 1 20 7a4 4 0 0 1-2.5 8z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>'
  };
  function skyIco(s) { s = s || ''; if (/눈/.test(s)) return ICO.snow; if (/비|소나기|빗방울/.test(s)) return ICO.rain; if (/흐림|구름/.test(s)) return ICO.cloud; return ICO.sun; }
  function omSky(c) { c = +c; if (c === 0) return '맑음'; if (c <= 2) return '구름조금'; if (c === 3) return '흐림'; if (c >= 51 && c <= 67) return '비'; if (c >= 71 && c <= 77) return '눈'; if (c >= 80 && c <= 82) return '소나기'; if (c >= 85 && c <= 86) return '눈'; if (c >= 95) return '뇌우'; return '흐림'; }

  function box() {
    var b = document.getElementById('tb267'); if (b) return b;
    var br = document.querySelector('#top .brand') || document.querySelector('header .brand'); if (!br) return null;
    b = document.createElement('div'); b.id = 'tb267';
    b.onclick = function (ev) { ev.stopPropagation(); K.open = !K.open; panel(); if (K.open) load(true); };
    br.after(b);
    var p = document.createElement('div'); p.id = 'tb267p'; p.onclick = function (ev) { ev.stopPropagation(); }; document.body.appendChild(p);
    document.addEventListener('click', function () { if (K.open) { K.open = false; panel(); } });
    return b;
  }

  function wxList() {
    var d = K.d || {}, list = (d.wx || []).slice();
    return list.map(function (w) {
      if (w.now != null) return w;
      var o = K.om && K.om[w.point];
      if (!o) return w;
      return { point: w.point, name: w.name, now: o.t, sky: omSky(o.code), tmin: o.lo, tmax: o.hi, pop: o.pp, fallback: true, error: w.error };
    });
  }

  function paint() {
    var b = box(); if (!b) return;
    var d = K.d || {}, h = '';
    wxList().forEach(function (w, i) {
      var cls = i ? ' w2' : '';
      h += '<span class="c' + cls + '"><svg viewBox="0 0 24 24">' + skyIco(w.sky) + '</svg><i>' + esc(w.name) + '</i><b>' + (w.now != null ? Math.round(w.now) + '°' : '–') + '</b>'
        + (w.tmin != null && w.tmax != null ? '<i class="w3">' + Math.round(w.tmin) + '/' + Math.round(w.tmax) + '°</i>' : '')
        + (w.pop != null ? '<i class="w3">비 ' + w.pop + '%</i>' : '') + '</span>';
    });
    var f = d.fuel || {}, ds = f['경유'];
    if (ds) { h += '<span class="c w2"><i>경유</i><b>' + n(ds.price) + '</b></span>'; }
    var u = (d.fx || {}).USD;
    if (u) { h += '<span class="c"><i>USD</i><b>' + n(u.rate, 1) + '</b>' + chg(+u.rate, u.prev == null ? null : +u.prev, 1) + '</span>'; }
    var cu = (d.lme || []).filter(function (x) { return x.code === 'CAD'; })[0];
    if (cu) { h += '<span class="c w3"><i>구리</i><b>$' + n(cu.usd) + '</b>' + chg(+cu.usd, cu.prev == null ? null : +cu.prev, 0, true) + '</span>'; }
    b.innerHTML = h;
    b.removeAttribute('title');
    if (K.open) panel();
  }

  function panel() {
    var p = document.getElementById('tb267p'), b = document.getElementById('tb267'); if (!p || !b) return;
    p.classList.toggle('on', K.open); if (!K.open) return;
    var r = b.getBoundingClientRect(); p.style.left = Math.max(8, Math.min(r.left, innerWidth - 456)) + 'px'; p.style.top = (r.bottom + 6) + 'px';
    var d = K.d || {}, h = '<h4>날씨</h4><table>';
    wxList().forEach(function (w) {
      h += '<tr><td>' + esc(w.name) + '</td><td>' + esc(w.sky || '–') + '</td><td class="r"><b>' + (w.now != null ? Math.round(w.now * 10) / 10 + '°' : '–') + '</b></td><td class="r">'
        + (w.tmin != null ? Math.round(w.tmin) + ' / ' + Math.round(w.tmax) + '°' : '') + '</td><td class="r">' + (w.pop != null ? '비 ' + w.pop + '%' : '') + '</td></tr>';
    });
    h += '</table><h4>환율</h4><table>';
    [['USD', '미국 달러'], ['JPY(100)', '일본 엔 100'], ['EUR', '유로'], ['CNH', '중국 위안']].forEach(function (c) {
      var x = (d.fx || {})[c[0]]; if (!x) return;
      h += '<tr><td>' + c[1] + '</td><td class="r"><b>' + n(x.rate, 2) + '</b></td><td class="r">' + chg(+x.rate, x.prev == null ? null : +x.prev, 2) + '</td><td class="r s">' + esc(x.date || '') + '</td></tr>';
    });
    h += '</table><h4>LME</h4><table>';
    (d.lme || []).forEach(function (x) {
      h += '<tr><td>' + esc(x.name) + '</td><td class="r"><b>$' + n(x.usd) + '</b>/t</td><td class="r">' + chg(+x.usd, x.prev == null ? null : +x.prev, 0, true) + '</td><td class="r">' + (x.krw_kg ? n(x.krw_kg) + '원/kg' : '') + '</td></tr>';
    });
    var f = d.fuel || {};
    h += '</table><h4>유가</h4><table>';
    ['경유', '휘발유'].forEach(function (k) { var x = f[k]; if (x) h += '<tr><td>' + k + '</td><td class="r"><b>' + n(x.price) + '</b>원/L</td><td class="r">' + chg(+x.price, x.prev == null ? null : +x.prev, 0) + '</td><td class="r s">' + esc(x.date || '') + '</td></tr>'; });
    h += '</table>';
    p.innerHTML = h;
  }

  function om() {
    var need = (K.d && K.d.wx || []).filter(function (w) { return w.now == null && OM[w.point]; });
    if (!need.length || (K.om && Date.now() - K.omAt < 30 * 60e3)) return Promise.resolve();
    var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + need.map(function (w) { return OM[w.point][0]; }).join(',') + '&longitude=' + need.map(function (w) { return OM[w.point][1]; }).join(',')
      + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul&forecast_days=1';
    return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return; if (!Array.isArray(j)) j = [j]; var m = {};
      j.forEach(function (o, i) { var c = o.current || {}, y = o.daily || {}; m[need[i].point] = { t: c.temperature_2m, code: c.weather_code, hi: (y.temperature_2m_max || [])[0], lo: (y.temperature_2m_min || [])[0], pp: (y.precipitation_probability_max || [])[0] }; });
      K.om = m; K.omAt = Date.now();
    }).catch(function () {});
  }

  function load(force) {
    if (K.busy) return; var s = (typeof sb !== 'undefined' && sb) || window.sb; if (!s || !s.rpc) { setTimeout(function () { load(force); }, 3000); return; }
    if (!force && K.d && Date.now() - K.at < 10 * 60e3) { paint(); return; }
    K.busy = true;
    Promise.resolve(s.rpc('top_bar')).then(function (r) { if (r && !r.error && r.data && r.data.ok) { K.d = r.data; K.at = Date.now(); } })
      .catch(function () {}).then(om).then(function () { K.busy = false; paint(); }, function () { K.busy = false; paint(); });
  }

  function start() { paint(); load(false); setInterval(function () { if (!document.hidden) load(false); }, 10 * 60e3); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 1500); }); else setTimeout(start, 1500);
  window.TOP9267 = { load: load, data: function () { return K.d; } };
})();
