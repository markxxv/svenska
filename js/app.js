import {catalog,topic,route,stages,e,ico,icons,markCurrent,stopSpeech,progress,completion} from './core.js';
import * as home from './modules/home.js';
import * as overview from './modules/overview.js';
import * as steps from './modules/steps.js';
import * as cards from './modules/cards.js';
import * as phrases from './modules/phrases.js';
import * as dictionary from './modules/dictionary.js';
import * as quiz from './modules/quiz.js';

const view=document.querySelector('#view');
const nav=document.querySelector('#stageNav');
const modules={theory:steps,examples:steps,cards,phrases,dictionary,quiz};
let entries=[],current=null,data=null,mode=null,state={},ticket=0;
function parseHash() {
  const match=location.hash.match(/^#\/topic\/([^/]+)(?:\/([^/]+))?/);
  return match?{slug:decodeURIComponent(match[1]),mode:match[2]||'overview'}:null;
}
function setHeader(title,subtitle,hasBack) {
  document.querySelector('#headerTitle').textContent=title;
  document.querySelector('#headerSubtitle').textContent=subtitle;
  document.querySelector('#homeButton').classList.toggle('invisible',!hasBack);
}
function updateNav() {
  nav.classList.toggle('hidden',!current);
  nav.classList.toggle('flex',!!current);
  if(!current){nav.innerHTML='';return;}
  nav.innerHTML='<a class="chip shrink-0 '+(mode==='overview'?'!bg-black !text-white':'')+'" href="'+route(current.slug)+'">Обзор</a>'+
    stages.filter(([k])=>current.files[k]).map(([k,label])=>'<a class="chip shrink-0 '+(k===mode?'!bg-black !text-white':'')+'" href="'+route(current.slug,k)+'">'+e(label)+'</a>').join('');
}
function footer() {
  document.querySelector('#footerStatus').textContent=current?('Освоено: '+completion(current)+'%'):'Короткие уроки. Реальные навыки.';
}
function refresh() {
  if(!current) view.innerHTML=home.render(entries);
  else if(mode==='overview') view.innerHTML=overview.render(data);
  else view.innerHTML=modules[mode].render(data,state,mode);
  const ctx={data,state,mode,refresh,advance:()=>{
    const present=stages.map(x=>x[0]).filter(k=>current.files[k]);
    location.hash=route(current.slug,present[present.indexOf(mode)+1]||'overview');
  }};
  if(current && modules[mode]?.bind) modules[mode].bind(view,ctx);
  icons();footer();
}
async function navigate() {
  const id=++ticket, info=parseHash();
  stopSpeech();
  view.scrollTop=0;
  try {
    if(!info){current=null;data=null;mode=null;state={};setHeader('Svenska','Шведский для жизни',false);updateNav();refresh();return;}
    const entry=entries.find(x=>x.slug===info.slug);
    if(!entry) throw new Error('Тема не найдена: '+info.slug);
    const value=await topic(entry);
    if(id!==ticket) return;
    const nextMode=info.mode==='overview'||entry.files[info.mode]?info.mode:'overview';
    const changed=current?.slug!==entry.slug || mode!==nextMode;
    current=entry;data=value;mode=nextMode;
    if(changed) state={};
    setHeader(entry.title,entry.groupTitle || 'Тема',true);
    if(mode!=='overview') markCurrent(current.slug,mode);
    updateNav();refresh();
  } catch(err) {
    current=null;data=null;mode=null;updateNav();setHeader('Не удалось открыть урок','',true);
    view.innerHTML='<div class="surface mt-5"><p class="font-semibold">Ошибка загрузки</p><p class="mt-2 text-sm text-zinc-500">'+e(err.message)+'</p><a href="#/" class="primary mt-5">К темам</a></div>';
    console.error(err);
  }
}
view.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-action]');
  if(!el||!current||!modules[mode]) return;
  modules[mode].action?.(el.dataset.action,el,{
    data,state,mode,refresh,
    advance:()=>{
      const present=stages.map(x=>x[0]).filter(k=>current.files[k]);
      location.hash=route(current.slug,present[present.indexOf(mode)+1]||'overview');
    }
  });
});
window.addEventListener('hashchange',navigate);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && state.openWord!==undefined && state.openWord!==null){state.openWord=null;refresh();}
});
async function init() {
  try {entries=await catalog();await navigate();}
  catch(err) {
    setHeader('Svenska','Ошибка каталога',false);
    view.innerHTML='<div class="surface mt-5"><h2 class="font-semibold">Не удалось загрузить темы</h2><p class="mt-3 text-sm text-zinc-600">'+e(err.message)+'</p></div>';
    console.error(err);
  }
}
init();
