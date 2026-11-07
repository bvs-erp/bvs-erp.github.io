(function () {
  'use strict';
  if (window.UI9266 || !document.getElementById('sb') || typeof window.wsViews !== 'function') return;

  var f = document.createElement('link'); f.rel = 'stylesheet';
  f.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap';
  document.head.appendChild(f);

  var css = document.createElement('style'); css.id = 'ui9266css';
  css.textContent = [
    ':root,html[data-theme="light"]{--font-sans:"Geist","Noto Sans KR",-apple-system,"Malgun Gothic",sans-serif;',
    '--bg:#fafafa;--sf:#fff;--sf2:#f6f6f7;--ln:#ebebed;--ln2:#f2f2f3;--tx:#111113;--tx2:#55565c;--tx3:#8b8d94;',
    '--ac:#111113;--ac2:#f2f2f3;--acx:#000;--gh:#fff;--gl:#f0f0f2;--rh:#fafafa;--rs:#f3f4f6;--sbbg:#fafafa;',
    '--r:12px;--r2:8px;--sh:0 1px 2px rgba(0,0,0,.04);--shx:0 6px 24px rgba(0,0,0,.08)}',
    '*,*::before,*::after{font-family:var(--font-sans)!important}',
    'body{letter-spacing:-0.01em}',
    '.num,td.amt,.mono,.kpi-value,td.r{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}',
    '@media (min-width:761px){',
    ' html body #app{grid-template-columns:216px minmax(0,1fr)!important}',
    ' html body #sb{display:flex!important;flex-direction:column;background:#fafafa!important;border-right:1px solid var(--ln)!important;overflow:auto}',
    ' #sb .nsrch,#sb #nav,#sb .sbf{display:none!important}',
    ' html body #mtabs{display:none!important}',
    '}',
    '#u66{padding:14px 10px 20px;display:flex;flex-direction:column;gap:2px;font-size:14px}',
    '#u66 .h{font-size:11.5px;color:var(--tx3);font-weight:600;padding:6px 10px 6px}',
    '#u66 .i{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:8px;color:#2a2b30;cursor:pointer;line-height:1.25;user-select:none}',
    '#u66 .i:hover{background:#efeff1}',
    '#u66 .i.on{background:#e9e9ec;color:#111;font-weight:600}',
    '#u66 .i svg{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.8}',
    '#u66 .i .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#u66 .i .n{font-size:11.5px;color:var(--tx3);font-variant-numeric:tabular-nums}',
    '#u66 .i .x{opacity:.5;padding:0 2px}#u66 .i .x:hover{opacity:1}',
    '#u66 .sp{height:10px}',
    '#modbar{background:#fff!important;border-bottom:1px solid var(--ln)!important}',
    '.ws-btn{border-radius:8px!important;margin:6px 2px!important;padding:7px 14px!important;font-size:14px!important;font-weight:500!important;color:var(--tx2)!important;border:0!important;background:none!important}',
    '.ws-btn:hover{background:#f2f2f3!important}',
    '.ws-btn.on{background:#111113!important;color:#fff!important;font-weight:600!important}',
    '.ws-btn .ws-n{display:none!important}',
    '#top{background:#fff!important;border-bottom:1px solid var(--ln)!important}',
    '.nav-btn,.ksearch,#top .sel{border-radius:8px!important;border-color:var(--ln)!important}',
    '.nav-btn.active{background:#111113!important;color:#fff!important;border-color:#111113!important}',
    '.ph h2,.pg-t{font-weight:700!important;letter-spacing:-0.02em}',
    '.ph h2{font-size:22px!important}',
    '.sec,.card,.kpi{background:#fff;border:1px solid var(--ln)!important;border-radius:12px!important;box-shadow:var(--sh)}',
    '.sec{padding:14px 16px!important;margin-bottom:12px!important}',
    '.sec h3{font-size:15px!important;font-weight:700!important;border:0!important;padding-left:0!important}',
    '.btn{border-radius:8px!important;border:1px solid var(--ln)!important;background:#fff!important;font-weight:500!important}',
    '.btn:hover{background:#f6f6f7!important}',
    '.btn.p{background:#111113!important;color:#fff!important;border-color:#111113!important}',
    '.btn.p:hover{background:#2a2b30!important}',
    '.in,.sel,input.in,select.sel,textarea{border-radius:8px!important;border-color:var(--ln)!important}',
    '.al-filters{display:flex!important;flex-wrap:wrap;gap:6px!important}',
    '.al-filters .chip,.chip{display:inline-flex!important;width:auto!important;align-items:center;border-radius:999px!important;padding:5px 13px!important;border:1px solid var(--ln)!important;background:#fff!important;font-size:12.5px!important;color:var(--tx2)}',
    '.al-filters .chip.on,.chip.on{background:#111113!important;color:#fff!important;border-color:#111113!important}',
    'table th{background:#fff!important;color:var(--tx3)!important;font-weight:600!important;font-size:12px!important;border-bottom:1px solid var(--ln)!important}',
    'table td{border-color:var(--ln2)!important}',
    'table tbody tr:hover td{background:#fafafa!important}',
    '#dr{border-left:1px solid var(--ln)!important;box-shadow:var(--shx)!important}'
  ].join('\n');
  document.head.appendChild(css);

  var IC = {
    ceo_today: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    op_board: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    hr_info: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    op_check: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
    hr_abs: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    op_disp: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
    op_safety: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/>',
    op_site: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    sd_quote: '<path d="M3 6h18M6 12h12M10 18h4"/>',
    ws_mfg: '<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>',
    sd_partner: '<path d="M3 21V7l9-4 9 4v14"/><path d="M9 21v-6h6v6"/>',
    pm_mat: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>',
    ws_fin: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    hr_calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0"/>',
    ac_gl_acct: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h6"/>',
    ac_vat: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'
  };
  var DOT = '<circle cx="12" cy="12" r="2.5"/>';
  var BYNAME = [
    [/메일/, 'mail'], [/콕핏|관제|대시/, 'ceo_today'], [/상황판|현황/, 'op_board'], [/인사|직원/, 'hr_info'], [/마감|점검/, 'op_check'],
    [/달력|휴무|일정/, 'hr_abs'], [/이의|문의/, 'op_disp'], [/안전|교육/, 'op_safety'], [/장소/, 'op_site'], [/딜|파이프|견적/, 'sd_quote'],
    [/프로젝트|제조/, 'ws_mfg'], [/거래처/, 'sd_partner'], [/자재|품목|트레이/, 'pm_mat'], [/캐시|자금|데스크/, 'ws_fin'], [/급여|계산|지급/, 'hr_calc'],
    [/장부|전표|문서/, 'ac_gl_acct'], [/부가세|세금|신고/, 'ac_vat']
  ];
  function icon(k, label) { if (IC[k]) return IC[k]; for (var i = 0; i < BYNAME.length; i++) if (BYNAME[i][0].test(label || '')) return IC[BYNAME[i][1]]; return DOT; }
  var esc = function (s) { return (typeof window.esc === 'function') ? window.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var J = function (v) { return (window.ERPC && ERPC.jsq) ? ERPC.jsq(v) : JSON.stringify(v); };

  function count(k) {
    try {
      if (k === 'mail' && window.MAIL && MAIL.sum && +MAIL.sum.unread) return (+MAIL.sum.unread).toLocaleString('ko-KR');
      if (k === 'ceo_today') { var a = document.getElementById('alertN'); if (a && !a.classList.contains('hide') && a.textContent) return a.textContent; }
    } catch (e) {}
    return '';
  }

  function side() {
    var sb = document.getElementById('sb'); if (!sb) return;
    var box = document.getElementById('u66');
    if (!box) { box = document.createElement('div'); box.id = 'u66'; sb.insertBefore(box, sb.firstChild); }
    var list = (typeof wsList === 'function') ? wsList() : [];
    var w = (window.WS || []).filter(function (x) { return window.SH && x.id === SH.ws; })[0] || list[0];
    if (!w) { box.innerHTML = ''; return; }
    var vs = wsViews(w), cur = window.ST && ST.menu;
    var h = '<div class="h">' + esc(w.t) + '</div>' + vs.map(function (x) {
      var n = count(x[0]);
      return '<div class="i' + (x[0] === cur ? ' on' : '') + '" data-k="' + esc(x[0]) + '" onclick="go(' + J(x[0]) + ')"><svg viewBox="0 0 24 24">' + icon(x[0], x[1]) + '</svg><span class="t">' + esc(x[1]) + '</span>' + (n ? '<span class="n">' + esc(n) + '</span>' : '') + '</div>';
    }).join('');
    if (cur && !vs.some(function (x) { return x[0] === cur; }) && typeof menuFind === 'function') {
      var it = menuFind(cur);
      if (it) h += '<div class="sp"></div><div class="h">열린 화면</div><div class="i on" title="' + esc(it.m.g + ' › ' + it.t) + '"><svg viewBox="0 0 24 24">' + DOT + '</svg><span class="t">' + esc(it.t) + '</span><span class="x" onclick="event.stopPropagation();wsBack()">×</span></div>';
    }
    box.innerHTML = h;
  }

  var st0 = window.shTabs;
  if (typeof st0 === 'function') window.shTabs = function () { var r = st0.apply(this, arguments); try { side(); } catch (e) { console.error('[ui9266]', e); } return r; };
  setInterval(function () { if (!document.hidden) { try { var box = document.getElementById('u66'); if (box) box.querySelectorAll('.i[data-k]').forEach(function (e) { var k = e.getAttribute('data-k'), n = count(k), s = e.querySelector('.n'); if (n && !s) { e.insertAdjacentHTML('beforeend', '<span class="n"></span>'); s = e.querySelector('.n'); } if (s) s.textContent = n; }); } catch (e) {} } }, 3000);
  try { side(); } catch (e) {}

  window.UI9266 = { side: side };
})();
