// Общие функции без привязки к конкретному тренажёру.
const ROOT = new URL('../data/', import.meta.url);
const STORAGE = 'svenska-progress-v1';
const cache = new Map();
export const stages = [
  ['theory','Теория'],['examples','Примеры'],['cards','Карточки'],
  ['phrases','Фразы'],['dictionary','Словарь'],['quiz','Тест']
];
export const e = value => String(value ?? '').replace(/[&<>"']/g, ch =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const ico = (name, cls='h-4 w-4') => '<i data-lucide="'+e(name)+'" class="'+cls+'"></i>';
export const route = (slug, mode='overview') => '#/topic/'+encodeURIComponent(slug)+'/'+mode;
export function icons() { if (window.lucide?.createIcons) window.lucide.createIcons(); }
async function json(path) {
  const url = new URL(path, ROOT);
  if (!url.href.startsWith(ROOT.href)) throw new Error('Недопустимый путь к JSON');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Не удалось загрузить '+path+' ('+response.status+')');
  return response.json();
}
export async function catalog() {
  const result = await fetch(new URL('index.json', ROOT), {cache:'no-store'});
  if (!result.ok) throw new Error('Не найден data/index.json. Запустите npm run content:sync.');
  const data = await result.json();
  return data.topics || [];
}
export async function topic(entry) {
  if (cache.has(entry.slug)) return cache.get(entry.slug);
  const files = entry.files || {};
  const result = {meta:entry, slug:entry.slug};
  const names = ['theory','examples','cards','phrases','dictionary','quiz'];
  await Promise.all(names.map(async name => {
    result[name] = files[name] ? await json(entry.slug+'/'+files[name]) : [];
    if (!Array.isArray(result[name])) throw new Error('Ожидался массив: '+entry.slug+'/'+name);
  }));
  cache.set(entry.slug, result);
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
let activeUtterance = null;
export function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  activeUtterance = null;
}
export function speak(value, slow=false) {
  if (!('speechSynthesis' in window)) { alert('Озвучивание не поддерживается браузером.'); return; }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = 'sv-SE';
  utterance.rate = slow ? 0.76 : 0.94;
  const voices = speechSynthesis.getVoices().filter(v => /^sv[-_]/i.test(v.lang));
  utterance.voice = voices.find(v => /alva|klara|siri|google|microsoft/i.test(v.name)) || voices[0] || null;
  activeUtterance = utterance;
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
