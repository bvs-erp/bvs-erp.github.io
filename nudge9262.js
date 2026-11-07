(function () {
  'use strict';
  if (window.NUDGE9262) return;
  var last = 0, busy = false;
  var won = function (n) { return n == null ? '–' : Number(n).toLocaleString('ko-KR') + '원'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var say = function (m, k) { if (typeof window.toast === 'function') window.toast(m, k || 'g'); else console.log(m); };
  var KIND = {
    confirm: ['승인하세요', '세금계산서가 발행됐고 금액이 맞습니다. 청구서만 아직 작성중입니다.', '#1F5FD1'],
    link: ['잇고 승인하세요', '세금계산서가 들어왔고 같은 금액의 청구서가 있습니다.', '#1F5FD1'],
    mismatch: ['금액이 맞지 않습니다', '청구서와 세금계산서 금액이 다릅니다. 문서를 먼저 확인해 주십시오.', '#C62828'],
    nodoc: ['청구서 없는 계산서', '이 계산서와 이어질 청구서가 없습니다.', '#8A6D00']
  };

  var css = document.createElement('style');
  css.textContent =
    '#nd9262{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center}' +
    '#nd9262 .bx{background:var(--sf,#fff);color:var(--tx,#111);width:min(640px,95vw);max-height:86vh;overflow:auto;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3)}' +
    '#nd9262 .hd{position:sticky;top:0;background:inherit;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;font-weight:700;font-size:15px;border-bottom:1px solid var(--ln,#ddd)}' +
    '#nd9262 .hd button{border:0;background:none;font-size:20px;cursor:pointer;color:inherit}' +
    '#nd9262 .it{padding:12px 16px;border-bottom:1px solid var(--ln,#eee)}' +
    '#nd9262 .tg{display:inline-block;font-size:12px;font-weight:700;color:#fff;border-radius:4px;padding:2px 7px;margin-right:6px}' +
    '#nd9262 .nm{font-weight:700}#nd9262 .ds{font-size:12.5px;color:var(--tx2,#555);margin:4px 0 8px}' +
    '#nd9262 table{width:100%;border-collapse:collapse;font-size:13px}#nd9262 td{padding:3px 4px}#nd9262 td.r{text-align:right;font-variant-numeric:tabular-nums}' +
    '#nd9262 .df{color:#C62828;font-weight:700}' +
    '#nd9262 .bt{display:flex;gap:6px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap}' +
    '#nd9262 .bt button{padding:7px 12px;border-radius:6px;border:1px solid var(--ln,#ccc);background:var(--sf,#fff);color:inherit;cursor:pointer;font-size:13px}' +
    '#nd9262 .bt button.p{background:#1F5FD1;border-color:#1F5FD1;color:#fff;font-weight:700}';
  document.head.appendChild(css);

  function close() { var m = document.getElementById('nd9262'); if (m) m.remove(); }

  function keyRow(it) {
    var over = it.left != null && it.left < 0, err = !!it.error;
    var tag = err ? '조회 멈춤' : over ? '만료됨' : '만료 ' + (it.left === 0 ? '오늘' : it.left + '일 전');
    return '<div class="it" data-key="K:' + esc(it.key) + '">' +
      '<div><span class="tg" style="background:' + (err || over ? '#C62828' : '#8A6D00') + '">' + tag + '</span><span class="nm">' + esc(it.name) + '</span></div>' +
      '<div class="ds">만료일 ' + esc(it.due) + (err ? ' · <span class="df">' + esc(it.error) + '</span>' : '') + '</div>' +
      '<table><tr><td>갱신하는 곳</td><td>' + esc(it.where || '') + '</td></tr><tr><td>Supabase Secrets</td><td>' + esc(it.secrets || '') + '</td></tr></table>' +
      '<div class="bt"><button class="p" data-a="renewed">새 키 넣고 갱신했음</button></div></div>';
  }

  function costRow(it) {
    var up = (+it.keep_after || 0) - (+it.keep_before || 0), L = Array.isArray(it.lines) ? it.lines : [];
    return '<div class="it" data-key="C:' + esc(it.doc_no) + '">' +
      '<div><span class="tg" style="background:#1F5FD1">원가 변경 승인</span><span class="nm">' + esc(it.doc_no) + ' ' + esc(it.partner || '') + '</span></div>' +
      '<div class="ds">' + esc(it.title || '') + ' — 매입처 ' + esc(it.vendor || '') + ' 견적(' + esc(it.pq || '') + ')이 바뀌었습니다. 승인하면 이 판매견적 원가를 바꿉니다(판매가는 그대로).</div>' +
      '<table>' + L.slice(0, 12).map(function (x) { return '<tr><td>' + esc(x.name || x.item_code || '') + ' <span class="tiny" style="color:#888">×' + esc(+x.qty) + '</span></td><td class="r">' + won(x.old_unit) + ' → <b>' + won(x.new_unit) + '</b></td></tr>'; }).join('') +
      (L.length > 12 ? '<tr><td colspan="2" class="r">외 ' + (L.length - 12) + '줄</td></tr>' : '') +
      '<tr><td><b>원가 합</b></td><td class="r">' + won(it.mat_before) + ' → <b>' + won(it.mat_after) + '</b></td></tr>' +
      '<tr><td>남는 몫(판매가 ' + won(it.S) + ')</td><td class="r">' + won(it.keep_before) + ' → <b>' + won(it.keep_after) + '</b>' + (it.keepPct_after != null ? ' (원가의 ' + esc(it.keepPct_after) + '%)' : '') +
      (up ? ' <span class="' + (up < 0 ? 'df' : '') + '">' + (up > 0 ? '+' : '') + won(up) + '</span>' : '') + '</td></tr></table>' +
      '<div class="bt"><button data-a="qopen">견적 열기</button><button data-a="ckeep">그대로 두기</button><button class="p" data-a="capprove">승인</button></div></div>';
  }

  function row(it) {
    if (it.kind === 'apikey') return keyRow(it);
    if (it.kind === 'costchg') return costRow(it);
    var k = KIND[it.kind] || KIND.nodoc;
    var h = '<div class="it" data-key="' + esc(it.key) + '">' +
      '<div><span class="tg" style="background:' + k[2] + '">' + k[0] + '</span><span class="nm">' + esc(it.partner || '') + '</span></div>' +
      '<div class="ds">' + k[1] + '</div><table>' +
      '<tr><td>청구서 ' + esc(it.doc_no || '없음') + (it.doc_date ? ' · ' + esc(it.doc_date) : '') + '</td><td class="r">공급가액 ' + won(it.doc_supply) + '</td><td class="r">세액 ' + won(it.doc_tax) + '</td><td class="r">합계 ' + won(it.doc_total) + '</td></tr>' +
      '<tr><td>세금계산서 작성일 ' + esc(it.ht_date || '') + '</td><td class="r">공급가액 ' + won(it.ht_supply) + '</td><td class="r">세액 ' + won(it.ht_tax) + '</td><td class="r">합계 ' + won(it.ht_total) + '</td></tr>';
    if (it.kind === 'mismatch' && it.diff != null) h += '<tr><td colspan="4" class="r df">차액(계산서 − 청구서) ' + (it.diff > 0 ? '+' : '') + won(it.diff) + '</td></tr>';
    h += '</table><div class="bt">';
    if (it.doc_no) h += '<button data-a="open">청구서 열기</button>';
    h += '<button data-a="later">나중에(7일)</button>';
    if (it.kind === 'confirm') h += '<button class="p" data-a="confirm">승인</button>';
    if (it.kind === 'link') h += '<button class="p" data-a="link">잇고 승인</button>';
    if (it.kind === 'nodoc') h += '<button data-a="make">계산서 문서 만들기</button>';
    return h + '</div></div>';
  }

  async function act(it, a, el) {
    var r;
    if (a === 'qopen') { close(); if (typeof window.qtOpen === 'function') window.qtOpen(it.doc_no); else if (typeof window.openDoc === 'function') window.openDoc(it.doc_no); return; }
    if (a === 'open') { close(); if (typeof window.openDoc === 'function') window.openDoc(it.doc_no); return; }
    el.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    try {
      if (a === 'capprove' || a === 'ckeep') r = await window.sb.rpc('ceo_quote_cost_decide', { p_doc_no: it.doc_no, p_ok: a === 'capprove' });
      else if (a === 'renewed') r = await window.sb.rpc('ceo_api_key_renewed', { p_key: it.key });
      else if (a === 'later') r = await window.sb.rpc('ceo_invoice_nudge_later', { p_key: it.key, p_days: 7 });
      else if (a === 'confirm') r = await window.sb.rpc('ceo_invoice_confirm', { p_doc_no: it.doc_no });
      else if (a === 'link') r = await window.sb.rpc('ceo_invoice_confirm', { p_doc_no: it.doc_no, p_approval_no: it.approval_no });
      else if (a === 'make') r = await window.sb.rpc('ceo_hometax_make_doc', { p_approval_no: it.approval_no });
      var d = (r && r.data) || {};
      if (r.error || d.ok === false) {
        var msg = (r.error && r.error.message) || d.error || '실패';
        if (d.mismatch) msg = '금액이 맞지 않습니다 — 차액 ' + won(d.diff);
        say(msg, 'e');
        el.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
        return;
      }
      say(a === 'capprove' ? it.doc_no + ' 원가 바꿨습니다 — 남는 몫 ' + won(it.keep_after) : a === 'ckeep' ? '원가를 그대로 두었습니다' : a === 'renewed' ? '갱신 기록했습니다 — 다음 만료 ' + (d.next_due || '') : a === 'later' ? '7일 뒤에 다시 알려 드립니다' : a === 'make' ? '계산서 문서를 만들었습니다 ' + (d.doc_no || '') : '청구서 ' + it.doc_no + ' 승인했습니다', 'g');
      el.remove();
      if (a !== 'later' && a !== 'ckeep' && typeof window.loadAll === 'function') { try { window.loadAll(); } catch (e) {} }
      var m = document.getElementById('nd9262'); if (m && !m.querySelector('.it')) close();
    } catch (e) {
      say('실패: ' + e.message, 'e');
      el.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
    }
  }

  function show(items) {
    close();
    var m = document.createElement('div'); m.id = 'nd9262';
    var nC = items.filter(function (x) { return x.kind === 'confirm' || x.kind === 'link'; }).length;
    var nM = items.filter(function (x) { return x.kind === 'mismatch'; }).length;
    var nK = items.filter(function (x) { return x.kind === 'apikey'; }).length, nQ = items.filter(function (x) { return x.kind === 'costchg'; }).length, nI = items.length - nK - nQ;
    var t = [nK ? '키 만료 ' + nK + '건' : '', nQ ? '원가 변경 승인 ' + nQ + '건' : '', nI ? '세금계산서 확인 ' + nI + '건' + (nC ? ' · 승인 ' + nC : '') + (nM ? ' · 금액 다름 ' + nM : '') : ''].filter(Boolean).join(' / ');
    m.innerHTML = '<div class="bx"><div class="hd"><span>' + t + '</span><button type="button" aria-label="닫기">×</button></div>' + items.map(row).join('') + '</div>';
    document.body.appendChild(m);
    m.querySelector('.hd button').onclick = close;
    m.addEventListener('mousedown', function (e) { if (e.target === m) close(); });
    m.querySelectorAll('.it').forEach(function (el, i) {
      el.querySelectorAll('button[data-a]').forEach(function (b) { b.onclick = function () { act(items[i], b.getAttribute('data-a'), el); }; });
    });
  }

  async function check(force) {
    if (busy || document.getElementById('nd9262')) return;
    if (!window.sb || typeof window.isOwner !== 'function' || !window.isOwner()) return;
    if (!force && Date.now() - last < 10 * 60 * 1000) return;
    busy = true; last = Date.now();
    try {
      var res = await Promise.all([window.sb.rpc('ceo_api_alerts'), window.sb.rpc('ceo_invoice_nudges'), window.sb.rpc('ceo_quote_cost_alerts')]);
      var all = [];
      res.forEach(function (r, i) {
        var d = (r && r.data) || {};
        if (!r.error && d.ok && Array.isArray(d.items)) d.items.forEach(function (x) { if (i === 0) x.kind = 'apikey'; if (i === 2) x.kind = 'costchg'; all.push(x); });
      });
      if (all.length) show(all);
    } catch (e) { console.warn('nudge9262', e); }
    finally { busy = false; }
  }

  var n = 0, t = setInterval(function () {
    if (typeof window.isOwner === 'function' && window.ME) { clearInterval(t); setTimeout(function () { check(true); }, 1500); }
    else if (++n > 240) clearInterval(t);
  }, 500);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(false); });

  window.NUDGE9262 = { check: check, close: close };
})();
