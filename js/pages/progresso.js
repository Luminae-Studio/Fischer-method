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
    var uid = currentUser.id;

    var resEx = await sb.from('execucoes')
      .select('data, treinos(nome)')
      .eq('aluno_id', uid)
      .eq('concluido', true)
      .order('data', { ascending: false })
      .limit(60);
    var execucoes = resEx.data || [];
    var medidas   = await getMedidasAluno(uid);
    var avaliacoes = await getAvaliacoesAluno(uid);

    var el = document.getElementById('progresso-content');
    if (!el) return;

    var streak = calcStreak(execucoes);

    // Melhor semana
    var semanas = {};
    execucoes.forEach(function(e) {
      var d = new Date(e.data + 'T12:00:00');
      var jan1 = new Date(d.getFullYear(), 0, 1);
      var wk = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      var key = d.getFullYear() + '-' + wk;
      semanas[key] = (semanas[key] || 0) + 1;
    });
    var melhorSemana = Object.keys(semanas).reduce(function(mx, k) { return semanas[k] > mx ? semanas[k] : mx; }, 0);

    var html = '';

    // ── STATS ──────────────────────────────────────
    html += '<div class="stats-row" style="padding:0;margin-bottom:16px;">';
    html += mkProgStat(streak > 0 ? streak + ' &#x1F525;' : '0', 'Sequencia', streak > 0);
    html += mkProgStat(String(execucoes.length), 'Sessoes', false);
    html += mkProgStat(String(melhorSemana || 0), 'Melhor semana', false);
    html += '</div>';

    // ── GRAFICO DE PESO ────────────────────────────
    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Evolucao do peso</div>';
    html += '<button class="btn btn-ghost btn-xs" onclick="openNovoPeso()">+ Peso</button>';
    html += '</div>';

    // Une medidas próprias + avaliações do personal que tenham peso
    var avPeso = (avaliacoes || []).filter(function(a) { return a.peso; }).map(function(a) {
      return { data: a.data, peso: a.peso, isAval: true };
    });
    var todasMedidas = medidas.map(function(m) {
      return { data: m.data, peso: m.peso, isAval: false };
    }).concat(avPeso).sort(function(a, b) { return a.data < b.data ? -1 : 1; });

    if (!todasMedidas.length) {
      html += '<div style="text-align:center;padding:14px 0;font-size:12px;color:var(--muted);">Nenhum registro ainda.<br>Adicione seu peso para acompanhar a evolucao.</div>';
    } else {
      var vals   = todasMedidas.map(function(m) { return m.peso; });
      var maxP   = Math.max.apply(null, vals);
      var minP   = Math.min.apply(null, vals);
      var rangeP = maxP - minP || 1;
      var ultimos = todasMedidas.slice(-10);

      html += '<div class="chart-bars">';
      ultimos.forEach(function(m) {
        var barH = ultimos.length === 1 ? 60 : Math.round(((m.peso - minP) / rangeP) * 60 + 10);
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

    // ── HISTORICO ──────────────────────────────────
    html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Historico de treinos</div>';

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
