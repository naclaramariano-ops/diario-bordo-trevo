/* Diário de Bordo Trevo V7 - Supabase + Cloudflare Pages + PWA offline com fila de sincronização */
const CONFIG = {
  SUPABASE_URL: "https://mgzuperkjychsfuptrhi.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_2t3UMKR_vCTAP1_a7heeUQ_KbEP0zmF",
};

const STORE = {
  user: 'tf_user_v7',
  cache: 'tf_cache_v7',
  queue: 'tf_sync_queue_v7',
  lastSync: 'tf_last_sync_v7'
};

let sb = null;
let state = { user:null, tab:'hoje', diarios:[], setores:[], maquinas:[], usuarios:[], filtroArea:null, editingUser:null, editingSetor:null, editingMaquina:null };
const $ = s => document.querySelector(s);
const app = $('#app');
const today = () => new Date().toISOString().slice(0,10);
const weekStart = () => { const d=new Date(); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.toISOString().slice(0,10); };
const online = () => navigator.onLine;
const readySupabase = () => CONFIG.SUPABASE_URL.startsWith('http') && CONFIG.SUPABASE_ANON_KEY.length > 20;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'local-' + Date.now() + '-' + Math.random().toString(16).slice(2));

function getQueue(){ return JSON.parse(localStorage.getItem(STORE.queue) || '[]'); }
function setQueue(q){ localStorage.setItem(STORE.queue, JSON.stringify(q)); }
function getCache(){ return JSON.parse(localStorage.getItem(STORE.cache) || '{"usuarios":[],"setores":[],"maquinas":[],"diarios":[]}'); }
function setCache(){ localStorage.setItem(STORE.cache, JSON.stringify({usuarios:state.usuarios,setores:state.setores,maquinas:state.maquinas,diarios:state.diarios})); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),3200); }
function brDate(s){ return s ? s.split('-').reverse().join('/') : ''; }

async function init(){
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  if (readySupabase() && window.supabase) sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  const cached = getCache(); state.usuarios=cached.usuarios||[]; state.setores=cached.setores||[]; state.maquinas=cached.maquinas||[]; state.diarios=cached.diarios||[];
  const u=localStorage.getItem(STORE.user); state.user=u?JSON.parse(u):null;
  window.addEventListener('online', () => { toast('Internet voltou. Sincronizando...'); syncNow(); });
  window.addEventListener('offline', () => { toast('Modo offline ativado. O preenchimento será salvo no aparelho.'); render(); });
  render();
  if (sb && state.user && online()) await loadAll(true);
}

function shell(content){
  const pending = getQueue().length;
  const last = localStorage.getItem(STORE.lastSync) || 'Nunca';
  return `<div class="phone">
    <div class="top"><div class="row"><button class="logo" onclick="openAdminMenu()">DB</button><div class="title"><h1>Diário de Bordo Trevo</h1><p>Diário de bordo • PWA offline</p></div></div><button class="avatar" onclick="logout()">${state.user?.nome?.split(' ')[0]||'Sair'}</button></div>
    <div class="statusbar"><span class="status ${online()?'online':'offline'}">${online()?'Online':'Offline'}</span><span class="status pending">${pending} pendente(s)</span><span class="status">Últ. sync: ${last}</span></div>
    ${content}
  </div>${tabs()}`;
}
function tabs(){ const tabs=[['hoje','🏠','Hoje'],['novo','➕','Novo'],['historico','📚','Histórico'],['semana','📊','Semana'],['mais','⚙️','Mais']]; return `<div class="tabs"><div class="tabs-inner">${tabs.map(t=>`<button class="tab ${state.tab===t[0]?'active':''}" onclick="go('${t[0]}')"><i>${t[1]}</i>${t[2]}</button>`).join('')}</div></div>`; }
function render(){ if(!state.user) return renderLogin(); if(!sb && readySupabase() && window.supabase) sb=supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY); if(!readySupabase()) return renderSetup(); if(state.tab==='hoje') return renderHoje(); if(state.tab==='novo') return renderNovo(); if(state.tab==='historico') return renderHistorico(); if(state.tab==='semana') return renderSemana(); if(state.tab==='mais') return renderMais(); if(state.tab==='usuarios') return renderUsuarios(); if(state.tab==='setores') return renderSetores(); }
function go(t){ state.tab=t; state.filtroArea=null; render(); }

function renderLogin(){
  app.innerHTML = `<div class="login"><div class="login-card"><div class="logo">DB</div><h1>Diário de Bordo Trevo</h1><p style="color:var(--muted)">Diário de bordo mobile com Supabase, Cloudflare Pages e PWA offline.</p>${!readySupabase()?'<div class="notice">Antes de logar, configure a URL e a anon key no arquivo <b>assets/app.js</b>.</div>':''}<div class="field"><label>E-mail</label><input id="email" value="admin@trevolacteos.com.br"></div><div class="field"><label>Senha</label><input id="senha" type="password" value="admin123"></div><button class="btn" onclick="login()">Entrar</button></div></div>`;
}
async function login(){
  if(!readySupabase()) return alert('Configure o Supabase primeiro em assets/app.js');
  if(!sb) sb=supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);
  const email=$('#email').value.trim(); const senha=$('#senha').value;
  if(online()){
    const {data,error}=await sb.from('usuarios').select('*').eq('email',email).eq('senha_demo',senha).eq('ativo',true).maybeSingle();
    if(error||!data) return alert('Login inválido ou usuário inativo.');
    state.user=data; localStorage.setItem(STORE.user,JSON.stringify(data)); await loadAll(true); return;
  }
  const u=state.usuarios.find(x=>x.email===email && x.senha_demo===senha && x.ativo);
  if(!u) return alert('Offline: só é possível entrar com usuário já sincronizado neste aparelho.');
  state.user=u; localStorage.setItem(STORE.user,JSON.stringify(u)); render();
}
function logout(){ localStorage.removeItem(STORE.user); state.user=null; renderLogin(); }
function renderSetup(){ app.innerHTML=shell(`<div class="card"><h2>Supabase não configurado</h2><p>Abra <b>assets/app.js</b> e cole a URL e a anon key do seu projeto Supabase.</p></div>`); }

async function loadAll(show=false){
  if(!sb || !online()) { render(); return; }
  await syncNow(false);
  const [u,s,m,d] = await Promise.all([
    sb.from('usuarios').select('*').order('nome'),
    sb.from('setores').select('*').order('nome'),
    sb.from('maquinas').select('*,setores(nome)').order('nome'),
    sb.from('diarios').select('*,diario_maquinas(*)').order('criado_em',{ascending:false}).limit(500)
  ]);
  state.usuarios=u.data||state.usuarios; state.setores=s.data||state.setores; state.maquinas=m.data||state.maquinas; state.diarios=d.data||state.diarios;
  setCache(); localStorage.setItem(STORE.lastSync, new Date().toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}));
  if(show) toast('Dados sincronizados.'); render();
}

async function syncNow(show=true){
  if(!sb || !online()) { if(show) toast('Sem internet. Dados continuam salvos no aparelho.'); render(); return; }
  let q=getQueue(); if(!q.length){ if(show) toast('Nada pendente para sincronizar.'); render(); return; }
  const remaining=[];
  for(const job of q){
    try{
      if(job.type==='insert_diario'){
        const payload={...job.diario}; delete payload.id; delete payload.local_only; delete payload.sync_status;
        const {data,error}=await sb.from('diarios').insert(payload).select('id').single(); if(error) throw error;
        const diario_id=data.id;
        const maquinas=(job.maquinas||[]).map(x=>({...x, diario_id}));
        if(maquinas.length){ const {error:e2}=await sb.from('diario_maquinas').insert(maquinas); if(e2) throw e2; }
        state.diarios=state.diarios.filter(d=>d.id!==job.local_id);
      }
      if(job.type==='upsert_user'){
        const row={...job.row}; const id=row.id; delete row.id; const res=id?await sb.from('usuarios').update(row).eq('id',id):await sb.from('usuarios').insert(row); if(res.error) throw res.error;
      }
      if(job.type==='upsert_setor'){
        const row={...job.row}; const id=row.id; delete row.id; const res=id?await sb.from('setores').update(row).eq('id',id):await sb.from('setores').insert(row); if(res.error) throw res.error;
      }
      if(job.type==='upsert_maquina'){
        const row={...job.row}; const id=row.id; delete row.id; const res=id?await sb.from('maquinas').update(row).eq('id',id):await sb.from('maquinas').insert(row); if(res.error) throw res.error;
      }
    } catch(err){ console.warn('sync fail', job, err); remaining.push(job); }
  }
  setQueue(remaining); setCache();
  if(show) toast(remaining.length ? `${remaining.length} item(ns) ainda pendente(s).` : 'Sincronização concluída.');
  if(!remaining.length) await loadAll(false); else render();
}

function counts(area=null){ const base=area?state.diarios.filter(d=>d.setor===area):state.diarios; return {hoje:base.filter(d=>d.data===today()).length, semana:base.filter(d=>d.data>=weekStart()).length, total:base.length}; }
function renderHoje(){ const c=counts(); const areas=['Envase 1','Envase 2','Processo']; app.innerHTML=shell(`<div class="grid three"><div class="card kpi"><span>Hoje</span><strong>${c.hoje}</strong><small>registros</small></div><div class="card kpi"><span>Semana</span><strong>${c.semana}</strong><small>desde segunda</small></div><div class="card kpi"><span>Total</span><strong>${c.total}</strong><small>histórico</small></div></div><h2 class="section-title">Comunicação rápida por área</h2><div class="grid three">${areas.map(a=>{let x=counts(a); return `<button class="area-card" onclick="filterArea('${a}')"><b>${a}</b><small>${x.hoje} hoje<br>${x.semana} semana</small></button>`}).join('')}</div><h2 class="section-title">Últimas passagens</h2><div class="list">${listItems(state.diarios.slice(0,8))}</div>`); }
function filterArea(a){ state.filtroArea=a; state.tab='historico'; render(); }
function listItems(list){ if(!list.length) return `<div class="card empty">Nenhum registro encontrado.</div>`; return list.map(d=>`<button class="item" onclick="openDetail('${d.id}')"><div class="row"><h3>${d.setor} • ${d.turno}</h3><span class="badge ${d.local_only?'local':d.status_turno==='Crítico'?'bad':d.status_turno==='Atenção'?'warn':'ok'}">${d.local_only?'Pendente':d.status_turno}</span></div><p><b>${brDate(d.data)}</b> • ${d.lider_nome}</p><p>${(d.pendencias||'').slice(0,130)}</p></button>`).join(''); }
function activeSetores(){ return state.setores.filter(s=>s.ativo); }
function activeLideres(){ return state.usuarios.filter(u=>u.ativo && (u.cargo||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes('lider')); }
function setorIdByName(nome){ return state.setores.find(s=>s.nome===nome)?.id; }
function maquinasBySetorName(nome){ const id=setorIdByName(nome); return state.maquinas.filter(m=>m.ativo && m.setor_id===id); }

function renderNovo(){
  const setores=activeSetores(); const lideres=activeLideres();
  app.innerHTML=shell(`<form class="card" onsubmit="salvarDiario(event)"><h2>Novo diário</h2><p style="color:var(--muted)">Todos os campos são obrigatórios. Se não houve ocorrência, escreva: <b>Sem ocorrência</b>.</p><div class="split"><div class="field"><label>Data</label><input required type="date" name="data" value="${today()}"></div><div class="field"><label>Turno</label><select required name="turno"><option>1º Turno</option><option>2º Turno</option><option>3º Turno</option></select></div></div><div class="field"><label>Setor preenchido</label><select required name="setor" id="setorForm" onchange="renderMachineFields()">${setores.map(s=>`<option>${s.nome}</option>`).join('')}</select></div><div class="field"><label>Líder responsável</label><select required name="lider_id">${lideres.map(u=>`<option value="${u.id}">${u.nome} — ${u.setor}</option>`).join('')}</select></div><div class="field"><label>Status geral do turno</label><select required name="status_turno"><option>Normal</option><option>Atenção</option><option>Crítico</option></select></div>${text('absenteismo','Absenteísmo / equipe do turno')}${text('seguranca','Segurança / SSMA')}${text('qualidade','Qualidade / BPF / liberação')}${text('producao','Produção / ritmo / OEE')}${text('manutencao','Manutenção / intervenções')}${text('materiais','Materiais / insumos / logística')}${text('limpeza_organizacao','Limpeza e organização')}<h2 class="section-title">Máquinas do setor</h2><div id="machineFields"></div>${text('pendencias','Pendências para o próximo turno')}${text('prioridades_proximo_turno','Prioridades do próximo turno')}${text('observacoes_gerais','Observações gerais')}<button class="btn">Salvar diário</button></form>`); setTimeout(renderMachineFields,0);
}
function text(name,label){ return `<div class="field"><label>${label}</label><textarea required name="${name}" placeholder="Preencha de forma objetiva."></textarea></div>`; }
function renderMachineFields(){ const setor=$('#setorForm')?.value; const wrap=$('#machineFields'); if(!wrap) return; const ms=maquinasBySetorName(setor); if(!ms.length){ wrap.innerHTML='<div class="notice">Nenhuma máquina ativa cadastrada para este setor.</div><input type="hidden" name="machine_count" value="0">'; return; } wrap.innerHTML=ms.map((m,i)=>`<div class="machine-block"><h3>${m.nome}</h3><input type="hidden" name="maq_nome_${i}" value="${m.nome}"><div class="split"><div class="field"><label>Produto</label><input required name="produto_${i}" placeholder="Produto"></div><div class="field"><label>Ordem / lote</label><input required name="ordem_${i}" placeholder="OP ou lote"></div></div><div class="field"><label>Status da máquina</label><select required name="status_maquina_${i}"><option>Produzindo</option><option>Parada</option><option>Setup</option><option>Higienização</option><option>Sem programação</option></select></div><div class="split"><div class="field"><label>Volume programado</label><input required name="volume_programado_${i}" placeholder="Ex.: 10.000 un"></div><div class="field"><label>Volume realizado</label><input required name="volume_realizado_${i}" placeholder="Ex.: 8.500 un"></div></div><div class="field"><label>Paradas / desvios</label><textarea required name="paradas_${i}" placeholder="Se não houve: Sem ocorrência."></textarea></div><div class="field"><label>Perdas / retrabalho</label><textarea required name="perdas_${i}" placeholder="Se não houve: Sem ocorrência."></textarea></div><div class="field"><label>Observação para passagem</label><textarea required name="observacao_${i}" placeholder="O que o próximo turno precisa saber?"></textarea></div></div>`).join('')+`<input type="hidden" name="machine_count" value="${ms.length}">`; }
async function salvarDiario(e){
  e.preventDefault(); const f=new FormData(e.target); const lider=state.usuarios.find(u=>u.id===f.get('lider_id'));
  const local_id='local-'+uid();
  const diario={ id:local_id, data:f.get('data'), turno:f.get('turno'), setor:f.get('setor'), lider_id:f.get('lider_id'), lider_nome:lider?.nome||'Não informado', status_turno:f.get('status_turno'), absenteismo:f.get('absenteismo'), seguranca:f.get('seguranca'), qualidade:f.get('qualidade'), producao:f.get('producao'), manutencao:f.get('manutencao'), materiais:f.get('materiais'), limpeza_organizacao:f.get('limpeza_organizacao'), pendencias:f.get('pendencias'), prioridades_proximo_turno:f.get('prioridades_proximo_turno'), observacoes_gerais:f.get('observacoes_gerais'), criado_em:new Date().toISOString(), local_only:true };
  const count=Number(f.get('machine_count')||0); const maquinas=[];
  for(let i=0;i<count;i++){ maquinas.push({ maquina_nome:f.get(`maq_nome_${i}`), produto:f.get(`produto_${i}`), ordem:f.get(`ordem_${i}`), status_maquina:f.get(`status_maquina_${i}`), volume_programado:f.get(`volume_programado_${i}`), volume_realizado:f.get(`volume_realizado_${i}`), paradas:f.get(`paradas_${i}`), perdas:f.get(`perdas_${i}`), observacao:f.get(`observacao_${i}`) }); }
  state.diarios=[{...diario, diario_maquinas:maquinas}, ...state.diarios]; setCache();
  const q=getQueue(); q.push({type:'insert_diario', local_id, diario, maquinas}); setQueue(q);
  toast(online()?'Diário salvo. Sincronizando...':'Diário salvo offline. Será sincronizado quando a internet voltar.'); state.tab='hoje'; render(); if(online()) await syncNow(false);
}

function renderHistorico(){ const list=state.filtroArea?state.diarios.filter(d=>d.setor===state.filtroArea):state.diarios; app.innerHTML=shell(`<div class="card"><h2>Histórico ${state.filtroArea?'- '+state.filtroArea:''}</h2><p style="color:var(--muted)">Registros diários por turno. Funciona também com os registros offline ainda pendentes.</p></div>${listItems(list)}`); }
function renderSemana(){ const start=weekStart(); const list=state.diarios.filter(d=>d.data>=start); const byArea=['Envase 1','Envase 2','Processo'].map(a=>({a,c:list.filter(d=>d.setor===a).length})); app.innerHTML=shell(`<div class="card"><h2>Compilado semanal</h2><p>Semana iniciada em <b>${brDate(start)}</b>.</p></div><div class="grid three">${byArea.map(x=>`<div class="card kpi"><span>${x.a}</span><strong>${x.c}</strong><small>registros</small></div>`).join('')}</div><div class="card"><h2>Pendências da semana</h2>${list.map(d=>`<p><b>${brDate(d.data)} • ${d.setor} • ${d.turno}</b><br>${d.pendencias}</p>`).join('')||'<p>Nenhuma pendência.</p>'}</div>`); }
function renderMais(){ app.innerHTML=shell(`<div class="card"><h2>Mais</h2><button class="btn" onclick="syncNow(true)">Sincronizar agora</button><button class="btn secondary" onclick="loadAll(true)" style="margin-top:10px">Atualizar dados do Supabase</button><button class="btn secondary" onclick="openAdminMenu()" style="margin-top:10px">Cadastros administrativos</button><button class="btn secondary" onclick="logout()" style="margin-top:10px">Sair</button></div><div class="notice"><b>Offline:</b> o app salva novos diários no aparelho e envia ao Supabase quando a internet voltar. Para entrar offline, o usuário já precisa ter logado uma vez neste celular.</div>`); }
function openAdminMenu(){ const div=document.createElement('div'); div.className='admin-menu'; div.innerHTML=`<div class="admin-sheet"><h2>Administração</h2><button class="btn" onclick="this.closest('.admin-menu').remove(); state.tab='usuarios'; render();">Cadastro de usuários</button><button class="btn" onclick="this.closest('.admin-menu').remove(); state.tab='setores'; render();">Cadastro de setores e máquinas</button><button class="btn secondary" onclick="this.closest('.admin-menu').remove();">Fechar</button></div>`; document.body.appendChild(div); }

function renderUsuarios(){ const e=state.editingUser; app.innerHTML=shell(`<div class="desktop-grid"><div class="card"><h2>${e?'Editar':'Cadastrar'} usuário</h2><form onsubmit="saveUser(event)"><input type="hidden" name="id" value="${e?.id||''}"><div class="field"><label>Nome</label><input required name="nome" value="${e?.nome||''}"></div><div class="field"><label>E-mail</label><input required name="email" value="${e?.email||''}"></div><div class="split"><div class="field"><label>Setor</label><input required name="setor" value="${e?.setor||''}"></div><div class="field"><label>Cargo</label><input required name="cargo" value="${e?.cargo||'Líder'}"></div></div><div class="split"><div class="field"><label>Perfil</label><select required name="perfil"><option ${e?.perfil==='lider'?'selected':''}>lider</option><option ${e?.perfil==='admin'?'selected':''}>admin</option></select></div><div class="field"><label>Status</label><select required name="ativo"><option value="true" ${e?.ativo!==false?'selected':''}>Ativo</option><option value="false" ${e?.ativo===false?'selected':''}>Inativo</option></select></div></div><div class="field"><label>Senha</label><input required name="senha_demo" value="${e?.senha_demo||'123456'}"></div><button class="btn">Salvar usuário</button></form></div><div class="card"><h2>Usuários</h2><table class="admin-table">${state.usuarios.map(u=>`<tr><td><b>${u.nome}</b><br><small>${u.email}</small></td><td>${u.setor}<br><small>${u.cargo} • ${u.ativo?'Ativo':'Inativo'}</small></td><td><button class="btn small secondary" onclick="editUser('${u.id}')">Editar</button></td></tr>`).join('')}</table></div></div>`); }
function editUser(id){ state.editingUser=state.usuarios.find(u=>u.id===id); render(); }
async function saveUser(e){ e.preventDefault(); const f=Object.fromEntries(new FormData(e.target)); f.ativo=f.ativo==='true'; const id=f.id || ''; if(!id) f.id=uid(); const row={...f}; state.usuarios=id?state.usuarios.map(u=>u.id===id?row:u):[row,...state.usuarios]; setCache(); const q=getQueue(); q.push({type:'upsert_user', row}); setQueue(q); state.editingUser=null; toast('Usuário salvo. Sincronização pendente/automática.'); render(); if(online()) await syncNow(false); }
function renderSetores(){ const es=state.editingSetor, em=state.editingMaquina; app.innerHTML=shell(`<div class="desktop-grid"><div class="card"><h2>${es?'Editar':'Cadastrar'} setor</h2><form onsubmit="saveSetor(event)"><input type="hidden" name="id" value="${es?.id||''}"><div class="field"><label>Nome do setor</label><input required name="nome" value="${es?.nome||''}"></div><div class="field"><label>Status</label><select name="ativo"><option value="true" ${es?.ativo!==false?'selected':''}>Ativo</option><option value="false" ${es?.ativo===false?'selected':''}>Inativo</option></select></div><button class="btn">Salvar setor</button></form></div><div class="card"><h2>${em?'Editar':'Cadastrar'} máquina</h2><form onsubmit="saveMaquina(event)"><input type="hidden" name="id" value="${em?.id||''}"><div class="field"><label>Setor</label><select name="setor_id">${state.setores.map(s=>`<option value="${s.id}" ${em?.setor_id===s.id?'selected':''}>${s.nome}</option>`).join('')}</select></div><div class="field"><label>Máquina</label><input required name="nome" value="${em?.nome||''}"></div><div class="field"><label>Status</label><select name="ativo"><option value="true" ${em?.ativo!==false?'selected':''}>Ativa</option><option value="false" ${em?.ativo===false?'selected':''}>Inativa</option></select></div><button class="btn">Salvar máquina</button></form></div></div><div class="card"><h2>Setores</h2>${state.setores.map(s=>`<p class="row"><span><b>${s.nome}</b><br><small>${s.ativo?'Ativo':'Inativo'}</small></span><button class="btn small secondary" onclick="editSetor('${s.id}')">Editar</button></p>`).join('')}</div><div class="card"><h2>Máquinas</h2>${state.maquinas.map(m=>`<p class="row"><span><b>${m.nome}</b><br><small>${state.setores.find(s=>s.id===m.setor_id)?.nome||m.setores?.nome||''} • ${m.ativo?'Ativa':'Inativa'}</small></span><button class="btn small secondary" onclick="editMaquina('${m.id}')">Editar</button></p>`).join('')}</div>`); }
function editSetor(id){ state.editingSetor=state.setores.find(s=>s.id===id); render(); }
function editMaquina(id){ state.editingMaquina=state.maquinas.find(m=>m.id===id); render(); }
async function saveSetor(e){ e.preventDefault(); const f=Object.fromEntries(new FormData(e.target)); f.ativo=f.ativo==='true'; const id=f.id || ''; if(!id) f.id=uid(); const row={...f}; state.setores=id?state.setores.map(s=>s.id===id?row:s):[row,...state.setores]; setCache(); const q=getQueue(); q.push({type:'upsert_setor', row}); setQueue(q); state.editingSetor=null; toast('Setor salvo. Sincronização pendente/automática.'); render(); if(online()) await syncNow(false); }
async function saveMaquina(e){ e.preventDefault(); const f=Object.fromEntries(new FormData(e.target)); f.ativo=f.ativo==='true'; const id=f.id || ''; if(!id) f.id=uid(); const row={...f}; state.maquinas=id?state.maquinas.map(m=>m.id===id?row:m):[row,...state.maquinas]; setCache(); const q=getQueue(); q.push({type:'upsert_maquina', row}); setQueue(q); state.editingMaquina=null; toast('Máquina salva. Sincronização pendente/automática.'); render(); if(online()) await syncNow(false); }
function openDetail(id){ const d=state.diarios.find(x=>x.id===id); if(!d) return; const ms=d.diario_maquinas||[]; app.innerHTML=shell(`<div class="card"><button class="btn small secondary" onclick="render()">Voltar</button><h2>${d.setor} • ${d.turno}</h2><p>${brDate(d.data)} • ${d.lider_nome}</p><span class="badge ${d.local_only?'local':d.status_turno==='Crítico'?'bad':d.status_turno==='Atenção'?'warn':'ok'}">${d.local_only?'Pendente de sync':d.status_turno}</span></div><div class="card"><h3>Resumo do turno</h3>${['absenteismo','seguranca','qualidade','producao','manutencao','materiais','limpeza_organizacao','pendencias','prioridades_proximo_turno','observacoes_gerais'].map(k=>`<p><b>${label(k)}</b><br>${d[k]||''}</p>`).join('')}</div><div class="card"><h3>Máquinas</h3>${ms.map(m=>`<div class="machine-block"><h3>${m.maquina_nome}</h3><p><b>Produto:</b> ${m.produto} • <b>Ordem:</b> ${m.ordem}</p><p><b>Status:</b> ${m.status_maquina}</p><p><b>Programado:</b> ${m.volume_programado} • <b>Realizado:</b> ${m.volume_realizado}</p><p><b>Paradas:</b> ${m.paradas}</p><p><b>Perdas:</b> ${m.perdas}</p><p><b>Obs.:</b> ${m.observacao}</p></div>`).join('')}</div>`); }
function label(k){ return ({absenteismo:'Absenteísmo / equipe',seguranca:'Segurança / SSMA',qualidade:'Qualidade / BPF',producao:'Produção / OEE',manutencao:'Manutenção',materiais:'Materiais / logística',limpeza_organizacao:'Limpeza e organização',pendencias:'Pendências',prioridades_proximo_turno:'Prioridades próximo turno',observacoes_gerais:'Observações gerais'})[k]||k; }

init();
