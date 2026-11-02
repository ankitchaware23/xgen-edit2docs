const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export function getKeys(){try{return JSON.parse(sessionStorage.getItem('xgen-keys')||'{}')}catch{return {}}}
export function setKeys(keys){sessionStorage.setItem('xgen-keys',JSON.stringify(keys))}
function headers(extra={}){const k=getKeys();return {...(k.backend?{Authorization:`Bearer ${k.backend}`} : {}),...(k.anthropic?{'X-Anthropic-API-Key':k.anthropic}:{}),'Accept-Language':'en-US',...extra}}
export async function api(path,opts={}){
  const response=await fetch(`${BASE}${path}`,{...opts,headers:headers(opts.body instanceof FormData?opts.headers:{'Content-Type':'application/json',...opts.headers})});
  if(!response.ok){let error;try{error=await response.json()}catch{error={detail:await response.text()}};const d=error.detail||error;throw new Error(typeof d==='string'?d:(d.message_en||d.message||JSON.stringify(d)))}
  if(response.status===204)return null;
  return response.json();
}
export async function upload(file){const fd=new FormData();fd.append('file',file);fd.append('kind','source');return api('/v1/assets',{method:'POST',body:fd})}
export const generate=body=>api('/v1/jobs/generate-deck',{method:'POST',body:JSON.stringify(body)});
export const edit=body=>api('/v1/jobs/edit-deck',{method:'POST',body:JSON.stringify(body)});
export const job=id=>api(`/v1/jobs/${id}`);
export const preview=id=>api('/v1/preview',{method:'POST',body:JSON.stringify({pptx_asset_id:id})});
export const textEdits=(id,edits)=>api('/v1/text-edits',{method:'POST',body:JSON.stringify({pptx_asset_id:id,edits})});
export async function download(id){const {download_url}=await api(`/v1/assets/${id}/download`);const url=new URL(download_url,BASE||window.location.origin);window.open(url.href,'_blank','noopener,noreferrer')}
// Authenticated SSE: native EventSource cannot attach Authorization; use fetch streaming.
export async function streamEvents(id,onEvent,signal){
  const response=await fetch(`${BASE}/v1/jobs/${id}/events`,{headers:headers(),signal});
  if(!response.ok)throw new Error(`Progress stream: ${response.status}`);
  if(!response.body)return;
  const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
  while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const frames=buffer.split(/\r?\n\r?\n/);buffer=frames.pop()||'';for(const frame of frames){const data=frame.split(/\r?\n/).filter(s=>s.startsWith('data:')).map(s=>s.slice(5).trim()).join('\n');if(data){try{onEvent(JSON.parse(data))}catch{/* malformed event */}}}}
}
