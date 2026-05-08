// FISCHER METHOD -- aluno_detalhe.js
var alunoAtual = null;
var alunoDetTab = 'visao';

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
      '<button class="tab' + (alunoDetTab==='notas'?' on':'') + '" onclick="switchDetTab(\'notas\',this)">Notas</button>' +
    '</div>' +
    '<div id="alu-det-content" style="padding:0 20px 20px;"></div>';

  loadDetHeader();
  loadDetTab();
}

async function loadDetHeader() {
  var el = document.getElementById('alu-header');
  if (!el || !alunoAtual) return;
  var a = alunoAtual;

  var resEx = await sb.from('execucoes').select('data').eq('aluno_id', a.id).eq('concluido', true).order('data', {ascending: false}).limit(1);
  var ultimaData = resEx.data && resEx.data[0] ? resEx.data[0].data : null;
  var status = calcStatusDinamico(ultimaData);
  var si = statusInfo(status);

  el.innerHTML =
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
}

function switchDetTab(tab, btn) {
  alunoDetTab = tab;
  document.querySelectorAll('#pg-aluno-det .tab').forEach(function(t) { t.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  loadDetTab();
}

async function loadDetTab() {
  var el = document.getElementById('alu-det-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';
  if (alunoDetTab==='visao') await loadDetVisao();
  else if (alunoDetTab==='treinos') await loadDetTreinos();
  else if (alunoDetTab==='medidas') await loadDetMedidas();
  else if (alunoDetTab==='progresso') await loadDetProgresso();
  else if (alunoDetTab==='notas') await loadDetNotas();
}

// -- VISAO GERAL -----------------------------------
async function loadDetVisao() {
  var el = document.getElementById('alu-det-content');
  var a = alunoAtual;

  // Busca ultima avaliacao
  var resAv = await sb.from('avaliacoes')
    .select('peso,altura,imc,gordura_pct,pressao,data')
    .eq('aluno_id', a.id)
    .order('data', {ascending: false})
    .limit(1);
  var av = resAv.data && resAv.data[0];

  var resEx = await sb.from('execucoes').select('data').eq('aluno_id', a.id).eq('concluido', true).order('data',{ascending:false});
  var streak = calcStreak(resEx.data||[]);
  var ultimo = resEx.data && resEx.data[0];
  var resTr = await sb.from('treinos').select('*').eq('aluno_id', a.id).eq('ativo', true);
  var treinos = resTr.data || [];

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
}

// -- TREINOS ---------------------------------------
async function loadDetTreinos() {
  var el = document.getElementById('alu-det-content');
  var res = await sb.from('execucoes').select('*, treinos(nome)').eq('aluno_id', alunoAtual.id).order('data',{ascending:false}).limit(20);
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
}

// -- MEDIDAS (Historico de avaliacoes) --------------
async function loadDetMedidas() {
  var el = document.getElementById('alu-det-content');
  var res = await sb.from('avaliacoes')
    .select('*')
    .eq('aluno_id', alunoAtual.id)
    .order('data', {ascending: false});
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
async function loadDetProgresso() {
  var el = document.getElementById('alu-det-content');
  var resMed = await sb.from('medidas').select('*').eq('aluno_id', alunoAtual.id).order('data',{ascending:true});
  var medidas = resMed.data || [];
  var html = '';

  if (medidas.length > 1) {
    var pesos = medidas.map(function(m){return m.peso;}).filter(Boolean);
    var maxP = Math.max.apply(null,pesos), minP = Math.min.apply(null,pesos);
    var range = maxP-minP||1;
    html += '<div class="card mb">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Evolucao do peso</div>';
    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:80px;margin-bottom:8px;">';
    medidas.slice(-10).forEach(function(m) {
      var h = m.peso ? Math.round(((m.peso-minP)/range)*60+10) : 10;
      var dt = new Date(m.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      html += '<div style="font-size:9px;color:var(--green-pale);font-weight:700;">' + (m.peso||'') + '</div>';
      html += '<div style="width:100%;height:' + h + 'px;background:var(--green);border-radius:3px 3px 0 0;"></div>';
      html += '<div style="font-size:8px;color:var(--muted);">' + dt + '</div></div>';
    });
    html += '</div>';
    var diff = Math.round((medidas[medidas.length-1].peso-medidas[0].peso)*10)/10;
    html += '<div style="font-size:12px;color:' + (diff<0?'var(--green-pale)':diff>0?'var(--red)':'var(--muted)') + ';font-weight:600;text-align:center;">' + (diff>0?'+':'') + diff + ' kg desde o inicio</div>';
    html += '</div>';
  }

  html += '<button class="btn btn-primary btn-full mb" onclick="openNovaMedida()">+ Registrar peso</button>';

  if (!medidas.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">&#x1F4C8;</div><p>Nenhum dado de progresso ainda.</p><button class="btn btn-primary" style="margin-top:12px;" onclick="openNovaMedida()">Registrar peso</button></div>';
    return;
  }
  el.innerHTML = html;
}

// -- NOTAS -----------------------------------------
async function loadDetNotas() {
  var el = document.getElementById('alu-det-content');
  var res = await sb.from('notas_aluno').select('*').eq('aluno_id', alunoAtual.id).order('created_at',{ascending:false});
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
}

async function salvarNota() {
  var tipo = document.getElementById('nota-tipo').value;
  var texto = document.getElementById('nota-texto').value.trim();
  if (!texto) { toast('Escreva a nota antes de salvar!'); return; }
  var res = await sb.from('notas_aluno').insert({ aluno_id: alunoAtual.id, tipo: tipo, texto: texto });
  if (res.error) { toast('Erro ao salvar nota!'); return; }
  document.getElementById('nota-texto').value = '';
  toast('Nota adicionada!');
  await loadDetNotas();
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
  await loadDetNotas();
}

async function deletarNota(id) {
  var res = await sb.from('notas_aluno').delete().eq('id', id);
  if (res.error) { toast('Erro ao apagar!'); return; }
  toast('Nota apagada!');
  await loadDetNotas();
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

function voltarAlunos(){alunoAtual=null;go('alunos');}
function openNovoTreino(){toast('Montagem de treinos em breve!');}
function editarTreino(id){toast('Edicao de treino em breve!');}
