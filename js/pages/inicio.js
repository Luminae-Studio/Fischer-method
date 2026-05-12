// FISCHER METHOD -- inicio.js  (área do aluno)
var _inicioLoading   = false;
var _inicioExec      = [];          // cache para o calendário
var _inicioCalAberto = false;
var _inicioCalAno    = new Date().getFullYear();
var _inicioCalMes    = new Date().getMonth();   // 0-11

// ── ENTRY ─────────────────────────────────────────
function renderInicio() {
  _inicioLoading = false; // reseta flag para evitar spinner eterno ao re-entrar
  var el = document.getElementById('pg-inicio');
  if (!el) return;

  var h    = new Date().getHours();
  var sau  = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = currentProfile ? currentProfile.name.split(' ')[0] : '';

  el.innerHTML =
    '<div class="top-bar">' +
      '<div>' +
        '<div style="font-size:12px;color:var(--muted);">' + sau + ', <span style="color:var(--green-pale);font-weight:600;">' + nome + '</span></div>' +
        '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:-.02em;">Inicio</div>' +
      '</div>' +
      avatarHTML(currentProfile, 'av-sm') +
    '</div>' +
    '<div id="inicio-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  _inicioCalAberto = false;
  loadInicioData();
}

// ── CARGA DE DADOS ────────────────────────────────
async function loadInicioData() {
  if (_inicioLoading) return;
  _inicioLoading = true;
  try {
    var resEx = await sb.from('execucoes')
      .select('data')
      .eq('aluno_id', currentUser.id)
      .eq('concluido', true)
      .order('data', { ascending: false });
    _inicioExec = resEx.data || [];

    var el = document.getElementById('inicio-content');
    if (!el) return;
    el.innerHTML = _mkFreqBlock(_inicioExec) + _mkGridAbas();

  } catch(err) {
    console.error('loadInicioData:', err);
    var el2 = document.getElementById('inicio-content');
    if (el2) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadInicioData()">Tentar novamente</button></p></div>';
  } finally {
    _inicioLoading = false;
  }
}

// ── BLOCO DE FREQUÊNCIA (7 bolinhas) ─────────────
function _mkFreqBlock(exec) {
  var hoje   = new Date();
  var diaSem = hoje.getDay();                        // 0 = Dom
  var seg    = new Date(hoje);
  seg.setDate(hoje.getDate() - ((diaSem + 6) % 7)); // recua até segunda

  var datas  = new Set(exec.map(function(e) { return e.data; }));
  var LABELS = ['S','T','Q','Q','S','S','D'];
  var dots   = '';

  for (var i = 0; i < 7; i++) {
    var d = new Date(seg);
    d.setDate(seg.getDate() + i);
    var iso     = _inicioIsoDate(d);
    var treinou = datas.has(iso);
    var isHoje  = d.toDateString() === hoje.toDateString();

    dots +=
      '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">' +
        '<div style="width:34px;height:34px;border-radius:50%;' +
          (treinou
            ? 'background:var(--green);border:2px solid var(--green);'
            : 'background:transparent;border:2px solid ' +
              (isHoje ? 'var(--green-border)' : 'var(--outline)') + ';') +
          'display:flex;align-items:center;justify-content:center;">' +
          (treinou
            ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : (isHoje ? '<div style="width:6px;height:6px;border-radius:50%;background:var(--green-pale);"></div>' : '')) +
        '</div>' +
        '<div style="font-size:9px;font-weight:700;color:' +
          (isHoje ? 'var(--green-pale)' : 'var(--faint)') +
          ';letter-spacing:.04em;">' + LABELS[i] + '</div>' +
      '</div>';
  }

  return (
    '<div id="freq-block" style="background:var(--surf-mid);border:1px solid var(--outline);' +
    'border-radius:var(--r);padding:16px;margin-bottom:16px;cursor:pointer;" onclick="inicioToggleCal()">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
        '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">Frequencia esta semana</div>' +
        '<span id="freq-arrow" style="font-size:16px;color:var(--faint);">&#x25BE;</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-around;">' + dots + '</div>' +
      '<div id="cal-wrap"></div>' +
    '</div>'
  );
}

// ── TOGGLE CALENDÁRIO ─────────────────────────────
function inicioToggleCal() {
  var wrap  = document.getElementById('cal-wrap');
  var arrow = document.getElementById('freq-arrow');
  if (!wrap) return;

  _inicioCalAberto = !_inicioCalAberto;

  if (_inicioCalAberto) {
    _inicioCalAno = new Date().getFullYear();
    _inicioCalMes = new Date().getMonth();
    wrap.style.cssText = 'margin-top:16px;padding-top:16px;border-top:1px solid var(--outline);';
    wrap.innerHTML = _mkCalMes(_inicioExec, _inicioCalAno, _inicioCalMes);
    if (arrow) arrow.innerHTML = '&#x25B4;';
  } else {
    wrap.style.cssText = '';
    wrap.innerHTML = '';
    if (arrow) arrow.innerHTML = '&#x25BE;';
  }
}

function inicioNavCal(delta) {
  _inicioCalMes += delta;
  if (_inicioCalMes > 11) { _inicioCalMes = 0; _inicioCalAno++; }
  if (_inicioCalMes < 0)  { _inicioCalMes = 11; _inicioCalAno--; }
  var wrap = document.getElementById('cal-wrap');
  if (wrap) wrap.innerHTML = _mkCalMes(_inicioExec, _inicioCalAno, _inicioCalMes);
}

// ── CALENDÁRIO MENSAL ─────────────────────────────
function _mkCalMes(exec, ano, mes) {
  var MESES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var LABS  = ['Seg','Ter','Qua','Qui','Sex','Sab','Dom'];

  var hoje    = new Date();
  var hojeIso = _inicioIsoDate(hoje);
  var datas   = new Set(exec.map(function(e) { return e.data; }));
  var diasMes = new Date(ano, mes + 1, 0).getDate();
  var primDia = (new Date(ano, mes, 1).getDay() + 6) % 7; // 0 = Seg
  var prefix  = ano + '-' + String(mes + 1).padStart(2, '0') + '-';
  var ehAtual = (ano === hoje.getFullYear() && mes === hoje.getMonth());

  var treinosMes = exec.filter(function(e) {
    return e.data && e.data.startsWith(ano + '-' + String(mes + 1).padStart(2, '0'));
  }).length;

  var h = '';

  // Navegação
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;" onclick="event.stopPropagation()">';
  h += '<button onclick="inicioNavCal(-1);event.stopPropagation();" style="width:28px;height:28px;border-radius:50%;background:var(--surf-high);border:1px solid var(--outline);font-size:16px;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;">&#x2039;</button>';
  h += '<div style="font-size:13px;font-weight:700;">' + MESES[mes] + ' ' + ano + '</div>';
  h += ehAtual
    ? '<div style="width:28px;"></div>'
    : '<button onclick="inicioNavCal(1);event.stopPropagation();" style="width:28px;height:28px;border-radius:50%;background:var(--surf-high);border:1px solid var(--outline);font-size:16px;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;">&#x203A;</button>';
  h += '</div>';

  // Labels dias da semana
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px;">';
  LABS.forEach(function(l) {
    h += '<div style="text-align:center;font-size:9px;font-weight:700;color:var(--faint);padding:2px 0;">' + l + '</div>';
  });
  h += '</div>';

  // Grid de dias
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;" onclick="event.stopPropagation()">';
  for (var i = 0; i < primDia; i++) h += '<div></div>';
  for (var d = 1; d <= diasMes; d++) {
    var iso     = prefix + String(d).padStart(2, '0');
    var treinou = datas.has(iso);
    var isHoje  = iso === hojeIso;
    var futuro  = iso > hojeIso;
    h +=
      '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;' +
        (treinou
          ? 'background:var(--green);color:#fff;font-weight:700;'
          : isHoje
            ? 'border:1.5px solid var(--green-pale);color:var(--green-pale);font-weight:700;'
            : futuro ? 'color:var(--faint);' : 'color:var(--muted);') +
      '">' + d + '</div>';
  }
  h += '</div>';

  // Rodapé
  h +=
    '<div style="margin-top:12px;text-align:center;font-size:12px;color:var(--muted);">' +
      'Treinou <strong style="color:var(--green-pale);">' + treinosMes + '</strong> ' +
      (treinosMes === 1 ? 'dia' : 'dias') + ' em ' + MESES[mes] +
    '</div>';

  return h;
}

// ── GRID 6 ABAS ───────────────────────────────────
function _mkGridAbas() {
  var abas = [
    { ico: '&#x1F4AA;', label: 'Treinos',      fn: "go('treinos')"                },
    { ico: '&#x2B50;',  label: 'Extras',        fn: "inicioAbaBreve('Extras')"     },
    { ico: '&#x1F4CB;', label: 'Avaliacoes',    fn: "inicioAbaBreve('Avaliacoes')" },
    { ico: '&#x1F4C8;', label: 'Meu Progresso', fn: "go('progresso')"              },
    { ico: '&#x1F4B3;', label: 'Faturas',       fn: "go('faturas')"                },
    { ico: '&#x1F4C1;', label: 'Arquivos',      fn: "inicioAbaBreve('Arquivos')"   },
  ];

  var h = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
  abas.forEach(function(a) {
    h +=
      '<div onclick="' + a.fn + '" ' +
        'style="background:var(--surf-mid);border:1px solid var(--outline);border-radius:var(--r);' +
        'padding:24px 12px;text-align:center;cursor:pointer;">' +
        '<div style="font-size:34px;margin-bottom:10px;">' + a.ico + '</div>' +
        '<div style="font-size:13px;font-weight:600;">' + a.label + '</div>' +
      '</div>';
  });
  h += '</div>';
  return h;
}

function inicioAbaBreve(nome) {
  toast(nome + ' em breve! &#x1F680;');
}

// ── UTIL ──────────────────────────────────────────
function _inicioIsoDate(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
