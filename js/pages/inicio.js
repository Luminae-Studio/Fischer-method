// FISCHER METHOD -- inicio.js
var _inicioLoading = false;

function renderInicio() {
  var el = document.getElementById('pg-inicio');
  if (!el) return;

  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  var nome = currentProfile ? currentProfile.name.split(' ')[0] : '';

  el.innerHTML =
    '<div class="top-bar">' +
      '<div>' +
        '<div style="font-size:12px;color:var(--muted);">' + greeting + ', <span style="color:var(--green-pale);font-weight:600;">' + nome + '</span></div>' +
        '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:-0.02em;">Inicio</div>' +
      '</div>' +
      avatarHTML(currentProfile, 'av-sm') +
    '</div>' +
    '<div id="inicio-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  loadInicioData();
}

async function loadInicioData() {
  if (_inicioLoading) return;
  _inicioLoading = true;
  try {
    var uid = currentUser.id;

    var treinos = await getTreinosAluno(uid);
    var resEx = await sb.from('execucoes')
      .select('data')
      .eq('aluno_id', uid)
      .eq('concluido', true)
      .order('data', { ascending: false });
    var execucoes = resEx.data || [];

    var el = document.getElementById('inicio-content');
    if (!el) return;

    // Treino do dia
    var now = new Date();
    var days = ['Domingo','Segunda','Terca','Quarta','Quinta','Sexta','Sabado'];
    var months = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var todayName = days[now.getDay()];
    var treinoHoje = treinos.filter(function(t) {
      return t.dia_semana === todayName || t.dia_semana === 'Qualquer dia';
    });

    // Stats
    var streak = calcStreak(execucoes);
    var ultimaData = execucoes[0] ? execucoes[0].data : null;

    // Status dinamico
    var statusDiff = ultimaData
      ? Math.floor((new Date() - new Date(ultimaData + 'T12:00:00')) / 86400000)
      : 999;
    var status = statusDiff <= 2 ? 'ativo' : statusDiff === 3 ? 'pausa' : 'inativo';
    var statusMap = {
      ativo:   { label: 'Ativo',    color: 'var(--green-pale)', bg: 'rgba(45,106,45,0.15)' },
      pausa:   { label: 'Em pausa', color: 'var(--gold)',       bg: 'rgba(201,168,76,0.15)' },
      inativo: { label: 'Inativo',  color: 'var(--red)',        bg: 'rgba(224,85,85,0.15)' }
    };
    var si = statusMap[status];

    var html = '';

    // ── HERO ───────────────────────────────────────
    html += '<div class="hero-banner" style="margin:0 0 16px;">';
    html += '<div class="hero-banner-eyebrow">' + todayName + ' &middot; ' + now.getDate() + ' de ' + months[now.getMonth()] + '</div>';
    html += '<div class="hero-banner-name">' + (currentProfile ? currentProfile.name.split(' ')[0] : '') + '</div>';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-top:10px;">';
    html += '<span style="font-size:11px;font-weight:700;color:' + si.color + ';background:' + si.bg + ';border:1px solid ' + si.color + ';padding:3px 10px;border-radius:99px;">' + si.label + '</span>';
    if (ultimaData) {
      var diff0 = Math.floor((new Date() - new Date(ultimaData + 'T12:00:00')) / 86400000);
      var diffLabel = diff0 === 0 ? 'Treinou hoje' : diff0 === 1 ? 'Treinou ontem' : 'Ha ' + diff0 + ' dias';
      html += '<span style="font-size:11px;color:var(--muted);">' + diffLabel + '</span>';
    }
    html += '</div>';
    html += '</div>';

    // ── STATS ──────────────────────────────────────
    html += '<div class="stats-row" style="padding:0;margin-bottom:16px;">';
    html += mkIniStat(streak > 0 ? streak + ' &#x1F525;' : '0', 'Sequencia', streak > 0);
    html += mkIniStat(String(execucoes.length), 'Sessoes', false);
    html += mkIniStat(String(treinos.length), treinos.length === 1 ? 'Treino' : 'Treinos', false);
    html += '</div>';

    // ── TREINO DE HOJE ─────────────────────────────
    html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Treino de hoje</div>';

    if (!treinoHoje.length) {
      html += '<div class="card mb" style="text-align:center;padding:22px;">';
      if (!treinos.length) {
        html += '<div style="font-size:24px;margin-bottom:10px;">&#x1F4CB;</div>';
        html += '<div style="font-size:13px;font-weight:600;margin-bottom:4px;">Sem treino configurado</div>';
        html += '<div style="font-size:12px;color:var(--muted);">Aguarde o Matheus montar seu plano.</div>';
      } else {
        html += '<div style="font-size:28px;margin-bottom:10px;">&#x1F634;</div>';
        html += '<div style="font-size:14px;font-weight:700;margin-bottom:4px;">Dia de descanso</div>';
        html += '<div style="font-size:12px;color:var(--muted);">Recuperacao tambem e treino. &#x1F4AA;</div>';
      }
      html += '</div>';
    } else {
      treinoHoje.forEach(function(t) {
        html +=
          '<div class="card card-green mb" style="cursor:pointer;" onclick="abrirTreinoModal(\'' + t.id + '\')">' +
            '<div style="display:flex;align-items:center;gap:14px;">' +
              '<div style="width:48px;height:48px;border-radius:var(--rs);background:var(--green);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">&#x1F4AA;</div>' +
              '<div style="flex:1;">' +
                '<div style="font-family:var(--font-display);font-size:17px;font-weight:700;">' + t.nome + '</div>' +
                '<div style="font-size:11px;color:var(--green-pale);margin-top:2px;">' + (t.dia_semana || 'Qualquer dia') + ' &middot; Toque para iniciar</div>' +
              '</div>' +
              '<div style="font-size:24px;color:var(--green-pale);">&#x25B6;</div>' +
            '</div>' +
          '</div>';
      });
    }

    // ── OUTROS TREINOS (nao sao de hoje) ───────────
    var restantes = treinos.filter(function(t) { return treinoHoje.indexOf(t) === -1; });
    if (restantes.length) {
      html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;margin-top:6px;">Outros treinos</div>';
      restantes.forEach(function(t) {
        html +=
          '<div class="card mb" style="cursor:pointer;display:flex;align-items:center;gap:12px;" onclick="abrirTreinoModal(\'' + t.id + '\')">' +
            '<div style="width:40px;height:40px;border-radius:var(--rs);background:var(--surf-high);border:1px solid var(--outline);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">&#x1F4AA;</div>' +
            '<div style="flex:1;">' +
              '<div style="font-size:14px;font-weight:600;">' + t.nome + '</div>' +
              '<div style="font-size:11px;color:var(--muted);">' + (t.dia_semana || 'Qualquer dia') + '</div>' +
            '</div>' +
            '<div style="font-size:18px;color:var(--muted);">&#x203A;</div>' +
          '</div>';
      });
    }

    el.innerHTML = html;

  } catch(err) {
    console.error('loadInicioData:', err);
    var el2 = document.getElementById('inicio-content');
    if (el2) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadInicioData()">Tentar novamente</button></p></div>';
  } finally {
    _inicioLoading = false;
  }
}

function mkIniStat(val, lbl, green) {
  return '<div class="stat-box' + (green ? ' green' : '') + '">' +
    '<div class="stat-val' + (green ? ' green' : '') + '">' + val + '</div>' +
    '<div class="stat-lbl">' + lbl + '</div>' +
    '</div>';
}
