




(function () {
  'use strict';
  if (window.ADDR9261) return;
  var SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  var loading = null;
  function lib() {
    if (window.daum && window.daum.Postcode) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = SRC; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { loading = null; no(new Error('주소 검색을 불러오지 못했습니다(인터넷 확인)')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  var css = document.createElement('style');
  css.textContent =
    '#ad9261{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}' +
    '#ad9261 .bx{background:var(--sf,#fff);color:var(--tx,#111);width:min(520px,94vw);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3);overflow:hidden}' +
    '#ad9261 .hd{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;font-weight:700;border-bottom:1px solid var(--ln,#ddd)}' +
    '#ad9261 .hd button{border:0;background:none;font-size:20px;cursor:pointer;color:inherit}' +
    '#ad9261 .pc{height:460px}' +
    '#ad9261 .dt{padding:14px;display:none}#ad9261 .dt .a{font-size:14px;margin-bottom:8px}' +
    '#ad9261 .dt input{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid var(--ln,#ccc);border-radius:8px;font-size:14px;margin-bottom:10px;background:var(--bg,#fff);color:inherit}' +
    '#ad9261 .dt button{width:100%;padding:10px;border:0;border-radius:8px;background:#1F5FD1;color:#fff;font-weight:700;font-size:14px;cursor:pointer}' +
    '.ad9261-btn{margin-left:6px;padding:0 10px;height:30px;border:1px solid var(--ln,#ccc);border-radius:6px;background:var(--sf,#fff);color:var(--tx2,#333);font-size:12.5px;cursor:pointer;white-space:nowrap}';
  document.head.appendChild(css);

  function close() { var m = document.getElementById('ad9261'); if (m) m.remove(); }
  
  function open(cb, initial) {
    close();
    var m = document.createElement('div'); m.id = 'ad9261';
    m.innerHTML = '<div class="bx"><div class="hd"><span>주소 찾기</span><button type="button" aria-label="닫기">×</button></div>' +
      '<div class="pc"></div><div class="dt"><div class="a"></div><input placeholder="상세주소 (동·호수 등, 없으면 비워 두기)"><button type="button">넣기</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('.hd button').onclick = close;
    m.addEventListener('mousedown', function (e) { if (e.target === m) close(); });
    lib().then(function () {
      new window.daum.Postcode({
        oncomplete: function (d) {
          var base = d.roadAddress || d.jibunAddress || d.address || '';
          var extra = d.buildingName && d.apartment === 'Y' ? d.buildingName : (d.bname && /[동로가]$/.test(d.bname) ? d.bname : '');
          if (d.buildingName && d.apartment !== 'Y') extra = extra ? extra + ', ' + d.buildingName : d.buildingName;
          var full = '(' + d.zonecode + ') ' + base + (extra ? ' (' + extra + ')' : '');
          m.querySelector('.pc').style.display = 'none';
          var dt = m.querySelector('.dt'); dt.style.display = 'block'; dt.querySelector('.a').textContent = full;
          var inp = dt.querySelector('input'); inp.focus();
          var go = function () { var v = inp.value.trim(); close(); cb(full + (v ? ' ' + v : '')); };
          dt.querySelector('button').onclick = go;
          inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } if (e.key === 'Escape') close(); });
        },
        width: '100%', height: '100%'
      }).embed(m.querySelector('.pc'), { q: initial || '', autoClose: false });
    }).catch(function (e) { close(); alertish(e.message); });
  }
  function alertish(msg, kind) { if (typeof window.toast === 'function') window.toast(msg, kind || 'e'); else if (typeof window.say === 'function') window.say(msg, kind || 'e'); else console.warn(msg); }

  
  var RX = /(^|_)(addr|address)$/i;
  function attach(inp) {
    if (!inp || inp.dataset.ad9261 || inp.type === 'hidden' || !RX.test(inp.id || inp.name || '')) return;
    inp.dataset.ad9261 = '1';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ad9261-btn'; b.textContent = '주소 찾기';
    b.onclick = function () { open(function (v) { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }, ''); };
    var p = inp.parentNode;
    if (p && getComputedStyle(p).display !== 'flex') { var w = document.createElement('div'); w.style.cssText = 'display:flex;align-items:center'; p.insertBefore(w, inp); w.appendChild(inp); w.appendChild(b); inp.style.flex = '1'; }
    else if (p) p.insertBefore(b, inp.nextSibling);
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('input') : []).forEach(attach); }
  scan(document);
  new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.tagName === 'INPUT') attach(n); else scan(n); } }); }); })
    .observe(document.body, { childList: true, subtree: true });

  
  function sheetAddr() {
    var SH = window.SH9250; if (!SH) return;
    var cols = SH.cols(), ci = -1;
    for (var i = 0; i < cols.length; i++) if (cols[i].k === 'address') { ci = i; break; }
    if (ci < 0) return alertish('이 시트에는 주소 칸이 없습니다');
    if (!SH.sel || !SH.view[SH.sel.r]) return alertish('주소를 넣을 줄을 먼저 눌러 주십시오');
    var row = SH.view[SH.sel.r], col = cols[ci];
    open(function (v) { SH.setVal(row, col, v); SH.sel = { r: SH.sel.r, c: ci }; SH.paint(); alertish('주소를 넣었습니다. Ctrl+S로 저장하십시오', 'g'); }, '');
  }
  async function bizCheck() {
    var cl = window.sb; if (!cl || !cl.functions) return alertish('로그인 연결을 확인해 주십시오');
    alertish('국세청에 거래처 상태를 묻는 중…', 'i');
    try {
      var r = await cl.functions.invoke('biz-status', { body: { mode: 'all' } });
      var d = r.data || {};
      if (r.error || !d.ok) return alertish('국세청 조회 실패: ' + ((d && d.error) || (r.error && r.error.message) || ''));
      var c = d.counts || {}, parts = Object.keys(c).map(function (k) { return k + ' ' + c[k]; });
      alertish('국세청 상태 확인 ' + d.checked + '곳 — ' + parts.join(' · '), 'g');
      if (window.SH9250 && SH9250.sheet === 'ptn' && typeof SH9250.load === 'function') SH9250.load();
    } catch (e) { alertish('국세청 조회 실패: ' + e.message); }
  }
  function tools() {
    var SH = window.SH9250;
    if (!SH || typeof SH.addTool !== 'function') return false;
    if (SH._ad9261) return true; SH._ad9261 = true;
    SH.addTool('ptn', '주소 찾기', sheetAddr);
    SH.addTool('hr', '주소 찾기', sheetAddr);
    SH.addTool('ptn', '국세청 상태 확인', bizCheck);
    return true;
  }
  if (!tools()) { var n = 0, t = setInterval(function () { if (tools() || ++n > 40) clearInterval(t); }, 250); }

  window.ADDR9261 = { open: open, attach: attach, bizCheck: bizCheck, sheetAddr: sheetAddr };
})();
