import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeIdentifier(value: unknown): string {
  const identifier = String(value ?? '').trim().toLowerCase();
  if (!identifier || identifier.length > 180 || /[,()]/.test(identifier)) {
    return '';
  }
  return identifier;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido.' }, 405);
  }

  const requestId = crypto.randomUUID();
  let createdCodeId: string | null = null;

  try {
    const payload = await req.json().catch(() => ({}));
    const identifier = safeIdentifier(payload?.identifier);

    if (!identifier) {
      return json({ error: 'Informe seu usuário ou e-mail.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const gmailRelayUrl = Deno.env.get('GMAIL_RELAY_URL');
    const gmailRelaySecret = Deno.env.get('GMAIL_RELAY_SECRET');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`[${requestId}] Configuração interna do Supabase ausente.`);
      return json({ error: 'Serviço de recuperação indisponível.' }, 503);
    }

    if (!gmailRelayUrl || !gmailRelaySecret) {
      console.error(`[${requestId}] GMAIL_RELAY_URL ou GMAIL_RELAY_SECRET ausente.`);
      return json({ error: 'Serviço de e-mail ainda não configurado pelo administrador.' }, 503);
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    console.log(`[${requestId}] Solicitação recebida para recuperação de senha.`);

    const { data: user, error: userError } = await db
      .from('usuarios')
      .select('id,nome,usuario,email,ativo')
      .or(`usuario.ilike.${identifier},email.ilike.${identifier}`)
      .eq('ativo', true)
      .maybeSingle();

    if (userError) {
      console.error(`[${requestId}] Falha ao localizar usuário:`, userError);
      return json({ error: 'Não foi possível processar a solicitação.' }, 500);
    }

    // Resposta neutra: evita revelar se um usuário existe ou possui e-mail.
    if (!user?.id || !user?.email?.trim()) {
      console.log(`[${requestId}] Solicitação concluída com resposta neutra.`);
      return json({ ok: true, message: 'Se os dados estiverem cadastrados, o código será enviado por e-mail.' });
    }

    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count, error: countError } = await db
      .from('password_reset_codes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .gte('requested_at', oneMinuteAgo);

    if (countError) {
      console.error(`[${requestId}] Falha ao verificar limite de solicitações:`, countError);
      return json({ error: 'Não foi possível processar a solicitação.' }, 500);
    }

    if ((count ?? 0) > 0) {
      return json({ error: 'Aguarde um minuto antes de solicitar outro código.' }, 429);
    }

    const code = String(
      crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000,
    ).padStart(6, '0');
    const now = new Date().toISOString();

    // Invalida códigos anteriores ainda ativos para manter apenas um código válido.
    const { error: invalidateError } = await db
      .from('password_reset_codes')
      .update({ used_at: now })
      .eq('usuario_id', user.id)
      .is('used_at', null);

    if (invalidateError) {
      console.error(`[${requestId}] Falha ao invalidar códigos anteriores:`, invalidateError);
      return json({ error: 'Não foi possível gerar o código.' }, 500);
    }

    const { data: createdCode, error: insertError } = await db
      .from('password_reset_codes')
      .insert({
        usuario_id: user.id,
        code_hash: await sha256(code),
        expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !createdCode?.id) {
      console.error(`[${requestId}] Falha ao gravar código:`, insertError);
      return json({ error: 'Não foi possível gerar o código.' }, 500);
    }

    createdCodeId = createdCode.id;
    console.log(`[${requestId}] Código criado. Enviando ao Apps Script.`);

    const relayResponse = await fetch(gmailRelayUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: gmailRelaySecret,
        to: user.email.trim(),
        code,
        userName: user.nome || user.usuario || 'Usuário',
      }),
    });

    const relayText = await relayResponse.text();
    let relayResult: { ok?: boolean; error?: string };

    try {
      relayResult = JSON.parse(relayText);
    } catch {
      console.error(`[${requestId}] Resposta não JSON do Apps Script:`, relayText.slice(0, 500));
      throw new Error('O serviço de e-mail retornou uma resposta inválida.');
    }

    if (!relayResponse.ok || !relayResult.ok) {
      console.error(`[${requestId}] Apps Script recusou o envio:`, relayResult);
      throw new Error(relayResult.error || 'Não foi possível enviar o código por e-mail.');
    }

    console.log(`[${requestId}] E-mail enviado com sucesso.`);
    return json({ ok: true, message: 'Código enviado por e-mail.' });
  } catch (error) {
    console.error(`[${requestId}] Falha na recuperação de senha:`, error);

    if (createdCodeId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && serviceRoleKey) {
          const db = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await db
            .from('password_reset_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', createdCodeId);
        }
      } catch (cleanupError) {
        console.error(`[${requestId}] Falha ao invalidar código após erro:`, cleanupError);
      }
    }

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar o código por e-mail.',
      },
      502,
    );
  }
});
