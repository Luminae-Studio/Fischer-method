// ================================================
// FISCHER METHOD — auth.js
// ================================================

let currentUser = null;
let currentProfile = null;

// ── INIT ─────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await onLogin(session.user);
  } else {
    showLogin();
  }
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await onLogin(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      showLogin();
    }
  });
}

// ── LOGIN GOOGLE ──────────────────────────────────
async function loginGoogle() {
  showLoginError('');
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });
  if (error) showLoginError('Erro ao conectar com Google. Tente novamente.');
}

// ── LOGIN CONVITE ─────────────────────────────────
async function loginConvite() {
  showLoginError('');
  const code = document.getElementById('invite-input').value.trim().toUpperCase();
  const email = document.getElementById('invite-email').value.trim();
  const pass = document.getElementById('invite-pass').value;

  if (!code) { showLoginError('Digite o codigo de convite.'); return; }
  if (!email) { showLoginError('Digite seu e-mail.'); return; }
  if (!pass || pass.length < 6) { showLoginError('A senha precisa ter pelo menos 6 caracteres.'); return; }

  // Verifica se o codigo existe e nao foi usado
  const { data: invite, error: invErr } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .single();

  if (invErr || !invite) {
    showLoginError('Codigo invalido ou ja utilizado. Fale com o Matheus.');
    return;
  }

  // Tenta criar conta ou fazer login
  let user = null;
  const { data: signUp, error: signUpErr } = await sb.auth.signUp({ email, password: pass });

  if (signUpErr) {
    // Ja tem conta — tenta login
    const { data: signIn, error: signInErr } = await sb.auth.signInWithPassword({ email, password: pass });
    if (signInErr) { showLoginError('E-mail ou senha incorretos.'); return; }
    user = signIn.user;
  } else {
    user = signUp.user;
  }

  if (!user) { showLoginError('Erro inesperado. Tente novamente.'); return; }

  // Marca convite como usado
  await sb.from('invite_codes').update({ used: true, used_by: user.id }).eq('id', invite.id);
}

// ── LOGOUT ────────────────────────────────────────
async function logout() {
  await sb.auth.signOut();
}

// ── APOS LOGIN ────────────────────────────────────
async function onLogin(user) {
  currentUser = user;

  // Busca ou cria perfil
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Define role — se for o email do personal vira personal
    const role = user.email === PERSONAL_EMAIL ? 'personal' : 'aluno';
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        photo_url: user.user_metadata?.avatar_url || null,
        role: role
      })
      .select()
      .single();
    profile = newProfile;
  }

  currentProfile = profile;
  showApp(profile);
}

// ── MOSTRAR LOGIN ─────────────────────────────────
function showLogin() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('pg-login').style.display = 'block';
}

// ── MOSTRAR APP ───────────────────────────────────
function showApp(profile) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('pg-login').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  // Mostra nav correta
  if (profile.role === 'personal') {
    document.getElementById('bnav-personal').style.display = 'grid';
    document.getElementById('bnav-aluno').style.display = 'none';
    go('dash');
  } else {
    document.getElementById('bnav-aluno').style.display = 'grid';
    document.getElementById('bnav-personal').style.display = 'none';
    go('inicio');
  }
}

// ── ERRO LOGIN ────────────────────────────────────
function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (!el) return;
  if (!msg) { el.style.display = 'none'; return; }
  el.textContent = msg;
  el.style.display = 'block';
}

// ── HELPER: e usuario e personal? ─────────────────
function isPersonal() {
  return currentProfile && currentProfile.role === 'personal';
}
