-- RESET DE USUÁRIOS - Diário de Bordo Trevo
-- Mantém somente Ana Peliteiro como Administradora.

delete from public.usuarios;

insert into public.usuarios
  (nome, email, senha_hash, setor, cargo, perfil, ativo)
values
  (
    'Ana Peliteiro',
    'ana.peliteiro@trevolacteos.com.br',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'Administrativo',
    'Administrador',
    'administrador',
    true
  );
