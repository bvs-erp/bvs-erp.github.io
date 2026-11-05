/**
 * ═══════════════════════════════════════════════════════════════════════════
 * qt9240.js — 「견적 엑셀표」 v1.4 (Claude 작성 · 2026-11-05)
 * v1.1: 위쪽에 매출처 고르기(검색 + 목록) — 저장할 때 같이 저장 (ceo_quote_sheet_save partner_id)
 * v1.4: 일반관리비·기업이윤 줄은 줄이 바뀔 때마다 자동 다시 계산(규격 「제조원가의 7%」의 %를 고치면 그 %로, 금액을 직접 치면 % 를 거꾸로 계산해 규격에 적음)
 * v1.3: 메일 서랍 「빈 견적서 만들기」(ceo_quote_from_mail) + 「원가 계산」 칸(재료비·공수·공장 사용 일수·기타 경비·일반관리비·이윤 → 제안 견적가, ceo_cost_basis·ceo_quote_cost_save)
 * v1.2: 트리 인쇄 표를 xl9193 v9.235 prTidy9235로 정리(세액 칸 뺌 · 도번 따로 칸 · 줄마다 한 줄 · 한 장 맞춤)
 * 설계: 261105_BVS_견적엑셀표_BOM트리_매입업체비교_설계_v1.0.md / DB1192(#1474)
 * 대표 지시: 고객 BOM → 우리 견적(엄마-자녀 트리) → 매입업체 여러 곳 비교. 엑셀처럼.
 *  - 왼쪽: 판매 견적 트리(도번·품명·규격·수량·단위·매입가·가산%·판매단가·금액·이익·하위 단가 보이기·비고)
 *  - 오른쪽: 연결된 매입견적 업체마다 한 칸, 줄마다 최저가 굵게, 눌러서 고르기(처음엔 최저가 자동)
 *  - 저장: public.ceo_quote_sheet_save / 불러오기: public.ceo_quote_sheet_load (대표 전용)
 *  - 인쇄: 줄에 parent_no가 있으면 트리 모양(1 → 1-1 → 1-1-1), 단가 안 보이는 줄은 값 칸 비움
 * erp.html에 덧씌우지 않는 별도 파일. erp.html은 이 파일을 xl9193.js 다음에 불러오기만.
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';
  if (window.QT9240_APPLIED) return;

  var won = function (v) { v = Math.round(+v || 0); return v.toLocaleString('ko-KR'); };
  var num = function (v) { v = +v || 0; return Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v).toLocaleString('ko-KR') : String(Math.round(v * 1000) / 1000); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (s) { return String(s || '').replace(/\s/g, '').toUpperCase(); };
  var say = function (m, t) { if (typeof toast === 'function') toast(m, t || ''); else console.log('[qt9240]', m); };
  var parseNum = function (s) { if (s == null) return null; s = String(s).replace(/[,\s원₩]/g, ''); if (s === '') return null; var v = +s; return isFinite(v) ? v : null; };

  var QT = {
    doc: null, rows: [], vendors: [], sel: { r: 0, c: 'price' }, dirty: false, seq: 1, rounding: 100, busy: false,

    /* ── 열기 ── */
    open: async function (docNo) {
      if (typeof isOwner === 'function' && !isOwner()) { say('대표 전용입니다', 'e'); return; }
      if (!docNo) { say('견적서 번호가 없습니다', 'e'); return; }
      QT.ensureUi();
      try { QT.el('qt_ptnq').value = ''; } catch (x) {}
      if (!QT.doc || QT.doc.doc_no !== docNo) { QT.cc = null; try { QT.el('qt_cost').style.display = 'none'; } catch (x) {} }
      QT.el('qt_body').innerHTML = '<tr><td colspan="20" style="padding:40px;text-align:center;color:#64748b">불러오는 중…</td></tr>';
      QT.el('qt9240').style.display = 'flex';
      try { if ((!window.D || !Array.isArray(D.ptn) || !D.ptn.length) && typeof lzFetch === 'function') await lzFetch(['ptn'], false); } catch (x) {}
      var r = await sb.rpc('ceo_quote_sheet_load', { p_doc: docNo });
      if (r.error || !r.data || !r.data.ok) { say((r.error && r.error.message) || (r.data && r.data.error) || '불러오기 실패', 'e'); QT.close(true); return; }
      QT.fromLoad(r.data);
      QT.render();
    },
    close: function (force) {
      if (!force && QT.dirty && !window.confirm('저장하지 않은 고친 내용이 있습니다. 닫을까요?')) return;
      var o = QT.el('qt9240'); if (o) o.style.display = 'none';
      QT.dirty = false;
    },
    el: function (id) { return document.getElementById(id); },

    /* ── 불러온 값 → 화면 줄 ── */
    fromLoad: function (data) {
      QT.doc = data.doc || {};
      QT.vendors = (data.vendors || []).map(function (v) {
        return { pq: v.pq_doc, name: v.name || v.pq_doc, cat: v.category || '', lines: (v.lines || []).map(function (l) {
          return { ln: l.line_no, code: l.item_code, name: l.item_name, spec: l.spec, qty: +l.qty || 0, unit: l.unit, price: +l.unit_price || 0, kc: norm(l.item_code), kn: norm(l.item_name) };
        }) };
      });
      var byLn = {};
      QT.rows = (data.lines || []).map(function (l) {
        var r = { k: 'r' + (QT.seq++), ln: l.line_no, parLn: l.parent_no, par: null, code: l.item_code || '', name: l.item_name || '', spec: l.spec || '', qty: +l.qty || 0, unit: l.unit || '',
          price: +l.unit_price || 0, cu: l.cost_unit == null ? null : +l.cost_unit, cm: !!l.cost_manual, src: l.cost_src || '', vendor: l.vendor_name || '', show: l.show_price !== false,
          mk: l.markup_pct == null ? null : +l.markup_pct, memo: l.memo || '', childShow: false };
        byLn[l.line_no] = r; return r;
      });
      QT.rows.forEach(function (r) { if (r.parLn != null && byLn[r.parLn]) r.par = byLn[r.parLn].k; });
      /* 하위 단가 보이기 = 자녀 중 하나라도 단가 보임 */
      QT.rows.forEach(function (r) { var ch = QT.kids(r.k); r.childShow = ch.some(function (c) { return c.show; }); });
      /* 매입가 없는 줄은 업체 최저가로 자동(대표 결정: 최저가 자동 + 대표 변경) */
      var auto = 0;
      QT.rows.forEach(function (r) { if (r.cu == null && !QT.kids(r.k).length) { var b = QT.best(r); if (b) { QT.pick(r, b, true); auto++; } } });
      QT.dirty = auto > 0; /* 최저가 자동으로 고른 줄이 있으면 저장해야 반영 */
      if (auto) setTimeout(function () { say('업체 최저가로 매입가 ' + auto + '줄 자동으로 골랐습니다 — 저장하면 반영'); }, 300);
    },

    /* ── 트리 도우미 ── */
    idx: function (k) { for (var i = 0; i < QT.rows.length; i++) if (QT.rows[i].k === k) return i; return -1; },
    get: function (k) { var i = QT.idx(k); return i >= 0 ? QT.rows[i] : null; },
    kids: function (k) { return QT.rows.filter(function (r) { return r.par === k; }); },
    level: function (r) { var n = 0, p = r.par; while (p) { n++; var pr = QT.get(p); p = pr ? pr.par : null; if (n > 30) break; } return n; },
    subEnd: function (i) { /* i번 줄 아래 자손이 끝나는 위치(포함) */
      var lv = QT.level(QT.rows[i]), j = i + 1;
      while (j < QT.rows.length && QT.level(QT.rows[j]) > lv) j++;
      return j - 1;
    },
    eff: function (r) { if (!r.par) return true; var p = QT.get(r.par); return p ? (QT.eff(p) && p.childShow) : true; },
    hasShownChild: function (r) { return QT.eff(r) && r.childShow && QT.kids(r.k).length > 0; },
    counted: function (r) { return QT.eff(r) && !QT.hasShownChild(r); },
    desc: function (r) { var i = QT.idx(r.k), e = QT.subEnd(i); return QT.rows.slice(i + 1, e + 1); },
    intr: function (r) { return (r.cu != null && +r.cu !== 0) ? Math.round(r.cu * r.qty) : null; },
    blocked: function (r) { var p = r.par; while (p) { var a = QT.get(p); if (!a) break; if (a.cm && QT.intr(a) != null) return true; p = a.par; } return false; },
    isLeaf: function (r) { if (QT.intr(r) == null || QT.blocked(r)) return false; if (r.cm) return true; return !QT.desc(r).some(function (d) { return QT.intr(d) != null; }); },
    cost: function (r) { var s = 0, any = false; [r].concat(QT.desc(r)).forEach(function (d) { if (QT.isLeaf(d)) { s += QT.intr(d); any = true; } }); return any ? s : null; },
    amount: function (r) {
      if (QT.counted(r)) return Math.round((+r.qty || 0) * (+r.price || 0));
      if (QT.hasShownChild(r)) { var s = 0; QT.desc(r).forEach(function (d) { if (QT.counted(d)) s += Math.round((+d.qty || 0) * (+d.price || 0)); }); return s; }
      return null;
    },
    numbering: function () { /* 1, 1-1, 1-1-1 */
      var cnt = {}, out = {};
      QT.rows.forEach(function (r) { var key = r.par || '_'; cnt[key] = (cnt[key] || 0) + 1; out[r.k] = (r.par ? out[r.par] + '-' : '') + cnt[key]; });
      return out;
    },

    /* ── 업체 맞추기 ── */
    matches: function (r) {
      var kc = norm(r.code), kn = norm(r.name), out = [];
      QT.vendors.forEach(function (v) {
        var m = null;
        v.lines.forEach(function (l) { if (!m && kc && l.kc === kc) m = { v: v, l: l, kind: 'same' }; });
        if (!m) v.lines.forEach(function (l) { if (!m && kn && l.kn === kn && Math.abs(l.qty - r.qty) < 1e-9) m = { v: v, l: l, kind: 'similar' }; });
        out.push(m);
      });
      return out;
    },
    best: function (r) { var b = null; QT.matches(r).forEach(function (m) { if (m && m.l.price > 0 && (!b || m.l.price < b.l.price)) b = m; }); return b; },
    pick: function (r, m, quiet) {
      r.cu = m.l.price; r.src = m.v.pq; r.vendor = m.v.name; r.cm = QT.kids(r.k).length > 0; /* 부모 줄을 업체가 통으로 견적 냈으면 그 값 우선 */
      if (!quiet) { QT.dirty = true; QT.render(); }
    },
    allBest: function () { var n = 0; QT.rows.forEach(function (r) { if (QT.kids(r.k).length) return; var b = QT.best(r); if (b) { QT.pick(r, b, true); n++; } }); QT.dirty = true; QT.render(); say('최저가로 ' + n + '줄 고름'); },
    vendorOnly: function () {
      var used = {};
      QT.rows.forEach(function (r) { QT.matches(r).forEach(function (m) { if (m) used[m.v.pq + '|' + m.l.ln] = 1; }); });
      var out = [];
      QT.vendors.forEach(function (v) { v.lines.forEach(function (l) { if (!used[v.pq + '|' + l.ln]) out.push({ v: v, l: l }); }); });
      return out;
    },

    /* ── 줄 바꾸기 ── */
    indent: function () {
      var i = QT.sel.r; if (i <= 0) return; var r = QT.rows[i], lv = QT.level(r), j = i - 1;
      while (j >= 0 && QT.level(QT.rows[j]) > lv) j--;
      if (j < 0 || QT.level(QT.rows[j]) !== lv) { say('위에 같은 단계 줄이 있어야 그 아래로 넣을 수 있습니다'); return; }
      r.par = QT.rows[j].k; QT.dirty = true; QT.render();
    },
    outdent: function () {
      var i = QT.sel.r, r = QT.rows[i]; if (!r || !r.par) return;
      var p = QT.get(r.par), pi = QT.idx(p.k), pe = QT.subEnd(pi), e = QT.subEnd(i);
      var block = QT.rows.splice(i, e - i + 1);
      pe -= block.length; /* 부모 자손 끝 위치가 앞으로 당겨짐 */
      r.par = p.par;
      Array.prototype.splice.apply(QT.rows, [pe + 1, 0].concat(block));
      QT.sel.r = pe + 1; QT.dirty = true; QT.render();
    },
    addRow: function () {
      var i = QT.sel.r, cur = QT.rows[i], at = cur ? QT.subEnd(i) + 1 : QT.rows.length;
      var r = { k: 'r' + (QT.seq++), par: cur ? cur.par : null, code: '', name: '', spec: '', qty: 1, unit: 'EA', price: 0, cu: null, cm: false, src: '', vendor: '', show: true, mk: null, memo: '', childShow: false };
      QT.rows.splice(at, 0, r); QT.sel = { r: at, c: 'code' }; QT.dirty = true; QT.render();
    },
    delRow: function () {
      var i = QT.sel.r, r = QT.rows[i]; if (!r) return; var e = QT.subEnd(i), n = e - i + 1;
      if (!window.confirm((r.name || r.code || '이 줄') + (n > 1 ? ' 과 그 아래 ' + (n - 1) + '줄' : '') + '을 견적에서 뺄까요? (저장해야 반영)')) return;
      QT.rows.splice(i, n); QT.sel.r = Math.max(0, Math.min(i, QT.rows.length - 1)); QT.dirty = true; QT.render();
    },
    toggleChild: function (k) { var r = QT.get(k); if (!r) return; r.childShow = !r.childShow; QT.dirty = true; QT.render(); },
    allChild: function (on) { QT.rows.forEach(function (r) { if (QT.kids(r.k).length) r.childShow = on; }); QT.dirty = true; QT.render(); },
    roundP: function (v) { var u = +QT.rounding || 1; return Math.floor(v / u) * u; },
    applyMarkup: function () {
      var m = parseNum(QT.el('qt_mk').value); if (m == null) { say('가산 %를 넣으십시오'); return; }
      var n = 0; QT.rows.forEach(function (r) { if (!QT.counted(r)) return; var c = QT.cost(r); if (!c || !r.qty) return; r.mk = m; r.price = QT.roundP(c / r.qty * (1 + m / 100)); n++; });
      QT.dirty = true; QT.render(); say('가산 ' + m + '% · ' + n + '줄 단가 넣음');
    },

    /* ── 칸 정의 ── */
    cols: function () {
      return [
        { k: 'no', t: 'No', w: 56, ro: true },
        { k: 'code', t: '도번', w: 130 },
        { k: 'name', t: '품명', w: 220 },
        { k: 'spec', t: '규격', w: 180 },
        { k: 'qty', t: '수량', w: 56, n: true },
        { k: 'unit', t: '단위', w: 44 },
        { k: 'cu', t: '매입가', w: 84, n: true },
        { k: 'mk', t: '가산%', w: 54, n: true },
        { k: 'price', t: '판매단가', w: 90, n: true },
        { k: 'amt', t: '금액', w: 100, n: true, ro: true },
        { k: 'pf', t: '이익', w: 120, n: true, ro: true },
        { k: 'cs', t: '하위 단가', w: 64, ro: true },
        { k: 'memo', t: '비고', w: 140 }
      ];
    },
    editable: function (r, c) {
      if (c.ro) return false;
      if (c.k === 'price' || c.k === 'mk') return QT.counted(r);
      if (c.k === 'cu') return QT.counted(r) || !QT.kids(r.k).length || true;
      return true;
    },

    /* ── 원가 계산 (v1.3) ── */
    cc: null, basis: null,
    costOpen: async function () {
      var box = QT.el('qt_cost'); if (!box) return;
      if (box.style.display !== 'none') { box.style.display = 'none'; return; }
      box.style.display = 'block'; box.innerHTML = '<div style="padding:10px;color:#64748b">기준값 불러오는 중…</div>';
      if (!QT.basis) { var r = await sb.rpc('ceo_cost_basis'); if (r.error || !r.data || !r.data.ok) { box.innerHTML = '<div style="padding:10px;color:#dc2626">' + esc((r.error && r.error.message) || (r.data && r.data.error) || '기준값을 못 불러옴') + '</div>'; return; } QT.basis = r.data; }
      if (!QT.cc) {
        var b = QT.basis, p = b.params || {}, x = (QT.doc && QT.doc.extra && QT.doc.extra.cost_calc) || {};
        QT.cc = { ppl: x.ppl || '', days: x.days || '', md_cost: x.md_cost || b.md_cost || 0, fdays: x.fdays || '', fday_cost: x.fday_cost || b.factory_day_cost || 0,
                  other: x.other || '', admin_pct: x.admin_pct != null ? x.admin_pct : +p.admin_pct, profit_pct: x.profit_pct != null ? x.profit_pct : +p.profit_pct, memo: x.memo || '' };
      }
      QT.costPaint();
    },
    costCalc: function () {
      var c = QT.cc || {}, n = function (v) { return +parseNum(v) || 0; };
      var mat = 0, S = 0; QT.rows.forEach(function (r) { if (r.par) return; var co = QT.cost(r); if (co) mat += co; var a = QT.amount(r); if (a) S += a; });
      var md = n(c.ppl) * n(c.days), labor = Math.round(md * n(c.md_cost)), fexp = Math.round(n(c.fdays) * n(c.fday_cost)), oth = n(c.other);
      var mfg = mat + labor + fexp + oth, adm = Math.round(mfg * n(c.admin_pct) / 100), pro = Math.round(mfg * n(c.profit_pct) / 100);
      var rd = QT.rounding || 100, prop = Math.ceil((mfg + adm + pro) / rd) * rd;
      return { mat: mat, md: md, labor: labor, fexp: fexp, oth: oth, mfg: mfg, adm: adm, pro: pro, prop: prop, S: S, keep: S - mfg, keepPct: mfg ? Math.round((S - mfg) / mfg * 1000) / 10 : null };
    },
    costPaint: function () {
      var box = QT.el('qt_cost'); if (!box || box.style.display === 'none' || !QT.cc) return;
      var c = QT.cc, k = QT.costCalc(), b = QT.basis || {}, bs = b.basis || {}, p = b.params || {};
      var inp = function (key, w, ph) { return '<input class="qtci" data-k="' + key + '" value="' + esc(c[key] == null ? '' : c[key]) + '" style="width:' + (w || 70) + 'px" placeholder="' + (ph || '') + '">'; };
      var row = function (a, b2, cl) { return '<tr' + (cl ? ' class="' + cl + '"' : '') + '><td>' + a + '</td><td class="n">' + b2 + '</td></tr>'; };
      var target = (+c.admin_pct || 0) + (+c.profit_pct || 0);
      box.innerHTML = '<div class="qtcw"><div class="qtcl"><b>원가 계산</b> <span class="qtcs2">인쇄에는 안 나갑니다</span>'
        + '<div class="qtcf">조립 인원 ' + inp('ppl', 46) + '명 × ' + inp('days', 46) + '일 = <b>' + num(k.md) + '공수</b> × 1공수 ' + inp('md_cost', 80) + '원</div>'
        + '<div class="qtcf">공장 사용 ' + inp('fdays', 46) + '일 × 1일 경비 ' + inp('fday_cost', 80) + '원 · 기타 경비(운반·소모품) ' + inp('other', 90) + '원</div>'
        + '<div class="qtcf">일반관리비 ' + inp('admin_pct', 40) + '% · 이윤 ' + inp('profit_pct', 40) + '% · 메모 ' + inp('memo', 180) + '</div>'
        + '<div class="qtcs2">기준: 1공수 ' + won(b.md_cost_auto) + '원(' + esc(bs.from || '') + '~' + esc(bs.to || '') + ' 확정 출역 ' + num(bs.md) + '공수, 4대보험 회사분 ' + num(p.ins_pct) + '%)'
        + ' · 공장 1일 ' + won(b.factory_day_cost) + '원(임대료 공장 몫 ' + num(p.factory_rent_pct) + '% + 전기 ÷ ' + num(p.workdays) + '일)</div>'
        + '<div style="margin-top:6px"><b style="font-size:12px">관리비·이윤 따로 표시</b> <button onclick="QT9240.costCostPrice()">① 매입가를 단가로</button><button onclick="QT9240.costAsmLine()">② 조립비 = 노무비+공장경비+기타</button><button class="p" onclick="QT9240.costOhLines()">③ 일반관리비·기업이윤 줄 넣기</button></div>'
        + '<div style="margin-top:4px"><b style="font-size:12px">단가에 섞기</b> <button onclick="QT9240.costPut(false)">제안가를 선택한 줄에</button><button onclick="QT9240.costPut(true)">제안가를 조립비 줄에</button>'
        + '<button onclick="QT9240.costSaveOnly()">계산만 저장</button><button onclick="QT9240.costDefaults()">관리비·이윤 %·1공수를 기본값으로</button></div></div>'
        + '<div class="qtcr"><table>'
        + row('재료비 (매입가 그대로)', won(k.mat)) + row('노무비 ' + num(k.md) + '공수', won(k.labor)) + row('공장 경비', won(k.fexp)) + row('기타 경비', won(k.oth))
        + row('<b>제조원가</b>', '<b>' + won(k.mfg) + '</b>', 'qtct') + row('일반관리비 ' + num(c.admin_pct) + '%', won(k.adm)) + row('이윤 ' + num(c.profit_pct) + '%', won(k.pro))
        + row('<b>제안 견적가</b>', '<b>' + won(k.prop) + '</b>', 'qtct')
        + row('지금 견적 공급가', won(k.S)) + row('지금 남는 몫', '<b class="' + (k.keepPct != null && k.keepPct < target ? 'neg' : '') + '">' + won(k.keep) + (k.keepPct != null ? ' (원가의 ' + k.keepPct + '%)' : '') + '</b>')
        + '</table></div></div>';
      Array.prototype.forEach.call(box.querySelectorAll('input.qtci'), function (el) {
        el.oninput = function () { var key = this.getAttribute('data-k'); QT.cc[key] = this.value; QT.dirty = true; QT.costPaintSoft(); };
        if (/^(admin_pct|profit_pct)$/.test(el.getAttribute('data-k'))) el.onchange = function () { var key = this.getAttribute('data-k'), v = +parseNum(this.value); if (!isFinite(v)) return; QT.ohSetPct(key === 'admin_pct' ? '일반관리비' : '기업이윤', v); QT.render(); };
      });
    },
    costPaintSoft: function () { /* 입력 중 커서 유지: 표만 다시 */
      var box = QT.el('qt_cost'); if (!box) return; var a = document.activeElement, key = a && a.getAttribute && a.getAttribute('data-k'), pos = a && a.selectionStart;
      QT.costPaint();
      if (key) { var el = box.querySelector('input.qtci[data-k="' + key + '"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) {} } }
    },
    costPut: function (asm) {
      if (!QT.cc) return; if ((QT.doc && QT.doc.status) !== 'draft') { say('확정된 문서는 고칠 수 없습니다', 'e'); return; }
      var r = null;
      if (asm) r = QT.rows.filter(function (x) { return !x.par && /조립/.test(x.name || ''); })[0];
      if (!r) r = QT.rows[QT.sel.r];
      if (!r) { say('넣을 줄을 먼저 고르세요', 'e'); return; }
      if (!QT.counted(r)) { say('그 줄은 단가가 들어가는 줄이 아닙니다(하위 단가 보이는 부모·목록 줄)', 'e'); return; }
      var k = QT.costCalc(), cur = QT.amount(r) || 0, want = k.prop - (k.S - cur), q = +r.qty || 1, rd = QT.rounding || 100;
      r.price = Math.ceil(want / q / rd) * rd; QT.dirty = true; QT.render(); QT.costPaint();
      say((r.name || '줄') + ' 단가 ' + won(r.price) + '원 — 공급가 ' + won(QT.costCalc().S) + '원 (저장해야 들어갑니다)');
    },
    isOh: function (r) { return !r.par && /^(일반관리비|기업이윤|이윤)$/.test(String(r.name || '').trim()); },
    ohDef: function (r) { var nm = String(r.name || '').trim(), c = QT.cc || {}, p = (QT.basis && QT.basis.params) || {}; return nm === '일반관리비' ? (+c.admin_pct || +p.admin_pct || 7) : (+c.profit_pct || +p.profit_pct || 11); },
    ohPct: function (r) { var m = /([\d.]+)\s*%/.exec(String(r.spec || '')); return m ? +m[1] : QT.ohDef(r); },
    ohBase: function () { var b = 0; QT.rows.forEach(function (r) { if (r.par || QT.isOh(r)) return; var a = QT.amount(r); if (a) b += a; }); return b; },
    ohSync: function () {
      var oh = QT.rows.filter(QT.isOh); if (!oh.length) return;
      var base = QT.ohBase(), rd = QT.rounding || 100;
      oh.forEach(function (r) {
        if (r.ohKeep && r.ohBase === base) return;
        r.ohKeep = false; var pct = QT.ohPct(r);
        r.qty = 1; if (!r.unit) r.unit = '식'; r.spec = '제조원가의 ' + pct + '%';
        var np = Math.round(base * pct / 100 / rd) * rd; if (np !== +r.price) { r.price = np; QT.dirty = true; }
      });
    },
    ohSetPct: function (nm, pct) { QT.rows.forEach(function (r) { if (QT.isOh(r) && String(r.name).trim() === nm) { r.spec = '제조원가의 ' + pct + '%'; r.ohKeep = false; } }); },
    costCostPrice: function () {
      if ((QT.doc && QT.doc.status) !== 'draft') { say('확정된 문서는 고칠 수 없습니다', 'e'); return; }
      var n = 0; QT.rows.forEach(function (r) { if (QT.counted(r) && !QT.kids(r.k).length && r.cu != null && +r.cu > 0) { r.price = +r.cu; n++; } });
      QT.dirty = true; QT.render(); say('매입가를 단가로 ' + n + '줄 (저장해야 들어갑니다)');
    },
    costAsmLine: function () {
      if ((QT.doc && QT.doc.status) !== 'draft') { say('확정된 문서는 고칠 수 없습니다', 'e'); return; }
      var k = QT.costCalc(), v = k.labor + k.fexp + k.oth; if (!v) { say('조립 인원·일수·공장 사용 일수를 먼저 넣으세요', 'e'); return; }
      var r = QT.rows.filter(function (x) { return !x.par && /조립/.test(x.name || ''); })[0];
      if (!r) { r = { k: 'n' + (QT.seq++), par: null, code: '', name: '조립비', spec: '', qty: 1, unit: '식', price: 0, cu: null, cm: false, src: '', vendor: '', show: true, mk: null, memo: '', childShow: false }; var at = QT.rows.length; QT.rows.forEach(function (x, i) { if (QT.isOh(x) && i < at) at = i; }); QT.rows.splice(at, 0, r); }
      var q = +r.qty || 1, rd = QT.rounding || 100; r.price = Math.ceil(v / q / rd) * rd; r.cu = null;
      QT.dirty = true; QT.render(); say('조립비 ' + won(r.price * q) + '원 (노무비 ' + won(k.labor) + ' + 공장경비 ' + won(k.fexp) + ' + 기타 ' + won(k.oth) + ')');
    },
    costOhLines: function () {
      if ((QT.doc && QT.doc.status) !== 'draft') { say('확정된 문서는 고칠 수 없습니다', 'e'); return; }
      var c = QT.cc || {}, ap = +parseNum(c.admin_pct) || 0, pp = +parseNum(c.profit_pct) || 0, rd = QT.rounding || 100;
      var base = 0; QT.rows.forEach(function (r) { if (r.par || QT.isOh(r)) return; var a = QT.amount(r); if (a) base += a; });
      var put = function (nm, pct) {
        var r = QT.rows.filter(function (x) { return QT.isOh(x) && String(x.name).trim() === nm; })[0];
        if (!r) { r = { k: 'n' + (QT.seq++), par: null, code: '', name: nm, spec: '', qty: 1, unit: '식', price: 0, cu: null, cm: false, src: '', vendor: '', show: true, mk: null, memo: '', childShow: false }; QT.rows.push(r); }
        r.qty = 1; r.unit = '식'; r.spec = '제조원가의 ' + pct + '%'; r.ohKeep = false; r.price = Math.round(base * pct / 100 / rd) * rd; r.cu = null; return r.price;
      };
      var a = put('일반관리비', ap), b = put('기업이윤', pp);
      QT.dirty = true; QT.render(); say('제조원가 ' + won(base) + ' · 일반관리비 ' + won(a) + ' · 기업이윤 ' + won(b) + ' → 공급가 ' + won(base + a + b) + ' (저장해야 들어갑니다)');
    },
    costPayload: function () { var c = QT.cc || {}, k = QT.costCalc(); var o = {}; ['ppl','days','md_cost','fdays','fday_cost','other','admin_pct','profit_pct','memo'].forEach(function (x) { o[x] = c[x]; }); o.result = k; return o; },
    costSaveOnly: async function () {
      if (!QT.cc || !QT.doc) return;
      var r = await sb.rpc('ceo_quote_cost_save', { p_doc: QT.doc.doc_no, p_calc: QT.costPayload() });
      if (r.error || !r.data || !r.data.ok) { say((r.error && r.error.message) || (r.data && r.data.error) || '저장 실패', 'e'); return; }
      QT.doc.extra = QT.doc.extra || {}; QT.doc.extra.cost_calc = QT.costPayload(); say('원가 계산 저장됨', 'g');
    },
    costDefaults: async function () {
      if (!QT.cc) return; var c = QT.cc, p = { admin_pct: c.admin_pct, profit_pct: c.profit_pct };
      var auto = QT.basis && QT.basis.md_cost_auto; p.md_cost_manual = (+parseNum(c.md_cost) && +parseNum(c.md_cost) !== +auto) ? +parseNum(c.md_cost) : '';
      var r = await sb.rpc('ceo_cost_params_save', { p: p });
      if (r.error || !r.data || !r.data.ok) { say((r.error && r.error.message) || (r.data && r.data.error) || '저장 실패', 'e'); return; }
      QT.basis = r.data; QT.costPaint(); say('기본값 저장됨 — 다음 견적부터 이 값으로 시작', 'g');
    },
    fromMail: async function (mailId) {
      if (!mailId) { say('메일 번호를 찾지 못했습니다', 'e'); return; }
      var r = await sb.rpc('ceo_quote_from_mail', { p_mail_id: +mailId });
      if (r.error || !r.data || !r.data.ok) { say((r.error && r.error.message) || (r.data && r.data.error) || '만들기 실패', 'e'); return; }
      var d = r.data;
      say(d.existed ? '이 메일로 만든 견적 ' + d.doc_no + ' 을 엽니다' : '견적서 초안 ' + d.doc_no + ' 만듦' + (d.partner_name ? ' · 매출처 ' + d.partner_name : ' · 매출처는 위에서 고르세요'), 'g');
      try { if (typeof sd874Quick === 'function') await sd874Quick(); } catch (x) {}
      try { if (typeof drClose === 'function') drClose(); } catch (x) {}
      await QT.open(d.doc_no);
      if (!d.existed) { QT.cc = null; QT.costOpen(); }
    },

    /* ── 매출처 고르기 (v1.1) ── */
    ptnList: function () {
      var L = (window.D && Array.isArray(D.ptn)) ? D.ptn : [];
      return L.filter(function (p) { return p && p.partner_id && p.name && p.is_active !== false; });
    },
    ptnPaint: function (q) {
      var s = QT.el('qt_ptn'); if (!s) return;
      var d = QT.doc || {}, cur = d.partner_id || '';
      var nq = String(q || '').replace(/\s/g, '').toLowerCase();
      var L = QT.ptnList().filter(function (p) { return !nq || String(p.name).replace(/\s/g, '').toLowerCase().indexOf(nq) >= 0 || String(p.partner_id).toLowerCase().indexOf(nq) >= 0 || String(p.biz_no || '').indexOf(nq) >= 0; });
      L.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ko'); });
      if (L.length > 300) L = L.slice(0, 300);
      var seen = {}; L.forEach(function (p) { seen[p.partner_id] = 1; });
      var h = '<option value="">(매출처 고르기)</option>';
      if (cur && !seen[cur]) h += '<option value="' + esc(cur) + '">' + esc(d.partner_name || cur) + '</option>';
      h += L.map(function (p) { return '<option value="' + esc(p.partner_id) + '">' + esc(p.name) + '</option>'; }).join('');
      s.innerHTML = h; s.value = cur;
      if (nq && L.length === 1 && !cur) { s.value = L[0].partner_id; QT.ptnSet(L[0].partner_id); }
      s.disabled = d.status !== 'draft';
      s.style.borderColor = s.value ? '#cbd5e1' : '#dc2626';
    },
    ptnSet: function (v) {
      if (!QT.doc) return;
      var p = QT.ptnList().filter(function (x) { return x.partner_id === v; })[0];
      QT.doc.partner_id = v || null; QT.doc.partner_name = p ? p.name : null; QT.dirty = true;
      var s = QT.el('qt_ptn'); if (s) s.style.borderColor = v ? '#cbd5e1' : '#dc2626';
      say(v ? '매출처: ' + (p ? p.name : v) + ' — 저장을 눌러야 들어갑니다' : '매출처를 비웠습니다 — 저장을 눌러야 반영됩니다');
    },

    /* ── 그리기 ── */
    render: function () {
      try { QT.ohSync(); } catch (x) { console.error('[qt9240-oh]', x); }
      var cols = QT.cols(), no = QT.numbering(), d = QT.doc || {};
      QT.el('qt_title').value = d.title || '';
      QT.ptnPaint((QT.el('qt_ptnq') || {}).value);
      QT.el('qt_info').textContent = (d.doc_date || '') + ' · ' + (d.status === 'draft' ? '초안' : '확정(고칠 수 없음)');
      var vh = QT.vendors.map(function (v) { return '<th class="qtv" title="' + esc(v.pq) + '">' + esc(v.name) + (v.cat ? '<div class="qtc">' + esc(v.cat) + '</div>' : '') + '</th>'; }).join('');
      QT.el('qt_head').innerHTML = '<tr>' + cols.map(function (c) { return '<th style="width:' + c.w + 'px">' + c.t + '</th>'; }).join('') + vh + (QT.vendors.length ? '<th style="width:90px">고른 곳</th>' : '') + '</tr>';
      var S = 0, C = 0;
      var body = QT.rows.map(function (r, i) {
        var lv = QT.level(r), cnt = QT.counted(r), eff = QT.eff(r), sub = QT.hasShownChild(r), hasKids = QT.kids(r.k).length > 0;
        var cost = QT.cost(r), amt = QT.amount(r), cuDisp = cost != null && r.qty ? Math.round(cost / r.qty) : null;
        if (cnt) { S += amt || 0; C += cost || 0; }
        var pf = (amt != null && cost != null && (cnt || sub)) ? amt - cost : null;
        var cls = ['qtr', 'lv' + Math.min(lv, 4), cnt ? 'cnt' : '', sub ? 'sub' : '', !eff ? 'lst' : '', hasKids ? 'par' : ''].join(' ');
        var tds = cols.map(function (c) {
          var v = '', ex = '', ed = QT.editable(r, c);
          if (c.k === 'no') v = no[r.k];
          else if (c.k === 'name') v = '<span style="padding-left:' + (lv * 16) + 'px">' + (lv ? '└ ' : '') + esc(r.name) + '</span>';
          else if (c.k === 'qty') v = num(r.qty);
          else if (c.k === 'cu') { v = cuDisp != null ? won(cuDisp) : ''; if (hasKids && !r.cm && cuDisp != null) ex = ' qtauto'; if (r.cm && hasKids) ex = ' qtman'; }
          else if (c.k === 'mk') { v = (cnt && cuDisp && r.price) ? (Math.round((r.price / cuDisp - 1) * 1000) / 10) : ''; }
          else if (c.k === 'price') { v = cnt ? won(r.price) : (sub && r.qty ? won(Math.round(amt / r.qty)) : '—'); if (!cnt) ex = ' qtauto'; }
          else if (c.k === 'amt') v = amt != null ? won(amt) : '';
          else if (c.k === 'pf') v = pf != null ? won(pf) + (amt ? ' <span class="qtpp">(' + (Math.round(pf / amt * 1000) / 10) + '%)</span>' : '') : '';
          else if (c.k === 'cs') v = hasKids ? '<label class="qtcs"><input type="checkbox" ' + (r.childShow ? 'checked' : '') + ' onclick="QT9240.toggleChild(\'' + r.k + '\')"> 보임</label>' : '';
          else v = esc(r[c.k] == null ? '' : r[c.k]);
          var on = (QT.sel.r === i && QT.sel.c === c.k) ? ' qton' : '';
          return '<td class="' + (c.n ? 'n' : '') + (ed ? ' qted' : ' qtro') + ex + on + '" data-r="' + i + '" data-c="' + c.k + '">' + v + '</td>';
        }).join('');
        var vt = '';
        if (QT.vendors.length) {
          var ms = QT.matches(r), b = QT.best(r);
          vt = ms.map(function (m, vi) {
            if (!m) return '<td class="n qtv0">-</td>';
            var isPick = r.src === m.v.pq && +r.cu === +m.l.price, isB = b && b.v.pq === m.v.pq;
            return '<td class="n qtvp' + (isB ? ' qtbest' : '') + (isPick ? ' qtpick' : '') + (m.kind === 'similar' ? ' qtsim' : '') + '" title="' + (m.kind === 'similar' ? '도번이 다름 — 품명·수량이 같아서 맞춤' : '도번 같음') + ' · 눌러서 고르기" onclick="QT9240.pickAt(' + i + ',' + vi + ')">' + won(m.l.price) + '</td>';
          }).join('') + '<td class="qtsrc">' + esc(r.vendor || '') + '</td>';
        }
        return '<tr class="' + cls + '">' + tds + vt + '</tr>';
      }).join('');
      QT.el('qt_body').innerHTML = body || '<tr><td colspan="20" style="padding:30px;text-align:center;color:#64748b">줄이 없습니다 — 「줄 추가」</td></tr>';
      var T = Math.round(S * 0.1);
      QT.el('qt_sum').innerHTML = '공급가 <b>' + won(S) + '</b> · 세액 ' + won(T) + ' · 합계 <b>' + won(S + T) + '</b>'
        + ' <span class="qtsep">|</span> 매입 ' + won(C) + ' · 이익 <b class="' + (S - C < 0 ? 'neg' : '') + '">' + won(S - C) + '</b>' + (S ? ' (판매가 대비 ' + (Math.round((S - C) / S * 1000) / 10) + '%)' : '')
        + (QT.dirty ? ' <span class="qtdirty">저장 안 됨</span>' : '');
      var vo = QT.vendorOnly();
      QT.el('qt_vo').innerHTML = vo.length ? '<b>BOM에 없는 업체 줄 ' + vo.length + '개</b> — ' + vo.map(function (x, n) {
        return '<span class="qtvo">' + esc(x.v.name) + ': ' + esc(x.l.name || x.l.code) + ' ' + num(x.l.qty) + (x.l.unit ? esc(x.l.unit) : '') + ' × ' + won(x.l.price) + ' <a href="javascript:void 0" onclick="QT9240.addVendorOnly(' + n + ')">줄로 넣기</a></span>';
      }).join(' ') : '';
      QT._vo = vo;
      try { QT.costPaint(); } catch (x) {}
      var ro = (QT.doc && QT.doc.status) !== 'draft';
      QT.el('qt_save').disabled = ro; QT.el('qt_save').title = ro ? '확정된 문서는 고칠 수 없습니다' : '';
    },
    pickAt: function (i, vi) { var r = QT.rows[i]; var m = QT.matches(r)[vi]; if (m) QT.pick(r, m); },
    addVendorOnly: function (n) {
      var x = (QT._vo || [])[n]; if (!x) return;
      QT.rows.push({ k: 'r' + (QT.seq++), par: null, code: x.l.code || '', name: x.l.name || '', spec: x.l.spec || '', qty: x.l.qty || 1, unit: x.l.unit || 'EA', price: 0, cu: x.l.price, cm: false, src: x.v.pq, vendor: x.v.name, show: true, mk: null, memo: '업체 견적에만 있음', childShow: false });
      QT.dirty = true; QT.render();
    },

    /* ── 칸 고치기 ── */
    setCell: function (i, ck, val) {
      var r = QT.rows[i]; if (!r) return;
      if (ck === 'qty') { var q = parseNum(val); if (q == null) return; r.qty = q; }
      else if (ck === 'cu') { var c = parseNum(val); r.cu = c; r.cm = QT.kids(r.k).length > 0 && c != null; r.src = ''; r.vendor = c == null ? '' : r.vendor; }
      else if (ck === 'price') { var p = parseNum(val); r.price = p || 0;
        if (QT.isOh(r)) { var bb = QT.ohBase(); if (bb > 0) { r.spec = '제조원가의 ' + (Math.round(r.price / bb * 10000) / 100) + '%'; r.ohKeep = true; r.ohBase = bb; r.qty = 1; } } }
      else if (ck === 'spec' && QT.isOh(r)) { var pm = /([\d.]+)/.exec(String(val || '')); if (pm) { r.spec = '제조원가의 ' + (+pm[1]) + '%'; r.ohKeep = false; } else r.spec = String(val || ''); }
      else if (ck === 'mk') { var m = parseNum(val); r.mk = m; var co = QT.cost(r); if (m != null && co && r.qty) r.price = QT.roundP(co / r.qty * (1 + m / 100)); }
      else if (ck === 'code' || ck === 'name' || ck === 'spec' || ck === 'unit' || ck === 'memo') r[ck] = String(val == null ? '' : val);
      else return;
      QT.dirty = true;
    },
    startEdit: function (td, first) {
      var i = +td.getAttribute('data-r'), ck = td.getAttribute('data-c'), r = QT.rows[i], c = QT.cols().filter(function (x) { return x.k === ck; })[0];
      if (!r || !c || !QT.editable(r, c)) return;
      var cur = ck === 'cu' ? (r.cu == null ? (QT.cost(r) != null && r.qty ? Math.round(QT.cost(r) / r.qty) : '') : r.cu) : ck === 'mk' ? (r.mk == null ? '' : r.mk) : (r[ck] == null ? '' : r[ck]);
      var inp = document.createElement('input');
      inp.value = first != null ? first : cur; inp.className = 'qtin'; td.innerHTML = ''; td.appendChild(inp); inp.focus();
      if (first == null) inp.select();
      var done = false, fin = function (save, move) {
        if (done) return; done = true;
        if (save) QT.setCell(i, ck, inp.value);
        QT.render(); if (move) QT.move(move);
        QT.el('qt_grid').focus();
      };
      inp.onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); fin(true, e.shiftKey ? 'up' : 'down'); }
        else if (e.key === 'Tab') { e.preventDefault(); fin(true, e.shiftKey ? 'left' : 'right'); }
        else if (e.key === 'Escape') { e.preventDefault(); fin(false); }
        e.stopPropagation();
      };
      inp.onblur = function () { fin(true); };
    },
    move: function (dir) {
      var cols = QT.cols().map(function (c) { return c.k; }), ci = cols.indexOf(QT.sel.c);
      if (dir === 'up') QT.sel.r = Math.max(0, QT.sel.r - 1);
      if (dir === 'down') QT.sel.r = Math.min(QT.rows.length - 1, QT.sel.r + 1);
      if (dir === 'left') QT.sel.c = cols[Math.max(1, ci - 1)];
      if (dir === 'right') QT.sel.c = cols[Math.min(cols.length - 1, ci + 1)];
      QT.render();
      var td = QT.el('qt_body').querySelector('td.qton'); if (td && td.scrollIntoView) td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    },
    onKey: function (e) {
      if (QT.el('qt9240').style.display === 'none') return;
      if (e.target && e.target.tagName === 'INPUT' && e.target.className !== 'qtin' && e.target.id !== 'qt_grid') return;
      var k = e.key;
      if (k === 'ArrowUp') { e.preventDefault(); QT.move('up'); }
      else if (k === 'ArrowDown') { e.preventDefault(); QT.move('down'); }
      else if (k === 'ArrowLeft') { e.preventDefault(); QT.move('left'); }
      else if (k === 'ArrowRight' || (k === 'Tab' && !e.shiftKey)) { e.preventDefault(); if (k === 'Tab' && e.altKey) return; QT.move('right'); }
      else if (k === 'Tab' && e.shiftKey) { e.preventDefault(); QT.move('left'); }
      else if (k === 'Enter' || k === 'F2') { e.preventDefault(); var td = QT.el('qt_body').querySelector('td.qton'); if (td) QT.startEdit(td); }
      else if (k === 'Delete') { e.preventDefault(); QT.setCell(QT.sel.r, QT.sel.c, ''); QT.render(); }
      else if ((e.ctrlKey || e.metaKey) && k === ']') { e.preventDefault(); QT.indent(); }
      else if ((e.ctrlKey || e.metaKey) && k === '[') { e.preventDefault(); QT.outdent(); }
      else if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'S')) { e.preventDefault(); QT.save(); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { var td2 = QT.el('qt_body').querySelector('td.qton'); if (td2) { e.preventDefault(); QT.startEdit(td2, k); } }
    },
    onPaste: function (e) {
      if (QT.el('qt9240').style.display === 'none') return;
      if (e.target && e.target.className === 'qtin') return;
      var t = (e.clipboardData || window.clipboardData).getData('text'); if (!t) return;
      e.preventDefault();
      var lines = t.replace(/\r/g, '').split('\n'); if (lines[lines.length - 1] === '') lines.pop();
      var cols = QT.cols().map(function (c) { return c.k; }), c0 = cols.indexOf(QT.sel.c), n = 0;
      lines.forEach(function (ln, di) {
        var ri = QT.sel.r + di; if (ri >= QT.rows.length) return;
        ln.split('\t').forEach(function (v, dj) { var ck = cols[c0 + dj]; if (!ck) return; var c = QT.cols()[c0 + dj]; if (QT.editable(QT.rows[ri], c)) { QT.setCell(ri, ck, v); n++; } });
      });
      QT.render(); say('붙여넣기 ' + n + '칸');
    },

    /* ── 저장 ── */
    save: async function () {
      if (QT.busy) return;
      if ((QT.doc && QT.doc.status) !== 'draft') { say('확정된 문서는 고칠 수 없습니다', 'e'); return; }
      var pos = {}; QT.rows.forEach(function (r, i) { pos[r.k] = i + 1; });
      var bad = QT.rows.some(function (r, i) { return r.par && !(pos[r.par] < i + 1); });
      if (bad) { say('줄 연결이 꼬였습니다 — 부모 줄이 아래에 있습니다', 'e'); return; }
      var lines = QT.rows.map(function (r) {
        var p = r.par ? QT.get(r.par) : null;
        return { parent: r.par ? pos[r.par] : null, item_code: r.code, item_name: r.name, spec: r.spec, qty: r.qty, unit: r.unit,
          unit_price: QT.counted(r) ? r.price : 0, cost_unit: (QT.kids(r.k).length && !r.cm) ? null : r.cu, cost_manual: !!(r.cm && QT.kids(r.k).length),
          cost_src: r.src || null, vendor_name: r.vendor || null, show_price: p ? !!p.childShow : true, markup_pct: r.mk, memo: r.memo };
      });
      QT.busy = true; QT.el('qt_save').textContent = '저장 중…';
      try {
        var res = await sb.rpc('ceo_quote_sheet_save', { p: { doc_no: QT.doc.doc_no, title: QT.el('qt_title').value, partner_id: QT.doc.partner_id || '', lines: lines } });
        if (res.error || !res.data || !res.data.ok) { say((res.error && res.error.message) || (res.data && res.data.error) || '저장 실패', 'e'); return; }
        say('저장됨 · 공급가 ' + won(res.data.supply) + ' · 매입 ' + won(res.data.cost), 'g');
        if (QT.cc) { try { await sb.rpc('ceo_quote_cost_save', { p_doc: QT.doc.doc_no, p_calc: QT.costPayload() }); } catch (x) {} }
        try { var d = (window.D && D.sd || []).filter(function (x) { return x.doc_no === QT.doc.doc_no; })[0]; if (d) { delete d._lines; d.supply_amt = res.data.supply; d.tax_amt = res.data.tax; } } catch (x) {}
        QT.dirty = false;
        await QT.open(QT.doc.doc_no);
      } finally { QT.busy = false; var b = QT.el('qt_save'); if (b) b.textContent = '저장 (Ctrl+S)'; }
    },
    print: async function () {
      if (QT.dirty && !window.confirm('저장하지 않은 고친 내용은 인쇄에 안 나옵니다. 그래도 볼까요?')) return;
      if (typeof printDoc !== 'function') { say('인쇄 기능을 찾지 못했습니다', 'e'); return; }
      try { if (typeof sd874Quick === 'function') await sd874Quick(QT.doc.doc_no); } catch (x) {}
      try { var d = (window.D && D.sd || []).filter(function (x) { return x.doc_no === QT.doc.doc_no; })[0]; if (d) delete d._lines; } catch (x) {}
      QT.el('qt9240').style.display = 'none';
      await printDoc(QT.doc.doc_no);
      var pr = document.getElementById('pr'), back = function () { if (pr && !pr.classList.contains('on')) { QT.el('qt9240').style.display = 'flex'; clearInterval(iv); } };
      var iv = setInterval(back, 500);
    },

    /* ── 화면 틀 ── */
    ensureUi: function () {
      if (QT.el('qt9240')) return;
      var st = document.createElement('style'); st.id = 'qt9240css';
      st.textContent = [
        '#qt9240{position:fixed;inset:0;z-index:8000;background:#f8fafc;display:none;flex-direction:column;font-family:\'Noto Sans KR\',\'Malgun Gothic\',sans-serif;font-size:12.5px;color:#0f172a}',
        '#qt9240 .qtbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 12px;background:#fff;border-bottom:1px solid #e2e8f0}',
        '#qt9240 .qtbar button{padding:5px 10px;border:1px solid #cbd5e1;background:#fff;border-radius:5px;cursor:pointer;font-size:12.5px}',
        '#qt9240 .qtbar button.p{background:#1d4ed8;color:#fff;border-color:#1d4ed8;font-weight:700}',
        '#qt9240 .qtbar button:disabled{opacity:.5;cursor:not-allowed}',
        '#qt9240 .qtbar input,#qt9240 .qtbar select{padding:4px 6px;border:1px solid #cbd5e1;border-radius:5px;font-size:12.5px}',
        '#qt9240 #qt_title{width:380px;font-weight:700}',
        '#qt9240 .qtsum{padding:7px 12px;background:#eef2ff;border-bottom:1px solid #c7d2fe;font-size:13px}',
        '#qt9240 .qtsum .neg{color:#b91c1c}#qt9240 .qtsep{color:#94a3b8;margin:0 6px}#qt9240 .qtdirty{color:#b45309;font-weight:700;margin-left:8px}',
        '#qt9240 #qt_grid{flex:1;overflow:auto;outline:none;background:#fff}',
        '#qt9240 table{border-collapse:collapse;min-width:100%}',
        '#qt9240 th{position:sticky;top:0;background:#1e3a8a;color:#fff;font-weight:600;padding:5px 6px;border:1px solid #1e3a8a;z-index:2;white-space:nowrap}',
        '#qt9240 th.qtv{background:#334155;border-color:#334155}#qt9240 .qtc{font-size:10.5px;font-weight:400;opacity:.85}',
        '#qt9240 td{border:1px solid #e2e8f0;padding:3px 6px;white-space:nowrap;height:22px}',
        '#qt9240 td.n{text-align:right;font-variant-numeric:tabular-nums}',
        '#qt9240 td.qtro{background:#fafafa;color:#334155}#qt9240 td.qtauto{color:#64748b;font-style:italic}#qt9240 td.qtman{color:#1d4ed8;font-weight:600}',
        '#qt9240 td.qton{outline:2px solid #2563eb;outline-offset:-2px;background:#eff6ff}',
        '#qt9240 tr.par td{font-weight:600;background:#f8fafc}#qt9240 tr.lst td{color:#475569}#qt9240 tr.sub td{background:#f1f5f9}',
        '#qt9240 td.qtvp{cursor:pointer;color:#334155}#qt9240 td.qtvp:hover{background:#e0e7ff}#qt9240 td.qtbest{font-weight:700;color:#0f172a}',
        '#qt9240 td.qtpick{background:#dcfce7!important;color:#14532d}#qt9240 td.qtsim{background:#fef9c3}#qt9240 td.qtv0{color:#cbd5e1;text-align:center}',
        '#qt9240 td.qtsrc{font-size:11.5px;color:#475569}#qt9240 .qtpp{color:#64748b;font-size:11px}',
        '#qt9240 input.qtin{width:100%;box-sizing:border-box;border:none;outline:none;font:inherit;background:#fff;padding:0}',
        '#qt9240 .qtvo{display:inline-block;margin:2px 10px 2px 0}#qt9240 #qt_vo{padding:6px 12px;background:#fffbeb;border-top:1px solid #fde68a;font-size:12px}#qt9240 #qt_vo:empty{display:none}',
        '#qt9240 #qt_cost{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:8px 12px;font-size:12.5px}#qt9240 .qtcw{display:flex;gap:16px;flex-wrap:wrap}#qt9240 .qtcl{flex:1;min-width:420px}#qt9240 .qtcf{margin:5px 0}#qt9240 .qtcs2{color:#64748b;font-size:11.5px}#qt9240 .qtci{padding:3px 5px;border:1px solid #cbd5e1;border-radius:4px;text-align:right}#qt9240 .qtci[data-k=memo]{text-align:left}#qt9240 #qt_cost button{padding:4px 9px;border:1px solid #cbd5e1;background:#fff;border-radius:5px;cursor:pointer;font-size:12px;margin-right:4px}#qt9240 .qtcr table{border-collapse:collapse;min-width:300px}#qt9240 .qtcr td{padding:2px 8px;border-bottom:1px solid #e2e8f0}#qt9240 .qtcr td.n{text-align:right}#qt9240 .qtcr tr.qtct td{background:#eef2ff}#qt9240 .neg{color:#dc2626}',
        '#qt9240 .qthelp{color:#64748b;font-size:11.5px;margin-left:auto}'
      ].join('\n');
      document.head.appendChild(st);
      var o = document.createElement('div'); o.id = 'qt9240';
      o.innerHTML = [
        '<div class="qtbar">',
        '<b style="font-size:14px;margin-right:6px">견적 엑셀표</b><input id="qt_title" placeholder="건명"><span style="margin-left:6px">매출처</span><input id="qt_ptnq" type="search" placeholder="검색" style="width:90px"><select id="qt_ptn" style="max-width:220px"></select><span id="qt_info" style="color:#64748b"></span>',
        '<span class="qthelp">방향키·Enter·Tab 이동 · 바로 치면 입력 · 엑셀에서 붙여넣기 · Ctrl+] 하위로 · Ctrl+[ 위로 · Ctrl+S 저장</span>',
        '</div>',
        '<div class="qtbar">',
        '<button onclick="QT9240.indent()">하위로 ⇥</button><button onclick="QT9240.outdent()">위로 ⇤</button>',
        '<button onclick="QT9240.addRow()">줄 추가</button><button onclick="QT9240.delRow()">줄 빼기</button>',
        '<span style="margin-left:8px">하위 단가</span><button onclick="QT9240.allChild(false)">모두 숨김</button><button onclick="QT9240.allChild(true)">모두 보임</button>',
        '<span style="margin-left:8px">가산</span><input id="qt_mk" style="width:54px" placeholder="20">%',
        '<select id="qt_rd"><option value="1">원 단위</option><option value="100" selected>100원 절사</option><option value="1000">1,000원 절사</option></select>',
        '<button onclick="QT9240.applyMarkup()">단가 넣기</button>',
        '<button onclick="QT9240.allBest()">업체 전부 최저가</button>',
        '<button onclick="QT9240.costOpen()" style="margin-left:8px;border-color:#1d4ed8;color:#1d4ed8;font-weight:700">원가 계산</button>',
        '<span style="flex:1"></span>',
        '<button onclick="QT9240.print()">인쇄 미리보기</button><button id="qt_save" class="p" onclick="QT9240.save()">저장 (Ctrl+S)</button><button onclick="QT9240.close()">닫기</button>',
        '</div>',
        '<div class="qtsum" id="qt_sum"></div>',
        '<div id="qt_cost" style="display:none"></div>',
        '<div id="qt_grid" tabindex="0"><table><thead id="qt_head"></thead><tbody id="qt_body"></tbody></table></div>',
        '<div id="qt_vo"></div>'
      ].join('');
      document.body.appendChild(o);
      QT.el('qt_rd').onchange = function () { QT.rounding = +this.value || 1; };
      QT.el('qt_title').oninput = function () { if (QT.doc) { QT.doc.title = this.value; QT.dirty = true; } };
      QT.el('qt_ptn').onchange = function () { QT.ptnSet(this.value); };
      QT.el('qt_ptnq').oninput = function () { QT.ptnPaint(this.value); };
      QT.el('qt_body').addEventListener('click', function (e) {
        var td = e.target.closest ? e.target.closest('td[data-r]') : null; if (!td || (e.target.tagName === 'INPUT')) return;
        var i = +td.getAttribute('data-r'), ck = td.getAttribute('data-c');
        if (QT.sel.r === i && QT.sel.c === ck) { QT.startEdit(td); return; }
        QT.sel = { r: i, c: ck }; QT.render(); QT.el('qt_grid').focus();
      });
      QT.el('qt_body').addEventListener('dblclick', function (e) { var td = e.target.closest ? e.target.closest('td[data-r]') : null; if (td) QT.startEdit(td); });
      QT.el('qt_grid').addEventListener('keydown', QT.onKey);
      QT.el('qt_grid').addEventListener('paste', QT.onPaste);
      window.addEventListener('beforeunload', function (e) { if (QT.dirty && QT.el('qt9240').style.display !== 'none') { e.preventDefault(); e.returnValue = ''; } });
    }
  };
  window.QT9240 = QT;
  window.qtOpen = function (no) { return QT.open(no); };

  /* ── 여는 단추: 문서·메일 서랍에 판매견적 번호(-Q)가 보이면 「견적 엑셀표로 열기」 ── */
  var QRX = /\bB\d{8}-Q\d*\b/;
  var injectMail = function () {
    try {
      var dr = document.getElementById('dr'); if (!dr || !dr.classList.contains('on') || dr.querySelector('.qt9240mail')) return;
      var lab = Array.prototype.filter.call(dr.querySelectorAll('*'), function (e) { return e.children.length === 0 && (e.textContent || '').trim() === '메일 번호'; })[0];
      if (!lab || !lab.nextElementSibling) return;
      var mid = parseInt((lab.nextElementSibling.textContent || '').trim(), 10); if (!mid) return;
      var anchor = Array.prototype.filter.call(dr.querySelectorAll('div'), function (e) { return /매입견적 올리기/.test(e.textContent || '') && e.querySelector('button') && e.querySelectorAll('div').length < 6; }).pop();
      var b = document.createElement('div'); b.className = 'qt9240mail';
      b.style.cssText = 'margin:8px 0;padding:10px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px';
      b.innerHTML = '<span><b style="color:#9a3412">빈 견적서 만들기</b><br><span style="color:#475569;font-size:12px">BOM·매입견적 없이 조립비 등 직접 입력 — 매출처·건명은 이 메일로 채우고 견적 엑셀표(원가 계산)로 바로 엽니다</span></span><button class="btn sm p" type="button">빈 견적서 만들기</button>';
      b.querySelector('button').onclick = function () { QT.fromMail(mid); };
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(b, anchor.nextSibling); else (document.getElementById('drB') || dr).appendChild(b);
    } catch (e) { console.error('[qt9240-mail]', e); }
  };
  var inject = function () {
    try { if (typeof isOwner !== 'function' || isOwner()) injectMail(); } catch (x) {}
    try {
      if (typeof isOwner === 'function' && !isOwner()) return;
      var dr = document.getElementById('dr'); if (!dr || !dr.classList.contains('on')) return;
      if (dr.querySelector('.qt9240btn')) return;
      var txt = (dr.textContent || '') + ' ' + Array.prototype.map.call(dr.querySelectorAll('input'), function (x) { return x.value || ''; }).join(' ');
      var m = QRX.exec(txt); if (!m) return;
      var no = m[0], d = (window.D && D.sd || []).filter(function (x) { return x.doc_no === no; })[0];
      if (d && d.trade_side && d.trade_side !== 'sales') return;
      var host = document.getElementById('drB') || dr;
      var b = document.createElement('div'); b.className = 'qt9240btn';
      b.style.cssText = 'margin:8px 0;padding:8px 12px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px';
      b.innerHTML = '<span><b style="color:#1e3a8a">견적 엑셀표</b> <span style="color:#475569;font-size:12px">BOM 트리 · 매입업체 비교 · 엑셀처럼 고치기</span></span><button class="btn sm p" type="button">열기 (' + esc(no) + ')</button>';
      b.querySelector('button').onclick = function () { QT.open(no); };
      host.insertBefore(b, host.firstChild);
    } catch (e) { console.error('[qt9240-btn]', e); }
  };
  var tm = null, kick = function () { clearTimeout(tm); tm = setTimeout(inject, 120); };
  var hookDr = function () { var dr = document.getElementById('dr'); if (!dr) return false; new MutationObserver(kick).observe(dr, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); return true; };
  if (!hookDr()) { var n0 = 0, iv0 = setInterval(function () { if (hookDr() || ++n0 > 120) clearInterval(iv0); }, 500); }

  /* ── 인쇄: 줄에 parent_no가 있으면 트리 모양 ── */
  if (typeof prLines === 'function') {
    var _p = prLines;
    prLines = function (lines, opt) {
      try {
        var L = lines || [];
        if (L.some(function (l) { return l && l.parent_no != null; })) {
          var cols = (opt && opt.cols) || [], byNo = {}, kids = {};
          L.forEach(function (l) { byNo[l.line_no] = l; var p = l.parent_no == null ? '_' : l.parent_no; (kids[p] = kids[p] || []).push(l); });
          var lv = function (l) { var n = 0, p = l.parent_no; while (p != null && byNo[p] && n < 30) { n++; p = byNo[p].parent_no; } return n; };
          var cnt = {}, numb = {};
          L.forEach(function (l) { var p = l.parent_no == null ? '_' : l.parent_no; cnt[p] = (cnt[p] || 0) + 1; numb[l.line_no] = (l.parent_no != null && numb[l.parent_no] ? numb[l.parent_no] + '-' : '') + cnt[p]; });
          var shown = function (l) { return l.show_price !== false; };
          var hasShownKid = function (l) { return (kids[l.line_no] || []).some(shown); };
          var subAmt = function (l) { var s = 0; (kids[l.line_no] || []).forEach(function (c) { if (!shown(c)) return; s += hasShownKid(c) ? subAmt(c) : (+c.supply_amt || 0); }); return s; };
          var isName = function (c) { return c && (c.k === 'item_name' || c.k === 'item_name305' || c.t === '품명' || c.t === '품명 / 품번'); };
          var h = '<table class="lines t9240"><thead><tr>' + cols.map(function (c) { return '<th' + (c && c.w ? ' style="width:' + c.w + '"' : '') + '>' + (c ? c.t : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
          L.forEach(function (l) {
            var d = lv(l), sh = shown(l), sub = sh && hasShownKid(l), sa = sub ? subAmt(l) : null;
            h += '<tr class="' + (d ? 'c9240' : 'p9240') + (sub ? ' s9240' : '') + '">' + cols.map(function (c) {
              if (!c) return '<td></td>';
              var cls = c.cls || '';
              if (c.t === 'No') return '<td class="' + cls + '">' + numb[l.line_no] + '</td>';
              if (isName(c)) return '<td style="padding-left:' + (6 + d * 14) + 'px">' + (d ? '└ ' : '') + esc(l.item_name) + (l.item_code ? ' <span class="k9240">' + esc(l.item_code) + '</span>' : '') + '</td>';
              if (c.t === '규격') return '<td>' + esc(l.spec || '') + '</td>';
              if (c.t === '수량') return '<td class="' + cls + '">' + num(l.qty) + '</td>';
              if (c.t === '단위') return '<td class="' + cls + '">' + esc(l.unit || '') + '</td>';
              if (c.t === '비고') return '<td>' + esc(l.memo || '') + '</td>';
              if (!sh) return '<td class="' + cls + '"></td>';
              if (c.t === '단가') return '<td class="' + cls + '">' + (sub ? (l.qty ? won(Math.round(sa / l.qty)) : '') : won(l.unit_price)) + '</td>';
              if (c.t === '공급가액' || c.t === '금액') return '<td class="' + cls + '">' + (sub ? won(sa) : won(l.supply_amt)) + '</td>';
              if (c.t === '세액') return '<td class="' + cls + '">' + (sub ? '' : won(l.tax_amt)) + '</td>';
              var v = c.f ? c.f(l, 0) : l[c.k]; return '<td class="' + cls + '">' + (v == null ? '' : v) + '</td>';
            }).join('') + '</tr>';
          });
          if (typeof PR310 !== 'undefined') PR310 = null;
          var out9240 = h + ((opt && opt.foot) || '') + '</tbody></table>';
          try { if (typeof window.prTidy9235 === 'function') out9240 = window.prTidy9235(out9240, L); } catch (x) {}
          return out9240;
        }
      } catch (e) { console.error('[qt9240-print]', e); }
      return _p.apply(this, arguments);
    };
    var pst = document.createElement('style'); pst.id = 'qt9240pr';
    pst.textContent = '#pr table.t9240 tr.p9240 td{font-weight:600}#pr table.t9240 tr.c9240 td{font-size:.9em;color:#334155}#pr table.t9240 tr.s9240 td{background:#f8fafc}#pr table.t9240 .k9240{color:#64748b;font-size:.88em;font-weight:400}';
    document.head.appendChild(pst);
  }

  window.QT9240_APPLIED = true;
})();
