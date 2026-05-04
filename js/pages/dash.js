// ================================================
// FISCHER METHOD — pages/dash.js
// Dashboard do Personal
// ================================================

async function renderDash() {
  var el = document.getElementById('pg-dash');
  if (!el) return;

  var now = new Date();
  var hour = now.getHours();
  var greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = currentProfile ? currentProfile.name.split(' ')[0] : 'Matheus';
  var today = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  el.innerHTML =
    '<div class="top-bar">' +
      '<div>' +
        '<div style="font-size:12px;color:var(--muted);">' + greeting + ', <span style="color:var(--green-pale);font-weight:600;">' + nome + '</span></div>' +
        '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:-0.02em;">Dashboard</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-ghost btn-sm" onclick="go(\'alunos\')" style="padding:8px 14px;font-size:12px;">+ Aluno</button>' +
      '</div>' +
    '</div>' +
    '<div id="dash-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  loadDashData();
}

async function loadDashData() {
  var el = document.getElementById('dash-content');
  if (!el) return;

  try {
    // Busca todos os alunos
    var alunos = await getTodosAlunos();
    var total = alunos.length;

    // Data de hoje
    var today = new Date().toISOString().split('T')[0];

    // Busca execucoes de hoje
    var resExec = await sb.from('execucoes')
      .select('*, profiles(name, photo_url)')
      .eq('data', today)
      .eq('concluido', true);
    var treinaram = resExec.data || [];

    // Busca feedbacks recentes (ultimos 7 dias)
    var d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    var resFeed = await sb.from('feedbacks')
      .select('*, profiles(name), execucoes(data)')
      .gte('created_at', d7.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    var feedbacks = resFeed.data || [];

    // Alunos que nao treinaram hoje
    var treinaHoje = treinaram.map(function(e) { return e.aluno_id || (e.profiles && e.profiles.id); });
    var inativos = alunos.filter(function(a) { return treinaHoje.indexOf(a.id) < 0; });

    // Data formatada
    var now = new Date();
    var todayFmt = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    var html = '';

    // DATA
    html += '<div style="font-size:12px;color:var(--muted);margin-bottom:16px;text-transform:capitalize;">' + todayFmt + '</div>';

    // STATS
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">';
    html += statBox(String(total), 'Alunos', false);
    html += statBox(String(treinaram.length), 'Treinaram hoje', true);
    html += statBox(String(feedbacks.length), 'Feedbacks (7d)', false);
    html += '</div>';

    // TREINARAM HOJE
    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Treinaram hoje</div>';
    html += '<span class="badge badge-green">' + treinaram.length + '/' + total + '</span>';
    html += '</div>';

    if (treinaram.length === 0) {
      html += '<div style="text-align:center;padding:16px 0;color:var(--muted);font-size:12px;">Nenhum treino concluido hoje ainda</div>';
    } else {
      treinaram.forEach(function(e) {
        var p = e.profiles || {};
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline);">';
        html += avatarHTML(p, 'av-sm');
        html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + (p.name || 'Aluno') + '</div></div>';
        html += '<span class="badge badge-green">&#x2713; Concluido</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    // PENDENTES HOJE
    if (inativos.length > 0) {
      html += '<div class="card mb">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
      html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Pendentes hoje</div>';
      html += '<span class="badge badge-muted">' + inativos.length + '</span>';
      html += '</div>';
      inativos.forEach(function(a) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline);cursor:pointer;" onclick="abrirAluno(\'' + a.id + '\')">';
        html += avatarHTML(a, 'av-sm');
        html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + (a.name || 'Aluno') + '</div>';
        html += '<div style="font-size:11px;color:var(--muted);">' + (a.objetivo || 'Sem objetivo definido') + '</div></div>';
        html += '<div style="font-size:18px;color:var(--muted);">&#x203A;</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // FEEDBACKS RECENTES
    html += '<div class="card mb">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Feedbacks recentes</div>';
    if (feedbacks.length === 0) {
      html += '<div style="text-align:center;padding:16px 0;color:var(--muted);font-size:12px;">Nenhum feedback recente</div>';
    } else {
      feedbacks.forEach(function(f) {
        var p = f.profiles || {};
        var intColor = f.intensidade === 'intenso' ? 'var(--red)' : f.intensidade === 'moderado' ? 'var(--gold)' : 'var(--green-pale)';
        var intLabel = f.intensidade === 'intenso' ? 'Intenso' : f.intensidade === 'moderado' ? 'Moderado' : 'Leve';
        html += '<div style="padding:10px 0;border-bottom:1px solid var(--outline);">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
        html += '<div style="font-size:13px;font-weight:600;">' + (p.name || 'Aluno') + '</div>';
        html += '<span style="font-size:10px;font-weight:700;color:' + intColor + ';">' + intLabel + '</span>';
        html += '</div>';
        if (f.comentario) {
          html += '<div style="font-size:12px;color:var(--muted);line-height:1.5;">"' + f.comentario + '"</div>';
        }
        html += '</div>';
      });
    }
    html += '</div>';

    // ACOES RAPIDAS
    html += '<div style="font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Acoes rapidas</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">';
    html += actionBtn('&#x1F465;', 'Ver alunos', "go('alunos')");
    html += actionBtn('&#x1F3CB;', 'Exercicios', "go('exercicios')");
    html += actionBtn('&#x1F511;', 'Gerar convite', "openGerarConvite()");
    html += actionBtn('&#x1F464;', 'Meu perfil', "go('perfil')");
    html += '</div>';

    el.innerHTML = html;

  } catch(err) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">&#x26A0;</div><p>Erro ao carregar dashboard.<br>Tente recarregar.</p></div>';
    console.error('Dash error:', err);
  }
}

function statBox(val, lbl, green) {
  return '<div class="card' + (green ? ' card-green' : '') + '" style="padding:14px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;line-height:1;' + (green ? 'color:var(--green-pale);' : '') + '">' + val + '</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.06em;">' + lbl + '</div>' +
    '</div>';
}

function actionBtn(ico, lbl, action) {
  return '<button class="card" style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;cursor:pointer;border:1px solid var(--outline);width:100%;transition:border-color .15s;" onclick="' + action + '">' +
    '<div style="font-size:26px;">' + ico + '</div>' +
    '<div style="font-size:12px;font-weight:600;">' + lbl + '</div>' +
    '</button>';
}

function abrirAluno(id) {
  // Sera implementado na tela de alunos
  go('alunos');
}

// ── GERAR CONVITE ─────────────────────────────────
function openGerarConvite() {
  var modal = document.getElementById('mod-convite');
  if (!modal) {
    // Cria modal on-the-fly se nao existir
    var m = document.createElement('div');
    m.className = 'mov';
    m.id = 'mod-convite';
    m.innerHTML =
      '<div class="mod">' +
        '<div class="mod-handle"></div>' +
        '<h3>Gerar Codigo de Convite</h3>' +
        '<div class="fg">' +
          '<label>Nome do aluno</label>' +
          '<input type="text" id="conv-nome" placeholder="Ex: Ana Silva">' +
        '</div>' +
        '<div id="conv-resultado" style="display:none;background:var(--surf-high);border:1px solid var(--green-border);border-radius:var(--rs);padding:16px;text-align:center;margin-bottom:16px;">' +
          '<div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Codigo gerado</div>' +
          '<div id="conv-code" style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--green-pale);letter-spacing:.12em;"></div>' +
          '<button class="btn btn-ghost btn-sm" style="margin-top:10px;" onclick="copiarConvite()">Copiar</button>' +
        '</div>' +
        '<div class="mod-actions">' +
          '<button class="btn btn-ghost" onclick="closeModal(\'mod-convite\')">Fechar</button>' +
          '<button class="btn btn-primary" onclick="gerarConvite()">Gerar</button>' +
        '</div>' +
      '</div>';
    m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
    document.body.appendChild(m);
  }
  document.getElementById('conv-nome').value = '';
  document.getElementById('conv-resultado').style.display = 'none';
  openModal('mod-convite');
}

async function gerarConvite() {
  var nome = document.getElementById('conv-nome').value.trim();
  if (!nome) { toast('Digite o nome do aluno!'); return; }

  // Gera codigo unico: FM-INICIAIS-RANDOM
  var initials = nome.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 3);
  var random = Math.random().toString(36).substring(2, 6).toUpperCase();
  var code = 'FM-' + initials + '-' + random;

  var err = await criarConvite(code);
  if (err) { toast('Erro ao gerar convite!'); return; }

  document.getElementById('conv-code').textContent = code;
  document.getElementById('conv-resultado').style.display = 'block';
}

function copiarConvite() {
  var code = document.getElementById('conv-code').textContent;
  navigator.clipboard.writeText(code).then(function() {
    toast('Codigo copiado! ' + code);
  });
}
