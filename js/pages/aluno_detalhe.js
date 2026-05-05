// FISCHER METHOD -- aluno_detalhe.js
var alunoAtual = null;
var alunoDetTab = 'visao';

async function abrirAlunoDetalhe(id) {
  var res = await sb.from('profiles').select('*').eq('id', id).single();
  if (!res.data) { toast('Erro ao carregar aluno.'); return; }
  alunoAtual = res.data;
  alunoDetTab = 'visao';
  document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('on'); });
  var el = document.getElementById('pg-aluno-det');
  if (el) el.classList.add('on');
  document.getElementById('scr').scrollTo({ top: 0, behavior: 'instant' });
  renderAlunoDetalhe();
}

function renderAlunoDetalhe() {
  var el = document.getElementById('pg-aluno-det');
  if (!el || !alunoAtual) return;
  var a = alunoAtual;
  var statusColor = { ativo:'var(--green-pale)', pausa:'var(--gold)', inativo:'var(--red)' }[a.status_aluno||'ativo'];
  var statusLabel = { ativo:'Ativo', pausa:'Em pausa', inativo:'Inativo' }[a.status_aluno||'ativo'];

  el.innerHTML =
    '<div class="top-bar">' +
      '<button class="btn btn-ghost btn-sm" onclick="voltarAlunos()">&#x2190; Voltar</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="editarAluno()">Editar</button>' +
    '</div>' +
    '<div style="padding:0 20px 16px;display:flex;gap:16px;align-items:flex-start;">' +
      avatarHTML(a, 'av-xl') +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-family:var(--font-display);font-size:20px;font-weight:700;margin-bottom:2px;">' + (a.name||'Aluno') + '</div>' +
        '<div style="font-size:12px;color:var(--muted);margin-bottom:6px;">' + (a.email||'') + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<span style="font-size:11px;font-weight:700;color:' + statusColor + ';background:var(--surf-high);border:1px solid ' + statusColor + ';padding:3px 10px;border-radius:99px;">' + statusLabel + '</span>' +
          (a.data_inicio ? '<span style="font-size:11px;color:var(--muted);background:var(--surf-high);border:1px solid var(--outline);padding:3px 10px;border-radius:99px;">Desde ' + new Date(a.data_inicio+'T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}) + '</span>' : '') +
        '</div>' +
        (a.objetivo ? '<div style="font-size:12px;color:var(--green-pale);margin-top:6px;font-weight:500;">&#x25CF; ' + a.objetivo + '</div>' : '') +
      '</div>' +
    '</div>' +
    '<div class="tabs" style="padding:0 20px;">' +
      '<button class="tab' + (alunoDetTab==='visao'?' on':'') + '" onclick="switchDetTab(\'visao\',this)">Visao geral</button>' +
      '<button class="tab' + (alunoDetTab==='treinos'?' on':'') + '" onclick="switchDetTab(\'treinos\',this)">Treinos</button>' +
      '<button class="tab' + (alunoDetTab==='progresso'?' on':'') + '" onclick="switchDetTab(\'progresso\',this)">Progresso</button>' +
      '<button class="tab' + (alunoDetTab==='notas'?' on':'') + '" onclick="switchDetTab(\'notas\',this)">Notas</button>' +
    '</div>' +
    '<div id="alu-det-content" style="padding:0 20px 20px;"></div>';

  loadDetTab();
}

function switchDetTab(tab, btn) {
  alunoDetTab = tab;
  document.querySelectorAll('#pg-aluno-det .tab').forEach(function(t) { t.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  loadDetTab();
}

async function loadDetTab() {
  var el = document.getElementById('alu-det-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px 0;"><div class="spinner" style="margin:0 auto;"></div></div>';
  if (alunoDetTab==='visao') await loadDetVisao();
  else if (alunoDetTab==='treinos') await loadDetTreinos();
  else if (alunoDetTab==='progresso') await loadDetProgresso();
  else if (alunoDetTab==='notas') loadDetNotas();
}

async function loadDetVisao() {
  var el = document.getElementById('alu-det-content');
  var a = alunoAtual;
  var resAv = await sb.from('avaliacoes').select('*').eq('aluno_id', a.id).order('data',{ascending:false}).limit(1);
  var av = resAv.data && resAv.data[0];
  var resEx = await sb.from('execucoes').select('data').eq('aluno_id', a.id).eq('concluido', true).order('data',{ascending:false});
  var streak = calcStreak(resEx.data||[]);
  var ultimo = resEx.data && resEx.data[0];
  var resTr = await sb.from('treinos').select('*').eq('aluno_id', a.id).eq('ativo', true);
  var treinos = resTr.data || [];
  var html = '';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">';
  html += mkDetStat(String(streak), 'dias seguidos', streak > 0);
  html += mkDetStat(ultimo ? diasDesde(ultimo.data) : '--', 'ultimo treino', false);
  html += '</div>';

  if (av) {
    html += '<div class="card mb"><div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Dados corporais</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    if (av.peso) html += mkMedida(av.peso+' kg','Peso');
    if (av.altura) html += mkMedida(av.altura+' cm','Altura');
    if (av.imc) html += mkMedida(String(av.imc),'IMC');
    if (av.gordura_pct) html += mkMedida(av.gordura_pct+'%','Gordura');
    if (av.cin_quad) html += mkMedida(String(av.cin_quad),'Cin/Quad');
    if (av.pressao) html += mkMedida(av.pressao,'Pressao');
    html += '</div>';
    html += '<div style="font-size:10px;color:var(--muted);margin-top:10px;">Avaliacao de ' + new Date(av.data+'T12:00:00').toLocaleDateString('pt-BR') + '</div>';
    html += '<button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;" onclick="openNovaAvaliacao()">+ Nova avaliacao</button></div>';
  } else {
    html += '<div class="card mb" style="text-align:center;padding:20px;">';
    html += '<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">Nenhuma avaliacao ainda</div>';
    html += '<button class="btn btn-primary btn-sm" onclick="openNovaAvaliacao()">Fazer avaliacao</button></div>';
  }

  html += '<div class="card mb">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
  html += '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;">Treinos ativos</div>';
  html += '<button class="btn btn-primary btn-xs" onclick="openNovoTreino()">+ Treino</button></div>';
  if (!treinos.length) {
    html += '<div style="text-align:center;padding:12px 0;color:var(--muted);font-size:12px;">Nenhum treino montado ainda</div>';
  } else {
    treinos.forEach(function(t) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--outline);">';
      html += '<div style="width:36px;height:36px;border-radius:var(--rx);background:var(--green-glow);border:1px solid var(--green-border);display:flex;align-items:center;justify-content:center;font-size:16px;">&#x1F4AA;</div>';
      html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + t.nome + '</div>';
      html += '<div style="font-size:11px;color:var(--muted);">' + (t.dia_semana||'Qualquer dia') + '</div></div>';
      html += '<button class="btn btn-ghost btn-xs" onclick="editarTreino(\'' + t.id + '\')">Editar</button></div>';
    });
  }
  html += '</div>';
  el.innerHTML = html;
}

async function loadDetTreinos() {
  var el = document.getElementById('alu-det-content');
  var res = await sb.from('execucoes').select('*, treinos(nome)').eq('aluno_id', alunoAtual.id).order('data',{ascending:false}).limit(20);
  var exec = res.data || [];
  if (!exec.length) { el.innerHTML = '<div class="empty"><div class="empty-ico">&#x1F4AA;</div><p>Nenhum treino registrado ainda.</p></div>'; return; }
  var html = '<div class="card">';
  exec.forEach(function(e) {
    var dt = new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'});
    html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--outline);">';
    html += '<div style="width:40px;height:40px;border-radius:var(--rx);background:' + (e.concluido?'var(--green-glow)':'var(--surf-high)') + ';border:1px solid ' + (e.concluido?'var(--green-border)':'var(--outline)') + ';display:flex;align-items:center;justify-content:center;font-size:16px;">' + (e.concluido?'&#x2713;':'&#x23F3;') + '</div>';
    html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;">' + (e.treinos?e.treinos.nome:'Treino') + '</div>';
    html += '<div style="font-size:11px;color:var(--muted);">' + dt + (e.duracao_min?' &middot; '+e.duracao_min+'min':'') + '</div></div>';
    html += '<span class="badge ' + (e.concluido?'badge-green':'badge-muted') + '">' + (e.concluido?'OK':'Parcial') + '</span></div>';
  });
  el.innerHTML = html + '</div>';
}

async function loadDetProgresso() {
  var el = document.getElementById('alu-det-content');
  var resMed = await sb.from('medidas').select('*').eq('aluno_id', alunoAtual.id).order('data',{ascending:true});
  var medidas = resMed.data || [];
  var resAv = await sb.from('avaliacoes').select('*').eq('aluno_id', alunoAtual.id).order('data',{ascending:false});
  var avaliacoes = resAv.data || [];
  var html = '';

  if (medidas.length > 1) {
    var pesos = medidas.map(function(m){return m.peso;}).filter(Boolean);
    var maxP = Math.max.apply(null, pesos), minP = Math.min.apply(null, pesos);
    var range = maxP - minP || 1;
    html += '<div class="card mb"><div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Evolucao do peso</div>';
    html += '<div style="display:flex;align-items:flex-end;gap:4px;height:80px;margin-bottom:8px;">';
    medidas.slice(-10).forEach(function(m) {
      var h = m.peso ? Math.round(((m.peso-minP)/range)*60+10) : 10;
      var dt = new Date(m.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      html += '<div style="font-size:9px;color:var(--green-pale);font-weight:700;">' + (m.peso||'') + '</div>';
      html += '<div style="width:100%;height:' + h + 'px;background:var(--green);border-radius:3px 3px 0 0;"></div>';
      html += '<div style="font-size:8px;color:var(--muted);">' + dt + '</div></div>';
    });
    html += '</div>';
    var diff = Math.round((medidas[medidas.length-1].peso - medidas[0].peso)*10)/10;
    html += '<div style="font-size:12px;color:' + (diff<0?'var(--green-pale)':diff>0?'var(--red)':'var(--muted)') + ';font-weight:600;text-align:center;">' + (diff>0?'+':'') + diff + ' kg desde o inicio</div></div>';
  }

  html += '<button class="btn btn-primary btn-full mb" onclick="openNovaMedida()">+ Registrar peso</button>';

  if (avaliacoes.length) {
    html += '<div class="card mb"><div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Historico de avaliacoes</div>';
    avaliacoes.forEach(function(av) {
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--outline);">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">';
      html += '<div style="font-size:12px;font-weight:600;">' + new Date(av.data+'T12:00:00').toLocaleDateString('pt-BR') + '</div>';
      if (av.peso) html += '<div style="font-size:13px;font-weight:700;color:var(--green-pale);">' + av.peso + ' kg</div>';
      html += '</div><div style="display:flex;gap:10px;flex-wrap:wrap;">';
      if (av.imc) html += '<span style="font-size:11px;color:var(--muted);">IMC: <b style="color:var(--white);">' + av.imc + '</b></span>';
      if (av.gordura_pct) html += '<span style="font-size:11px;color:var(--muted);">Gordura: <b style="color:var(--white);">' + av.gordura_pct + '%</b></span>';
      if (av.pressao) html += '<span style="font-size:11px;color:var(--muted);">Pressao: <b style="color:var(--white);">' + av.pressao + '</b></span>';
      html += '</div>';
      if (av.obs) html += '<div style="font-size:11px;color:var(--muted);margin-top:4px;">' + av.obs + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  if (!medidas.length && !avaliacoes.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">&#x1F4C8;</div><p>Nenhum dado de progresso ainda.</p><button class="btn btn-primary" style="margin-top:12px;" onclick="openNovaAvaliacao()">Fazer avaliacao</button></div>';
    return;
  }
  el.innerHTML = html;
}

function loadDetNotas() {
  var el = document.getElementById('alu-det-content');
  var a = alunoAtual;
  el.innerHTML =
    '<div class="card mb">' +
      '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:4px;">Notas privadas</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:12px;">Visivel apenas para voce</div>' +
      '<textarea id="notas-input" style="width:100%;min-height:160px;background:var(--surf-high);border:1.5px solid var(--outline);border-radius:var(--rs);padding:12px;color:var(--white);font-size:14px;line-height:1.6;resize:vertical;" placeholder="Lesoes, preferencias, restricoes...">' + (a.notas_personal||'') + '</textarea>' +
      '<button class="btn btn-primary btn-full" style="margin-top:10px;" onclick="salvarNotas()">Salvar notas</button>' +
    '</div>' +
    '<div class="card">' +
      '<div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:12px;">Status do aluno</div>' +
      '<div style="display:flex;gap:8px;">' +
        mkStatusBtn('ativo','Ativo',a.status_aluno) +
        mkStatusBtn('pausa','Em pausa',a.status_aluno) +
        mkStatusBtn('inativo','Inativo',a.status_aluno) +
      '</div>' +
    '</div>';
}

function mkStatusBtn(val, label, current) {
  var active = (current||'ativo') === val;
  var colors = { ativo:'var(--green)', pausa:'var(--gold)', inativo:'var(--red)' };
  return '<button onclick="salvarStatus(\'' + val + '\')" style="flex:1;padding:10px;border-radius:var(--rs);border:1.5px solid ' + (active?colors[val]:'var(--outline)') + ';background:' + (active?'rgba(45,106,45,0.15)':'var(--surf-high)') + ';color:' + (active?colors[val]:'var(--muted)') + ';font-size:12px;font-weight:' + (active?'700':'500') + ';cursor:pointer;">' + label + '</button>';
}

async function salvarNotas() {
  var notas = document.getElementById('notas-input').value;
  var res = await sb.from('profiles').update({ notas_personal: notas }).eq('id', alunoAtual.id);
  if (res.error) { toast('Erro ao salvar!'); return; }
  alunoAtual.notas_personal = notas;
  toast('Notas salvas!');
}

async function salvarStatus(status) {
  var res = await sb.from('profiles').update({ status_aluno: status }).eq('id', alunoAtual.id);
  if (res.error) { toast('Erro ao salvar!'); return; }
  alunoAtual.status_aluno = status;
  toast('Status atualizado!');
  renderAlunoDetalhe();
  setTimeout(function() { switchDetTab('notas', null); }, 50);
}

function editarAluno() {
  var a = alunoAtual;
  var existing = document.getElementById('mod-edit-aluno');
  if (existing) existing.remove();
  var m = document.createElement('div');
  m.className = 'mov'; m.id = 'mod-edit-aluno';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Editar aluno</h3>' +
    '<div class="fg"><label>Nome</label><input type="text" id="ea-nome" value="' + (a.name||'') + '"></div>' +
    '<div class="fg"><label>Objetivo</label><input type="text" id="ea-obj" value="' + (a.objetivo||'') + '" placeholder="Ex: Perda de peso, hipertrofia..."></div>' +
    '<div class="fg"><label>Data de inicio</label><input type="date" id="ea-inicio" value="' + (a.data_inicio||'') + '"></div>' +
    '<div class="fg"><label>Telefone</label><input type="tel" id="ea-tel" value="' + (a.phone||'') + '"></div>' +
    '<div class="mod-actions"><button class="btn btn-ghost" onclick="closeModal(\'mod-edit-aluno\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="salvarEditAluno()">Salvar</button></div></div>';
  m.addEventListener('click', function(e) { if (e.target===m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-edit-aluno');
}

async function salvarEditAluno() {
  var data = {
    name: document.getElementById('ea-nome').value,
    objetivo: document.getElementById('ea-obj').value,
    data_inicio: document.getElementById('ea-inicio').value || null,
    phone: document.getElementById('ea-tel').value
  };
  var res = await sb.from('profiles').update(data).eq('id', alunoAtual.id);
  if (res.error) { toast('Erro ao salvar!'); return; }
  Object.assign(alunoAtual, data);
  closeModal('mod-edit-aluno');
  toast('Aluno atualizado!');
  renderAlunoDetalhe();
  loadDetTab();
}

function openNovaAvaliacao() {
  var existing = document.getElementById('mod-av'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className='mov'; m.id='mod-av';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Nova avaliacao</h3>' +
    '<div class="fg"><label>Data</label><input type="date" id="av-data" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    '<div class="fg"><label>Peso (kg)</label><input type="number" id="av-peso" step="0.1" placeholder="70.5"></div>' +
    '<div class="fg"><label>Altura (cm)</label><input type="number" id="av-alt" placeholder="170"></div>' +
    '<div class="fg"><label>% Gordura</label><input type="number" id="av-gord" step="0.1" placeholder="20.5"></div>' +
    '<div class="fg"><label>Cin/Quad</label><input type="number" id="av-cq" step="0.01" placeholder="0.85"></div></div>' +
    '<div class="fg"><label>Pressao arterial</label><input type="text" id="av-press" placeholder="120/80"></div>' +
    '<div class="fg"><label>Objetivo atual</label><input type="text" id="av-obj" value="' + (alunoAtual.objetivo||'') + '"></div>' +
    '<div class="fg"><label>Observacoes</label><textarea id="av-obs" style="min-height:60px;"></textarea></div>' +
    '<div class="mod-actions"><button class="btn btn-ghost" onclick="closeModal(\'mod-av\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="salvarAvaliacao()">Salvar</button></div></div>';
  m.addEventListener('click', function(e) { if (e.target===m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-av');
}

async function salvarAvaliacao() {
  var peso = parseFloat(document.getElementById('av-peso').value)||null;
  var altura = parseFloat(document.getElementById('av-alt').value)||null;
  var cin = parseFloat(document.getElementById('av-cin').value)||null;
  var quad = parseFloat(document.getElementById('av-quad').value)||null;

  // Usa valores calculados automaticamente
  var imc = window._avIMC || (peso&&altura ? Math.round(peso/Math.pow(altura/100,2)*10)/10 : null);
  var gordura_pct = window._avGord || null;
  var cin_quad = window._avCQ || (cin&&quad ? Math.round(cin/quad*100)/100 : null);

  var data = {
    aluno_id: alunoAtual.id,
    data: document.getElementById('av-data').value,
    peso: peso,
    altura: altura,
    imc: imc,
    gordura_pct: gordura_pct,
    cin_quad: cin_quad,
    pressao: document.getElementById('av-press').value||null,
    objetivo: document.getElementById('av-obj').value||null,
    obs: document.getElementById('av-obs').value||null
  };

  var res = await sb.from('avaliacoes').insert(data);
  if (res.error) { toast('Erro ao salvar! Verifique a conexao.'); console.error(res.error); return; }
  if (peso) await sb.from('medidas').insert({ aluno_id: alunoAtual.id, data: data.data, peso: peso });

  // Limpa variaveis temporarias
  window._avIMC = null; window._avGord = null; window._avCQ = null;

  closeModal('mod-av');
  toast('Avaliacao salva!');
  alunoDetTab = 'progresso';
  loadDetTab();
}

function openNovaMedida() {
  var existing = document.getElementById('mod-med'); if (existing) existing.remove();
  var m = document.createElement('div'); m.className='mov'; m.id='mod-med';
  m.innerHTML =
    '<div class="mod"><div class="mod-handle"></div><h3>Registrar peso</h3>' +
    '<div class="fg"><label>Data</label><input type="date" id="med-data" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
    '<div class="fg"><label>Peso (kg)</label><input type="number" id="med-peso" step="0.1" placeholder="70.5" style="font-size:24px;text-align:center;font-weight:700;"></div>' +
    '<div class="mod-actions"><button class="btn btn-ghost" onclick="closeModal(\'mod-med\')">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="salvarMedida()">Salvar</button></div></div>';
  m.addEventListener('click', function(e) { if (e.target===m) m.classList.remove('on'); });
  document.body.appendChild(m);
  openModal('mod-med');
}

async function salvarMedida() {
  var peso = parseFloat(document.getElementById('med-peso').value);
  if (!peso) { toast('Digite o peso!'); return; }
  var res = await sb.from('medidas').insert({ aluno_id: alunoAtual.id, data: document.getElementById('med-data').value, peso: peso });
  if (res.error) { toast('Erro ao salvar!'); return; }
  closeModal('mod-med'); toast('Peso registrado!'); loadDetTab();
}

function calcStreak(execucoes) {
  if (!execucoes||!execucoes.length) return 0;
  var dates = execucoes.map(function(e){return e.data;}).filter(function(v,i,a){return a.indexOf(v)===i;});
  var streak = 0;
  var cur = new Date();
  for (var i=0; i<365; i++) {
    var d = cur.toISOString().split('T')[0];
    if (dates.indexOf(d)>=0) { streak++; }
    else if (i>0) { break; }
    cur.setDate(cur.getDate()-1);
  }
  return streak;
}

function diasDesde(dataISO) {
  if (!dataISO) return '--';
  var diff = Math.floor((new Date()-new Date(dataISO+'T12:00:00'))/86400000);
  if (diff===0) return 'Hoje';
  if (diff===1) return 'Ontem';
  return 'Ha ' + diff + 'd';
}

function mkDetStat(val, lbl, green) {
  return '<div class="card' + (green?' card-green':'') + '" style="padding:14px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:28px;font-weight:700;line-height:1;' + (green?'color:var(--green-pale);':'') + '">' + val + '</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:.05em;">' + lbl + '</div></div>';
}

function mkMedida(val, lbl) {
  return '<div style="background:var(--surf-high);border-radius:var(--rs);padding:10px;text-align:center;">' +
    '<div style="font-family:var(--font-display);font-size:18px;font-weight:700;">' + val + '</div>' +
    '<div style="font-size:10px;color:var(--muted);margin-top:2px;">' + lbl + '</div></div>';
}

function voltarAlunos() { alunoAtual = null; go('alunos'); }
function openNovoTreino() { toast('Montagem de treinos em breve!'); }
function editarTreino(id) { toast('Edicao de treino em breve!'); }
