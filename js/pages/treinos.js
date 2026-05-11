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

async function registrarTreinoConcluido(treinoId) {
  closeModal('mod-treino-exec');
  var today = new Date().toISOString().split('T')[0];
  var res = await sb.from('execucoes').insert({
    aluno_id: currentUser.id,
    treino_id: treinoId,
    data: today,
    concluido: true
  });
  if (res.error) { toast('Erro ao registrar treino!'); console.error(res.error); return; }
  toast('Treino concluido! &#x1F4AA;');
  markDirty('inicio');
  markDirty('progresso');
  markDirty('treinos');
}
