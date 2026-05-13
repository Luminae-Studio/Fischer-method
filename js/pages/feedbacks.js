// FISCHER METHOD -- feedbacks.js (área do aluno)
var _feedbacksLoading = false;

function renderFeedbacks() {
  _feedbacksLoading = false;
  var el = document.getElementById('pg-feedbacks');
  if (!el) return;
  el.innerHTML =
    '<div class="top-bar">' +
      '<button class="btn btn-ghost btn-sm" onclick="go(\'inicio\')">&#x2190; Voltar</button>' +
      '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;letter-spacing:-.02em;">Feedbacks</div>' +
    '</div>' +
    '<div id="feedbacks-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';
  loadFeedbacksData();
}

async function loadFeedbacksData() {
  if (_feedbacksLoading) return;
  _feedbacksLoading = true;
  var el = document.getElementById('feedbacks-content');
  if (!el) { _feedbacksLoading = false; return; }
  try {
    var feedbacks = await getFeedbacksAluno(currentUser.id);
    if (!el.isConnected) return;

    if (!feedbacks.length) {
      el.innerHTML =
        '<div class="empty">' +
          '<div class="empty-ico">&#x1F4AC;</div>' +
          '<p>Nenhum feedback ainda.<br>' +
          '<span style="font-size:12px;color:var(--muted);">Complete um treino para enviar seu primeiro feedback!</span></p>' +
        '</div>';
      return;
    }

    var html = '';
    feedbacks.forEach(function(f) {
      var dt    = new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      var nomeT = f.execucoes && f.execucoes.treinos ? f.execucoes.treinos.nome : 'Treino';
      var ii    = _fbIntInfo(f.intensidade);
      var ci    = _fbCorpoInfo(f.corpo);

      html += '<div class="card mb">';
      // Cabeçalho: nome treino + data
      html +=
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">' +
          '<div>' +
            '<div style="font-size:13px;font-weight:700;">' + nomeT + '</div>' +
            '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' + dt + '</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">' +
            '<span style="font-size:10px;font-weight:700;color:' + ii.color + ';background:' + ii.bg + ';border:1px solid ' + ii.color + ';padding:2px 8px;border-radius:99px;white-space:nowrap;">' + ii.label + '</span>' +
            '<span style="font-size:10px;font-weight:700;color:' + ci.color + ';background:' + ci.bg + ';border:1px solid ' + ci.color + ';padding:2px 8px;border-radius:99px;white-space:nowrap;">' + ci.label + '</span>' +
          '</div>' +
        '</div>';

      // Comentário do aluno
      if (f.comentario) {
        html +=
          '<div style="font-size:12px;color:var(--white);background:var(--surf-high);border-radius:var(--rs);' +
          'padding:10px;margin-bottom:10px;line-height:1.6;">' + f.comentario + '</div>';
      }

      // Resposta do personal
      if (f.resposta_personal) {
        var dtResp = f.respondido_em
          ? new Date(f.respondido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          : '';
        html +=
          '<div style="background:var(--green-glow);border:1px solid var(--green-border);border-radius:var(--rs);padding:10px;">' +
            '<div style="font-size:10px;font-weight:700;color:var(--green-pale);margin-bottom:4px;">' +
              'Matheus' + (dtResp ? ' · ' + dtResp : '') +
            '</div>' +
            '<div style="font-size:12px;color:var(--white);line-height:1.6;">' + f.resposta_personal + '</div>' +
          '</div>';
      } else {
        html += '<div style="font-size:11px;color:var(--faint);font-style:italic;">Aguardando resposta...</div>';
      }

      html += '</div>';
    });

    el.innerHTML = html;

  } catch(err) {
    console.error('loadFeedbacksData:', err);
    var el2 = document.getElementById('feedbacks-content');
    if (el2 && el2.isConnected) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadFeedbacksData()">Tentar novamente</button></p></div>';
  } finally {
    _feedbacksLoading = false;
  }
}

// ── HELPERS DE BADGE (usados também em dash.js) ───
function _fbIntInfo(v) {
  var map = {
    leve:       { label: '😌 Leve',        color: '#4aa8d8',           bg: 'rgba(74,168,216,0.12)'  },
    moderado:   { label: '💪 Moderado',    color: 'var(--green-pale)', bg: 'var(--green-glow)'       },
    dificil:    { label: '🔥 Difícil',    color: '#e07c3a',           bg: 'rgba(224,124,58,0.12)'  },
    impossivel: { label: '💀 Impossível', color: 'var(--red)',        bg: 'rgba(224,85,85,0.12)'   }
  };
  return map[v] || { label: v || '—', color: 'var(--muted)', bg: 'var(--surf-high)' };
}

function _fbCorpoInfo(v) {
  var map = {
    sem_dores:    { label: '✅ Sem dores',     color: 'var(--green-pale)', bg: 'var(--green-glow)'      },
    dores_leves:  { label: '⚠️ Dores leves',  color: 'var(--gold)',       bg: 'rgba(201,168,76,0.12)'  },
    dores_fortes: { label: '🆘 Dores fortes',  color: 'var(--red)',        bg: 'rgba(224,85,85,0.12)'   }
  };
  return map[v] || { label: v || '—', color: 'var(--muted)', bg: 'var(--surf-high)' };
}
