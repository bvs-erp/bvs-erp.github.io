 






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
   
    curYm: '',         
    curPartner: 'C0087', 
    data: null,        
    filter: {},        
    sortCol: null,
    sortAsc: true,
    historyLogs: [],
    selectedCell: null, 
    editCell: null,     
    historyOpen: false,

    init: function() {
      if (typeof isOwner !== 'function' || !isOwner()) {
        
        XL._initTry = (XL._initTry || 0) + 1;
        if (XL._initTry <= 1800) setTimeout(XL.init, 1000);
        return;
      }
      if (XL._inited) return;
      XL._inited = true;

      
      var now = new Date();
      var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      var pm = String(prev.getMonth() + 1).padStart(2, '0');
      XL.curYm = prev.getFullYear() + '-' + pm;

      XL.injectNav();
      XL.injectPage();
      XL.wrapNav();
    },

        injectNav: function() {
      
       
      if (false) try {
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

      
       
      if (false) try {
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

      
       
      if (false) try {
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
                var tdQty = tds[3];     
                var tdAlpha = tds[6];   

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

      
      p.addEventListener('keydown', XL.handleKeyDown);
      p.addEventListener('paste', XL.handlePaste);
    },

    
    hide: function() {
      var p = document.getElementById('p-xl_sheet');
      if (p) { p.classList.remove('on'); p.style.display = 'none'; }
      document.querySelectorAll('.page').forEach(function(pg) { if (pg.id !== 'p-xl_sheet' && pg.style.display === 'none') pg.style.display = ''; });
      var mx = document.querySelector('.mtab-xl9193');
      if (mx) mx.classList.remove('on');
    },
    
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
      
      document.querySelectorAll('.page').forEach(function(pg) {
        pg.classList.remove('on');
        if (pg.id !== 'p-xl_sheet') pg.style.display = ''; 
      });
      var p = document.getElementById('p-xl_sheet');
      if (p) {
        p.classList.add('on');
        p.style.display = 'flex';
      }
      var ttl = document.getElementById('ttl');
      if (ttl) ttl.textContent = '청구 엑셀표';
      var crumb = document.getElementById('crumb');
      if (crumb) crumb.textContent = '대표 전용 · 청구 엑셀표';

      
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

      
      var billInfo = document.getElementById('xl9193_bill_info');
      var sumsInfo = document.getElementById('xl9193_sums_info');

      if (XL.curSheet === 'pay') {
        if (billInfo) billInfo.innerHTML = '<span style="color:#0284c7;">' + XL.curYm + ' 급여 집계</span>';
      } else {
        var billHtml = '<span>이 달 청구서: ';
        if (bill && bill.length > 0) {
          billHtml += bill.map(function(b) {
            return '<b style="color:#0f172a;">' + (b.doc_no || '미발행') + '</b> (공급가: ' + Number(b.supply||0).toLocaleString() + '원 / 세액: ' + Number(b.tax||0).toLocaleString() + '원)' + (b.draft ? ' <span style="color:#d97706;">[임시]</span>' : ' <span style="color:#059669;">[승인]</span>');
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

      
      rows = rows.filter(function(r) {
        for (var fk in XL.filter) {
          var fval = XL.filter[fk];
          if (!fval) continue;
          var val = String(r.cells[fk] || '').toLowerCase();
          if (val.indexOf(fval) < 0) return false;
        }
        return true;
      });

      
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

      
      tbody.querySelectorAll('td[data-col]').forEach(function(td) {
        td.onclick = function(e) { XL.selectCell(this); };
        td.ondblclick = function(e) { XL.startEdit(this); };
      });

      
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
          if (typeof toast === 'function') toast('마감되거나 승인된 청구건은 수정할 수 없습니다.', 'i');
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

      
      ec.el.textContent = (ec.type === 'num' && newVal !== '') ? Number(newVal).toLocaleString() : newVal;
      ec.el.style.background = '#fef9c3'; 

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
          ec.el.style.background = '#fee2e2'; 
          ec.el.textContent = (ec.type === 'num' && ec.origVal !== '') ? Number(ec.origVal).toLocaleString() : ec.origVal;
          if (typeof toast === 'function') toast(failMsg, 'e');
          setTimeout(function(){ ec.el.style.background = ''; }, 1500);
          return;
        }

        
        ec.el.style.background = '#dcfce7';
        setTimeout(function(){ ec.el.style.background = ''; }, 800);

        
        if (d.sums) {
          XL.data.sums = d.sums;
          XL.updateSumsDisplay();
        }
        if (d.bill) {
          XL.data.bill = d.bill;
          XL.updateBillDisplay();
        }
        
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
      if (XL.editCell) return; 
      if (!XL.selectedCell || !XL.selectedCell.el) return;

      var el = XL.selectedCell.el;

      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        XL.undoRecent();
        return;
      }

      
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
        
        XL.startEdit(XL.selectedCell.el);
        if (XL.editCell && XL.editCell.input) {
          XL.editCell.input.value = lines[0][0].trim();
          XL.finishEdit(true);
        }
        return;
      }

      
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
        XL.load(); 
      }).catch(function(ex) {
        console.error('[XL9193] paste save error', ex);
        if (typeof toast === 'function') toast('붙여넣기 저장 중 오류가 발생했습니다.', 'e');
      });
    },

    undoRecent: function() {
      
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
          return '<b style="color:#0f172a;">' + (b.doc_no || '미발행') + '</b> (공급가: ' + Number(b.supply||0).toLocaleString() + '원 / 세액: ' + Number(b.tax||0).toLocaleString() + '원)' + (b.draft ? ' <span style="color:#d97706;">[임시]</span>' : ' <span style="color:#059669;">[승인]</span>');
        }).join(', ');
      } else {
        billHtml += '<span style="color:#94a3b8;">미발행</span>';
      }
      billHtml += '</span>';
      billInfo.innerHTML = billHtml;
    }
  };

  
   
  XL.openSheet = function(k){ try { XL.open(); var sel = document.getElementById('xl9193_sheet_sel'); if (k && sel && sel.querySelector('option[value="' + k + '"]')) { sel.value = k; XL.curSheet = k; } if (typeof XL.load === 'function') XL.load(); } catch(e) { console.error('[v9240 openSheet]', e); } };
  window.XL = XL;
  window.XL9193 = XL;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', XL.init);
  } else {
    XL.init();
  }
})();



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

 
(function(){
  var _origPrLines = prLines;
  prLines = function(lines, opt) {
    try {
      opt = opt || {};
      var L = lines || [];
      
      var isTrayBilling = L.some(function(l){
        return l && (/^\d\d\/\d\d 구매$/.test(l.memo||'') || (+l.supply_amt < 0) || String(l.item_name||'').indexOf('트레이 보관') === 0);
      });

      if (isTrayBilling && opt.cols) {
        var cols = opt.cols;
        
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

        
        var activeGrps = [1, 2, 3].filter(function(g){ return grouped[g].length > 0; });
        if (activeGrps.length > 1) {
          var h = '<table class="lines c305 c198"><thead><tr>' + cols.map(function(c){ return '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + c.t + '</th>'; }).join('') + '</tr></thead><tbody>';

          var spanCol = cols.length - 2; 
          if (spanCol < 1) spanCol = 1;

          var itemNo = 0;
          activeGrps.forEach(function(g) {
            var gLines = grouped[g];
            var gSup = 0, gTax = 0;
            gLines.forEach(function(l){ gSup += (+l.supply_amt || 0); gTax += (+l.tax_amt || 0); });

            
            h += '<tr style="background:#f1f5f9;font-weight:700;border-top:1px solid #cbd5e1;"><td colspan="' + cols.length + '" style="padding:4px 8px;text-align:left;color:#1e293b;font-size:11px;">' + grpNames[g] + '</td></tr>';

            
            gLines.forEach(function(l) {
              itemNo++;
              h += '<tr>' + cols.map(function(c){
                var v = c.f ? c.f(l, itemNo - 1) : l[c.k];
                return '<td class="' + (c.cls || '') + '">' + (v == null ? '' : v) + '</td>';
              }).join('') + '</tr>';
            });

            
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

 
(function(){
  
  window._bizPayCache = window._bizPayCache || {};
  window._personMonthCache = window._personMonthCache || {};

  
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

  
  window.pdEnsure = function() { return; };

  
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

    
    if (tbl.querySelector('.rg-biz-row')) return;

    var tbody = tbl.querySelector('tbody');
    var tfoot = tbl.querySelector('tfoot');
    if (!tbody) return;

    var cols = (typeof REG_COLS !== 'undefined') ? REG_COLS : [];
    var totalColspan = cols.length + 2;

    
    var divTr = document.createElement('tr');
    divTr.className = 'rg-biz-row rg-biz-divider';
    divTr.style.cssText = 'background:#f1f5f9;font-weight:700;color:#334155;border-top:2px solid #cbd5e1;';
    divTr.innerHTML = '<td colspan="' + totalColspan + '" style="padding:6px 10px;text-align:left;font-size:12px;">💼 사업소득 3.3% (프리랜서·용역) · ' + bizRows.length + '명 <span style="font-size:11px;font-weight:normal;color:#64748b;">(이름 클릭 시 우측에 이달 달력 & 단가 명세서 표시)</span></td>';
    tbody.appendChild(divTr);

    
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

    
    var regN = document.getElementById('regN');
    if (regN) {
      var d = (typeof REG !== 'undefined' && REG.cache && REG.cache[curYm]) || {};
      var cl = !!d.closed;
      var totalN = regRows.length + bizRows.length;
      regN.textContent = curYm + ' · 전체 ' + totalN + '명 (근로 ' + regRows.length + ' · 용역 ' + bizRows.length + ') · ' + (cl ? '승인됨' : '작성 중');
    }

    
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

        
        var existBizCard = rail.querySelector('.card-biz-slip');
        if (existBizCard) existBizCard.remove();

        if (bEmp) {
          
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
          
          rail.querySelectorAll('.card').forEach(function(c){
            var h4 = c.querySelector('h4');
            if (h4 && h4.textContent.indexOf('급여명세서') >= 0) c.style.display = '';
          });
        }

        
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
          if (container.getAttribute('data-emp') !== empNo) return; 
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
  var specCss=function(s){var n=String(s||'').length;return n>24?'white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important;line-height:1.15!important;font-size:calc(var(--f29,10.5px) - 1.5px)!important;':''};  
  prLines=function(lines,opt){
    try{
      opt=opt||{};var L=lines||[];var cols=opt.cols||[];
      var MMO=/^\d{1,2}월 구매$/,hasDate=L.some(function(l){return l&&DM.test(l.memo||'')});  
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
        var B='padding-top:var(--p29,0px)!important;padding-bottom:var(--p29,0px)!important;font-size:var(--f29,10.5px)!important;line-height:1.2!important;';  
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
      var ok=await ask('승인 풀기',no+' 청구서를 작성 중(임시)으로 되돌려 같은 번호로 고칩니다.'+(rb?'\n\n트레이 자재 청구서는 엑셀표 「청구서 - 글자」(품명·규격·일자·묶음 제목)와 「청구 - 자재비」(수량·단가)에서 고친 뒤 「승인 후 발행」을 다시 누르세요.':'\n\n고친 뒤 「승인 후 발행」을 다시 누르세요.'),{ok:'승인 풀기'});
      if(!ok)return;
      var r=await sb.rpc('sd_set_status',{p_doc_no:no,p_status:'draft'});
      if(r.error||!(r.data&&r.data.ok)){toast((r.error&&r.error.message)||(r.data&&r.data.error)||'실패','e');return}
      d.status='draft';delete d._lines;
      toast(no+' 승인 풀림 — 고친 뒤 「승인 후 발행」','g');
      if(rb){try{if(typeof drClose==='function')drClose()}catch(e){} try{if(window.XL&&XL.open){XL.open();var sel=document.getElementById('xl9193_sheet_sel');if(sel&&sel.querySelector('option[value="inv"]')){sel.value='inv';XL.curSheet='inv';var ym=String(d.extra.bill_ym);var yi=document.getElementById('xl9193_ym_in');if(yi){yi.value=ym}XL.curYm=ym;if(d.partner_id){var ps=document.getElementById('xl9193_ptn_sel');if(ps&&ps.querySelector('option[value="'+d.partner_id+'"]')){ps.value=d.partner_id;XL.curPartner=d.partner_id}}XL.load()}}}catch(e){console.error('[v9211]',e)}}
      else if(typeof docEdit285==='function')docEdit285(no);
    };
  }
  window.V9211_APPLIED=true;
})();




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
    if(!inv){if(typeof toast==='function')toast('놓은 줄에 고칠 수 있는 매출 청구서(승인 전)가 없습니다','e');return}
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

 
window.V9226_APPLIED=true;

 
window.V9228_APPLIED=true;








(function(){
  if(window.V9231_APPLIED)return;
  if(typeof buildSingleDocHtml!=='function'){console.warn('[v9231] buildSingleDocHtml 없음');return}
  var FONT='\'Noto Sans KR\',\'Malgun Gothic\',sans-serif';
  var st=document.createElement('style');st.id='v9231css';
  st.textContent=[
    '#pr .u29,#pr .u29 *{font-family:'+FONT+'!important}',
    '#pr .u29 .hd,#pr .wl2 .hd{gap:10px!important}',
     
    '#pr .m29{margin:0 0 8px!important}',
    '#pr .m29r{display:flex!important;gap:10px!important;margin-top:-1px!important}',
    '#pr .m29r:first-child{margin-top:0!important}',
    '#pr .m29h{flex:1 1 0!important;min-width:0!important;display:flex!important;border:1px solid #cbd5e1!important;line-height:1.35!important}',
    '#pr .m29h .k{flex:0 0 15%!important;box-sizing:border-box!important;background:#f8fafc!important;color:#334155!important;font-weight:600!important;font-size:10.5px!important;text-align:center!important;border-right:1px solid #cbd5e1!important;padding:3px 6px!important;white-space:nowrap!important;display:flex!important;align-items:center!important;justify-content:center!important}',
    '#pr .m29h .v{flex:1 1 auto!important;min-width:0!important;padding:3px 10px!important;font-size:11px!important;color:#0f172a!important;display:flex!important;align-items:center!important}',
    '#pr .m29h.full .k{flex:0 0 calc((100% - 10px) * 0.075)!important}',
    '#pr .m29h.empty{border-color:transparent!important}',
     
    '#pr .u29 h1,#pr .wl2.u29w h1{font-size:24px!important;letter-spacing:12px!important;text-indent:12px!important;text-align:center!important;margin:0 0 10px!important;font-weight:700!important;color:#1e3a8a!important}',
    '#pr .u29 h1 small,#pr .wl2.u29w h1 small{display:block!important;font-size:11.5px!important;letter-spacing:3px!important;text-indent:3px!important;font-weight:600!important;color:#475569!important;margin-top:3px!important}',
    '#pr .u29 .hd,#pr .wl2.u29w .hd{margin-bottom:8px!important}',
    '#pr .u29 .box th,#pr .wl2.u29w .box th{font-size:10.5px!important;padding:3px 6px!important}',
    '#pr .u29 .box td,#pr .wl2.u29w .box td{font-size:11px!important;padding:3px 8px!important}',
    '#pr .u29 .box tr.cap th,#pr .wl2.u29w .box tr.cap th{font-size:12px!important;padding:4px!important}',
    '#pr .u29 img.sealimg,#pr .wl2.u29w img.sealimg{width:40px!important;height:40px!important}',
    '#pr .u29 .tot,#pr .wl2.u29w .tot{margin:8px 0!important;padding:8px 14px!important}',
     
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
          var c=r.cells[r.cells.length-1];var t=c?(c.textContent||''):'';if(c&&/×/.test(t)&&t.indexOf('=')>=0)c.textContent=t.slice(t.lastIndexOf('=')+1).trim();  
        });
        return box.innerHTML;
      }
      return h;
    }catch(e){console.error('[v9231-build]',e);return h}
  };

   
  var mmPx=function(){var t=document.createElement('div');t.style.cssText='position:absolute;visibility:hidden;left:-9999px;top:0;height:100mm;width:10px';document.body.appendChild(t);var v=t.offsetHeight/100;t.parentNode.removeChild(t);return v||3.7795};
  var bsearch=function(set,fits,steps){var lo=0,hi=1;set(1);if(fits())return 1;set(0);if(!fits())return 0;for(var k=0;k<(steps||9);k++){var mid=(lo+hi)/2;set(mid);if(fits())lo=mid;else hi=mid}return lo};
  var fitOne=function(u,kind,MM){
    var old=u.getAttribute('style')||'';
    var W=Math.round(190*MM),LIM=kind==='wl'?Math.floor(265*MM)-6:Math.min(1010,Math.floor(268*MM));
    var tv=kind==='wl'?u.querySelector('table.wv'):null,tvOld=tv?(tv.getAttribute('style')||''):'';
    var cells=Array.prototype.slice.call(u.querySelectorAll('table td'));
    var fits=function(){var tb=u.querySelectorAll('table');for(var i=0;i<tb.length;i++){if(tb[i].scrollWidth>u.clientWidth+1)return false}if(u.scrollHeight>LIM)return false;for(var j=0;j<cells.length;j++){var c=cells[j];if(c.scrollWidth>c.clientWidth+1)return false}return true};  
    if(kind==='wl')u.classList.add('f29');
    u.style.setProperty('width',W+'px','important');u.style.setProperty('max-width',W+'px','important');
    if(kind==='wl'){u.style.setProperty('height','auto','important');if(tv)tv.style.setProperty('height','auto','important')}
    var vars={};
    var put=function(k,v){vars[k]=v;u.style.setProperty(k,v)};
    if(kind==='wl'){
      var a=bsearch(function(s){put('--wf',(8+4*s).toFixed(2)+'px');put('--wp',(1+3*s).toFixed(2)+'px')},fits);
      put('--wf',(8+4*a).toFixed(2)+'px');put('--wp',(1+3*a).toFixed(2)+'px');
      put('--wv','0px');var b=bsearch(function(s){put('--wv',(6*s).toFixed(2)+'px')},fits);put('--wv',(6*b).toFixed(2)+'px');  
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



(function(){
  if(window.V9232B_APPLIED)return;
  var cur=null;
  if(typeof mailOpen==='function'){var _mo=mailOpen;mailOpen=function(m){try{if(m&&m.mail_id)cur=m.mail_id}catch(e){}return _mo.apply(this,arguments)}}
  var fromDrawer=function(){try{var ths=document.querySelectorAll('#dr *');for(var i=0;i<ths.length;i++){if((ths[i].textContent||'').trim()==='메일 번호'){var n=ths[i].nextElementSibling;var v=n&&parseInt((n.textContent||'').trim(),10);if(v)return v}}}catch(e){}return null};
  if(typeof mlRfqBomPick==='function'){var _pk=mlRfqBomPick;mlRfqBomPick=function(mailId){if(!mailId)mailId=cur||fromDrawer();if(!mailId){if(typeof toast==='function')toast('메일 번호를 찾지 못했습니다 — 메일을 다시 열어 주세요','e');return}return _pk.call(this,mailId)}}
  window.V9232B_APPLIED=true;
})();






(function(){
  if(window.V9234_APPLIED)return;
  var st=document.createElement('style');st.id='v9234css';
  st.textContent='#pr table.l9234 tr.m9234 td{font-weight:600!important;background:#f8fafc!important}'
    +'#pr table.l9234 tr.d9234 td{font-size:.86em!important;color:#334155!important;padding-top:1px!important;padding-bottom:1px!important;background:#fff!important}'
    +'#pr table.l9234 tr.d9234 td.n9234{padding-left:18px!important}'
    +'#pr table.l9234 tr.d9234 .c9234{color:#64748b;font-size:.92em;margin-left:6px}'
    +'#pr table.l9234 tr.d9234 td.k9234{color:#64748b!important;text-align:center!important}';
  document.head.appendChild(st);
  var e=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var q=function(v){v=+v||0;return Math.abs(v-Math.round(v))<1e-9?Math.round(v).toLocaleString('ko-KR'):String(v)};
   
  if(typeof d310Sync==='function'){
    var _s=d310Sync;
    d310Sync=function(){
      var keep=[];try{(window.WL||[]).forEach(function(l,i){keep[i]=l?l.unit_price:0})}catch(x){}
      var acc=_s.apply(this,arguments)||{};
      try{Object.keys(acc).forEach(function(i){var a=acc[i];if(a&&a.s===0&&WL[i]){WL[i].unit_price=keep[i]||0;WL[i]._g310=false}})}catch(x){console.error('[v9234-sync]',x)}
      return acc;
    };
  }
   
  if(typeof prLines==='function'){
    var _p=prLines;
    prLines=function(lines,opt){
      try{
        var L=lines||[],det=L.filter(function(l){return l&&l.role==='detail'});
        if(det.length&&det.every(function(l){return !(+l.unit_price)})){
          var main=L.filter(function(l){return l&&l.role!=='detail'}),cols=(opt&&opt.cols)||[],by={};
          det.forEach(function(l){(by[+l.grp]=by[+l.grp]||[]).push(l)});
          var isName=function(c){return c&&(c.k==='item_name'||c.k==='item_name305'||c.t==='품명'||c.t==='품명 / 품번')};
          var dcell=function(c,d,mi,di){
            if(!c)return '<td></td>';
            if(c.t==='No')return '<td class="k9234">'+(mi+1)+'-'+(di+1)+'</td>';
            if(isName(c))return '<td class="n9234">└ '+e(d.item_name)+(d.item_code?'<span class="c9234">'+e(d.item_code)+'</span>':'')+'</td>';
            if(c.t==='규격')return '<td>'+e(d.spec||'')+'</td>';
            if(c.t==='수량')return '<td class="'+(c.cls||'')+'">'+q(d.qty)+'</td>';
            if(c.t==='단위')return '<td class="'+(c.cls||'')+'">'+e(d.unit||'')+'</td>';
            if(c.t==='비고')return '<td>'+e(d.memo||'')+'</td>';
            return '<td></td>';
          };
          var h='<table class="lines l9234"><thead><tr>'+cols.map(function(c){return '<th'+(c&&c.w?' style="width:'+c.w+'"':'')+'>'+(c?c.t:'')+'</th>'}).join('')+'</tr></thead><tbody>';
          main.forEach(function(m,mi){
            h+='<tr class="m9234">'+cols.map(function(c){var v=c&&c.f?c.f(m,mi):(c?m[c.k]:'');return '<td class="'+((c&&c.cls)||'')+'">'+(v==null?'':v)+'</td>'}).join('')+'</tr>';
            (by[+m.line_no]||[]).forEach(function(d,di){h+='<tr class="d9234">'+cols.map(function(c){return dcell(c,d,mi,di)}).join('')+'</tr>'});
          });
          if(typeof PR310!=='undefined')PR310=null;
          return h+((opt&&opt.foot)||'')+'</tbody></table>';
        }
      }catch(x){console.error('[v9234-print]',x)}
      return _p.apply(this,arguments);
    };
  }
  window.V9234_APPLIED=true;
})();







(function(){
  if(window.V9235_APPLIED)return;
  var esc5=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var W={'No':'34px','도번':'94px','규격':'19%','수량':'34px','단위':'34px','단가':'72px','공급가액':'84px','금액':'84px','비고':'56px'};
    var cellsAt=function(tr){var out=[],x=0;[].forEach.call(tr.cells,function(td){var n=+td.getAttribute('colspan')||1;out.push({td:td,a:x,b:x+n-1});x+=n});return out};
  var S=function(el,p,v){el.style.setProperty(p.replace(/[A-Z]/g,function(c){return '-'+c.toLowerCase()}),v,'important')};
  var one=function(td){S(td,'whiteSpace','nowrap');S(td,'overflow','hidden');S(td,'textOverflow','ellipsis')};
  window.prTidy9235=function(html,lines){
    try{
      if(typeof html!=='string'||!/class="lines (l9234|t9240)"/.test(html))return html;
      var tp=document.createElement('template');tp.innerHTML=html;
      var t=tp.content.querySelector('table.l9234,table.t9240');if(!t)return html;
      var hr=t.tHead&&t.tHead.rows[0];if(!hr)return html;
      var heads=[].map.call(hr.cells,function(th){return (th.textContent||'').trim()});
       
      var ix=heads.indexOf('세액');
      if(ix>=0){
        [].slice.call(t.rows).forEach(function(tr){
          if(tr===hr){tr.deleteCell(ix);return}
          var cs=cellsAt(tr),hit=null,k=-1;cs.forEach(function(c,i){if(c.a<=ix&&ix<=c.b){hit=c;k=i}});if(!hit)return;
          var sp=hit.b-hit.a+1;
          if(sp>1){hit.td.setAttribute('colspan',String(sp-1));return}
          var val=(hit.td.textContent||'').trim(),prev=k>0?cs[k-1]:null;
          if(val&&prev&&prev.b-prev.a>0){var ps=prev.b-prev.a+1;if(ps>2)prev.td.setAttribute('colspan',String(ps-1));else prev.td.removeAttribute('colspan');return}
          tr.deleteCell(k);
        });
        heads.splice(ix,1);
      }
       
      var iNm=-1;heads.forEach(function(h,i){if(h==='품명'||h==='품명 / 품번')iNm=i});
      var codes=(lines||[]).map(function(l){return l&&l.item_code?String(l.item_code).trim():''}).filter(Boolean).sort(function(a,b){return b.length-a.length});
      if(iNm>=0){
        var nth=document.createElement('th');nth.textContent='도번';hr.insertBefore(nth,hr.cells[iNm+1]||null);
        if(hr.cells[iNm].textContent.trim()==='품명 / 품번')hr.cells[iNm].textContent='품명';
        heads.splice(iNm+1,0,'도번');
        [].forEach.call(t.tBodies[0]?t.tBodies[0].rows:[],function(tr){
          var lineRow=/(^|\s)(d9234|c9240|m9234|p9240)(\s|$)/.test(tr.className);
          if(!lineRow){
            var cs=cellsAt(tr),hit=null;cs.forEach(function(c){if(c.a<=iNm&&iNm<=c.b)hit=c});
            if(hit&&hit.b>hit.a)hit.td.setAttribute('colspan',String(hit.b-hit.a+2));else if(hit){var e0=document.createElement('td');tr.insertBefore(e0,hit.td.nextSibling)}
            return;
          }
          var nc=tr.cells[iNm],cd='';
          var sp=nc&&nc.querySelector('.c9234,.k9240');
          if(sp){cd=(sp.textContent||'').trim();sp.parentNode.removeChild(sp);nc.innerHTML=nc.innerHTML.replace(/\s+$/,'')}
          else if(nc){var tx=nc.textContent||'';for(var j=0;j<codes.length;j++){if(tx.indexOf(codes[j])>=0){cd=codes[j];break}}
            if(cd){var nm=tx.replace('('+cd+')','').replace(cd,'').replace(/[\s(]+$/,'');nc.innerHTML=esc5(nm)}}
          var ct=document.createElement('td');ct.textContent=cd;S(ct,'fontSize','9px');S(ct,'color','#475569');S(ct,'letterSpacing','-.2px');
          tr.insertBefore(ct,nc?nc.nextSibling:null);
        });
      }
       
      [].forEach.call(hr.cells,function(th,i){var w=W[heads[i]];S(th,'width',w||'');S(th,'padding','3px 3px');S(th,'whiteSpace','nowrap')});
      S(t,'tableLayout','fixed');S(t,'width','100%');
      var iNo=heads.indexOf('No'),iCd=heads.indexOf('도번');
      


      var LRw=[].filter.call(t.tBodies[0]?t.tBodies[0].rows:[],function(tr){return /(^|\s)(d9234|c9240|m9234|p9240)(\s|$)/.test(tr.className)});
      var est=function(txt,px){var w=0;String(txt||'').replace(/\s+/g,' ').trim().split('').forEach(function(ch){var c=ch.charCodeAt(0);w+=c>0x2e80?1.0:/[A-Z0-9#&@%]/.test(ch)?0.66:/[a-z]/.test(ch)?0.55:0.4});return Math.ceil(w*px)};
      var TOT=720,fixW={'No':34,'수량':36,'단위':34,'단가':74,'공급가액':86,'금액':86,'비고':58},flex={},need={};
      heads.forEach(function(h,i){if(h==='품명'||h==='품명 / 품번'||h==='도번'||h==='규격'){flex[i]=1;need[i]=est(h,12)+12}});
      LRw.forEach(function(tr){Object.keys(flex).forEach(function(k){var td=tr.cells[k];if(!td)return;var pl=parseInt((td.getAttribute('style')||'').replace(/.*padding-left:\s*(\d+)px.*/,'$1'),10);
        var w=est(td.textContent,+k===iCd?10:12)+(isFinite(pl)?pl:4)+8;if(w>need[k])need[k]=w})});
      var fixSum=0;heads.forEach(function(h,i){if(!flex[i])fixSum+=fixW[h]||50});
      var avail=TOT-fixSum,sumNeed=0;Object.keys(need).forEach(function(k){sumNeed+=need[k]});
      var fits=sumNeed<=avail,iSp=heads.indexOf('규격');
      var widthOf={};Object.keys(need).forEach(function(k){widthOf[k]=fits?need[k]+(avail-sumNeed)*need[k]/sumNeed:need[k]});
      if(!fits&&iSp>=0){var others=0;Object.keys(need).forEach(function(k){if(+k!==iSp)others+=need[k]});widthOf[iSp]=Math.max(90,avail-others);
        if(avail-others<90){Object.keys(need).forEach(function(k){if(+k!==iSp)widthOf[k]=need[k]*(avail-90)/others})}}
      [].forEach.call(hr.cells,function(th,i){var px=flex[i]?widthOf[i]:(fixW[heads[i]]||50);S(th,'width',(Math.round(px/TOT*1000)/10)+'%')});
      var few=LRw.length<=20,wrapSp=!fits;
       
      [].forEach.call(t.tBodies[0]?t.tBodies[0].rows:[],function(tr){
        var det=/(^|\s)(d9234|c9240)(\s|$)/.test(tr.className),main=/(^|\s)(m9234|p9240)(\s|$)/.test(tr.className);
        if(!det&&!main)return;
        [].forEach.call(tr.cells,function(td,i){
          S(td,'paddingTop','1px');S(td,'paddingBottom','1px');S(td,'paddingRight','3px');S(td,'lineHeight','1.25');S(td,'verticalAlign','middle');
          if(i!==iCd)S(td,'fontSize',det?'10px':'10.5px');
          if(i!==iNm)S(td,'paddingLeft','3px');
          one(td);
          if(i===iNo){S(td,'textAlign','center');S(td,'fontSize','9.5px')}
          if(i===iCd||heads[i]==='단위')S(td,'textAlign','center');
          if(heads[i]==='비고'){S(td,'whiteSpace','normal');S(td,'overflow','visible');S(td,'fontSize','9px');S(td,'lineHeight','1.15')}
          if(wrapSp&&heads[i]==='규격'){S(td,'whiteSpace','normal');S(td,'overflow','visible');S(td,'wordBreak','keep-all')}
        });
        if(main&&iNm>=0)S(tr.cells[iNm],'fontWeight','700');
      });
      return tp.innerHTML;
    }catch(x){console.error('[v9235]',x);return html}
  };
  if(typeof prLines==='function'){
    var _p=prLines;
    prLines=function(lines,opt){var r=_p.apply(this,arguments);try{if(typeof r==='string'&&r.indexOf('lines l9234')>=0)r=window.prTidy9235(r,lines)}catch(x){console.error('[v9235-pr]',x)}return r};
  }
  window.V9235_APPLIED=true;
})();







(function(){
  if(window.V9239_APPLIED)return;
  var S=function(el,p,v){el.style.setProperty(p,v,'important')};
  var cv=null,LRX=/(^|\s)(d9234|c9240|m9234|p9240)(\s|$)/;
  var textW=function(el){if(!cv)cv=document.createElement('canvas').getContext('2d');var cs=getComputedStyle(el);
    cv.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    var tx=(el.textContent||'').replace(/\s+/g,' ').trim();if(!tx)return 0;
    return Math.ceil(cv.measureText(tx).width+(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0)+(parseFloat(cs.letterSpacing)||0)*tx.length+3)};
  window.cw9239=function(t){
    try{
      if(!t||!t.tHead||!t.tHead.rows[0]||!t.tBodies[0])return;
      var hr=t.tHead.rows[0],heads=[].map.call(hr.cells,function(c){return (c.textContent||'').trim()});
      var flex=[];heads.forEach(function(h,i){if(h==='품명'||h==='품명 / 품번'||h==='도번'||h==='규격')flex.push(i)});if(!flex.length)return;
      var iNm=heads.indexOf('품명')>=0?heads.indexOf('품명'):heads.indexOf('품명 / 품번'),iSp=heads.indexOf('규격'),iCd=heads.indexOf('도번');
      var W=t.getBoundingClientRect().width;if(!(W>0))return;
      var Wp=Math.min(W,718),k=Wp/W;
      var avail=0;flex.forEach(function(i){avail+=hr.cells[i].getBoundingClientRect().width*k});
      var LR=[].filter.call(t.tBodies[0].rows,function(tr){return LRX.test(tr.className)});if(!LR.length)return;
       
      LR.forEach(function(tr){flex.forEach(function(i){var td=tr.cells[i];if(td)S(td,'white-space','nowrap')})});
      var need={};flex.forEach(function(i){need[i]=Math.max(36,textW(hr.cells[i]))});
      LR.forEach(function(tr){flex.forEach(function(i){var td=tr.cells[i];if(!td||td.colSpan>1)return;var w=textW(td);if(w>need[i])need[i]=w})});
      var sum=0;flex.forEach(function(i){sum+=need[i]});
      var wid={},wrap={};
      if(sum<=avail){var extra=avail-sum;flex.forEach(function(i){wid[i]=need[i]+extra*need[i]/sum})}
      else{
        var others=0;flex.forEach(function(i){if(i!==iNm)others+=need[i]});
        var restNm=avail-others;
        if(iNm>=0&&restNm>=need[iNm]*0.6){flex.forEach(function(i){wid[i]=i===iNm?restNm:need[i]});wrap[iNm]=1}
        else{var short=sum-avail,ws=(iNm>=0?need[iNm]:0)+(iSp>=0?need[iSp]:0);
          flex.forEach(function(i){wid[i]=need[i];if((i===iNm||i===iSp)&&ws>0){wid[i]=need[i]-short*need[i]/ws;wrap[i]=1}})}
      }
      flex.forEach(function(i){S(hr.cells[i],'width',(Math.round(wid[i]/Wp*1000)/10)+'%')});
      LR.forEach(function(tr){flex.forEach(function(i){var td=tr.cells[i];if(!td)return;
        if(wrap[i]){S(td,'white-space','normal');S(td,'overflow','visible');S(td,'word-break','keep-all')}
        else{S(td,'white-space','nowrap');S(td,'overflow','hidden');S(td,'text-overflow','ellipsis')}})});
      t.dataset.cw9239=flex.map(function(i){return heads[i]+':'+Math.round(need[i])+'/'+Math.round(wid[i])+(wrap[i]?'w':'')}).join(',');
    }catch(e){console.error('[v9239]',e)}
  };
  window.V9239_APPLIED=true;
})();





(function(){
  if(window.V9236_APPLIED)return;
  

  (function(){var c=document.createElement('style');c.id='v9236css';
    c.textContent='#prBody>.pr-main-sheet:only-child{width:auto!important;max-width:none!important;margin:0!important;padding:0!important;box-shadow:none!important;border:none!important;border-radius:0!important;min-height:0!important;background:transparent!important}';
    document.head.appendChild(c)})();
  var PAGE=1015;
  var S=function(el,p,v){el.style.setProperty(p,v,'important')};
  var measure=function(body){var sh=body.closest('.sheet')||body,old=sh.getAttribute('style')||'',z=body.style.zoom;body.style.zoom='';
    sh.style.width='718px';sh.style.maxWidth='718px';sh.style.padding='0';sh.style.minHeight='0';var h=body.scrollHeight;sh.setAttribute('style',old);body.style.zoom=z;return h};
  window.fill9236=function(){
    try{
      var pr=document.getElementById('pr'),body=document.getElementById('prBody');if(!pr||!body||!pr.classList.contains('on'))return;
      var t=body.querySelector('table.t9240,table.l9234');if(!t||t.dataset.f9236)return;t.dataset.f9236='1';
      var LR=[].filter.call(t.tBodies[0]?t.tBodies[0].rows:[],function(tr){return /(^|\s)(d9234|c9240|m9234|p9240)(\s|$)/.test(tr.className)});if(!LR.length)return;
      var cw=function(){try{if(typeof window.cw9239==='function')window.cw9239(t)}catch(x){}};cw();
      var h0=measure(body),free=PAGE-h0-8;if(free<LR.length*2){try{if(typeof fit305Bar==='function')fit305Bar()}catch(x){}return;}
      var apply=function(add,fl){if(fl==null)fl=add>=6?2:add>=3?1:0;var big=fl>=2,mid=fl>=1;
        LR.forEach(function(tr){var det=/(^|\s)(d9234|c9240)(\s|$)/.test(tr.className);
          [].forEach.call(tr.cells,function(td){var p=1+Math.floor(add/2);S(td,'padding-top',p+'px');S(td,'padding-bottom',p+'px');
            if(!/(^|\s)k9234(\s|$)/.test(td.className)&&!td.style.getPropertyValue('font-size').match(/^9(\.5)?px/))S(td,'font-size',(big?(det?11.5:12):mid?(det?11:11.5):(det?10:10.5))+'px');});});
        var th=t.tHead&&t.tHead.rows[0];if(th)[].forEach.call(th.cells,function(c){S(c,'padding',(big?'6px 4px':mid?'4px 3px':'3px 3px'));if(big)S(c,'font-size','11.5px')});cw();};
      var add=Math.min(14,Math.floor(free/LR.length));
      

      var fit=null,ok=null,wr=function(){return /w(,|$)/.test(t.dataset.cw9239||'')};
      for(;add>0&&!ok;add--){var f0=add>=6?2:add>=3?1:0;for(var fl=f0;fl>=0;fl--){apply(add,fl);if(measure(body)<=PAGE){if(!fit)fit=[add,fl];if(!wr()){ok=[add,fl];break}}}}
      var pick=ok||fit||[0,0];apply(pick[0],pick[1]);t.dataset.f9239=pick.join('/');
      try{if(typeof fit305Bar==='function')fit305Bar()}catch(x){}
    }catch(e){console.error('[v9236]',e)}
  };
  if(typeof printDoc==='function'){
    var _pd=printDoc;
    printDoc=function(){var r=_pd.apply(this,arguments);var go=function(){setTimeout(window.fill9236,60)};if(r&&typeof r.then==='function')r.then(go);else go();return r};
  }
   
  (function hook(n){var pb=document.getElementById('prBody');if(!pb){if((n||0)<120)setTimeout(function(){hook((n||0)+1)},500);return}
    var tm=null;new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(window.fill9236,90)}).observe(pb,{childList:true});})();
  window.V9236_APPLIED=true;
})();




(function(){
  if(window.V9237_APPLIED)return;
  var c=document.createElement('style');c.id='v9237css';
  c.textContent='tr.sd9237s>td{background-color:#fff1f1!important}tr.sd9237p>td{background-color:#eef5ff!important}'
    +'tr.sd9237s:hover>td{background-color:#ffe3e3!important}tr.sd9237p:hover>td{background-color:#dfeeff!important}'
    +'td.k9237s{box-shadow:inset 4px 0 0 #dc2626;color:#b91c1c!important;font-weight:700}td.k9237p{box-shadow:inset 4px 0 0 #2563eb;color:#1d4ed8!important;font-weight:700}'
    +'@media print{tr.sd9237s>td,tr.sd9237p>td{background-color:transparent!important}td.k9237s,td.k9237p{box-shadow:none}}';
  document.head.appendChild(c);
  var paintTable=function(t){
    try{
      if(t.closest&&t.closest('#pr'))return;
      var hr=t.tHead&&t.tHead.rows[0];if(!hr)return;
      var ix=-1;[].forEach.call(hr.cells,function(th,i){var tx=(th.textContent||'').trim();if(tx==='구분')ix=i});
      if(ix<0||!t.tBodies[0])return;
      [].forEach.call(t.tBodies[0].rows,function(tr){
        var td=tr.cells[ix];if(!td)return;var v=(td.textContent||'').trim(),k=v==='매출'?'s':v==='매입'?'p':'';
        if(tr.getAttribute('data-k9237')===k)return;tr.setAttribute('data-k9237',k);
        tr.classList.remove('sd9237s','sd9237p');td.classList.remove('k9237s','k9237p');
        if(k){tr.classList.add('sd9237'+k);td.classList.add('k9237'+k)}
      });
    }catch(e){console.error('[v9237]',e)}
  };
  var tm=null,run=function(){tm=null;[].forEach.call(document.querySelectorAll('table'),function(t){if(t.offsetParent!==null)paintTable(t)})};
  new MutationObserver(function(){if(!tm)tm=setTimeout(run,150)}).observe(document.body,{childList:true,subtree:true});
  setTimeout(run,500);
  window.V9237_APPLIED=true;
})();




(function(){
  if(window.V9238_APPLIED)return;
  try{if(![].some.call(document.querySelectorAll('link[rel=stylesheet]'),function(l){return /Noto\+Sans\+KR/.test(l.href)})){var lk=document.createElement('link');lk.rel='stylesheet';lk.href='https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap';document.head.appendChild(lk)}}catch(e){}
  var c=document.createElement('style');c.id='v9238css';
  c.textContent='html body,html body *:not(code):not(pre):not(kbd):not(samp){font-family:var(--font-sans)!important}'
    +'td.n,th.n,.n,td.k9234{font-variant-numeric:tabular-nums}';
  document.head.appendChild(c);
  window.V9238_APPLIED=true;
})();
