

(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var isWorker = !!$('gateThemeBtn') || !!document.querySelector('#gate #loginCard input#email[autocomplete="username"][inputmode="email"]');
  var isErp = !!$('steplogin');
  if (!isWorker && !isErp) return;

  var css = document.createElement('style');
  css.textContent =
    '.g9-brand{text-align:center;margin:30px 0 22px}' +
    '.g9-mark{height:58px;width:auto;display:block;margin:0 auto 14px}' +
    '.g9-tag{font-family:Poppins,"Segoe UI",Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.01em;line-height:1.2;color:var(--tx,#E5EDF9)}' +
    '.g9-tag b{color:#489ADA;font-weight:700}' +
    '#extLink,#extCard{display:none!important}' +
    '.gate-theme-wrap{display:flex;justify-content:flex-end}' +
    '.gate-theme-btn{background:var(--sf,transparent);color:var(--tx2,inherit);border:1px solid var(--ln,rgba(128,128,128,.35));border-radius:20px;padding:6px 14px;font-size:12.5px;cursor:pointer}' +
    '#loginCard .g9-erp-only{display:none}';
  document.head.appendChild(css);

  function brandHtml() {
    var lg = document.querySelector('img.lg');
    var img = lg && lg.getAttribute('src') ? '<img class="g9-mark" alt="BVS" src="' + lg.getAttribute('src') + '">' : '';
    return img + '<div class="g9-tag"><b>B</b>uild. <b>V</b>erify. <b>S</b>upport.</div>';
  }
  function setFavicon() {
    var lg = document.querySelector('img.lg');
    if (!lg) return;
    var l = document.querySelector('link[rel="icon"]');
    if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
    l.type = 'image/svg+xml'; l.href = lg.getAttribute('src');
  }

  function hardSignOut() {
    var done = function () {
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (/^sb-.+-auth-token(-code-verifier)?$/.test(k) || k === 'sb-tokens' || k === 'bvs_page' || k === 'bvs_menu') localStorage.removeItem(k);
        }
        sessionStorage.clear();
      } catch (e) {}
      location.replace(location.pathname);
    };
    var cl = window.sb;
    if (!cl || !cl.auth) return done();
    try { cl.auth.stopAutoRefresh && cl.auth.stopAutoRefresh(); } catch (e) {}
    var t = new Promise(function (r) { setTimeout(r, 2500); });
    var s = Promise.resolve().then(function () { return cl.auth.signOut(); }).catch(function () {});
    return Promise.race([s, t]).then(done, done);
  }

  if (isWorker) {
    try {
      if (!localStorage.getItem('bvs_w_theme_v2')) {
        localStorage.setItem('bvs_w_theme_v2', '1');
        if (typeof window.applyTheme === 'function') window.applyTheme('light');
      }
    } catch (e) {}
    document.title = 'BVS 데일리';
    setFavicon();
    var h1 = Array.prototype.find.call(document.querySelectorAll('#gate h1'), function (h) { return /비브이에스/.test(h.textContent); });
    if (h1 && h1.parentNode) { h1.parentNode.className = 'g9-brand'; h1.parentNode.removeAttribute('style'); h1.parentNode.innerHTML = brandHtml(); }
    var lc = $('loginCard');
    if (lc) {
      Array.prototype.forEach.call(lc.children, function (c) { if (/투입 공수/.test(c.textContent) && !c.querySelector('input')) c.remove(); });
      var em = $('email'), pw = $('pw');
      if (em) {
        em.type = 'text'; em.removeAttribute('inputmode'); em.placeholder = '이메일 또는 전화번호';
        var lb = em.parentNode && em.parentNode.querySelector('label'); if (lb) lb.textContent = '아이디';
      }
      if (pw) pw.placeholder = '비밀번호';
    }
    var origLogin = window.doLogin;
    window.doLogin = async function () {
      var raw = String(($('email') || {}).value || '').trim();
      var digits = raw.replace(/[^0-9]/g, '');
      if (raw && /^[0-9\-\s]+$/.test(raw) && /^0\d{8,10}$/.test(digits) && typeof window.extLogin === 'function' && $('extPhone') && $('extPin')) {
        var m = $('lmsg');
        $('extPhone').value = digits; $('extPin').value = String(($('pw') || {}).value || '').trim();
        if ($('pw')) $('pw').value = '';
        if (m) m.textContent = '확인 중…';
        try { await window.extLogin(); } catch (e) {}
        try { localStorage.setItem('bvs_tray_ext_phone', digits); } catch (e) {}
        var em2 = $('extMsg');
        if (m) m.innerHTML = (window.EXT && EXT.on) ? '' : ((em2 && em2.innerHTML && em2.textContent !== '확인 중…') ? em2.innerHTML.replace('PIN은 숫자 6자리입니다', '협력사는 비밀번호 자리에 PIN 6자리를 넣어 주세요') : '<span class="neg">전화번호 또는 PIN을 확인해 주세요</span>');
        return;
      }
      return origLogin.apply(this, arguments);
    };
    var origOut = window.doLogout;
    window.doLogout = async function () {
      if (window.EXT && EXT.on && typeof origOut === 'function') return origOut.apply(this, arguments);
      return hardSignOut();
    };
  }

  if (isErp) {
    try { if (!localStorage.getItem('bvs_theme') && typeof window.applyTheme === 'function') window.applyTheme('light'); } catch (e) {}
    setFavicon();
    var card = $('loginCard');
    if (card) {
      var h = card.querySelector('h1'), sub = card.querySelector('p.sub');
      if (h) { var d = document.createElement('div'); d.className = 'g9-brand'; d.innerHTML = brandHtml(); h.replaceWith(d); }
      if (sub) sub.remove();
      Array.prototype.forEach.call(card.querySelectorAll('button.lnk'), function (b) { if (/키 다시 입력/.test(b.textContent)) b.style.display = 'none'; });
    }
    window.doLogout = async function () {
      var ok = true;
      try { if (typeof window.ask === 'function') ok = await window.ask('로그아웃', '로그아웃 하시겠습니까?'); } catch (e) {}
      if (!ok) return;
      try { if (window.CK991) CK991.cache = {}; } catch (e) {}
      return hardSignOut();
    };
  }
})();
