import { supabase, supabaseConfigured } from '../../../services/supabase';

function ensureReady(){
  if(!supabaseConfigured) throw new Error('Serviço de recuperação indisponível.');
  if(!navigator.onLine) throw new Error('Conecte-se à internet para recuperar sua senha.');
}

export async function requestPasswordReset(identifier:string){
  ensureReady();
  const {data,error}=await supabase.functions.invoke('request-password-reset',{body:{identifier:identifier.trim()}});
  if(error) throw new Error(error.message||'Não foi possível enviar o código.');
  if(data?.error) throw new Error(data.error);
  return data;
}

export async function confirmPasswordReset(identifier:string,code:string,newPassword:string){
  ensureReady();
  const {data,error}=await supabase.functions.invoke('confirm-password-reset',{body:{identifier:identifier.trim(),code:code.trim(),newPassword}});
  if(error) throw new Error(error.message||'Não foi possível redefinir a senha.');
  if(data?.error) throw new Error(data.error);
  return data;
}
