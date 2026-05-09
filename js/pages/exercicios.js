// js/pages/exercicios.js
var exTab = 'exercicios';
var exFiltros = {};
var exTreinoDetalheId = null;
var exTreinoDetalheNome = '';
var _exLoading = false;

var EX_MUSCULOS = ['Peito','Costas','Ombros','Biceps','Triceps','Pernas','Gluteos','Core','Panturrilha','Full Body'];
var EX_TIPOS    = ['Forca','Cardio','Mobilidade','Alongamento'];
var EX_LOCAIS   = ['Academia','Casa'];
var EX_EQUIPS   = ['Sem equipamento','Halteres','Barra','Maquina','Cabo','Elastico','Kettlebell','Barra fixa'];
var DIAS_SEMANA = ['Segunda','Terca','Quarta','Quinta','Sexta','Sabado','Domingo','Qualquer dia'];

// ── ENTRY ─────────────────────────────────────────
function renderExercicios() {
  var el = document.getElementById('pg-exercicios');
  if (!el) return;
  exTreinoDetalheId = null;
  el.innerHTML =
    '<div class="top-bar">' +
      '<div><div class="top-bar-title">Exercicios</div></div>' +
      '<div id="ex-action-btn"></div>' +
    '</div>' +
    '<div class="tabs" style="padding:0 20px;overflow-x:auto;scrollbar-width:none;" id="ex-tabs">' +
      '<button class="tab' + (exTab==='exercicios'?' on':'') + '" onclick="exSwitchTab(\'exercicios\',this)">Biblioteca</button>' +
      '<button class="tab' + (exTab==='treinos'?' on':'') + '" onclick="exSwitchTab(\'treinos\',this)">Treinos</button>' +
    '</div>' +
    '<div id="ex-content" style="padding:0 20px 20px;"></div>';
  loadExContent();
}

function exSwitchTab(tab, btn) {
  exTab = tab;
  exTreinoDetalheId = null;
  document.querySelectorAll('#ex-tabs .tab').forEach(function(t) { t.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  loadExContent();
}

function loadExContent() {
  updateExActionBtn();
  if (exTreinoDetalheId) { loadTreinoDetalhe(exTreinoDetalheId); return; }
  if (exTab === 'exercicios') loadExLista();
  else loadTreinoLista();
}

function updateExActionBtn() {
  var btn = document.getElementById('ex-action-btn');
  if (!btn) return;
  if (exTreinoDetalheId) {
    btn.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openAddExToTreino()">+ Exercicio</button>';
  } else if (exTab === 'exercicios') {
    btn.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openNovoExercicio()">+ Exercicio</button>';
  } else {
    btn.innerHTML = '<button class="btn btn-primary btn-sm" onclick="openNovoTreinoTemplate()">+ Treino</button>';
  }
}

// ── YOUTUBE HELPERS ───────────────────────────────
function ytId(url) {
  if (!url) return null;
  var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function ytThumb(url) {
  var id = ytId(url);
  return id ? 'https://img.youtube.com/vi/' + id + '/mqdefault.jpg' : null;
}

function abrirYT(url) {
  var id = ytId(url);
  if (!id) { toast('Link de video invalido.'); return; }
  var over = document.createElement('div');
  over.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:600;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
  over.innerHTML =
    '<button onclick="this.parentNode.remove()" style="position:absolute;top:20px;right:20px;font-size:24px;color:#fff;background:none;border:none;cursor:pointer;">&#x2715;</button>' +
    '<div style="width:100%;max-width:390px;border-radius:12px;overflow:hidden;">' +
      '<iframe width="100%" height="220" src="https://www.youtube.com/embed/' + id + '?autoplay=1" frameborder="0" allow="autoplay;encrypted-media" allowfullscreen></iframe>' +
    '</div>';
  over.addEventListener('click', function(e) { if (e.target === over) over.remove(); });
  document.body.appendChild(over);
}

// ── BIBLIOTECA DE EXERCICIOS ──────────────────────
async function loadExLista() {
  if (_exLoading) return;
  _exLoading = true;
  var el = document.getElementById('ex-content');
  if (!el) { _exLoading = false; return; }
  el.innerHTML = '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';

  try {
    var exercicios = await getExercicios(exFiltros);
    var html = '';

    html += '<div style="overflow-x:auto;scrollbar-width:none;margin-bottom:10px;"><div style="display:flex;gap:6px;padding:4px 0;white-space:nowrap;">';
    html += exChip('musculo', null, 'Todos');
    EX_MUSCULOS.forEach(function(m) { html += exChip('musculo', m, m); });
    html += '</div></div>';

    html += '<div style="overflow-x:auto;scrollbar-width:none;margin-bottom:14px;"><div style="display:flex;gap:6px;padding:4px 0;white-space:nowrap;">';
    html += exChip('tipo', null, 'Todos tipos');
    EX_TIPOS.forEach(function(t) { html += exChip('tipo', t, t); });
    html += exChip('local', null, 'Todos locais');
    EX_LOCAIS.forEach(function(l) { html += exChip('local', l, l); });
    html += '</div></div>';

    if (!exercicios.length) {
      html += '<div class="empty"><div class="empty-ico">&#x1F3CB;</div><p>Nenhum exercicio cadastrado ainda.<br><span style="font-size:12px;color:var(--muted);">Use o botao + para adicionar.</span></p></div>';
    } else {
      exercicios.forEach(function(ex) { html += exCardBiblioteca(ex); });
    }
    el.innerHTML = html;
  } finally {
    _exLoading = false;
  }
}

function exChip(campo, valor, label) {
  var ativo = exFiltros[campo] === valor;
  var style = ativo
    ? 'display:inline-flex;align-items:center;padding:6px 14px;border-radius:99px;font-size:11px;font-weight:700;background:var(--green);color:var(--white);border:1.5px solid var(--green);cursor:pointer;flex-shrink:0;'
    : 'display:inline-flex;align-items:center;padding:6px 14px;border-radius:99px;font-size:11px;font-weight:600;background:transparent;color:var(--muted);border:1.5px solid var(--outline);cursor:pointer;flex-shrink:0;';
  var v = valor === null ? 'null' : '\'' + valor + '\'';
  return '<button style="' + style + '" onclick="exSetFiltro(\'' + campo + '\',' + v + ')">' + label + '</button>';
}

function exSetFiltro(campo, valor) {
  exFiltros[campo] = valor;
  loadExLista();
}

function exCardBiblioteca(ex) {
  var thumb = ytThumb(ex.youtube_url);
  var exJson = encodeURIComponent(JSON.stringify(ex));
  return '<div class="card mb" style="cursor:pointer;padding:14px;" onclick="openExDetalhe(\'' + exJson + '\')">' +
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + ex.nome + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;">' +
          (ex.musculo ? '<span class="badge badge-green">' + ex.musculo + '</span>' : '') +
          (ex.tipo ? '<span class="badge badge-muted">' + ex.tipo + '</span>' : '') +
          (ex.local ? '<span class="badge badge-muted">' + ex.local + '</span>' : '') +
        '</div>' +
        (ex.instrucoes ? '<div style="font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + ex.instrucoes + '</div>' : '') +
      '</div>' +
      (thumb ?
        '<div style="width:72px;flex-shrink:0;" onclick="event.stopPropagation();abrirYT(\'' + ex.youtube_url + '\')">' +
          '<div class="yt-thumb" style="aspect-ratio:16/9;">' +
            '<img src="' + thumb + '" alt="' + ex.nome + '" loading="lazy">' +
            '<div class="yt-play"><div class="yt-play-btn" style="width:28px;height:28px;"><svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M0 0L10 6L0 12V0Z" fill="white"/></svg></div></div>' +
          '</div>' +
        '</div>'
      : '') +
    '</div>' +
  '</div>';
}

function openExDetalhe(exJson) {
  var ex;
  try { ex = JSON.parse(decodeURIComponent(exJson)); } catch(e) { return; }
  var thumb = ytThumb(ex.youtube_url);
  var existing = document.getElementById('mod-ex-det'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-ex-det';
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<div style="display:flex;gap:14px;align-items:flex-start;">' +
        '<div style="flex:1;min-width:0;">' +
          '<h3 style="margin-bottom:6px;">' + ex.nome + '</h3>' +
          '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">' +
            (ex.musculo ? '<span class="badge badge-green">' + ex.musculo + '</span>' : '') +
            (ex.tipo ? '<span class="badge badge-muted">' + ex.tipo + '</span>' : '') +
            (ex.local ? '<span class="badge badge-muted">' + ex.local + '</span>' : '') +
            (ex.equipamento ? '<span class="badge badge-blue">' + ex.equipamento + '</span>' : '') +
          '</div>' +
        '</div>' +
        (thumb ?
          '<div style="width:90px;flex-shrink:0;cursor:pointer;" onclick="abrirYT(\'' + ex.youtube_url + '\')">' +
            '<div style="border-radius:var(--rs);overflow:hidden;aspect-ratio:2/3;background:var(--surf-high);">' +
              '<img src="' + thumb + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' +
              '<div style="position:relative;margin-top:-100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);">' +
                '<div class="yt-play-btn"><svg width="12" height="14" viewBox="0 0 10 12" fill="none"><path d="M0 0L10 6L0 12V0Z" fill="white"/></svg></div>' +
              '</div>' +
            '</div>' +
          '</div>'
        : '') +
      '</div>' +
      (ex.instrucoes ?
        '<div style="margin-bottom:14px;">' +
          '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Instrucoes</div>' +
          '<div style="font-size:13px;line-height:1.7;color:var(--white);">' + ex.instrucoes + '</div>' +
        '</div>'
      : '') +
      (ex.minutos ? '<div style="font-size:12px;color:var(--muted);">&#x23F1; ' + ex.minutos + ' minutos de duracao sugerida</div>' : '') +
      (ex.youtube_url ?
        '<button class="btn btn-outline btn-full" style="margin-top:14px;" onclick="abrirYT(\'' + ex.youtube_url + '\')">&#x25B6; Ver video</button>'
      : '') +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-ex-det');
}

// ── CRIAR EXERCICIO ───────────────────────────────
function openNovoExercicio() {
  var existing = document.getElementById('mod-novo-ex'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-novo-ex';

  var muscOpts = EX_MUSCULOS.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
  var tipoOpts = EX_TIPOS.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
  var localOpts = EX_LOCAIS.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
  var equipOpts = [''].concat(EX_EQUIPS).map(function(v) { return '<option value="' + v + '">' + (v || '-- Nenhum --') + '</option>'; }).join('');

  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>Novo exercicio</h3>' +
      '<div class="fg"><label>Nome</label><input type="text" id="nex-nome" placeholder="Ex: Supino Reto"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div class="fg"><label>Musculo</label><select id="nex-musculo"><option value="">--</option>' + muscOpts + '</select></div>' +
        '<div class="fg"><label>Tipo</label><select id="nex-tipo"><option value="">--</option>' + tipoOpts + '</select></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div class="fg"><label>Local</label><select id="nex-local"><option value="">--</option>' + localOpts + '</select></div>' +
        '<div class="fg"><label>Equipamento</label><select id="nex-equip">' + equipOpts + '</select></div>' +
      '</div>' +
      '<div class="fg"><label>URL do YouTube</label><input type="url" id="nex-yt" placeholder="https://youtube.com/watch?v=..."></div>' +
      '<div class="fg"><label>Instrucoes</label><textarea id="nex-inst" placeholder="Como executar o exercicio..."></textarea></div>' +
      '<div class="fg"><label>Duracao sugerida (min) — cardio</label><input type="number" id="nex-min" placeholder="Ex: 20" min="1"></div>' +
      '<div class="mod-actions">' +
        '<button class="btn btn-ghost" onclick="closeModal(\'mod-novo-ex\')">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="salvarNovoExercicio()">Salvar</button>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-novo-ex');
}

async function salvarNovoExercicio() {
  var nome = document.getElementById('nex-nome').value.trim();
  if (!nome) { toast('Digite o nome do exercicio!'); return; }
  var data = {
    nome: nome,
    musculo: document.getElementById('nex-musculo').value || null,
    tipo: document.getElementById('nex-tipo').value || null,
    local: document.getElementById('nex-local').value || null,
    equipamento: document.getElementById('nex-equip').value || null,
    youtube_url: document.getElementById('nex-yt').value.trim() || null,
    instrucoes: document.getElementById('nex-inst').value.trim() || null,
    minutos: parseInt(document.getElementById('nex-min').value) || null
  };
  var err = await criarExercicio(data);
  if (err) { toast('Erro ao salvar exercicio!'); console.error(err); return; }
  closeModal('mod-novo-ex');
  toast('Exercicio criado!');
  loadExLista();
}

// ── TREINOS TEMPLATES ─────────────────────────────
async function loadTreinoLista() {
  if (_exLoading) return;
  _exLoading = true;
  var el = document.getElementById('ex-content');
  if (!el) { _exLoading = false; return; }
  el.innerHTML = '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';

  try {
    var treinos = await getTreinos();
    if (!treinos.length) {
      el.innerHTML =
        '<div class="empty"><div class="empty-ico">&#x1F4AA;</div>' +
        '<p>Nenhum treino template ainda.<br><span style="font-size:12px;color:var(--muted);">Crie templates que podem ser<br>atribuidos a qualquer aluno.</span></p></div>';
      return;
    }
    var html = '';
    treinos.forEach(function(t) {
      html +=
        '<div class="card mb" style="cursor:pointer;" onclick="entrarTreinoDetalhe(\'' + t.id + '\',\'' + t.nome.replace(/'/g, '') + '\')">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:40px;height:40px;border-radius:var(--rx);background:var(--green-glow);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">&#x1F4AA;</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.nome + '</div>' +
              (t.descricao ? '<div style="font-size:11px;color:var(--muted);margin-top:2px;">' + t.descricao + '</div>' : '') +
            '</div>' +
            '<span style="font-size:18px;color:var(--muted);">&#x203A;</span>' +
          '</div>' +
        '</div>';
    });
    el.innerHTML = html;
  } finally {
    _exLoading = false;
  }
}

function entrarTreinoDetalhe(id, nome) {
  exTreinoDetalheId = id;
  exTreinoDetalheNome = nome;
  updateExActionBtn();
  loadTreinoDetalhe(id);
}

async function loadTreinoDetalhe(treinoId) {
  var el = document.getElementById('ex-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';

  var res = await sb.from('treino_exercicios').select('*, exercicios(*)').eq('treino_id', treinoId).order('ordem');
  var itens = res.data || [];

  var html =
    '<button class="btn btn-ghost btn-sm" style="margin-bottom:14px;" onclick="voltarTreinoLista()">&#x2190; Treinos</button>' +
    '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:14px;">' + exTreinoDetalheNome + '</div>';

  if (!itens.length) {
    html += '<div class="empty" style="padding:30px 0;"><div class="empty-ico">&#x2795;</div><p>Nenhum exercicio neste treino.<br><span style="font-size:12px;color:var(--muted);">Use + Exercicio para adicionar.</span></p></div>';
  } else {
    itens.forEach(function(item) {
      html += exCardTreino(item);
    });
  }

  el.innerHTML = html;
}

function exCardTreino(item) {
  var ex = item.exercicios || {};
  var thumb = ytThumb(ex.youtube_url);
  return '<div class="card mb" style="padding:14px;">' +
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:4px;">' + (ex.nome || 'Exercicio') + '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">' +
          (ex.musculo ? '<span class="badge badge-green">' + ex.musculo + '</span>' : '') +
          (ex.tipo ? '<span class="badge badge-muted">' + ex.tipo + '</span>' : '') +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;">' +
          (item.series ? '<div style="font-size:12px;"><span style="color:var(--muted);">Series </span><strong>' + item.series + '</strong></div>' : '') +
          (item.repeticoes ? '<div style="font-size:12px;"><span style="color:var(--muted);">Reps </span><strong>' + item.repeticoes + '</strong></div>' : '') +
          (item.carga ? '<div style="font-size:12px;"><span style="color:var(--muted);">Carga </span><strong>' + item.carga + ' kg</strong></div>' : '') +
          (item.descanso_seg ? '<div style="font-size:12px;"><span style="color:var(--muted);">Descanso </span><strong>' + item.descanso_seg + 's</strong></div>' : '') +
        '</div>' +
        (ex.instrucoes ? '<div style="font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + ex.instrucoes + '</div>' : '') +
      '</div>' +
      (thumb ?
        '<div style="width:80px;flex-shrink:0;cursor:pointer;" onclick="abrirYT(\'' + ex.youtube_url + '\')">' +
          '<div style="border-radius:var(--rs);overflow:hidden;aspect-ratio:2/3;background:var(--surf-high);position:relative;">' +
            '<img src="' + thumb + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' +
            '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);">' +
              '<div class="yt-play-btn" style="width:30px;height:30px;"><svg width="11" height="13" viewBox="0 0 10 12" fill="none"><path d="M0 0L10 6L0 12V0Z" fill="white"/></svg></div>' +
            '</div>' +
          '</div>' +
        '</div>'
      : '') +
    '</div>' +
  '</div>';
}

function voltarTreinoLista() {
  exTreinoDetalheId = null;
  exTreinoDetalheNome = '';
  updateExActionBtn();
  loadTreinoLista();
}

// ── CRIAR TREINO TEMPLATE ─────────────────────────
function openNovoTreinoTemplate() {
  var existing = document.getElementById('mod-novo-tr'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-novo-tr';
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>Novo treino template</h3>' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:16px;line-height:1.6;">Templates ficam na biblioteca e podem ser atribuidos a qualquer aluno.</div>' +
      '<div class="fg"><label>Nome do treino</label><input type="text" id="ntr-nome" placeholder="Ex: Treino A · Superiores"></div>' +
      '<div class="fg"><label>Descricao</label><input type="text" id="ntr-desc" placeholder="Ex: Foco em peito, ombro e triceps"></div>' +
      '<div class="mod-actions">' +
        '<button class="btn btn-ghost" onclick="closeModal(\'mod-novo-tr\')">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="salvarNovoTreinoTemplate()">Criar</button>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-novo-tr');
}

async function salvarNovoTreinoTemplate() {
  var nome = document.getElementById('ntr-nome').value.trim();
  if (!nome) { toast('Digite o nome do treino!'); return; }
  var res = await criarTreino({
    nome: nome,
    descricao: document.getElementById('ntr-desc').value.trim() || null,
    e_template: true,
    ativo: true
  });
  if (res.error) { toast('Erro ao criar treino!'); console.error(res.error); return; }
  closeModal('mod-novo-tr');
  toast('Treino criado!');
  entrarTreinoDetalhe(res.data.id, nome);
}

// ── ADICIONAR EXERCICIO AO TREINO ─────────────────
async function openAddExToTreino() {
  var treinoId = exTreinoDetalheId;
  if (!treinoId) return;

  var exercicios = await getExercicios();
  var existing = document.getElementById('mod-add-ex'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-add-ex';

  var lista = exercicios.map(function(ex) {
    var thumb = ytThumb(ex.youtube_url);
    return '<div class="list-row" onclick="openConfAddEx(\'' + ex.id + '\',\'' + ex.nome.replace(/'/g, '') + '\')">' +
      (thumb ? '<img src="' + thumb + '" style="width:40px;height:40px;border-radius:var(--rx);object-fit:cover;flex-shrink:0;">' :
               '<div style="width:40px;height:40px;border-radius:var(--rx);background:var(--surf-high);border:1px solid var(--outline);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">&#x1F3CB;</div>') +
      '<div class="list-row-info">' +
        '<div class="list-row-title">' + ex.nome + '</div>' +
        '<div class="list-row-sub">' + [ex.musculo, ex.tipo].filter(Boolean).join(' · ') + '</div>' +
      '</div>' +
      '<span style="font-size:18px;color:var(--muted);">&#x203A;</span>' +
    '</div>';
  }).join('');

  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>Adicionar exercicio</h3>' +
      (exercicios.length ? lista : '<div class="empty" style="padding:20px 0;"><p>Nenhum exercicio cadastrado ainda.</p></div>') +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-add-ex');
}

function openConfAddEx(exId, exNome) {
  var existing = document.getElementById('mod-conf-ex'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className = 'mov'; m.id = 'mod-conf-ex';
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>' + exNome + '</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div class="fg"><label>Series</label><input type="number" id="cex-series" value="3" min="1"></div>' +
        '<div class="fg"><label>Reps</label><input type="number" id="cex-reps" value="12" min="1"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
        '<div class="fg"><label>Carga (kg)</label><input type="number" id="cex-carga" step="0.5" placeholder="0"></div>' +
        '<div class="fg"><label>Descanso (s)</label><input type="number" id="cex-desc" value="60" min="0"></div>' +
      '</div>' +
      '<div class="fg"><label>Obs</label><input type="text" id="cex-obs" placeholder="Opcional"></div>' +
      '<div class="mod-actions">' +
        '<button class="btn btn-ghost" onclick="closeModal(\'mod-conf-ex\')">Cancelar</button>' +
        '<button class="btn btn-primary" onclick="confirmarAddEx(\'' + exId + '\')">Adicionar</button>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-conf-ex');
}

async function confirmarAddEx(exId) {
  var treinoId = exTreinoDetalheId;
  if (!treinoId) return;
  var contRes = await sb.from('treino_exercicios').select('ordem').eq('treino_id', treinoId).order('ordem', {ascending: false}).limit(1);
  var proxOrdem = contRes.data && contRes.data[0] ? contRes.data[0].ordem + 1 : 1;
  var data = {
    series: parseInt(document.getElementById('cex-series').value) || null,
    repeticoes: parseInt(document.getElementById('cex-reps').value) || null,
    carga: parseFloat(document.getElementById('cex-carga').value) || null,
    descanso_seg: parseInt(document.getElementById('cex-desc').value) || null,
    obs: document.getElementById('cex-obs').value.trim() || null,
    ordem: proxOrdem
  };
  var err = await adicionarExercicioAoTreino(treinoId, exId, data);
  if (err) { toast('Erro ao adicionar!'); console.error(err); return; }
  closeModal('mod-conf-ex');
  closeModal('mod-add-ex');
  toast('Exercicio adicionado!');
  loadTreinoDetalhe(treinoId);
}
