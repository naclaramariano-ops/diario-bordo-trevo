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

  try {
    const payload = await req.json().catch(() => ({}));
    const identifier = safeIdentifier(payload?.identifier);
    const code = String(payload?.code ?? '').trim();
    const newPassword = String(payload?.newPassword ?? '');

    if (!identifier || !/^\d{6}$/.test(code)) {
      return json({ error: 'Informe um código válido de 6 dígitos.' }, 400);
    }

    if (newPassword.length < 6) {
      return json({ error: 'A nova senha precisa ter no mínimo 6 caracteres.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`[${requestId}] Configuração interna do Supabase ausente.`);
      return json({ error: 'Serviço de recuperação indisponível.' }, 503);
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: user, error: userError } = await db
      .from('usuarios')
      .select('id')
      .or(`usuario.ilike.${identifier},email.ilike.${identifier}`)
      .eq('ativo', true)
      .maybeSingle();

    if (userError || !user?.id) {
      console.error(`[${requestId}] Usuário não localizado ou consulta falhou:`, userError);
      return json({ error: 'Código inválido ou expirado.' }, 400);
    }

    const { data: token, error: tokenError } = await db
      .from('password_reset_codes')
      .select('id,code_hash,expires_at,attempts,used_at')
      .eq('usuario_id', user.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !token || Number(token.attempts ?? 0) >= 5) {
      console.error(`[${requestId}] Código inexistente, expirado ou bloqueado:`, tokenError);
      return json({ error: 'Código inválido ou expirado.' }, 400);
    }

    const receivedHash = await sha256(code);
    if (token.code_hash !== receivedHash) {
      const attempts = Number(token.attempts ?? 0) + 1;
      await db
        .from('password_reset_codes')
        .update({ attempts })
        .eq('id', token.id);

      return json({ error: 'Código inválido ou expirado.' }, 400);
    }

    const now = new Date().toISOString();
    const { error: passwordError } = await db
      .from('usuarios')
      .update({
        senha_hash: await sha256(newPassword),
        trocar_senha: false,
        atualizado_em: now,
      })
      .eq('id', user.id);

    if (passwordError) {
      console.error(`[${requestId}] Falha ao atualizar senha:`, passwordError);
      return json({ error: 'Não foi possível alterar a senha.' }, 500);
    }

    const { error: useError } = await db
      .from('password_reset_codes')
      .update({ used_at: now })
      .eq('id', token.id);

    if (useError) {
      console.error(`[${requestId}] Senha alterada, mas falhou ao invalidar código:`, useError);
    }

    console.log(`[${requestId}] Senha redefinida com sucesso.`);
    return json({ ok: true, message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error(`[${requestId}] Falha ao redefinir senha:`, error);
    return json({ error: 'Falha ao redefinir a senha.' }, 500);
  }
});
