const DBT_API = (() => {
  const cfg = () => window.DBT_CONFIG || {};
  const configured = () => cfg().SUPABASE_URL && !cfg().SUPABASE_URL.includes('COLE_AQUI') && cfg().SUPABASE_ANON_KEY && !cfg().SUPABASE_ANON_KEY.includes('COLE_AQUI');
  const base = () => cfg().SUPABASE_URL.replace(/\/$/,'') + '/rest/v1';
  const headers = (extra={}) => ({
    apikey: cfg().SUPABASE_ANON_KEY,
    Authorization: `Bearer ${cfg().SUPABASE_ANON_KEY}`,
    'Content-Type':'application/json',
    Prefer: 'return=representation',
    ...extra
  });
  async function request(path, opts={}){
    if(!configured()) throw new Error('Supabase não configurado');
    const res = await fetch(base()+path, {...opts, headers: headers(opts.headers||{})});
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if(!res.ok) throw new Error((data && (data.message || data.details)) || text || `Erro HTTP ${res.status}`);
    return data;
  }
  const select = (table, query='select=*') => request(`/${table}?${query}`, {method:'GET'});
  const insert = (table, rows) => request(`/${table}`, {method:'POST', body:JSON.stringify(rows)});
  const update = (table, id, patch) => request(`/${table}?id=eq.${encodeURIComponent(id)}`, {method:'PATCH', body:JSON.stringify(patch)});
  const upsert = (table, rows) => request(`/${table}`, {method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=representation'}, body:JSON.stringify(rows)});
  return {configured, select, insert, update, upsert};
})();
