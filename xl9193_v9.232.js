/**
 * ═══════════════════════════════════════════════════════════════════════════
 * xl9193.js — 「엑셀표」 엑셀처럼 바로 고치는 표 (v9.193)
 * [C1414-대표지시] 급여 · 청구(인건비 · 자재비) 실시간 스프레드시트 편집기
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function(){
  'use strict';

  var XL = {
    curSheet: 'mat',

    sortMode: 'default',
    setSort: function(mode) {
      XL.sortMode = mode;
      var cols = (XL.data && XL.data.cols) || [];
      if (mode === 'default') {
        XL.sortCol = null;
        XL.sortAsc = true;
      } else if (mode === 'name') {
        // 이름/작업자/품명 컬럼 탐색
        var col = cols.find(function(c){
          var k = (c.k||'').toLowerCase(), l = (c.label||'').toLowerCase();
          return k.indexOf('name') >= 0 || k.indexOf('person') >= 0 || k.indexOf('emp') >= 0 || k.indexOf('worker') >= 0 ||
                 l.indexOf('이름') >= 0 || l.indexOf('성명') >= 0 || l.indexOf('작업자') >= 0 || l.indexOf('품명') >= 0;
        });
        if (col) {
          XL.sortCol = col.k;
          XL.sortAsc = true;
        }
      } else if (mode === 'site') {
        // 현장/프로젝트 컬럼 탐색
        var col = cols.find(function(c){
          var k = (c.k||'').toLowerCase(), l = (c.label||'').toLowerCase();
          return k.indexOf('site') >= 0 || k.indexOf('project') >= 0 || k.indexOf('place') >= 0 ||
                 l.indexOf('현장') >= 0 || l.indexOf('프로젝트') >= 0;
        });
        if (col) {
          XL.sortCol = col.k;
          XL.sortAsc = true;
        }
      }
      XL.updateSortBtns();
      XL.renderBody();
    },

    updateSortBtns: function() {
      var grp = document.getElementById('xl9193_sort_grp');
      if (!grp) return;
      var cur = XL.sortMode || 'default';
      grp.querySelectorAll('.xl-sort-btn').forEach(function(btn){
        var m = btn.getAttribute('data-m');
        if (m === cur) {
          btn.style.background = '#2563eb';
          btn.style.color = '#ffffff';
          btn.style.borderColor = '#1d4ed8';
          btn.style.fontWeight = '700';
        } else {
          btn.style.background = '#ffffff';
          btn.style.color = '#475569';
          btn.style.borderColor = '#cbd5e1';
          btn.style.fontWeight = '500';
        }
      });
    },
   // 'mat' | 'labor' | 'pay'
    curYm: '',         // 'YYYY-MM'
    curPartner: 'C0087', // 우주이엔지 기본
    data: null,        // {cols, rows, sums, bill}
    filter: {},        // colKey -> string
    sortCol: null,
    sortAsc: true,
    historyLogs: [],
    selectedCell: null, // {rowId, colKey, el}
    editCell: null,     // {rowId, colKey, el, origVal}
    historyOpen: false,

    init: function() {
      if (typeof isOwner !== 'function' || !isOwner()) {
        // v9.196: 페이지가 열릴 때는 로그인(세션 복원)이 아직 안 끝나 isOwner()가 false — 1초마다 다시 봄(30분까지). 대표가 아니면 끝까지 UI 노출 안 함
        XL._initTry = (XL._initTry || 0) + 1;
        if (XL._initTry <= 1800) setTimeout(XL.init, 1000);
        return;
      }
      if (XL._inited) return;
      XL._inited = true;

      // 마감 안 된 가장 이른 대상 달 (지난달 기본, 예: 2026-10)
      var now = new Date();
      var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      var pm = String(prev.getMonth() + 1).padStart(2, '0');
      XL.curYm = prev.getFullYear() + '-' + pm;

      XL.injectNav();
      XL.injectPage();
      XL.wrapNav();
    },

        injectNav: function() {
      // 1. 콕핏 처리/현황 영역 내 버튼 주입 (기존 호환)
      try {
        var todoSec = document.getElementById('sec-todo') || document.querySelector('.sec-todo');
        if (todoSec && !document.getElementById('btnCockpitXl9193')) {
          var head = todoSec.querySelector('.sttl, .sec-title, h3, h4') || todoSec;
          var btn = document.createElement('button');
          btn.id = 'btnCockpitXl9193';
          btn.type = 'button';
          btn.className = 'btn-sm';
          btn.style.cssText = 'margin-left:8px;padding:3px 9px;font-size:12px;font-weight:600;background:#059669;color:#fff;border:none;border-radius:4px;cursor:pointer;vertical-align:middle;';
          btn.innerHTML = '📊 «엑셀표»';
          btn.onclick = function() { XL.open(); };
          head.appendChild(btn);
        }
      } catch(e) {}

      // 2. 상단 modbar (1콕핏 2휴먼 3딜 4캐시플로우 옆) 에 «엑셀표» 버튼 추가
      try {
        var mb = document.getElementById('modbar');
        if (mb && !document.getElementById('btnModXl9193')) {
          var xlModBtn = document.createElement('button');
          xlModBtn.id = 'btnModXl9193';
          xlModBtn.type = 'button';
          xlModBtn.className = 'mod-btn ws-btn';
          xlModBtn.style.cssText = 'color:#059669!important;font-weight:700!important;border:1px solid #10b981;border-radius:4px;margin-left:4px;';
          xlModBtn.innerHTML = '<span class="ws-n" style="background:#059669;color:#fff;">XL</span>«엑셀표»';
          xlModBtn.title = '대표 전용 실시간 엑셀표 (클릭하여 열기)';
          xlModBtn.onclick = function() { XL.open(); };
          mb.appendChild(xlModBtn);
        }
      } catch(e) {}

      // 3. shTabs 래핑: 1콕핏·3사이트(딜)·4캐시플로우 하단 서브탭(mtabs) 맨 끝에 «엑셀표» 탭 자동 부착
      try {
        if (typeof window.shTabs === 'function' && !window.shTabs._xlWrapped) {
          var _origShTabs = window.shTabs;
          window.shTabs = function() {
            _origShTabs.apply(this, arguments);
            try {
              var tb = document.getElementById('mtabs');
              if (tb && typeof isOwner === 'function' && isOwner()) {
                if (!tb.querySelector('.mtab-xl9193')) {
                  var xlTab = document.createElement('div');
                  xlTab.className = 'mtab mtab-xl9193';
                  xlTab.style.cssText = 'color:#059669;font-weight:700;cursor:pointer;margin-left:auto;padding:0 12px;background:rgba(5,150,105,0.08);border-radius:4px;display:inline-flex;align-items:center;gap:4px;';
                  xlTab.innerHTML = '📊 <span>«엑셀표»</span>';
                  xlTab.title = '자재·인건비·급여 실시간 엑셀 그리드 (클릭하여 열기)';
                  xlTab.onclick = function(e) {
                    e.stopPropagation();
                    XL.open();
                  };
                  tb.appendChild(xlTab);
                }
              }
            } catch(e) { console.error('[XL-SHTABS-ERR]', e); }
          };
          window.shTabs._xlWrapped = true;
          window.shTabs();
        }
      } catch(e) {}

      // 4. cpItems (Ctrl + K) 래핑: 검색창 최상단에 «엑셀표» 노출
      try {
        if (typeof window.cpItems === 'function' && !window.cpItems._xlWrapped) {
          var _origCpItems = window.cpItems;
          window.cpItems = function(q) {
            var out = _origCpItems.apply(this, arguments);
            try {
              if (typeof isOwner === 'function' && isOwner()) {
                var query = (q || '').toLowerCase();
                if (!query || '엑셀표 실시간 수정 저장 자재 인건비 급여 xl sheet'.indexOf(query) >= 0) {
                  out.unshift({
                    g: '대표',
                    t: '«엑셀표» (실시간 수정·저장)',
                    sub: '자재·인건비·급여 엑셀 그리드 (XL.open)',
                    run: function() { XL.open(); }
                  });
                }
              }
            } catch(e) { console.error('[XL-CPITEMS-ERR]', e); }
            return out;
          };
          window.cpItems._xlWrapped = true;
        }
      } catch(e) {}

      // 5. 트레이 청구창 (rb811Paint) 래핑: 트레이 M단가 환산 및 전산볼트 3M 환산 표시 보강
      try {
        if (typeof window.rb811Paint === 'function' && !window.rb811Paint._xlWrapped) {
          var _origRb811 = window.rb811Paint;
          window.rb811Paint = function() {
            var res = _origRb811.apply(this, arguments);
            try {
              var box = document.getElementById('rb811');
              if (!box || !window.RB811 || !window.RB811.d) return res;
              var lines = window.RB811.d.lines || [];
              var tbody = box.querySelector('table tbody');
              if (!tbody) return res;
              var trs = tbody.querySelectorAll('tr');
              trs.forEach(function(tr, idx) {
                var l = lines[idx];
                if (!l) return;
                var code = String(l.code || '');
                var isTray = /^TRY-(TRAY|COVER|SEP)-/.test(code) || /트레이|커버|세퍼레이터/.test(l.name || '');
                var isRod = /^TRY-ROD-/.test(code) || /전산\s*볼트/.test(l.name || '');

                var tds = tr.querySelectorAll('td');
                if (tds.length < 8) return;
                var tdQty = tds[3];     // 수량
                var tdAlpha = tds[6];   // 재청구 단가

                if (isTray) {
                  var len = 3;
                  var mLen = (l.spec || '').match(/(\d+(?:\.\d+)?)\s*M/i);
                  if (mLen && +mLen[1] > 0) len = +mLen[1];
                  var mQty = Math.round((+l.qty || 0) * len * 100) / 100;
                  var mPrice = (l.alpha != null && len > 0) ? Math.round((+l.alpha) / len) : null;

                  if (tdQty && !tdQty.querySelector('.tray-m-conv')) {
                    var spanQ = document.createElement('div');
                    spanQ.className = 'tiny tray-m-conv';
                    spanQ.style.cssText = 'color:#059669;font-weight:600;margin-top:2px;';
                    spanQ.textContent = '(' + mQty.toLocaleString() + ' M)';
                    tdQty.appendChild(spanQ);
                  }
                  if (tdAlpha && mPrice != null && !tdAlpha.querySelector('.tray-m-conv')) {
                    var spanP = document.createElement('div');
                    spanP.className = 'tiny tray-m-conv';
                    spanP.style.cssText = 'color:#059669;margin-top:2px;';
                    spanP.textContent = '(@' + mPrice.toLocaleString() + '/M)';
                    tdAlpha.appendChild(spanP);
                  }
                } else if (isRod) {
                  var rLen = 3;
                  var rSpec = (l.spec || '').match(/(\d+(?:\.\d+)?)\s*M/i);
                  if (rSpec && +rSpec[1] > 0) rLen = +rSpec[1];
                  var totalM = (+l.qty || 0) * rLen;
                  var conv3mQty = Math.round((totalM / 3) * 100) / 100;

                  if (tdQty && !tdQty.querySelector('.rod-3m-conv')) {
                    var spanQ2 = document.createElement('div');
                    spanQ2.className = 'tiny rod-3m-conv';
                    spanQ2.style.cssText = 'color:#2563eb;font-weight:600;margin-top:2px;';
                    spanQ2.textContent = '(3M환산: ' + conv3mQty.toLocaleString() + '본 / ' + totalM.toLocaleString() + 'M)';
                    tdQty.appendChild(spanQ2);
                  }
                  if (tdAlpha && !tdAlpha.querySelector('.rod-3m-conv')) {
                    var spanP2 = document.createElement('div');
                    spanP2.className = 'tiny rod-3m-conv';
                    spanP2.style.cssText = 'color:#2563eb;margin-top:2px;';
                    spanP2.textContent = '(@2,500/3M)';
                    tdAlpha.appendChild(spanP2);
                  }
                }
              });
            } catch(e) { console.error('[RB811-M-CONV-ERR]', e); }
            return res;
          };
          window.rb811Paint._xlWrapped = true;
        }
      } catch(e) {}
    },

    injectPage: function() {
      if (document.getElementById('p-xl_sheet')) return;

      var p = document.createElement('div');
      p.id = 'p-xl_sheet';
      p.className = 'page';
      p.style.cssText = 'padding:14px;box-sizing:border-box;display:none;flex-direction:column;height:calc(100vh - 60px);overflow:hidden;';

      p.innerHTML = [
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">',
        '  <div style="display:flex;align-items:center;gap:8px;font-size:13px;">',
        '    <label style="font-weight:bold;color:#1e293b;">표 선택:</label>',
        '    <select id="xl9193_sheet_sel" style="padding:4px 8px;border:1px solid #cbd5e1;border-radius:4px;font-weight:600;">',
        '      <option value="mat">청구 - 자재비</option>',
        '      <option value="labor">청구 - 인건비</option>',
        '      <option value="pay">급여 (준비중)</option>',
        '    </select>',
        '    <label style="font-weight:bold;margin-left:6px;color:#1e293b;">대상 월:</label>',
        '    <input type="month" id="xl9193_ym_in" style="padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;" value="' + XL.curYm + '">',
        '    <span id="xl9193_ptn_wrap" style="display:inline-flex;align-items:center;gap:6px;">',
        '      <label style="font-weight:bold;margin-left:6px;color:#1e293b;">거래처:</label>',
        '      <select id="xl9193_ptn_sel" style="padding:4px 8px;border:1px solid #cbd5e1;border-radius:4px;">',
        '        <option value="C0087">우주이엔지</option>',
        '        <option value="C0001">세미티에스</option>',
        '      </select>',
        '    </span>',
        '    <button type="button" id="xl9193_reload_btn" style="padding:4px 10px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;cursor:pointer;font-size:12px;font-weight:500;">🔄 새로고침</button>',
        '  </div>',
        '  <div style="display:flex;align-items:center;gap:8px;">',
        '    <span style="font-size:11px;color:#64748b;">(칸 클릭 후 바로 수정 · Tab/Enter 이동 · Ctrl+Z 되돌리기)</span>',
        '    <button type="button" id="xl9193_history_btn" style="padding:4px 10px;background:#3b82f6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">📜 변경 이력</button>',
        '    <button type="button" id="xl9193_close_btn" style="padding:4px 10px;background:#64748b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;margin-left:4px;">✕ 닫기(복귀)</button>',
        '  </div>',
        '</div>',

        '<!-- 청구서 및 합계 요약 바 -->',
        '<div id="xl9193_bill_bar" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;margin-bottom:8px;font-size:13px;display:flex;justify-content:space-between;align-items:center;min-height:36px;">',
        '  <div id="xl9193_bill_info" style="font-weight:500;color:#334155;">청구 정보 로딩 중...</div>',
        '  <div id="xl9193_sums_info" style="font-weight:bold;color:#0f172a;"></div>',
        '</div>',

        '<!-- 메인 그리드 테이블 영역 -->',
        '<div id="xl9193_grid_wrap" style="flex:1;border:1px solid #cbd5e1;border-radius:6px;background:#fff;overflow:auto;position:relative;">',
        '  <table id="xl9193_table" style="width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap;">',
        '    <thead id="xl9193_thead" style="position:sticky;top:0;background:#f1f5f9;z-index:2;box-shadow:0 1px 2px rgba(0,0,0,0.06);"></thead>',
        '    <tbody id="xl9193_tbody"></tbody>',
        '    <tfoot id="xl9193_tfoot" style="position:sticky;bottom:0;background:#f8fafc;font-weight:bold;z-index:1;box-shadow:0 -1px 2px rgba(0,0,0,0.06);"></tfoot>',
        '  </table>',
        '</div>',

        '<!-- 변경 이력 서랍 (우측 슬라이드) -->',
        '<div id="xl9193_drawer" style="position:fixed;top:0;right:-420px;width:400px;height:100%;background:#fff;box-shadow:-3px 0 12px rgba(0,0,0,0.15);z-index:9999;transition:right 0.3s ease;display:flex;flex-direction:column;">',
        '  <div style="padding:14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">',
        '    <h4 style="margin:0;font-size:15px;color:#1e293b;">📜 최근 변경 이력 (최근 50건)</h4>',
        '    <button type="button" id="xl9193_drawer_close" style="background:none;border:none;font-size:18px;cursor:pointer;color:#64748b;">✕</button>',
        '  </div>',
        '  <div id="xl9193_drawer_list" style="flex:1;overflow-y:auto;padding:12px;font-size:12px;"></div>',
        '</div>'
      ].join('');

      var main = document.getElementById('main') || document.body;
      main.appendChild(p);

      // 이벤트 바인딩
      document.getElementById('xl9193_sheet_sel').onchange = function(e) {
        XL.curSheet = e.target.value;
        var ptnWrap = document.getElementById('xl9193_ptn_wrap');
        if (ptnWrap) ptnWrap.style.display = (XL.curSheet === 'pay') ? 'none' : 'inline-flex';
        XL.load();
      };
      document.getElementById('xl9193_ym_in').onchange = function(e) {
        XL.curYm = e.target.value;
        XL.load();
      };
      document.getElementById('xl9193_ptn_sel').onchange = function(e) {
        XL.curPartner = e.target.value;
        XL.load();
      };
      document.getElementById('xl9193_reload_btn').onclick = function() { XL.load(); };
      document.getElementById('xl9193_history_btn').onclick = function() { XL.toggleHistory(); };
      document.getElementById('xl9193_drawer_close').onclick = function() { XL.toggleHistory(false); };
      var closeBtn = document.getElementById('xl9193_close_btn');
      if (closeBtn) {
        closeBtn.onclick = function() {
          XL.hide();
          if (typeof wsBack === 'function') wsBack();
          else if (typeof wsGo === 'function') wsGo((window.SH && window.SH.ws) || 'cockpit');
        };
      }

      // 전역 키보드 조작 (Ctrl+Z, 붙여넣기, 방향키 이동)
      p.addEventListener('keydown', XL.handleKeyDown);
      p.addEventListener('paste', XL.handlePaste);
    },

    // v9.197: 엑셀표 닫기 — 엑셀표 화면을 숨기고 탭 표시를 되돌림
    hide: function() {
      var p = document.getElementById('p-xl_sheet');
      if (p) { p.classList.remove('on'); p.style.display = 'none'; }
      document.querySelectorAll('.page').forEach(function(pg) { if (pg.id !== 'p-xl_sheet' && pg.style.display === 'none') pg.style.display = ''; });
      var mx = document.querySelector('.mtab-xl9193');
      if (mx) mx.classList.remove('on');
    },
    // v9.197: 다른 메뉴·탭(go / wsGo)으로 가면 엑셀표를 자동으로 닫음
    wrapNav: function() {
      ['go', 'wsGo'].forEach(function(fn) {
        var f = window[fn];
        if (typeof f === 'function' && !f._xlWrapped) {
          var w = function() { try { XL.hide(); } catch (e) {} return f.apply(this, arguments); };
          w._xlWrapped = true;
          window[fn] = w;
        }
      });
    },

    open: function() {
      if (typeof isOwner === 'function' && !isOwner()) {
        if (typeof toast === 'function') toast('대표 전용 메뉴입니다.', 'e');
        return;
      }
      // 모든 .page 숨기고 #p-xl_sheet 표시
      document.querySelectorAll('.page').forEach(function(pg) {
        pg.classList.remove('on');
        if (pg.id !== 'p-xl_sheet') pg.style.display = ''; // v9.197: 다른 화면에 display:none을 박지 않음(닫기·탭 이동 때 빈 화면 원인)
      });
      var p = document.getElementById('p-xl_sheet');
      if (p) {
        p.classList.add('on');
        p.style.display = 'flex';
      }
      var ttl = document.getElementById('ttl');
      if (ttl) ttl.textContent = '«엑셀표»';
      var crumb = document.getElementById('crumb');
      if (crumb) crumb.textContent = '대표 전용 · «엑셀표»';

      // 탭 활성화 상태 표시
      var mtabXl = document.querySelector('.mtab-xl9193');
      if (mtabXl) {
        document.querySelectorAll('#mtabs .mtab').forEach(function(t){ t.classList.remove('on'); });
        mtabXl.classList.add('on');
      }

      XL.load();
    },


    load: function() {
      var tbody = document.getElementById('xl9193_tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#64748b;">자료를 불러오는 중입니다...</td></tr>';
      }

      var rpcName = 'ceo_xl_load';
      var params = {
        p_sheet: XL.curSheet,
        p_ym: XL.curYm,
        p_partner: (XL.curSheet === 'pay') ? null : XL.curPartner
      };

      if (!window.sb || !window.sb.rpc) {
        console.warn('[XL9193] sb.rpc not available');
        return;
      }

      window.sb.rpc(rpcName, params).then(function(res) {
        var err = res.error;
        var d = res.data;
        if (err || !d) {
          var msg = (err && err.message) ? err.message : '불러오기 실패';
          if (typeof toastKoErr9172 === 'function') toastKoErr9172(msg);
          else if (typeof toast === 'function') toast(msg, 'e');
          if (tbody) tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#dc2626;">' + (d && d.msg ? d.msg : msg) + '</td></tr>';
          return;
        }

        if (d.ok === false) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#d97706;font-size:14px;">' + (d.msg || '준비 중입니다.') + '</td></tr>';
          return;
        }

        XL.data = d;
        XL.render();
      }).catch(function(ex) {
        console.error('[XL9193] load error', ex);
        if (tbody) tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:40px;color:#dc2626;">네트워크 오류가 발생했습니다.</td></tr>';
      });
    },

    render: function() {
      if (!XL.data) return;
      var cols = XL.data.cols || [];
      var rows = XL.data.rows || [];
      var sums = XL.data.sums || {};
      var bill = XL.data.bill || [];

      // 1. 요약 바 렌더링
      var billInfo = document.getElementById('xl9193_bill_info');
      var sumsInfo = document.getElementById('xl9193_sums_info');

      if (XL.curSheet === 'pay') {
        if (billInfo) billInfo.innerHTML = '<span style="color:#0284c7;">' + XL.curYm + ' 급여 집계</span>';
      } else {
        var billHtml = '<span>이 달 청구서: ';
        if (bill && bill.length > 0) {
          billHtml += bill.map(function(b) {
            return '<b style="color:#0f172a;">' + (b.doc_no || '미발행') + '</b> (공급가: ' + Number(b.supply||0).toLocaleString() + '원 / 세액: ' + Number(b.tax||0).toLocaleString() + '원)' + (b.draft ? ' <span style="color:#d97706;">[임시]</span>' : ' <span style="color:#059669;">[확정]</span>');
          }).join(', ');
        } else {
          billHtml += '<span style="color:#94a3b8;">미발행</span>';
        }
        billHtml += '</span>';
        if (billInfo) billInfo.innerHTML = billHtml;
      }

      if (sumsInfo) {
        var sumParts = [];
        for (var sk in sums) {
          var val = sums[sk];
          sumParts.push(sk + ': ' + (typeof val === 'number' ? val.toLocaleString() + '원' : val));
        }
        sumsInfo.innerHTML = sumParts.length > 0 ? sumParts.join(' · ') : '총 ' + rows.length + '건';
      }

      // 2. 헤더 및 필터줄 렌더링
      var thead = document.getElementById('xl9193_thead');
      var th1 = '<tr><th style="width:36px;padding:6px;border:1px solid #cbd5e1;background:#e2e8f0;text-align:center;">#</th>';
      var th2 = '<tr><th style="padding:3px;border:1px solid #cbd5e1;background:#f8fafc;"></th>';

      cols.forEach(function(c) {
        var sortMark = (XL.sortCol === c.k) ? (XL.sortAsc ? ' ▲' : ' ▼') : '';
        th1 += '<th data-col="' + c.k + '" style="padding:6px 8px;border:1px solid #cbd5e1;cursor:pointer;user-select:none;text-align:' + (c.type==='num'?'right':'left') + ';">' + c.label + sortMark + '</th>';
        th2 += '<th style="padding:2px 4px;border:1px solid #cbd5e1;background:#f8fafc;"><input type="text" data-filter-col="' + c.k + '" value="' + (XL.filter[c.k]||'') + '" style="width:100%;box-sizing:border-box;font-size:11px;padding:2px;border:1px solid #cbd5e1;border-radius:2px;" placeholder="검색"></th>';
      });
      th1 += '</tr>';
      th2 += '</tr>';
      if (thead) {
        thead.innerHTML = th1 + th2;
        thead.querySelectorAll('th[data-col]').forEach(function(th) {
          th.onclick = function() {
            var colKey = this.getAttribute('data-col');
            if (XL.sortCol === colKey) {
              XL.sortAsc = !XL.sortAsc;
            } else {
              XL.sortCol = colKey;
              XL.sortAsc = true;
            }
            XL.renderBody();
          };
        });
        thead.querySelectorAll('input[data-filter-col]').forEach(function(inp) {
          inp.oninput = function() {
            XL.filter[this.getAttribute('data-filter-col')] = this.value.trim().toLowerCase();
            XL.renderBody();
          };
        });
      }

      XL.renderBody();
    },

    renderBody: function() {
      var tbody = document.getElementById('xl9193_tbody');
      var tfoot = document.getElementById('xl9193_tfoot');
      if (!tbody || !XL.data) return;

      var cols = XL.data.cols || [];
      var rows = (XL.data.rows || []).slice();

      // 필터링
      rows = rows.filter(function(r) {
        for (var fk in XL.filter) {
          var fval = XL.filter[fk];
          if (!fval) continue;
          var val = String(r.cells[fk] || '').toLowerCase();
          if (val.indexOf(fval) < 0) return false;
        }
        return true;
      });

      // 정렬
      if (XL.sortCol) {
        var sk = XL.sortCol;
        var asc = XL.sortAsc ? 1 : -1;
        var colDef = cols.find(function(c){return c.k === sk;});
        var isNum = colDef && colDef.type === 'num';
        rows.sort(function(a, b) {
          var va = a.cells[sk], vb = b.cells[sk];
          if (va == null) va = '';
          if (vb == null) vb = '';
          if (isNum) {
            return (Number(va) - Number(vb)) * asc;
          }
          return String(va).localeCompare(String(vb)) * asc;
        });
      }

      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" style="text-align:center;padding:30px;color:#94a3b8;">조건에 맞는 데이터가 없습니다.</td></tr>';
        if (tfoot) tfoot.innerHTML = '';
        return;
      }

      var trs = [];
      rows.forEach(function(r, idx) {
        var isLocked = !!r.locked;
        var rowBg = isLocked ? '#f8fafc' : '#fff';
        var tr = '<tr data-id="' + r.id + '" data-locked="' + (isLocked ? '1' : '0') + '" style="background:' + rowBg + ';border-bottom:1px solid #e2e8f0;">';
        tr += '<td style="padding:5px;border:1px solid #e2e8f0;text-align:center;color:#64748b;background:#f8fafc;font-size:11px;">' + (idx + 1) + '</td>';

        cols.forEach(function(c) {
          var val = r.cells[c.k];
          var isEditable = !isLocked && (c.editable !== false);
          var cellStyle = 'padding:5px 8px;border:1px solid #e2e8f0;white-space:nowrap;';

          if (c.type === 'num') {
            cellStyle += 'text-align:right;';
            val = (val != null && val !== '') ? Number(val).toLocaleString() : '';
          } else {
            cellStyle += 'text-align:left;';
            if (val == null) val = '';
          }

          if (!isEditable) {
            cellStyle += 'background:' + (isLocked ? '#f1f5f9' : '#f8fafc') + ';color:#64748b;';
          } else {
            cellStyle += 'cursor:cell;';
          }

          tr += '<td data-id="' + r.id + '" data-col="' + c.k + '" data-editable="' + (isEditable?'1':'0') + '" data-type="' + c.type + '" style="' + cellStyle + '">' + (val || '') + '</td>';
        });

        tr += '</tr>';
        trs.push(tr);
      });
      tbody.innerHTML = trs.join('');

      // 셀 이벤트 바인딩
      tbody.querySelectorAll('td[data-col]').forEach(function(td) {
        td.onclick = function(e) { XL.selectCell(this); };
        td.ondblclick = function(e) { XL.startEdit(this); };
      });

      // 합계줄(tfoot)
      if (tfoot) {
        var tf = '<tr><td style="padding:6px;border:1px solid #cbd5e1;text-align:center;background:#e2e8f0;">합계</td>';
        cols.forEach(function(c) {
          var sumVal = (XL.data.sums && XL.data.sums[c.k] != null) ? XL.data.sums[c.k] : '';
          if (c.type === 'num' && sumVal !== '') {
            sumVal = Number(sumVal).toLocaleString();
          }
          tf += '<td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:' + (c.type==='num'?'right':'left') + ';">' + sumVal + '</td>';
        });
        tf += '</tr>';
        tfoot.innerHTML = tf;
      }
    },

    selectCell: function(td) {
      if (XL.selectedCell && XL.selectedCell.el) {
        XL.selectedCell.el.style.outline = '';
      }
      var rowId = td.getAttribute('data-id');
      var colKey = td.getAttribute('data-col');
      XL.selectedCell = { rowId: rowId, colKey: colKey, el: td };
      td.style.outline = '2px solid #2563eb';
      td.style.outlineOffset = '-2px';
    },

    startEdit: function(td) {
      if (td.getAttribute('data-editable') !== '1') {
        if (td.closest('tr').getAttribute('data-locked') === '1') {
          if (typeof toast === 'function') toast('마감되거나 확정된 청구건은 수정할 수 없습니다.', 'i');
        }
        return;
      }

      if (XL.editCell && XL.editCell.el === td) return;
      if (XL.editCell) XL.finishEdit(true);

      var rowId = td.getAttribute('data-id');
      var colKey = td.getAttribute('data-col');
      var colType = td.getAttribute('data-type');
      var origVal = td.textContent.trim().replace(/,/g, '');

      var inp = document.createElement('input');
      inp.type = (colType === 'num') ? 'number' : (colType === 'date' ? 'date' : 'text');
      inp.value = origVal;
      inp.style.cssText = 'width:100%;height:100%;box-sizing:border-box;border:1px solid #2563eb;padding:2px 4px;font-size:12px;font-family:inherit;outline:none;';

      td.innerHTML = '';
      td.appendChild(inp);
      inp.focus();
      inp.select();

      XL.editCell = { rowId: rowId, colKey: colKey, el: td, origVal: origVal, input: inp, type: colType };

      inp.onblur = function() {
        XL.finishEdit(true);
      };
      inp.onkeydown = function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          XL.finishEdit(true, 'down');
        } else if (e.key === 'Tab') {
          e.preventDefault();
          XL.finishEdit(true, e.shiftKey ? 'left' : 'right');
        } else if (e.key === 'Escape') {
          XL.finishEdit(false);
        }
      };
    },

    finishEdit: function(save, moveDir) {
      if (!XL.editCell) return;
      var ec = XL.editCell;
      XL.editCell = null;

      var newVal = ec.input.value.trim();
      if (!save || newVal === ec.origVal) {
        ec.el.textContent = (ec.type === 'num' && ec.origVal !== '') ? Number(ec.origVal).toLocaleString() : ec.origVal;
        if (moveDir) XL.moveSelection(ec.el, moveDir);
        return;
      }

      // 저장 호출
      ec.el.textContent = (ec.type === 'num' && newVal !== '') ? Number(newVal).toLocaleString() : newVal;
      ec.el.style.background = '#fef9c3'; // 저장 중 노란색

      var params = {
        p_sheet: XL.curSheet,
        p_id: ec.rowId,
        p_col: ec.colKey,
        p_val: newVal,
        p_ym: XL.curYm,
        p_partner: XL.curPartner
      };

      window.sb.rpc('ceo_xl_save', params).then(function(res) {
        var err = res.error;
        var d = res.data;
        if (err || !d || d.ok === false) {
          var failMsg = (d && d.msg) ? d.msg : (err ? err.message : '저장 실패');
          ec.el.style.background = '#fee2e2'; // 실패 빨강
          ec.el.textContent = (ec.type === 'num' && ec.origVal !== '') ? Number(ec.origVal).toLocaleString() : ec.origVal;
          if (typeof toast === 'function') toast(failMsg, 'e');
          setTimeout(function(){ ec.el.style.background = ''; }, 1500);
          return;
        }

        // 성공 플래시 초록
        ec.el.style.background = '#dcfce7';
        setTimeout(function(){ ec.el.style.background = ''; }, 800);

        // 행/합계 데이터 반영
        if (d.sums) {
          XL.data.sums = d.sums;
          XL.updateSumsDisplay();
        }
        if (d.bill) {
          XL.data.bill = d.bill;
          XL.updateBillDisplay();
        }
        // 로컬 데이터 원본 셀 갱신
        var rowObj = (XL.data.rows || []).find(function(r){ return String(r.id) === String(ec.rowId); });
        if (rowObj) {
          rowObj.cells[ec.colKey] = newVal;
          if (d.row && d.row.cells) {
            rowObj.cells = Object.assign(rowObj.cells, d.row.cells);
          }
        }
      }).catch(function(ex) {
        console.error('[XL9193] save error', ex);
        ec.el.style.background = '#fee2e2';
        ec.el.textContent = (ec.type === 'num' && ec.origVal !== '') ? Number(ec.origVal).toLocaleString() : ec.origVal;
        if (typeof toast === 'function') toast('저장 중 통신 오류가 발생했습니다.', 'e');
      });

      if (moveDir) XL.moveSelection(ec.el, moveDir);
    },

    moveSelection: function(curTd, dir) {
      var tr = curTd.parentElement;
      var targetTd = null;
      if (dir === 'down') {
        var nextTr = tr.nextElementSibling;
        if (nextTr) {
          var colIdx = Array.from(tr.children).indexOf(curTd);
          targetTd = nextTr.children[colIdx];
        }
      } else if (dir === 'up') {
        var prevTr = tr.previousElementSibling;
        if (prevTr) {
          var colIdx = Array.from(tr.children).indexOf(curTd);
          targetTd = prevTr.children[colIdx];
        }
      } else if (dir === 'right') {
        targetTd = curTd.nextElementSibling;
      } else if (dir === 'left') {
        targetTd = curTd.previousElementSibling;
      }

      if (targetTd && targetTd.hasAttribute('data-col')) {
        XL.selectCell(targetTd);
      }
    },

    handleKeyDown: function(e) {
      if (XL.editCell) return; // 편집 중이면 인풋 자체 키 이벤트 처리
      if (!XL.selectedCell || !XL.selectedCell.el) return;

      var el = XL.selectedCell.el;

      // Ctrl + Z (되돌리기)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        XL.undoRecent();
        return;
      }

      // F2 또는 문자 키 입력 시작 시 바로 수정 모드
      if (e.key === 'F2') {
        e.preventDefault();
        XL.startEdit(el);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        XL.moveSelection(el, 'down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        XL.moveSelection(el, 'up');
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        XL.moveSelection(el, 'right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        XL.moveSelection(el, 'left');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        XL.startEdit(el);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (el.getAttribute('data-editable') === '1') {
          XL.editCell = { rowId: el.getAttribute('data-id'), colKey: el.getAttribute('data-col'), el: el, origVal: el.textContent.trim(), input: {value: ''}, type: el.getAttribute('data-type') };
          XL.finishEdit(true);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // 타이핑 시 바로 편집 진입
        XL.startEdit(el);
        if (XL.editCell && XL.editCell.input) {
          XL.editCell.input.value = e.key;
        }
      }
    },

    handlePaste: function(e) {
      if (XL.editCell) return;
      if (!XL.selectedCell || !XL.selectedCell.el) return;

      var clip = (e.clipboardData || window.clipboardData).getData('text');
      if (!clip) return;
      e.preventDefault();

      var lines = clip.trim().split(/\r?\n/).map(function(l){ return l.split('\t'); });
      if (lines.length === 1 && lines[0].length === 1) {
        // 단일 셀 붙여넣기
        XL.startEdit(XL.selectedCell.el);
        if (XL.editCell && XL.editCell.input) {
          XL.editCell.input.value = lines[0][0].trim();
          XL.finishEdit(true);
        }
        return;
      }

      // 다중 셀 붙여넣기 (ceo_xl_save_many)
      var startTd = XL.selectedCell.el;
      var startTr = startTd.parentElement;
      var tbody = startTr.parentElement;
      var rows = Array.from(tbody.children);
      var startRowIdx = rows.indexOf(startTr);
      var cols = XL.data.cols || [];
      var startColIdx = cols.findIndex(function(c){ return c.k === startTd.getAttribute('data-col'); });

      if (startColIdx < 0) return;

      var items = [];
      lines.forEach(function(line, rOffset) {
        var tr = rows[startRowIdx + rOffset];
        if (!tr || tr.getAttribute('data-locked') === '1') return;
        var rId = tr.getAttribute('data-id');

        line.forEach(function(val, cOffset) {
          var colDef = cols[startColIdx + cOffset];
          if (!colDef || colDef.editable === false) return;
          var cleanVal = val.trim();
          if (colDef.type === 'num') cleanVal = cleanVal.replace(/,/g, '');
          items.push({ id: rId, col: colDef.k, val: cleanVal });
        });
      });

      if (items.length === 0) return;
      if (items.length > 500) {
        if (typeof toast === 'function') toast('한 번에 최대 500칸까지만 붙여넣을 수 있습니다.', 'w');
        return;
      }

      if (typeof toast === 'function') toast(items.length + '개 칸을 붙여넣는 중입니다...', 'i');

      window.sb.rpc('ceo_xl_save_many', {
        p_sheet: XL.curSheet,
        p_items: items,
        p_ym: XL.curYm,
        p_partner: XL.curPartner
      }).then(function(res) {
        var err = res.error;
        var d = res.data;
        if (err || !d || d.ok === false) {
          if (typeof toast === 'function') toast((d && d.msg) ? d.msg : '일괄 저장 실패', 'e');
          return;
        }
        if (typeof toast === 'function') toast(items.length + '개 칸이 저장되었습니다.', 's');
        XL.load(); // 표 전체 새로고침
      }).catch(function(ex) {
        console.error('[XL9193] paste save error', ex);
        if (typeof toast === 'function') toast('붙여넣기 저장 중 오류가 발생했습니다.', 'e');
      });
    },

    undoRecent: function() {
      // 가장 최근 로그 조회 후 undo
      window.sb.rpc('ceo_xl_log', {
        p_sheet: XL.curSheet,
        p_ym: XL.curYm,
        p_partner: XL.curPartner,
        p_limit: 1
      }).then(function(res) {
        var d = res.data;
        if (!d || !d.logs || d.logs.length === 0) {
          if (typeof toast === 'function') toast('되돌릴 변경 이력이 없습니다.', 'i');
          return;
        }
        var recent = d.logs[0];
        XL.doUndo(recent.log_id);
      });
    },

    doUndo: function(logId) {
      window.sb.rpc('ceo_xl_undo', {
        p_log_id: logId,
        p_ym: XL.curYm,
        p_partner: XL.curPartner
      }).then(function(res) {
        var err = res.error;
        var d = res.data;
        if (err || !d || d.ok === false) {
          if (typeof toast === 'function') toast((d && d.msg) ? d.msg : '되돌리기 실패', 'e');
          return;
        }
        if (typeof toast === 'function') toast('변경 사항을 되돌렸습니다.', 's');
        XL.load();
        if (XL.historyOpen) XL.loadHistory();
      }).catch(function(ex) {
        console.error('[XL9193] undo error', ex);
      });
    },

    toggleHistory: function(open) {
      var dr = document.getElementById('xl9193_drawer');
      if (!dr) return;
      if (open === undefined) open = !XL.historyOpen;
      XL.historyOpen = open;
      dr.style.right = open ? '0' : '-420px';
      if (open) XL.loadHistory();
    },

    loadHistory: function() {
      var list = document.getElementById('xl9193_drawer_list');
      if (!list) return;
      list.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">이력을 불러오는 중...</div>';

      window.sb.rpc('ceo_xl_log', {
        p_sheet: XL.curSheet,
        p_ym: XL.curYm,
        p_partner: XL.curPartner,
        p_limit: 50
      }).then(function(res) {
        var d = res.data;
        if (!d || !d.logs || d.logs.length === 0) {
          list.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">최근 변경 이력이 없습니다.</div>';
          return;
        }
        var html = [];
        d.logs.forEach(function(l) {
          var timeStr = l.at ? l.at.substring(11, 19) : '';
          var itemHtml = [
            '<div style="border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin-bottom:8px;background:#f8fafc;">',
            '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">',
            '    <span style="font-weight:bold;color:#334155;">' + (l.row_label || '') + ' · ' + (l.col_label || '') + '</span>',
            '    <span style="font-size:11px;color:#94a3b8;">' + timeStr + '</span>',
            '  </div>',
            '  <div style="font-size:12px;color:#475569;margin-bottom:6px;">',
            '    <span style="text-decoration:line-through;color:#ef4444;">' + (l.before || '(빈값)') + '</span> → <span style="font-weight:600;color:#059669;">' + (l.after || '(빈값)') + '</span>',
            '  </div>',
            '  <div style="text-align:right;">',
            '    <button type="button" class="xl9193-undo-btn" data-log="' + l.log_id + '" style="padding:2px 8px;font-size:11px;background:#fff;border:1px solid #cbd5e1;border-radius:3px;cursor:pointer;">[되돌리기]</button>',
            '  </div>',
            '</div>'
          ].join('');
          html.push(itemHtml);
        });
        list.innerHTML = html.join('');
        list.querySelectorAll('.xl9193-undo-btn').forEach(function(b) {
          b.onclick = function() {
            XL.doUndo(this.getAttribute('data-log'));
          };
        });
      });
    },

    updateSumsDisplay: function() {
      var sumsInfo = document.getElementById('xl9193_sums_info');
      var sums = (XL.data && XL.data.sums) || {};
      if (sumsInfo) {
        var sumParts = [];
        for (var sk in sums) {
          var val = sums[sk];
          sumParts.push(sk + ': ' + (typeof val === 'number' ? val.toLocaleString() + '원' : val));
        }
        sumsInfo.innerHTML = sumParts.join(' · ');
      }
      // tfoot 갱신
      var tfoot = document.getElementById('xl9193_tfoot');
      if (tfoot && XL.data && XL.data.cols) {
        var tf = '<tr><td style="padding:6px;border:1px solid #cbd5e1;text-align:center;background:#e2e8f0;">합계</td>';
        XL.data.cols.forEach(function(c) {
          var sumVal = (sums[c.k] != null) ? sums[c.k] : '';
          if (c.type === 'num' && sumVal !== '') sumVal = Number(sumVal).toLocaleString();
          tf += '<td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:' + (c.type==='num'?'right':'left') + ';">' + sumVal + '</td>';
        });
        tf += '</tr>';
        tfoot.innerHTML = tf;
      }
    },

    updateBillDisplay: function() {
      var billInfo = document.getElementById('xl9193_bill_info');
      var bill = (XL.data && XL.data.bill) || [];
      if (!billInfo) return;
      if (XL.curSheet === 'pay') return;

      var billHtml = '<span>이 달 청구서: ';
      if (bill && bill.length > 0) {
        billHtml += bill.map(function(b) {
          return '<b style="color:#0f172a;">' + (b.doc_no || '미발행') + '</b> (공급가: ' + Number(b.supply||0).toLocaleString() + '원 / 세액: ' + Number(b.tax||0).toLocaleString() + '원)' + (b.draft ? ' <span style="color:#d97706;">[임시]</span>' : ' <span style="color:#059669;">[확정]</span>');
        }).join(', ');
      } else {
        billHtml += '<span style="color:#94a3b8;">미발행</span>';
      }
      billHtml += '</span>';
      billInfo.innerHTML = billHtml;
    }
  };

  // 전역 노출 및 초기화
  window.XL = XL;
  window.XL9193 = XL;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', XL.init);
  } else {
    XL.init();
  }
})();

/* ═══ v9.198 (대표 지시 11-04 16:2x) 인쇄 품목표 — ① 일자 칸을 No 옆에(줄 메모가 「MM/DD 구매」인 청구서) ② 그런 문서는 비고 칸 빼고 규격 칸 넓힘
   ③ 품명·품번 한 줄(품번은 옆에 작은 글씨), 규격은 작은 글씨 두 줄까지 — 줄 높이를 줄여 A4 한 장 맞추기(fit305)가 걸리게 ═══ */
(function(){
  var c=document.createElement('style');
  c.textContent='#pr table.lines.c198{table-layout:fixed;width:100%}#pr table.lines.c198 td{padding-top:2px!important;padding-bottom:2px!important;line-height:1.25!important}'
   +'#pr table.lines.c198 td.nm198{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#pr table.lines.c198 .pc198{font-size:.82em;color:#64748b;margin-left:4px}'
   +'#pr table.lines.c198 td{padding-left:5px!important;padding-right:5px!important}'
   +'#pr table.lines.c198 td.sp198{font-size:11px!important;word-break:keep-all;overflow-wrap:anywhere}'
   +'#pr table.lines.c198 td.dt198{white-space:nowrap!important;padding-left:3px!important;padding-right:3px!important;text-align:center}';
  document.head.appendChild(c);
  var DM=/^(\d\d\/\d\d) 구매$/;
  var _p=prLines;
  prLines=function(lines,opt){
    try{
      opt=opt||{};var cols=opt.cols||[];var L=lines||[];
      if(L.some(function(l){return l&&DM.test(l.memo||'')})){
        var memoOnlyDate=L.every(function(l){return !l||!l.memo||DM.test(l.memo)||/^B\d{8}$/.test(l.memo)});
        var out=[],dropMemo=false;
        cols.forEach(function(cc){
          if(!cc){out.push(cc);return}
          if(cc.t==='비고'){
            if(memoOnlyDate){dropMemo=true;return}
            out.push({t:cc.t,w:'56px',cls:cc.cls,f:function(l,i){return DM.test(l.memo||'')?'':(cc.f?cc.f(l,i):esc(l.memo||''))}});return;
          }
          if(cc.k==='item_name'||cc.k==='item_name305'){
            out.push({t:'품명 / 품번',cls:'nm198',f:function(l){var n=esc(l.item_name||''),cd=esc(l.item_code||'');return (n||cd)+(n&&cd?'<span class="pc198">'+cd+'</span>':'')}});return;
          }
          if(cc.k==='spec'){out.push({t:cc.t,k:'spec198',w:'150px',cls:'sp198',f:cc.f||function(l){return esc(l.spec||'')}});return}
          if(cc.t==='No'){out.push({t:'No',w:'28px',cls:cc.cls,f:cc.f});out.push({t:'일자',w:'42px',cls:'dt198',f:function(l){var m=DM.exec(l.memo||'');return m?m[1]:''}});return}
          if(cc.t==='수량'){out.push({t:cc.t,w:'40px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='단위'){out.push({t:cc.t,w:'32px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='단가'){out.push({t:cc.t,w:'64px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='공급가액'||cc.t==='금액'){out.push({t:cc.t,w:'80px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='세액'){out.push({t:cc.t,w:'66px',cls:cc.cls,f:cc.f});return}
          out.push(cc);
        });
        var o={};for(var k in opt)o[k]=opt[k];o.cols=out;
        if(o.foot){
          o.foot=String(o.foot).replace(/colspan="(\d+)"/g,function(m,n){return 'colspan="'+((+n)+1)+'"'});
          if(dropMemo)o.foot=o.foot.replace(/<td><\/td><\/tr>/g,'</tr>');
        }
        return String(_p.call(this,lines,o)).replace(/<table class="lines( c305)?"/,'<table class="lines c305 c198"');
      }
    }catch(e){console.error('[v9198-prLines]',e)}
    return _p.apply(this,arguments);
  };
})();
window.V9198_APPLIED = true;

/* ═══ v9.199 (대표 지시 11-04 16:3x 「공식서류에는 우리 문서번호를 보이지 말고」) 인쇄 머리 표에서 「…번호」 칸 중 값이 우리 문서번호(B26103101-I 같은 꼴)인 줄을 뺌 — 청구서·발주서·견적서 등 모든 인쇄 ═══ */
(function(){
  if (window.V9199_APPLIED) return;
  var NO=/^[A-Z]\d{8}(-[A-Z]{1,3})?$/;
  var _m=prMeta;
  prMeta=function(rows){
    try{
      rows=(rows||[]).filter(function(r){
        if(!r)return false;
        var lab=String(r[0]||'').replace(/\s/g,''), v=String(r[1]==null?'':r[1]).replace(/<[^>]*>/g,'').trim();
        return !(/번호$/.test(lab)&&NO.test(v));
      });
      return _m.call(this,rows);
    }catch(e){console.error('[v9199-prMeta]',e)}
    return _m.apply(this,arguments);
  };
  window.V9199_APPLIED = true;
})();

/* ═══ v9.204 [C1476-대표지시] #1430 트레이 자재·보관 청구서 인쇄 세 덩어리 소계 ═══ */
(function(){
  var _origPrLines = prLines;
  prLines = function(lines, opt) {
    try {
      opt = opt || {};
      var L = lines || [];
      // 트레이/우주 청구서 판별: 구매일 메모가 있거나, 공급가 음수 또는 트레이 보관 항목이 있는 경우
      var isTrayBilling = L.some(function(l){
        return l && (/^\d\d\/\d\d 구매$/.test(l.memo||'') || (+l.supply_amt < 0) || String(l.item_name||'').indexOf('트레이 보관') === 0);
      });

      if (isTrayBilling && opt.cols) {
        var cols = opt.cols;
        // Grouping: 1 = 자재, 2 = 대차·보관료, 3 = 기청구분 차감
        var getGrp = function(l) {
          if (!l) return 1;
          if (l.grp === 'deduct' || (+l.supply_amt || 0) < 0) return 3;
          var memo = String(l.memo || '').trim();
          var name = String(l.item_name || '').trim();
          if (l.grp === 'extra' || l.grp === 'storage' || /^[A-Z]\d{8}/.test(memo) || name.indexOf('트레이 보관') === 0 || name.indexOf('대차') >= 0) return 2;
          return 1;
        };

        var grpNames = { 1: '① 자재 (구매일별 납품)', 2: '② 대차 및 보관료', 3: '③ 기청구분 차감' };
        var grouped = { 1: [], 2: [], 3: [] };
        L.forEach(function(l){ grouped[getGrp(l)].push(l); });

        // If only 1 group exists, fallback to standard rendering
        var activeGrps = [1, 2, 3].filter(function(g){ return grouped[g].length > 0; });
        if (activeGrps.length > 1) {
          var h = '<table class="lines c305 c198"><thead><tr>' + cols.map(function(c){ return '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + c.t + '</th>'; }).join('') + '</tr></thead><tbody>';

          var spanCol = cols.length - 2; // amount and tax columns
          if (spanCol < 1) spanCol = 1;

          var itemNo = 0;
          activeGrps.forEach(function(g) {
            var gLines = grouped[g];
            var gSup = 0, gTax = 0;
            gLines.forEach(function(l){ gSup += (+l.supply_amt || 0); gTax += (+l.tax_amt || 0); });

            // Group Header
            h += '<tr style="background:#f1f5f9;font-weight:700;border-top:1px solid #cbd5e1;"><td colspan="' + cols.length + '" style="padding:4px 8px;text-align:left;color:#1e293b;font-size:11px;">' + grpNames[g] + '</td></tr>';

            // Group Rows
            gLines.forEach(function(l) {
              itemNo++;
              h += '<tr>' + cols.map(function(c){
                var v = c.f ? c.f(l, itemNo - 1) : l[c.k];
                return '<td class="' + (c.cls || '') + '">' + (v == null ? '' : v) + '</td>';
              }).join('') + '</tr>';
            });

            // Group Subtotal Row
            h += '<tr style="background:#f8fafc;font-weight:700;border-bottom:1px solid #cbd5e1;">'
              + '<td colspan="' + spanCol + '" class="r" style="text-align:right;font-size:11px;color:#475569;">' + grpNames[g].slice(2) + ' 소계</td>'
              + '<td class="n r" style="text-align:right;font-weight:700;">' + (typeof wonA === 'function' ? wonA(gSup) : gSup.toLocaleString()) + '</td>'
              + '<td class="n r" style="text-align:right;">' + (typeof wonA === 'function' ? wonA(gTax) : gTax.toLocaleString()) + '</td>'
              + '<td></td>'
              + '</tr>';
          });

          h += (opt.foot || '') + '</tbody></table>';
          return h;
        }
      }
    } catch(e) { console.error('[v9204-prLines]', e); }
    return _origPrLines.apply(this, arguments);
  };
})();

/* ═══ v9.202 [C1475-대표지시] #1427 급여계산·대장 화면 정리 (중복 구역 제거 + 달력 연동 교정 + 우측 마감체크 제거 + 월급제 분기) ═══ */
(function(){
  // 캐시 객체
  window._bizPayCache = window._bizPayCache || {};
  window._personMonthCache = window._personMonthCache || {};

  // 스타일 주입 (중복 영역 숨김 및 우측 달력/명세서 최적화)
  (function(){
    var styleId = 'style-v9202-clean';
    if (document.getElementById(styleId)) return;
    var st = document.createElement('style');
    st.id = styleId;
    st.textContent = [
      '#sec-pDesk, #sec-gSet, #sec-gPmb, #sec-gRetro { display: none !important; }',
      '#sec-gReg .rg-wrap { grid-template-columns: minmax(0, 1fr) minmax(390px, 500px) !important; gap: 14px; }',
      '@media(max-width: 1200px) { #sec-gReg .rg-wrap { grid-template-columns: 1fr !important; } }',
      '.cal9201-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; margin-top: 6px; }',
      '.cal9201-hdr { text-align: center; font-size: 11px; font-weight: 700; padding: 3px 0; background: #f8fafc; color: #475569; }',
      '.cal9201-hdr.sun { color: #dc2626; } .cal9201-hdr.sat { color: #2563eb; }',
      '.cal9201-cell { min-height: 52px; background: #fff; border-radius: 4px; padding: 3px 4px; display: flex; flex-direction: column; justify-content: flex-start; font-size: 11px; position: relative; }',
      '.cal9201-cell.empty { background: #f8fafc; border: none; }',
      '.cal9201-cell.work { background: #ecfdf5; border: 1px solid #a7f3d0; }',
      '.cal9201-cell.holiday .cal9201-num { color: #dc2626; }',
      '.cal9201-num { font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }',
      '.cal9201-num.sun { color: #dc2626; } .cal9201-num.sat { color: #2563eb; }',
      '.cal9201-work-badge { font-weight: 700; color: #047857; font-size: 11px; line-height: 1.2; }',
      '.cal9201-rate { font-weight: 700; color: #1d4ed8; font-size: 10px; line-height: 1.2; margin-top: 1px; }',
      '.cal9201-pay { font-size: 10px; color: #334155; }',
      '.cal9201-site { font-size: 9px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }',
      '.cal9201-ov { font-size: 9px; color: #b91c1c; background: #fee2e2; border-radius: 2px; padding: 0 2px; display: inline-block; font-weight: 600; }',
      '.cal9201-rev { font-size: 9px; color: #94a3b8; }',
      '.cal9201-times { font-size: 9px; color: #64748b; }'
    ].join('\n');
    document.head.appendChild(st);
  })();

  // pdEnsure 차단 (하단 불필요한 구역 생성 및 쿼리 방지)
  window.pdEnsure = function() { return; };

  // 1. 사람 선택 핸들러 통합 (근로자/사업소득자 공통)
  window.regSelUnified = function(empNo) {
    if (typeof REG !== 'undefined') {
      REG.sel = empNo;
      REG._wantedSel = empNo;
    }
    if (typeof window.regPaint === 'function') {
      window.regPaint();
    }
  };
  window.regSel = window.regSelUnified;
  window.regSelBiz = window.regSelUnified;

  // 2. 사업소득 요약 복사
  window.regCopyBiz = function(empNo) {
    var m = (typeof M === 'function') ? M() : '';
    var bp = window._bizPayCache[m];
    if (!bp || !bp.rows) return;
    var r = bp.rows.filter(function(x){ return x.employment_no === empNo; })[0];
    if (!r) return;
    var txt = [
      '[' + m + ' 사업소득 지급명세]',
      '성명: ' + (r.person_name || ''),
      '공수: ' + (r.work_md || 0) + '공수 (연장 ' + (r.ot_hours || 0) + 'H)',
      '지급액(세전): ' + (+r.pay_amt || 0).toLocaleString() + '원',
      '소득세(3%): -' + (+r.income_tax || 0).toLocaleString() + '원',
      '지방소득세(0.3%): -' + (+r.local_tax || 0).toLocaleString() + '원',
      '실지급액(세후): ' + (+r.net_amt || 0).toLocaleString() + '원'
    ].join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function(){
        if (typeof toast === 'function') toast('사업소득 지급명세가 복사되었습니다', 'g');
      });
    }
  };

  // 3. regTbl 급여대장 테이블 내 사업소득자 통합 삽입 함수
  function injectBizRowsToRegTable() {
    if (typeof isOwner !== 'function' || !isOwner()) return;
    var tbl = document.querySelector('#regTbl table.rg');
    if (!tbl) return;

    var curYm = (typeof M === 'function') ? M() : '';
    if (!curYm) return;

    var bpData = window._bizPayCache[curYm];
    if (!bpData) {
      if (window.sb && window.sb.rpc && !window._bizPayFetching) {
        window._bizPayFetching = true;
        window.sb.rpc('ceo_business_pay', { p_ym: curYm }).then(function(res) {
          window._bizPayFetching = false;
          if (res.data && res.data.ok) {
            window._bizPayCache[curYm] = res.data;
            if (typeof window.regPaint === 'function') window.regPaint();
          }
        }).catch(function(err){
          window._bizPayFetching = false;
          console.error('[CEO-BIZ-PAY-ERR]', err);
        });
      }
      return;
    }

    var bizRows = bpData.rows || [];
    if (!bizRows.length) return;

    // 이미 주입되었는지 검사
    if (tbl.querySelector('.rg-biz-row')) return;

    var tbody = tbl.querySelector('tbody');
    var tfoot = tbl.querySelector('tfoot');
    if (!tbody) return;

    var cols = (typeof REG_COLS !== 'undefined') ? REG_COLS : [];
    var totalColspan = cols.length + 2;

    // 구분선 삽입
    var divTr = document.createElement('tr');
    divTr.className = 'rg-biz-row rg-biz-divider';
    divTr.style.cssText = 'background:#f1f5f9;font-weight:700;color:#334155;border-top:2px solid #cbd5e1;';
    divTr.innerHTML = '<td colspan="' + totalColspan + '" style="padding:6px 10px;text-align:left;font-size:12px;">💼 사업소득 3.3% (프리랜서·용역) · ' + bizRows.length + '명 <span style="font-size:11px;font-weight:normal;color:#64748b;">(이름 클릭 시 우측에 이달 달력 & 단가 명세서 표시)</span></td>';
    tbody.appendChild(divTr);

    // 사업소득자 행 삽입
    var selEmp = (typeof REG !== 'undefined') ? REG.sel : null;
    bizRows.forEach(function(r) {
      var tr = document.createElement('tr');
      tr.className = 'rg-biz-row' + (selEmp === r.employment_no ? ' on' : '');
      tr.setAttribute('data-emp', r.employment_no);

      var isChk = (typeof REG !== 'undefined' && REG.chk && REG.chk[r.employment_no]);
      var empNoEsc = (typeof ERPC !== 'undefined') ? ERPC.jsq(r.employment_no) : "'" + r.employment_no + "'";

      var h = '<td class="ck"><input type="checkbox"' + (isChk ? ' checked' : '') + ' onclick="if(typeof REG!==\'undefined\')REG.chk[' + empNoEsc + ']=this.checked"></td>'
        + '<td class="nm" onclick="regSelUnified(' + empNoEsc + ')" title="' + (r.employment_no || '') + ' — 클릭하여 이달 달력·단가 명세서" style="cursor:pointer;">'
        + '<b>' + (r.person_name || '') + '</b> <span class="pill tiny" style="background:#e0e7ff;color:#3730a3;font-weight:700;margin-left:4px;">용역</span>'
        + '</td>';

      cols.forEach(function(c) {
        if (c.k === 'gross') {
          h += '<td class="n tot" style="font-weight:700;">' + (+r.pay_amt || 0).toLocaleString() + '원</td>';
        } else if (c.k === 'itx') {
          h += '<td class="n" style="color:#dc2626;font-weight:600;">' + (+r.income_tax || 0).toLocaleString() + '원</td>';
        } else if (c.k === 'ltx') {
          h += '<td class="n" style="color:#dc2626;font-weight:600;">' + (+r.local_tax || 0).toLocaleString() + '원</td>';
        } else if (c.k === 'ded_total') {
          var totDed = (+r.income_tax || 0) + (+r.local_tax || 0);
          h += '<td class="n tot" style="color:#dc2626;font-weight:700;">' + totDed.toLocaleString() + '원</td>';
        } else if (c.k === 'net') {
          h += '<td class="n net" style="color:#059669;font-weight:800;background:color-mix(in srgb,#10b981 8%,transparent);">' + (+r.net_amt || 0).toLocaleString() + '원</td>';
        } else {
          h += '<td class="n dim" style="color:#cbd5e1;text-align:center;">-</td>';
        }
      });
      tr.innerHTML = h;
      tbody.appendChild(tr);
    });

    // 선택된 행 클래스 .on 맞추기
    tbody.querySelectorAll('tr').forEach(function(rTr){
      var nmTd = rTr.querySelector('td.nm');
      if (!nmTd) return;
      var oc = nmTd.getAttribute('onclick') || '';
      var m = /regSel(?:Unified|Biz)?\(['"](.+?)['"]\)/.exec(oc);
      if (m && m[1]) {
        if (m[1] === selEmp) rTr.classList.add('on');
        else rTr.classList.remove('on');
      }
    });

    // tfoot 3단 구성
    if (tfoot) {
      var regRows = (typeof regRows === 'function') ? regRows() : ((REG.cache[curYm]||{}).rows || []);
      var regSum = {};
      regRows.forEach(function(r){
        cols.forEach(function(c){ regSum[c.k] = (regSum[c.k] || 0) + (+r[c.k] || 0); });
      });

      var bizSum = bpData.sum || {};
      var bizPay = +bizSum.pay || 0;
      var bizItx = +bizSum.income_tax || 0;
      var bizLtx = +bizSum.local_tax || 0;
      var bizDed = bizItx + bizLtx;
      var bizNet = +bizSum.net || 0;

      var ftReg = '<tr class="rg-biz-row" style="background:#f8fafc;"><td class="ck"></td><td class="nm">근로 소계 (' + regRows.length + '명)</td>'
        + cols.map(function(c){ return '<td class="n tot">' + (regSum[c.k] ? regSum[c.k].toLocaleString() + '원' : '-') + '</td>'; }).join('')
        + '</tr>';

      var ftBiz = '<tr class="rg-biz-row" style="background:#f8fafc;"><td class="ck"></td><td class="nm">용역 소계 (' + bizRows.length + '명)</td>'
        + cols.map(function(c){
            if (c.k === 'gross') return '<td class="n tot" style="font-weight:700;">' + bizPay.toLocaleString() + '원</td>';
            if (c.k === 'itx') return '<td class="n" style="color:#dc2626;font-weight:600;">' + bizItx.toLocaleString() + '원</td>';
            if (c.k === 'ltx') return '<td class="n" style="color:#dc2626;font-weight:600;">' + bizLtx.toLocaleString() + '원</td>';
            if (c.k === 'ded_total') return '<td class="n tot" style="color:#dc2626;font-weight:700;">' + bizDed.toLocaleString() + '원</td>';
            if (c.k === 'net') return '<td class="n net" style="color:#059669;font-weight:800;">' + bizNet.toLocaleString() + '원</td>';
            return '<td class="n dim" style="color:#cbd5e1;text-align:center;">-</td>';
          }).join('')
        + '</tr>';

      var ftAll = '<tr class="rg-biz-row" style="background:#f1f5f9;font-weight:800;border-top:2px solid #94a3b8;"><td class="ck"></td><td class="nm" style="color:#0f172a;font-weight:800;">전체 합계 (' + (regRows.length + bizRows.length) + '명)</td>'
        + cols.map(function(c){
            var allVal = (regSum[c.k] || 0);
            if (c.k === 'gross') allVal += bizPay;
            else if (c.k === 'itx') allVal += bizItx;
            else if (c.k === 'ltx') allVal += bizLtx;
            else if (c.k === 'ded_total') allVal += bizDed;
            else if (c.k === 'net') allVal += bizNet;
            return '<td class="n tot" style="font-weight:800;' + (c.k === 'net' ? 'color:#059669;font-size:13px;' : '') + '">' + (allVal ? allVal.toLocaleString() + '원' : '-') + '</td>';
          }).join('')
        + '</tr>';

      tfoot.innerHTML = ftReg + ftBiz + ftAll;
    }

    // 헤더 카운트
    var regN = document.getElementById('regN');
    if (regN) {
      var d = (typeof REG !== 'undefined' && REG.cache && REG.cache[curYm]) || {};
      var cl = !!d.closed;
      var totalN = regRows.length + bizRows.length;
      regN.textContent = curYm + ' · 전체 ' + totalN + '명 (근로 ' + regRows.length + ' · 용역 ' + bizRows.length + ') · ' + (cl ? '확정됨' : '작성 중');
    }

    // 상단 도구 모음에 노무비 수령 확인서 및 확정 버튼 보강
    var act = document.getElementById('regAct');
    if (act && !act.querySelector('.btn-receipt-9202')) {
      var btnRec = document.createElement('button');
      btnRec.className = 'btn sm btn-receipt-9202';
      btnRec.textContent = '노무비 수령 확인서';
      btnRec.onclick = function() {
        if (typeof ps305Open === 'function') ps305Open();
        else if (typeof regPrint === 'function') regPrint();
      };
      act.insertBefore(btnRec, act.firstChild);
    }
  }

  // 4. regRail 래핑: 「급여 마감」 카드 제거 + 선택된 사람의 달력 & 명세서만 깔끔하게 노출
  function wrapRegRail() {
    if (typeof window.regRail !== 'function' || window.regRail._v9202Wrapped) return;

    var _origRegRail = window.regRail;
    window.regRail = function() {
      _origRegRail.apply(this, arguments);

      try {
        if (typeof isOwner !== 'function' || !isOwner()) return;

        var curYm = (typeof M === 'function') ? M() : '';
        var rail = document.getElementById('regRail');
        if (!rail || !curYm) return;

        // [중요 #1427-3] 오른쪽 「2026-10 급여 마감」 체크리스트 카드 통째로 숨김
        rail.querySelectorAll('.card').forEach(function(card) {
          var h4 = card.querySelector('h4');
          if (h4 && (h4.textContent.indexOf('급여 마감') >= 0 || h4.textContent.indexOf('마감') >= 0)) {
            card.style.display = 'none';
          }
        });

        var selEmp = (typeof REG !== 'undefined') ? (REG._wantedSel || REG.sel) : null;
        if (!selEmp) return;

        var bpData = window._bizPayCache[curYm] || { rows: [] };
        var bEmp = (bpData.rows || []).filter(function(x){ return x.employment_no === selEmp; })[0];

        // 사업소득자 명세서 카드 생성/교체
        var existBizCard = rail.querySelector('.card-biz-slip');
        if (existBizCard) existBizCard.remove();

        if (bEmp) {
          // 기존 근로자 명세서 숨김
          rail.querySelectorAll('.card').forEach(function(c){
            var h4 = c.querySelector('h4');
            if (h4 && h4.textContent.indexOf('급여명세서') >= 0) c.style.display = 'none';
          });

          var bCard = document.createElement('div');
          bCard.className = 'card card-biz-slip';
          bCard.style.marginTop = '10px';
          bCard.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<h4 style="margin:0;font-size:14px;color:#0f172a;">사업소득 지급명세서 · ' + (bEmp.person_name || '') + '</h4>'
            + '<span class="pill tiny" style="background:#e0e7ff;color:#3730a3;font-weight:700;">용역 3.3%</span>'
            + '</div>'
            + '<table class="rg" style="width:100%;margin-top:10px;font-size:12px;">'
            + '<tbody>'
            + '<tr><td class="dim" style="width:40%;">귀속월</td><td class="n" style="font-weight:600;">' + curYm + '</td></tr>'
            + '<tr><td class="dim">총 근무 공수</td><td class="n" style="font-weight:600;">' + (+bEmp.work_md || 0).toLocaleString() + ' 공수</td></tr>'
            + '<tr><td class="dim">연장 시간</td><td class="n">' + (+bEmp.ot_hours || 0).toLocaleString() + ' H</td></tr>'
            + '<tr style="background:#f8fafc;"><td style="font-weight:700;">지급총액 (세전)</td><td class="n tot" style="font-weight:700;">' + (+bEmp.pay_amt || 0).toLocaleString() + '원</td></tr>'
            + '<tr><td class="dim" style="color:#dc2626;">소득세 (3.0%)</td><td class="n" style="color:#dc2626;">-' + (+bEmp.income_tax || 0).toLocaleString() + '원</td></tr>'
            + '<tr><td class="dim" style="color:#dc2626;">지방소득세 (0.3%)</td><td class="n" style="color:#dc2626;">-' + (+bEmp.local_tax || 0).toLocaleString() + '원</td></tr>'
            + '<tr style="background:#fef2f2;"><td style="color:#dc2626;font-weight:700;">공제 총액 (3.3%)</td><td class="n" style="color:#dc2626;font-weight:700;">-' + ((+bEmp.income_tax || 0) + (+bEmp.local_tax || 0)).toLocaleString() + '원</td></tr>'
            + '<tr style="background:#ecfdf5;"><td style="color:#047857;font-weight:800;font-size:13px;">실지급액 (세후)</td><td class="n net" style="color:#059669;font-weight:800;font-size:14px;">' + (+bEmp.net_amt || 0).toLocaleString() + '원</td></tr>'
            + '</tbody></table>'
            + '<div style="margin-top:10px;display:flex;gap:6px;">'
            + '<button class="btn sm" onclick="hxOpenEmp(\'' + bEmp.employment_no + '\')">인사카드</button>'
            + '<button class="btn sm" onclick="regCopyBiz(\'' + bEmp.employment_no + '\')">요약 복사</button>'
            + '</div>';
          rail.appendChild(bCard);
        } else {
          // 근로자 명세서 복원
          rail.querySelectorAll('.card').forEach(function(c){
            var h4 = c.querySelector('h4');
            if (h4 && h4.textContent.indexOf('급여명세서') >= 0) c.style.display = '';
          });
        }

        // 달력 컨테이너 최상단 주입
        var calBox = rail.querySelector('#calBox9201');
        if (!calBox) {
          calBox = document.createElement('div');
          calBox.id = 'calBox9201';
          calBox.className = 'card';
          calBox.style.marginTop = '0px';
          rail.insertBefore(calBox, rail.firstChild);
        }

        renderPersonMonthCalendar(calBox, selEmp, curYm);

      } catch(e) {
        console.error('[REG-RAIL-CAL-ERR]', e);
      }
    };
    window.regRail._v9202Wrapped = true;
  }

  // 5. 이달 달력 & 매일 단가 렌더러 (월급제/일급제 분기 지원)
  function renderPersonMonthCalendar(container, empNo, ym) {
    container.setAttribute('data-emp', empNo);
    var cacheKey = empNo + '_' + ym;
    var cached = window._personMonthCache[cacheKey];

    if (!cached) {
      container.innerHTML = '<div style="padding:14px;font-size:12px;color:#64748b;text-align:center;">'
        + '<div style="margin-bottom:6px;font-weight:700;">' + ym + ' 근무 달력 및 매일 단가</div>'
        + '<div>데이터 불러오는 중...</div>'
        + '</div>';

      if (window.sb && window.sb.rpc) {
        window.sb.rpc('ceo_person_month', { p_emp: empNo, p_ym: ym }).then(function(res) {
          if (container.getAttribute('data-emp') !== empNo) return; // 다른 사람으로 전환됨
          if (res.data && res.data.ok) {
            window._personMonthCache[cacheKey] = res.data;
            drawCalendarHtml(container, res.data);
          } else {
            container.innerHTML = '<div class="tiny dim" style="padding:10px 0;text-align:center;">' + ym + ' 현장 출역 데이터가 없습니다.</div>';
          }
        }).catch(function(err){
          if (container.getAttribute('data-emp') !== empNo) return;
          container.innerHTML = '<div class="tiny neg" style="padding:8px 0;">출역 조회 실패: ' + (err.message || String(err)) + '</div>';
        });
      }
      return;
    }

    drawCalendarHtml(container, cached);
  }

  function drawCalendarHtml(container, data) {
    var ym = data.ym || '';
    var pName = data.person_name || '';
    var days = data.days || [];
    var byRate = data.by_rate || [];
    var sum = data.sum || {};
    var isMonthly = (data.pay_basis === 'monthly');

    var dayMap = {};
    days.forEach(function(d){ dayMap[d.date] = d; });

    var parts = ym.split('-');
    var yr = +parts[0], mo = +parts[1];
    var firstDayDow = new Date(yr, mo - 1, 1).getDay();
    var lastDate = new Date(yr, mo, 0).getDate();

    // 상단 요약 헤더
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      + '<h4 style="margin:0;font-size:13px;color:#0f172a;display:flex;align-items:center;gap:6px;">📅 ' + ym + ' 근무 달력 · <span style="color:#2563eb;">' + pName + '</span></h4>'
      + '<span class="pill tiny ' + (isMonthly ? '' : 'p') + '">' + (isMonthly ? '월급제' : '일급제(용역)') + '</span>'
      + '</div>';

    if (isMonthly) {
      h += '<div style="font-size:11px;color:#475569;margin-bottom:6px;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #e2e8f0;">'
        + '월 기준 ' + (+data.monthly_amt || 0).toLocaleString() + '원 · 근무 ' + (+sum.days || 0) + '일'
        + (sum.ot_hours ? ' · 연장 ' + sum.ot_hours + 'H (' + (+sum.ot_amt || 0).toLocaleString() + '원)' : '')
        + '</div>';
    } else {
      h += '<div style="font-size:11px;color:#047857;margin-bottom:6px;font-weight:700;">'
        + '총 ' + (+sum.work_md || 0) + '공수' + (sum.ot_hours ? ' (+' + sum.ot_hours + 'H)' : '') + ' · 지급액 ' + (+sum.pay_amt || 0).toLocaleString() + '원'
        + '</div>';
    }

    // 7열 달력
    h += '<div class="cal9201-grid">';
    var hdrs = ['일', '월', '화', '수', '목', '금', '토'];
    hdrs.forEach(function(hdr, i){
      var cls = (i === 0) ? ' sun' : (i === 6) ? ' sat' : '';
      h += '<div class="cal9201-hdr' + cls + '">' + hdr + '</div>';
    });

    for (var b = 0; b < firstDayDow; b++) {
      h += '<div class="cal9201-cell empty"></div>';
    }

    for (var d = 1; d <= lastDate; d++) {
      var dStr = String(d).padStart(2, '0');
      var fullDate = ym + '-' + dStr;
      var curDow = (firstDayDow + d - 1) % 7;
      var isSun = (curDow === 0), isSat = (curDow === 6);

      var entry = dayMap[fullDate];
      var isHol = entry ? !!entry.holiday : isSun;

      var numCls = isHol ? ' sun' : (isSat ? ' sat' : '');
      var cellCls = entry ? ' work' : '';

      h += '<div class="cal9201-cell' + cellCls + '">';
      h += '<div class="cal9201-num' + numCls + '">' + d + '</div>';

      if (entry) {
        h += '<div class="cal9201-work-badge">' + (+entry.work_md || 0) + '공수' + (entry.ot_hours ? ' <span style="font-size:9px;color:#b45309;">+' + entry.ot_hours + 'H</span>' : '') + '</div>';

        if (!isMonthly) {
          if (entry.daily_rate) h += '<div class="cal9201-rate">@' + (+entry.daily_rate).toLocaleString() + '</div>';
          if (entry.pay_amt) h += '<div class="cal9201-pay">' + (+entry.pay_amt).toLocaleString() + '원</div>';
        } else if (entry.ot_hours && data.ot_rate) {
          h += '<div style="font-size:9px;color:#b45309;">연장 @' + (+data.ot_rate).toLocaleString() + '</div>';
        }

        if (entry.site || entry.project) {
          h += '<div class="cal9201-site" title="' + (entry.site || '') + ' ' + (entry.work_desc || '') + '">' + (entry.site || entry.project) + '</div>';
        }
        if (entry.work_start && entry.work_end) {
          h += '<div class="cal9201-times">' + entry.work_start + '~' + entry.work_end + '</div>';
        }
        if (entry.rate_overridden) {
          h += '<div class="cal9201-ov" title="' + (entry.override_reason || '단가 수정') + '">단가수정</div>';
        }
        if (entry.revenue_amt) {
          h += '<div class="cal9201-rev">매출 ' + (+entry.revenue_amt).toLocaleString() + '</div>';
        }
      }
      h += '</div>';
    }

    var totalCells = firstDayDow + lastDate;
    var rem = (7 - (totalCells % 7)) % 7;
    for (var a = 0; a < rem; a++) {
      h += '<div class="cal9201-cell empty"></div>';
    }
    h += '</div>';

    // 하단 요약 검증 박스
    if (!isMonthly) {
      h += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin-top:8px;">'
        + '<div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">📊 단가별 공수 검증 요약</div>'
        + '<div style="font-size:12px;color:#334155;line-height:1.6;">';

      if (byRate.length) {
        byRate.forEach(function(br) {
          h += '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<span>• <b>' + (+br.daily_rate || 0).toLocaleString() + '원</b> × ' + (+br.work_md || 0) + '공수' + (br.holiday ? ' <span class="pill tiny r" style="padding:0 3px;">휴일</span>' : '') + '</span>'
            + '<span style="font-weight:700;color:#0f172a;">= ' + (+br.md_amt || 0).toLocaleString() + '원</span>'
            + '</div>';
        });
      }

      if (+sum.ot_amt > 0) {
        h += '<div style="display:flex;justify-content:space-between;align-items:center;color:#b45309;">'
          + '<span>• 연장근무 ' + (+sum.ot_hours || 0) + 'H</span>'
          + '<span style="font-weight:700;">= ' + (+sum.ot_amt).toLocaleString() + '원</span>'
          + '</div>';
      }

      h += '</div>'
        + '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #cbd5e1;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;color:#0f172a;">'
        + '<span>합계 ' + (+sum.work_md || 0) + '공수 · ' + (+sum.pay_amt || 0).toLocaleString() + '원</span>'
        + '<span style="color:#059669;font-weight:800;display:flex;align-items:center;gap:3px;">✓ 공수·단가 검증 일치</span>'
        + '</div>'
        + '</div>';
    } else {
      h += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;margin-top:8px;">'
        + '<div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">📋 월급제 근무 및 수당 요약</div>'
        + '<div style="font-size:12px;color:#334155;line-height:1.6;">'
        + '<div style="display:flex;justify-content:space-between;"><span>• 월 기본 기준액</span><span style="font-weight:700;">' + (+data.monthly_amt || 0).toLocaleString() + '원</span></div>'
        + '<div style="display:flex;justify-content:space-between;"><span>• 당월 현장 출역</span><span>' + (+sum.days || 0) + '일 (' + (+sum.work_md || 0) + '공수)</span></div>'
        + (sum.ot_hours ? '<div style="display:flex;justify-content:space-between;color:#b45309;"><span>• 연장근무 ' + sum.ot_hours + 'H (@' + (+data.ot_rate||0).toLocaleString() + ')</span><span style="font-weight:700;">= ' + (+sum.ot_amt||0).toLocaleString() + '원</span></div>' : '')
        + '</div>'
        + '</div>';
    }

    container.innerHTML = h;
  }

  // 6. 기업은행 대량이체 사업소득자 포함 래핑
  function wrapBk290Transfer() {
    if (typeof window.bk290Transfer !== 'function' || window.bk290Transfer._v9202Wrapped) return;

    var _origBk290 = window.bk290Transfer;
    window.bk290Transfer = async function(kind) {
      await _origBk290.apply(this, arguments);

      try {
        if (kind === 'reg') {
          var curYm = (typeof M === 'function') ? M() : '';
          var bp = window._bizPayCache[curYm];
          if (!bp && window.sb && window.sb.rpc) {
            var res = await window.sb.rpc('ceo_business_pay', { p_ym: curYm });
            if (res.data && res.data.ok) bp = res.data;
          }

          if (bp && bp.rows && bp.rows.length && typeof BK290 !== 'undefined' && BK290.lines) {
            bp.rows.forEach(function(br) {
              var net = +br.net_amt || 0;
              if (net <= 0) return;
              var pno = (typeof bk290Pno === 'function') ? bk290Pno(br.employment_no) : String(br.employment_no||'').split('-')[0];

              if (!BK290.lines.some(function(l){ return l.pno === pno || l.name === br.person_name; })) {
                var l = { pno: pno, name: br.person_name, amt: net, note: '사업소득 3.3% 실지급' };
                if (typeof bk290Find === 'function') {
                  var a = bk290Find(l.pno, l.payee || l.name);
                  l.acc = a;
                  if (!a) l.off = 1;
                }
                BK290.lines.push(l);
              }
            });

            if (typeof bk290Paint === 'function') {
              bk290Paint();
            }
          }
        }
      } catch(e) {
        console.error('[BK290-BIZ-ERR]', e);
      }
    };
    window.bk290Transfer._v9202Wrapped = true;
  }

  // 7. regPaint 래핑 등록 (REG.sel 복원 가드 적용)
  function tryWrapAll() {
    if (typeof window.regPaint === 'function' && !window.regPaint._v9202Wrapped) {
      var _origRegPaint = window.regPaint;
      window.regPaint = function() {
        var wanted = (typeof REG !== 'undefined') ? (REG._wantedSel || REG.sel) : null;
        _origRegPaint.apply(this, arguments);
        if (wanted && typeof REG !== 'undefined') {
          REG.sel = wanted;
          REG._wantedSel = wanted;
        }
        try {
          injectBizRowsToRegTable();
        } catch(e) {
          console.error('[REG-PAINT-WRAP-ERR]', e);
        }
      };
      window.regPaint._v9202Wrapped = true;
      if (document.getElementById('regTbl')) {
        try { window.regPaint(); } catch(e){}
      }
    }

    wrapRegRail();
    wrapBk290Transfer();
  }

  var _t = 0;
  var _iv = setInterval(function() {
    _t++;
    tryWrapAll();
    if ((window.regPaint && window.regPaint._v9202Wrapped) || _t > 120) {
      clearInterval(_iv);
    }
  }, 500);

})();

/* ═══ v9.205 (Claude, 대표 11-04 18:2x) 트레이 자재·보관 청구서 인쇄 — v9.204 세 덩어리 소계 + v9.198 칸(No 옆 일자·품명/품번 한 줄·규격 넓게·비고 빼기)을 함께
   v9.204가 v9.198 칸 정리를 건너뛰고 원래 칸(비고에 「10/06 구매」·대차 번호)으로 그리던 것, 소계 줄 칸 수가 하나 넘쳐 오른쪽 빈 칸 생기던 것 고침.
   이 블록이 맨 바깥에서 트레이 재청구서(줄 메모 「MM/DD 구매」)만 직접 그림. 다른 문서는 안쪽 감싸기들로 그대로. ═══ */
(function(){
  if (window.V9205_APPLIED) return;
  var DM=/^(\d\d\/\d\d) 구매$/, BN=/^[A-Z]\d{8}$/;
  var _inner=prLines;
  var grpOf=function(l){
    if(!l)return 1;
    if(l.grp==='deduct'||(+l.supply_amt||0)<0)return 3;
    var nm=String(l.item_name||'');
    if(l.grp==='extra'||BN.test(String(l.memo||'').trim())||nm.indexOf('트레이 보관')===0||nm.indexOf('대차')>=0)return 2;
    return 1;
  };
  var GN={1:'① 자재 (구매일별 납품)',2:'② 대차 · 보관료',3:'③ 기청구분 차감'};
  prLines=function(lines,opt){
    try{
      opt=opt||{};var L=lines||[];var cols=opt.cols||[];
      if(L.some(function(l){return l&&DM.test(l.memo||'')})&&cols.length){
        var onlyDate=L.every(function(l){return !l||!l.memo||DM.test(l.memo)||BN.test(String(l.memo).trim())});
        var out=[],dropMemo=false;
        cols.forEach(function(cc){
          if(!cc)return;
          if(cc.t==='비고'){if(onlyDate){dropMemo=true;return}out.push({t:'비고',w:'56px',cls:cc.cls,f:function(l,i){var m=String(l.memo||'');return (DM.test(m)||BN.test(m.trim()))?'':(cc.f?cc.f(l,i):esc(m))}});return}
          if(cc.k==='item_name'||cc.k==='item_name305'||cc.t==='품명'||cc.t==='품명 / 품번'){out.push({t:'품명 / 품번',cls:'nm198',f:function(l){var n=esc(l.item_name||''),cd=esc(l.item_code||'');return (n||cd)+(n&&cd?'<span class="pc198">'+cd+'</span>':'')}});return}
          if(cc.k==='spec'||cc.t==='규격'){out.push({t:'규격',k:'spec198',w:'150px',cls:'sp198',f:function(l){return esc(l.spec||'')}});return}
          if(cc.t==='No'){out.push({t:'No',w:'28px',cls:cc.cls,f:cc.f});out.push({t:'일자',w:'42px',cls:'dt198',f:function(l){var m=DM.exec(l.memo||'');return m?m[1]:''}});return}
          if(cc.t==='수량'){out.push({t:cc.t,w:'40px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='단위'){out.push({t:cc.t,w:'32px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='단가'){out.push({t:cc.t,w:'64px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='공급가액'||cc.t==='금액'){out.push({t:cc.t,w:'80px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='세액'){out.push({t:cc.t,w:'66px',cls:cc.cls,f:cc.f});return}
          out.push(cc);
        });
        var foot=String(opt.foot||'').replace(/colspan="(\d+)"/g,function(m,n){return 'colspan="'+((+n)+1)+'"'});
        if(dropMemo)foot=foot.replace(/<td><\/td><\/tr>/g,'</tr>');
        var iSup=-1,iTax=-1;out.forEach(function(c,i){if(c.t==='공급가액'||c.t==='금액')iSup=i;if(c.t==='세액')iTax=i});
        var G={1:[],2:[],3:[]};L.forEach(function(l){G[grpOf(l)].push(l)});
        var act=[1,2,3].filter(function(g){return G[g].length});
        var w=function(v){return typeof wonA==='function'?wonA(v):(+v||0).toLocaleString('ko-KR')};
        var h='<table class="lines c305 c198"><thead><tr>'+out.map(function(c){return '<th'+(c.w?' style="width:'+c.w+'"':'')+'>'+c.t+'</th>'}).join('')+'</tr></thead><tbody>';
        var no=0;
        act.forEach(function(g){
          var s=0,t=0;
          if(act.length>1)h+='<tr class="g205"><td colspan="'+out.length+'" style="background:#f1f5f9!important;font-weight:700!important;text-align:left!important">'+GN[g]+'</td></tr>';
          G[g].forEach(function(l){s+=(+l.supply_amt||0);t+=(+l.tax_amt||0);var i=no++;h+='<tr>'+out.map(function(c){var v=c.f?c.f(l,i):l[c.k];return '<td class="'+(c.cls||'')+'">'+(v==null?'':v)+'</td>'}).join('')+'</tr>'});
          if(act.length>1&&iSup>0){
            h+='<tr class="s205"><td colspan="'+iSup+'" style="text-align:right!important;background:#f8fafc!important;font-weight:700!important">'+GN[g].slice(2)+' 소계</td><td class="n" style="background:#f8fafc!important;font-weight:700!important">'+w(s)+'</td>'
              +(iTax>iSup?'<td class="n" style="background:#f8fafc!important">'+w(t)+'</td>':'')
              +new Array(Math.max(0,out.length-1-Math.max(iSup,iTax))+1).join('<td style="background:#f8fafc!important"></td>')+'</tr>';
          }
        });
        return h+foot+'</tbody></table>';
      }
    }catch(e){console.error('[v9205-prLines]',e)}
    return _inner.apply(this,arguments);
  };
  window.V9205_APPLIED = true;
})();


/* ===== v9.206 (C1477 대표 11-04 19:3x 「트레이용 대차는 20일 납품했으니 청구서에도 10/20으로」) =====
   트레이 재청구서에 합쳐진 문서 줄(비고 = 문서 몸통 번호)은 일자 칸이 비었음 → 그 문서의 일자(문서 원장 D.sd)를 일자 칸에 넣음.
   덩어리는 그대로 대차·보관료(extra). 화면 표시만, DB 그대로. 바깥에서 v9.205를 감쌈. */
(function(){
  if(window.V9206_APPLIED)return;
  var BN=/^[A-Z]\d{8}$/,DM=/^\d\d\/\d\d 구매$/;
  var _in=prLines;
  prLines=function(lines,opt){
    try{
      if(Array.isArray(lines)&&lines.some(function(l){return l&&DM.test(l.memo||'')})&&lines.some(function(l){return l&&BN.test(l.memo||'')})){
        var sd=(window.D&&Array.isArray(window.D.sd))?window.D.sd:[];
        lines=lines.map(function(l){
          if(!l||!BN.test(l.memo||''))return l;
          var dd=null;
          for(var i=0;i<sd.length;i++){var x=sd[i];
            if(x&&x.doc_no&&x.doc_date&&x.doc_no.indexOf(l.memo+'-')===0){dd=String(x.doc_date);if(/-I$/.test(x.doc_no))break}}
          if(!dd||dd.length<10)return l;
          var c=Object.assign({},l);c.memo=dd.slice(5,7)+'/'+dd.slice(8,10)+' 구매';c.grp='extra';return c;
        });
      }
    }catch(e){}
    return _in(lines,opt);
  };
  window.V9206_APPLIED=true;
})();

/* ═══ v9.210 (Claude, 대표 11-04 20:5x — v9.209 블록을 이것으로 바꿈) ─ 대표: 「숫자가 마지막 칸에 제대로 안 들어가 있고, 공급가액 세액 합계로 줄을 나누니까 1페이지에 안 들어가지네.. 공급가액 세액을 한 줄로, 합계액 한 줄로」「기청구분은 마이너스 - 로 표시하는 게 더 편리할 거 같은데 괄호보다는」
   ⑦ 맨 아래: 「공급가액 · 세액」 한 줄(공급가액 칸·세액 칸에 맞춰) + 「합계 (VAT 포함)」 한 줄(공급가액·세액 두 칸 합침). 세 줄 → 두 줄.
   ⑧ 음수는 괄호 대신 「-4,500,000」.  ⑨ 줄 위아래 여백 0·줄 간격 1.2 → 한 장에 여유.
   ── 이하 v9.209 설명 ──
   v9.209 (Claude, 대표 11-04 20:4x) 트레이 자재·보관 청구서 인쇄 — 칸 너비·한 장 맞춤·묶음 제목
   대표: 「구매일별 납품 이런 설명은 필요가 없거든」「칸벌린 … 어떤 자재는 규격이 2줄로 되어서 인쇄 시 2장으로 되어 버리고 가독성도 안 좋아」
   ① 묶음 제목 기본값 「① 자재」「② 대차 · 보관료」「③ 기청구분 차감」(설명 뺌). 문서별로 고친 제목(문서 extra.grp_titles, DB1174)이 있으면 그것.
   ⑤ 엑셀표 표 고르기에 「청구서 - 글자」(DB1174 p_sheet='inv') — 건명·청구일자·묶음 제목·줄의 일자·품명·규격·단위. 금액은 「청구 - 자재비」 그대로.
   ⑥ 인쇄 직전 그 문서 extra·줄을 새로 받아 엑셀표에서 고친 글자가 바로 나옴.
   ② 규격 칸 200px, 규격·품명 한 줄(nowrap). 규격이 길면 글자만 작게(24자 넘으면 9px, 34자 넘으면 8px).
   ③ 줄 높이 줄임(위아래 여백 1px, 글자 10.5px — 칸마다 직접 지정, 인쇄 창은 <style>을 안 받음) → 39줄 + 묶음 머리·소계 + 합계가 A4 한 장 안에. 합계·세액 줄은 다음 장으로 갈라지지 않게.
   ④ v9.206(합쳐진 문서 줄 일자 = 그 문서 일자) 그대로 포함. 트레이 재청구서(줄 메모 「MM/DD 구매」)만, 다른 문서는 그대로 안쪽으로. `window.V9209_APPLIED` ═══ */
(function(){
  if (window.V9210_APPLIED) return;
  var DM=/^(\d\d\/\d\d) 구매$/, BN=/^[A-Z]\d{8}$/;
  var _prev=prLines;
  var DEF={1:'① 자재',2:'② 대차 · 보관료',3:'③ 기청구분 차감'};
  window.PR9209={titles:{},cur:null};
  var grpOf=function(l){
    if(!l)return 1;
    if(l.grp==='deduct'||(+l.supply_amt||0)<0)return 3;
    var nm=String(l.item_name||'');
    if(l.grp==='extra'||BN.test(String(l.memo||'').trim())||nm.indexOf('트레이 보관')===0||nm.indexOf('대차')>=0)return 2;
    return 1;
  };
  var bnDate=function(memo){
    var sd=(window.D&&Array.isArray(window.D.sd))?window.D.sd:[],dd=null;
    for(var i=0;i<sd.length;i++){var x=sd[i];if(x&&x.doc_no&&x.doc_date&&x.doc_no.indexOf(memo+'-')===0){dd=String(x.doc_date);if(/-I$/.test(x.doc_no))break}}
    return (dd&&dd.length>=10)?dd.slice(5,7)+'/'+dd.slice(8,10):'';
  };
  var titleOf=function(g){var t=(PR9209.cur&&PR9209.titles[PR9209.cur])||{};var v=t[String(g)];return (v!=null&&String(v).trim()!=='')?String(v):DEF[g]};
  var plain=function(s){return String(s||'').replace(/^[①②③④⑤]\s*/,'')};
  var specCss=function(s){var n=String(s||'').length;return n>24?'white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;line-height:1.15!important;font-size:calc(var(--f29,10.5px) - 1.5px)!important;':''}; /* v9.232: 긴 규격은 칸 안에서 줄바꿈(옆 칸 침범 금지) */
  prLines=function(lines,opt){
    try{
      opt=opt||{};var L=lines||[];var cols=opt.cols||[];
      var MMO=/^\d{1,2}월 구매$/,hasDate=L.some(function(l){return l&&DM.test(l.memo||'')}); /* v9.228 DB1185: 날짜 없이 그 달 합계(「10월 구매」)도 같은 양식, 그때는 일자 칸 없음 */
      if((hasDate||L.some(function(l){return l&&MMO.test(l.memo||'')}))&&cols.length){
        var out=[];
        cols.forEach(function(cc){
          if(!cc||cc.t==='비고')return;
          if(cc.k==='item_name'||cc.k==='item_name305'||cc.t==='품명'||cc.t==='품명 / 품번'){out.push({t:'품명 / 품번',cls:'nm209',nw:1,f:function(l){var n=esc(l.item_name||''),cd=esc(l.item_code||'');return (n||cd)+(n&&cd?' <span class="pc209" style="font-size:calc(var(--f29,10.5px) - 2.5px);color:#64748b">'+cd+'</span>':'')}});return}
          if(cc.k==='spec'||cc.t==='규격'){out.push({t:'규격',w:'192px',cls:'sp209',nw:1,st:function(l){return specCss(l.spec)},f:function(l){return esc(l.spec||'')}});return}
          if(cc.t==='No'){out.push({t:'No',w:'22px',cls:cc.cls,nw:1,f:cc.f});if(hasDate)out.push({t:'일자',w:'38px',cls:'dt209',nw:1,f:function(l){var m=DM.exec(l.memo||'');if(m)return m[1];var mm=/^(\d{1,2}월) 구매$/.exec(l.memo||'');if(mm)return mm[1];var b=String(l.memo||'').trim();return BN.test(b)?bnDate(b):''}});return}
          if(cc.t==='수량'){out.push({t:cc.t,w:'40px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='단위'){out.push({t:cc.t,w:'28px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='단가'){out.push({t:cc.t,w:'66px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='공급가액'||cc.t==='금액'){out.push({t:cc.t,w:'74px',cls:cc.cls,f:cc.f});return}
          if(cc.t==='세액'){out.push({t:cc.t,w:'60px',cls:cc.cls,f:cc.f});return}
          out.push(cc);
        });
        var iSup=-1,iTax=-1;out.forEach(function(c,i){if(c.t==='공급가액'||c.t==='금액')iSup=i;if(c.t==='세액')iTax=i});
        var G={1:[],2:[],3:[]};L.forEach(function(l){G[grpOf(l)].push(l)});
        var act=[1,2,3].filter(function(g){return G[g].length});
        var neg=function(x){return (typeof x==='string')?x.replace(/\(([\d,]+)\)/g,'-$1'):x};
        var w=function(v){v=+v||0;return (v<0?'-':'')+Math.abs(v).toLocaleString('ko-KR')};
        var B='padding-top:var(--p29,0px)!important;padding-bottom:var(--p29,0px)!important;font-size:var(--f29,10.5px)!important;line-height:1.2!important;'; /* v9.229: 글자·줄 높이는 --f29·--p29(한 장 채우기)로 */
        var NW='white-space:nowrap!important;';
        var h='<table class="lines c305 c198 c209"><thead><tr>'+out.map(function(c){return '<th style="'+B+NW+(c.w?'width:'+c.w+';':'')+'">'+c.t+'</th>'}).join('')+'</tr></thead><tbody>';
        var no=0;
        act.forEach(function(g){
          var s=0,t=0,tt=titleOf(g);
          if(act.length>1)h+='<tr class="g209"><td colspan="'+out.length+'" style="'+B+'background:#f1f5f9!important;font-weight:700!important;text-align:left!important">'+esc(tt)+'</td></tr>';
          G[g].forEach(function(l){s+=(+l.supply_amt||0);t+=(+l.tax_amt||0);var i=no++;h+='<tr>'+out.map(function(c){var v=neg(c.f?c.f(l,i):l[c.k]);var st=B+(c.nw?NW:'')+(c.st?c.st(l):'');return '<td class="'+(c.cls||'')+'" style="'+st+'">'+(v==null?'':v)+'</td>'}).join('')+'</tr>'});
          if(act.length>1&&iSup>0){
            h+='<tr class="s209" style="page-break-inside:avoid"><td colspan="'+iSup+'" style="'+B+'text-align:right!important;background:#f8fafc!important;font-weight:700!important">'+esc(plain(tt))+' 소계</td><td class="n" style="'+B+'background:#f8fafc!important;font-weight:700!important">'+w(s)+'</td>'
              +(iTax>iSup?'<td class="n" style="'+B+'background:#f8fafc!important">'+w(t)+'</td>':'')
              +new Array(Math.max(0,out.length-1-Math.max(iSup,iTax))+1).join('<td style="background:#f8fafc!important"></td>')+'</tr>';
          }
        });
        var S=0,T=0;L.forEach(function(l){S+=(+l.supply_amt||0);T+=(+l.tax_amt||0)});
        var FB=B+'font-weight:700!important;background:#eef2f7!important;';
        var foot='';
        if(iSup>0){
          foot+='<tr class="f209" style="page-break-inside:avoid"><td colspan="'+iSup+'" style="'+FB+'text-align:right!important">공급가액 · 세액</td><td class="n" style="'+FB+NW+'">'+w(S)+'</td>'
            +(iTax>iSup?'<td class="n" style="'+FB+NW+'">'+w(T)+'</td>':'')
            +new Array(Math.max(0,out.length-1-Math.max(iSup,iTax))+1).join('<td style="'+FB+'"></td>')+'</tr>';
          foot+='<tr class="f209" style="page-break-inside:avoid"><td colspan="'+iSup+'" style="'+FB+'text-align:right!important">합계 (VAT 포함)</td><td class="n" colspan="'+(out.length-iSup)+'" style="'+FB+NW+'font-size:calc(var(--f29,10.5px) + 1px)!important">'+w(S+T)+'</td></tr>';
        }
        return h+foot+'</tbody></table>';
      }
    }catch(e){console.error('[v9209-prLines]',e)}
    return _prev.apply(this,arguments);
  };
  /* 인쇄 직전: 그 문서의 묶음 제목(extra.grp_titles)·줄(고친 글자 반영)을 새로 받음 — 엑셀표 「청구서」 표에서 고친 것이 바로 인쇄에 나오게 */
  if(typeof printDoc==='function'){
    var _pd=printDoc;
    printDoc=async function(no){
      try{PR9209.cur=no||null;
        var d=(window.D&&Array.isArray(D.sd))?D.sd.filter(function(x){return x.doc_no===no})[0]:null;
        if(d&&typeof sb!=='undefined'&&sb&&sb.from){
          var r=await sb.from('ceo_sd_docs').select('extra,title,doc_date').eq('doc_no',no).limit(1);
          if(r&&!r.error&&r.data&&r.data[0]){d.extra=r.data[0].extra;d.title=r.data[0].title;d.doc_date=r.data[0].doc_date}
          if(d.extra&&d.extra.bill_ym)delete d._lines;
        }
        PR9209.titles[no]=(d&&d.extra&&d.extra.grp_titles)||{};
      }catch(e){}
      return _pd.apply(this,arguments);
    };
  }
  /* 엑셀표 표 고르기에 「청구서 - 글자」 추가(DB1174 p_sheet='inv'). 금액은 「청구 - 자재비」에서 */
  var addOpt=function(){
    var sel=document.getElementById('xl9193_sheet_sel');if(!sel)return false;
    if(!sel.querySelector('option[value="inv"]')){
      var o=document.createElement('option');o.value='inv';o.textContent='청구서 - 글자(품명·규격·일자·묶음 제목)';
      var mat=sel.querySelector('option[value="mat"]');if(mat&&mat.nextSibling)sel.insertBefore(o,mat.nextSibling);else sel.appendChild(o);
    }
    return true;
  };
  var tries=0,iv=setInterval(function(){if(addOpt()||++tries>600)clearInterval(iv)},1000);
  window.V9209_APPLIED=true;window.V9210_APPLIED=true;
})();

/* ═══ v9.211 (Claude, 대표 11-04 21:0x) 확정된 청구서도 「확정 풀고 수정」
   대표: 「마감 풀고 수정하고 싶은데, 마감 푸는 버튼이 없어졌어」 — v2.96의 「확정 풀고 수정」은 견적서·발주서만이었음(청구서는 「새 버전」).
   청구서(invoice)도 세금계산서가 아직 없고 이 청구서로 만든 문서가 없으면 같은 번호 그대로 작성 중(임시)으로 되돌림(DB sd_set_status — 기존 함수).
   되돌린 뒤 트레이 재청구서는 엑셀표(「청구서 - 글자」·「청구 - 자재비」)에서 고치고 「확정 발행」. 세금계산서가 있으면 지금처럼 「새 버전」.
   정산완료·취소 문서는 그대로(버튼 안 나옴). `window.V9211_APPLIED` ═══ */
(function(){
  if(window.V9211_APPLIED)return;
  try{ if(typeof UL296==='object'&&UL296&&!UL296.invoice)UL296.invoice='청구서'; }catch(e){}
  if(typeof ul296Go==='function'){
    var _go=ul296Go;
    ul296Go=async function(no){
      var d=(window.D&&D.sd||[]).filter(function(x){return x.doc_no===no})[0];
      if(!d||d.doc_kind!=='invoice')return _go.apply(this,arguments);
      var nx=(D.sd||[]).filter(function(x){return x.prev_doc_no===no&&x.status!=='void'}).map(function(x){return x.doc_no});
      if(d.has_invoice||nx.length){toast(no+' 은(는) '+(d.has_invoice?'세금계산서가 이미 있어':'이 청구서로 만든 문서('+nx.join(', ')+')가 있어')+' 「새 버전」으로 고칩니다','w');return}
      var rb=!!(d.extra&&d.extra.bill_ym);
      var ok=await ask('확정 풀기',no+' 청구서를 작성 중(임시)으로 되돌려 같은 번호로 고칩니다.'+(rb?'\n\n트레이 자재 청구서는 엑셀표 「청구서 - 글자」(품명·규격·일자·묶음 제목)와 「청구 - 자재비」(수량·단가)에서 고친 뒤 「확정 발행」을 다시 누르세요.':'\n\n고친 뒤 「확정 발행」을 다시 누르세요.'),{ok:'확정 풀기'});
      if(!ok)return;
      var r=await sb.rpc('sd_set_status',{p_doc_no:no,p_status:'draft'});
      if(r.error||!(r.data&&r.data.ok)){toast((r.error&&r.error.message)||(r.data&&r.data.error)||'실패','e');return}
      d.status='draft';delete d._lines;
      toast(no+' 확정 풀림 — 고친 뒤 「확정 발행」','g');
      if(rb){try{if(typeof drClose==='function')drClose()}catch(e){} try{if(window.XL&&XL.open){XL.open();var sel=document.getElementById('xl9193_sheet_sel');if(sel&&sel.querySelector('option[value="inv"]')){sel.value='inv';XL.curSheet='inv';var ym=String(d.extra.bill_ym);var yi=document.getElementById('xl9193_ym_in');if(yi){yi.value=ym}XL.curYm=ym;if(d.partner_id){var ps=document.getElementById('xl9193_ptn_sel');if(ps&&ps.querySelector('option[value="'+d.partner_id+'"]')){ps.value=d.partner_id;XL.curPartner=d.partner_id}}XL.load()}}}catch(e){console.error('[v9211]',e)}}
      else if(typeof docEdit285==='function')docEdit285(no);
    };
  }
  window.V9211_APPLIED=true;
})();

/* ═══ v9.219 (Claude, 11-04 22:2x) 공식 인쇄 — 합친 청구서 줄 비고 칸의 우리 문서번호 숨김
   대표 상시 규칙 「공식서류에는 우리 문서번호를 보이지 말고」. 표지 청구서(B26103103-I) 2번 줄 비고에 몸통 번호 「B26103101」이 찍히던 것.
   트레이 재청구서(「MM/DD 구매」 메모)는 v9.209·v9.210이 따로 처리 — 그 밖의 문서에서 비고가 「영문 1자 + 숫자 8자리」면 인쇄에서만 비움(DB 그대로). `window.V9219_APPLIED` ═══ */
(function(){
  if(window.V9219_APPLIED)return;
  var BN=/^[A-Z]\d{8}$/, DM=/^\d\d\/\d\d 구매$/;
  var _p=prLines;
  prLines=function(lines,opt){
    try{
      if(Array.isArray(lines)&&!lines.some(function(l){return l&&DM.test(l.memo||'')})&&lines.some(function(l){return l&&BN.test(String(l.memo||'').trim())})){
        lines=lines.map(function(l){if(l&&BN.test(String(l.memo||'').trim())){var c=Object.assign({},l);c.memo='';return c}return l});
      }
    }catch(e){}
    var a=[].slice.call(arguments);a[0]=lines;return _p.apply(this,a);
  };
  window.V9219_APPLIED=true;
})();

/* ═══ v9.224 [Claude #1455] 문서 원장 — v9.220 다시 쓰면서 빠진 함수 5개 되살림(없을 때만 정의)
   sg9189Open(문서 열기) · sg9189Detach(청구서에서 빼기) · sg9189DragStart/DragOver/Drop(몸통 끌어 청구서에 넣기)
   DB: public.sd_bill_attach(p_invoice, p_body) / public.sd_bill_detach(p_invoice, p_body) — 대표 계정만 ═══ */
(function(){
  if(window.V9224_APPLIED)return;
  function own(){try{return typeof isOwner==='function'&&isOwner()}catch(e){return false}}
  async function reload(open){try{if(typeof sd874Quick==='function')await sd874Quick()}catch(e){}try{if(typeof gRender==='function')gRender('gSd')}catch(e){}
    if(open){var d=(window.D&&D.sd||[]).filter(function(x){return x.doc_no===open})[0];if(d&&typeof openDoc==='function')openDoc(d)}}
  if(typeof window.sg9189Open!=='function')window.sg9189Open=async function(no){
    if(!no)return;var d=(window.D&&D.sd||[]).filter(function(x){return x.doc_no===no})[0];
    if(!d){try{if(typeof sd874Quick==='function')await sd874Quick()}catch(e){}d=(window.D&&D.sd||[]).filter(function(x){return x.doc_no===no})[0]}
    if(d&&typeof openDoc==='function')return openDoc(d);
    if(typeof toast==='function')toast('문서 목록에 없습니다','e')};
  if(typeof window.sg9189DragStart!=='function')window.sg9189DragStart=function(ev,b){
    if(!own())return;window.SG9189=window.SG9189||{};SG9189.drag=b;try{ev.dataTransfer.setData('text/plain',b);ev.dataTransfer.effectAllowed='link'}catch(e){}};
  if(typeof window.sg9189DragOver!=='function')window.sg9189DragOver=function(ev){
    if(window.SG9189&&SG9189.drag){ev.preventDefault();try{ev.dataTransfer.dropEffect='link'}catch(e){}}};
  if(typeof window.sg9189Drop!=='function')window.sg9189Drop=async function(ev,target){
    try{ev.preventDefault();ev.stopPropagation()}catch(e){}
    var src=(window.SG9189&&SG9189.drag)||'';try{src=src||ev.dataTransfer.getData('text/plain')}catch(e){}
    if(window.SG9189)SG9189.drag=null;
    if(!own()||!src||!target||src===target)return;
    var row=(window.SG9189&&SG9189.rows||[]).filter(function(x){return x.body===target})[0];
    var invs=row?[].concat((row.st&&row.st.invoice)||[],row.invDoc?[row.invDoc]:[],row.combo?[row.combo]:[]):[];
    var inv=invs.filter(function(d){return d&&d.trade_side==='sales'&&d.status==='draft'})[0];
    if(!inv){if(typeof toast==='function')toast('놓은 줄에 고칠 수 있는 매출 청구서(확정 전)가 없습니다','e');return}
    var r;try{r=await sb.rpc('sd_bill_attach',{p_invoice:inv.doc_no,p_body:src})}catch(e){r={error:e}}
    if(r.error||!r.data||!r.data.ok){if(typeof toast==='function')toast((r.error&&r.error.message)||(r.data&&r.data.error)||'넣지 못했습니다','e');return}
    if(typeof toast==='function')toast(src+' → 청구서 '+inv.doc_no+'에 넣음','g');await reload()};
  if(typeof window.sg9189Detach!=='function')window.sg9189Detach=async function(inv,body){
    if(!own()||!inv||!body)return;
    var r;try{r=await sb.rpc('sd_bill_detach',{p_invoice:inv,p_body:body})}catch(e){r={error:e}}
    if(r.error||!r.data||!r.data.ok){if(typeof toast==='function')toast((r.error&&r.error.message)||(r.data&&r.data.error)||'빼지 못했습니다','e');return}
    if(typeof toast==='function')toast(body+' → 청구서 '+inv+'에서 뺌','g');await reload()};
  window.V9224_APPLIED=true;
})();

/* ═══ v9.226 [Claude DB1182] 트레이 사다리형은 그 달 합계 한 줄(비고 「10월 구매」) → 자재내역서 일자 칸에 「10월」 (v9.210 일자 칸에 한 줄 추가). `window.V9226_APPLIED` ═══ */
window.V9226_APPLIED=true;

/* ═══ v9.228 [Claude DB1185] 대표 11-05 15:4x 「전부 날짜 없이 합산」 — 재청구 자재내역서 줄 비고가 모두 「10월 구매」면 v9.210 양식(묶음·소계·바닥 2줄) 그대로, 일자 칸만 뺌. `window.V9228_APPLIED` ═══ */
window.V9228_APPLIED=true;

/* ═══ v9.231 [Claude · 대표 11-05 16:4x·17:0x] 인쇄 3종(청구서·작업내역서·자재내역서) 한 양식으로 — (v9.229 안 대신)
   ① 자재내역서 밑 「첨부: …」 줄 지움 — 청구서(표지)에만, 이름은 「작업내역서 1부 · 자재내역서 1부」
   ② 위쪽은 세 문서 모두 「청구서」 모양: 파란 제목+작은 영문 제목, 공급받는자·공급자 칸 크기, 일자·건명 줄
   ③ 일자·건명 줄을 공급받는자 칸 · 공급자 칸 경계에 맞춤(작업내역서는 작성일자 · 건명)
   ④ 작업내역서: 색 줄임(일한 칸 연회색 한 색, 휴일 줄 옅은 회색·날짜만 빨간 글씨, 묶음 머리 회색), 「당일 금액」 칸 좁게(아래 합계 식은 두 줄로)
   ⑤ A4 한 장 채우기: 먼저 글자를 키우고(자재 10.5→최대 12.5px, 작업 8→최대 12px), 남는 높이는 줄 간격으로 채움. 위쪽은 세 문서 같은 크기로 조금 촘촘히(표에 자리 더 줌).
   DB·저장 없음. 동결 7종 손대지 않음. `window.V9231_APPLIED` ═══ */
(function(){
  if(window.V9231_APPLIED)return;
  if(typeof buildSingleDocHtml!=='function'){console.warn('[v9231] buildSingleDocHtml 없음');return}
  var FONT='\'Noto Sans KR\',\'Malgun Gothic\',sans-serif';
  var st=document.createElement('style');st.id='v9231css';
  st.textContent=[
    '#pr .u29,#pr .u29 *{font-family:'+FONT+'!important}',
    '#pr .u29 .hd,#pr .wl2 .hd{gap:10px!important}',
    /* 일자·건명 줄 — 청구서 일자 칸과 같은 크기 */
    '#pr .m29{margin:0 0 8px!important}',
    '#pr .m29r{display:flex!important;gap:10px!important;margin-top:-1px!important}',
    '#pr .m29r:first-child{margin-top:0!important}',
    '#pr .m29h{flex:1 1 0!important;min-width:0!important;display:flex!important;border:1px solid #cbd5e1!important;line-height:1.35!important}',
    '#pr .m29h .k{flex:0 0 15%!important;box-sizing:border-box!important;background:#f8fafc!important;color:#334155!important;font-weight:600!important;font-size:10.5px!important;text-align:center!important;border-right:1px solid #cbd5e1!important;padding:3px 6px!important;white-space:nowrap!important;display:flex!important;align-items:center!important;justify-content:center!important}',
    '#pr .m29h .v{flex:1 1 auto!important;min-width:0!important;padding:3px 10px!important;font-size:11px!important;color:#0f172a!important;display:flex!important;align-items:center!important}',
    '#pr .m29h.full .k{flex:0 0 calc((100% - 10px) * 0.075)!important}',
    '#pr .m29h.empty{border-color:transparent!important}',
    /* 세 문서 위쪽 같은 크기(청구서 모양, A4 한 장에 표가 더 들어가게 조금 촘촘히) */
    '#pr .u29 h1,#pr .wl2.u29w h1{font-size:24px!important;letter-spacing:12px!important;text-indent:12px!important;text-align:center!important;margin:0 0 10px!important;font-weight:700!important;color:#1e3a8a!important}',
    '#pr .u29 h1 small,#pr .wl2.u29w h1 small{display:block!important;font-size:11.5px!important;letter-spacing:3px!important;text-indent:3px!important;font-weight:600!important;color:#475569!important;margin-top:3px!important}',
    '#pr .u29 .hd,#pr .wl2.u29w .hd{margin-bottom:8px!important}',
    '#pr .u29 .box th,#pr .wl2.u29w .box th{font-size:10.5px!important;padding:3px 6px!important}',
    '#pr .u29 .box td,#pr .wl2.u29w .box td{font-size:11px!important;padding:3px 8px!important}',
    '#pr .u29 .box tr.cap th,#pr .wl2.u29w .box tr.cap th{font-size:12px!important;padding:4px!important}',
    '#pr .u29 img.sealimg,#pr .wl2.u29w img.sealimg{width:40px!important;height:40px!important}',
    '#pr .u29 .tot,#pr .wl2.u29w .tot{margin:8px 0!important;padding:8px 14px!important}',
    /* 작업내역서 색 줄이기 */
    '#pr .wl2.u29w .wv th.pg.pg{background:#e2e8f0!important;color:#0f172a!important;border:1px solid #94a3b8!important}',
    '#pr .wl2.u29w .wv th.pp.pp,#pr .wl2.u29w .wg th.h.h{background:#1e3a8a!important;border-color:#1e3a8a!important}',
    '#pr .wl2.u29w .wv tbody:not(.ft) td.d.d{background:#ffffff!important}',
    '#pr .wl2.u29w .wv tbody:not(.ft) tr.hr td{background:#f8fafc!important}',
    '#pr .wl2.u29w .wv tbody:not(.ft) td.d.d:not(:empty){background:#eef2f7!important}',
    '#pr .wl2.u29w .wv tbody.ft tr.sr td.d.d{background:#f8fafc!important;color:#0f172a!important}',
    '#pr .wl2.u29w .wv tbody.ft tr.gt td,#pr .wl2.u29w .wv tbody.ft tr.gt td.d.d{background:#1e3a8a!important;color:#ffffff!important;font-weight:700!important}',
    '#pr .wl2.u29w .wv td.dn.dn,#pr .wl2.u29w .wv td.dw.dw{background:#ffffff!important;color:#0f172a!important}',
    '#pr .wl2.u29w .wv td.dn.h.h,#pr .wl2.u29w .wv td.dw.h.h{background:#f8fafc!important;color:#b91c1c!important;font-weight:700!important}',
    '#pr .wl2.u29w .wv td.pp.pp{background:transparent!important}',
    '#pr .wl2.u29w .lg.lg{background:#eef2f7!important}',
    '#pr .wl2.u29w .wv td.d b{color:#0f172a!important}',
    '#pr .wl2.u29w .fx29{display:block!important;max-width:calc(var(--wf,8px) * 8.5)!important;margin-left:auto!important;white-space:normal!important;word-break:keep-all!important;line-height:1.2!important;text-align:right!important}',
    /* 글자 키우기(--wf) */
    '#pr .wl2.f29 table.wt td,#pr .wl2.f29 table.wt th{font-size:var(--wf,8px)!important}',
    '#pr .wl2.f29 table.w1 td,#pr .wl2.f29 table.w1 th{padding-top:var(--wp,1px)!important;padding-bottom:var(--wp,1px)!important}',
    '#pr .wl2.f29 .wh{font-size:calc(var(--wf,8px) + 1.5px)!important}',
    '#pr .wl2.f29 .wn{font-size:calc(var(--wf,8px) - .5px)!important}',
    '#pr .wl2.f29 .wv td,#pr .wl2.f29 .wv th{line-height:1.05!important;padding-top:0!important;padding-bottom:0!important}',
    '#pr .wl2.f29 .wv tbody td{padding-top:var(--wv,0px)!important;padding-bottom:var(--wv,0px)!important}',
    '#pr .wl2.f29 .wh{margin:4px 0 2px!important}',
    '#pr .wl2.u29w .wv th.t,#pr .wl2.u29w .wv td.t{width:calc(var(--wf,8px) * 7)!important}'
  ].join('\n');
  document.head.appendChild(st);

  var esc31=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var half=function(k,v,cls){return '<div class="m29h'+(cls?' '+cls:'')+'"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>'};
  var grid=function(P){
    var out='<div class="m29">',q=[];
    var flush=function(){if(!q.length)return;out+='<div class="m29r">'+half(q[0].k,q[0].v)+(q[1]?half(q[1].k,q[1].v):'<div class="m29h empty"></div>')+'</div>';q=[]};
    P.forEach(function(p){if(p.full){flush();out+='<div class="m29r">'+half(p.k,p.v,'full')+'</div>'}else{q.push(p);if(q.length===2)flush()}});
    flush();return out+'</div>';
  };
  var swap=function(node,html){var w=document.createElement('div');w.innerHTML=html;node.parentNode.replaceChild(w.firstChild,node)};
  var _b=buildSingleDocHtml;
  buildSingleDocHtml=async function(no){
    var h=await _b.apply(this,arguments);
    try{
      if(typeof h!=='string'||!h)return h;
      var d=(window.D&&Array.isArray(D.sd))?D.sd.filter(function(x){return x.doc_no===no})[0]:null;
      if(!d)return h;
      var box=document.createElement('div');box.innerHTML=h;
      if(d.doc_kind==='invoice'){
        var mat=!!(d.extra&&d.extra.detail_of);
        Array.prototype.slice.call(box.querySelectorAll('div')).forEach(function(x){
          if(x.querySelector('div'))return;var t=(x.textContent||'').trim();
          if(t.indexOf('첨부:')!==0)return;
          if(mat){x.parentNode.removeChild(x)}else{x.textContent=t.replace('인건비 내역서','작업내역서')}
        });
        var m=box.querySelector('table.meta');
        if(m){
          var P=[];
          Array.prototype.slice.call(m.rows).forEach(function(r){
            if(r.style&&r.style.display==='none')return;
            var c=r.cells;for(var i=0;i<c.length;i++){if(c[i].tagName!=='TH')continue;var td=c[i+1]&&c[i+1].tagName==='TD'?c[i+1]:null;
              P.push({k:c[i].innerHTML,v:td?td.innerHTML:'',full:!!(td&&td.colSpan>1)});}
          });
          swap(m,grid(P));
        }
        return '<div class="u29'+(mat?' u29m':' u29c')+'">'+box.innerHTML+'</div>';
      }
      if(d.doc_kind==='worklog'){
        var wl=box.querySelector('.wl2');if(!wl)return h;
        wl.classList.add('u29w');
        var t1=wl.querySelector('h1.wttl');if(t1){t1.className='';t1.innerHTML='작업내역서<small>WORK SPECIFICATION / 작업내역서</small>'}
        var wm=wl.querySelector('.wmeta');
        if(wm){var bs=wm.querySelectorAll('b'),dt=bs.length>1?bs[1].innerHTML:(bs[0]?bs[0].innerHTML:'');
          swap(wm,grid([{k:'작성일자',v:dt},{k:'건 명',v:esc31(d.title||'')}]));}
        Array.prototype.slice.call(wl.querySelectorAll('table.wv tbody.ft tr')).forEach(function(r){
          var c=r.cells[r.cells.length-1];var t=c?(c.textContent||''):'';if(c&&/×/.test(t)&&t.indexOf('=')>=0)c.textContent=t.slice(t.lastIndexOf('=')+1).trim(); /* v9.232: 「102 공수 × 220,000 =」 식은 빼고 금액만 */
        });
        return box.innerHTML;
      }
      return h;
    }catch(e){console.error('[v9231-build]',e);return h}
  };

  /* 한 장 채우기 — 인쇄 폭(190mm)에서 재서 A4 한 장을 넘지 않게 */
  var mmPx=function(){var t=document.createElement('div');t.style.cssText='position:absolute;visibility:hidden;left:-9999px;top:0;height:100mm;width:10px';document.body.appendChild(t);var v=t.offsetHeight/100;t.parentNode.removeChild(t);return v||3.7795};
  var bsearch=function(set,fits,steps){var lo=0,hi=1;set(1);if(fits())return 1;set(0);if(!fits())return 0;for(var k=0;k<(steps||9);k++){var mid=(lo+hi)/2;set(mid);if(fits())lo=mid;else hi=mid}return lo};
  var fitOne=function(u,kind,MM){
    var old=u.getAttribute('style')||'';
    var W=Math.round(190*MM),LIM=kind==='wl'?Math.floor(265*MM)-6:Math.min(1010,Math.floor(268*MM));
    var tv=kind==='wl'?u.querySelector('table.wv'):null,tvOld=tv?(tv.getAttribute('style')||''):'';
    var cells=Array.prototype.slice.call(u.querySelectorAll('table td'));
    var fits=function(){var tb=u.querySelectorAll('table');for(var i=0;i<tb.length;i++){if(tb[i].scrollWidth>u.clientWidth+1)return false}if(u.scrollHeight>LIM)return false;for(var j=0;j<cells.length;j++){var c=cells[j];if(c.scrollWidth>c.clientWidth+1)return false}return true}; /* v9.232: 칸 넘침도 검사 */
    if(kind==='wl')u.classList.add('f29');
    u.style.setProperty('width',W+'px','important');u.style.setProperty('max-width',W+'px','important');
    if(kind==='wl'){u.style.setProperty('height','auto','important');if(tv)tv.style.setProperty('height','auto','important')}
    var vars={};
    var put=function(k,v){vars[k]=v;u.style.setProperty(k,v)};
    if(kind==='wl'){
      var a=bsearch(function(s){put('--wf',(8+4*s).toFixed(2)+'px');put('--wp',(1+3*s).toFixed(2)+'px')},fits);
      put('--wf',(8+4*a).toFixed(2)+'px');put('--wp',(1+3*a).toFixed(2)+'px');
      put('--wv','0px');var b=bsearch(function(s){put('--wv',(6*s).toFixed(2)+'px')},fits);put('--wv',(6*b).toFixed(2)+'px'); /* 남는 높이는 출역 표 줄 간격으로 */
    }else{
      put('--p29','0px');
      var f=bsearch(function(s){put('--f29',(10.5+2*s).toFixed(2)+'px')},fits);
      put('--f29',(10.5+2*f).toFixed(2)+'px');
      var p=bsearch(function(s){put('--p29',(9*s).toFixed(2)+'px')},fits);
      put('--p29',(9*p).toFixed(2)+'px');
    }
    u.setAttribute('style',old);if(tv)tv.setAttribute('style',tvOld);
    Object.keys(vars).forEach(function(k){u.style.setProperty(k,vars[k])});
    u.dataset.fit29=JSON.stringify(vars);
  };
  var run=function(){
    try{
      var pr=document.getElementById('pr');if(!pr||!pr.classList.contains('on'))return;
      var MM=mmPx();
      Array.prototype.slice.call(pr.querySelectorAll('.u29m')).forEach(function(u){fitOne(u,'mat',MM)});
      Array.prototype.slice.call(pr.querySelectorAll('.wl2')).forEach(function(u){fitOne(u,'wl',MM)});
    }catch(e){console.error('[v9231-fit]',e)}
  };
  window.V9231Fit=run;
  var tm=null,kick=function(){clearTimeout(tm);tm=setTimeout(function(){run();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run)},80)};
  var hook=function(){var b=document.getElementById('prBody');if(!b)return false;new MutationObserver(kick).observe(b,{childList:true});return true};
  if(!hook()){var n=0,iv=setInterval(function(){if(hook()||++n>120)clearInterval(iv)},500)}
  window.addEventListener('beforeprint',run);
  window.V9231_APPLIED=true;window.V9232_APPLIED=true;
})();

/* ═══ v9.232 [Claude · 대표 17:3x] 「BOM 엑셀 올리기 눌렀더니 메일이 없습니다」 — erp mailOpen이 버튼에 mail_id를 넣기 전에 id 변수를 써서 undefined가 넘어감.
   여기서는 열린 메일 번호를 기억했다가 비어 있으면 채워 넣음(안티그래비티가 erp를 고치면 그대로 둬도 됨). `window.V9232B_APPLIED` ═══ */
(function(){
  if(window.V9232B_APPLIED)return;
  var cur=null;
  if(typeof mailOpen==='function'){var _mo=mailOpen;mailOpen=function(m){try{if(m&&m.mail_id)cur=m.mail_id}catch(e){}return _mo.apply(this,arguments)}}
  var fromDrawer=function(){try{var ths=document.querySelectorAll('#dr *');for(var i=0;i<ths.length;i++){if((ths[i].textContent||'').trim()==='메일 번호'){var n=ths[i].nextElementSibling;var v=n&&parseInt((n.textContent||'').trim(),10);if(v)return v}}}catch(e){}return null};
  if(typeof mlRfqBomPick==='function'){var _pk=mlRfqBomPick;mlRfqBomPick=function(mailId){if(!mailId)mailId=cur||fromDrawer();if(!mailId){if(typeof toast==='function')toast('메일 번호를 찾지 못했습니다 — 메일을 다시 열어 주세요','e');return}return _pk.call(this,mailId)}}
  window.V9232B_APPLIED=true;
})();
