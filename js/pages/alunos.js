// ================================================
// FISCHER METHOD -- pages/alunos.js
// ================================================
var alunosTab = 'alunos';

function renderAlunos() {
  var el = document.getElementById('pg-alunos');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Alunos</div></div>' +
      '<button class="btn btn-primary btn-sm" onclick="openGerarConvite()">+ Convite</button>' +
    '</div>' +
    '<div class="tabs" style="padding:0 20px;">' +
      '<button class="tab' + (alunosTab==='alunos'?' on':'') + '" onclick="switchAlunosTab(\'alunos\',this)">Alunos ativos</button>' +
      '<button class="tab' + (alunosTab==='convites'?' on':'') + '" onclick="switchAlunosTab(\'convites\',this)">Convites</button>' +
    '</div>' +
    '<div id="alunos-content" style="padding:0 20px;"></div>';

  loadAlunosTab();
}

function switchAlunosTab(tab, btn) {
  alunosTab = tab;
  document.querySelectorAll('#pg-alunos .tab').forEach(function(t) { t.classList.remove('on'); });
  btn.classList.add('on');
  loadAlunosTab();
}

async function loadAlunosTab() {
  var el = document.getElementById('alunos-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';

  if (alunosTab === 'alunos') {
    await loadListaAlunos();
  } else {
    await loadListaConvites();
  }
}

async function loadListaAlunos() {
  var el = document.getElementById('alunos-content');
  var alunos = await getTodosAlunos();

  if (!alunos.length) {
    el.innerHTML =
      '<div class="empty">' +
        '<div class="empty-ico">&#x1F465;</div>' +
        '<p>Nenhum aluno ainda.<br>Gere um convite para comecar!</p>' +
        '<button class="btn btn-primary" style="margin-top:16px;" onclick="openGerarConvite()">Gerar convite</button>' +
      '</div>';
    return;
  }

  var html = '';
  alunos.forEach(function(a) {
    html +=
      '<div class="aluno-card" onclick="abrirAlunoDetalhe(\'' + a.id + '\')">' +
        avatarHTML(a, 'av-md') +
        '<div class="aluno-card-info">' +
          '<div class="aluno-card-name">' + (a.name || 'Sem nome') + '</div>' +
          '<div class="aluno-card-meta">' + (a.email || '') + '</div>' +
          (a.objetivo ? '<div style="font-size:11px;color:var(--green-pale);margin-top:2px;">&#x25CF; ' + a.objetivo + '</div>' : '') +
        '</div>' +
        '<div style="font-size:20px;color:var(--muted);">&#x203A;</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

async function loadListaConvites() {
  var el = document.getElementById('alunos-content');
  var convites = await getConvites();

  if (!convites.length) {
    el.innerHTML =
      '<div class="empty">' +
        '<div class="empty-ico">&#x1F511;</div>' +
        '<p>Nenhum convite gerado ainda.</p>' +
        '<button class="btn btn-primary" style="margin-top:16px;" onclick="openGerarConvite()">Gerar convite</button>' +
      '</div>';
    return;
  }

  var html = '';
  convites.forEach(function(c) {
    var usado = c.used;
    var data = c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '';
    html +=
      '<div class="card card-sm mb" style="display:flex;align-items:center;gap:12px;">' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:700;color:var(--white);margin-bottom:2px;">' + (c.aluno_nome || 'Aluno') + '</div>' +
          '<div style="font-family:var(--font-display);font-size:14px;font-weight:800;color:var(--green-pale);letter-spacing:.1em;">' + c.code + '</div>' +
          '<div style="font-size:10px;color:var(--muted);margin-top:3px);">Gerado em ' + data + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">' +
          (usado
            ? '<span class="badge badge-green">&#x2713; Entrou</span>'
            : '<span class="badge badge-muted">Aguardando</span>') +
          (!usado
            ? '<button class="btn btn-ghost btn-xs" onclick="copiarCodigo(\'' + c.code + '\')">Copiar</button>'
            : '') +
        '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

function copiarCodigo(code) {
  navigator.clipboard.writeText(code).then(function() {
    toast('Codigo copiado: ' + code);
  });
}

function abrirAlunoDetalhe(id) {
  // Sera implementado em breve
  toast('Detalhe do aluno em breve!');
}
