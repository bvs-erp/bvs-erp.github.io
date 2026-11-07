(function () {
  'use strict';
  if (window.NAV9268) return;
  var SHEET = { hr_info: 'hr', hr_pay: 'pay', op_labor: 'labor', sd_quote: 'doc', sd_partner: 'ptn', fi_bank: 'bank', fi_card: 'card', ac_einv: 'tax' };
  var SEL = null;   // 지금 왼쪽에서 고른 엑셀표 메뉴(엑셀표 화면에 있는 동안만)

  function owner() { try { return typeof isOwner === 'function' ? !!isOwner() : !!(window.ST && ST.owner); } catch (e) { return false; } }
  function wsOf(k) {
    try { var L = typeof wsList === 'function' ? wsList() : (window.WS || []);
      for (var i = 0; i < L.length; i++) { var v = wsViews(L[i]) || []; for (var j = 0; j < v.length; j++) if (v[j][0] === k) return L[i].id; } } catch (e) {}
    return null;
  }
  function onSheet() { var p = document.getElementById('p-sh9250'); return !!(p && p.classList.contains('on')); }
  function fix() {
    var box = document.getElementById('u66'); if (!box) return;
    if (!SEL || !onSheet()) { SEL = null; return; }
    var want = box.querySelector('.i[data-k="' + SEL + '"]'); if (!want) return;
    box.querySelectorAll('.i.on').forEach(function (e) { if (e !== want) e.classList.remove('on'); });
    want.classList.add('on');
    var hs = box.querySelectorAll('.h'); hs.forEach(function (h) { if (h.textContent === '열린 화면') { var n = h.nextElementSibling, s = h.previousElementSibling; if (n) n.remove(); if (s && s.classList.contains('sp')) s.remove(); h.remove(); } });
  }

  var go0 = window.go;
  if (typeof go0 === 'function') {
    window.go = function (k) {
      if (SHEET[k] && window.SH9250 && typeof SH9250.open === 'function' && owner()) {
        var w = wsOf(k); if (w && window.SH) SH.ws = w;
        SEL = k;
        SH9250.open(SHEET[k]);
        try { if (typeof shTabs === 'function') shTabs(); } catch (e) {}
        setTimeout(fix, 0); setTimeout(fix, 400);
        return;
      }
      SEL = null;
      return go0.apply(this, arguments);
    };
  }
  var st0 = window.shTabs;
  if (typeof st0 === 'function') window.shTabs = function () { var r = st0.apply(this, arguments); try { fix(); } catch (e) {} return r; };
  new MutationObserver(function () { if (SEL) fix(); }).observe(document.getElementById('sb') || document.body, { childList: true, subtree: true });

  window.NAV9268 = { map: SHEET, fix: fix };
})();
