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
    ' html body #modbar{display:none!important}',
    '}',
    '#u66{padding:14px 10px 20px;display:flex;flex-direction:column;gap:2px;font-size:13.5px}',
    '#u66 .h{font-size:11.5px;color:var(--tx3);font-weight:700;padding:10px 10px 4px;letter-spacing:0.02em}',
    '#u66 .i{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:8px;color:#2a2b30;cursor:pointer;line-height:1.25;user-select:none;position:relative}',
    '#u66 .i:hover{background:#efeff1}',
    '#u66 .i.on{background:#e9e9ec;color:#111;font-weight:600}',
    '#u66 .i.on::before{content:"";position:absolute;left:-6px;top:6px;bottom:6px;width:3px;background:#111113;border-radius:2px}',
    '#u66 .i svg{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.8}',
    '#u66 .i .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#u66 .i .n{font-size:11.5px;color:var(--tx3);font-variant-numeric:tabular-nums}',
    '#u66 .i .x{opacity:.5;padding:0 2px}#u66 .i .x:hover{opacity:1}',
    '#u66 .sp{height:8px}',
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
    '#dr{border-left:1px solid var(--ln)!important;box-shadow:var(--shx)!important}',
    'html body,html body :not(code):not(pre):not(kbd):not(samp){font-family:var(--font-sans)!important}',
    'html body{font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}',
    'td,th,.kpi-value,.ck991-kval,input[type=number]{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}',
    '.al-filters:has(> .chip){flex-direction:row!important;align-items:center!important}',
    '.al-filters > .chip{flex:none!important}',
    '.tw{border-radius:10px}',
    'table.eg th,table.glt th{height:36px;padding:0 10px!important;background:#fafafa!important;color:#6b6d75!important;font-weight:500!important;font-size:12px!important;border-bottom:1px solid var(--ln)!important;border-right:0!important}',
    'table.eg td,table.glt td{height:38px;padding:0 10px!important;border-right:0!important;border-bottom:1px solid #f1f1f3!important;font-size:13px}',
    '#p-sh9250{background:var(--bg)}',
    '#p-sh9250 .sh-wrap{border:1px solid var(--ln)!important;border-radius:12px!important;box-shadow:var(--sh)}',
    '#p-sh9250 .sh-sum{background:transparent!important;border:0!important;padding:2px 2px 8px!important;font-size:13px!important;color:var(--tx2)!important}',
    '#p-sh9250 .sh-sum b{font-weight:600}',
    '.sh-btn,.sh-tab{border-radius:8px!important;border:1px solid var(--ln)!important;background:#fff!important;font-weight:500!important;color:#2a2b30!important;padding:6px 12px!important;font-size:12.5px!important}',
    '.sh-btn:hover,.sh-tab:hover{background:#f6f6f7!important}',
    '.sh-btn.pri,.sh-tab.on{background:#111113!important;border-color:#111113!important;color:#fff!important}',
    '.sh-btn.pri[disabled]{background:#e4e4e7!important;border-color:#e4e4e7!important;color:#8b8d94!important}',
    '.sh-in{border-radius:8px!important;border-color:var(--ln)!important;padding:5px 8px!important;font-size:12.5px!important}',
    '.sh-t{font-size:12.5px!important}',
    '.sh-t th,.sh-t td{height:34px!important;padding:0 7px!important;border-right:1px solid #f4f4f5!important;border-bottom:1px solid #f1f1f3!important}',
    '.sh-t td{text-align:left;color:#18181b}',
    '.sh-t td.n,.sh-t td.no{text-align:right}',
    '.sh-t thead th{background:#fafafa!important;color:#6b6d75!important;font-weight:500!important;font-size:12px!important;border-bottom:1px solid var(--ln)!important}',
    '.sh-t td.c-date,.sh-t td.c-time,.sh-t td[class*="date"],.sh-t td[class*="time"]{padding:0 4px!important;letter-spacing:-0.01em}',
    '.sh-t thead tr.f th{top:34px!important;background:#fff!important;height:34px!important;padding:3px 6px!important}',
    '.sh-t thead tr.f input{border:0!important;background:#f4f4f5!important;border-radius:6px!important;height:26px;padding:0 8px!important;font-size:12px!important}',
    '.sh-t thead tr.f input:focus{background:#fff!important;outline:1px solid #d4d4d8}',
    '.sh-t th.no,.sh-t td.no{background:#fff!important;color:#b4b5bb!important;font-size:11.5px}',
    '.sh-t td.ed{background:#fffcf0!important}',
    '.sh-t td.ed:hover{background:#fff6d9!important}',
    '.sh-t td.dirty{background:#fff4d6!important}',
    '.sh-t td.sel{outline:2px solid #2563eb!important;outline-offset:-2px}',
    '.sh-t td.rng{background:#eef4ff!important}',
    '.sh-t tr:hover td{background-color:#fafafa}',
    '.sh-t tfoot td{background:#fafafa!important;border-top:1px solid #e4e4e7!important;font-weight:600!important;color:#111}',
    '.sh-t tr.s-s td,.sh-t tr.s-p td{background-color:#fff}',
    '.sh-t td.c-dep,.sh-t tr.dep td.c-dep{color:#16a34a}',
    '.sh-t tr.wd td.c-wd,.sh-t td.c-wd{color:#18181b}',
    '.sh-t td.c-no{color:#2563eb;text-decoration:none}.sh-t td.c-no:hover{text-decoration:underline}',
    '#qt9240{background:var(--bg)!important;font-size:13px!important}',
    '#qt9240 .qtbar{background:#fff!important;border-bottom:1px solid var(--ln)!important;padding:8px 14px!important;gap:6px!important}',
    '#qt9240 .qtbar button{border-radius:8px!important;border:1px solid var(--ln)!important;background:#fff!important;color:#2a2b30!important;font-weight:500!important;padding:6px 11px!important}',
    '#qt9240 .qtbar button:hover{background:#f6f6f7!important}',
    '#qt9240 .qtbar button.p{background:#111113!important;border-color:#111113!important;color:#fff!important}',
    '#qt9240 .qtbar input,#qt9240 .qtbar select{border-radius:8px!important;border-color:var(--ln)!important;padding:5px 8px!important}',
    '#qt9240 .qtsum{background:#fff!important;border-bottom:1px solid var(--ln)!important;padding:10px 14px!important;font-size:13.5px!important}',
    '#qt9240 #qt_cost{background:#fafafa!important}',
    '#qt9240 #qt_grid{margin:12px 14px;border:1px solid var(--ln);border-radius:12px;background:#fff!important}',
    '#qt9240 th{background:#fafafa!important;color:#6b6d75!important;font-weight:500!important;font-size:12px!important;border:0!important;border-bottom:1px solid var(--ln)!important;height:36px;padding:0 10px!important}',
    '#qt9240 th.qtv{background:#f4f4f5!important;color:#55565c!important}',
    '#qt9240 td{border:0!important;border-bottom:1px solid #f1f1f3!important;border-right:1px solid #f6f6f7!important;height:34px!important;padding:0 8px!important}',
    '#qt9240 td.qtro{background:#fff!important;color:#55565c!important}',
    '#qt9240 td:not(.n){text-align:left!important}',
    '#qt9240 tr.par td{background:#fafafa!important;font-weight:600!important}#qt9240 tr.sub td{background:#fcfcfd!important}',
    '#qt9240 td.qton{outline:2px solid #2563eb!important;background:#f5f8ff!important}',
    '#qt9240 td.qtpick{background:#ecfdf3!important;color:#166534!important}#qt9240 td.qtsim{background:#fffbea!important}',
    '#xl9193_grid_wrap{border:1px solid var(--ln)!important;border-radius:12px!important}',
    '#xl9193_thead{background:#fafafa!important;box-shadow:none!important}',
    '#xl9193_table{font-size:13px!important}',
    '#xl9193_table th{background:#fafafa!important;color:#6b6d75!important;font-weight:500!important;font-size:12px!important;border:0!important;border-bottom:1px solid var(--ln)!important;height:34px}',
    '#xl9193_table td{border:0!important;border-bottom:1px solid #f1f1f3!important;border-right:1px solid #f6f6f7!important;height:34px;padding:0 8px!important}',
    '#xl9193_table tfoot td{background:#fafafa!important;font-weight:600!important;border-top:1px solid #e4e4e7!important}',
    '#ck991{border:1px solid var(--ln)!important;border-radius:14px!important;box-shadow:var(--sh)!important;background:#fff!important}',
    '#ck991 .ck991-hd{background:#fff!important;color:#111!important;padding:16px 20px 10px!important;border-bottom:0!important}',
    '#ck991 .ck991-hd h3{color:#111!important;font-size:18px!important;font-weight:700!important;letter-spacing:-0.02em!important}',
    '#ck991 .ck991-hd .btn{background:#fff!important;color:#2a2b30!important;border:1px solid var(--ln)!important;font-weight:500!important}',
    '#ck991 .ck991-hd .btn:hover{background:#f6f6f7!important}',
    '#ck991 .ck991-bar{background:#fff!important;border-bottom:1px solid var(--ln)!important;padding:6px 20px 12px!important;color:var(--tx3)!important}',
    '#ck991 .ck991-bar select{background:#fff!important;border:1px solid var(--ln)!important;border-radius:8px!important;padding:4px 10px!important;font-weight:600!important}',
    '#ck991 .ck991-krow{border-bottom:1px solid var(--ln)!important;background:#fff!important}',
    '#ck991 .ck991-klbl{background:#fff!important;color:var(--tx3)!important;font-weight:500!important;border-right:1px solid var(--ln2)!important}',
    '#ck991 .ck991-kc{border-right:1px solid var(--ln2)!important;padding:14px 16px!important;align-items:flex-start!important;text-align:left!important}',
    '#ck991 .ck991-kc:hover{background:#fafafa!important}',
    '#ck991 .ck991-kt{background:none!important;color:#6b6d75!important;font-weight:500!important;font-size:12.5px!important;padding:0!important;margin:0 0 6px!important;text-align:left!important}',
    '#ck991 .ck991-kval{font-size:22px!important;font-weight:600!important;text-align:left!important;letter-spacing:-0.02em!important;color:#111!important}',
    '#ck991 .ck991-kval.neg991{color:#e5484d!important}',
    '#ck991 .ck991-kspark{justify-content:flex-start!important;margin-top:8px!important}',
    '#ck991 .ck991-kspark i{background:#d4d4d8!important;width:6px!important;border-radius:2px 2px 0 0!important;opacity:1!important}',
    '#ck991 .ck991-kspark i[style*="dc2626"]{background:#f3b4b6!important}',
    '#ck991 .ck991-kspark i:last-child{background:#111113!important}',
    '#ck991 .ck991-krisk{background:#fffaf0!important;color:#8a5a00!important}',
    '#ck991 table.ck991-tbl{font-size:13px!important}',
    '#ck991 table.ck991-tbl th,#ck991 table.ck991-tbl td{height:36px;padding:0 8px!important;border-right:0!important;border-bottom:1px solid #f1f1f3!important}',
    '#ck991 table.ck991-tbl thead th{background:#fafafa!important;color:#6b6d75!important;font-weight:500!important;font-size:12px!important;border-right:0!important;border-bottom:1px solid var(--ln)!important}',
    '#ck991 table.ck991-tbl thead th.ck991-curm{background:#fafafa!important;color:#111!important;font-weight:700!important;box-shadow:inset 0 -2px 0 #111}',
    '#ck991 table.ck991-tbl td.ck991-curm{background:#fcfcfd!important}',
    '#ck991 table.ck991-tbl td.ck991-cd{color:#a1a3aa!important}',
    '#ck991 table.ck991-tbl td.ck991-nm{color:#18181b!important;padding-left:22px!important}',
    '#ck991 table.ck991-tbl tr td.ck991-cd,#ck991 table.ck991-tbl thead tr th:first-child{display:none!important}',
    '#ck991 table.ck991-tbl td.ck991-nm,#ck991 table.ck991-tbl thead tr th:nth-child(2){min-width:160px!important}',
    '#ck991 table.ck991-tbl td.ck991-tot{background:#fafafa!important;font-weight:600!important}',
    '#ck991 table.ck991-tbl tr.ck991-sec td{background:#fff!important;color:#111!important;font-weight:600!important;font-size:13px!important;height:40px;padding-top:10px!important;cursor:pointer;user-select:none}',
    '#ck991 table.ck991-tbl tr.ck991-sec td:last-child:before{content:"▾";display:inline-block;width:16px;color:#8b8d94;transition:transform .15s}',
    '#ck991 table.ck991-tbl tr.ck991-sec.u66c td:last-child:before{transform:rotate(-90deg)}',
    '#ck991 table.ck991-tbl tr.u66h{display:none!important}',
    '#ck991 table.ck991-tbl tr.ck991-sub td{background:#fafafa!important;color:#111!important;font-weight:600!important;border-top:1px solid #e4e4e7!important;border-bottom:1px solid #e4e4e7!important}',
    '#ck991 table.ck991-tbl tr.ck991-sub td.ck991-nm,#ck991 table.ck991-tbl tr.ck991-gp td.ck991-nm,#ck991 table.ck991-tbl tr.ck991-op td.ck991-nm{padding-left:12px!important}',
    '#ck991 table.ck991-tbl tr.ck991-gp td{background:#f4f4f5!important;color:#111!important;font-weight:700!important;border-top:1px solid #d4d4d8!important;border-bottom:1px solid #e4e4e7!important}',
    '#ck991 table.ck991-tbl tr.ck991-op td{background:#f4f4f5!important;color:#111!important;font-weight:700!important;border-top:1.5px solid #111!important;border-bottom:1px solid #d4d4d8!important}',
    '#ck991 table.ck991-tbl tr.ck991-op td.ck991-cd,#ck991 table.ck991-tbl tr.ck991-op td.ck991-nm{color:#111!important}',
    '#ck991 table.ck991-tbl tr.ck991-rt td{background:#fff!important;color:#8b8d94!important;font-style:normal!important;font-size:12px!important;height:30px}',
    '#ck991 table.ck991-tbl tbody tr.ck991-itm:hover td{background:#fafafa!important}',
    '#ck991 .neg991,#ck991 tr.ck991-op .neg991{color:#e5484d!important;font-weight:inherit!important}',
    '#ck991 > div:last-child{background:#fff!important;border-top:1px solid var(--ln)!important}',
    'html[data-theme="dark"] #sb,html[data-theme="dark"] #modbar,html[data-theme="dark"] #top,html[data-theme="dark"] .sec,html[data-theme="dark"] .card,html[data-theme="dark"] .kpi,html[data-theme="dark"] .btn,html[data-theme="dark"] table th,html[data-theme="dark"] .chip{background:var(--sf)!important;color:var(--tx)!important;border-color:var(--ln)!important}',
    'html[data-theme="dark"] #u66 .i{color:var(--tx2)}html[data-theme="dark"] #u66 .i:hover,html[data-theme="dark"] #u66 .i.on{background:var(--sf2);color:var(--tx)}html[data-theme="dark"] #u66 .i.on::before{background:var(--tx)}',
    'html[data-theme="dark"] .ws-btn.on,html[data-theme="dark"] .btn.p,html[data-theme="dark"] .chip.on{background:#f2f3f5!important;color:#111!important}',
    'html[data-theme="dark"] table tbody tr:hover td{background:var(--sf2)!important}',
    'html[data-theme="dark"] #ck991,html[data-theme="dark"] #ck991 .ck991-hd,html[data-theme="dark"] #ck991 .ck991-bar,html[data-theme="dark"] #ck991 .ck991-krow,html[data-theme="dark"] #ck991 .ck991-klbl,html[data-theme="dark"] #ck991 table.ck991-tbl td,html[data-theme="dark"] #ck991 table.ck991-tbl th,html[data-theme="dark"] .sh-t td,html[data-theme="dark"] .sh-t th,html[data-theme="dark"] #qt9240 td,html[data-theme="dark"] #qt9240 th,html[data-theme="dark"] #xl9193_table td,html[data-theme="dark"] #xl9193_table th,html[data-theme="dark"] table.eg th,html[data-theme="dark"] table.glt th{background:var(--sf)!important;color:var(--tx)!important;border-color:var(--ln)!important}',
    'html[data-theme="dark"] #ck991 .ck991-hd h3,html[data-theme="dark"] #ck991 .ck991-kval,html[data-theme="dark"] #ck991 table.ck991-tbl td.ck991-nm{color:var(--tx)!important}',
    'html[data-theme="dark"] .sh-btn,html[data-theme="dark"] .sh-tab,html[data-theme="dark"] #qt9240 .qtbar button,html[data-theme="dark"] #qt9240 .qtbar,html[data-theme="dark"] #qt9240 .qtsum,html[data-theme="dark"] #qt9240 #qt_grid{background:var(--sf)!important;color:var(--tx)!important;border-color:var(--ln)!important}'
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
    ac_vat: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    fi_bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
    fi_card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    ac_einv: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    hm_cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h2M12 14h2M16 14h0"/>',
    hr_pay: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    pm_tray: '<path d="M3 7h18M3 12h18M3 17h18M6 7v10M18 7v10"/>',
    fd_cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M12 13v5M10 15.5h4"/>'
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
    if (!list.length) { box.innerHTML = ''; return; }
    var cur = window.ST && ST.menu;
    var h = '';
    list.forEach(function (w, idx) {
      var vs = wsViews(w);
      if (!vs || !vs.length) return;
      if (idx > 0) h += '<div class="sp"></div>';
      h += '<div class="h">' + esc(w.t) + '</div>';
      h += vs.map(function (x) {
        var n = count(x[0]);
        return '<div class="i' + (x[0] === cur ? ' on' : '') + '" data-k="' + esc(x[0]) + '" onclick="go(' + J(x[0]) + ')"><svg viewBox="0 0 24 24">' + icon(x[0], x[1]) + '</svg><span class="t">' + esc(x[1]) + '</span>' + (n ? '<span class="n">' + esc(n) + '</span>' : '') + '</div>';
      }).join('');
    });
    if (cur && typeof menuFind === 'function') {
      var inList = list.some(function (w) { return wsViews(w).some(function (x) { return x[0] === cur; }); });
      if (!inList) {
        var it = menuFind(cur);
        if (it) h += '<div class="sp"></div><div class="h">열린 화면</div><div class="i on" title="' + esc(it.m.g + ' › ' + it.t) + '"><svg viewBox="0 0 24 24">' + DOT + '</svg><span class="t">' + esc(it.t) + '</span><span class="x" onclick="event.stopPropagation();wsBack()">×</span></div>';
      }
    }
    box.innerHTML = h;
  }

  var st0 = window.shTabs;
  if (typeof st0 === 'function') window.shTabs = function () { var r = st0.apply(this, arguments); try { side(); } catch (e) { console.error('[ui9266]', e); } return r; };
  setInterval(function () { if (!document.hidden) { try { var box = document.getElementById('u66'); if (box) box.querySelectorAll('.i[data-k]').forEach(function (e) { var k = e.getAttribute('data-k'), n = count(k), s = e.querySelector('.n'); if (n && !s) { e.insertAdjacentHTML('beforeend', '<span class="n"></span>'); s = e.querySelector('.n'); } if (s) s.textContent = n; }); } catch (e) {} } }, 3000);
  try { side(); } catch (e) {}

  var FOLD = {};
  try { FOLD = JSON.parse(localStorage.getItem('u66_ckfold') || '{}') || {}; } catch (e) { FOLD = {}; }
  function foldApply() {
    var tb = document.querySelector('#ck991 table.ck991-tbl tbody'); if (!tb) return;
    var rows = tb.children, hide = false;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.classList.contains('ck991-sec')) { var lt = r.lastElementChild; if (lt && /^\s*\[/.test(lt.textContent)) lt.textContent = lt.textContent.replace(/^\s*\[\s*|\s*\]\s*$/g, ''); var k = (r.textContent || '').trim(); hide = !!FOLD[k]; r.classList.toggle('u66c', hide); continue; }
      if (r.classList.contains('ck991-itm')) r.classList.toggle('u66h', hide); else hide = false;
    }
  }
  document.addEventListener('click', function (e) {
    var tr = e.target && e.target.closest && e.target.closest('#ck991 tr.ck991-sec'); if (!tr) return;
    var k = (tr.textContent || '').trim(); FOLD[k] = !FOLD[k];
    try { localStorage.setItem('u66_ckfold', JSON.stringify(FOLD)); } catch (x) {}
    foldApply();
  });
  var foldT = null;
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var t = ms[i].target; if (t && t.closest && t.closest('#ck991')) { clearTimeout(foldT); foldT = setTimeout(foldApply, 30); return; } }
  }).observe(document.body, { childList: true, subtree: true });

  window.UI9266 = { side: side, fold: foldApply };
})();
