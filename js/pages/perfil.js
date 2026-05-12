// FISCHER METHOD -- perfil.js
var _perfilSalvando    = false;
var _perfilFotoBase64  = null; // base64 temporário durante edição

// ── ENTRY — roteia por role ───────────────────────
function renderPerfil() {
  if (currentProfile && currentProfile.role === 'aluno') {
    _renderPerfilAluno();
  } else {
    _renderPerfilPersonal();
  }
}

// ════════════════════════════════════════════════════
//  PERSONAL
// ════════════════════════════════════════════════════
function _renderPerfilPersonal() {
  var el = document.getElementById('pg-perfil');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Perfil</div></div>' +
    '</div>' +
    '<div style="padding:0 20px 32px;">' +
      '<div id="perfil-header"></div>' +
      '<div style="height:1px;background:var(--outline);margin:0 0 28px;"></div>' +
      _perfilConfigHTML(true) +
      _perfilContaHTML() +
    '</div>';

  _perfilRenderHeader();
}

// Header do personal em modo visualização
function _perfilRenderHeader() {
  var hdr = document.getElementById('perfil-header');
  if (!hdr) return;
  var p = currentProfile || {};

  hdr.innerHTML =
    '<div style="text-align:center;padding:28px 0 22px;">' +
      '<div style="display:inline-block;cursor:pointer;" onclick="abrirEdicaoPerfil()">' +
        avatarHTML(p, 'av-xl') +
      '</div>' +
      '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:-.02em;margin-top:14px;">' +
        (p.name || 'Sem nome') +
      '</div>' +
      (p.email    ? '<div style="font-size:12px;color:var(--muted);margin-top:3px;">' + p.email + '</div>' : '') +
      (p.bio      ? '<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.6;max-width:280px;margin-left:auto;margin-right:auto;">' + p.bio + '</div>' : '') +
      (p.telefone ? '<div style="font-size:12px;color:var(--muted);margin-top:4px;">&#x1F4DE; ' + p.telefone + '</div>' : '') +
      '<button class="btn btn-ghost btn-sm" style="margin-top:18px;" onclick="abrirEdicaoPerfil()">&#x270F; Editar perfil</button>' +
    '</div>';
}

// Abre o formulário de edição inline (personal)
function abrirEdicaoPerfil() {
  var hdr = document.getElementById('perfil-header');
  if (!hdr) return;
  var p = currentProfile || {};
  _perfilFotoBase64 = null;

  // Preview do avatar atual
  var avPreview = p.photo_url
    ? '<img src="' + _escHtml(p.photo_url) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
    : '<div style="width:100%;height:100%;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">' + (p.name ? p.name.charAt(0).toUpperCase() : '?') + '</div>';

  hdr.innerHTML =
    '<div style="padding:20px 0 8px;">' +
      '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;">Editar perfil</div>' +

      // Foto
      '<div style="text-align:center;margin-bottom:20px;">' +
        '<div id="ep-foto-preview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 10px;background:var(--surf-high);border:2px solid var(--outline);cursor:pointer;" onclick="_fotoUpload(\'ep-foto-preview\')">' +
          avPreview +
        '</div>' +
        '<button class="btn btn-ghost btn-xs" onclick="_fotoUpload(\'ep-foto-preview\')">&#x1F4F7; Trocar foto</button>' +
      '</div>' +

      '<div class="fg"><label>Nome completo</label>' +
        '<input type="text" id="ep-nome" value="' + _escHtml(p.name || '') + '"></div>' +
      '<div class="fg"><label>Telefone</label>' +
        '<input type="tel" id="ep-tel" value="' + _escHtml(p.telefone || '') + '" placeholder="(11) 99999-9999"></div>' +
      '<div class="fg"><label>Bio / Apresentacao</label>' +
        '<textarea id="ep-bio" rows="3" placeholder="Personal trainer especializado em...">' + _escHtml(p.bio || '') + '</textarea></div>' +

      '<div style="display:flex;gap:10px;margin-top:4px;margin-bottom:4px;">' +
        '<button class="btn btn-ghost" style="flex:1;" onclick="fecharEdicaoPerfil()">Cancelar</button>' +
        '<button class="btn btn-primary" style="flex:1;" id="ep-btn-salvar" onclick="salvarPerfil()">Salvar</button>' +
      '</div>' +
    '</div>';

  setTimeout(function() { var inp = document.getElementById('ep-nome'); if (inp) inp.focus(); }, 100);
}

function fecharEdicaoPerfil() {
  _perfilFotoBase64 = null;
  _perfilRenderHeader();
}

async function salvarPerfil() {
  if (_perfilSalvando) return;
  var nome = (document.getElementById('ep-nome').value || '').trim();
  if (!nome) { toast('Digite o nome!'); return; }

  var btn = document.getElementById('ep-btn-salvar');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  _perfilSalvando = true;

  try {
    var data = {
      name:      nome,
      photo_url: _perfilFotoBase64 || currentProfile.photo_url || null,
      telefone:  (document.getElementById('ep-tel').value  || '').trim() || null,
      bio:       (document.getElementById('ep-bio').value  || '').trim() || null
    };

    var err = await updateProfile(currentUser.id, data);
    if (err) { toast('Erro ao salvar: ' + (err.message || JSON.stringify(err))); return; }

    Object.assign(currentProfile, data);
    _perfilFotoBase64 = null;
    toast('Perfil atualizado!');
    _perfilRenderHeader();
  } catch(e) {
    console.error('salvarPerfil:', e);
    toast('Erro inesperado: ' + (e.message || String(e)));
  } finally {
    _perfilSalvando = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
  }
}

// ════════════════════════════════════════════════════
//  ALUNO
// ════════════════════════════════════════════════════
function _renderPerfilAluno() {
  var el = document.getElementById('pg-perfil');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Perfil</div></div>' +
    '</div>' +
    '<div style="padding:0 20px 32px;">' +
      '<div id="perfil-header"></div>' +
      '<div style="height:1px;background:var(--outline);margin:0 0 28px;"></div>' +
      _perfilConfigHTML(false) +
      _perfilContaHTML() +
    '</div>';

  _perfilAlunoRenderHeader();
}

function _perfilAlunoRenderHeader() {
  var hdr = document.getElementById('perfil-header');
  if (!hdr) return;
  var p = currentProfile || {};

  hdr.innerHTML =
    '<div style="text-align:center;padding:28px 0 22px;">' +
      '<div style="display:inline-block;cursor:pointer;" onclick="abrirEdicaoAluno()">' +
        avatarHTML(p, 'av-xl') +
      '</div>' +
      '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:-.02em;margin-top:14px;">' +
        (p.name || 'Sem nome') +
      '</div>' +
      (p.telefone  ? '<div style="font-size:12px;color:var(--muted);margin-top:3px;">&#x1F4DE; ' + p.telefone + '</div>' : '') +
      (p.objetivo  ? '<div style="font-size:12px;color:var(--green-pale);margin-top:6px;font-style:italic;">&#x1F3AF; ' + p.objetivo + '</div>' : '') +
      '<button class="btn btn-ghost btn-sm" style="margin-top:18px;" onclick="abrirEdicaoAluno()">&#x270F; Editar perfil</button>' +
    '</div>';
}

function abrirEdicaoAluno() {
  var hdr = document.getElementById('perfil-header');
  if (!hdr) return;
  var p = currentProfile || {};
  _perfilFotoBase64 = null;

  var avPreview = p.photo_url
    ? '<img src="' + _escHtml(p.photo_url) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
    : '<div style="width:100%;height:100%;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">' + (p.name ? p.name.charAt(0).toUpperCase() : '?') + '</div>';

  hdr.innerHTML =
    '<div style="padding:20px 0 8px;">' +
      '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;">Editar perfil</div>' +

      // Foto
      '<div style="text-align:center;margin-bottom:20px;">' +
        '<div id="ep-foto-preview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 10px;background:var(--surf-high);border:2px solid var(--outline);cursor:pointer;" onclick="_fotoUpload(\'ep-foto-preview\')">' +
          avPreview +
        '</div>' +
        '<button class="btn btn-ghost btn-xs" onclick="_fotoUpload(\'ep-foto-preview\')">&#x1F4F7; Trocar foto</button>' +
      '</div>' +

      '<div class="fg"><label>Nome</label>' +
        '<input type="text" id="ep-nome" value="' + _escHtml(p.name || '') + '"></div>' +
      '<div class="fg"><label>Telefone</label>' +
        '<input type="tel" id="ep-tel" value="' + _escHtml(p.telefone || '') + '" placeholder="(11) 99999-9999"></div>' +
      '<div class="fg"><label>Objetivo</label>' +
        '<input type="text" id="ep-obj" value="' + _escHtml(p.objetivo || '') + '" placeholder="Ex: Emagrecer 5kg, Ganhar massa..."></div>' +

      '<div style="display:flex;gap:10px;margin-top:4px;margin-bottom:4px;">' +
        '<button class="btn btn-ghost" style="flex:1;" onclick="fecharEdicaoAluno()">Cancelar</button>' +
        '<button class="btn btn-primary" style="flex:1;" id="ep-btn-salvar" onclick="salvarPerfilAluno()">Salvar</button>' +
      '</div>' +
    '</div>';

  setTimeout(function() { var inp = document.getElementById('ep-nome'); if (inp) inp.focus(); }, 100);
}

function fecharEdicaoAluno() {
  _perfilFotoBase64 = null;
  _perfilAlunoRenderHeader();
}

async function salvarPerfilAluno() {
  if (_perfilSalvando) return;
  var nome = (document.getElementById('ep-nome').value || '').trim();
  if (!nome) { toast('Digite o nome!'); return; }

  var btn = document.getElementById('ep-btn-salvar');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  _perfilSalvando = true;

  try {
    var data = {
      name:      nome,
      photo_url: _perfilFotoBase64 || currentProfile.photo_url || null,
      telefone:  (document.getElementById('ep-tel').value || '').trim() || null,
      objetivo:  (document.getElementById('ep-obj').value || '').trim() || null
    };

    var err = await updateProfile(currentUser.id, data);
    if (err) { toast('Erro ao salvar: ' + (err.message || JSON.stringify(err))); return; }

    Object.assign(currentProfile, data);
    _perfilFotoBase64 = null;
    toast('Perfil atualizado!');
    _perfilAlunoRenderHeader();
  } catch(e) {
    console.error('salvarPerfilAluno:', e);
    toast('Erro inesperado: ' + (e.message || String(e)));
  } finally {
    _perfilSalvando = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
  }
}

// ════════════════════════════════════════════════════
//  FOTO — upload + resize via canvas (compartilhado)
// ════════════════════════════════════════════════════
function _fotoUpload(previewId) {
  var inp = document.createElement('input');
  inp.type    = 'file';
  inp.accept  = 'image/*';
  inp.capture = 'user';
  inp.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    _fotoResizar(file, function(base64) {
      _perfilFotoBase64 = base64;
      var prev = document.getElementById(previewId);
      if (prev) prev.innerHTML = '<img src="' + base64 + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    });
  };
  inp.click();
}

function _fotoResizar(file, cb) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var MAX = 400;
      var w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      var canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════════════════
//  SEÇÕES COMPARTILHADAS
// ════════════════════════════════════════════════════

// Config — pessoal mostra tema + notificações; aluno só tema
function _perfilConfigHTML(mostrarNotif) {
  var temaAtual  = localStorage.getItem('fm_tema') || 'escuro';
  var nfFeedback = localStorage.getItem('fm_notif_feedback') === '1';
  var nfTreino   = localStorage.getItem('fm_notif_treino')   === '1';

  var h = '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;">Configuracoes</div>';

  // Tema
  h += '<div style="font-size:12px;color:var(--muted);margin-bottom:8px;font-weight:600;">Tema</div>';
  h += '<div style="display:flex;gap:8px;margin-bottom:22px;">';
  h += _temaBtn('escuro', '&#x1F319; Escuro', temaAtual === 'escuro');
  h += _temaBtn('claro',  '&#x2600; Claro',   temaAtual === 'claro');
  h += '</div>';

  // Notificações — só personal
  if (mostrarNotif) {
    h += '<div style="font-size:12px;color:var(--muted);margin-bottom:4px;font-weight:600;">Notificacoes</div>';
    h += '<div class="card" style="padding:0 14px;margin-bottom:28px;">';
    h += _perfilToggle('toggle-nf-feedback', 'Feedback de aluno',   'Aviso quando aluno registra feedback', nfFeedback, "perfilToggleNotif('fm_notif_feedback','toggle-nf-feedback')", true);
    h += _perfilToggle('toggle-nf-treino',   'Treino concluido',    'Aviso quando aluno conclui um treino', nfTreino,   "perfilToggleNotif('fm_notif_treino','toggle-nf-treino')",     true);
    h += '</div>';
  } else {
    h += '<div style="height:4px;"></div>';
  }

  return h;
}

function _temaBtn(tema, label, ativo) {
  var base = 'flex:1;padding:11px 8px;border-radius:var(--rs);font-size:13px;font-weight:600;text-align:center;border:1.5px solid;cursor:pointer;transition:all .18s;';
  var style = ativo
    ? base + 'background:var(--green);color:var(--white);border-color:var(--green);'
    : base + 'background:transparent;color:var(--muted);border-color:var(--outline);';
  return '<button id="tema-btn-' + tema + '" style="' + style + '" onclick="perfilSetTema(\'' + tema + '\')">' + label + '</button>';
}

function _perfilToggle(id, label, sublabel, checked, onclickFn, emBreve) {
  var trackColor = checked ? 'var(--green)' : 'var(--surf-high)';
  var knobLeft   = checked ? '20px' : '3px';
  return (
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--outline);">' +
      '<div style="flex:1;min-width:0;margin-right:12px;">' +
        '<div style="font-size:14px;font-weight:500;">' + label +
          (emBreve ? ' <span style="font-size:9px;font-weight:700;color:var(--muted);background:var(--surf-high);border:1px solid var(--outline);border-radius:4px;padding:1px 5px;vertical-align:middle;letter-spacing:.04em;">EM BREVE</span>' : '') +
        '</div>' +
        (sublabel ? '<div style="font-size:11px;color:var(--muted);margin-top:1px;">' + sublabel + '</div>' : '') +
      '</div>' +
      '<button id="' + id + '" onclick="' + onclickFn + '" ' +
        'style="width:44px;height:26px;border-radius:13px;background:' + trackColor + ';border:1px solid var(--outline);position:relative;transition:background .2s;flex-shrink:0;cursor:pointer;">' +
        '<div style="position:absolute;top:3px;left:' + knobLeft + ';width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>' +
      '</button>' +
    '</div>'
  );
}

function _perfilContaHTML() {
  return (
    '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;">Conta</div>' +
    '<div class="card" style="padding:0 14px;margin-bottom:20px;">' +
      '<div style="padding:14px 0;border-bottom:1px solid var(--outline);">' +
        '<button onclick="perfilLogout()" style="width:100%;text-align:left;font-size:14px;font-weight:600;color:var(--red);background:none;border:none;cursor:pointer;padding:0;">' +
          '&#x1F6AA; Sair da conta' +
        '</button>' +
      '</div>' +
      '<div style="padding:12px 0;font-size:11px;color:var(--faint);">Fischer Method &middot; v1.0</div>' +
    '</div>'
  );
}

// ════════════════════════════════════════════════════
//  AÇÕES
// ════════════════════════════════════════════════════
function perfilSetTema(tema) {
  localStorage.setItem('fm_tema', tema);
  applyTema(tema);
  ['escuro','claro'].forEach(function(t) {
    var btn = document.getElementById('tema-btn-' + t);
    if (!btn) return;
    var ativo = t === tema;
    btn.style.background  = ativo ? 'var(--green)' : 'transparent';
    btn.style.color       = ativo ? 'var(--white)'  : 'var(--muted)';
    btn.style.borderColor = ativo ? 'var(--green)'  : 'var(--outline)';
  });
}

function perfilToggleNotif(key, btnId) {
  var novo = !(localStorage.getItem(key) === '1');
  localStorage.setItem(key, novo ? '1' : '0');
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.style.background = novo ? 'var(--green)' : 'var(--surf-high)';
  var knob = btn.querySelector('div');
  if (knob) knob.style.left = novo ? '20px' : '3px';
}

function perfilLogout() {
  if (confirm('Sair da conta Fischer Method?')) logout();
}

// ── UTIL ──────────────────────────────────────────
function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
