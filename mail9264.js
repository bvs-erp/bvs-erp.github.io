(function () {
  'use strict';
  if (window.MAIL9264) return;
  if (typeof window.mailLoad !== 'function' || typeof window.mailOpen !== 'function') return;
  var css = document.createElement('style');
  css.textContent =
    '.m9snip{color:var(--tx3,#6b7280);font-size:12px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:560px;margin-top:2px}' +
    '.m9tag{display:inline-block;font-size:11px;line-height:16px;padding:0 5px;border-radius:4px;margin-right:4px;vertical-align:1px;border:1px solid var(--ln,#ddd);color:var(--tx2,#444);background:var(--sf2,#f6f7f9);font-weight:600}' +
    '.m9k-sec{background:#fee2e2;border-color:#fca5a5;color:#991b1b}.m9k-tax{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}' +
    '.m9k-doc{background:#eff6ff;border-color:#bfdbfe;color:#1e40af}.m9k-due{background:#fff7ed;border-color:#fed7aa;color:#9a3412}' +
    '.m9k-ad{color:#9ca3af}.m9who b{font-weight:600}.m9who .p{display:block;font-size:11.5px;color:#1F5FD1}' +
    '.m9sec{margin:14px 0 6px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px}' +
    '.m9sec .sp{flex:1}.m9sec button{font-weight:400}' +
    '.m9frame{width:100%;height:440px;border:1px solid var(--ln,#ddd);border-radius:8px;background:#fff;resize:vertical;display:block}' +
    '.m9pre{white-space:pre-wrap;word-break:break-word;max-height:440px;overflow:auto;background:var(--sf2,#f6f7f9);padding:10px;border-radius:8px;font-size:13px;margin:0}' +
    '.m9att{width:100%;border-collapse:collapse;font-size:13px}.m9att td{padding:6px 4px;border-bottom:1px solid var(--ln,#eee);vertical-align:middle}' +
    '.m9att td.r{text-align:right;white-space:nowrap}.m9att .dim{color:var(--tx3,#888);font-size:12px}' +
    '.m9q{margin:12px 0;border:1px solid var(--ln,#e5e7eb);border-radius:8px;padding:8px 12px}.m9q summary{cursor:pointer;font-weight:700;font-size:13px}' +
    '.m9q .row{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}' +
    '#m9pv{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}' +
    '#m9pv .bx{background:var(--sf,#fff);width:min(1000px,96vw);height:min(88vh,1100px);border-radius:10px;display:flex;flex-direction:column;overflow:hidden}' +
    '#m9pv .hd{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--ln,#ddd);font-weight:700;font-size:13.5px}' +
    '#m9pv .hd .t{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#m9pv .bd{flex:1;overflow:auto;background:#f3f4f6;display:flex;align-items:flex-start;justify-content:center}' +
    '#m9pv iframe{width:100%;height:100%;border:0;background:#fff}#m9pv img{max-width:100%;margin:12px auto;display:block}';
  document.head.appendChild(css);
  var E = function (s) { return (typeof window.esc === 'function') ? window.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var J = function (v) { return (window.ERPC && ERPC.jsq) ? ERPC.jsq(v) : JSON.stringify(v); };
  var say = function (m, k) { if (typeof window.toast === 'function') window.toast(m, k); };
  try { window.MAIL_TABS = [['open', '처리 대기', ['신규', '확인']], ['done', '보관', ['보관완료', '보관요청']], ['ex', '제외', ['제외']], ['all', '전체', null]];
        if (window.MAIL && !MAIL_TABS.some(function (x) { return x[0] === MAIL.tab; })) MAIL.tab = 'open'; } catch (e) {}
  function when(v) {
    if (!v) return '–';
    var d = new Date(v); if (isNaN(d)) return E(v);
    var k = function (x) { return new Date(x.getTime() + 9 * 3600e3).toISOString(); };
    var a = k(d), n = k(new Date());
    if (a.slice(0, 10) === n.slice(0, 10)) return a.slice(11, 16);
    if (a.slice(0, 4) === n.slice(0, 4)) return a.slice(5, 10) + ' ' + a.slice(11, 16);
    return a.slice(2, 10);
  }
  function kindTag(k) {
    if (!k || k === '미분류') return '';
    var c = k === '보안 의심' ? 'm9k-sec' : k === '세금계산서 알림' ? 'm9k-tax' : k === '거래문서' ? 'm9k-doc' : k === '기한 통지' ? 'm9k-due' : k === '광고·고지' ? 'm9k-ad' : '';
    return '<span class="m9tag ' + c + '">' + E(k === '세금계산서 알림' ? '계산서' : k === '광고·고지' ? '광고' : k) + '</span>';
  }
  function addrTags(m) {
    var all = (m.to_addrs || []).concat(m.cc_addrs || []).map(function (x) { return String(x).toLowerCase(); });
    return (all.indexOf('tax@bvs.kr') >= 0 ? '<span class="m9tag m9k-tax">tax@</span>' : '') + (all.indexOf('info@bvs.kr') >= 0 ? '<span class="m9tag">info@</span>' : '');
  }
  window.mailDesc = function () {
    var d = $('mailDesc'); if (!d) return;
    var R = (window.MAIL && MAIL.rows) || [], last = R.reduce(function (a, m) { return (!a || m.received_at > a) ? m.received_at : a; }, null);
    d.textContent = '실시간 수신' + (last ? ' · 최근 메일 ' + (typeof mailDt === 'function' ? mailDt(last) : when(last)) : '');
  };
  window.mailLoad = async function () {
    if (!isOwner() || !window.sb || MAIL.busy) return; MAIL.busy = true;
    var tab = MAIL_TABS.filter(function (x) { return x[0] === MAIL.tab; })[0] || MAIL_TABS[0];
    try {
      var r = await sb.rpc('ceo_mail_list', { p_status: tab[2], p_q: null, p_limit: 500, p_offset: 0 });
      if (r.error) throw r.error;
      var d = r.data || {};
      MAIL.rows = (d.rows || []).map(function (m) {
        var at = m.attachments || [];
        m._at = at.length; m._miss = at.some(function (a) { return !a.fetch_ok && !a.is_big; });
        m._from = m.from_name ? (m.from_name + ' <' + (m.from_addr || '') + '>') : (m.from_addr || '');
        m._to = (m.to_addrs || []).join(', ');
        m._ptn = typeof mailPtnName === 'function' ? mailPtnName(m.partner_id) : '';
        m._who = (m.from_name || m.from_addr || '') + ' ' + (m._ptn || '');
        m._snip = String(m.body_snippet || '').replace(/\s+/g, ' ').trim();
        return m;
      });
      var R = MAIL.rows, tot = +d.total || 0;
      var nw = R.filter(function (m) { return m.status === '신규'; }).length, sec = R.filter(function (m) { return m.kind === '보안 의심'; }).length;
      var n = $('mailN');
      if (n) n.textContent = tot.toLocaleString('ko-KR') + '건' + (tot > R.length ? ' (최근 ' + R.length + '건)' : '') + (nw ? ' · 안 읽음 ' + nw : '') + (sec ? ' · 보안 의심 ' + sec : '');
      window.mailDesc();
      grid('gMail', [
        { k: 'received_at', t: '받은 때', w: 78, f: function (v) { return when(v); } },
        { k: '_who', t: '보낸 사람', l: 1, w: 170, f: function (v, m) {
            var nm = m.from_name || (m.from_addr || '').split('@')[0] || '(알 수 없음)';
            return '<span class="m9who" title="' + E(m._from) + '">' + (m.status === '신규' ? '<b>' + E(nm) + '</b>' : E(nm)) + (m._ptn ? '<span class="p">' + E(m._ptn) + '</span>' : '') + '</span>'; } },
        { k: 'subject', t: '제목', l: 1, w: 470, f: function (v, m) {
            var s = E(v || '(제목 없음)');
            return addrTags(m) + kindTag(m.kind) + (m.status === '신규' ? '<b>' + s + '</b>' : s) + (m._snip ? '<div class="m9snip">' + E(m._snip.slice(0, 140)) + '</div>' : ''); } },
        { k: '_at', t: '첨부', w: 52, f: function (v, m) { return v ? (v + '개' + (m._miss ? ' <span class="neg">미수집</span>' : '')) : '<span class="dim">–</span>'; } },
        { k: 'doc_type', t: '문서', w: 56, f: function (v) { return v ? E(v) : '<span class="dim">–</span>'; } },
        { k: 'status', t: '상태', w: 56, f: function (v) { return v === '신규' ? '<b>안 읽음</b>' : E(v === '보관완료' ? '보관' : v); } }
      ], { rows: MAIL.rows, q: ['subject', '_from', '_ptn', 'kind', '_snip', 'doc_type'], qph: '제목·보낸 사람·거래처·본문', page: 50,
           empty: '메일이 없습니다', onRow: function (m) { window.mailOpen(m); } });
    } catch (e) { console.error(e); say('메일 목록 오류: ' + (e.message || e), 'e'); }
    finally { MAIL.busy = false; }
  };
  function safeDoc(html, allowImg) {
    var csp = "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:" + (allowImg ? ' https: http:' : '');
    return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + csp + '">' +
      '<base target="_blank"><style>body{font:14px/1.6 -apple-system,"Malgun Gothic",sans-serif;margin:12px;color:#111;background:#fff;word-break:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>' +
      String(html || '') + '</body></html>';
  }
  function frame(html, allowImg) {
    var f = document.createElement('iframe');
    f.className = 'm9frame';
    f.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox');
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.srcdoc = safeDoc(html, allowImg);
    return f;
  }
  function decode(buf, hint) {
    var head = new TextDecoder('latin1').decode(buf.slice(0, 2048));
    var m = /charset\s*=\s*["']?([\w-]+)/i.exec(head), cs = (m ? m[1] : hint || 'utf-8').toLowerCase();
    if (/euc-?kr|ks_c_5601|cp949|ms949/.test(cs)) cs = 'euc-kr';
    try { return new TextDecoder(cs).decode(buf); } catch (e) { return new TextDecoder('utf-8').decode(buf); }
  }
  async function signed(sp, name, dl) {
    var r = await sb.storage.from('mail-att').createSignedUrl(sp, 600, dl ? { download: name || true } : undefined);
    if (r.error || !r.data) throw new Error((r.error && r.error.message) || '첨부 주소를 만들지 못했습니다');
    return r.data.signedUrl;
  }
  function kindOf(a) {
    var n = String(a.name || '').toLowerCase(), t = String(a.mime || '').toLowerCase();
    if (/pdf/.test(t) || /\.pdf$/.test(n)) return 'pdf';
    if (/^image\
    if (/html/.test(t) || /\.html?$/.test(n)) return 'html';
    if (/^text\
    return '';
  }
  function pvClose() { var p = $('m9pv'); if (p) p.remove(); }
  async function preview(a) {
    pvClose();
    var k = kindOf(a), p = document.createElement('div'); p.id = 'm9pv';
    p.innerHTML = '<div class="bx"><div class="hd"><span class="t">' + E(a.name) + '</span><span class="sp"></span>' +
      (k === 'html' ? '<button type="button" class="btn sm" data-x="img">외부 그림 보기</button>' : '') +
      '<button type="button" class="btn sm" data-x="dl">내려받기</button><button type="button" class="btn sm" data-x="close">닫기</button></div><div class="bd">불러오는 중…</div></div>';
    document.body.appendChild(p);
    p.addEventListener('mousedown', function (e) { if (e.target === p) pvClose(); });
    p.querySelector('[data-x=close]').onclick = pvClose;
    p.querySelector('[data-x=dl]').onclick = function () { download(a); };
    var bd = p.querySelector('.bd');
    try {
      if (k === 'pdf') { var u = await signed(a.sp); bd.innerHTML = ''; var f = document.createElement('iframe'); f.src = u; bd.appendChild(f); return; }
      if (k === 'img') { var u2 = await signed(a.sp); bd.innerHTML = '<img alt="" src="' + E(u2) + '">'; return; }
      var r = await fetch(await signed(a.sp)); if (!r.ok) throw new Error('내려받기 ' + r.status);
      var txt = decode(await r.arrayBuffer());
      bd.innerHTML = '';
      if (k === 'html') {
        var fr = frame(txt, false); fr.style.height = '100%'; fr.style.border = '0'; fr.style.borderRadius = '0'; bd.appendChild(fr);
        var ib = p.querySelector('[data-x=img]'); if (ib) ib.onclick = function () { fr.srcdoc = safeDoc(txt, true); ib.remove(); };
      } else { var pre = document.createElement('pre'); pre.className = 'm9pre'; pre.style.maxHeight = 'none'; pre.style.width = '100%'; pre.textContent = txt; bd.appendChild(pre); }
    } catch (e) { bd.textContent = '미리보기 실패: ' + (e.message || e); }
  }
  async function download(a) {
    try { var u = await signed(a.sp, a.name, true); var x = document.createElement('a'); x.href = u; x.rel = 'noopener'; document.body.appendChild(x); x.click(); x.remove(); }
    catch (e) { say('내려받기 실패: ' + (e.message || e), 'e'); }
  }
  function attTable(list, dupMap) {
    if (!list.length) return '<div class="dim">첨부 없음</div>';
    return '<table class="m9att"><tbody>' + list.map(function (a, i) {
      var act = '';
      if (a.sp) act = (kindOf(a) ? '<button type="button" class="btn sm" data-pv="' + i + '">보기</button> ' : '') + '<button type="button" class="btn sm" data-dl="' + i + '">내려받기</button>';
      else if (a.fid && typeof mailDriveUrl === 'function' && mailDriveUrl(a.fid)) act = '<a class="btn sm" target="_blank" rel="noopener" href="' + E(mailDriveUrl(a.fid)) + '">드라이브에서 열기</a>';
      else if (a.big) act = '<span class="dim">25MB 넘어 받지 않음</span>';
      else if (a.ok) act = '<span class="dim">대표 PC에만 있음</span>';
      else act = '<span class="neg">미수집</span>';
      var dups = (dupMap[a.seq] || []);
      return '<tr><td>' + E(a.name) + (dups.length ? ' <span class="dim">같은 파일: ' + dups.map(function (id) { return '<a href="#" onclick="event.preventDefault();dl910Mail(' + (+id) + ')">' + E(id) + '</a>'; }).join(', ') + '</span>' : '') +
        '</td><td class="r dim">' + (typeof mailSize === 'function' ? mailSize(a.size) : '') + '</td><td class="r">' + act + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  window.mailOpen = async function (m) {
    if (m.status === '신규') {
      try { var r0 = await sb.rpc('ceo_mail_decide', { p_mail_id: m.mail_id, p_action: '확인' });
            if (!r0.error && r0.data && r0.data.ok) { m.status = '확인'; try { gRender('gMail'); } catch (e) {} try { mailSummaryLoad(); } catch (e) {} } } catch (e) { console.error(e); }
    }
    var b = {};
    try { var rb = await sb.rpc('ceo_mail_body', { p_id: m.mail_id }); if (!rb.error && rb.data) b = rb.data; } catch (e) { console.error(e); }
    var att = Array.isArray(b.att) ? b.att : (m.attachments || []).map(function (a) { return { seq: a.seq, name: a.file_name, size: a.size_bytes, ok: a.fetch_ok, fid: a.drive_file_id, sp: a.storage_path, mime: a.mime, big: a.is_big }; });
    var dupMap = {}; (m.attachments || []).forEach(function (a) { if ((a.dup_mail_ids || []).length) dupMap[a.seq] = a.dup_mail_ids; });
    var ed = (m.status === '신규' || m.status === '확인');
    var ptns = ((window.D && D.ptn) || []).slice().sort(function (a, c) { return String(a.name).localeCompare(String(c.name), 'ko'); }).map(function (p) { return [p.partner_id, p.name]; });
    var id = m.mail_id;
    var head = kv([['받은 때', mailDt(m.received_at, true)], ['보낸 사람', E(m._from || m.from_addr || '') + (m._ptn ? ' <span class="dim">· ' + E(m._ptn) + '</span>' : '')],
      ['받는 주소', E((m.to_addrs || []).join(', '))]].concat((m.cc_addrs || []).length ? [['참조', E((m.cc_addrs || []).join(', '))]] : [])
      .concat([['상태', E(m.status === '보관완료' ? '보관' : m.status) + (m.kind && m.kind !== '미분류' ? ' · ' + E(m.kind) : '') + (m.decided_at ? ' <span class="dim">' + mailDt(m.decided_at, true) + '</span>' : '')], ['메일 번호', E(id)]]));
    var secWarn = (m.kind === '보안 의심' || (m.flags || []).indexOf('보안 의심') >= 0)
      ? '<div style="margin:10px 0;padding:8px 12px;border-radius:8px;background:#fee2e2;color:#991b1b;font-size:13px"><b>보안 의심 메일</b> — 링크를 누르거나 첨부를 열지 마십시오. 보낸 사람 이름과 주소가 다르거나 계정·비밀번호를 묻는 메일입니다.</div>' : '';
    var form = ed ? ('<div class="m9sec">분류</div><input type="hidden" id="ml_ent" value="BVS">' +
      '<div class="fr"><div class="f"><label>분류</label>' + mailSel('ml_kind', MAIL_KIND, m.kind) + '</div><div class="f"><label>문서종류</label>' + mailSel('ml_doc', MAIL_DOC, m.doc_type, '선택') + '</div></div>' +
      '<div class="fr"><div class="f"><label>거래처</label>' + mailSel('ml_ptn', ptns, m.partner_id, '선택') + '</div><div class="f"><label>문서 연결 (문서번호)</label><input id="ml_doc_no" class="in" value="' + E(m.linked_doc_no || '') + '"></div></div>' +
      '<div class="fr"><div class="f" style="flex:1"><label>메모</label><input id="ml_memo" class="in" value="' + E(m.memo || '') + '"></div></div>')
      : ('<div class="m9sec">분류</div>' + kv([['분류', E(m.kind || '')], ['문서종류', E(m.doc_type || '')], ['거래처', E(m._ptn || '')], ['문서 연결', E(m.linked_doc_no || '')], ['메모', E(m.memo || '')]]));
    var quoteish = /견적/.test(m.doc_type || '') || m.kind === '거래문서';
    var qb = [];
    if (typeof window.mlRfqBomPick === 'function') qb.push('<button type="button" class="btn sm" onclick="mlRfqBomPick(' + id + ')">BOM 엑셀로 판매견적</button>');
    if (typeof window.pqModalOpen === 'function') qb.push('<button type="button" class="btn sm" onclick="pqModalOpen({mail_id:' + id + '})">매입견적 올리기</button>');
    if (window.QT9240 && typeof QT9240.fromMail === 'function') qb.push('<button type="button" class="btn sm" onclick="QT9240.fromMail(' + id + ')">빈 견적서</button>');
    var quote = qb.length ? ('<details class="m9q"' + (quoteish ? ' open' : '') + '><summary>견적 만들기</summary><div class="row">' + qb.join('') + '</div>' +
      '<input type="file" id="ml_rfq_bom_file" accept=".xlsx,.xls" style="display:none" onchange="mlRfqBomRead(this.files)"><span class="qt9240mail" style="display:none"></span></details>') : '';
    var body = head + secWarn +
      '<div class="m9sec">본문<span class="sp"></span><span id="m9bt"></span></div><div id="m9body"></div>' +
      '<div class="m9sec">첨부 ' + att.length + '</div>' + attTable(att, dupMap) + form + quote;
    var foot = '';
    if (ed) foot = '<button class="btn p" onclick="mailAct(' + id + ',\'보관\')">보관</button> <button class="btn" onclick="mailAct(' + id + ',\'저장\')">저장</button> <button class="btn" onclick="mailAct(' + id + ',\'제외\')">제외</button> ';
    else if (m.status === '제외' || m.status === '보관완료' || m.status === '보관요청') foot = '<button class="btn" onclick="mailAct(' + id + ',\'되돌리기\')">되돌리기</button> ';
    foot += '<button class="btn" onclick="drClose()">닫기</button>';
    drOpen(m.subject || '(제목 없음)', body, foot);
    var dr = $('dr'); if (dr) dr.classList.add('wide');
    var host = $('m9body'), bt = $('m9bt');
    if (host) {
      var html = b.html, text = b.text;
      if (html && String(html).replace(/<[^>]+>/g, '').trim().length + (/(<img|<table)/i.test(html) ? 1 : 0) > 0) {
        var fr = frame(html, false); host.appendChild(fr);
        if (/<img[^>]+src\s*=\s*["']?https?:/i.test(html) && bt) {
          bt.innerHTML = '<button type="button" class="btn sm">외부 그림 보기</button>';
          bt.firstChild.onclick = function () { fr.srcdoc = safeDoc(html, true); bt.innerHTML = ''; };
        }
        if (text && bt) {
          var tb = document.createElement('button'); tb.type = 'button'; tb.className = 'btn sm'; tb.textContent = '글자만'; tb.style.marginLeft = '4px';
          tb.onclick = function () { host.innerHTML = '<pre class="m9pre">' + E(text) + '</pre>'; bt.innerHTML = ''; }; bt.appendChild(tb);
        }
      } else if (text) host.innerHTML = '<pre class="m9pre">' + E(text) + '</pre>';
      else host.innerHTML = '<div class="m9pre">' + E(m.body_snippet || (att.some(function (a) { return kindOf(a) === 'html'; }) ? '본문이 비어 있습니다 — 내용은 아래 HTML 첨부에 있습니다(「보기」).' : '본문 없음')) + '</div>';
    }
    if (dr) {
      dr.querySelectorAll('[data-pv]').forEach(function (x) { x.onclick = function () { preview(att[+x.getAttribute('data-pv')]); }; });
      dr.querySelectorAll('[data-dl]').forEach(function (x) { x.onclick = function () { download(att[+x.getAttribute('data-dl')]); }; });
    }
    try {
      var i = $('ml_doc_no');
      if (i && typeof window.mlDocChips === 'function' && !$('ml_doc_chips')) {
        i.insertAdjacentHTML('afterend', '<div id="ml_doc_chips" style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap"></div>');
        var s = $('ml_ptn'); if (s) s.addEventListener('change', window.mlDocChips); window.mlDocChips();
      }
    } catch (e) { console.error(e); }
  };
  window.MAIL9264 = { preview: preview, download: download, safeDoc: safeDoc };
  try { if (document.getElementById('p-mail') && document.getElementById('p-mail').offsetParent && typeof renderMail === 'function') renderMail(); } catch (e) {}
})();