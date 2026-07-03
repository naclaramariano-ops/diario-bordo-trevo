export async function sha256(text:string){const enc=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',enc);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')}
export function makeUsername(nome:string){const p=nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/\s+/).filter(Boolean);return p.length>1?`${p[0]}.${p[p.length-1]}`:p[0]||''}
export const uid=()=>crypto.randomUUID();
