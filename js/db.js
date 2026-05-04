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
async function getExercicios() {
  var res = await sb.from('exercicios').select('*').order('nome');
  return res.data || [];
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
