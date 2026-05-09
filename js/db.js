// ================================================
// FISCHER METHOD — db.js
// Funcoes de acesso ao banco de dados
// ================================================

// ── PERFIS ────────────────────────────────────────
async function getProfile(userId) {
  var res = await sb.from('profiles').select('*').eq('id', userId).single();
  return res.data;
}

async function updateProfile(userId, data) {
  var res = await sb.from('profiles').update(data).eq('id', userId);
  return res.error;
}

// ── TREINOS ───────────────────────────────────────
async function getTreinosAluno(alunoId) {
  var res = await sb.from('treinos').select('*').eq('aluno_id', alunoId).eq('ativo', true);
  return res.data || [];
}

async function getTreinoCompleto(treinoId) {
  var res = await sb.from('treino_exercicios')
    .select('*, exercicios(*)')
    .eq('treino_id', treinoId)
    .order('ordem');
  return res.data || [];
}

// ── ALUNOS (personal) ─────────────────────────────
async function getTodosAlunos() {
  var res = await sb.from('profiles').select('*').eq('role', 'aluno').order('name');
  return res.data || [];
}

// ── EXERCICIOS ────────────────────────────────────
async function getExercicios(filtros) {
  var q = sb.from('exercicios').select('*').order('nome');
  if (filtros) {
    if (filtros.musculo) q = q.eq('musculo', filtros.musculo);
    if (filtros.tipo) q = q.eq('tipo', filtros.tipo);
    if (filtros.local) q = q.eq('local', filtros.local);
    if (filtros.equipamento) q = q.eq('equipamento', filtros.equipamento);
  }
  var res = await q;
  return res.data || [];
}

async function criarExercicio(data) {
  var res = await sb.from('exercicios').insert(data);
  return res.error;
}

// ── TREINOS (templates) ───────────────────────────
async function getTreinos() {
  var res = await sb.from('treinos').select('*').eq('e_template', true).order('nome');
  return res.data || [];
}

async function criarTreino(data) {
  var res = await sb.from('treinos').insert(data).select().single();
  return res;
}

async function adicionarExercicioAoTreino(treino_id, exercicio_id, data) {
  var payload = Object.assign({ treino_id: treino_id, exercicio_id: exercicio_id }, data);
  var res = await sb.from('treino_exercicios').insert(payload);
  return res.error;
}

async function atribuirTreinoAluno(template_id, aluno_id, dia_semana) {
  var resTpl = await sb.from('treinos').select('nome, descricao').eq('id', template_id).single();
  if (resTpl.error) return resTpl.error;
  var resTreino = await sb.from('treinos').insert({
    nome: resTpl.data.nome,
    descricao: resTpl.data.descricao,
    dia_semana: dia_semana,
    e_template: false,
    aluno_id: aluno_id,
    ativo: true
  }).select().single();
  if (resTreino.error) return resTreino.error;
  var resEx = await sb.from('treino_exercicios').select('*').eq('treino_id', template_id).order('ordem');
  var exs = resEx.data || [];
  if (exs.length) {
    var copies = exs.map(function(e) {
      return { treino_id: resTreino.data.id, exercicio_id: e.exercicio_id, series: e.series, repeticoes: e.repeticoes, carga: e.carga, descanso_seg: e.descanso_seg, minutos: e.minutos, ordem: e.ordem, obs: e.obs };
    });
    await sb.from('treino_exercicios').insert(copies);
  }
  return null;
}

// ── CARGAS DO ALUNO ───────────────────────────────
async function getCargaAluno(aluno_id, treino_exercicio_id) {
  var res = await sb.from('aluno_cargas').select('carga').eq('aluno_id', aluno_id).eq('treino_exercicio_id', treino_exercicio_id).single();
  return res.data ? res.data.carga : null;
}

async function salvarCargaAluno(aluno_id, treino_exercicio_id, carga) {
  var res = await sb.from('aluno_cargas').upsert({
    aluno_id: aluno_id,
    treino_exercicio_id: treino_exercicio_id,
    carga: carga,
    updated_at: new Date().toISOString()
  }, { onConflict: 'aluno_id,treino_exercicio_id' });
  return res.error;
}

// ── EXECUCOES ─────────────────────────────────────
async function getExecucoesAluno(alunoId) {
  var res = await sb.from('execucoes').select('*, treinos(nome)').eq('aluno_id', alunoId).order('data', { ascending: false }).limit(30);
  return res.data || [];
}

// ── MEDIDAS ───────────────────────────────────────
async function getMedidasAluno(alunoId) {
  var res = await sb.from('medidas').select('*').eq('aluno_id', alunoId).order('data', { ascending: false });
  return res.data || [];
}

// ── AVALIACOES ────────────────────────────────────
async function getAvaliacoesAluno(alunoId) {
  var res = await sb.from('avaliacoes').select('*').eq('aluno_id', alunoId).order('data', { ascending: false });
  return res.data || [];
}

// ── INVITE CODES ──────────────────────────────────
async function criarConvite(code) {
  var res = await sb.from('invite_codes').insert({ code: code });
  return res.error;
}

async function criarConviteNome(code, nome) {
  var res = await sb.from('invite_codes').insert({ code: code, aluno_nome: nome });
  return res.error;
}

async function getConvites() {
  var res = await sb.from('invite_codes').select('*').order('created_at', { ascending: false });
  return res.data || [];
}
