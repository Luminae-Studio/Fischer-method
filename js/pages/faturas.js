// FISCHER METHOD -- faturas.js  (área do aluno — ver plano e histórico)
var _faturasLoading = false;

function renderFaturas() {
  _faturasLoading = false;
  var el = document.getElementById('pg-faturas');
  if (!el) return;

  el.innerHTML =
    '<div class="top-bar">' +
      '<button class="btn btn-ghost btn-sm" onclick="go(\'inicio\')">&#x2190; Voltar</button>' +
      '<div class="top-bar-title">Meu Plano</div>' +
    '</div>' +
    '<div id="faturas-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';

  loadFaturasData();
}

async function loadFaturasData() {
  if (_faturasLoading) return;
  _faturasLoading = true;
  var el = document.getElementById('faturas-content');
  if (!el) { _faturasLoading = false; return; }
  try {
    var planoAtivo = await getPlanoAtual();
    if (!el.isConnected) return;
    var historico = await getHistoricoPlanos(currentUser.id);
    if (!el.isConnected) return;

    var html = '';

    if (!planoAtivo) {
      html +=
        '<div class="empty">' +
          '<div class="empty-ico">&#x1F4B3;</div>' +
          '<p>Nenhum plano cadastrado ainda.<br>' +
          '<span style="font-size:12px;color:var(--muted);">Entre em contato com o Matheus.</span></p>' +
        '</div>';
    } else {
      html += _mkPlanoCard(planoAtivo);
    }

    var anteriores = historico.filter(function(p) {
      return !planoAtivo || p.id !== planoAtivo.id;
    });
    if (anteriores.length) {
      html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:20px 0 10px;">Historico</div>';
      html += '<div class="card">';
      anteriores.forEach(function(p) {
        var mi = _planoModalidadeInfo(p.modalidade);
        html +=
          '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--outline);">' +
            '<div style="flex:1;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">' +
                '<span style="font-size:11px;font-weight:700;color:' + mi.color + ';">' + mi.label + '</span>' +
                '<span class="badge badge-muted">' + _planoPeriodoLabel(p.periodo) + '</span>' +
                (p.valor ? '<span style="font-size:10px;color:var(--green-pale);">R$ ' + Number(p.valor).toFixed(2).replace('.', ',') + '</span>' : '') +
              '</div>' +
              '<div style="font-size:11px;color:var(--muted);">' + fmtDate(p.data_inicio) + ' → ' + fmtDate(p.data_vencimento) + '</div>' +
            '</div>' +
            _planoStatusBadge(p.status) +
          '</div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;
  } catch(err) {
    console.error('loadFaturasData:', err);
    if (el.isConnected) {
      el.innerHTML =
        '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
        '<p>Erro ao carregar.<br>' +
        '<button class="btn btn-ghost btn-sm" onclick="loadFaturasData()">Tentar novamente</button></p></div>';
    }
  } finally {
    _faturasLoading = false;
  }
}

// ── CARD DE PLANO (shared — usado tb em aluno_detalhe) ───────────────
function _mkPlanoCard(p) {
  var mi = _planoModalidadeInfo(p.modalidade);
  var hoje   = new Date();
  var inicio = new Date(p.data_inicio + 'T12:00:00');
  var venc   = new Date(p.data_vencimento + 'T12:00:00');
  var totalDias    = Math.max(1, Math.round((venc - inicio) / 86400000));
  var passados     = Math.round((hoje - inicio) / 86400000);
  var pct          = Math.min(100, Math.max(0, Math.round((passados / totalDias) * 100)));
  var diasRestantes = Math.round((venc - hoje) / 86400000);
  var vencido      = diasRestantes < 0;
  var barColor     = vencido ? 'var(--red)' : diasRestantes <= 7 ? 'var(--gold)' : 'var(--green)';

  var html = '<div class="card mb">';

  // Header
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Plano atual</div>';
  html += _planoStatusBadge(p.status);
  html += '</div>';

  // Badges
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">';
  html += '<span style="font-size:12px;font-weight:700;color:' + mi.color + ';background:' + mi.bg + ';border:1px solid ' + mi.color + ';padding:4px 12px;border-radius:99px;">' + mi.label + '</span>';
  html += '<span class="badge badge-muted">' + _planoPeriodoLabel(p.periodo) + '</span>';
  if (p.valor) html += '<span class="badge badge-green">R$ ' + Number(p.valor).toFixed(2).replace('.', ',') + '</span>';
  html += '</div>';

  // Datas
  html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:8px;">';
  html += '<span>Inicio: <strong style="color:var(--white);">' + fmtDate(p.data_inicio) + '</strong></span>';
  html += '<span>Vencimento: <strong style="color:var(--white);">' + fmtDate(p.data_vencimento) + '</strong></span>';
  html += '</div>';

  // Barra de progresso
  html += '<div style="background:var(--surf-high);border-radius:99px;height:8px;margin-bottom:6px;overflow:hidden;">';
  html += '<div style="height:8px;width:' + pct + '%;background:' + barColor + ';border-radius:99px;"></div>';
  html += '</div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:' + (vencido || diasRestantes <= 7 ? '12' : '4') + 'px;">';
  html += '<span>' + pct + '% do periodo</span>';
  html += '<span>' + (vencido ? 'Vencido' : diasRestantes === 0 ? 'Vence hoje' : diasRestantes + ' dias restantes') + '</span>';
  html += '</div>';

  // Avisos
  if (vencido) {
    html += '<div style="background:rgba(224,85,85,0.12);border:1px solid var(--red);border-radius:var(--rs);padding:10px 14px;font-size:12px;color:var(--red);font-weight:600;">&#x26A0; Plano vencido! Entre em contato com o Matheus para renovar.</div>';
  } else if (diasRestantes <= 7) {
    html += '<div style="background:rgba(201,168,76,0.12);border:1px solid var(--gold);border-radius:var(--rs);padding:10px 14px;font-size:12px;color:var(--gold);font-weight:600;">&#x23F0; Vence em ' + diasRestantes + ' dia' + (diasRestantes !== 1 ? 's' : '') + '! Renove com o Matheus.</div>';
  }

  if (p.observacoes) {
    html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--outline);font-size:12px;color:var(--muted);line-height:1.6;">' + p.observacoes + '</div>';
  }

  html += '</div>';
  return html;
}

// ── HELPERS DE PLANO (globais — usados em aluno_detalhe também) ──────
function _planoModalidadeInfo(m) {
  if (m === 'online')  return { label: 'Online',     color: '#3b82f6',         bg: 'rgba(59,130,246,0.12)'  };
  if (m === 'hibrido') return { label: 'Hibrido',    color: '#a855f7',         bg: 'rgba(168,85,247,0.12)'  };
  return                      { label: 'Presencial', color: 'var(--green-pale)', bg: 'var(--green-glow)' };
}

function _planoPeriodoLabel(p) {
  return { mensal:'Mensal', trimestral:'Trimestral', semestral:'Semestral', dupla:'Dupla' }[p] || p || '--';
}

function _planoStatusBadge(s) {
  if (s === 'ativo')   return '<span class="badge badge-green">&#x2713; Ativo</span>';
  if (s === 'vencido') return '<span style="font-size:11px;font-weight:700;color:var(--red);background:rgba(224,85,85,0.12);border:1px solid rgba(224,85,85,0.3);padding:3px 10px;border-radius:99px;">Vencido</span>';
  return '<span class="badge badge-muted">Pendente</span>';
}
