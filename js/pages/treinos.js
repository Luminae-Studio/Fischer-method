// FISCHER METHOD -- treinos.js
var _treinosLoading = false;

function renderTreinos() {
  var el = document.getElementById('pg-treinos');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Treinos</div></div>' +
    '</div>' +
    '<div id="treinos-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  loadTreinosData();
}

async function loadTreinosData() {
  if (_treinosLoading) return;
  _treinosLoading = true;
  try {
    var treinos = await getTreinosAluno(currentUser.id);
    var el = document.getElementById('treinos-content');
    if (!el) return;

    if (!treinos.length) {
      el.innerHTML =
        '<div class="empty">' +
          '<div class="empty-ico">&#x1F4AA;</div>' +
          '<p>Nenhum treino ainda.<br>' +
          '<span style="font-size:12px;color:var(--muted);">O Matheus ainda nao montou seu plano.</span></p>' +
        '</div>';
      return;
    }

    var days = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];
    var todayName = days[new Date().getDay()];

    var html = '';
    treinos.forEach(function(t) {
      var isHoje = t.dia_semana === todayName || t.dia_semana === 'Qualquer dia';
      html +=
        '<div class="card' + (isHoje ? ' card-green' : '') + ' mb" style="cursor:pointer;" onclick="abrirTreinoModal(\'' + t.id + '\')">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:48px;height:48px;border-radius:var(--rs);background:' + (isHoje ? 'var(--green)' : 'var(--surf-high)') + ';border:1px solid ' + (isHoje ? 'var(--green)' : 'var(--outline)') + ';display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">&#x1F4AA;</div>' +
            '<div style="flex:1;">' +
              '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;">' + t.nome + '</div>' +
              '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' + (t.dia_semana || 'Qualquer dia') + '</div>' +
            '</div>' +
            (isHoje ? '<span class="badge badge-green">Hoje</span>' : '') +
            '<div style="font-size:20px;color:var(--muted);margin-left:4px;">&#x203A;</div>' +
          '</div>' +
        '</div>';
    });

    el.innerHTML = html;

  } catch(err) {
    console.error('loadTreinosData:', err);
    var el2 = document.getElementById('treinos-content');
    if (el2) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadTreinosData()">Tentar novamente</button></p></div>';
  } finally {
    _treinosLoading = false;
  }
}

// Abre modal com exercicios do treino + botao concluir
async function abrirTreinoModal(treinoId) {
  var existing = document.getElementById('mod-treino-exec');
  if (existing) existing.remove();

  var m = document.createElement('div');
  m.className = 'mov';
  m.id = 'mod-treino-exec';
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-treino-exec');

  try {
    var itens = await getTreinoCompleto(treinoId);
    var mod = m.querySelector('.mod');
    if (!mod) return;

    if (!itens.length) {
      mod.innerHTML =
        '<div class="mod-handle"></div><h3>Treino</h3>' +
        '<div class="empty"><div class="empty-ico">&#x1F4CB;</div><p>Sem exercicios cadastrados.</p></div>' +
        '<div class="mod-actions"><button class="btn btn-ghost btn-full" onclick="closeModal(\'mod-treino-exec\')">Fechar</button></div>';
      return;
    }

    var exHtml = '';
    itens.forEach(function(item, idx) {
      var ex = item.exercicios || {};
      var yId = ex.youtube_url ? ytId(ex.youtube_url) : null;

      var detalhe = [];
      if (item.series)      detalhe.push(item.series + ' series');
      if (item.repeticoes)  detalhe.push(item.repeticoes + ' reps');
      if (item.carga)       detalhe.push(item.carga + ' kg');
      if (item.descanso_seg) detalhe.push(item.descanso_seg + 's');
      if (item.minutos)     detalhe.push(item.minutos + ' min');

      exHtml +=
        '<div class="ex-card">' +
          '<div class="ex-num">' + (idx + 1) + '</div>' +
          '<div class="ex-info">' +
            '<div class="ex-name">' + (ex.nome || 'Exercicio') + '</div>' +
            (detalhe.length
              ? '<div class="ex-sets">' + detalhe.map(function(d) { return '<span class="ex-set-pill">' + d + '</span>'; }).join('') + '</div>'
              : '') +
            (ex.musculo ? '<div class="ex-detail" style="margin-top:4px;">' + ex.musculo + '</div>' : '') +
            (item.obs ? '<div class="ex-detail" style="margin-top:3px;color:var(--gold);">' + item.obs + '</div>' : '') +
          '</div>' +
          (yId
            ? '<div onclick="abrirYT(\'' + ex.youtube_url + '\')" style="width:58px;height:58px;border-radius:var(--rs);overflow:hidden;flex-shrink:0;cursor:pointer;position:relative;">' +
                '<img src="https://img.youtube.com/vi/' + yId + '/mqdefault.jpg" style="width:100%;height:100%;object-fit:cover;">' +
                '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);">' +
                  '<div style="width:22px;height:22px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;">' +
                    '<svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M8 5v14l11-7z"/></svg>' +
                  '</div>' +
                '</div>' +
              '</div>'
            : '') +
        '</div>';
    });

    mod.innerHTML =
      '<div class="mod-handle"></div>' +
      '<h3>Exercicios</h3>' +
      exHtml +
      '<div class="mod-actions">' +
        '<button class="btn btn-ghost" onclick="closeModal(\'mod-treino-exec\')">Fechar</button>' +
        '<button class="btn btn-primary" onclick="registrarTreinoConcluido(\'' + treinoId + '\')">&#x2713; Concluir treino</button>' +
      '</div>';

  } catch(err) {
    console.error('abrirTreinoModal:', err);
    closeModal('mod-treino-exec');
    toast('Erro ao carregar treino.');
  }
}

// ── ESTADO DO FEEDBACK ────────────────────────────
var _fbExecId = null;
var _fbInt    = null;
var _fbCorpo  = null;

async function registrarTreinoConcluido(treinoId) {
  closeModal('mod-treino-exec');
  var today = new Date().toISOString().split('T')[0];
  var res = await sb.from('execucoes').insert({
    aluno_id: currentUser.id,
    treino_id: treinoId,
    data: today,
    concluido: true
  }).select().single();
  if (res.error) { toast('Erro ao registrar treino!'); console.error(res.error); return; }
  markDirty('inicio');
  markDirty('progresso');
  markDirty('treinos');
  markDirty('feedbacks');
  _fbExecId = res.data ? res.data.id : null;
  _fbInt    = null;
  _fbCorpo  = null;
  _abrirModalFeedback();
}

function _abrirModalFeedback() {
  var existing = document.getElementById('mod-feedback'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-feedback';
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;letter-spacing:-.02em;">Como foi o treino? &#x1F4AA;</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:4px;">Deixa um recado para o Matheus</div>' +
      '</div>' +

      '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Intensidade</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;">' +
        _mkFbBtn('fb-int-leve',       'leve',       '&#x1F60C;', 'Leve',       '#4aa8d8',          'fbSelInt') +
        _mkFbBtn('fb-int-moderado',   'moderado',   '&#x1F4AA;', 'Moderado',   'var(--green-pale)', 'fbSelInt') +
        _mkFbBtn('fb-int-dificil',    'dificil',    '&#x1F525;', 'Difícil',    '#e07c3a',          'fbSelInt') +
        _mkFbBtn('fb-int-impossivel', 'impossivel', '&#x1F480;', 'Impossível', 'var(--red)',        'fbSelInt') +
      '</div>' +

      '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Como está seu corpo?</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;">' +
        _mkFbBtn('fb-corpo-sem',    'sem_dores',    '&#x2705;',  'Sem dores',    'var(--green-pale)', 'fbSelCorpo') +
        _mkFbBtn('fb-corpo-leves',  'dores_leves',  '&#x26A0;',  'Dores leves',  'var(--gold)',       'fbSelCorpo') +
        _mkFbBtn('fb-corpo-fortes', 'dores_fortes', '&#x1F198;', 'Dores fortes', 'var(--red)',        'fbSelCorpo') +
      '</div>' +

      '<div class="fg">' +
        '<label>Recado para o Matheus (opcional)</label>' +
        '<textarea id="fb-comentario" style="min-height:70px;" placeholder="Escreva um comentário..."></textarea>' +
      '</div>' +

      '<div class="mod-actions">' +
        '<button class="btn btn-ghost" onclick="pularFeedback()">Pular</button>' +
        '<button class="btn btn-primary" onclick="enviarFeedback()">Enviar</button>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-feedback');
}

function _mkFbBtn(id, val, ico, label, color, fn) {
  return '<button id="' + id + '" onclick="' + fn + '(\'' + val + '\')" ' +
    'style="padding:14px 8px;border-radius:var(--rs);border:2px solid var(--outline);background:var(--surf-high);' +
    'cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;transition:all .15s;">' +
    '<span style="font-size:24px;">' + ico + '</span>' +
    '<span style="font-size:11px;font-weight:700;color:' + color + ';">' + label + '</span>' +
    '</button>';
}

function fbSelInt(val) {
  _fbInt = val;
  var colorMap = { leve: '#4aa8d8', moderado: 'var(--green-pale)', dificil: '#e07c3a', impossivel: 'var(--red)' };
  ['leve','moderado','dificil','impossivel'].forEach(function(v) {
    var el = document.getElementById('fb-int-' + v);
    if (!el) return;
    el.style.border = '2px solid var(--outline)';
    el.style.background = 'var(--surf-high)';
  });
  var sel = document.getElementById('fb-int-' + val);
  if (sel) {
    sel.style.border = '2px solid ' + (colorMap[val] || 'var(--green)');
    sel.style.background = 'rgba(0,0,0,.2)';
  }
}

function fbSelCorpo(val) {
  _fbCorpo = val;
  var colorMap = { sem_dores: 'var(--green-pale)', dores_leves: 'var(--gold)', dores_fortes: 'var(--red)' };
  var idMap    = { sem_dores: 'fb-corpo-sem', dores_leves: 'fb-corpo-leves', dores_fortes: 'fb-corpo-fortes' };
  ['sem_dores','dores_leves','dores_fortes'].forEach(function(v) {
    var el = document.getElementById(idMap[v]);
    if (!el) return;
    el.style.border = '2px solid var(--outline)';
    el.style.background = 'var(--surf-high)';
  });
  var sel = document.getElementById(idMap[val]);
  if (sel) {
    sel.style.border = '2px solid ' + (colorMap[val] || 'var(--green)');
    sel.style.background = 'rgba(0,0,0,.2)';
  }
}

async function enviarFeedback() {
  if (!_fbInt)   { toast('Selecione a intensidade!'); return; }
  if (!_fbCorpo) { toast('Selecione como está seu corpo!'); return; }
  var txtEl = document.getElementById('fb-comentario');
  var res = await salvarFeedback({
    aluno_id:    currentUser.id,
    execucao_id: _fbExecId,
    intensidade: _fbInt,
    corpo:       _fbCorpo,
    comentario:  txtEl && txtEl.value.trim() ? txtEl.value.trim() : null
  });
  if (res.error) { toast('Erro ao salvar feedback!'); console.error(res.error); return; }
  var m = document.getElementById('mod-feedback'); if (m) m.remove();
  _mostrarToastMes();
}

function pularFeedback() {
  var m = document.getElementById('mod-feedback'); if (m) m.remove();
  _mostrarToastMes();
}

async function _mostrarToastMes() {
  try {
    var now      = new Date();
    var mesStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
    var res = await sb.from('execucoes')
      .select('data')
      .eq('aluno_id', currentUser.id)
      .eq('concluido', true)
      .gte('data', mesStart);
    var dias = new Set((res.data || []).map(function(e) { return e.data; })).size;
    toast('Treino concluído! 💪 Você treinou ' + dias + ' ' + (dias === 1 ? 'dia' : 'dias') + ' esse mês.', 3000);
  } catch(e) {
    toast('Treino concluído! 💪', 3000);
  }
}
