






























(function(){
  'use strict';
  if (window.SH9250) return;

  var SHEETS = [
    {k:'bank', t:'통장'},
    {k:'card', t:'카드'},
    {k:'tax',  t:'세금계산서'},
    {k:'doc',  t:'문서 원장'},
    {k:'labor', t:'출역'},
    {k:'pay',  t:'급여 지급'},
    {k:'ptn',  t:'거래처'},
    {k:'hr',   t:'인사'}
  ];
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var won = function(n){ if (n == null || n === '') return ''; var v = Number(n); return isFinite(v) ? v.toLocaleString('ko-KR') : String(n); };
  var say = function(m, t){ try { if (window.ERPC && ERPC.say) return ERPC.say(m); } catch(e){} try { if (typeof toast === 'function') return toast(m, t || 'i'); } catch(e){} console.log('[sheet9250]', m); };
  var owner = function(){ return typeof isOwner === 'function' && isOwner(); };
  var client = function(){ return window.sb || (typeof sb !== 'undefined' ? sb : null); };
  var kstToday = function(){ var d = new Date(Date.now() + 9*3600e3); return d.toISOString().slice(0,10); };
  var monthRange = function(ym){ var y = +ym.slice(0,4), m = +ym.slice(5,7); var last = new Date(Date.UTC(y, m, 0)).getUTCDate(); return [ym + '-01', ym + '-' + String(last).padStart(2,'0')]; };

  var SH = {
    sheet: 'bank', from: '', to: '', data: null, view: [], filter: {}, q: '', sortK: null, sortAsc: true,
    dirty: {},          
    sel: null,          
    anchor: null,       
    edit: null,         
    logOpen: false,

    init: function(){
      if (!owner()) { SH._try = (SH._try || 0) + 1; if (SH._try <= 1800) setTimeout(SH.init, 1000); return; }
      if (SH._inited) return; SH._inited = true;
      var t = kstToday(); SH.ym = t.slice(0,7); var r = monthRange(SH.ym); SH.from = r[0]; SH.to = r[1];
      SH.css(); SH.page(); SH.nav();
    },

    css: function(){
      if (document.getElementById('sh9250css')) return;
      var c = document.createElement('style'); c.id = 'sh9250css';
      c.textContent = [
        '#p-sh9250{padding:12px 14px;box-sizing:border-box;flex-direction:column;height:calc(100vh - 60px);overflow:hidden}',
        '#p-sh9250.on{display:flex!important}',
        '.sh-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:8px;font-size:13px}',
        '.sh-tab{padding:5px 12px;border:1px solid #cbd5e1;background:#fff;border-radius:6px;cursor:pointer;font-weight:600;color:#334155}',
        '.sh-tab.on{background:#0f766e;border-color:#0f766e;color:#fff}',
        '#p-sh9250 .sh-tab{display:none}',
        '.sh-btn{padding:5px 10px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;color:#334155}',
        '.sh-btn.pri{background:#0f766e;border-color:#0f766e;color:#fff}',
        '.sh-btn.pri[disabled]{background:#94a3b8;border-color:#94a3b8;cursor:default}',
        '.sh-in{padding:4px 6px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px}',
        '.sh-sum{display:flex;flex-wrap:wrap;gap:14px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;margin-bottom:6px;font-size:12px;color:#334155}',
        '.sh-sum b{color:#0f172a}',
        '.sh-wrap{flex:1;overflow:auto;border:1px solid #cbd5e1;border-radius:6px;background:#fff;position:relative;outline:none}',
        '.sh-t{border-collapse:separate;border-spacing:0;font-size:12px;table-layout:fixed}',
        '.sh-t th,.sh-t td{border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:3px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;height:22px;box-sizing:border-box}',
        '.sh-t thead th{position:sticky;top:0;background:#f1f5f9;z-index:3;font-weight:700;color:#1e293b;cursor:pointer;user-select:none}',
        '.sh-t thead tr:first-child th{position:sticky}.sh-rz{position:absolute;right:-3px;top:0;width:7px;height:100%;cursor:col-resize;z-index:5}.sh-rz:hover,.sh-rz.on{background:#0f766e;opacity:.35}',
        '.sh-t thead tr.f th{top:24px;background:#fff;padding:2px;cursor:default}',
        '.sh-t thead tr.f input{width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:4px;padding:2px 4px;font-size:11px}',
        '.sh-t tfoot td{position:sticky;bottom:0;background:#ecfdf5;font-weight:700;z-index:2;border-top:2px solid #0f766e}',
        '.sh-t th.no,.sh-t td.no{width:44px;text-align:right;color:#94a3b8;background:#f8fafc;position:sticky;left:0;z-index:2}',
        '.sh-t thead th.no{z-index:4}',
        '.sh-t td.n{text-align:right;font-variant-numeric:tabular-nums}',
        '.sh-t td.ed{background:#fffef5}',
        '.sh-t td.ed:hover{background:#fef9c3}',
        '.sh-t td.dirty{background:#fde68a!important}',
        '.sh-t td.sel{outline:2px solid #2563eb;outline-offset:-2px}',
        '.sh-t td.rng{background:#dbeafe!important}',
        '.sh-t td.soft{color:#94a3b8;font-style:italic}',
        '.sh-t td.c-no{color:#1d4ed8;text-decoration:underline;cursor:pointer}',
        '.sh-ime{position:absolute;left:0;top:0;width:2px;height:2px;opacity:0;border:none;padding:0;margin:0;z-index:6;font-size:12px;font-family:inherit;background:#fff;outline:none}',
        '.sh-ime.on{opacity:1;outline:2px solid #16a34a;padding:2px 6px;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,.15)}',
        '.sh-pick{position:absolute;z-index:7;background:#fff;border:1px solid #94a3b8;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.18);max-height:260px;overflow:auto;min-width:220px;font-size:12px}',
        '.sh-pick div{padding:4px 8px;cursor:pointer;white-space:nowrap}.sh-pick div.hi{background:#0f766e;color:#fff}.sh-pick div:hover{background:#ccfbf1;color:#0f172a}.sh-pick .none{color:#94a3b8;cursor:default}',
        '@keyframes sh9250ok{0%{background:#86efac}100%{background:transparent}}.sh-t td.ok{animation:sh9250ok 2.2s ease-out}',
        '.sh-t tr:hover td{background-color:#f8fafc}',
        '.sh-t tr.dep td.c-dep{color:#b91c1c}',
        '.sh-t tr.s-s td{background-color:#fff7f7}.sh-t tr.s-p td{background-color:#f5f9ff}.sh-t tr.s-s td.c-side{color:#b91c1c;font-weight:700}.sh-t tr.s-p td.c-side{color:#1d4ed8;font-weight:700}',
        '.sh-t tr.s-void td{color:#94a3b8;text-decoration:line-through}',
        '.sh-t tr.wd td.c-wd{color:#1d4ed8}',
        '.sh-log{position:absolute;right:14px;top:96px;width:420px;max-height:60vh;overflow:auto;background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.15);z-index:20;font-size:12px}',
        '.sh-log table{width:100%;border-collapse:collapse}.sh-log td,.sh-log th{border-bottom:1px solid #eef2f7;padding:4px 6px;text-align:left}',
        '.sh-help{font-size:11px;color:#64748b}',
        '@media print{body.sh9250-printing *{visibility:hidden}body.sh9250-printing #p-sh9250,body.sh9250-printing #p-sh9250 *{visibility:visible}body.sh9250-printing #p-sh9250{position:absolute;left:0;top:0;height:auto;overflow:visible}body.sh9250-printing .sh-bar,body.sh9250-printing .sh-help,body.sh9250-printing .sh-t thead tr.f,body.sh9250-printing .sh-log{display:none!important}body.sh9250-printing .sh-wrap{overflow:visible;border:none}body.sh9250-printing .sh-t th,body.sh9250-printing .sh-t td{font-size:9px;height:auto}}'
      ].join('\n');
      document.head.appendChild(c);
    },

    page: function(){
      if (document.getElementById('p-sh9250')) return;
      var host = (document.querySelector('.page') || {}).parentNode || document.body;
      var p = document.createElement('div'); p.id = 'p-sh9250'; p.className = 'page'; p.style.display = 'none';
      p.innerHTML =
        '<div class="sh-bar">' +
          SHEETS.map(function(s){ return '<button type="button" class="sh-tab" data-k="' + s.k + '">' + s.t + '</button>'; }).join('') +
          '<span style="width:10px"></span>' +
          '<button type="button" class="sh-btn" data-a="prev">◀</button>' +
          '<input type="month" class="sh-in" id="sh_ym">' +
          '<button type="button" class="sh-btn" data-a="next">▶</button>' +
          '<input type="date" class="sh-in" id="sh_from"> ~ <input type="date" class="sh-in" id="sh_to">' +
          '<button type="button" class="sh-btn" data-a="load">조회</button>' +
          '<span id="sh_tools" style="display:inline-flex;gap:4px;flex-wrap:wrap"></span>' +
          '<input type="search" class="sh-in" id="sh_q" placeholder="전체에서 찾기" style="width:150px">' +
          '<span style="flex:1"></span>' +
          '<button type="button" class="sh-btn pri" data-a="save" id="sh_save" disabled>저장</button>' +
          '<button type="button" class="sh-btn" data-a="drop">고친 것 취소</button>' +
          '<button type="button" class="sh-btn" data-a="log">변경 이력</button>' +
          '<button type="button" class="sh-btn" data-a="csv">엑셀 내려받기</button>' +
          '<button type="button" class="sh-btn" data-a="print">인쇄</button>' +
          '<button type="button" class="sh-btn" data-a="close">닫기</button>' +
        '</div>' +
        '<div class="sh-sum" id="sh_sum">불러오는 중</div>' +
        '<div class="sh-wrap" id="sh_wrap" tabindex="0"><table class="sh-t" id="sh_t"></table></div>' +
        '<div class="sh-help" style="margin-top:4px">노란 바탕 칸만 고칠 수 있습니다 · 글자 치면 바로 고침 · Enter 아래 · Tab 옆 · Esc 취소 · Ctrl+C/V 복사·붙여넣기 · Ctrl+D 아래로 채우기 · Ctrl+S 저장 · 머리 누르면 정렬</div>' +
        '<div class="sh-log" id="sh_log" style="display:none"></div>';
      host.appendChild(p);
      p.addEventListener('click', SH.onBar);
      var ym = p.querySelector('#sh_ym'); ym.value = SH.ym;
      ym.addEventListener('change', function(){ if (!ym.value) return; SH.ym = ym.value; var r = monthRange(ym.value); SH.from = r[0]; SH.to = r[1]; SH.syncDates(); SH.load(); });
      p.querySelector('#sh_from').addEventListener('change', function(e){ SH.from = e.target.value; });
      p.querySelector('#sh_to').addEventListener('change', function(e){ SH.to = e.target.value; });
      p.querySelector('#sh_q').addEventListener('input', function(e){ SH.q = e.target.value.trim(); SH.paint(); });
      var w = p.querySelector('#sh_wrap');
      

      var ime = document.createElement('input'); ime.id = 'sh_ime'; ime.className = 'sh-ime'; ime.setAttribute('autocomplete', 'off'); w.appendChild(ime); SH.ime = ime;
      w.addEventListener('mousedown', SH.onDown);
      w.addEventListener('dblclick', SH.onDbl);
      ime.addEventListener('keydown', SH.onKey);
      ime.addEventListener('compositionstart', function(){ if (!SH.edit) SH.beginTyping(); });
      ime.addEventListener('input', function(){ if (!SH.edit) SH.beginTyping(); else if (SH.pk) SH.pickFill(); });
      ime.addEventListener('compositionupdate', function(){ if (SH.edit && SH.pk) setTimeout(SH.pickFill, 0); });
      ime.addEventListener('blur', function(){ setTimeout(function(){ if (SH.edit && document.activeElement !== ime) SH.commitEdit(true); }, 0); });
       
      ime.addEventListener('copy', function(e){ if (!SH.edit) SH.onCopy(e); });
      ime.addEventListener('cut', function(e){ if (!SH.edit) { SH.onCopy(e); SH.clearRange(); } });
      ime.addEventListener('paste', function(e){ if (!SH.edit) SH.onPaste(e); });
      window.addEventListener('beforeunload', function(e){ if (SH.nDirty()) { e.preventDefault(); e.returnValue = ''; } });
      SH.syncDates();
    },

    tools: {},
     
    rowAct: {
      doc: function(row){ SH.docOpen(row.id); }
    },
    selRow: function(){ return SH.sel ? SH.view[SH.sel.r] : null; },
    docObj: function(no){ return (window.D && Array.isArray(D.sd)) ? D.sd.filter(function(x){ return x.doc_no === no; })[0] : null; },
     
    ensureDocs: function(){
      var has = function(){ return !!(window.D && Array.isArray(D.sd) && D.sd.length); };
      if (has()) return Promise.resolve(true);
      if (SH._docLoading) return SH._docLoading;
      SH._docLoading = Promise.resolve().then(function(){ if (typeof window.loadAll === 'function') return window.loadAll('sd'); }).catch(function(){})
        .then(function(){ return new Promise(function(res){ var n = 0; (function wait(){ if (has() || ++n > 32) return res(has()); setTimeout(wait, 250); })(); }); })
        .then(function(ok){ SH._docLoading = null; return ok; });
      return SH._docLoading;
    },
    docOpen: function(no){
      if (!no) { say('먼저 문서 줄을 하나 고르십시오', 'e'); return; }
      if (!SH.docObj(no)) { say('문서 목록을 불러오는 중…'); SH.ensureDocs().then(function(ok){ if (ok && SH.docObj(no)) SH.docOpen(no); else say('문서 목록을 못 불러왔습니다 — 새로고침(F5) 뒤 다시', 'e'); }); return; }
      var d = SH.docObj(no);
      if (d && typeof window.openDoc === 'function') { try { window.openDoc(d); return; } catch(e) { console.error('[sheet9250 openDoc]', e); } }
      SH.docPrint(no);
    },
    docPrint: function(no){
      if (!no) { say('먼저 인쇄할 문서 줄을 하나 고르십시오', 'e'); return; }
      if (!SH.docObj(no)) { say('문서 목록을 불러오는 중…'); SH.ensureDocs().then(function(ok){ if (ok && SH.docObj(no)) SH.docPrint(no); else say('문서 목록을 못 불러왔습니다 — 새로고침(F5) 뒤 다시', 'e'); }); return; }
      if (typeof window.printDoc === 'function') { try { window.printDoc(no); return; } catch(e) { console.error('[sheet9250 printDoc]', e); } }
      say('인쇄 화면을 찾지 못했습니다(ERP 새로고침 후 다시)', 'e');
    },
    addTool: function(k, label, fn){ (SH.tools[k] = SH.tools[k] || []).push({t:label, run:fn}); SH.paintTools(); },
    paintTools: function(){
      var el = document.getElementById('sh_tools'); if (!el) return;
      var base = SH.sheet === 'doc' ? [{t:'인쇄', run:function(){ var r = SH.selRow(); SH.docPrint(r && r.id); }}, {t:'문서 창', run:function(){ var r = SH.selRow(); SH.docOpen(r && r.id); }}] : [];
      SH._toolList = base.concat(SH.tools[SH.sheet] || []); var list = SH._toolList;
      el.innerHTML = list.map(function(x, i){ return '<button type="button" class="sh-btn" data-tool="' + i + '" style="border-color:#0f766e;color:#0f766e">' + esc(x.t) + '</button>'; }).join('');
      el.onclick = function(e){ var b = e.target.closest('button[data-tool]'); if (!b) return; e.stopPropagation(); var x = (SH._toolList || [])[+b.dataset.tool]; if (x) { try { x.run(SH); } catch(err) { say('작업 실패: ' + err.message, 'e'); } } };
    },
    syncDates: function(){
      var f = document.getElementById('sh_from'), t = document.getElementById('sh_to'), y = document.getElementById('sh_ym');
      if (f) f.value = SH.from; if (t) t.value = SH.to; if (y) y.value = (SH.from.slice(0,7) === SH.to.slice(0,7)) ? SH.from.slice(0,7) : '';
      document.querySelectorAll('#p-sh9250 .sh-tab').forEach(function(b){ b.classList.toggle('on', b.dataset.k === SH.sheet); });
      SH.paintTools();
    },

    nav: function(){
      try {
        var mb = document.getElementById('modbar');
        if (false && mb && !document.getElementById('btnModSh9250')) {  
          var b = document.createElement('button'); b.id = 'btnModSh9250'; b.type = 'button'; b.className = 'mod-btn ws-btn';
          b.style.cssText = 'color:#0f766e!important;font-weight:700!important;border:1px solid #14b8a6;border-radius:4px;margin-left:4px;';
          b.innerHTML = '<span class="ws-n" style="background:#0f766e;color:#fff;">장</span>장부 엑셀표';
          b.title = '통장 · 세금계산서 · 급여를 엑셀처럼 (대표 전용)';
          b.onclick = function(){ SH.open(); };
          mb.appendChild(b);
        }
      } catch(e) {}
      try {
        if (typeof window.cpItems === 'function' && !window.cpItems._sh9250) {
          var _cp = window.cpItems;
          window.cpItems = function(q){
            var out = _cp.apply(this, arguments);
            try { if (owner()) { var s = (q || '').toLowerCase();
              if (!s || '장부 엑셀표 통장 계산서 세금계산서 급여 지급 sheet'.indexOf(s) >= 0)
                SHEETS.slice().reverse().forEach(function(x){ out.unshift({g:'대표', t:'장부 엑셀표 · ' + x.t, sub:'엑셀처럼 보고 고치기', run:function(){ SH.open(x.k); }}); }); } } catch(e) {}
            return out;
          };
          window.cpItems._sh9250 = true;
        }
      } catch(e) {}
    },

    open: function(k){
      if (!owner()) { say('대표 전용 메뉴입니다', 'e'); return; }
      document.querySelectorAll('.page').forEach(function(pg){ pg.classList.remove('on'); });
      var p = document.getElementById('p-sh9250'); if (!p) return;
      p.classList.add('on'); p.style.display = 'flex';
      var nm = (SHEETS.find(function(s){ return s.k === (k || SH.sheet); }) || {}).t || '엑셀표';
      var ttl = document.getElementById('ttl'); if (ttl) ttl.textContent = nm;
      var cr = document.getElementById('crumb'); if (cr) cr.textContent = '대표 전용 · 엑셀표';
      if (k && k !== SH.sheet) { if (!SH.leaveOk()) return; SH.sheet = k; SH.data = null; }
      SH.syncDates();
      if (!SH.data) SH.load(); else SH.paint();
      if (SH.sheet === 'doc') SH.ensureDocs();
      setTimeout(SH.focus, 30);
    },

    close: function(){
      if (!SH.leaveOk()) return;
      var p = document.getElementById('p-sh9250'); if (p) { p.classList.remove('on'); p.style.display = 'none'; }
      try { if (typeof go === 'function') go('home'); else if (typeof renderAll === 'function') renderAll(); } catch(e) {}
    },

     
    colW: function(){ if (!SH._cw) { try { SH._cw = JSON.parse(localStorage.getItem('sh9250.cw') || '{}'); } catch(e) { SH._cw = {}; } } return SH._cw[SH.sheet] || (SH._cw[SH.sheet] = {}); },
    colWSave: function(){ try { localStorage.setItem('sh9250.cw', JSON.stringify(SH._cw || {})); } catch(e) {} },
    rzSet: function(k, px){ px = Math.max(36, Math.min(600, Math.round(px))); SH.colW()[k] = px; var t = document.getElementById('sh_t'); if (!t) return;
      var col = t.querySelector('col[data-k="' + k + '"]'); if (col) col.style.width = px + 'px';
      var tot = 44; t.querySelectorAll('colgroup col[data-k]').forEach(function(c){ tot += parseFloat(c.style.width) || 90; }); t.style.width = tot + 'px'; },
    rzStart: function(e, k, hd){
      var th = hd.parentNode, x0 = e.clientX, w0 = th.getBoundingClientRect().width; hd.classList.add('on'); document.body.style.cursor = 'col-resize';
      var mv = function(ev){ SH.rzSet(k, w0 + ev.clientX - x0); };
      var up = function(){ document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); hd.classList.remove('on'); document.body.style.cursor = '';
        SH.colWSave(); SH._rzJust = true; setTimeout(function(){ SH._rzJust = false; }, 200); SH.place(!!SH.edit); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    },
    rzFit: function(k){
      var cols = SH.cols(), i = cols.findIndex(function(c){ return c.k === k; }); if (i < 0) return;
      var cv = document.createElement('canvas').getContext('2d'), td0 = document.querySelector('#sh_t td[data-c="' + i + '"]'), cs = td0 ? getComputedStyle(td0) : null;
      cv.font = cs ? (cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily) : '12px sans-serif';
      var m = cv.measureText(cols[i].t).width + 24;
      SH.view.slice(0, 400).forEach(function(r){ var w = cv.measureText(SH.shown(r, cols[i])).width + 16; if (w > m) m = w; });
      SH.rzSet(k, m); SH.colWSave(); SH._rzJust = true; setTimeout(function(){ SH._rzJust = false; }, 200);
    },
    nDirty: function(){ return Object.keys(SH.dirty).length; },
    leaveOk: function(){
      if (!SH.nDirty()) return true;
      say('저장하지 않은 칸이 ' + SH.nDirty() + '개 있습니다. 「저장」 또는 「고친 것 취소」를 먼저 눌러 주십시오', 'e');
      return false;
    },

    onBar: function(e){
      var t = e.target.closest('button'); if (!t || !t.closest('.sh-bar')) return;
      if (t.dataset.k) { if (t.dataset.k === SH.sheet) return; if (!SH.leaveOk()) return; SH.sheet = t.dataset.k; SH.filter = {}; SH.sortK = null; SH.sel = null; SH.syncDates(); SH.load(); return; }
      var a = t.dataset.a;
      if (a === 'prev' || a === 'next') {
        var base = SH.from.slice(0,7) || kstToday().slice(0,7); var y = +base.slice(0,4), m = +base.slice(5,7) + (a === 'prev' ? -1 : 1);
        if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
        if (!SH.leaveOk()) return;
        var r = monthRange(y + '-' + String(m).padStart(2,'0')); SH.from = r[0]; SH.to = r[1]; SH.syncDates(); SH.load();
      }
      else if (a === 'load') { if (!SH.leaveOk()) return; SH.syncDates(); SH.load(); }
      else if (a === 'save') SH.save();
      else if (a === 'drop') { SH.dirty = {}; SH.paint(); }
      else if (a === 'log') SH.toggleLog();
      else if (a === 'csv') SH.csv();
      else if (a === 'print') {  
        document.body.classList.add('sh9250-printing');
        var off = function(){ document.body.classList.remove('sh9250-printing'); window.removeEventListener('afterprint', off); };
        window.addEventListener('afterprint', off); setTimeout(function(){ window.print(); setTimeout(off, 1500); }, 0); }
      else if (a === 'close') SH.close();
    },

    load: function(){
      var c = client(); if (!c) { say('로그인 연결을 찾지 못했습니다', 'e'); return; }
      var sum = document.getElementById('sh_sum'); if (sum) sum.textContent = '불러오는 중…';
      var my = (SH._seq = (SH._seq || 0) + 1);
      c.rpc('ceo_sheet_load', {p_sheet: SH.sheet, p_from: SH.from || null, p_to: SH.to || null}).then(function(res){
        if (my !== SH._seq) return;
        if (res.error) { say('불러오기 실패: ' + res.error.message, 'e'); if (sum) sum.textContent = '불러오기 실패'; return; }
        var d = res.data || {}; if (!d.ok) { say(d.msg || '불러오기 실패', 'e'); if (sum) sum.textContent = d.msg || '불러오기 실패'; return; }
        SH.data = d; SH.from = d.from; SH.to = d.to; SH.dirty = {}; SH.sel = null; SH.anchor = null; SH.syncDates();
        SH.optMap = {}; Object.keys(d.opts || {}).forEach(function(k){ var m = {}, r = {}; (d.opts[k] || []).forEach(function(o){ m[o.v] = o.t; r[String(o.t).toLowerCase()] = o.v; }); SH.optMap[k] = {byV:m, byT:r, list:d.opts[k] || []}; });
        SH.paint();
        if (SH.logOpen) SH.loadLog();
      });
    },

    cols: function(){ return (SH.data && SH.data.cols) || []; },
    rawVal: function(row, col){ var k = 'id' in row ? row.id + '|' + col.k : null; return (k && k in SH.dirty) ? SH.dirty[k] : row[col.k]; },
    shown: function(row, col){
      var v = SH.rawVal(row, col);
      if (col.ty === 'num') return won(v);
      if (col.ty === 'pick') {
        if (v == null || v === '') return '';
        var key = row.id + '|' + col.k;
        if (!(key in SH.dirty)) { var nm = row[col.k + '_nm']; if (nm) return nm; }
        var o = SH.optMap[col.opt]; var t = o && o.byV[v]; return t ? t.replace(/^[A-Z0-9]{3,5}\s/, '') : v;
      }
      return v == null ? '' : String(v);
    },

    match: function(txt, f){
      if (!f) return true; var s = String(txt == null ? '' : txt).toLowerCase(); var q = f.trim().toLowerCase(); if (!q) return true;
      var num = Number(String(txt).replace(/,/g,''));
      var m = q.match(/^([<>]=?|=)\s*(-?[\d,\.]+)$/);
      if (m) { var x = Number(m[2].replace(/,/g,'')); if (!isFinite(num)) return false;
        return m[1] === '>' ? num > x : m[1] === '>=' ? num >= x : m[1] === '<' ? num < x : m[1] === '<=' ? num <= x : num === x; }
      return q.split(/\s+/).every(function(w){ return w[0] === '!' ? (w.length < 2 || s.indexOf(w.slice(1)) < 0) : s.indexOf(w) >= 0; });
    },

    compute: function(){
      var cols = SH.cols(), rows = (SH.data && SH.data.rows) || [];
      var v = rows.filter(function(r){
        for (var i = 0; i < cols.length; i++) { var f = SH.filter[cols[i].k]; if (f && !SH.match(SH.shown(r, cols[i]), f)) return false; }
        if (SH.q) { var all = cols.map(function(c){ return SH.shown(r, c); }).join(' '); if (!SH.match(all, SH.q)) return false; }
        return true;
      });
      if (SH.sortK) {
        var col = cols.find(function(c){ return c.k === SH.sortK; }) || {};
        v = v.slice().sort(function(a, b){
          var x = SH.rawVal(a, col), y = SH.rawVal(b, col);
          if (col.ty === 'num') { x = x == null ? -Infinity : +x; y = y == null ? -Infinity : +y; }
          else { x = SH.shown(a, col); y = SH.shown(b, col); }
          return (x < y ? -1 : x > y ? 1 : 0) * (SH.sortAsc ? 1 : -1);
        });
      }
      SH.view = v;
    },

    paint: function(){
      var t = document.getElementById('sh_t'); if (!t || !SH.data) return;
      var cols = SH.cols(); SH.compute();
      var cw = SH.colW(), wd = function(c){ return cw[c.k] || c.w || 90; };
      var w = 44 + cols.reduce(function(s, c){ return s + wd(c); }, 0);
      var h = '<colgroup><col style="width:44px">' + cols.map(function(c){ return '<col data-k="' + c.k + '" style="width:' + wd(c) + 'px">'; }).join('') + '</colgroup>';
      h += '<thead><tr><th class="no">#</th>' + cols.map(function(c){
        var arrow = SH.sortK === c.k ? (SH.sortAsc ? ' ▲' : ' ▼') : '';
        return '<th data-k="' + c.k + '" title="' + esc(c.t) + (c.edit ? ' (고칠 수 있음)' : '') + ' · 오른쪽 끝을 끌면 너비 조정"' + (c.edit ? ' style="color:#0f766e"' : '') + '>' + esc(c.t) + arrow + '<span class="sh-rz" data-rz="' + c.k + '"></span></th>';
      }).join('') + '</tr>';
      h += '<tr class="f"><th class="no"></th>' + cols.map(function(c){ return '<th><input data-f="' + c.k + '" value="' + esc(SH.filter[c.k] || '') + '" placeholder="' + (c.ty === 'num' ? '>0' : '찾기') + '"></th>'; }).join('') + '</tr></thead>';
      var body = [];
      for (var i = 0; i < SH.view.length; i++) {
        var r = SH.view[i], cls = (r.dep ? 'dep' : '') + (r.wd ? ' wd' : '') + (r.side === '매출' ? ' s-s' : r.side === '매입' ? ' s-p' : '') + (r.st === '무효' || r.cancel ? ' s-void' : '');
        var tds = '<td class="no">' + (i + 1) + '</td>';
        for (var j = 0; j < cols.length; j++) {
          var c = cols[j], key = r.id + '|' + c.k, cc = 'c-' + c.k;
          if (c.ty === 'num') cc += ' n';
          if (c.edit && !r.ro) cc += ' ed';
          if (key in SH.dirty) cc += ' dirty'; else if (SH.flash && SH.flash[key]) cc += ' ok';
          if (c.k === 'partner' && r.partner_how === '별칭' && !(key in SH.dirty)) cc += ' soft';
          var txt = SH.shown(r, c);
          var tip = c.ty === 'pick' && SH.rawVal(r, c) ? SH.rawVal(r, c) + ' ' + txt : txt;
          if (c.k === 'partner' && r.partner_how === '별칭') tip += ' (통장 이름으로 추정 — 고르면 확정)';
          tds += '<td class="' + cc + '" data-r="' + i + '" data-c="' + j + '" title="' + esc(tip) + '">' + esc(txt) + '</td>';
        }
        body.push('<tr class="' + cls + '">' + tds + '</tr>');
      }
      h += '<tbody>' + body.join('') + '</tbody>';
      var sums = {}; cols.forEach(function(c){ if (c.sum) sums[c.k] = 0; });
      SH.view.forEach(function(r){ cols.forEach(function(c){ if (c.sum) sums[c.k] += Number(SH.rawVal(r, c) || 0); }); });
      h += '<tfoot><tr><td class="no">합계</td>' + cols.map(function(c){ return '<td class="' + (c.sum ? 'n' : '') + '">' + (c.sum ? won(sums[c.k]) : '') + '</td>'; }).join('') + '</tr></tfoot>';
      t.style.width = w + 'px'; t.innerHTML = h;
      t.querySelectorAll('thead tr.f input').forEach(function(inp){
        inp.addEventListener('input', function(){ SH.filter[inp.dataset.f] = inp.value; clearTimeout(SH._ft); SH._ft = setTimeout(function(){ var k = inp.dataset.f, pos = inp.selectionStart; SH.paint(); var again = document.querySelector('#sh_t input[data-f="' + k + '"]'); if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch(e){} } }, 200); });
        inp.addEventListener('keydown', function(e){ e.stopPropagation(); });
        inp.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      });
      t.querySelectorAll('thead tr:first-child th[data-k]').forEach(function(th){
        th.addEventListener('click', function(e){ if (e.target.closest('.sh-rz') || SH._rzJust) return; var k = th.dataset.k; if (SH.sortK !== k) { SH.sortK = k; SH.sortAsc = true; } else if (SH.sortAsc) SH.sortAsc = false; else SH.sortK = null; SH.paint(); });
      });
      t.querySelectorAll('.sh-rz').forEach(function(hd){
        hd.addEventListener('mousedown', function(e){ e.preventDefault(); e.stopPropagation(); SH.rzStart(e, hd.dataset.rz, hd); });
        hd.addEventListener('dblclick', function(e){ e.preventDefault(); e.stopPropagation(); SH.rzFit(hd.dataset.rz); });
      });
      SH.paintSel(); SH.summary(sums);
      var sv = document.getElementById('sh_save'); if (sv) { var n = SH.nDirty(); sv.disabled = !n; sv.textContent = n ? '저장 (' + n + '칸)' : '저장'; }
    },

    summary: function(sums){
      var el = document.getElementById('sh_sum'); if (!el || !SH.data) return;
      var name = (SHEETS.find(function(s){ return s.k === SH.sheet; }) || {}).t;
      var all = SH.data.rows.length, n = SH.view.length;
      var parts = ['<b>' + name + '</b>', SH.from + ' ~ ' + SH.to, (n === all ? all + '줄' : n + '줄 / 전체 ' + all + '줄')];
      SH.cols().forEach(function(c){ if (c.sum) parts.push(c.t + ' <b>' + won(sums[c.k]) + (/^(work_md|ot_hours|pay_terms_days|docs)$/.test(c.k) ? '' : '원') + '</b>'); });
      if (SH.sheet === 'bank') { var un = SH.view.filter(function(r){ return !r.acct || r.acct === 'Z999'; }).length; if (un) parts.push('<span style="color:#b45309">계정 미지정 ' + un + '줄</span>'); }
      if (SH.sheet === 'tax') { var nd = SH.view.filter(function(r){ return !r.doc; }).length; var np = SH.view.filter(function(r){ return !r.paid; }).length; parts.push('문서 미연결 ' + nd + '줄'); parts.push('통장 짝 없음 ' + np + '줄'); }
      if (SH.sheet === 'pay') { var nb = SH.view.filter(function(r){ return !r.bank; }).length; if (nb) parts.push('통장 짝 없음 ' + nb + '줄'); }
      if (SH.sheet === 'card') { var uc = SH.view.filter(function(r){ return !r.acct || r.acct === '8900' || r.acct === 'Z999'; }).length; if (uc) parts.push('<span style="color:#b45309">기타판관비·미분류 ' + uc + '줄</span>'); if (!all) parts.push('<span style="color:#b45309">이 기간 카드 내역 없음(카드 원본은 2026-09-29까지 들어와 있음)</span>'); }
      if (SH.sheet === 'labor') { var sv = SH.view.filter(function(r){ return r.etype === '용역'; }), rg = SH.view.filter(function(r){ return r.etype !== '용역'; });
        var md = function(a){ return a.reduce(function(t, r){ return t + Number(SH.rawVal(r, {k:'work_md'}) || 0); }, 0); };
        parts.push('용역 ' + sv.length + '줄 · 공수 ' + md(sv) + ' · 지급 예상 <b>' + won(sv.reduce(function(t, r){ return t + Number(r.pay || 0); }, 0)) + '원</b>');
        parts.push('정규직 ' + rg.length + '줄 · 공수 ' + md(rg) + ' (급여는 급여 계산 화면)');
        var nd = sv.filter(function(r){ return !r.daily; }).length; if (nd) parts.push('<span style="color:#b45309">용역 일당 없음 ' + nd + '줄(작성 상태)</span>');
        if (SH.nDirty()) parts.push('지급 예상은 저장 뒤 다시 계산됨'); }
      if (SH.sheet === 'ptn') { var na = SH.view.filter(function(r){ return r.is_active === '예'; }).length; parts[1] = '기간 상관없이 전체'; parts.push('사용 ' + na + '곳 · 안 씀 ' + (n - na) + '곳'); var nc = SH.view.filter(function(r){ return r.is_active === '예' && !r.contact_email; }).length; if (nc) parts.push('담당 이메일 없음 ' + nc + '곳'); }
      if (SH.sheet === 'hr') { var cur = SH.view.filter(function(r){ return !r.resigned_on; }).length; parts[1] = SH.from + ' 이후 재직'; parts.push('재직 ' + cur + '명' + (n - cur ? ' · 기간 중 퇴사 ' + (n - cur) + '명' : '')); var t0 = kstToday(), soon = new Date(Date.now() + 9*3600e3 + 30*864e5).toISOString().slice(0,10);
        var ex = SH.view.filter(function(r){ return !r.resigned_on && ((r.health_exam_until && r.health_exam_until <= soon) || (r.visa_until && r.visa_until <= soon)); }).length; if (ex) parts.push('<span style="color:#b45309">건강진단·체류 만료 30일 안 ' + ex + '명</span>'); var nb = SH.view.filter(function(r){ return !r.resigned_on && !r.basic_safety_on; }).length; if (nb) parts.push('기초안전교육 기록 없음 ' + nb + '명'); }
      if (SH.sheet === 'doc') { parts.push('<span style="color:#1d4ed8">줄을 두 번 누르면 문서 창(인쇄·수정)</span>'); var ns = SH.view.filter(function(r){ return r.side === '매출'; }).length; parts.push('매출 ' + ns + '건 · 매입 ' + (n - ns) + '건'); }
      if (SH.nDirty()) parts.push('<span style="color:#b45309;font-weight:700">저장 안 한 칸 ' + SH.nDirty() + '개</span>');
      el.innerHTML = parts.join(' · ');
    },

     
    cell: function(r, c){ return document.querySelector('#sh_t td[data-r="' + r + '"][data-c="' + c + '"]'); },
    paintSel: function(){
      document.querySelectorAll('#sh_t td.sel, #sh_t td.rng').forEach(function(td){ td.classList.remove('sel', 'rng'); });
      if (!SH.sel) return;
      var a = SH.anchor || SH.sel, r0 = Math.min(a.r, SH.sel.r), r1 = Math.max(a.r, SH.sel.r), c0 = Math.min(a.c, SH.sel.c), c1 = Math.max(a.c, SH.sel.c);
      if (r0 !== r1 || c0 !== c1) for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) { var x = SH.cell(r, c); if (x) x.classList.add('rng'); }
      var td = SH.cell(SH.sel.r, SH.sel.c); if (td) { td.classList.add('sel'); td.scrollIntoView({block:'nearest', inline:'nearest'}); }
      SH.place(!!SH.edit);
    },
     
    place: function(show){
      var ime = SH.ime, w = document.getElementById('sh_wrap'); if (!ime || !w) return;
      var td = SH.sel && SH.cell(SH.sel.r, SH.sel.c);
      if (!td) { ime.style.left = (w.scrollLeft + 2) + 'px'; ime.style.top = (w.scrollTop + 2) + 'px'; return; }
      var a = td.getBoundingClientRect(), b = w.getBoundingClientRect();
      ime.style.left = (a.left - b.left + w.scrollLeft) + 'px'; ime.style.top = (a.top - b.top + w.scrollTop) + 'px';
      if (show) { ime.style.width = Math.max(a.width, 160) + 'px'; ime.style.height = a.height + 'px'; }
      else { ime.style.width = '2px'; ime.style.height = '2px'; }
    },
    focus: function(){ if (SH.ime) { try { SH.ime.focus({preventScroll:true}); } catch(e) { SH.ime.focus(); } } },
    range: function(){ var a = SH.anchor || SH.sel; if (!a) return null; return {r0:Math.min(a.r, SH.sel.r), r1:Math.max(a.r, SH.sel.r), c0:Math.min(a.c, SH.sel.c), c1:Math.max(a.c, SH.sel.c)}; },
    onDown: function(e){
      if (e.target === SH.ime) return;
      var td = e.target.closest('td[data-r]');
      if (!td) { if (e.target.closest('#sh_t thead')) return; SH.commitEdit(); e.preventDefault(); SH.focus(); return; }
      e.preventDefault();
      var p = {r:+td.dataset.r, c:+td.dataset.c};
      SH.commitEdit();
      if (e.shiftKey && SH.sel) { if (!SH.anchor) SH.anchor = SH.sel; SH.sel = p; } else { SH.sel = p; SH.anchor = null; }
      SH.paintSel(); SH.focus();
    },
    onDbl: function(e){ var td = e.target.closest('td[data-r]'); if (!td) return; SH.sel = {r:+td.dataset.r, c:+td.dataset.c}; SH.anchor = null;
      if (!SH.editable(SH.sel.r, SH.sel.c) && SH.rowAct[SH.sheet]) { SH.rowAct[SH.sheet](SH.view[SH.sel.r]); return; }
      SH.startEdit(); },
    move: function(dr, dc, shift){
      if (!SH.view.length) return;
      if (!SH.sel) { SH.sel = {r:0, c:0}; SH.paintSel(); return; }
      var n = SH.view.length, m = SH.cols().length;
      var nr = Math.max(0, Math.min(n - 1, SH.sel.r + dr)), nc = Math.max(0, Math.min(m - 1, SH.sel.c + dc));
      if (shift) { if (!SH.anchor) SH.anchor = {r:SH.sel.r, c:SH.sel.c}; } else SH.anchor = null;
      SH.sel = {r:nr, c:nc}; SH.paintSel();
    },
    editable: function(r, c){ var col = SH.cols()[c], row = SH.view[r]; return !!(col && row && col.edit && !row.ro); },

    onKey: function(e){
      if (e.isComposing || e.keyCode === 229) return;            
      if (SH.edit) {
        if (SH.pk && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); SH.pickMove(e.key === 'ArrowDown' ? 1 : -1); return; }
        if (SH.pk && e.key === 'Enter' && SH.pk.list.length && SH.pk.typed) { e.preventDefault(); SH.pickChoose(SH.pk.hi); SH.move(e.shiftKey ? -1 : 1, 0); return; }
        if (e.key === 'Escape') { e.preventDefault(); SH.cancelEdit(); return; }
        if (e.key === 'Enter') { e.preventDefault(); SH.commitEdit(); SH.move(e.shiftKey ? -1 : 1, 0); return; }
        if (e.key === 'Tab') { e.preventDefault(); SH.commitEdit(); SH.move(0, e.shiftKey ? -1 : 1); return; }
        return;
      }
      var ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 's' || e.key === 'S')) { e.preventDefault(); SH.save(); return; }
      if (ctrl && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); SH.fillDown(); return; }
      if (ctrl && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); if (SH.view.length) { SH.anchor = {r:0, c:0}; SH.sel = {r:SH.view.length - 1, c:SH.cols().length - 1}; SH.paintSel(); } return; }
      if (ctrl || e.altKey) return; 
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); SH.move(-1, 0, e.shiftKey); return;
        case 'ArrowDown': e.preventDefault(); SH.move(1, 0, e.shiftKey); return;
        case 'ArrowLeft': e.preventDefault(); SH.move(0, -1, e.shiftKey); return;
        case 'ArrowRight': e.preventDefault(); SH.move(0, 1, e.shiftKey); return;
        case 'PageDown': e.preventDefault(); SH.move(20, 0, e.shiftKey); return;
        case 'PageUp': e.preventDefault(); SH.move(-20, 0, e.shiftKey); return;
        case 'Home': e.preventDefault(); SH.move(0, -99, e.shiftKey); return;
        case 'End': e.preventDefault(); SH.move(0, 99, e.shiftKey); return;
        case 'Tab': e.preventDefault(); SH.move(0, e.shiftKey ? -1 : 1); return;
        case 'Enter': case 'F2': e.preventDefault(); SH.startEdit(); return;
        case 'Delete': case 'Backspace': e.preventDefault(); SH.clearRange(); return;
        case 'Escape': e.preventDefault(); SH.anchor = null; SH.paintSel(); return;
      }
      if (e.key.length === 1 && SH.sel && !SH.editable(SH.sel.r, SH.sel.c)) { e.preventDefault(); SH.roMsg(); }
       
    },
    roMsg: function(){ var t = Date.now(); if (t - (SH._roAt || 0) > 2500) { SH._roAt = t; say('이 칸은 원본이라 고칠 수 없습니다 (노란 바탕 칸만 고칩니다)'); } },

     
    openEditor: function(val, selectAll){
      var row = SH.view[SH.sel.r], col = SH.cols()[SH.sel.c], ime = SH.ime;
      SH.edit = {r:SH.sel.r, c:SH.sel.c, id:row.id};
      ime.classList.add('on'); SH.place(true);
      if (val != null) ime.value = val;
      SH.focus();
      if (selectAll) ime.select();
      if (col.ty === 'pick' && SH.optMap[col.opt]) SH.pickOpen(col, val == null);
    },
     
    cho: function(s){ var C = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'; return String(s || '').replace(/[가-힣]/g, function(ch){ return C[Math.floor((ch.charCodeAt(0) - 0xAC00) / 588)]; }); },
    pickOpen: function(col, typed){
      var el = document.getElementById('sh_pick'), w = document.getElementById('sh_wrap');
      if (!el) { el = document.createElement('div'); el.id = 'sh_pick'; el.className = 'sh-pick'; w.appendChild(el);
        el.addEventListener('mousedown', function(e){ e.preventDefault(); e.stopPropagation(); var d = e.target.closest('div[data-i]'); if (d) { SH.pickChoose(+d.dataset.i); } }); }
      var o = SH.optMap[col.opt];
      if (!o.cho) o.cho = o.list.map(function(x){ return SH.cho(x.t).toLowerCase(); });
      SH.pk = {col:col, el:el, hi:0, list:[], o:o, typed:typed};
      el.style.display = 'block'; SH.pickPlace(); SH.pickFill();
    },
    pickPlace: function(){
      if (!SH.pk) return; var ime = SH.ime, el = SH.pk.el;
      el.style.left = ime.style.left; el.style.top = (parseFloat(ime.style.top) + ime.offsetHeight + 2) + 'px';
      el.style.width = Math.max(260, ime.offsetWidth) + 'px';
    },
    pickFill: function(){
      var pk = SH.pk; if (!pk) return;
      var q = SH.ime.value.trim().toLowerCase(); if (q !== (pk.q0 == null ? q : pk.q0)) pk.typed = true; pk.q0 = q;
      var o = pk.o, out = [];
      if (!q || !pk.typed) out = o.list.map(function(x, i){ return i; });
      else {
        var onlyCho = /^[ㄱ-ㅎ\s]+$/.test(q), qs = q.replace(/\s+/g, '');
        o.list.forEach(function(x, i){
          var t = String(x.t).toLowerCase(), v = String(x.v).toLowerCase(), sc = -1;
          if (v === q) sc = 0; else if (v.indexOf(q) === 0) sc = 1; else if (t.indexOf(q) === 0) sc = 2;
          else if (t.replace(/^[a-z0-9]{3,5}\s/, '').indexOf(q) === 0) sc = 2; else if (t.indexOf(q) >= 0) sc = 3;
          else if (onlyCho && o.cho[i].replace(/\s+/g, '').indexOf(qs) >= 0) sc = 4;
          if (sc >= 0) out.push([sc, i]);
        });
        out = out.sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; }).map(function(a){ return a[1]; });
      }
      pk.list = out.slice(0, 200); pk.hi = 0;
      if (!pk.typed) { var cur = SH.ime.value.trim(); var at = pk.list.findIndex(function(i){ var t = o.list[i].t; return t === cur || t.replace(/^[A-Z0-9]{3,5}\s/, '') === cur; }); if (at >= 0) pk.hi = at; }
      pk.el.innerHTML = pk.list.length ? pk.list.map(function(i, k){ return '<div data-i="' + k + '"' + (k === pk.hi ? ' class="hi"' : '') + '>' + esc(o.list[i].t) + '</div>'; }).join('') +
        (out.length > 200 ? '<div class="none">… ' + (out.length - 200) + '개 더 — 더 쳐서 좁히십시오</div>' : '') : '<div class="none">맞는 항목 없음</div>';
      SH.pickScroll();
    },
    pickScroll: function(){ var pk = SH.pk; if (!pk) return; var d = pk.el.querySelector('div[data-i="' + pk.hi + '"]'); if (!d) return;  
      var el = pk.el; if (d.offsetTop < el.scrollTop) el.scrollTop = d.offsetTop; else if (d.offsetTop + d.offsetHeight > el.scrollTop + el.clientHeight) el.scrollTop = d.offsetTop + d.offsetHeight - el.clientHeight; },
    pickMove: function(d){
      var pk = SH.pk; if (!pk || !pk.list.length) return; pk.typed = true;
      pk.hi = Math.max(0, Math.min(pk.list.length - 1, pk.hi + d));
      pk.el.querySelectorAll('div[data-i]').forEach(function(x){ x.classList.toggle('hi', +x.dataset.i === pk.hi); }); SH.pickScroll();
    },
    pickChoose: function(k){
      var pk = SH.pk; if (!pk) return; var i = pk.list[k]; if (i == null) return;
      var opt = pk.o.list[i]; SH.edit.chosen = opt.v; SH.ime.value = opt.t; SH.commitEdit();
    },
    pickClose: function(){ if (SH.pk) { SH.pk.el.style.display = 'none'; SH.pk.el.innerHTML = ''; SH.pk = null; } },
    beginTyping: function(){                                   
      if (!SH.sel || !SH.editable(SH.sel.r, SH.sel.c)) { SH.ime.value = ''; if (SH.sel) SH.roMsg(); return; }
      SH.openEditor(null, false);                              
    },
    startEdit: function(){                                     
      if (!SH.sel) return;
      if (!SH.editable(SH.sel.r, SH.sel.c)) { if (SH.rowAct[SH.sheet]) { SH.rowAct[SH.sheet](SH.view[SH.sel.r]); return; } SH.roMsg(); return; }
      var row = SH.view[SH.sel.r], col = SH.cols()[SH.sel.c];
      var cur = col.ty === 'pick' ? (SH.shown(row, col) || '') : (SH.rawVal(row, col) == null ? '' : String(SH.rawVal(row, col)));
      SH.openEditor(cur, true);
    },
    closeEditor: function(){ var ime = SH.ime; SH.pickClose(); ime.classList.remove('on'); ime.value = ''; SH.place(false); },
    cancelEdit: function(){ if (!SH.edit) return; SH.edit = null; SH.closeEditor(); SH.focus(); },
    toVal: function(col, txt){
      txt = String(txt == null ? '' : txt).trim();
      if (col.ty !== 'pick' || !txt) return {ok:true, v:txt};
      var o = SH.optMap[col.opt]; if (!o) return {ok:true, v:txt};
      if (o.byV[txt]) return {ok:true, v:txt};
      var low = txt.toLowerCase(); if (o.byT[low]) return {ok:true, v:o.byT[low]};
      var hit = o.list.filter(function(x){ var t = String(x.t).toLowerCase(); return t === low || t.replace(/^[a-z0-9]{3,5}\s/, '') === low; });
      if (hit.length === 1) return {ok:true, v:hit[0].v};
      hit = o.list.filter(function(x){ return String(x.t).toLowerCase().indexOf(low) >= 0; });
      if (hit.length === 1) return {ok:true, v:hit[0].v};
      return {ok:false, msg:'「' + txt + '」 ' + (hit.length ? '후보가 ' + hit.length + '개입니다. 목록에서 골라 주십시오' : '목록에 없습니다')};
    },
    setVal: function(row, col, v){
      var key = row.id + '|' + col.k, orig = row[col.k] == null ? '' : String(row[col.k]);
      if (String(v) === orig) delete SH.dirty[key]; else SH.dirty[key] = v;
    },
    commitEdit: function(noFocus){
      var ed = SH.edit; if (!ed) return; SH.edit = null;
      var row = SH.view[ed.r], col = SH.cols()[ed.c], txt = SH.ime.value;
      SH.closeEditor();
      if (row && row.id === ed.id) { var r = ed.chosen != null ? {ok:true, v:ed.chosen} : SH.toVal(col, txt); if (!r.ok) say(r.msg, 'e'); else SH.setVal(row, col, r.v); }
      SH.paint(); if (!noFocus) SH.focus();
    },
    clearRange: function(){
      var g = SH.range(); if (!g) return; var n = 0;
      for (var r = g.r0; r <= g.r1; r++) for (var c = g.c0; c <= g.c1; c++) if (SH.editable(r, c)) {
        var col = SH.cols()[c]; if (col.k === 'acct') continue; SH.setVal(SH.view[r], col, ''); n++; }
      if (n) SH.paint();
    },
    fillDown: function(){
      var g = SH.range(); if (!g || g.r0 === g.r1) return;
      for (var c = g.c0; c <= g.c1; c++) { if (!SH.editable(g.r0, c)) continue; var col = SH.cols()[c], v = SH.rawVal(SH.view[g.r0], col);
        for (var r = g.r0 + 1; r <= g.r1; r++) if (SH.editable(r, c)) SH.setVal(SH.view[r], col, v == null ? '' : v); }
      SH.paint();
    },
    onCopy: function(e){
      if (SH.edit || !SH.sel) return; var g = SH.range(), cols = SH.cols(), lines = [];
      for (var r = g.r0; r <= g.r1; r++) { var a = []; for (var c = g.c0; c <= g.c1; c++) { var col = cols[c], v = col.ty === 'num' ? (SH.rawVal(SH.view[r], col) == null ? '' : SH.rawVal(SH.view[r], col)) : SH.shown(SH.view[r], col); a.push(String(v).replace(/[\t\n\r]/g, ' ')); } lines.push(a.join('\t')); }
      e.clipboardData.setData('text/plain', lines.join('\r\n')); e.preventDefault();
      say((g.r1 - g.r0 + 1) + '줄 × ' + (g.c1 - g.c0 + 1) + '칸 복사');
    },
    onPaste: function(e){
      if (SH.edit || !SH.sel) return; e.preventDefault();
      var txt = (e.clipboardData.getData('text/plain') || '').replace(/\r/g, ''); if (!txt) return;
      var rows = txt.split('\n'); if (rows.length > 1 && rows[rows.length - 1] === '') rows.pop();
      var g = SH.range(), single = rows.length === 1 && rows[0].indexOf('\t') < 0, cols = SH.cols(), n = 0, bad = 0, skip = 0;
      var put = function(r, c, t){ if (r >= SH.view.length || c >= cols.length) return; if (!SH.editable(r, c)) { skip++; return; } var x = SH.toVal(cols[c], t); if (!x.ok) { bad++; return; } SH.setVal(SH.view[r], cols[c], x.v); n++; };
      if (single && g && (g.r0 !== g.r1 || g.c0 !== g.c1)) { for (var r = g.r0; r <= g.r1; r++) for (var c = g.c0; c <= g.c1; c++) put(r, c, rows[0]); }
      else rows.forEach(function(line, i){ line.split('\t').forEach(function(t, j){ put(SH.sel.r + i, SH.sel.c + j, t); }); });
      SH.paint(); say('붙여넣기 ' + n + '칸' + (skip ? ' · 원본이라 건너뜀 ' + skip + '칸' : '') + (bad ? ' · 목록에 없어 못 넣음 ' + bad + '칸' : ''), bad ? 'e' : 'i');
    },

     
    save: function(){
      SH.commitEdit();
      var keys = Object.keys(SH.dirty); if (!keys.length || SH._saving) return;
      var items = keys.map(function(k){ var i = k.lastIndexOf('|'); return {id:k.slice(0, i), col:k.slice(i + 1), val:SH.dirty[k]}; });
      SH._saving = true; var sv = document.getElementById('sh_save'); if (sv) { sv.disabled = true; sv.textContent = '저장 중…'; }
      client().rpc('ceo_sheet_save', {p_sheet: SH.sheet, p_items: items}).then(function(res){
        SH._saving = false;
        if (res.error) { say('저장 실패: ' + res.error.message, 'e'); SH.paint(); return; }
        var d = res.data || {};
        if (d.msg) { say(d.msg, 'e'); SH.paint(); return; }
        var errs = d.errors || [];
        if (errs.length) say('저장 ' + d.saved + '칸 · 못 한 칸 ' + errs.length + '개: ' + errs.slice(0, 3).map(function(x){ return x.msg; }).join(' / '), 'e');
        else say('저장했습니다 (' + d.saved + '칸)', 's');
        var keep = {}; errs.forEach(function(x){ var k = x.id + '|' + x.col; if (k in SH.dirty) keep[k] = SH.dirty[k]; });
        SH.flash = {}; Object.keys(SH.dirty).forEach(function(k){ if (!(k in keep)) SH.flash[k] = 1; });
        var sel = SH.sel, top = document.getElementById('sh_wrap').scrollTop;
        var c = client(); c.rpc('ceo_sheet_load', {p_sheet: SH.sheet, p_from: SH.from, p_to: SH.to}).then(function(r2){
          if (r2.data && r2.data.ok) { SH.data = r2.data; }
          SH.dirty = keep; SH.sel = sel; SH.paint(); SH.flash = null; document.getElementById('sh_wrap').scrollTop = top; SH.focus();
          if (SH.logOpen) SH.loadLog();
        });
      });
    },
    toggleLog: function(){ SH.logOpen = !SH.logOpen; var el = document.getElementById('sh_log'); if (!el) return; el.style.display = SH.logOpen ? 'block' : 'none'; if (SH.logOpen) SH.loadLog(); },
    loadLog: function(){
      var el = document.getElementById('sh_log'); if (!el) return; el.innerHTML = '<div style="padding:10px">불러오는 중…</div>';
      client().rpc('ceo_sheet_log', {p_sheet: SH.sheet, p_limit: 80}).then(function(res){
        var d = res.data || {}; if (res.error || !d.ok) { el.innerHTML = '<div style="padding:10px">이력을 못 불러왔습니다</div>'; return; }
        var colT = {}; SH.cols().forEach(function(c){ colT[c.k] = c.t; });
        var rowOf = {}; ((SH.data && SH.data.rows) || []).forEach(function(r){ rowOf[r.id] = r; });
        el.innerHTML = '<div style="display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #e2e8f0"><b>변경 이력 (최근 80)</b><a href="javascript:void 0" data-x="1">닫기</a></div>' +
          (d.rows.length ? '<table><tr><th>때</th><th>줄</th><th>칸</th><th>전 → 후</th><th></th></tr>' + d.rows.map(function(g){
            var r = rowOf[g.id], label = r ? (r.date || '') + ' ' + (r.cp || r.cp_nm || r.name || '') : g.id;
            var at = new Date(g.at); var when = (at.getMonth() + 1) + '/' + at.getDate() + ' ' + String(at.getHours()).padStart(2,'0') + ':' + String(at.getMinutes()).padStart(2,'0');
            var btn = g.undone_at ? '<span style="color:#94a3b8">되돌림</span>' : g.undo_of ? '<span style="color:#94a3b8">되돌리기 기록</span>' : '<a href="javascript:void 0" data-u="' + g.log_id + '">되돌리기</a>';
            return '<tr><td>' + when + '</td><td title="' + esc(g.id) + '">' + esc(label) + '</td><td>' + esc(colT[g.col] || g.col) + '</td><td>' + esc(g.before || '(빈칸)') + ' → ' + esc(g.after || '(빈칸)') + '</td><td>' + btn + '</td></tr>';
          }).join('') + '</table>' : '<div style="padding:10px">아직 고친 기록이 없습니다</div>');
        el.onclick = function(e){
          var a = e.target.closest('a'); if (!a) return;
          if (a.dataset.x) { SH.toggleLog(); return; }
          if (a.dataset.u) { if (SH.nDirty()) { say('저장 안 한 칸이 있어 되돌릴 수 없습니다. 먼저 저장하거나 취소해 주십시오', 'e'); return; }
            client().rpc('ceo_sheet_undo', {p_log_id: +a.dataset.u}).then(function(r){ var x = r.data || {}; if (r.error || !x.ok) say('되돌리기 실패: ' + ((r.error && r.error.message) || x.msg || ((x.errors || [])[0] || {}).msg || ''), 'e'); else say('되돌렸습니다', 's'); SH.load(); }); }
        };
      });
    },
    csv: function(){
      if (!SH.data) return; var cols = SH.cols();
      var q = function(s){ s = String(s == null ? '' : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      var lines = [cols.map(function(c){ return q(c.t); }).join(',')];
      SH.view.forEach(function(r){ lines.push(cols.map(function(c){ var v = c.ty === 'num' ? SH.rawVal(r, c) : SH.shown(r, c); return q(v); }).join(',')); });
      var name = (SHEETS.find(function(s){ return s.k === SH.sheet; }) || {}).t;
      var blob = new Blob(['﻿' + lines.join('\r\n')], {type:'text/csv;charset=utf-8'});
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'BVS_' + name + '_' + SH.from.replace(/-/g,'').slice(2) + '_' + SH.to.replace(/-/g,'').slice(2) + '.csv';
      document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
  };


   
  (function(){
    var FR = {
      btn: function(){
        if (!owner()) return;
        var all = [].slice.call(document.querySelectorAll('button'));
        var anchor = all.find(function(b){ return (b.textContent || '').trim() === '명단 복사' && b.offsetParent; });
        if (!anchor || anchor.parentNode.querySelector('.fr9250')) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = (anchor.className || '') + ' fr9250';
        b.textContent = '카톡 보고'; b.title = '고객사 보고용 투입현황 문구 만들기·복사';
        b.style.cssText = 'margin-left:4px;background:#fee500;border:1px solid #e5cc00;color:#191919;font-weight:700';
        b.onclick = function(e){ e.preventDefault(); e.stopPropagation(); FR.open(anchor); };
        anchor.parentNode.insertBefore(b, anchor.nextSibling);
      },
      day: function(anchor){
        var pg = anchor.closest('.page') || document;
        var d = [].slice.call(pg.querySelectorAll('input[type="date"]')).map(function(x){ return x.value; }).filter(Boolean)[0];
        return d || kstToday();
      },
      open: function(anchor){
        var d = FR.day(anchor), c = client(); if (!c) { say('로그인 연결을 찾지 못했습니다', 'e'); return; }
        c.rpc('ceo_field_report_text', {p_date: d}).then(function(res){
          var r = res.data || {};
          if (res.error || !r.ok) { say('보고 문구를 못 만들었습니다: ' + ((res.error && res.error.message) || r.msg || ''), 'e'); return; }
          if (!r.items || !r.items.length) { say(r.msg || '이날 고객사 청구 출역이 없습니다'); return; }
          FR.show(r);
        });
      },
      copy: function(txt){
        var done = function(){ say('복사했습니다 — 카톡 창에 붙여넣기(Ctrl+V) 하십시오', 's'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function(){ FR.copyOld(txt); done(); });
        else { FR.copyOld(txt); done(); }
      },
      copyOld: function(txt){ var t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch(e){} t.remove(); },
      show: function(r){
        var old = document.getElementById('fr9250'); if (old) old.remove();
        var w = document.createElement('div'); w.id = 'fr9250';
        w.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.35);z-index:9999;display:flex;align-items:center;justify-content:center';
        w.innerHTML = '<div style="background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.25);width:min(560px,94vw);max-height:90vh;overflow:auto;padding:16px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:15px">카톡 보고 · ' + esc(r.head) + '</b><button type="button" data-x="1" class="sh-btn">닫기</button></div>' +
          r.items.map(function(it, i){
            var rows = String(it.text).split('\n').length + 1;
            return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-weight:700">' + esc(it.partner) + ' · ' + it.n + '명</span>' +
              '<button type="button" class="sh-btn pri" data-c="' + i + '">복사</button></div>' +
              '<textarea data-t="' + i + '" rows="' + rows + '" style="width:100%;box-sizing:border-box;font-family:inherit;font-size:13px;line-height:1.5;border:1px solid #cbd5e1;border-radius:6px;padding:8px;resize:vertical">' + esc(it.text) + '</textarea></div>';
          }).join('') +
          '<div style="font-size:11px;color:#64748b">글자를 고친 뒤 「복사」하면 고친 그대로 복사됩니다 · 청구처 없는 사내·본사업무 출역은 빠집니다</div></div>';
        document.body.appendChild(w);
        w.addEventListener('click', function(e){
          if (e.target === w || e.target.closest('[data-x]')) { w.remove(); return; }
          var b = e.target.closest('[data-c]'); if (b) { var ta = w.querySelector('textarea[data-t="' + b.dataset.c + '"]'); FR.copy(ta.value); }
        });
        var first = w.querySelector('[data-c="0"]'); if (first) first.focus();
      }
    };
    SH.fieldReport = FR;
    var tm = null;
    var kick = function(){ clearTimeout(tm); tm = setTimeout(FR.btn, 150); };
    var watch = function(n){ if (!document.body) { if ((n || 0) < 60) setTimeout(function(){ watch((n || 0) + 1); }, 500); return; }
      new MutationObserver(kick).observe(document.body, {childList:true, subtree:true}); kick(); };
    watch(0);
  })();
  window.SH9250 = SH;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', SH.init); else SH.init();
})();
