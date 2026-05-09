// FISCHER METHOD -- dash.js
var _dashLoading = false;

function renderDash() {
  var el = document.getElementById('pg-dash');
  if (!el) return;
  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = currentProfile ? currentProfile.name.split(' ')[0] : 'Matheus';
  var now = new Date();
  var days = ['Domingo','Segunda-feira','Terca-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sabado'];
  var months = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var todayStr = days[now.getDay()] + ', ' + now.getDate() + ' de ' + months[now.getMonth()];

  el.innerHTML =
    '<div class="top-bar">' +
      '<div>' +
        '<div style="font-size:12px;color:var(--muted);">' + greeting + ', <span style="color:var(--green-pale);font-weight:600;">' + nome + '</span></div>' +
        '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:-0.02em;">Dashboard</div>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm" onclick="openGerarConvite()">+ Convite</button>' +
    '</div>' +
    '<div id="dash-content" style="padding:0 20px 20px;">' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:16px;">' + todayStr + '</div>' +
      '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  setTimeout(function() { loadDashData(); }, 150);
}

async function loadDashData() {
  if (_dashLoading) return;
  _dashLoading = true;
  var el = document.getElementById('dash-content');
  if (!el) { _dashLoading = false; return; }

  try {
    var alunos = await getTodosAlunos();
    var total = alunos.length;
    var today = new Date().toISOString().split('T')[0];

    var resExec = await sb.from('execucoes').select('*').eq('data', today).eq('concluido', true);
    var treinaram = resExec.data || [];

    var d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    var resFeed = await sb.from('feedbacks')
      .select('*, profiles(name)')
      .gte('created_at', d7.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    var feedbacks = resFeed.data || [];

    var now = new Date();
    var days = ['Domingo','Segunda-feira','Terca-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sabado'];
    var months = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var todayStr = days[now.getDay()] + ', ' + now.getDate() + ' de ' + months[now.getMonth()];

    var html = '<div style="font-size:12px;color:var(--muted);margin-bottom:16px;">' + todayStr + '</div>';

    // STATS
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">';
    html += mkStat(String(total), 'Alunos', false);
    html += mkStat(String(treinaram.length), 'Treinaram hoje', true);
    html += mkStat(String(feedbacks.length), 'Feedbacks 7d', false);
    html += '</div>';

    // TREINARAM HOJE
    html += '<div class="card mb">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Treinaram hoje</div>';
    html += '<span class="badge badge-green">' + treinaram.length + '/' + total + '</span>';
    html += '</div>';
    if (!treinaram.length) {
      html += '<div style="text-align:center;padding:12px 0;color:var(--muted);font-size:12px;">Nenhum treino concluido hoje</div>';
    } else {
      treinaram.forEach(function(e) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline);">';
        html += '<div style="width:32px;height:32px;border-radius:50%;background:var(--surf-high);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:14px;">&#x1F4AA;</div>';
        html += '<div style="flex:1;font-size:13px;font-weight:600;">Aluno</div>';
        html += '<span class="badge badge-green">&#x2713; OK</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    // ALUNOS
    if (total > 0) {
      html += '<div class="card mb">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
      html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Meus alunos</div>';
      html += '<button class="btn btn-ghost btn-xs" onclick="go(\'alunos\')">Ver todos</button>';
      html += '</div>';
      alunos.slice(0,4).forEach(function(a) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline);cursor:pointer;" onclick="go(\'alunos\')">';
        html += avatarHTML(a, 'av-sm');
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (a.name || 'Aluno') + '</div>';
        html += '<div style="font-size:11px;color:var(--muted);">' + (a.objetivo || 'Sem objetivo') + '</div>';
        html += '</div>';
        html += '<div style="font-size:18px;color:var(--muted);">&#x203A;</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // FEEDBACKS
    html += '<div class="card mb">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Feedbacks recentes</div>';
    if (!feedbacks.length) {
      html += '<div style="text-align:center;padding:12px 0;color:var(--muted);font-size:12px;">Nenhum feedback ainda</div>';
    } else {
      feedbacks.forEach(function(f) {
        var p = f.profiles || {};
        var intColor = f.intensidade === 'intenso' ? 'var(--red)' : f.intensidade === 'moderado' ? 'var(--gold)' : 'var(--green-pale)';
        html += '<div style="padding:10px 0;border-bottom:1px solid var(--outline);">';
        html += '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">';
        html += '<div style="font-size:13px;font-weight:600;">' + (p.name || 'Aluno') + '</div>';
        html += '<span style="font-size:11px;font-weight:700;color:' + intColor + ';">' + (f.intensidade || '') + '</span>';
        html += '</div>';
        if (f.comentario) html += '<div style="font-size:12px;color:var(--muted);">"' + f.comentario + '"</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    // ACOES RAPIDAS
    html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Atalhos</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">';
    html += mkAction('&#x1F465;', 'Ver alunos', "go('alunos')");
    html += mkAction('&#x1F3CB;&#xFE0F;', 'Exercicios', "go('exercicios')");
    html += mkAction('&#x1F511;', 'Gerar convite', 'openGerarConvite()');
    html += mkAction('&#x1F464;', 'Meu perfil', "go('perfil')");
    html += '</div>';

    el.innerHTML = html;

  } catch(err) {
    console.error('Dash error:', err);
    var el2 = document.getElementById('dash-content');
    if (el2) el2.innerHTML = '<div class="empty"><div class="empty-ico">&#x26A0;</div><p>Erro ao carregar.<br><button class="btn btn-ghost btn-sm" onclick="loadDashData()">Tentar novamente</button></p></div>';
  } finally {
    _dashLoading = false;
  }
}

function mkStat(val, lbl, green) {
  return '<div class="card' + (green ? ' card-green' : '') + '" style="padding:14px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:26px;font-weight:700;line-height:1;' + (green ? 'color:var(--green-pale);' : '') + '">' + val + '</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.05em;">' + lbl + '</div>' +
    '</div>';
}

function mkAction(ico, lbl, action) {
  return '<button onclick="' + action + '" style="background:var(--surf-mid);border:1px solid var(--outline);border-radius:var(--r);padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;width:100%;transition:border-color .15s;">' +
    '<div style="font-size:26px;">' + ico + '</div>' +
    '<div style="font-size:12px;font-weight:600;color:var(--white);">' + lbl + '</div>' +
    '</button>';
}

// GERAR CONVITE
function openGerarConvite() {
  var existing = document.getElementById('mod-convite');
  if (existing) { existing.remove(); }

  var m = document.createElement('div');
  m.className = 'mov';
  m.id = 'mod-convite';
  m.innerHTML =
    '<div class="mod">' +
      '<div class="mod-handle"></div>' +
      '<h3>Gerar Convite</h3>' +
      '<div class="fg">' +
        '<label>Nome do aluno</label>' +
        '<input type="text" id="conv-nome" placeholder="Ex: Ana Silva">' +
      '</div>' +
      '<div id="conv-resultado" style="display:none;background:var(--surf-high);border:1px solid var(--green-border);border-radius:var(--rs);padding:16px;text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:11px;color:var(--muted);margin-bottom:6px;">Codigo gerado</div>' +
        '<div id="conv-code" style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--green-pale);letter-spacing:.12em;"></div>' +
        '<button class="btn btn-ghost btn-sm" style="margin-top:10px;" onclick="copiarConvite()">Copiar codigo</button>' +
      '</div>' +
      '<div class="mod-actions">' +
        '<button class="btn btn-ghost" onclick="closeModal(\'mod-convite\')">Fechar</button>' +
        '<button class="btn btn-primary" onclick="gerarConvite()">Gerar</button>' +
      '</div>' +
    '</div>';
  m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
  document.body.appendChild(m);

  document.getElementById('conv-nome').value = '';
  document.getElementById('conv-resultado').style.display = 'none';
  openModal('mod-convite');
}

async function gerarConvite() {
  var nome = document.getElementById('conv-nome').value.trim();
  if (!nome) { toast('Digite o nome do aluno!'); return; }
  var initials = nome.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 3);
  var random = Math.random().toString(36).substring(2, 6).toUpperCase();
  var code = 'FM-' + initials + '-' + random;
  var err = await criarConviteNome(code, nome);
  if (err) { toast('Erro ao gerar convite!'); console.error(err); return; }
  document.getElementById('conv-code').textContent = code;
  document.getElementById('conv-resultado').style.display = 'block';
  if (alunosTab === 'convites') loadAlunosTab();
}

function copiarConvite() {
  var code = document.getElementById('conv-code').textContent;
  navigator.clipboard.writeText(code).then(function() { toast('Copiado: ' + code); });
}
