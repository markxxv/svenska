// Общие функции: JSON, озвучка и прогресс. Коллекции словарей и фраз живут отдельно от уроков.
const ROOT = new URL('../data/', import.meta.url);
const STORAGE = 'svenska-progress-v1';
const lessonCache = new Map();
const collectionCache = new Map();
const kinds = new Set(['dictionaries','phrases']);
// Одна перестановка на прохождение: алгоритм Фишера — Йетса.
export function shuffleIndices(length,random=Math.random) {
  const order=Array.from({length},(_,i)=>i);
  for(let i=order.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [order[i],order[j]]=[order[j],order[i]];
  }
  return order;
}
export const stages = [
  ['theory','Теория'],['examples','Примеры'],['cards','Карточки'],['quiz','Тест']
];
export const e = value => String(value ?? '').replace(/[&<>"']/g, ch =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const ico = (name, cls='h-4 w-4') => '<i data-lucide="'+e(name)+'" class="'+cls+'"></i>';
export const route = (slug, mode='overview') => '#/topic/'+encodeURIComponent(slug)+'/'+mode;
export const collectionRoute = (kind,slug) => {
  if (!kinds.has(kind)) throw new Error('Неизвестный тип коллекции');
  return '#/'+kind+'/'+encodeURIComponent(slug);
};
export function icons() { if (window.lucide?.createIcons) window.lucide.createIcons(); }
// Always use a new URL per app launch: GitHub Pages/CDN may cache static JSON.
const VERSION = globalThis.__svenskaVersion || Date.now().toString(36);
export async function json(path) {
  const url = new URL(path, ROOT);
  if (!url.href.startsWith(ROOT.href)) throw new Error('Недопустимый путь к JSON');
  url.searchParams.set('v', VERSION);
  const response = await fetch(url, {cache:'no-store'});
  if (!response.ok) throw new Error('Не удалось загрузить '+path+' ('+response.status+')');
  return response.json();
}
export async function catalog() {
  const data = await json('index.json');
  return data.topics || [];
}
export async function collectionCatalog(kind) {
  if (!kinds.has(kind)) throw new Error('Неизвестный тип коллекции');
  const data = await json(kind+'/index.json');
  return data.collections || [];
}
export async function topic(entry) {
  const key=entry.path || entry.slug;
  if (lessonCache.has(key)) return lessonCache.get(key);
  const result = {meta:entry, slug:entry.slug};
  await Promise.all(stages.map(async ([name]) => {
    result[name] = entry.files?.[name] ? await json(key+'/'+entry.files[name]) : [];
    if (!Array.isArray(result[name])) throw new Error('Ожидался массив: '+entry.slug+'/'+name);
  }));
  lessonCache.set(key,result);
  return result;
}
export async function collection(kind,entry) {
  if (!kinds.has(kind)) throw new Error('Неизвестный тип коллекции');
  const cacheKey = kind+'/'+entry.slug;
  if (collectionCache.has(cacheKey)) return collectionCache.get(cacheKey);
  const items = await json(kind+'/'+entry.slug+'/'+(entry.file || 'items.json'));
  if (!Array.isArray(items)) throw new Error('Ожидался массив: '+cacheKey);
  const result = {
    slug:kind+':'+entry.slug, collectionType:kind, meta:entry,
    dictionary:kind==='dictionaries'?items:[],
    phrases:kind==='phrases'?items:[]
  };
  collectionCache.set(cacheKey,result);
  return result;
}
function store() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); }
  catch { return {}; }
}
export function progress(slug) {
  return store()[slug] || {completed:{}, best:0, reviewed:{}, favorites:[]};
}
export function save(slug, patch) {
  const all = store();
  const old = progress(slug);
  all[slug] = {...old,...patch};
  try { localStorage.setItem(STORAGE, JSON.stringify(all)); } catch {}
  return all[slug];
}
export function complete(slug, stage) {
  const old = progress(slug);
  save(slug, {completed:{...old.completed,[stage]:true}, last:stage});
}
export function markCurrent(slug, mode) {
  save(slug, {last:mode});
}
export function completion(entry) {
  const completed = progress(entry.slug).completed || {};
  const modes = stages.filter(([key]) => entry.files?.[key]);
  return modes.length ? Math.round(100*modes.filter(([key]) => completed[key]).length/modes.length) : 0;
}
export function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
export function speak(value, slow=false) {
  if (!('speechSynthesis' in window)) { alert('Озвучивание не поддерживается браузером.'); return; }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = 'sv-SE';
  utterance.rate = slow ? 0.76 : 0.94;
  const voices = speechSynthesis.getVoices().filter(v => /^sv[-_]/i.test(v.lang));
  utterance.voice = voices.find(v => /alva|klara|siri|google|microsoft/i.test(v.name)) || voices[0] || null;
  speechSynthesis.speak(utterance);
}
export function sectionTitle(kicker, title, subtitle='') {
  return '<div class="mb-5"><p class="mb-1 text-[11px] font-semibold uppercase tracking-[.12em] text-zinc-400">'+e(kicker)+'</p><h2 class="text-[27px] font-semibold leading-tight tracking-[-.045em]">'+e(title)+'</h2>'+
    (subtitle?'<p class="mt-2 text-[13px] leading-relaxed text-zinc-500">'+e(subtitle)+'</p>':'')+'</div>';
}
export function nextMode(data, current) {
  const present = stages.map(x=>x[0]).filter(s => data.meta.files?.[s]);
  return present[present.indexOf(current)+1] || null;
}
export function nextLink(data, mode, label) {
  const next = nextMode(data,mode);
  return next ? '<a class="primary w-full" href="'+route(data.slug,next)+'">'+e(label || 'Следующий этап')+' '+ico('arrow-right')+'</a>' :
    '<a class="primary w-full" href="'+route(data.slug,'overview')+'">К уроку '+ico('check')+'</a>';
}
