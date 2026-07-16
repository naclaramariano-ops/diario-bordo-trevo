const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});

import{createClient}from'https://esm.sh/@supabase/supabase-js@2.57.4';
async function sha256(value:string){const data=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});try{
  const{identifier}=await req.json();if(!identifier?.trim())return json({error:'Informe seu usuário ou e-mail.'},400);
  const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,resend=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('PASSWORD_RESET_FROM_EMAIL')||'Diário de Bordo <onboarding@resend.dev>';
  if(!resend)return json({error:'Serviço de e-mail ainda não configurado pelo administrador.'},503);
  const db=createClient(url,service,{auth:{persistSession:false}});const q=identifier.trim().toLowerCase();
  const{data:user}=await db.from('usuarios').select('id,nome,usuario,email,ativo').or(`usuario.ilike.${q},email.ilike.${q}`).eq('ativo',true).maybeSingle();
  // resposta neutra evita revelar usuários existentes
  if(!user?.email)return json({ok:true});
  const since=new Date(Date.now()-60000).toISOString();const{count}=await db.from('password_reset_codes').select('id',{count:'exact',head:true}).eq('usuario_id',user.id).gte('requested_at',since);if((count||0)>0)return json({error:'Aguarde um minuto antes de solicitar outro código.'},429);
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
  await db.from('password_reset_codes').insert({usuario_id:user.id,code_hash:await sha256(code),expires_at:new Date(Date.now()+10*60*1000).toISOString()});
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resend}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[user.email],subject:'Código para redefinir sua senha',html:`<div style="font-family:Arial,sans-serif;color:#10243b"><h2>Diário de Bordo Trevo</h2><p>Olá, ${user.nome}.</p><p>Seu código de recuperação é:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>O código expira em 10 minutos. Se você não solicitou, ignore este e-mail.</p></div>`})});
  if(!response.ok){console.error(await response.text());return json({error:'Não foi possível enviar o e-mail agora.'},502)}return json({ok:true});
}catch(e){console.error(e);return json({error:'Falha ao solicitar recuperação de senha.'},500)}});
