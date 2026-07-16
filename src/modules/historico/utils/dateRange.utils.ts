export type HistoryMode='dia'|'semana'|'mes';
export function localIso(d:Date){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
export function startOfWeek(date:Date){const d=new Date(date);d.setHours(0,0,0,0);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d}
export function rangeFor(mode:HistoryMode,anchor:string){const base=new Date(`${anchor}T12:00:00`);let start:Date,end:Date,previousStart:Date,previousEnd:Date;
  if(mode==='dia'){start=new Date(base);start.setHours(0,0,0,0);end=new Date(start);end.setDate(end.getDate()+1);previousEnd=new Date(start);previousStart=new Date(start);previousStart.setDate(previousStart.getDate()-1)}
  else if(mode==='semana'){start=startOfWeek(base);end=new Date(start);end.setDate(end.getDate()+7);previousEnd=new Date(start);previousStart=new Date(start);previousStart.setDate(previousStart.getDate()-7)}
  else{start=new Date(base.getFullYear(),base.getMonth(),1);end=new Date(base.getFullYear(),base.getMonth()+1,1);previousStart=new Date(base.getFullYear(),base.getMonth()-1,1);previousEnd=new Date(base.getFullYear(),base.getMonth(),1)}
  const includes=(value:string)=>{const d=new Date(`${value.slice(0,10)}T12:00:00`);return d>=start&&d<end};
  const includesPrevious=(value:string)=>{const d=new Date(`${value.slice(0,10)}T12:00:00`);return d>=previousStart&&d<previousEnd};
  return{start,end,previousStart,previousEnd,includes,includesPrevious};}
export function labelRange(mode:HistoryMode,anchor:string){const r=rangeFor(mode,anchor),fmt=(d:Date)=>d.toLocaleDateString('pt-BR');if(mode==='dia')return fmt(r.start);if(mode==='semana'){const e=new Date(r.end);e.setDate(e.getDate()-1);return`${fmt(r.start)} a ${fmt(e)}`}return r.start.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
