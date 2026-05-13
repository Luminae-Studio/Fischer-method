// FISCHER METHOD -- alunos.js
var alunosTab = 'alunos';
var _alunosLoading = false;

function renderAlunos() {
  _alunosLoading = false; // reseta flag para evitar spinner eterno ao re-entrar
  var el = document.getElementById('pg-alunos');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Alunos</div></div>' +
      '<button class="btn btn-primary btn-sm" onclick="openGerarConvite()">+ Convite</button>' +
    '</div>' +
    '<div class="tabs" style="padding:0 20px;">' +
      '<button class="tab' + (alunosTab==='alunos'?' on':'') + '" onclick="switchAlunosTab(\'alunos\',this)">Ativos</button>' +
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
  if (_alunosLoading) return;
  _alunosLoading = true;
  var el = document.getElementById('alunos-content');
  if (!el) { _alunosLoading = false; return; }
  el.innerHTML = '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';
  try {
    if (alunosTab === 'alunos') {
      await loadListaAlunos();
    } else {
      await loadListaConvites();
    }
  } catch(err) {
    console.error('loadAlunosTab:', err);
    var elErr = document.getElementById('alunos-content');
    if (elErr && elErr.isConnected) {
      elErr.innerHTML = '<div class="empty"><div class="empty-ico">&#x26A0;</div><p>Erro ao carregar.<br><button class="btn btn-ghost btn-sm" onclick="loadAlunosTab()">Tentar novamente</button></p></div>';
    }
  } finally {
    _alunosLoading = false;
  }
}

async function loadListaAlunos() {
  var el = document.getElementById('alunos-content');
  if (!el) return;
  try {
    var alunos = await getTodosAlunos();
    if (!el.isConnected) return;

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
  } catch(err) {
    console.error('loadListaAlunos:', err);
    throw err; // propaga para loadAlunosTab tratar
  }
}

async function loadListaConvites() {
  var el = document.getElementById('alunos-content');
  if (!el) return;
  try {
    var convites = await getConvites();
    if (!el.isConnected) return;

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
      var nomeAluno = c.aluno_nome || 'Aluno';
      var nomeEsc = nomeAluno.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
      var usedByStr = c.used_by ? "'" + c.used_by + "'" : 'null';

      html +=
        '<div class="card card-sm mb" style="display:flex;align-items:center;gap:12px;">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:' + (usado ? 'var(--green)' : 'var(--surf-high)') + ';border:1px solid ' + (usado ? 'var(--green)' : 'var(--outline)') + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">' +
            (usado ? '&#x2713;' : '&#x1F511;') +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:700;color:var(--white);margin-bottom:2px;">' + nomeAluno + '</div>' +
            '<div style="font-family:var(--font-display);font-size:13px;font-weight:800;color:var(--green-pale);letter-spacing:.08em;">' + c.code + '</div>' +
            '<div style="font-size:10px;color:var(--muted);margin-top:2px;">Gerado em ' + data + '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">' +
            (usado
              ? '<span class="badge badge-green">&#x2713; Entrou</span>'
              : '<span class="badge badge-muted">Aguardando</span>') +
            (!usado
              ? '<button class="btn btn-ghost btn-xs" onclick="copiarCodigo(\'' + c.code + '\')">Copiar</button>'
              : '') +
            '<div style="display:flex;gap:4px;">' +
              '<button class="btn btn-ghost btn-xs" onclick="editarConviteModal(\'' + c.id + '\',\'' + nomeEsc + '\')">Editar</button>' +
              '<button class="btn btn-danger btn-xs" onclick="apagarConviteConfirm(\'' + c.id + '\',' + usado + ',' + usedByStr + ')">Apagar</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    el.innerHTML = html;
  } catch(err) {
    console.error('loadListaConvites:', err);
    throw err; // propaga para loadAlunosTab tratar
  }
}

function copiarCodigo(code) {
  navigator.clipboard.writeText(code).then(function() {
    toast('Copiado: ' + code);
  });
}

// ── EDITAR CONVITE ────────────────────────────────
function editarConviteModal(id, nomeAtual) {
  var existing = document.getElementById('mod-edit-convite'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-edit-convite';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Editar convite</h3>' +
    '<div class="fg"><label>Nome do aluno</label>' +
      '<input type="text" id="ec-nome" value="' + nomeAtual + '" placeholder="Ex: Ana Silva">' +
    '</div>' +
    '<div class="mod-actions">' +
      '<button class="btn btn-ghost" onclick="closeModal(\'mod-edit-convite\')">Cancelar</button>' +
      '<button class="btn btn-primary" onclick="salvarEditConvite(\'' + id + '\')">Salvar</button>' +
    '</div></div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-edit-convite');
}

async function salvarEditConvite(id) {
  var nome = document.getElementById('ec-nome').value.trim();
  if (!nome) { toast('Digite o nome do aluno!'); return; }
  var err = await editarConvite(id, nome);
  if (err) { toast('Erro ao salvar!'); console.error(err); return; }
  closeModal('mod-edit-convite');
  toast('Convite atualizado!');
  _alunosLoading = false;
  loadAlunosTab();
}

// ── APAGAR CONVITE ────────────────────────────────
function apagarConviteConfirm(id, usado, usedBy) {
  var msg = usado
    ? 'Tem certeza? O aluno perderá acesso ao app.'
    : 'Apagar este convite?';
  if (!confirm(msg)) return;
  _executarApagarConvite(id, usado ? usedBy : null);
}

async function _executarApagarConvite(id, usedBy) {
  var err = await apagarConvite(id, usedBy);
  if (err) { toast('Erro ao apagar!'); console.error(err); return; }
  toast('Convite apagado' + (usedBy ? ' e acesso revogado.' : '!'));
  _alunosLoading = false;
  loadAlunosTab();
}

