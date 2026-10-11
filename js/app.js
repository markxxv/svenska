import {catalog,collectionCatalog,topic,collection,route,stages,e,icons,markCurrent,stopSpeech} from './core.js';
import * as home from './modules/home.js';
import * as collections from './modules/collections.js';
import * as topics from './modules/topics.js';
import * as overview from './modules/overview.js';
import * as steps from './modules/steps.js';
import * as cards from './modules/cards.js';
import * as phrases from './modules/phrases.js';
import * as dictionary from './modules/dictionary.js';
import * as quiz from './modules/quiz.js';

const view=document.querySelector('#view');
const stageNav=document.querySelector('#stageNav');
const bottomNav=document.querySelector('#bottomNav');
const settingsContainer=document.querySelector('#settingsContainer');
const settingsTrigger=document.querySelector('#settingsTrigger');
const settingsMenu=document.querySelector('#settingsMenu');
function closeSettings() {
  settingsMenu.hidden=true;
  settingsTrigger.setAttribute('aria-expanded','false');
}
function syncThemeSettings() {
  const theme=document.documentElement.classList.contains('dark')?'dark':'light';
  for(const option of settingsMenu.querySelectorAll('[data-theme-option]')) {
    option.setAttribute('aria-pressed',String(option.dataset.themeOption===theme));
  }
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#000000':'#fafafa';
}
function setTheme(theme) {
  if(theme!=='light'&&theme!=='dark') return;
  document.documentElement.classList.toggle('dark',theme==='dark');
  try {localStorage.setItem('svenska-theme',theme);} catch {}
  syncThemeSettings();
}
settingsTrigger.addEventListener('click',()=>{
  settingsMenu.hidden=!settingsMenu.hidden;
  settingsTrigger.setAttribute('aria-expanded',String(!settingsMenu.hidden));
});
settingsMenu.addEventListener('click',event=>{
  const choice=event.target.closest('[data-theme-option]');
  if(!choice)return;
  setTheme(choice.dataset.themeOption);
  closeSettings();
  settingsTrigger.focus();
});
document.addEventListener('pointerdown',event=>{
  if(!settingsContainer.contains(event.target))closeSettings();
});
syncThemeSettings();

const modules={theory:steps,examples:steps,cards,quiz,phrases,dictionary};
const library={dictionaries:[],phrases:[]};
let lessons=[],studyTopics=[],section='home',current=null,data=null,mode=null,state={},ticket=0,screenKey='';
function parseHash() {
  const path=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(path[0]==='topic'&&path[1]) return {section:'home',type:'lesson',slug:decodeURIComponent(path[1]),mode:path[2]||'overview'};
  if(path[0]==='topics'&&!path[1])return {section:'topics',type:'list'};
  if(['dictionaries','phrases'].includes(path[0])) return {
    section:path[0],type:path[1]?'collection':'list',slug:path[1]?decodeURIComponent(path[1]):null
  };
  return {section:'home',type:'list'};
}
function setHeader(title,subtitle,backHref=null) {
  document.querySelector('#headerTitle').textContent=title;
  document.querySelector('#headerSubtitle').textContent=subtitle;
  const back=document.querySelector('#backButton');
  back.classList.toggle('invisible',!backHref);
  back.href=backHref||'#/';
}
function updateTabs() {
  bottomNav.querySelectorAll('[data-nav]').forEach(link=>{
    const active=link.dataset.nav===section;
    link.classList.toggle('text-zinc-950',active);
    link.classList.toggle('text-zinc-400',!active);
    link.classList.toggle('bg-zinc-100/80',active);
    const title=link.querySelector('span');
    title?.classList.toggle('font-semibold',active);
    title?.classList.toggle('font-medium',!active);
    if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
}
function updateStageNav() {
  const lesson=!!current&&mode!=='dictionary'&&mode!=='phrases';
  stageNav.classList.toggle('hidden',!lesson);
  stageNav.classList.toggle('flex',lesson);
  if(!lesson){stageNav.innerHTML='';return;}
  stageNav.innerHTML='<a class="chip shrink-0 '+(mode==='overview'?'!bg-black !text-white':'')+'" href="'+route(current.slug)+'">Обзор</a>'+
    stages.filter(([key])=>current.files?.[key]).map(([key,label])=>
      '<a class="chip shrink-0 '+(key===mode?'!bg-black !text-white':'')+'" href="'+route(current.slug,key)+'">'+e(label)+'</a>'
    ).join('');
}
function advance() {
  if(data?.collectionType) {location.hash='#/'+section;return;}
  const present=stages.map(x=>x[0]).filter(key=>current.files?.[key]);
  location.hash=route(current.slug,present[present.indexOf(mode)+1]||'overview');
}
function refresh() {
  if(!current) view.innerHTML=section==='home'
    ?home.render(lessons)
    :section==='topics'?topics.render(studyTopics)
    :collections.render(section,library[section]);
  else if(mode==='overview')view.innerHTML=overview.render(data);
  else view.innerHTML=modules[mode].render(data,state,mode);
  if(current&&modules[mode]?.bind)modules[mode].bind(view,{data,state,mode,refresh,advance});
  icons();
}
async function navigate() {
  closeSettings();
  const id=++ticket,info=parseHash();
  stopSpeech();
  view.scrollTop=0;
  section=info.section;
  updateTabs();
  try {
    if(info.type==='list') {
      current=null;data=null;mode=null;state={};screenKey='';
      setHeader(({home:'Svenska',dictionaries:'Словари',phrases:'Фразы',topics:'Темы'})[info.section]||'Svenska','Шведский для жизни');
      updateStageNav();refresh();return;
    }
    if(info.type==='lesson') {
      const entry=lessons.find(item=>item.slug===info.slug)||studyTopics.find(item=>item.slug===info.slug);
      if(!entry)throw Error('Материал не найден: '+info.slug);
      section=studyTopics.some(item=>item.slug===info.slug)?'topics':'home';
      updateTabs();
      const value=await topic(entry);
      if(id!==ticket)return;
      const target=info.mode==='overview'||entry.files?.[info.mode]?info.mode:'overview';
      const key='lesson:'+entry.slug+':'+target;
      if(key!==screenKey){state={};screenKey=key;}
      current=entry;data=value;mode=target;
      setHeader(entry.title,entry.groupTitle||'Тема',section==='topics'?'#/topics':'#/');
      if(target!=='overview')markCurrent(entry.slug,target);
    } else {
      const entry=library[info.section].find(item=>item.slug===info.slug);
      if(!entry)throw Error('Коллекция не найдена: '+info.slug);
      const value=await collection(info.section,entry);
      if(id!==ticket)return;
      const key=info.section+':'+entry.slug;
      if(key!==screenKey){state={};screenKey=key;}
      current=entry;data=value;mode=info.section==='dictionaries'?'dictionary':'phrases';
      setHeader(entry.title,info.section==='dictionaries'?'Словарь':'Фразы','#/'+info.section);
    }
    updateStageNav();refresh();
  }catch(err){
    if(id!==ticket)return;
    current=null;data=null;mode=null;
    updateStageNav();
    setHeader('Ошибка загрузки','','#/'+info.section);
    view.innerHTML='<div class="surface mt-5"><p class="font-semibold">Не удалось открыть материал</p><p class="mt-2 text-sm text-zinc-500">'+e(err.message)+'</p><a href="#/'+(info.section==='home'?'':info.section)+'" class="primary mt-5">Вернуться</a></div>';
    console.error(err);
  }
}
view.addEventListener('click',event=>{
  const element=event.target.closest('[data-action]');
  if(!element||!current||!modules[mode])return;
  modules[mode].action?.(element.dataset.action,element,{data,state,mode,refresh,advance});
});
window.addEventListener('hashchange',navigate);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!settingsMenu.hidden){closeSettings();settingsTrigger.focus();return;}
  if(event.key==='Escape'&&state.openWord!==undefined&&state.openWord!==null){
    state.openWord=null;refresh();
  }
});
async function init() {
  try{
    [lessons,studyTopics,library.dictionaries,library.phrases]=await Promise.all([
      catalog(),topics.catalog(),collectionCatalog('dictionaries'),collectionCatalog('phrases')
    ]);
    await navigate();
  }catch(err){
    setHeader('Svenska','Ошибка каталога');
    view.innerHTML='<div class="surface mt-5"><p class="font-semibold">Не удалось загрузить данные</p><p class="mt-2 text-sm text-zinc-500">'+e(err.message)+'</p></div>';
    console.error(err);
  }
}
init();
