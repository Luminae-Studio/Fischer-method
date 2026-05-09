// FISCHER METHOD -- auth.js
var currentUser = null;
var currentProfile = null;

async function initAuth() {
  // Supabase processa automaticamente o token do hash da URL apos redirect do Google
  // Precisamos aguardar um momento para ele processar
  var res = await sb.auth.getSession();
  var session = res.data.session;

  if (session) {
    await onLogin(session.user);
  } else {
    // Se tem hash na URL pode ser redirect do Google - aguarda processamento
    if (window.location.hash && window.location.hash.includes('access_token')) {
      document.getElementById('loading').style.display = 'flex';
      setTimeout(async function() {
        var res2 = await sb.auth.getSession();
        if (res2.data.session) {
          await onLogin(res2.data.session.user);
        } else {
          showLogin();
        }
      }, 1500);
    } else {
      showLogin();
    }
  }

  sb.auth.onAuthStateChange(async function(event, session) {
    if (event === 'SIGNED_IN' && session) {
      await onLogin(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      showLogin();
    }
  });
}

async function loginGoogle() {
  showLoginError('');
  var res = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://fischer-method.netlify.app/'
    }
  });
  if (res.error) showLoginError('Erro ao conectar com Google. Tente novamente.');
}

async function logout() {
  await sb.auth.signOut();
}

async function onLogin(user) {
  currentUser = user;

  // Limpa o hash da URL sem recarregar a pagina
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname);
  }

  var res = await sb.from('profiles').select('*').eq('id', user.id).single();
  var profile = res.data;

  if (!profile) {
    if (user.email === PERSONAL_EMAIL) {
      var ins = await sb.from('profiles').insert({
        id: user.id,
        email: user.email,
        name: (user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : user.email.split('@')[0],
        photo_url: (user.user_metadata && user.user_metadata.avatar_url) ? user.user_metadata.avatar_url : null,
        role: 'personal'
      }).select().single();
      profile = ins.data;
      currentProfile = profile;
      showApp(profile);
    } else {
      showPedirConvite();
    }
    return;
  }

  currentProfile = profile;
  showApp(profile);
}

function showPedirConvite() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('pg-login').style.display = 'flex';
  document.getElementById('section-google').style.display = 'none';
  document.getElementById('section-convite').style.display = 'block';
}

async function validarConvite() {
  showLoginError('');
  var code = document.getElementById('invite-input').value.trim().toUpperCase();
  if (!code) { showLoginError('Digite o codigo de convite.'); return; }

  var res = await sb.from('invite_codes').select('*').eq('code', code).eq('used', false).single();
  var invite = res.data;
  if (!invite) { showLoginError('Codigo invalido ou ja utilizado. Fale com o Matheus.'); return; }

  var user = currentUser;
  var nome = invite.aluno_nome || ((user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : user.email.split('@')[0]);
  var ins = await sb.from('profiles').insert({
    id: user.id, email: user.email, name: nome,
    photo_url: (user.user_metadata && user.user_metadata.avatar_url) ? user.user_metadata.avatar_url : null,
    role: 'aluno'
  }).select().single();
  if (ins.error) { showLoginError('Erro ao criar perfil. Tente novamente.'); return; }

  await sb.from('invite_codes').update({ used: true, used_by: user.id }).eq('id', invite.id);
  currentProfile = ins.data;
  showApp(ins.data);
}

function showLogin() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('pg-login').style.display = 'flex';
  document.getElementById('section-google').style.display = 'block';
  document.getElementById('section-convite').style.display = 'none';
  showLoginError('');
}

function showApp(profile) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('pg-login').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  if (!profile) { showLogin(); return; }
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

function showLoginError(msg) {
  var el = document.getElementById('login-error');
  if (!el) return;
  if (!msg) { el.style.display = 'none'; return; }
  el.textContent = msg;
  el.style.display = 'block';
}

function isPersonal() {
  return currentProfile && currentProfile.role === 'personal';
}
