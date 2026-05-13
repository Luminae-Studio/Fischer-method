// FISCHER METHOD -- avaliacoes.js (área do aluno)
var _avAlunoLoading = false;
var _anamneseAtual  = null;

// ── ENTRY ─────────────────────────────────────────
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

// ── CARGA DE DADOS ────────────────────────────────
async function loadAvaliacoesAlunoData() {
  if (_avAlunoLoading) return;
  _avAlunoLoading = true;
  var el = document.getElementById('avaliacoes-aluno-content');
  if (!el) { _avAlunoLoading = false; return; }
  try {
    var uid = currentUser.id;
    var results = await Promise.all([
      getAnamnese(uid),
      sb.from('avaliacoes').select('*').eq('aluno_id', uid).order('data', { ascending: false })
    ]);
    if (!el.isConnected) return;
    _anamneseAtual = results[0];
    var avs = (results[1].data) || [];
    el.innerHTML = _mkAnamneseSection(_anamneseAtual) + _mkAvaliacoesSection(avs);
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

// ── SECAO ANAMNESE ────────────────────────────────
function _mkAnamneseSection(a) {
  var h = '<div class="card mb">';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">';
  h += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Ficha de Saúde</div>';
  if (a && a.atualizado_em) {
    var dt = new Date(a.atualizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    h += '<span style="font-size:10px;color:var(--muted);">Atualizado ' + dt + '</span>';
  }
  h += '</div>';

  if (!a) {
    h += '<div style="font-size:13px;color:var(--muted);margin-bottom:14px;">Sua ficha de saúde ainda não foi preenchida. Isso nos ajuda a montar treinos mais seguros para você.</div>';
    h += '<button class="btn btn-primary btn-full btn-sm" onclick="abrirFormAnamnese()">Preencher agora</button>';
  } else if (a.liberado_editar) {
    h += _mkAnamneseResumoAluno(a);
    h += '<button class="btn btn-ghost btn-full btn-sm" style="margin-top:12px;" onclick="abrirFormAnamnese()">Atualizar ficha</button>';
  } else {
    h += _mkAnamneseResumoAluno(a);
    h += '<div style="margin-top:12px;font-size:11px;color:var(--muted);text-align:center;padding:8px;background:var(--surf-high);border-radius:var(--rs);">&#x1F512; Edição bloqueada. Solicite ao Matheus se precisar atualizar.</div>';
  }
  h += '</div>';
  return h;
}

function _mkAnamneseResumoAluno(a) {
  var items = [];
  if (a.objetivo_principal)     items.push({ l: 'Objetivo',    v: _anLabel('objetivo_principal', a.objetivo_principal) });
  if (a.experiencia_musculacao) items.push({ l: 'Experiência', v: _anLabel('experiencia_musculacao', a.experiencia_musculacao) });
  if (a.frequencia_semanas)     items.push({ l: 'Freq./sem.',  v: a.frequencia_semanas + 'x' });
  if (a.nivel_estresse)         items.push({ l: 'Estresse',    v: _anLabel('nivel_estresse', a.nivel_estresse) });
  if (a.qualidade_sono)         items.push({ l: 'Sono',        v: _anLabel('qualidade_sono', a.qualidade_sono) });

  var flags = [];
  if (a.pressao_alta === true)  flags.push('Pressão alta');
  if (a.diabetes === true)      flags.push('Diabetes');
  if (a.cardiopatia === true)   flags.push('Cardiopatia');
  if (a.historico_lesoes === 'sim') flags.push('Lesões');

  var h = '';
  if (items.length) {
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    items.forEach(function(i) {
      h += '<div style="background:var(--surf-high);border-radius:var(--rs);padding:8px;">';
      h += '<div style="font-size:10px;color:var(--muted);margin-bottom:2px;">' + i.l + '</div>';
      h += '<div style="font-size:12px;font-weight:600;color:var(--white);">' + i.v + '</div>';
      h += '</div>';
    });
    h += '</div>';
  }
  if (flags.length) {
    h += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">';
    flags.forEach(function(f) {
      h += '<span style="font-size:10px;font-weight:700;color:var(--red);background:rgba(224,85,85,0.12);border:1px solid rgba(224,85,85,0.3);padding:2px 8px;border-radius:99px;">' + f + '</span>';
    });
    h += '</div>';
  }
  return h;
}

// ── FORMULARIO ANAMNESE ───────────────────────────
function abrirFormAnamnese() {
  var el = document.getElementById('avaliacoes-aluno-content');
  if (!el) return;
  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
      '<button class="btn btn-ghost btn-sm" onclick="_avAlunoLoading=false;loadAvaliacoesAlunoData()">&#x2190; Voltar</button>' +
      '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;">Ficha de Saúde</div>' +
    '</div>' +
    _mkFormAnamnese(_anamneseAtual) +
    '<button class="btn btn-primary btn-full" onclick="salvarAnamneseForm()" style="margin-top:16px;">Salvar ficha</button>' +
    '<div style="height:24px;"></div>';
}

function _mkFormAnamnese(a) {
  var cur = a || {};

  function sec(titulo) {
    return '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:18px 0 10px;">' + titulo + '</div>';
  }

  function radio(field, opts, curVal) {
    var h = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px;" id="rg-' + field + '">';
    opts.forEach(function(o) {
      var sel = curVal === o.v;
      h += '<button type="button" id="rb-' + field + '-' + o.v + '" ' +
        'onclick="anamnRadio(\'' + field + '\',\'' + o.v + '\',this)" ' +
        'style="padding:6px 12px;border-radius:99px;border:1.5px solid ' + (sel ? 'var(--green)' : 'var(--outline)') + ';' +
        'background:' + (sel ? 'var(--green-glow)' : 'transparent') + ';' +
        'color:' + (sel ? 'var(--green-pale)' : 'var(--muted)') + ';' +
        'font-size:12px;font-weight:600;cursor:pointer;">' + o.l + '</button>';
    });
    h += '</div>';
    h += '<input type="hidden" id="an-' + field + '" value="' + (curVal || '') + '">';
    return h;
  }

  var h = '<div class="card mb">';

  // SECAO 1 — Saúde
  h += sec('1. Saúde');

  h += '<div class="fg"><label>Já sofreu lesões musculares ou ortopédicas?</label>';
  h += radio('historico_lesoes', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.historico_lesoes);
  h += '<textarea id="an-lesoes-detalhe" placeholder="Descreva as lesões..." style="margin-top:8px;min-height:60px;' + (cur.historico_lesoes === 'sim' ? '' : 'display:none;') + '">' + (cur.lesoes_detalhe || '') + '</textarea>';
  h += '</div>';

  h += '<div class="fg"><label>Tem alguma condição médica diagnosticada?</label>';
  h += radio('condicoes_medicas', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.condicoes_medicas);
  h += '<input type="text" id="an-condicoes-detalhe" placeholder="Ex: Hipotireoidismo, escoliose..." style="margin-top:8px;' + (cur.condicoes_medicas === 'sim' ? '' : 'display:none;') + '" value="' + (cur.condicoes_detalhe || '') + '">';
  h += '</div>';

  h += '<div class="fg"><label>Usa medicamentos regularmente?</label>';
  h += radio('medicamentos', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.medicamentos);
  h += '<input type="text" id="an-medicamentos-detalhe" placeholder="Quais?" style="margin-top:8px;' + (cur.medicamentos === 'sim' ? '' : 'display:none;') + '" value="' + (cur.medicamentos_detalhe || '') + '">';
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
  h += '<div class="fg"><label>Pressão alta</label>' + radio('pressao_alta', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.pressao_alta === true ? 'sim' : cur.pressao_alta === false ? 'nao' : cur.pressao_alta) + '</div>';
  h += '<div class="fg"><label>Diabetes</label>' + radio('diabetes', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.diabetes === true ? 'sim' : cur.diabetes === false ? 'nao' : cur.diabetes) + '</div>';
  h += '<div class="fg"><label>Cardiopatia</label>' + radio('cardiopatia', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.cardiopatia === true ? 'sim' : cur.cardiopatia === false ? 'nao' : cur.cardiopatia) + '</div>';
  h += '<div class="fg"><label>Fumante</label>' + radio('fumante', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.fumante === true ? 'sim' : cur.fumante === false ? 'nao' : cur.fumante) + '</div>';
  h += '</div>';

  // SECAO 2 — Histórico Esportivo
  h += sec('2. Histórico Esportivo');

  h += '<div class="fg"><label>Pratica exercícios atualmente?</label>';
  h += radio('pratica_exercicio', [{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }], cur.pratica_exercicio);
  h += '</div>';

  h += '<div class="fg"><label>Experiência com musculação</label>';
  h += radio('experiencia_musculacao', [
    { v: 'nenhuma', l: 'Nenhuma' }, { v: 'iniciante', l: 'Iniciante' },
    { v: 'intermediario', l: 'Intermediário' }, { v: 'avancado', l: 'Avançado' }
  ], cur.experiencia_musculacao);
  h += '</div>';

  h += '<div class="fg"><label>Modalidades praticadas</label><input type="text" id="an-modalidades" placeholder="Ex: Caminhada, natação..." value="' + (cur.modalidades || '') + '"></div>';

  h += '<div class="fg"><label>Frequência semanal (vezes)</label>';
  h += radio('frequencia_semanas', [
    { v: '1', l: '1x' }, { v: '2', l: '2x' }, { v: '3', l: '3x' },
    { v: '4', l: '4x' }, { v: '5', l: '5x' }, { v: '6', l: '6x' }
  ], cur.frequencia_semanas ? String(cur.frequencia_semanas) : '');
  h += '</div>';

  // SECAO 3 — Objetivos
  h += sec('3. Objetivos');

  h += '<div class="fg"><label>Objetivo principal</label>';
  h += radio('objetivo_principal', [
    { v: 'emagrecimento', l: 'Emagrecer' }, { v: 'hipertrofia', l: 'Ganhar massa' },
    { v: 'condicionamento', l: 'Condicionamento' }, { v: 'saude_geral', l: 'Saúde geral' },
    { v: 'reabilitacao', l: 'Reabilitação' }
  ], cur.objetivo_principal);
  h += '</div>';

  h += '<div class="fg"><label>Prazo desejado</label>';
  h += radio('prazo', [
    { v: '3meses', l: '3 meses' }, { v: '6meses', l: '6 meses' },
    { v: '1ano', l: '1 ano' }, { v: 'longo', l: 'Longo prazo' }
  ], cur.prazo);
  h += '</div>';

  h += '<div class="fg"><label>Disponibilidade semanal (dias)</label>';
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px;" id="rg-disponibilidade_dias">';
  ['2', '3', '4', '5', '6'].forEach(function(d) {
    var sel = String(cur.disponibilidade_dias) === d;
    h += '<button type="button" id="rb-disponibilidade_dias-' + d + '" onclick="anamnRadio(\'disponibilidade_dias\',\'' + d + '\',this)" ' +
      'style="width:40px;height:40px;border-radius:50%;border:1.5px solid ' + (sel ? 'var(--green)' : 'var(--outline)') + ';' +
      'background:' + (sel ? 'var(--green-glow)' : 'transparent') + ';' +
      'color:' + (sel ? 'var(--green-pale)' : 'var(--muted)') + ';' +
      'font-size:13px;font-weight:700;cursor:pointer;">' + d + '</button>';
  });
  h += '</div>';
  h += '<input type="hidden" id="an-disponibilidade_dias" value="' + (cur.disponibilidade_dias || '') + '">';
  h += '</div>';

  h += '<div class="fg"><label>Turno preferido</label>';
  h += radio('turno', [
    { v: 'manha', l: 'Manhã' }, { v: 'tarde', l: 'Tarde' },
    { v: 'noite', l: 'Noite' }, { v: 'qualquer', l: 'Qualquer' }
  ], cur.turno);
  h += '</div>';

  // SECAO 4 — Hábitos de Vida
  h += sec('4. Hábitos de Vida');

  h += '<div class="fg"><label>Nível de estresse diário</label>';
  h += radio('nivel_estresse', [
    { v: 'baixo', l: 'Baixo' }, { v: 'medio', l: 'Médio' },
    { v: 'alto', l: 'Alto' }, { v: 'muito_alto', l: 'Muito alto' }
  ], cur.nivel_estresse);
  h += '</div>';

  h += '<div class="fg"><label>Qualidade do sono</label>';
  h += radio('qualidade_sono', [
    { v: 'otima', l: 'Ótima' }, { v: 'boa', l: 'Boa' },
    { v: 'regular', l: 'Regular' }, { v: 'ruim', l: 'Ruim' }
  ], cur.qualidade_sono);
  h += '</div>';

  h += '<div class="fg"><label>Horas de sono por noite</label>';
  h += radio('horas_sono', [
    { v: 'menos5', l: '< 5h' }, { v: '5a6', l: '5-6h' },
    { v: '7a8', l: '7-8h' }, { v: 'mais8', l: '> 8h' }
  ], cur.horas_sono);
  h += '</div>';

  h += '<div class="fg"><label>Alimentação</label>';
  h += radio('alimentacao', [
    { v: 'muito_ruim', l: 'Muito ruim' }, { v: 'ruim', l: 'Ruim' },
    { v: 'regular', l: 'Regular' }, { v: 'boa', l: 'Boa' }, { v: 'otima', l: 'Ótima' }
  ], cur.alimentacao);
  h += '</div>';

  h += '<div class="fg"><label>Consumo de água</label>';
  h += radio('consumo_agua', [
    { v: 'pouco', l: '< 1L' }, { v: 'moderado', l: '1-2L' },
    { v: 'bom', l: '2-3L' }, { v: 'otimo', l: '> 3L' }
  ], cur.consumo_agua);
  h += '</div>';

  h += '<div class="fg"><label>Atividade fora da academia</label>';
  h += radio('atividade_diaria', [
    { v: 'sedentario', l: 'Sedentário' }, { v: 'leve', l: 'Leve' },
    { v: 'moderado', l: 'Moderado' }, { v: 'ativo', l: 'Ativo' }
  ], cur.atividade_diaria);
  h += '</div>';

  h += '<div class="fg"><label>Observações adicionais</label>' +
    '<textarea id="an-obs" placeholder="Algo mais que o Matheus deve saber?" style="min-height:80px;">' + (cur.obs || '') + '</textarea>' +
    '</div>';

  h += '</div>'; // fecha card
  return h;
}

// Handler global para radio buttons da anamnese
function anamnRadio(field, val, btn) {
  var hidden = document.getElementById('an-' + field);
  if (hidden) hidden.value = val;

  var group = document.getElementById('rg-' + field);
  if (group) {
    group.querySelectorAll('button').forEach(function(b) {
      b.style.borderColor = 'var(--outline)';
      b.style.background  = 'transparent';
      b.style.color       = 'var(--muted)';
    });
  }
  if (btn) {
    btn.style.borderColor = 'var(--green)';
    btn.style.background  = 'var(--green-glow)';
    btn.style.color       = 'var(--green-pale)';
  }

  // Campos condicionais
  var cond = {
    historico_lesoes:  { campo: 'an-lesoes-detalhe',       mostrar: 'sim' },
    condicoes_medicas: { campo: 'an-condicoes-detalhe',    mostrar: 'sim' },
    medicamentos:      { campo: 'an-medicamentos-detalhe', mostrar: 'sim' }
  };
  if (cond[field]) {
    var el = document.getElementById(cond[field].campo);
    if (el) el.style.display = (val === cond[field].mostrar) ? '' : 'none';
  }
}

// ── SALVAR ANAMNESE ───────────────────────────────
async function salvarAnamneseForm() {
  function gv(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function gb(id) { var v = gv(id); return v === 'sim' ? true : v === 'nao' ? false : null; }

  var data = {
    historico_lesoes:       gv('an-historico_lesoes') || null,
    lesoes_detalhe:         gv('an-lesoes-detalhe')   || null,
    condicoes_medicas:      gv('an-condicoes_medicas') || null,
    condicoes_detalhe:      gv('an-condicoes-detalhe') || null,
    medicamentos:           gv('an-medicamentos') || null,
    medicamentos_detalhe:   gv('an-medicamentos-detalhe') || null,
    pressao_alta:           gb('an-pressao_alta'),
    diabetes:               gb('an-diabetes'),
    cardiopatia:            gb('an-cardiopatia'),
    fumante:                gb('an-fumante'),
    pratica_exercicio:      gv('an-pratica_exercicio') || null,
    experiencia_musculacao: gv('an-experiencia_musculacao') || null,
    modalidades:            gv('an-modalidades') || null,
    frequencia_semanas:     gv('an-frequencia_semanas') ? parseInt(gv('an-frequencia_semanas')) : null,
    objetivo_principal:     gv('an-objetivo_principal') || null,
    prazo:                  gv('an-prazo') || null,
    disponibilidade_dias:   gv('an-disponibilidade_dias') ? parseInt(gv('an-disponibilidade_dias')) : null,
    turno:                  gv('an-turno') || null,
    nivel_estresse:         gv('an-nivel_estresse') || null,
    qualidade_sono:         gv('an-qualidade_sono') || null,
    horas_sono:             gv('an-horas_sono') || null,
    alimentacao:            gv('an-alimentacao') || null,
    consumo_agua:           gv('an-consumo_agua') || null,
    atividade_diaria:       gv('an-atividade_diaria') || null,
    obs:                    gv('an-obs') || null
  };

  var err = await salvarAnamnese(currentUser.id, data);
  if (err) { toast('Erro ao salvar ficha!'); console.error(err); return; }
  toast('Ficha salva! ✅');
  _avAlunoLoading = false;
  loadAvaliacoesAlunoData();
}

// ── SECAO AVALIACOES FÍSICAS ──────────────────────
function _mkAvaliacoesSection(avs) {
  var h = '';

  // Próxima avaliação
  h += '<div class="card mb">';
  h += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:10px;">Próxima avaliação</div>';
  if (avs.length) {
    var ultima   = new Date(avs[0].data + 'T12:00:00');
    var proxima  = new Date(ultima);
    proxima.setDate(proxima.getDate() + 30);
    var hoje     = new Date();
    var diasRest = Math.max(0, Math.ceil((proxima - hoje) / 86400000));
    var pct      = Math.min(100, Math.max(0, Math.round(((hoje - ultima) / (proxima - ultima)) * 100)));
    var barColor = diasRest === 0 ? 'var(--green-pale)' : pct > 80 ? 'var(--gold)' : 'var(--green)';
    h +=
      '<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">' +
        (diasRest === 0
          ? '<span style="color:var(--green-pale);font-weight:700;">Já está na hora! 🎯</span>'
          : 'Sugerida em <strong style="color:var(--white);">' + diasRest + ' ' + (diasRest === 1 ? 'dia' : 'dias') + '</strong>') +
      '</div>' +
      '<div style="height:6px;background:var(--outline);border-radius:3px;margin-bottom:14px;">' +
        '<div style="height:6px;background:' + barColor + ';border-radius:3px;width:' + pct + '%;"></div>' +
      '</div>';
  } else {
    h += '<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Nenhuma avaliação registrada ainda.</div>';
  }
  h += '<button class="btn btn-primary btn-full btn-sm" onclick="solicitarAvaliacao()">Solicitar avaliação</button>';
  h += '</div>';

  // Histórico
  if (!avs.length) {
    h += '<div class="empty"><div class="empty-ico">&#x1F4CB;</div><p>Nenhuma avaliação física registrada ainda.</p></div>';
    return h;
  }

  h += '<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Histórico (' + avs.length + ')</div>';

  avs.forEach(function(av, idx) {
    var dtLabel = new Date(av.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    var badges  = [];
    if (av.peso)        badges.push(av.peso + ' kg');
    if (av.altura)      badges.push(av.altura + ' cm');
    if (av.imc)         badges.push('IMC ' + av.imc);
    if (av.gordura_pct) badges.push(av.gordura_pct + '% gord.');
    if (av.pressao)     badges.push(av.pressao);

    h += '<div class="card mb" style="cursor:pointer;" onclick="avAlunoToggle(' + idx + ')">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;">';
    h += '<div><div style="font-size:13px;font-weight:700;margin-bottom:4px;">' + dtLabel + '</div>';
    if (badges.length) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      badges.forEach(function(b) {
        h += '<span style="font-size:10px;color:var(--green-pale);background:var(--green-glow);border:1px solid var(--green-border);padding:2px 8px;border-radius:99px;">' + b + '</span>';
      });
      h += '</div>';
    }
    h += '</div>';
    h += '<span style="font-size:18px;color:var(--muted);transition:transform .2s;" id="avdet-arrow-' + idx + '">&#x203A;</span>';
    h += '</div>';

    h += '<div id="avdet-' + idx + '" style="display:none;margin-top:14px;border-top:1px solid var(--outline);padding-top:14px;">';

    var temBasico = av.peso || av.altura || av.imc || av.gordura_pct || av.pressao || av.cin_quad;
    if (temBasico) {
      h += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dados básicos</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
      if (av.peso)   h += mkMedida(av.peso + ' kg', 'Peso');
      if (av.altura) h += mkMedida(av.altura + ' cm', 'Altura');
      if (av.imc) {
        var imcCls = av.imc < 18.5 ? 'Abaixo' : av.imc < 25 ? 'Normal' : av.imc < 30 ? 'Sobrepeso' : 'Obeso';
        var imcClr = av.imc < 25 ? 'var(--green-pale)' : av.imc < 30 ? 'var(--gold)' : 'var(--red)';
        h += mkMedidaColor(String(av.imc), 'IMC · ' + imcCls, imcClr);
      }
      if (av.pressao) {
        var pp   = av.pressao.split('/');
        var pClr = 'var(--muted)', pCls = '';
        if (pp.length === 2) {
          var s2 = parseInt(pp[0]), d2 = parseInt(pp[1]);
          pCls = (s2 < 120 && d2 < 80) ? 'Normal' : (s2 < 130 && d2 < 80) ? 'Elevada' : (s2 < 140 || d2 < 90) ? 'Hiper I' : 'Hiper II';
          pClr = pCls === 'Normal' ? 'var(--green-pale)' : pCls === 'Elevada' ? 'var(--gold)' : 'var(--red)';
        }
        h += mkMedidaColor(av.pressao, 'Pressão' + (pCls ? ' · ' + pCls : ''), pClr);
      }
      if (av.gordura_pct) h += mkMedida(av.gordura_pct + '%', '% Gordura');
      if (av.cin_quad)    h += mkMedida(String(av.cin_quad), 'Cin/Quad');
      h += '</div>';
    }

    var circDados = [
      { key: 'peito', label: 'Peito' }, { key: 'bunda', label: 'Bunda' },
      { key: 'coxa_d', label: 'Coxa Dir.' }, { key: 'coxa_e', label: 'Coxa Esq.' },
      { key: 'braco_d', label: 'Braço Dir.' }, { key: 'braco_e', label: 'Braço Esq.' },
      { key: 'panturrilha', label: 'Panturrilha' }, { key: 'abdomen', label: 'Abdômen' }
    ];
    var temCirc = circDados.some(function(c) { return av[c.key]; });
    if (temCirc) {
      h += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Circunferências (cm)</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
      circDados.forEach(function(c) { if (av[c.key]) h += mkMedida(av[c.key] + ' cm', c.label); });
      h += '</div>';
    }

    var dobrasDados = [
      { key: 'dobra_tricipital', label: 'Tricipital' }, { key: 'dobra_subescapular', label: 'Subescap.' },
      { key: 'dobra_suprailiaca', label: 'Suprailiaca' }, { key: 'dobra_abdominal', label: 'Abdominal' },
      { key: 'dobra_coxa', label: 'Coxa' }, { key: 'dobra_panturrilha', label: 'Panturrilha' }
    ];
    var temDobras = dobrasDados.some(function(d) { return av[d.key]; });
    if (temDobras) {
      h += '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Dobras cutâneas (mm)</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">';
      dobrasDados.forEach(function(d) { if (av[d.key]) h += mkMedida(av[d.key] + ' mm', d.label); });
      h += '</div>';
    }

    if (av.objetivo) {
      h += '<div style="margin-bottom:8px;">' +
        '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Objetivo</div>' +
        '<div style="font-size:13px;color:var(--white);">' + av.objetivo + '</div></div>';
    }
    if (av.obs) {
      h += '<div>' +
        '<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Observações</div>' +
        '<div style="font-size:13px;color:var(--white);line-height:1.6;">' + av.obs + '</div></div>';
    }

    h += '</div>'; // fecha avdet
    h += '</div>'; // fecha card
  });

  return h;
}

function avAlunoToggle(idx) {
  var det   = document.getElementById('avdet-' + idx);
  var arrow = document.getElementById('avdet-arrow-' + idx);
  if (!det) return;
  var isOpen = det.style.display !== 'none';
  det.style.display = isOpen ? 'none' : 'block';
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

// ── LABEL HELPER ──────────────────────────────────
function _anLabel(field, val) {
  var map = {
    objetivo_principal: {
      emagrecimento: 'Emagrecer', hipertrofia: 'Ganhar massa',
      condicionamento: 'Condicionamento', saude_geral: 'Saúde geral', reabilitacao: 'Reabilitação'
    },
    experiencia_musculacao: {
      nenhuma: 'Nenhuma', iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado'
    },
    nivel_estresse: {
      baixo: 'Baixo', medio: 'Médio', alto: 'Alto', muito_alto: 'Muito alto'
    },
    qualidade_sono: {
      otima: 'Ótima', boa: 'Boa', regular: 'Regular', ruim: 'Ruim'
    },
    horas_sono: {
      menos5: '< 5h', '5a6': '5-6h', '7a8': '7-8h', mais8: '> 8h'
    },
    alimentacao: {
      muito_ruim: 'Muito ruim', ruim: 'Ruim', regular: 'Regular', boa: 'Boa', otima: 'Ótima'
    },
    consumo_agua: {
      pouco: '< 1L', moderado: '1-2L', bom: '2-3L', otimo: '> 3L'
    },
    atividade_diaria: {
      sedentario: 'Sedentário', leve: 'Leve', moderado: 'Moderado', ativo: 'Ativo'
    },
    prazo: {
      '3meses': '3 meses', '6meses': '6 meses', '1ano': '1 ano', longo: 'Longo prazo'
    },
    turno: {
      manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', qualquer: 'Qualquer'
    }
  };
  return (map[field] && map[field][val]) ? map[field][val] : (val || '');
}
