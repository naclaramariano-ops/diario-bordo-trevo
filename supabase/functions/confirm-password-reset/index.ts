const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});

import{createClient}from'https://esm.sh/@supabase/supabase-js@2.57.4';
async function sha256(value:string){const data=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});try{
  const{identifier,code,newPassword}=await req.json();if(!identifier||!/^\\d{6}$/.test(code||'')||String(newPassword||'').length<6)return json({error:'Dados de redefinição inválidos.'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});const q=identifier.trim().toLowerCase();
  const{data:user}=await db.from('usuarios').select('id').or(`usuario.ilike.${q},email.ilike.${q}`).eq('ativo',true).maybeSingle();if(!user)return json({error:'Código inválido ou expirado.'},400);
  const{data:token}=await db.from('password_reset_codes').select('*').eq('usuario_id',user.id).is('used_at',null).gt('expires_at',new Date().toISOString()).order('requested_at',{ascending:false}).limit(1).maybeSingle();
  if(!token||token.attempts>=5)return json({error:'Código inválido ou expirado.'},400);
  if(token.code_hash!==await sha256(code)){await db.from('password_reset_codes').update({attempts:token.attempts+1}).eq('id',token.id);return json({error:'Código inválido ou expirado.'},400)}
  await db.from('usuarios').update({senha_hash:await sha256(newPassword),trocar_senha:false,atualizado_em:new Date().toISOString()}).eq('id',user.id);await db.from('password_reset_codes').update({used_at:new Date().toISOString()}).eq('id',token.id);return json({ok:true});
}catch(e){console.error(e);return json({error:'Falha ao redefinir a senha.'},500)}});
