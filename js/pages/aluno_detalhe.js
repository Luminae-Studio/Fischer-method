// FISCHER METHOD -- aluno_detalhe.js
var alunoAtual = null;
var alunoDetTab = 'visao';
var _detGen = 0;

// -- STATUS DINAMICO -------------------------------
function calcStatusDinamico(ultimaData) {
  if (!ultimaData) return 'inativo';
  var diff = Math.floor((new Date() - new Date(ultimaData + 'T12:00:00')) / 86400000);
  if (diff <= 2) return 'ativo';
  if (diff === 3) return 'pausa';
  return 'inativo';
}

function statusInfo(status) {
  var map = {
    ativo:   { label: 'Ativo',     color: 'var(--green-pale)', bg: 'rgba(45,106,45,0.15)' },
    pausa:   { label: 'Em pausa',  color: 'var(--gold)',       bg: 'rgba(201,168,76,0.15)' },
    inativo: { label: 'Inativo',   color: 'var(--red)',        bg: 'rgba(224,85,85,0.15)' }
  };
  return map[status] || map.inativo;
}

async function abrirAlunoDetalhe(id) {
  _detGen++; // cancel any in-flight requests from a previous student
  var res = await sb.from('profiles').select('*').eq('id', id).single();
  if (!res.data) { toast('Erro ao carregar aluno.'); return; }
  alunoAtual = res.data;
  alunoDetTab = 'visao';
  document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('on'); });
  var el = document.getElementById('pg-aluno-det');
  if (el) el.classList.add('on');
  document.getElementById('scr').scrollTo({ top: 0, behavior: 'instant' });
  renderAlunoDetalhe();
}

function renderAlunoDetalhe() {
  var el = document.getElementById('pg-aluno-det');
  if (!el || !alunoAtual) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<button class="btn btn-ghost btn-sm" onclick="voltarAlunos()">&#x2190; Voltar</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="editarAluno()">Editar</button>' +
    '</div>' +
    '<div id="alu-header" style="padding:0 20px 16px;"></div>' +
    '<div class="tabs" style="padding:0 20px;overflow-x:auto;scrollbar-width:none;">' +
      '<button class="tab' + (alunoDetTab==='visao'?' on':'') + '" onclick="switchDetTab(\'visao\',this)">Visao geral</button>' +
      '<button class="tab' + (alunoDetTab==='treinos'?' on':'') + '" onclick="switchDetTab(\'treinos\',this)">Treinos</button>' +
      '<button class="tab' + (alunoDetTab==='medidas'?' on':'') + '" onclick="switchDetTab(\'medidas\',this)">Medidas</button>' +
      '<button class="tab' + (alunoDetTab==='progresso'?' on':'') + '" onclick="switchDetTab(\'progresso\',this)">Progresso</button>' +
      '<button class="tab' + (alunoDetTab==='plano'?' on':'') + '" onclick="switchDetTab(\'plano\',this)">Plano</button>' +
      '<button class="tab' + (alunoDetTab==='notas'?' on':'') + '" onclick="switchDetTab(\'notas\',this)">Notas</button>' +
      '<button class="tab' + (alunoDetTab==='anamnese'?' on':'') + '" onclick="switchDetTab(\'anamnese\',this)">Anamnese</button>' +
      '<button class="tab' + (alunoDetTab==='feedbacks'?' on':'') + '" onclick="switchDetTab(\'feedbacks\',this)">Feedbacks</button>' +
    '</div>' +
    '<div id="alu-det-content" style="padding:0 20px 20px;"></div>';

  loadDetHeader();
  loadDetTab();
}

async function loadDetHeader() {
  var el = document.getElementById('alu-header');
  if (!el || !alunoAtual) return;
  var a = alunoAtual;
  var gen = _detGen;
  try {
    var resEx = await sb.from('execucoes').select('data').eq('aluno_id', a.id).eq('concluido', true).order('data', {ascending: false}).limit(1);
    if (_detGen !== gen || !alunoAtual) return; // navigated away
    var el2 = document.getElementById('alu-header');
    if (!el2) return;
    var ultimaData = resEx.data && resEx.data[0] ? resEx.data[0].data : null;
    var status = calcStatusDinamico(ultimaData);
    var si = statusInfo(status);
    el2.innerHTML =
      '<div style="display:flex;gap:16px;align-items:flex-start;">' +
        avatarHTML(a, 'av-xl') +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;margin-bottom:2px;">' + (a.name||'Aluno') + '</div>' +
          '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;">' + (a.email||'') + '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<span style="font-size:11px;font-weight:700;color:' + si.color + ';background:' + si.bg + ';border:1px solid ' + si.color + ';padding:3px 10px;border-radius:99px;">' + si.label + '</span>' +
            (a.data_inicio ? '<span style="font-size:11px;color:var(--muted);background:var(--surf-high);border:1px solid var(--outline);padding:3px 10px;border-radius:99px;">Desde ' + new Date(a.data_inicio+'T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}) + '</span>' : '') +
          '</div>' +
          (a.objetivo ? '<div style="font-size:12px;color:var(--green-pale);margin-top:6px;font-weight:500;">&#x25CF; ' + a.objetivo + '</div>' : '') +
        '</div>' +
      '</div>';
  } catch(err) {
    console.error('loadDetHeader:', err);
  }
}

function switchDetTab(tab, btn) {
  alunoDetTab = tab;
  document.querySelectorAll('#pg-aluno-det .tab').forEach(function(t) { t.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  loadDetTab();
}

async function loadDetTab() {
  var gen = ++_detGen;
  var el = document.getElementById('alu-det-content');
  if (!el) return;
  var tab = alunoDetTab;
  el.innerHTML = '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';
  try {
    if (tab === 'visao') await loadDetVisao(gen);
    else if (tab === 'treinos') await loadDetTreinos(gen);
    else if (tab === 'medidas') await loadDetMedidas(gen);
    else if (tab === 'progresso') await loadDetProgresso(gen);
    else if (tab === 'plano') await loadDetPlano(gen);
    else if (tab === 'notas') await loadDetNotas(gen);
    else if (tab === 'anamnese') await loadDetAnamnese(gen);
    else if (tab === 'feedbacks') await loadDetFeedbacksDet(gen);
  } catch(err) {
    if (_detGen !== gen) return; // stale — a newer tab took over
    console.error('loadDetTab [' + tab + ']:', err);
    var el2 = document.getElementById('alu-det-content');
    if (el2 && el2.isConnected) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadDetTab()">Tentar novamente</button></p></div>';
  }
}

// -- VISAO GERAL -----------------------------------
async function loadDetVisao(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
  // Busca ultima avaliacao
  var resAv = await sb.from('avaliacoes')
    .select('peso,altura,imc,gordura_pct,pressao,data')
    .eq('aluno_id', a.id)
    .order('data', {ascending: false})
    .limit(1);
  if (_detGen !== gen || !alunoAtual) return;
  var av = resAv.data && resAv.data[0];

  var resEx = await sb.from('execucoes').select('data').eq('aluno_id', a.id).eq('concluido', true).order('data',{ascending:false});
  if (_detGen !== gen || !alunoAtual) return;
  var streak = calcStreak(resEx.data||[]);
  var ultimo = resEx.data && resEx.data[0];

  var resTr = await sb.from('treinos').select('*').eq('aluno_id', a.id).eq('ativo', true);
  if (_detGen !== gen || !alunoAtual) return;
  var treinos = resTr.data || [];

  var el = document.getElementById('alu-det-content');
  if (!el || !el.isConnected) return;

  var html = '';

  // STATS
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">';
  html += mkDetStat(String(streak), 'dias seguidos', streak > 0);
  html += mkDetStat(ultimo ? diasDesde(ultimo.data) : '--', 'ultimo treino', false);
  html += '</div>';

  // DADOS CORPORAIS
  html += '<div class="card mb">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Dados corporais</div>';
  if (av) {
    html += '<button class="btn btn-ghost btn-xs" onclick="switchDetTab(\'medidas\',null)">Ver historico</button>';
  }
  html += '</div>';

  if (av) {
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';

    // Peso
    if (av.peso) html += mkMedida(av.peso + ' kg', 'Peso');

    // Altura
    if (av.altura) html += mkMedida(av.altura + ' cm', 'Altura');

    // IMC com classificacao
    if (av.imc) {
      var imcClass = av.imc < 18.5 ? 'Abaixo do peso' : av.imc < 25 ? 'Normal' : av.imc < 30 ? 'Sobrepeso' : av.imc < 35 ? 'Obesidade I' : 'Obesidade II+';
      var imcColor = av.imc < 25 ? 'var(--green-pale)' : av.imc < 30 ? 'var(--gold)' : 'var(--red)';
      html += mkMedidaColor(String(av.imc), 'IMC · ' + imcClass, imcColor);
    }

    // Pressao arterial
    if (av.pressao) {
      var parts = av.pressao.split('/');
      var pColor = 'var(--muted)';
      var pClass = '';
      if (parts.length === 2) {
        var sis = parseInt(parts[0]), dia = parseInt(parts[1]);
        pClass = (sis < 120 && dia < 80) ? 'Normal' : (sis < 130 && dia < 80) ? 'Elevada' : (sis < 140 || dia < 90) ? 'Hiper I' : 'Hiper II';
        pColor = pClass === 'Normal' ? 'var(--green-pale)' : pClass === 'Elevada' ? 'var(--gold)' : 'var(--red)';
      }
      html += mkMedidaColor(av.pressao, 'Pressao' + (pClass ? ' · ' + pClass : ''), pColor);
    }

    // Gordura
    if (av.gordura_pct) {
      html += mkMedida(av.gordura_pct + '%', '% Gordura');
    }

    html += '</div>';
    html += '<div style="font-size:10px;color:var(--muted);margin-top:10px;">Avaliacao de ' + new Date(av.data+'T12:00:00').toLocaleDateString('pt-BR') + '</div>';
  } else {
    html += '<div style="text-align:center;padding:16px 0;">';
    html += '<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Nenhuma avaliacao ainda</div>';
    html += '<button class="btn btn-primary btn-sm" onclick="openNovaAvaliacao()">Fazer primeira avaliacao</button>';
    html += '</div>';
  }
  html += '</div>';

  // TREINOS ATIVOS
  html += '<div class="card mb">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Treinos ativos</div>';
  html += '<button class="btn btn-primary btn-xs" onclick="openNovoTreino()">+ Treino</button>';
  html += '</div>';
  if (!treinos.length) {
    html += '<div style="text-align:center;padding:12px 0;color:var(--muted);font-size:12px;">Nenhum treino montado ainda</div>';
  } else {
    treinos.forEach(function(t) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline);">';
      html += '<div style="width:36px;height:36px;border-radius:var(--rx);background:var(--green-glow);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:16px;">&#x1F4AA;</div>';
      html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + t.nome + '</div>';
      html += '<div style="font-size:11px;color:var(--muted);">' + (t.dia_semana||'Qualquer dia') + '</div></div>';
      html += '<button class="btn btn-ghost btn-xs" onclick="editarTreino(\'' + t.id + '\')">Editar</button>';
      html += '</div>';
    });
  }
  html += '</div>';

  el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

// -- TREINOS ---------------------------------------
async function loadDetTreinos(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
    var res = await sb.from('execucoes').select('*, treinos(nome)').eq('aluno_id', a.id).order('data',{ascending:false}).limit(20);
    if (_detGen !== gen || !alunoAtual) return;
    var el = document.getElementById('alu-det-content');
    if (!el || !el.isConnected) return;
    var exec = res.data || [];
    if (!exec.length) { el.innerHTML = '<div class="empty"><div class="empty-ico">&#x1F4AA;</div><p>Nenhum treino registrado ainda.</p></div>'; return; }
    var html = '<div class="card">';
    exec.forEach(function(e) {
      var dt = new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--outline);">';
      html += '<div style="width:40px;height:40px;border-radius:var(--rx);background:' + (e.concluido?'var(--green-glow)':'var(--surf-high)') + ';border:1px solid ' + (e.concluido?'var(--green-border)':'var(--outline)') + ';display:flex;align-items:center;justify-content:center;font-size:16px;">' + (e.concluido?'&#x2713;':'&#x23F3;') + '</div>';
      html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + (e.treinos?e.treinos.nome:'Treino') + '</div>';
      html += '<div style="font-size:11px;color:var(--muted);">' + dt + (e.duracao_min?' &middot; '+e.duracao_min+'min':'') + '</div></div>';
      html += '<span class="badge ' + (e.concluido?'badge-green':'badge-muted') + '">' + (e.concluido?'OK':'Parcial') + '</span>';
      html += '</div>';
    });
    el.innerHTML = html + '</div>';
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

// -- MEDIDAS (Historico de avaliacoes) --------------
async function loadDetMedidas(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
  var res = await sb.from('avaliacoes')
    .select('*')
    .eq('aluno_id', a.id)
    .order('data', {ascending: false});
  if (_detGen !== gen || !alunoAtual) return;
  var el = document.getElementById('alu-det-content');
  if (!el || !el.isConnected) return;
  var avaliacoes = res.data || [];

  var html = '';

  // Botao nova avaliacao (so personal)
  html += '<button class="btn btn-primary btn-full mb" onclick="openNovaAvaliacao()">+ Nova avaliacao</button>';

  if (!avaliacoes.length) {
    html += '<div class="card" style="text-align:center;padding:30px;">';
    html += '<div style="font-size:13px;color:var(--muted);">Nenhuma avaliacao registrada ainda.</div>';
    html += '</div>';
    el.innerHTML = html;
    return;
  }

  // HISTORICO — lista com data clicavel
  html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Historico (' + avaliacoes.length + ')</div>';

  avaliacoes.forEach(function(av, idx) {
    var dtLabel = new Date(av.data + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'});
    var badges = [];
    if (av.peso) badges.push(av.peso + ' kg');
    if (av.imc) badges.push('IMC ' + av.imc);
    if (av.gordura_pct) badges.push(av.gordura_pct + '% gord.');
    if (av.pressao) badges.push(av.pressao);

    html += '<div class="card mb" style="cursor:pointer;" onclick="toggleAvDetalhes(\'av-det-' + idx + '\')">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div>';
    html += '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">' + dtLabel + '</div>';
    if (badges.length) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      badges.forEach(function(b) {
        html += '<span style="font-size:10px;color:var(--green-pale);background:var(--green-glow);border:1px solid var(--green-border);padding:2px 8px;border-radius:99px;">' + b + '</span>';
      });
      html += '</div>';
    }
    html += '</div>';
    html += '<span style="font-size:18px;color:var(--muted);transition:transform .2s;" id="av-arrow-' + idx + '">&#x203A;</span>';
    html += '</div>';

    // Detalhes (inicialmente oculto)
    html += '<div id="av-det-' + idx + '" style="display:none;margin-top:14px;border-top:1px solid var(--outline);padding-top:14px;">';

    // Dados basicos
    var temBasico = av.peso || av.altura || av.imc || av.gordura_pct || av.pressao || av.cin_quad;
    if (temBasico) {
      html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dados basicos</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
      if (av.peso) html += mkMedida(av.peso + ' kg', 'Peso');
      if (av.altura) html += mkMedida(av.altura + ' cm', 'Altura');
      if (av.imc) {
        var imcClass = av.imc < 18.5 ? 'Abaixo do peso' : av.imc < 25 ? 'Normal' : av.imc < 30 ? 'Sobrepeso' : av.imc < 35 ? 'Obesidade I' : 'Obesidade II+';
        var imcColor = av.imc < 25 ? 'var(--green-pale)' : av.imc < 30 ? 'var(--gold)' : 'var(--red)';
        html += mkMedidaColor(String(av.imc), 'IMC · ' + imcClass, imcColor);
      }
      if (av.pressao) {
        var pparts = av.pressao.split('/');
        var pColor2 = 'var(--muted)', pClass2 = '';
        if (pparts.length === 2) {
          var sis2 = parseInt(pparts[0]), dia2 = parseInt(pparts[1]);
          pClass2 = (sis2 < 120 && dia2 < 80) ? 'Normal' : (sis2 < 130 && dia2 < 80) ? 'Elevada' : (sis2 < 140 || dia2 < 90) ? 'Hiper I' : 'Hiper II';
          pColor2 = pClass2 === 'Normal' ? 'var(--green-pale)' : pClass2 === 'Elevada' ? 'var(--gold)' : 'var(--red)';
        }
        html += mkMedidaColor(av.pressao, 'Pressao' + (pClass2 ? ' · ' + pClass2 : ''), pColor2);
      }
      if (av.gordura_pct) html += mkMedida(av.gordura_pct + '%', '% Gordura');
      if (av.cin_quad) html += mkMedida(String(av.cin_quad), 'Cin/Quad');
      html += '</div>';
    }

    // Circunferencias
    var circDados = [
      {key:'peito', label:'Peito'}, {key:'bunda', label:'Bunda'},
      {key:'coxa_d', label:'Coxa Dir.'}, {key:'coxa_e', label:'Coxa Esq.'},
      {key:'braco_d', label:'Braco Dir.'}, {key:'braco_e', label:'Braco Esq.'},
      {key:'panturrilha', label:'Panturrilha'}, {key:'abdomen', label:'Abdomen'}
    ];
    var temCirc = circDados.some(function(c) { return av[c.key]; });
    if (temCirc) {
      html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Circunferencias (cm)</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
      circDados.forEach(function(c) {
        if (av[c.key]) html += mkMedida(av[c.key] + ' cm', c.label);
      });
      html += '</div>';
    }

    // Dobras cutaneas
    var dobrasDados = [
      {key:'dobra_tricipital', label:'Tricipital'}, {key:'dobra_subescapular', label:'Subescap.'},
      {key:'dobra_suprailiaca', label:'Suprailiaca'}, {key:'dobra_abdominal', label:'Abdominal'},
      {key:'dobra_coxa', label:'Coxa'}, {key:'dobra_panturrilha', label:'Panturrilha'}
    ];
    var temDobras = dobrasDados.some(function(d) { return av[d.key]; });
    if (temDobras) {
      html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dobras cutaneas (mm)</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">';
      dobrasDados.forEach(function(d) {
        if (av[d.key]) html += mkMedida(av[d.key] + ' mm', d.label);
      });
      html += '</div>';
    }

    // Objetivo e observacoes
    if (av.objetivo) {
      html += '<div style="margin-bottom:8px;">';
      html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Objetivo</div>';
      html += '<div style="font-size:13px;color:var(--white);">' + av.objetivo + '</div>';
      html += '</div>';
    }
    if (av.obs) {
      html += '<div style="margin-bottom:8px;">';
      html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Observacoes</div>';
      html += '<div style="font-size:13px;color:var(--white);line-height:1.6;">' + av.obs + '</div>';
      html += '</div>';
    }

    html += '</div>'; // fecha av-det
    html += '</div>'; // fecha card
  });

  el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

// Abre/fecha detalhes de uma avaliacao no historico
function toggleAvDetalhes(id) {
  var det = document.getElementById(id);
  if (!det) return;
  var idx = id.replace('av-det-', '');
  var arrow = document.getElementById('av-arrow-' + idx);
  var isOpen = det.style.display !== 'none';
  det.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
}

// -- PROGRESSO -------------------------------------
async function loadDetProgresso(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
  // Busca avaliacoes em ordem cronologica (fonte unica de verdade)
  var resAv = await sb.from('avaliacoes')
    .select('data, peso, imc, gordura_pct, pressao')
    .eq('aluno_id', a.id)
    .order('data', {ascending: true});
  if (_detGen !== gen || !alunoAtual) return;
  var el = document.getElementById('alu-det-content');
  if (!el || !el.isConnected) return;
  var avs = resAv.data || [];

  if (!avs.length) {
    el.innerHTML =
      '<div class="empty">' +
        '<div class="empty-ico">&#x1F4C8;</div>' +
        '<p>Nenhum dado de progresso ainda.<br>' +
        '<span style="font-size:12px;color:var(--muted);">Os dados aparecem automaticamente<br>ao registrar uma avalia\u00e7\u00e3o.</span></p>' +
      '</div>';
    return;
  }

  var html = '';

  // ── GRAFICO DE PESO ──────────────────────────────
  var comPeso = avs.filter(function(a) { return a.peso; });
  if (comPeso.length) {
    var pesos = comPeso.map(function(a) { return a.peso; });
    var maxP = Math.max.apply(null, pesos);
    var minP = Math.min.apply(null, pesos);
    var range = maxP - minP || 1;
    var ultimos = comPeso.slice(-10);

    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Evolu\u00e7\u00e3o do peso</div>';
    html += '<div style="font-size:11px;color:var(--muted);">' + comPeso.length + ' avalia\u00e7\u00e3o' + (comPeso.length > 1 ? '\u00f5es' : '') + '</div>';
    html += '</div>';

    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:90px;margin-bottom:10px;">';
    ultimos.forEach(function(a) {
      var barH = comPeso.length === 1 ? 60 : Math.round(((a.peso - minP) / range) * 60 + 10);
      var dt = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      html += '<div style="font-size:9px;color:var(--green-pale);font-weight:700;">' + a.peso + '</div>';
      html += '<div style="width:100%;height:' + barH + 'px;background:var(--green);border-radius:3px 3px 0 0;opacity:0.85;"></div>';
      html += '<div style="font-size:8px;color:var(--muted);text-align:center;">' + dt + '</div>';
      html += '</div>';
    });
    html += '</div>';

    if (comPeso.length > 1) {
      var diff = Math.round((pesos[pesos.length - 1] - pesos[0]) * 10) / 10;
      var diffColor = diff < 0 ? 'var(--green-pale)' : diff > 0 ? 'var(--red)' : 'var(--muted)';
      var diffLabel = diff === 0 ? 'Peso est\u00e1vel desde o in\u00edcio' : (diff > 0 ? '+' : '') + diff + ' kg desde o in\u00edcio';
      html += '<div style="font-size:12px;color:' + diffColor + ';font-weight:600;text-align:center;padding-top:8px;border-top:1px solid var(--outline);">' + diffLabel + '</div>';
    }
    html += '</div>';
  }

  // ── EVOLUCAO DE IMC ──────────────────────────────
  var comIMC = avs.filter(function(a) { return a.imc; });
  if (comIMC.length) {
    var imcs = comIMC.map(function(a) { return a.imc; });
    var maxI = Math.max.apply(null, imcs);
    var minI = Math.min.apply(null, imcs);
    var rangeI = maxI - minI || 1;
    var ultimosI = comIMC.slice(-10);

    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Evolu\u00e7\u00e3o do IMC</div>';
    var ultimoIMC = imcs[imcs.length - 1];
    var imcClass = ultimoIMC < 18.5 ? 'Abaixo do peso' : ultimoIMC < 25 ? 'Normal' : ultimoIMC < 30 ? 'Sobrepeso' : ultimoIMC < 35 ? 'Obesidade I' : 'Obesidade II+';
    var imcColor = ultimoIMC < 25 ? 'var(--green-pale)' : ultimoIMC < 30 ? 'var(--gold)' : 'var(--red)';
    html += '<span style="font-size:11px;font-weight:700;color:' + imcColor + ';">' + ultimoIMC + ' · ' + imcClass + '</span>';
    html += '</div>';

    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:70px;margin-bottom:10px;">';
    ultimosI.forEach(function(a) {
      var barH = comIMC.length === 1 ? 50 : Math.round(((a.imc - minI) / rangeI) * 45 + 10);
      var iColor = a.imc < 25 ? 'var(--green)' : a.imc < 30 ? 'var(--gold)' : 'var(--red)';
      var dt = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      html += '<div style="font-size:9px;font-weight:700;color:' + iColor + ';">' + a.imc + '</div>';
      html += '<div style="width:100%;height:' + barH + 'px;background:' + iColor + ';border-radius:3px 3px 0 0;opacity:0.85;"></div>';
      html += '<div style="font-size:8px;color:var(--muted);">' + dt + '</div>';
      html += '</div>';
    });
    html += '</div>';

    if (comIMC.length > 1) {
      var diffI = Math.round((imcs[imcs.length - 1] - imcs[0]) * 10) / 10;
      var diffIColor = diffI < 0 ? 'var(--green-pale)' : diffI > 0 ? 'var(--red)' : 'var(--muted)';
      html += '<div style="font-size:12px;color:' + diffIColor + ';font-weight:600;text-align:center;padding-top:8px;border-top:1px solid var(--outline);">' + (diffI > 0 ? '+' : '') + diffI + ' desde o in\u00edcio</div>';
    }
    html += '</div>';
  }

  // ── EVOLUCAO DE % GORDURA ────────────────────────
  var comGord = avs.filter(function(a) { return a.gordura_pct; });
  if (comGord.length) {
    var gords = comGord.map(function(a) { return a.gordura_pct; });
    var maxG = Math.max.apply(null, gords);
    var minG = Math.min.apply(null, gords);
    var rangeG = maxG - minG || 1;
    var ultimosG = comGord.slice(-10);

    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Evolu\u00e7\u00e3o da gordura</div>';
    html += '<span style="font-size:11px;color:var(--muted);">' + gords[gords.length - 1] + '%</span>';
    html += '</div>';

    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:70px;margin-bottom:10px;">';
    ultimosG.forEach(function(a) {
      var barH = comGord.length === 1 ? 50 : Math.round(((a.gordura_pct - minG) / rangeG) * 45 + 10);
      var dt = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      html += '<div style="font-size:9px;color:var(--gold);font-weight:700;">' + a.gordura_pct + '%</div>';
      html += '<div style="width:100%;height:' + barH + 'px;background:var(--gold);border-radius:3px 3px 0 0;opacity:0.75;"></div>';
      html += '<div style="font-size:8px;color:var(--muted);">' + dt + '</div>';
      html += '</div>';
    });
    html += '</div>';

    if (comGord.length > 1) {
      var diffG = Math.round((gords[gords.length - 1] - gords[0]) * 10) / 10;
      var diffGColor = diffG < 0 ? 'var(--green-pale)' : diffG > 0 ? 'var(--red)' : 'var(--muted)';
      html += '<div style="font-size:12px;color:' + diffGColor + ';font-weight:600;text-align:center;padding-top:8px;border-top:1px solid var(--outline);">' + (diffG > 0 ? '+' : '') + diffG + '% desde o in\u00edcio</div>';
    }
    html += '</div>';
  }

  // Se tem so 1 avaliacao, mostra aviso
  if (avs.length === 1) {
    html += '<div style="text-align:center;padding:8px 0 4px;">';
    html += '<span style="font-size:11px;color:var(--muted);">A evolu\u00e7\u00e3o aparecer\u00e1 com mais avalia\u00e7\u00f5es registradas.</span>';
    html += '</div>';
  }

  el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

// -- NOTAS -----------------------------------------
async function loadDetNotas(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
  var res = await sb.from('notas_aluno').select('*').eq('aluno_id', a.id).order('created_at',{ascending:false});
  if (_detGen !== gen || !alunoAtual) return;
  var el = document.getElementById('alu-det-content');
  if (!el || !el.isConnected) return;
  var notas = res.data || [];

  var tipoInfo = {
    observacao: { icon: '&#x1F4CB;', label: 'Observacao', color: 'var(--blue)' },
    lesao:      { icon: '&#x26A0;',  label: 'Lesao / Limitacao', color: 'var(--red)' },
    meta:       { icon: '&#x1F3AF;', label: 'Meta', color: 'var(--green-pale)' }
  };

  var html =
    '<div class="card mb">' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">Visivel apenas para voce</div>' +
      '<div class="fg">' +
        '<label>Tipo</label>' +
        '<select id="nota-tipo">' +
          '<option value="observacao">&#x1F4CB; Observacao</option>' +
          '<option value="lesao">&#x26A0; Lesao / Limitacao</option>' +
          '<option value="meta">&#x1F3AF; Meta</option>' +
        '</select>' +
      '</div>' +
      '<div class="fg">' +
        '<label>Nota</label>' +
        '<textarea id="nota-texto" style="min-height:80px;" placeholder="Ex: Sente ansiedade ao fazer agachamento..."></textarea>' +
      '</div>' +
      '<button class="btn btn-primary btn-full" onclick="salvarNota()">Adicionar nota</button>' +
    '</div>';

  if (notas.length) {
    notas.forEach(function(n) {
      var ti = tipoInfo[n.tipo] || tipoInfo.observacao;
      var dt = new Date(n.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'});
      html +=
        '<div class="card mb" id="nota-' + n.id + '">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:14px;">' + ti.icon + '</span>' +
              '<span style="font-size:11px;font-weight:700;color:' + ti.color + ';">' + ti.label + '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:10px;color:var(--muted);">' + dt + '</span>' +
              '<button class="btn btn-xs btn-ghost" onclick="editarNota(\'' + n.id + '\')">&#x270F;</button>' +
              '<button class="btn btn-xs btn-danger" onclick="deletarNota(\'' + n.id + '\')">&#x2715;</button>' +
            '</div>' +
          '</div>' +
          '<div id="nota-texto-' + n.id + '" style="font-size:13px;color:var(--white);line-height:1.6;">' + n.texto + '</div>' +
          '<div id="nota-edit-' + n.id + '" style="display:none;">' +
            '<textarea id="nota-edit-input-' + n.id + '" style="width:100%;min-height:80px;background:var(--surf-high);border:1.5px solid var(--green);border-radius:var(--rs);padding:10px;color:var(--white);font-size:13px;line-height:1.6;resize:vertical;">' + n.texto + '</textarea>' +
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<button class="btn btn-ghost btn-sm" onclick="cancelarEditNota(\'' + n.id + '\')">Cancelar</button>' +
              '<button class="btn btn-primary btn-sm" onclick="salvarEditNota(\'' + n.id + '\')">Salvar</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
  } else {
    html += '<div class="empty"><div class="empty-ico">&#x1F4DD;</div><p>Nenhuma nota ainda.</p></div>';
  }

  el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

async function salvarNota() {
  var tipo = document.getElementById('nota-tipo').value;
  var texto = document.getElementById('nota-texto').value.trim();
  if (!texto) { toast('Escreva a nota antes de salvar!'); return; }
  var res = await sb.from('notas_aluno').insert({ aluno_id: alunoAtual.id, tipo: tipo, texto: texto });
  if (res.error) { toast('Erro ao salvar nota!'); return; }
  document.getElementById('nota-texto').value = '';
  toast('Nota adicionada!');
  loadDetTab();
}

function editarNota(id) {
  document.getElementById('nota-texto-' + id).style.display = 'none';
  document.getElementById('nota-edit-' + id).style.display = 'block';
}

function cancelarEditNota(id) {
  document.getElementById('nota-texto-' + id).style.display = 'block';
  document.getElementById('nota-edit-' + id).style.display = 'none';
}

async function salvarEditNota(id) {
  var texto = document.getElementById('nota-edit-input-' + id).value.trim();
  if (!texto) { toast('A nota nao pode estar vazia!'); return; }
  var res = await sb.from('notas_aluno').update({ texto: texto }).eq('id', id);
  if (res.error) { toast('Erro ao salvar!'); return; }
  toast('Nota atualizada!');
  loadDetTab();
}

async function deletarNota(id) {
  var res = await sb.from('notas_aluno').delete().eq('id', id);
  if (res.error) { toast('Erro ao apagar!'); return; }
  toast('Nota apagada!');
  loadDetTab();
}

// -- AVALIACAO — formulario de nova avaliacao ------
function openNovaAvaliacao() {
  var existing = document.getElementById('mod-av'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className='mov'; m.id='mod-av';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Nova avaliacao</h3>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    '<div class="fg"><label>Data</label><input type="date" id="av-data" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
    '<div class="fg"><label>Sexo</label><select id="av-sexo" onchange="calcAv()"><option value="F">Feminino</option><option value="M">Masculino</option></select></div>' +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Peso e altura</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    '<div class="fg"><label>Peso (kg)</label><input type="number" id="av-peso" step="0.1" placeholder="70.5" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Altura (cm)</label><input type="number" id="av-alt" placeholder="170" oninput="calcAv()"></div>' +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Circunferencias (cm)</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
    '<div class="fg"><label>Cintura</label><input type="number" id="av-cin" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Quadril</label><input type="number" id="av-quad" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Peito</label><input type="number" id="av-peito" step="0.1"></div>' +
    '<div class="fg"><label>Bunda</label><input type="number" id="av-bunda" step="0.1"></div>' +
    '<div class="fg"><label>Coxa direita</label><input type="number" id="av-coxad" step="0.1"></div>' +
    '<div class="fg"><label>Coxa esquerda</label><input type="number" id="av-coxae" step="0.1"></div>' +
    '<div class="fg"><label>Braco direito</label><input type="number" id="av-bracod" step="0.1"></div>' +
    '<div class="fg"><label>Braco esquerdo</label><input type="number" id="av-bracoe" step="0.1"></div>' +
    '<div class="fg"><label>Panturrilha</label><input type="number" id="av-pant" step="0.1"></div>' +
    '<div class="fg"><label>Abdomen</label><input type="number" id="av-abd" step="0.1"></div>' +
    '</div>' +
    '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dobras cutaneas (mm)</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
    '<div class="fg"><label>Tricipital</label><input type="number" id="av-d1" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Subescap.</label><input type="number" id="av-d2" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Suprailiaca</label><input type="number" id="av-d3" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Abdominal</label><input type="number" id="av-d4" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Coxa</label><input type="number" id="av-d5" step="0.1" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Panturrilha</label><input type="number" id="av-d6" step="0.1" oninput="calcAv()"></div>' +
    '</div>' +
    '<div class="fg"><label>Pressao arterial</label><input type="text" id="av-press" placeholder="120/80" oninput="calcAv()"></div>' +
    '<div class="fg"><label>Objetivo atual</label><input type="text" id="av-obj" value="' + (alunoAtual.objetivo||'') + '"></div>' +
    '<div id="av-resultados" style="display:none;background:var(--surf-high);border:1px solid var(--green-border);border-radius:var(--rs);padding:14px;margin-bottom:14px;">' +
    '<div style="font-size:11px;font-weight:700;color:var(--green-pale);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Calculado automaticamente</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" id="av-res-grid"></div>' +
    '</div>' +
    '<div class="fg"><label>Observacoes</label><textarea id="av-obs" style="min-height:60px;"></textarea></div>' +
    '<div class="mod-actions"><button class="btn btn-ghost" onclick="closeModal(\'mod-av\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="salvarAvaliacao()">Salvar</button></div></div>';
  m.addEventListener('click', function(e) { if (e.target===m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-av');
}

function calcAv() {
  var peso = parseFloat(document.getElementById('av-peso').value)||0;
  var altura = parseFloat(document.getElementById('av-alt').value)||0;
  var cin = parseFloat(document.getElementById('av-cin').value)||0;
  var quad = parseFloat(document.getElementById('av-quad').value)||0;
  var sexo = document.getElementById('av-sexo').value;
  var press = document.getElementById('av-press').value||'';
  var d1=parseFloat(document.getElementById('av-d1').value)||0;
  var d2=parseFloat(document.getElementById('av-d2').value)||0;
  var d3=parseFloat(document.getElementById('av-d3').value)||0;
  var d4=parseFloat(document.getElementById('av-d4').value)||0;
  var d5=parseFloat(document.getElementById('av-d5').value)||0;
  var d6=parseFloat(document.getElementById('av-d6').value)||0;
  var resultados = [];

  if (peso>0 && altura>0) {
    var h=altura/100, imc=Math.round(peso/(h*h)*10)/10;
    var imcClass=imc<18.5?'Abaixo do peso':imc<25?'Normal':imc<30?'Sobrepeso':imc<35?'Obesidade I':imc<40?'Obesidade II':'Obesidade III';
    var imcColor=imc<25?'var(--green-pale)':imc<30?'var(--gold)':'var(--red)';
    resultados.push({label:'IMC',val:imc,desc:imcClass,color:imcColor});
    window._avIMC=imc;
  }

  var somaD=d1+d2+d3+d4+d5+d6;
  if (somaD>0) {
    var dc=sexo==='F'
      ? 1.0970-(0.00046971*somaD)+(0.00000056*somaD*somaD)-(0.00012828*30)
      : 1.1120-(0.00043499*somaD)+(0.00000055*somaD*somaD)-(0.00028826*30);
    var gord=Math.max(0,Math.min(60,Math.round(((4.95/dc)-4.50)*100*10)/10));
    var gordClass=sexo==='F'
      ?(gord<20?'Excelente':gord<28?'Bom':gord<35?'Acima da media':'Obesidade')
      :(gord<15?'Excelente':gord<22?'Bom':gord<30?'Acima da media':'Obesidade');
    var gordColor=gordClass==='Excelente'||gordClass==='Bom'?'var(--green-pale)':gordClass==='Acima da media'?'var(--gold)':'var(--red)';
    resultados.push({label:'% Gordura',val:gord+'%',desc:gordClass,color:gordColor});
    window._avGord=gord;
  }

  if (cin>0 && quad>0) {
    var cq=Math.round(cin/quad*100)/100;
    var cqRisco=sexo==='F'?(cq<0.80?'Baixo risco':cq<0.85?'Moderado':'Alto risco'):(cq<0.90?'Baixo risco':cq<1.00?'Moderado':'Alto risco');
    var cqColor=cqRisco==='Baixo risco'?'var(--green-pale)':cqRisco==='Moderado'?'var(--gold)':'var(--red)';
    resultados.push({label:'Cin / Quad',val:cq,desc:cqRisco,color:cqColor});
    window._avCQ=cq;
  }

  if (press) {
    var parts=press.split('/');
    if (parts.length===2) {
      var sis=parseInt(parts[0]),dia=parseInt(parts[1]);
      var pClass=(sis<120&&dia<80)?'Normal':(sis<130&&dia<80)?'Elevada':(sis<140||dia<90)?'Hipertensao I':'Hipertensao II';
      var pColor=pClass==='Normal'?'var(--green-pale)':pClass==='Elevada'?'var(--gold)':'var(--red)';
      resultados.push({label:'Pressao',val:press,desc:pClass,color:pColor});
    }
  }

  var res=document.getElementById('av-resultados');
  var grid=document.getElementById('av-res-grid');
  if (resultados.length) {
    res.style.display='block';
    grid.innerHTML=resultados.map(function(r){
      return '<div style="background:var(--surf-mid);border-radius:var(--rx);padding:10px;text-align:center;">' +
        '<div style="font-size:18px;font-weight:800;font-family:var(--font-display);color:'+r.color+';">'+r.val+'</div>' +
        '<div style="font-size:10px;color:var(--muted);">'+r.label+'</div>' +
        '<div style="font-size:10px;color:'+r.color+';font-weight:600;margin-top:2px;">'+r.desc+'</div>' +
        '</div>';
    }).join('');
  } else { res.style.display='none'; }
}

async function salvarAvaliacao() {
  var peso=parseFloat(document.getElementById('av-peso').value)||null;
  var altura=parseFloat(document.getElementById('av-alt').value)||null;
  var cin=parseFloat(document.getElementById('av-cin').value)||null;
  var quad=parseFloat(document.getElementById('av-quad').value)||null;
  var data={
    aluno_id:alunoAtual.id,
    data:document.getElementById('av-data').value,
    sexo:document.getElementById('av-sexo').value,
    peso:peso, altura:altura,
    imc:window._avIMC||(peso&&altura?Math.round(peso/Math.pow(altura/100,2)*10)/10:null),
    gordura_pct:window._avGord||null,
    cin_quad:window._avCQ||(cin&&quad?Math.round(cin/quad*100)/100:null),
    pressao:document.getElementById('av-press').value||null,
    objetivo:document.getElementById('av-obj').value||null,
    obs:document.getElementById('av-obs').value||null,
    peito:parseFloat(document.getElementById('av-peito').value)||null,
    bunda:parseFloat(document.getElementById('av-bunda').value)||null,
    coxa_d:parseFloat(document.getElementById('av-coxad').value)||null,
    coxa_e:parseFloat(document.getElementById('av-coxae').value)||null,
    braco_d:parseFloat(document.getElementById('av-bracod').value)||null,
    braco_e:parseFloat(document.getElementById('av-bracoe').value)||null,
    panturrilha:parseFloat(document.getElementById('av-pant').value)||null,
    abdomen:parseFloat(document.getElementById('av-abd').value)||null,
    dobra_tricipital:parseFloat(document.getElementById('av-d1').value)||null,
    dobra_subescapular:parseFloat(document.getElementById('av-d2').value)||null,
    dobra_suprailiaca:parseFloat(document.getElementById('av-d3').value)||null,
    dobra_abdominal:parseFloat(document.getElementById('av-d4').value)||null,
    dobra_coxa:parseFloat(document.getElementById('av-d5').value)||null,
    dobra_panturrilha:parseFloat(document.getElementById('av-d6').value)||null
  };
  var res=await sb.from('avaliacoes').insert(data);
  if (res.error){toast('Erro ao salvar!');console.error(res.error);return;}
  // Registra o peso tambem na tabela medidas para o grafico de evolucao
  if (peso) await sb.from('medidas').insert({aluno_id:alunoAtual.id,data:data.data,peso:peso});
  window._avIMC=null;window._avGord=null;window._avCQ=null;
  closeModal('mod-av');
  toast('Avaliacao salva!');
  alunoDetTab='medidas';
  renderAlunoDetalhe();
  setTimeout(loadDetTab,100);
}

// -- REGISTRAR PESO --------------------------------
function openNovaMedida() {
  var existing=document.getElementById('mod-med');if(existing)existing.remove();
  var m=document.createElement('div');m.className='mov';m.id='mod-med';
  m.innerHTML='<div class="mod"><div class="mod-handle"></div><h3>Registrar peso</h3>' +
    '<div class="fg"><label>Data</label><input type="date" id="med-data" value="'+new Date().toISOString().split('T')[0]+'"></div>' +
    '<div class="fg"><label>Peso (kg)</label><input type="number" id="med-peso" step="0.1" placeholder="70.5" style="font-size:24px;text-align:center;font-weight:700;"></div>' +
    '<div class="mod-actions"><button class="btn btn-ghost" onclick="closeModal(\'mod-med\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="salvarMedida()">Salvar</button></div></div>';
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('on');});
  document.body.appendChild(m);openModal('mod-med');
}

async function salvarMedida() {
  var peso=parseFloat(document.getElementById('med-peso').value);
  if(!peso){toast('Digite o peso!');return;}
  var res=await sb.from('medidas').insert({aluno_id:alunoAtual.id,data:document.getElementById('med-data').value,peso:peso});
  if(res.error){toast('Erro ao salvar!');return;}
  closeModal('mod-med');toast('Peso registrado!');loadDetTab();
}

// -- EDITAR ALUNO ----------------------------------
function editarAluno() {
  var a=alunoAtual;
  var existing=document.getElementById('mod-edit-aluno');if(existing)existing.remove();
  var m=document.createElement('div');m.className='mov';m.id='mod-edit-aluno';
  m.innerHTML='<div class="mod"><div class="mod-handle"></div><h3>Editar aluno</h3>' +
    '<div class="fg"><label>Nome</label><input type="text" id="ea-nome" value="'+(a.name||'')+'"></div>' +
    '<div class="fg"><label>Objetivo</label><input type="text" id="ea-obj" value="'+(a.objetivo||'')+'" placeholder="Ex: Perda de peso, hipertrofia..."></div>' +
    '<div class="fg"><label>Data de inicio</label><input type="date" id="ea-inicio" value="'+(a.data_inicio||'')+'"></div>' +
    '<div class="fg"><label>Telefone</label><input type="tel" id="ea-tel" value="'+(a.phone||'')+'"></div>' +
    '<div class="mod-actions"><button class="btn btn-ghost" onclick="closeModal(\'mod-edit-aluno\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="salvarEditAluno()">Salvar</button></div></div>';
  m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('on');});
  document.body.appendChild(m);openModal('mod-edit-aluno');
}

async function salvarEditAluno() {
  var data={name:document.getElementById('ea-nome').value,objetivo:document.getElementById('ea-obj').value,data_inicio:document.getElementById('ea-inicio').value||null,phone:document.getElementById('ea-tel').value};
  var res=await sb.from('profiles').update(data).eq('id',alunoAtual.id);
  if(res.error){toast('Erro ao salvar!');return;}
  Object.assign(alunoAtual,data);
  closeModal('mod-edit-aluno');toast('Aluno atualizado!');
  renderAlunoDetalhe();loadDetTab();
}

// -- PLANO (personal gerencia) ---------------------
async function loadDetPlano(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
  var plano = await getPlanoAluno(a.id);
  if (_detGen !== gen || !alunoAtual) return;
  var historico = await getHistoricoPlanos(a.id);
  if (_detGen !== gen || !alunoAtual) return;

  var el = document.getElementById('alu-det-content');
  if (!el || !el.isConnected) return;

  var html = '<button class="btn btn-primary btn-full mb" onclick="openNovoPlanoDet()">+ Novo plano</button>';

  if (plano) {
    html += _mkPlanoCard(plano);
  } else {
    html += '<div style="text-align:center;padding:20px 0;font-size:13px;color:var(--muted);">Nenhum plano ativo cadastrado.</div>';
  }

  // Histórico
  var anteriores = historico.filter(function(p) { return !plano || p.id !== plano.id; });
  if (anteriores.length) {
    html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:16px 0 10px;">Historico (' + anteriores.length + ')</div>';
    html += '<div class="card">';
    anteriores.forEach(function(p) {
      var mi = _planoModalidadeInfo(p.modalidade);
      html +=
        '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--outline);">' +
          '<div style="flex:1;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">' +
              '<span style="font-size:11px;font-weight:700;color:' + mi.color + ';">' + mi.label + '</span>' +
              '<span class="badge badge-muted">' + _planoPeriodoLabel(p.periodo) + '</span>' +
              (p.valor ? '<span style="font-size:10px;color:var(--green-pale);">R$ ' + Number(p.valor).toFixed(2).replace('.', ',') + '</span>' : '') +
            '</div>' +
            '<div style="font-size:11px;color:var(--muted);">' + fmtDate(p.data_inicio) + ' → ' + fmtDate(p.data_vencimento) + '</div>' +
          '</div>' +
          _planoStatusBadge(p.status) +
        '</div>';
    });
    html += '</div>';
  }

  el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

function openNovoPlanoDet() {
  if (!alunoAtual) return;
  var existing = document.getElementById('mod-novo-plano'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-novo-plano';

  var hoje = todayISO();
  var vencDefault = _calcVencimentoPlano('mensal', hoje);

  var objOpts = [
    { v: '',               l: '-- Selecione --'  },
    { v: 'emagrecimento',  l: 'Emagrecimento'    },
    { v: 'hipertrofia',    l: 'Hipertrofia'       },
    { v: 'condicionamento',l: 'Condicionamento'   },
    { v: 'saude_geral',    l: 'Saude geral'       }
  ].map(function(o) {
    return '<option value="' + o.v + '"' + (alunoAtual.objetivo_foco === o.v ? ' selected' : '') + '>' + o.l + '</option>';
  }).join('');

  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Novo plano</h3>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      '<div class="fg"><label>Modalidade</label>' +
        '<select id="np-modal" onchange="npAutoVenc()">' +
          '<option value="presencial"' + (alunoAtual.modalidade_plano==='presencial'?' selected':'') + '>Presencial</option>' +
          '<option value="online"' + (alunoAtual.modalidade_plano==='online'?' selected':'') + '>Online</option>' +
          '<option value="hibrido"' + (alunoAtual.modalidade_plano==='hibrido'?' selected':'') + '>Hibrido</option>' +
        '</select>' +
      '</div>' +
      '<div class="fg"><label>Periodo</label>' +
        '<select id="np-periodo" onchange="npAutoVenc()">' +
          '<option value="mensal">Mensal</option>' +
          '<option value="trimestral">Trimestral</option>' +
          '<option value="semestral">Semestral</option>' +
          '<option value="dupla">Dupla</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="fg"><label>Valor (R$)</label><input type="number" id="np-valor" step="0.01" placeholder="150.00"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      '<div class="fg"><label>Data inicio</label><input type="date" id="np-inicio" value="' + hoje + '" onchange="npAutoVenc()"></div>' +
      '<div class="fg"><label>Data vencimento</label><input type="date" id="np-venc" value="' + vencDefault + '"></div>' +
    '</div>' +
    '<div class="fg"><label>Objetivo foco</label><select id="np-obj-foco">' + objOpts + '</select></div>' +
    '<div class="fg"><label>Observacoes</label><textarea id="np-obs" placeholder="Ex: Renovacao mensal, plano especial..."></textarea></div>' +
    '<div class="mod-actions">' +
      '<button class="btn btn-ghost" onclick="closeModal(\'mod-novo-plano\')">Cancelar</button>' +
      '<button class="btn btn-primary" onclick="salvarNovoPlanoDet()">Salvar</button>' +
    '</div></div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-novo-plano');
}

function npAutoVenc() {
  var periodo = document.getElementById('np-periodo');
  var inicio  = document.getElementById('np-inicio');
  var vencEl  = document.getElementById('np-venc');
  if (!periodo || !inicio || !vencEl || !inicio.value) return;
  vencEl.value = _calcVencimentoPlano(periodo.value, inicio.value);
}

function _calcVencimentoPlano(periodo, inicioISO) {
  var d = new Date(inicioISO + 'T12:00:00');
  var dias = { mensal: 30, trimestral: 90, semestral: 180, dupla: 60 };
  d.setDate(d.getDate() + (dias[periodo] || 30));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function salvarNovoPlanoDet() {
  if (!alunoAtual) return;
  var modalidade = document.getElementById('np-modal').value;
  var periodo    = document.getElementById('np-periodo').value;
  var valor      = parseFloat(document.getElementById('np-valor').value) || null;
  var inicio     = document.getElementById('np-inicio').value;
  var venc       = document.getElementById('np-venc').value;
  var objFoco    = document.getElementById('np-obj-foco').value || null;
  var obs        = document.getElementById('np-obs').value.trim() || null;

  if (!inicio || !venc) { toast('Preencha as datas!'); return; }

  var res = await criarPlano({
    aluno_id:        alunoAtual.id,
    modalidade:      modalidade,
    periodo:         periodo,
    valor:           valor,
    data_inicio:     inicio,
    data_vencimento: venc,
    status:          'ativo',
    observacoes:     obs
  });
  if (res.error) { toast('Erro ao salvar plano!'); console.error(res.error); return; }

  // Atualiza perfil do aluno
  var perfilUpdate = { modalidade_plano: modalidade };
  if (objFoco) perfilUpdate.objetivo_foco = objFoco;
  await sb.from('profiles').update(perfilUpdate).eq('id', alunoAtual.id);
  Object.assign(alunoAtual, perfilUpdate);
  invalidateCache('alunos');

  closeModal('mod-novo-plano');
  toast('Plano criado!');
  alunoDetTab = 'plano';
  renderAlunoDetalhe();
  setTimeout(loadDetTab, 100);
}

// -- ANAMNESE (visão do personal) ------------------
async function loadDetAnamnese(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
    var anamnese = await getAnamnese(a.id);
    if (_detGen !== gen || !alunoAtual) return;
    var el = document.getElementById('alu-det-content');
    if (!el || !el.isConnected) return;

    var html = '';

    // Controles de liberação
    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
    html += '<div style="font-size:12px;color:var(--muted);">Edição pelo aluno</div>';
    if (!anamnese) {
      html += '<span style="font-size:11px;color:var(--muted);">Aguardando preenchimento</span>';
    } else if (anamnese.liberado_editar) {
      html += '<button class="btn btn-ghost btn-xs" onclick="bloquearAnamneseAluno()">&#x1F512; Bloquear edição</button>';
    } else {
      html += '<button class="btn btn-primary btn-xs" onclick="liberarAnamneseAluno()">&#x1F513; Liberar edição</button>';
    }
    html += '</div>';
    if (anamnese && anamnese.atualizado_em) {
      html += '<div style="font-size:10px;color:var(--faint);">Última atualização: ' + new Date(anamnese.atualizado_em).toLocaleDateString('pt-BR') + '</div>';
    }
    html += '</div>';

    if (!anamnese) {
      html += '<div class="empty"><div class="empty-ico">&#x1F4CB;</div><p>O aluno ainda não preencheu a ficha de saúde.</p></div>';
      el.innerHTML = html;
      return;
    }

    // Mostrar todos os campos preenchidos
    html += _mkAnamnesePersonalView(anamnese);
    el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

function _mkAnamnesePersonalView(an) {
  var h = '';

  function bloco(titulo, campos) {
    var preenchidos = campos.filter(function(c) { return c.val !== null && c.val !== undefined && c.val !== ''; });
    if (!preenchidos.length) return '';
    var s = '<div class="card mb">';
    s += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">' + titulo + '</div>';
    s += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    preenchidos.forEach(function(c) {
      s += '<div style="background:var(--surf-high);border-radius:var(--rs);padding:8px;">';
      s += '<div style="font-size:10px;color:var(--muted);margin-bottom:2px;">' + c.label + '</div>';
      s += '<div style="font-size:12px;font-weight:600;color:' + (c.alert ? 'var(--red)' : 'var(--white)') + ';">' + c.val + '</div>';
      s += '</div>';
    });
    s += '</div>';
    s += '</div>';
    return s;
  }

  function boolLabel(v) { return v === true ? 'Sim' : v === false ? 'Não' : ''; }

  h += bloco('Saúde', [
    { label: 'Lesões', val: _anLabel('historico_lesoes_b', an.historico_lesoes) || (an.historico_lesoes === 'sim' ? 'Sim' : an.historico_lesoes === 'nao' ? 'Não' : ''), alert: an.historico_lesoes === 'sim' },
    { label: 'Detalhe lesões', val: an.lesoes_detalhe },
    { label: 'Condições médicas', val: an.condicoes_medicas === 'sim' ? 'Sim' : an.condicoes_medicas === 'nao' ? 'Não' : '', alert: an.condicoes_medicas === 'sim' },
    { label: 'Detalhe condições', val: an.condicoes_detalhe },
    { label: 'Medicamentos', val: an.medicamentos === 'sim' ? 'Sim' : an.medicamentos === 'nao' ? 'Não' : '' },
    { label: 'Quais medicamentos', val: an.medicamentos_detalhe },
    { label: 'Pressão alta', val: boolLabel(an.pressao_alta), alert: an.pressao_alta === true },
    { label: 'Diabetes', val: boolLabel(an.diabetes), alert: an.diabetes === true },
    { label: 'Cardiopatia', val: boolLabel(an.cardiopatia), alert: an.cardiopatia === true },
    { label: 'Fumante', val: boolLabel(an.fumante) }
  ]);

  h += bloco('Histórico Esportivo', [
    { label: 'Pratica exercícios', val: an.pratica_exercicio === 'sim' ? 'Sim' : an.pratica_exercicio === 'nao' ? 'Não' : '' },
    { label: 'Experiência musculação', val: _anLabel('experiencia_musculacao', an.experiencia_musculacao) },
    { label: 'Modalidades', val: an.modalidades },
    { label: 'Frequência/semana', val: an.frequencia_semanas ? an.frequencia_semanas + 'x' : '' }
  ]);

  h += bloco('Objetivos', [
    { label: 'Objetivo principal', val: _anLabel('objetivo_principal', an.objetivo_principal) },
    { label: 'Prazo', val: _anLabel('prazo', an.prazo) },
    { label: 'Disponibilidade (dias/sem)', val: an.disponibilidade_dias ? an.disponibilidade_dias + ' dias' : '' },
    { label: 'Turno', val: _anLabel('turno', an.turno) }
  ]);

  h += bloco('Hábitos de Vida', [
    { label: 'Estresse', val: _anLabel('nivel_estresse', an.nivel_estresse) },
    { label: 'Qualidade do sono', val: _anLabel('qualidade_sono', an.qualidade_sono) },
    { label: 'Horas de sono', val: _anLabel('horas_sono', an.horas_sono) },
    { label: 'Alimentação', val: _anLabel('alimentacao', an.alimentacao) },
    { label: 'Consumo de água', val: _anLabel('consumo_agua', an.consumo_agua) },
    { label: 'Atividade diária', val: _anLabel('atividade_diaria', an.atividade_diaria) }
  ]);

  if (an.obs) {
    h += '<div class="card mb">';
    h += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Observações do aluno</div>';
    h += '<div style="font-size:13px;color:var(--white);line-height:1.6;">' + an.obs + '</div>';
    h += '</div>';
  }

  return h;
}

async function liberarAnamneseAluno() {
  if (!alunoAtual) return;
  var err = await liberarAnamnese(alunoAtual.id);
  if (err) { toast('Erro ao liberar!'); console.error(err); return; }
  toast('Edição liberada para o aluno ✅');
  loadDetTab();
}

async function bloquearAnamneseAluno() {
  if (!alunoAtual) return;
  var err = await bloquearAnamnese(alunoAtual.id);
  if (err) { toast('Erro ao bloquear!'); console.error(err); return; }
  toast('Edição bloqueada 🔒');
  loadDetTab();
}

// -- FEEDBACKS (visão do personal por aluno) -------
async function loadDetFeedbacksDet(gen) {
  if (!alunoAtual) return;
  var a = alunoAtual;
  try {
    var feedbacks = await getFeedbacksAluno(a.id);
    if (_detGen !== gen || !alunoAtual) return;
    var el = document.getElementById('alu-det-content');
    if (!el || !el.isConnected) return;

    if (!feedbacks.length) {
      el.innerHTML = '<div class="empty"><div class="empty-ico">&#x1F4AC;</div><p>Nenhum feedback enviado ainda.</p></div>';
      return;
    }

    var html = '';
    feedbacks.forEach(function(f) {
      var ii = _fbIntInfo(f.intensidade);
      var ci = _fbCorpoInfo(f.corpo);
      var dt = f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
      var treinoNome = (f.execucoes && f.execucoes.treinos) ? f.execucoes.treinos.nome : '';

      html += '<div class="card mb">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">';
      html += '<div>';
      html += '<div style="font-size:11px;color:var(--faint);">' + dt + (treinoNome ? ' · ' + treinoNome : '') + '</div>';
      html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">';
      html += '<span style="font-size:10px;font-weight:700;color:' + ii.color + ';background:' + ii.bg + ';border:1px solid ' + ii.color + ';padding:2px 7px;border-radius:99px;">' + ii.label + '</span>';
      if (f.corpo) html += '<span style="font-size:10px;font-weight:700;color:' + ci.color + ';background:' + ci.bg + ';border:1px solid ' + ci.color + ';padding:2px 7px;border-radius:99px;">' + ci.label + '</span>';
      html += '</div>';
      html += '</div>';
      if (!f.resposta_personal) {
        html += '<button class="btn btn-primary btn-xs" onclick="responderFeedbackDet(\'' + f.id + '\')">Responder</button>';
      }
      html += '</div>';

      if (f.comentario) {
        html += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;font-style:italic;">"' + f.comentario + '"</div>';
      }
      if (f.resposta_personal) {
        var dtResp = f.respondido_em ? new Date(f.respondido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
        html += '<div style="background:var(--green-glow);border:1px solid var(--green-border);border-radius:var(--rs);padding:8px;font-size:12px;">';
        html += '<span style="color:var(--green-pale);font-weight:700;">Sua resposta' + (dtResp ? ' · ' + dtResp : '') + ':</span> ' + f.resposta_personal;
        html += '</div>';
      }
      html += '</div>';
    });

    el.innerHTML = html;
  } catch(err) { if (_detGen !== gen) return; throw err; }
}

function responderFeedbackDet(id) {
  var existing = document.getElementById('mod-resp-fb-det'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-resp-fb-det';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Responder feedback</h3>' +
    '<div class="fg"><label>Resposta para o aluno</label>' +
      '<textarea id="resp-fb-det-texto" style="min-height:100px;" placeholder="Ex: Ótimo trabalho! Vamos ajustar na próxima..."></textarea>' +
    '</div>' +
    '<div class="mod-actions">' +
      '<button class="btn btn-ghost" onclick="closeModal(\'mod-resp-fb-det\')">Cancelar</button>' +
      '<button class="btn btn-primary" onclick="salvarRespostaFeedbackDet(\'' + id + '\')">Enviar</button>' +
    '</div></div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-resp-fb-det');
}

async function salvarRespostaFeedbackDet(id) {
  var texto = (document.getElementById('resp-fb-det-texto') || {}).value;
  if (!texto || !texto.trim()) { toast('Escreva uma resposta!'); return; }
  var err = await responderFeedback(id, texto.trim());
  if (err) { toast('Erro ao enviar resposta!'); console.error(err); return; }
  var m = document.getElementById('mod-resp-fb-det'); if (m) m.remove();
  toast('Resposta enviada! ✅');
  loadDetTab();
}

// -- HELPERS ---------------------------------------
function calcStreak(execucoes) {
  if(!execucoes||!execucoes.length)return 0;
  var dates=execucoes.map(function(e){return e.data;}).filter(function(v,i,a){return a.indexOf(v)===i;});
  var streak=0,cur=new Date();
  for(var i=0;i<365;i++){
    var d=cur.toISOString().split('T')[0];
    if(dates.indexOf(d)>=0)streak++;
    else if(i>0)break;
    cur.setDate(cur.getDate()-1);
  }
  return streak;
}

function diasDesde(dataISO) {
  if(!dataISO)return'--';
  var diff=Math.floor((new Date()-new Date(dataISO+'T12:00:00'))/86400000);
  if(diff===0)return'Hoje';if(diff===1)return'Ontem';return'Ha '+diff+'d';
}

function mkDetStat(val,lbl,green){
  return'<div class="card'+(green?' card-green':'')+'" style="padding:14px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;line-height:1;'+(green?'color:var(--green-pale);':'')+'">' +val+'</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.05em;">'+lbl+'</div></div>';
}

function mkMedida(val,lbl){
  return'<div style="background:var(--surf-high);border-radius:var(--rs);padding:10px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;">'+val+'</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:2px;">'+lbl+'</div></div>';
}

// Variante com cor personalizada (para IMC, pressao, etc.)
function mkMedidaColor(val,lbl,color){
  return'<div style="background:var(--surf-high);border-radius:var(--rs);padding:10px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:'+color+';">'+val+'</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:2px;">'+lbl+'</div></div>';
}

function voltarAlunos(){_detGen++;alunoAtual=null;go('alunos');}

async function openNovoTreino() {
  var templates = await getTreinos();
  var existing = document.getElementById('mod-novo-treino-aluno'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-novo-treino-aluno';

  var diasOpts = ['Segunda','Terca','Quarta','Quinta','Sexta','Sabado','Domingo','Qualquer dia']
    .map(function(d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');

  var lista = '';
  if (!templates.length) {
    lista = '<div style="text-align:center;padding:16px;font-size:12px;color:var(--muted);">Nenhum template criado ainda.<br>Crie um treino na aba Exercicios primeiro.</div>';
  } else {
    lista = templates.map(function(t) {
      return '<div class="list-row" onclick="selecionarTemplateParaAtribuir(\'' + t.id + '\',\'' + t.nome.replace(/'/g, '') + '\')">' +
        '<div style="width:36px;height:36px;border-radius:var(--rx);background:var(--green-glow);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">&#x1F4AA;</div>' +
        '<div class="list-row-info"><div class="list-row-title">' + t.nome + '</div>' + (t.descricao ? '<div class="list-row-sub">' + t.descricao + '</div>' : '') + '</div>' +
        '<span style="font-size:18px;color:var(--muted);">&#x203A;</span>' +
      '</div>';
    }).join('');
  }

  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>Atribuir treino</h3>' +
      '<div id="nta-lista">' + lista + '</div>' +
      '<div id="nta-conf" style="display:none;">' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:14px;">Treino selecionado: <strong id="nta-nome-sel"></strong></div>' +
        '<div class="fg"><label>Dia da semana</label><select id="nta-dia">' + diasOpts + '</select></div>' +
        '<div class="mod-actions">' +
          '<button class="btn btn-ghost" onclick="document.getElementById(\'nta-lista\').style.display=\'\';document.getElementById(\'nta-conf\').style.display=\'none\';">Voltar</button>' +
          '<button class="btn btn-primary" onclick="confirmarAtribuirTreino()">Atribuir</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-novo-treino-aluno');
}

var _templateSelecionadoId = null;
function selecionarTemplateParaAtribuir(id, nome) {
  _templateSelecionadoId = id;
  document.getElementById('nta-nome-sel').textContent = nome;
  document.getElementById('nta-lista').style.display = 'none';
  document.getElementById('nta-conf').style.display = 'block';
}

async function confirmarAtribuirTreino() {
  if (!_templateSelecionadoId || !alunoAtual) return;
  var dia = document.getElementById('nta-dia').value;
  var err = await atribuirTreinoAluno(_templateSelecionadoId, alunoAtual.id, dia);
  if (err) { toast('Erro ao atribuir treino!'); console.error(err); return; }
  _templateSelecionadoId = null;
  closeModal('mod-novo-treino-aluno');
  toast('Treino atribuido!');
  alunoDetTab = 'visao';
  renderAlunoDetalhe();
  setTimeout(loadDetTab, 100);
}

function editarTreino(id) {
  var existing = document.getElementById('mod-edit-treino-al'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-edit-treino-al';
  var diasOpts = ['Segunda','Terca','Quarta','Quinta','Sexta','Sabado','Domingo','Qualquer dia']
    .map(function(d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>Editar treino</h3>' +
      '<div class="fg"><label>Dia da semana</label><select id="etr-dia">' + diasOpts + '</select></div>' +
      '<div class="mod-actions">' +
        '<button class="btn btn-danger" style="flex:none;padding:13px;" onclick="desativarTreino(\'' + id + '\')">Remover</button>' +
        '<button class="btn btn-ghost" onclick="closeModal(\'mod-edit-treino-al\')">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="salvarEditTreino(\'' + id + '\')">Salvar</button>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });

  sb.from('treinos').select('dia_semana').eq('id', id).single().then(function(res) {
    if (res.data && res.data.dia_semana) {
      var sel = document.getElementById('etr-dia');
      if (sel) sel.value = res.data.dia_semana;
    }
  });

  document.body.appendChild(m);
  openModal('mod-edit-treino-al');
}

async function salvarEditTreino(id) {
  var dia = document.getElementById('etr-dia').value;
  var res = await sb.from('treinos').update({ dia_semana: dia }).eq('id', id);
  if (res.error) { toast('Erro ao salvar!'); return; }
  closeModal('mod-edit-treino-al');
  toast('Treino atualizado!');
  loadDetTab();
}

async function desativarTreino(id) {
  var res = await sb.from('treinos').update({ ativo: false }).eq('id', id);
  if (res.error) { toast('Erro ao remover!'); return; }
  closeModal('mod-edit-treino-al');
  toast('Treino removido.');
  loadDetTab();
}
