/**
 * ═══════════════════════════════════════════════════════════════════════════
 * xl9193.js — 「엑셀표」 엑셀처럼 바로 고치는 표 (v9.193)
 * [C1414-대표지시] 급여 · 청구(인건비 · 자재비) 실시간 스프레드시트 편집기
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function(){
  'use strict';

  var XL = {
    curSheet: 'mat',   // 'mat' | 'labor' | 'pay'
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

