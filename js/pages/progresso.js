// FISCHER METHOD -- progresso.js
var _progressoLoading = false;

function renderProgresso() {
  _progressoLoading = false; // reseta flag para evitar spinner eterno ao re-entrar
  var el = document.getElementById('pg-progresso');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Progresso</div></div>' +
    '</div>' +
    '<div id="progresso-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  loadProgressoData();
}

async function loadProgressoData() {
  if (_progressoLoading) return;
  _progressoLoading = true;
  try {
    var uid       = currentUser.id;
    var objFoco   = currentProfile ? currentProfile.objetivo_foco   : null;
    var modalidade = currentProfile ? currentProfile.modalidade_plano : null;
    // Aluno online/hibrido (ou sem modalidade definida) pode registrar peso próprio
    var podeRegistrar = modalidade === 'online' || modalidade === 'hibrido' || !modalidade;

    var resEx = await sb.from('execucoes')
      .select('data, treinos(nome)')
      .eq('aluno_id', uid)
      .eq('concluido', true)
      .order('data', { ascending: false })
      .limit(60);
    var execucoes  = resEx.data || [];
    var medidas    = await getMedidasAluno(uid);
    var avaliacoes = await getAvaliacoesAluno(uid);

    var el = document.getElementById('progresso-content');
    if (!el) return;

    // ── MÉTRICAS BASE ────────────────────────────
    var streak = calcStreak(execucoes);

    var semanas = {};
    execucoes.forEach(function(e) {
      var d   = new Date(e.data + 'T12:00:00');
      var jan = new Date(d.getFullYear(), 0, 1);
      var wk  = Math.ceil(((d - jan) / 86400000 + jan.getDay() + 1) / 7);
      var key = d.getFullYear() + '-' + wk;
      semanas[key] = (semanas[key] || 0) + 1;
    });
    var melhorSemana = Object.keys(semanas).reduce(function(mx, k) {
      return semanas[k] > mx ? semanas[k] : mx;
    }, 0);

    // Une medidas próprias + avaliações com peso
    var avPeso = (avaliacoes || []).filter(function(a) { return a.peso; }).map(function(a) {
      return { data: a.data, peso: a.peso, isAval: true };
    });
    var todasMedidas = medidas.map(function(m) {
      return { data: m.data, peso: m.peso, isAval: false };
    }).concat(avPeso).sort(function(a, b) { return a.data < b.data ? -1 : 1; });
    var vals = todasMedidas.map(function(m) { return m.peso; });

    // ── ORDENA SEÇÕES POR OBJETIVO ───────────────
    var secoes;
    if (objFoco === 'emagrecimento') {
      secoes = ['banner', 'stats', 'peso', 'gordura', 'historico'];
    } else if (objFoco === 'hipertrofia') {
      secoes = ['banner', 'circunf', 'peso', 'stats', 'historico'];
    } else if (objFoco === 'condicionamento') {
      secoes = ['banner', 'stats', 'historico', 'peso'];
    } else if (objFoco === 'saude_geral') {
      secoes = ['banner', 'stats', 'peso', 'imc', 'historico'];
    } else {
      secoes = ['stats', 'peso', 'historico'];
    }

    var html = '';
    secoes.forEach(function(s) {
      if (s === 'banner')   html += _pgBanner(objFoco);
      if (s === 'stats')    html += _pgStats(streak, execucoes.length, melhorSemana);
      if (s === 'peso')     html += _pgPeso(todasMedidas, vals, avPeso, podeRegistrar);
      if (s === 'gordura')  html += _pgGordura(avaliacoes);
      if (s === 'imc')      html += _pgIMC(avaliacoes);
      if (s === 'circunf')  html += _pgCircunf(avaliacoes);
      if (s === 'historico') html += _pgHistorico(execucoes);
    });

    el.innerHTML = html;

  } catch(err) {
    console.error('loadProgressoData:', err);
    var el2 = document.getElementById('progresso-content');
    if (el2) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadProgressoData()">Tentar novamente</button></p></div>';
  } finally {
    _progressoLoading = false;
  }
}

// ── BANNER DE OBJETIVO ─────────────────────────────
function _pgBanner(objFoco) {
  var map = {
    emagrecimento:  { label: 'Emagrecimento',  ico: '&#x1F525;', color: '#3b82f6' },
    hipertrofia:    { label: 'Hipertrofia',     ico: '&#x1F4AA;', color: 'var(--green-pale)' },
    condicionamento:{ label: 'Condicionamento', ico: '&#x26A1;',  color: 'var(--gold)' },
    saude_geral:    { label: 'Saude geral',     ico: '&#x2665;',  color: '#a855f7' }
  };
  var info = map[objFoco];
  if (!info) return '';
  return '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surf-mid);border:1px solid var(--outline);border-left:3px solid ' + info.color + ';border-radius:var(--rs);margin-bottom:16px;">' +
    '<span style="font-size:16px;">' + info.ico + '</span>' +
    '<div style="font-size:12px;color:var(--muted);">Objetivo: <strong style="color:' + info.color + ';">' + info.label + '</strong></div>' +
  '</div>';
}

// ── STATS ──────────────────────────────────────────
function _pgStats(streak, totalExec, melhorSemana) {
  var html = '<div class="stats-row" style="padding:0;margin-bottom:16px;">';
  html += mkProgStat(streak > 0 ? streak + ' &#x1F525;' : '0', 'Sequencia', streak > 0);
  html += mkProgStat(String(totalExec), 'Sessoes', false);
  html += mkProgStat(String(melhorSemana || 0), 'Melhor semana', false);
  html += '</div>';
  return html;
}

// ── EVOLUÇÃO DE PESO ───────────────────────────────
function _pgPeso(todasMedidas, vals, avPeso, podeRegistrar) {
  var html = '<div class="card mb">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Evolucao do peso</div>';
  if (podeRegistrar) {
    html += '<button class="btn btn-ghost btn-xs" onclick="openNovoPeso()">+ Peso</button>';
  }
  html += '</div>';

  if (!todasMedidas.length) {
    html += '<div style="text-align:center;padding:14px 0;font-size:12px;color:var(--muted);">Nenhum registro ainda.' +
      (podeRegistrar ? '<br>Adicione seu peso para acompanhar a evolucao.' : '<br>O personal registrara seu peso nas avaliacoes.') +
      '</div>';
  } else {
    var maxP  = Math.max.apply(null, vals);
    var minP  = Math.min.apply(null, vals);
    var range = maxP - minP || 1;
    var ults  = todasMedidas.slice(-10);

    html += '<div class="chart-bars">';
    ults.forEach(function(m) {
      var barH = ults.length === 1 ? 60 : Math.round(((m.peso - minP) / range) * 60 + 10);
      var dt   = new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
      var barColor = m.isAval ? 'var(--gold)' : 'var(--green)';
      html += '<div class="chart-bar-wrap">';
      html += '<div style="font-size:9px;color:' + (m.isAval ? 'var(--gold)' : 'var(--green-pale)') + ';font-weight:700;">' + m.peso + '</div>';
      html += '<div class="chart-bar active" style="height:' + barH + 'px;background:' + barColor + ';"></div>';
      html += '<div class="chart-bar-lbl">' + dt + (m.isAval ? ' &#x2605;' : '') + '</div>';
      html += '</div>';
    });
    html += '</div>';

    if (avPeso.length) {
      html += '<div style="font-size:10px;color:var(--faint);margin-top:8px;">&#x2605; Avaliacao do personal</div>';
    }

    if (vals.length > 1) {
      var diff   = Math.round((vals[vals.length - 1] - vals[0]) * 10) / 10;
      var dColor = diff < 0 ? 'var(--green-pale)' : diff > 0 ? 'var(--red)' : 'var(--muted)';
      html += '<div style="font-size:12px;color:' + dColor + ';font-weight:600;text-align:center;padding-top:10px;border-top:1px solid var(--outline);margin-top:10px;">' +
        (diff > 0 ? '+' : '') + diff + ' kg desde o inicio</div>';
    }
  }
  html += '</div>';
  return html;
}

// ── % GORDURA (emagrecimento) ──────────────────────
function _pgGordura(avaliacoes) {
  var comGord = (avaliacoes || []).filter(function(a) { return a.gordura_pct; })
    .sort(function(a, b) { return a.data < b.data ? -1 : 1; });
  if (!comGord.length) return '';

  var gords = comGord.map(function(a) { return a.gordura_pct; });
  var maxG  = Math.max.apply(null, gords);
  var minG  = Math.min.apply(null, gords);
  var rG    = maxG - minG || 1;
  var ults  = comGord.slice(-10);

  var html = '<div class="card mb">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">% Gordura corporal</div>';
  html += '<span style="font-size:11px;color:var(--gold);font-weight:700;">' + gords[gords.length-1] + '%</span>';
  html += '</div>';
  html += '<div class="chart-bars">';
  ults.forEach(function(a) {
    var barH = ults.length === 1 ? 60 : Math.round(((a.gordura_pct - minG) / rG) * 60 + 10);
    var dt   = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    html += '<div class="chart-bar-wrap">';
    html += '<div style="font-size:9px;color:var(--gold);font-weight:700;">' + a.gordura_pct + '%</div>';
    html += '<div class="chart-bar active" style="height:' + barH + 'px;background:var(--gold);opacity:0.8;"></div>';
    html += '<div class="chart-bar-lbl">' + dt + '</div>';
    html += '</div>';
  });
  html += '</div>';
  if (gords.length > 1) {
    var diff   = Math.round((gords[gords.length-1] - gords[0]) * 10) / 10;
    var dColor = diff < 0 ? 'var(--green-pale)' : diff > 0 ? 'var(--red)' : 'var(--muted)';
    html += '<div style="font-size:12px;color:' + dColor + ';font-weight:600;text-align:center;padding-top:10px;border-top:1px solid var(--outline);margin-top:10px;">' +
      (diff > 0 ? '+' : '') + diff + '% desde o inicio</div>';
  }
  html += '</div>';
  return html;
}

// ── IMC (saúde geral) ──────────────────────────────
function _pgIMC(avaliacoes) {
  var comIMC = (avaliacoes || []).filter(function(a) { return a.imc; })
    .sort(function(a, b) { return a.data < b.data ? -1 : 1; });
  if (!comIMC.length) return '';

  var imcs  = comIMC.map(function(a) { return a.imc; });
  var maxI  = Math.max.apply(null, imcs);
  var minI  = Math.min.apply(null, imcs);
  var rI    = maxI - minI || 1;
  var ults  = comIMC.slice(-10);
  var ultimo = imcs[imcs.length - 1];
  var imcCl = ultimo < 18.5 ? 'Abaixo do peso' : ultimo < 25 ? 'Normal' : ultimo < 30 ? 'Sobrepeso' : 'Obesidade';
  var imcCor = ultimo < 25 ? 'var(--green-pale)' : ultimo < 30 ? 'var(--gold)' : 'var(--red)';

  var html = '<div class="card mb">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Indice de Massa Corporal</div>';
  html += '<span style="font-size:11px;font-weight:700;color:' + imcCor + ';">' + ultimo + ' · ' + imcCl + '</span>';
  html += '</div>';
  html += '<div class="chart-bars">';
  ults.forEach(function(a) {
    var barH  = ults.length === 1 ? 60 : Math.round(((a.imc - minI) / rI) * 60 + 10);
    var iCor  = a.imc < 25 ? 'var(--green)' : a.imc < 30 ? 'var(--gold)' : 'var(--red)';
    var dt    = new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    html += '<div class="chart-bar-wrap">';
    html += '<div style="font-size:9px;font-weight:700;color:' + iCor + ';">' + a.imc + '</div>';
    html += '<div class="chart-bar active" style="height:' + barH + 'px;background:' + iCor + ';"></div>';
    html += '<div class="chart-bar-lbl">' + dt + '</div>';
    html += '</div>';
  });
  html += '</div>';

  // Pressão arterial — último registro
  var comPress = (avaliacoes || []).filter(function(a) { return a.pressao; });
  if (comPress.length) {
    var press  = comPress[0].pressao; // mais recente (desc)
    var parts  = press.split('/');
    var pLabel = 'Normal', pCor = 'var(--green-pale)';
    if (parts.length === 2) {
      var sis = parseInt(parts[0]), dia = parseInt(parts[1]);
      pLabel = (sis < 120 && dia < 80) ? 'Normal' : (sis < 130 && dia < 80) ? 'Elevada' : (sis < 140 || dia < 90) ? 'Hiper I' : 'Hiper II';
      pCor   = pLabel === 'Normal' ? 'var(--green-pale)' : pLabel === 'Elevada' ? 'var(--gold)' : 'var(--red)';
    }
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid var(--outline);">';
    html += '<span style="font-size:12px;color:var(--muted);">Ultima pressao arterial</span>';
    html += '<span style="font-size:12px;font-weight:700;color:' + pCor + ';">' + press + ' · ' + pLabel + '</span>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ── CIRCUNFERÊNCIAS (hipertrofia) ──────────────────
function _pgCircunf(avaliacoes) {
  if (!avaliacoes || !avaliacoes.length) return '';
  var campos = [
    { key:'braco_d',    label:'Braco Dir.'  },
    { key:'braco_e',    label:'Braco Esq.'  },
    { key:'peito',      label:'Peito'        },
    { key:'coxa_d',     label:'Coxa Dir.'   },
    { key:'coxa_e',     label:'Coxa Esq.'   },
    { key:'panturrilha',label:'Panturrilha' },
    { key:'abdomen',    label:'Abdomen'     }
  ];

  // Pega a mais recente e a anterior para comparar
  var sorted = avaliacoes.slice().sort(function(a, b) { return a.data < b.data ? 1 : -1; });
  var atual  = sorted[0];
  var prev   = sorted[1] || null;

  var temDados = campos.some(function(c) { return atual[c.key]; });
  if (!temDados) return '';

  var html = '<div class="card mb">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:14px;">Circunferencias (cm)</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
  campos.forEach(function(c) {
    if (!atual[c.key]) return;
    var diff = prev && prev[c.key] ? Math.round((atual[c.key] - prev[c.key]) * 10) / 10 : null;
    var dStr = diff === null ? '' : (diff > 0 ? ' <span style="color:var(--green-pale);font-size:10px;">+' + diff + '</span>' : diff < 0 ? ' <span style="color:var(--red);font-size:10px;">' + diff + '</span>' : '');
    html += '<div style="background:var(--surf-high);border-radius:var(--rs);padding:10px;text-align:center;">';
    html += '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;">' + atual[c.key] + dStr + '</div>';
    html += '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' + c.label + '</div>';
    html += '</div>';
  });
  html += '</div>';
  if (prev) {
    html += '<div style="font-size:10px;color:var(--faint);margin-top:8px;text-align:center;">Comparado com ' + new Date(prev.data + 'T12:00:00').toLocaleDateString('pt-BR') + '</div>';
  }
  html += '</div>';
  return html;
}

// ── HISTÓRICO DE TREINOS ───────────────────────────
function _pgHistorico(execucoes) {
  var html = '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Historico de treinos</div>';
  if (!execucoes.length) {
    html += '<div class="empty"><div class="empty-ico">&#x1F4AA;</div><p>Nenhum treino registrado ainda.</p></div>';
  } else {
    html += '<div class="card">';
    execucoes.slice(0, 20).forEach(function(e) {
      var dt = new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' });
      html +=
        '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--outline);">' +
          '<div style="width:36px;height:36px;border-radius:var(--rx);background:var(--green-glow);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:16px;">&#x2713;</div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:13px;font-weight:600;">' + (e.treinos ? e.treinos.nome : 'Treino') + '</div>' +
            '<div style="font-size:11px;color:var(--muted);">' + dt + '</div>' +
          '</div>' +
          '<span class="badge badge-green">OK</span>' +
        '</div>';
    });
    html += '</div>';
  }
  return html;
}

// ── HELPERS ────────────────────────────────────────
function mkProgStat(val, lbl, green) {
  return '<div class="stat-box' + (green ? ' green' : '') + '">' +
    '<div class="stat-val' + (green ? ' green' : '') + '">' + val + '</div>' +
    '<div class="stat-lbl">' + lbl + '</div>' +
    '</div>';
}

// ── REGISTRAR PESO ─────────────────────────────────
function openNovoPeso() {
  var existing = document.getElementById('mod-novo-peso');
  if (existing) existing.remove();
  var m = document.createElement('div');
  m.className = 'mov';
  m.id = 'mod-novo-peso';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Registrar peso</h3>' +
    '<div class="fg"><label>Data</label><input type="date" id="np-data" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
    '<div class="fg"><label>Peso (kg)</label><input type="number" id="np-peso" step="0.1" placeholder="70.5" style="font-size:28px;text-align:center;font-weight:700;letter-spacing:.02em;"></div>' +
    '<div class="mod-actions">' +
      '<button class="btn btn-ghost" onclick="closeModal(\'mod-novo-peso\')">Cancelar</button>' +
      '<button class="btn btn-primary" onclick="salvarNovoPeso()">Salvar</button>' +
    '</div></div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-novo-peso');
  setTimeout(function() { var el = document.getElementById('np-peso'); if (el) el.focus(); }, 350);
}

async function salvarNovoPeso() {
  var peso = parseFloat(document.getElementById('np-peso').value);
  if (!peso || peso < 20 || peso > 400) { toast('Peso invalido!'); return; }
  var data = document.getElementById('np-data').value;
  var res = await sb.from('medidas').insert({ aluno_id: currentUser.id, data: data, peso: peso });
  if (res.error) { toast('Erro ao salvar!'); console.error(res.error); return; }
  closeModal('mod-novo-peso');
  toast('Peso registrado!');
  markDirty('progresso');
  loadProgressoData();
}
