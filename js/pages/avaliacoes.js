// FISCHER METHOD -- avaliacoes.js (área do aluno)
var _avAlunoLoading = false;

function renderAvaliacoesAluno() {
  _avAlunoLoading = false;
  var el = document.getElementById('pg-avaliacoes');
  if (!el) return;
  el.innerHTML =
    '<div class="top-bar">' +
      '<button class="btn btn-ghost btn-sm" onclick="go(\'inicio\')">&#x2190; Voltar</button>' +
      '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;letter-spacing:-.02em;">Avaliações</div>' +
    '</div>' +
    '<div id="avaliacoes-aluno-content" style="padding:0 20px 20px;">' +
      '<div style="text-align:center;padding:40px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
    '</div>';
  loadAvaliacoesAlunoData();
}

async function loadAvaliacoesAlunoData() {
  if (_avAlunoLoading) return;
  _avAlunoLoading = true;
  var el = document.getElementById('avaliacoes-aluno-content');
  if (!el) { _avAlunoLoading = false; return; }
  try {
    var res = await sb.from('avaliacoes')
      .select('*')
      .eq('aluno_id', currentUser.id)
      .order('data', { ascending: false });
    if (!el.isConnected) return;
    var avs = res.data || [];

    var html = '';

    // ── PRÓXIMA AVALIAÇÃO ─────────────────────────
    html += '<div class="card mb">';
    html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:10px;">Próxima avaliação</div>';

    if (avs.length) {
      var ultima   = new Date(avs[0].data + 'T12:00:00');
      var proxima  = new Date(ultima);
      proxima.setDate(proxima.getDate() + 30);
      var hoje     = new Date();
      var diasRest = Math.max(0, Math.ceil((proxima - hoje) / 86400000));
      var pct      = Math.min(100, Math.max(0, Math.round(((hoje - ultima) / (proxima - ultima)) * 100)));
      var barColor = diasRest === 0 ? 'var(--green-pale)' : pct > 80 ? 'var(--gold)' : 'var(--green)';

      html +=
        '<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">' +
          (diasRest === 0
            ? '<span style="color:var(--green-pale);font-weight:700;">Já está na hora! 🎯</span>'
            : 'Sugerida em <strong style="color:var(--white);">' + diasRest + ' ' + (diasRest === 1 ? 'dia' : 'dias') + '</strong>'
          ) +
        '</div>' +
        '<div style="height:6px;background:var(--outline);border-radius:3px;margin-bottom:14px;">' +
          '<div style="height:6px;background:' + barColor + ';border-radius:3px;width:' + pct + '%;"></div>' +
        '</div>';
    } else {
      html += '<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Nenhuma avaliação registrada ainda.</div>';
    }

    html += '<button class="btn btn-primary btn-full btn-sm" onclick="solicitarAvaliacao()">Solicitar avaliação</button>';
    html += '</div>';

    // ── HISTÓRICO ─────────────────────────────────
    if (!avs.length) {
      html += '<div class="empty"><div class="empty-ico">&#x1F4CB;</div><p>Nenhuma avaliação registrada ainda.</p></div>';
    } else {
      html += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Histórico (' + avs.length + ')</div>';
      avs.forEach(function(av, idx) {
        var dtLabel = new Date(av.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        var badges = [];
        if (av.peso)        badges.push(av.peso + ' kg');
        if (av.altura)      badges.push(av.altura + ' cm');
        if (av.imc)         badges.push('IMC ' + av.imc);
        if (av.gordura_pct) badges.push(av.gordura_pct + '% gord.');
        if (av.pressao)     badges.push(av.pressao);

        html += '<div class="card mb" style="cursor:pointer;" onclick="avAlunoToggle(' + idx + ')">';
        html +=
          '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<div>' +
              '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">' + dtLabel + '</div>';
        if (badges.length) {
          html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
          badges.forEach(function(b) {
            html += '<span style="font-size:10px;color:var(--green-pale);background:var(--green-glow);border:1px solid var(--green-border);padding:2px 8px;border-radius:99px;">' + b + '</span>';
          });
          html += '</div>';
        }
        html +=
            '</div>' +
            '<span style="font-size:18px;color:var(--muted);transition:transform .2s;" id="avdet-arrow-' + idx + '">&#x203A;</span>' +
          '</div>';

        // Detalhes (accordion)
        html += '<div id="avdet-' + idx + '" style="display:none;margin-top:14px;border-top:1px solid var(--outline);padding-top:14px;">';

        // Dados básicos
        var temBasico = av.peso || av.altura || av.imc || av.gordura_pct || av.pressao || av.cin_quad;
        if (temBasico) {
          html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dados básicos</div>';
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
          if (av.peso)   html += mkMedida(av.peso + ' kg', 'Peso');
          if (av.altura) html += mkMedida(av.altura + ' cm', 'Altura');
          if (av.imc) {
            var imcCls = av.imc < 18.5 ? 'Abaixo' : av.imc < 25 ? 'Normal' : av.imc < 30 ? 'Sobrepeso' : 'Obeso';
            var imcClr = av.imc < 25 ? 'var(--green-pale)' : av.imc < 30 ? 'var(--gold)' : 'var(--red)';
            html += mkMedidaColor(String(av.imc), 'IMC · ' + imcCls, imcClr);
          }
          if (av.pressao) {
            var pp = av.pressao.split('/');
            var pClr = 'var(--muted)', pCls = '';
            if (pp.length === 2) {
              var s2 = parseInt(pp[0]), d2 = parseInt(pp[1]);
              pCls = (s2 < 120 && d2 < 80) ? 'Normal' : (s2 < 130 && d2 < 80) ? 'Elevada' : (s2 < 140 || d2 < 90) ? 'Hiper I' : 'Hiper II';
              pClr = pCls === 'Normal' ? 'var(--green-pale)' : pCls === 'Elevada' ? 'var(--gold)' : 'var(--red)';
            }
            html += mkMedidaColor(av.pressao, 'Pressão' + (pCls ? ' · ' + pCls : ''), pClr);
          }
          if (av.gordura_pct) html += mkMedida(av.gordura_pct + '%', '% Gordura');
          if (av.cin_quad)    html += mkMedida(String(av.cin_quad), 'Cin/Quad');
          html += '</div>';
        }

        // Circunferências
        var circDados = [
          { key: 'peito', label: 'Peito' }, { key: 'bunda', label: 'Bunda' },
          { key: 'coxa_d', label: 'Coxa Dir.' }, { key: 'coxa_e', label: 'Coxa Esq.' },
          { key: 'braco_d', label: 'Braço Dir.' }, { key: 'braco_e', label: 'Braço Esq.' },
          { key: 'panturrilha', label: 'Panturrilha' }, { key: 'abdomen', label: 'Abdômen' }
        ];
        var temCirc = circDados.some(function(c) { return av[c.key]; });
        if (temCirc) {
          html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Circunferências (cm)</div>';
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
          circDados.forEach(function(c) { if (av[c.key]) html += mkMedida(av[c.key] + ' cm', c.label); });
          html += '</div>';
        }

        // Dobras cutâneas
        var dobrasDados = [
          { key: 'dobra_tricipital', label: 'Tricipital' }, { key: 'dobra_subescapular', label: 'Subescap.' },
          { key: 'dobra_suprailiaca', label: 'Suprailiaca' }, { key: 'dobra_abdominal', label: 'Abdominal' },
          { key: 'dobra_coxa', label: 'Coxa' }, { key: 'dobra_panturrilha', label: 'Panturrilha' }
        ];
        var temDobras = dobrasDados.some(function(d) { return av[d.key]; });
        if (temDobras) {
          html += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dobras cutâneas (mm)</div>';
          html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">';
          dobrasDados.forEach(function(d) { if (av[d.key]) html += mkMedida(av[d.key] + ' mm', d.label); });
          html += '</div>';
        }

        if (av.objetivo) {
          html +=
            '<div style="margin-bottom:8px;">' +
              '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Objetivo</div>' +
              '<div style="font-size:13px;color:var(--white);">' + av.objetivo + '</div>' +
            '</div>';
        }
        if (av.obs) {
          html +=
            '<div>' +
              '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Observações</div>' +
              '<div style="font-size:13px;color:var(--white);line-height:1.6;">' + av.obs + '</div>' +
            '</div>';
        }

        html += '</div>'; // fecha avdet
        html += '</div>'; // fecha card
      });
    }

    el.innerHTML = html;

  } catch(err) {
    console.error('loadAvaliacoesAlunoData:', err);
    var el2 = document.getElementById('avaliacoes-aluno-content');
    if (el2 && el2.isConnected) el2.innerHTML =
      '<div class="empty"><div class="empty-ico">&#x26A0;</div>' +
      '<p>Erro ao carregar.<br>' +
      '<button class="btn btn-ghost btn-sm" onclick="loadAvaliacoesAlunoData()">Tentar novamente</button></p></div>';
  } finally {
    _avAlunoLoading = false;
  }
}

function avAlunoToggle(idx) {
  var det   = document.getElementById('avdet-' + idx);
  var arrow = document.getElementById('avdet-arrow-' + idx);
  if (!det) return;
  var isOpen = det.style.display !== 'none';
  det.style.display  = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
}

async function solicitarAvaliacao() {
  if (!currentUser) return;
  var res = await sb.from('notas_aluno').insert({
    aluno_id: currentUser.id,
    tipo: 'meta',
    texto: 'Aluno solicitou agendamento de avaliação'
  });
  if (res.error) { toast('Erro ao enviar solicitação!'); console.error(res.error); return; }
  toast('Solicitação enviada ao Matheus! ✅');
}
