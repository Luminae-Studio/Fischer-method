// ================================================
// FISCHER METHOD — ui.js
// ================================================

// ── ESTADO DE NAVEGACAO ───────────────────────────
var _pgCurrent = null;
var _pgDirty = {};

function markDirty(id) { _pgDirty[id] = true; }

// ── NAVEGACAO ─────────────────────────────────────
function go(id) {
  // Fecha qualquer modal aberto antes de navegar — corrige o bug de tela bloqueada
  document.querySelectorAll('.mov.on').forEach(function(m) { m.classList.remove('on'); });

  document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('on'); });
  document.querySelectorAll('.bn').forEach(function(b) { b.classList.remove('on'); });
  var pg = document.getElementById('pg-' + id);
  if (pg) pg.classList.add('on');
  var bn = document.getElementById('bn-' + id);
  if (bn) bn.classList.add('on');
  document.getElementById('scr').scrollTo({ top: 0, behavior: 'instant' });

  // Mesma pagina e nao dirty: evita re-render desnecessario
  if (_pgCurrent === id && !_pgDirty[id]) return;
  _pgCurrent = id;
  _pgDirty[id] = false;
  renderPage(id);
}

function renderPage(id) {
  var pages = {
    inicio: renderInicio,
    treinos: renderTreinos,
    progresso: renderProgresso,
    perfil: renderPerfil,
    dash: renderDash,
    alunos: renderAlunos,
    exercicios: renderExercicios,
    faturas: renderFaturas,
    feedbacks: renderFeedbacks,
    avaliacoes: renderAvaliacoesAluno
  };
  if (pages[id]) pages[id]();
}

// ── MODAIS ────────────────────────────────────────
function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
}
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('on');
}
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('mov')) {
    e.target.classList.remove('on');
  }
});

// ── TOAST ─────────────────────────────────────────
function toast(msg, dur) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('on');
  setTimeout(function() { el.classList.remove('on'); }, dur || 2500);
}

// ── LOADING ───────────────────────────────────────
function showLoading(id) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = '<div style="text-align:center;padding:40px 20px;"><div class="spinner" style="margin:0 auto;"></div></div>';
}

// ── EMPTY STATE ───────────────────────────────────
function renderEmpty(id, ico, msg) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = '<div class="empty"><div class="empty-ico">' + ico + '</div><p>' + msg + '</p></div>';
}

// ── AVATAR ────────────────────────────────────────
function avatarHTML(profile, size) {
  var cls = 'avatar ' + (size || 'av-md');
  if (profile && profile.photo_url) {
    return '<div class="' + cls + '"><img src="' + profile.photo_url + '" alt="' + (profile.name || '') + '"></div>';
  }
  var initial = profile && profile.name ? profile.name.charAt(0).toUpperCase() : '?';
  return '<div class="' + cls + '"><div class="avatar-placeholder">' + initial + '</div></div>';
}

// ── FORMATAR DATA ─────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  var d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtDateLong(iso) {
  if (!iso) return '';
  var d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayISO() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ── CALCULOS ──────────────────────────────────────
function calcIMC(peso, altura) {
  if (!peso || !altura) return null;
  var h = altura > 3 ? altura / 100 : altura;
  return Math.round((peso / (h * h)) * 10) / 10;
}

function classIMC(imc) {
  if (!imc) return '';
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade I';
  if (imc < 40) return 'Obesidade II';
  return 'Obesidade III';
}
