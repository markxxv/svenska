import {e,ico,speak,complete,progress,save,sectionTitle,nextLink} from '../core.js';
function punctuation(text,word,occurrence) {
  const parts=text.match(/[^ \t\n]+/g)||[];
  const matches=parts.filter(x=>x.replace(/[.,!?;:]+$/g,'').toLowerCase()===word.toLowerCase());
  const token=matches[occurrence]||word;
  return token.slice(word.length);
}
export function render(data, state) {
  const all=data.phrases||[];
  if(!state.initialized){state.index=progress(data.slug).phraseIndex||0;state.initialized=true;}
  const fav=new Set(progress(data.slug).favorites||[]);
  const phrases=state.favoritesOnly?all.filter(p=>fav.has(String(p.id))):all;
  if(!phrases.length) return '<div class="pt-8">'+sectionTitle('Фразы','Пока пусто',state.favoritesOnly?'Отмечайте фразы сердечком — они появятся здесь.':'В уроке ещё нет фраз.')+'<button class="ghost mt-3" data-action="all">Все фразы</button></div>';
  state.index=Math.max(0,Math.min(state.index||0,phrases.length-1));
  const phrase=phrases[state.index];
  let seen={};
  const words=(phrase.words||[]).map((w,i)=>{
    const occurrence=seen[w[0].toLowerCase()]||0;seen[w[0].toLowerCase()]=occurrence+1;
    return '<button class="word-chip" data-action="word" data-word="'+i+'">'+e(w[0]+punctuation(phrase.text,w[0],occurrence))+'</button>';
  }).join('');
  let html='<div class="pt-4">'+sectionTitle(data.collectionType?'Коллекция фраз':'Практика',data.collectionType?data.meta.title:'Разговорные фразы',data.collectionType?(data.meta.description||''):'Нажмите на слово, чтобы понять его роль в предложении.')+'</div>';
  html+='<div class="mb-4 flex items-center justify-between"><span class="text-xs text-zinc-400">'+(state.index+1)+' / '+phrases.length+'</span><button data-action="favorites" class="chip">'+ico('heart')+(state.favoritesOnly?'Все фразы':'Избранное')+'</button></div>';
  html+='<div class="mb-5 h-1 overflow-hidden rounded-full bg-zinc-200"><div class="h-full bg-black" style="width:'+((state.index+1)/phrases.length*100)+'%"></div></div>';
  html+='<article class="surface"><button class="mb-6 flex h-15 w-15 items-center justify-center rounded-full bg-black text-white" data-action="phrase-speak" aria-label="Прослушать фразу">'+ico('play','h-6 w-6')+'</button><div class="flex flex-wrap gap-2">'+words+'</div>';
  if(!words) html+='<p lang="sv" class="text-[24px] font-semibold">'+e(phrase.text)+'</p>';
  if(state.translation) html+='<p class="mt-6 rounded-2xl bg-zinc-100 p-4 text-[17px] font-medium">'+e(phrase.translation)+'</p>';
  html+='<div class="mt-6 grid grid-cols-2 gap-2"><button class="ghost" data-action="translation">'+ico('languages')+' Перевод</button><button class="ghost" data-action="favorite">'+ico('heart', 'h-4 w-4 '+(fav.has(String(phrase.id))?'fill-current':''))+(fav.has(String(phrase.id))?'Сохранено':'Сохранить')+'</button></div></article>';
  html+='<div class="mt-6 grid grid-cols-2 gap-2.5"><button class="ghost" data-action="previous" '+(state.index===0?'disabled style="opacity:.35"':'')+'>'+ico('arrow-left')+' Назад</button><button class="primary" data-action="next">Дальше '+ico('arrow-right')+'</button></div>';
  if(state.finished) html+='<div class="mt-4">'+(data.collectionType?'<a class="ghost w-full" href="#/phrases">'+ico('arrow-left')+' Все коллекции</a>':nextLink(data,'phrases'))+'</div>';
  if(Number.isInteger(state.openWord)) {
    const w=(phrase.words||[])[state.openWord];
    if(w) html+='<div class="fixed inset-0 z-20 bg-black/40" data-action="close-word"></div><div class="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] rounded-t-[30px] bg-white p-6 pb-[max(25px,env(safe-area-inset-bottom))] shadow-2xl"><div class="flex items-start justify-between"><div><h3 lang="sv" class="text-[29px] font-semibold">'+e(w[0])+'</h3><p class="text-xs text-zinc-400">'+e(w[1])+'</p></div><button class="chip" data-action="word-speak" data-sv="'+e(w[0])+'">'+ico('volume-2')+'</button></div><p class="mt-5 rounded-2xl bg-zinc-100 p-4 text-[20px] font-semibold">'+e(w[2])+'</p>'+(w[3]?'<p class="mt-4 text-[14px] leading-relaxed text-zinc-600">'+e(w[3])+'</p>':'')+(w[4]?'<div class="mt-4 rounded-xl bg-zinc-950 p-4 text-white"><p class="font-semibold">'+e(w[4])+'</p><p class="mt-1 text-[13px] text-zinc-400">'+e(w[5]||'')+'</p></div>':'')+'<button class="ghost mt-5 w-full" data-action="close-word">Закрыть</button></div>';
  }
  return html;
}
export function action(name, el, ctx) {
  const s=ctx.state, all=ctx.data.phrases||[], fav=new Set(progress(ctx.data.slug).favorites||[]);
  const phrases=s.favoritesOnly?all.filter(p=>fav.has(String(p.id))):all;
  const p=phrases[s.index||0];
  if(name==='phrase-speak') {speak(p.text,s.slow);return;}
  if(name==='word-speak') {speak(el.dataset.sv,true);return;}
  if(name==='word') {s.openWord=Number(el.dataset.word);ctx.refresh();return;}
  if(name==='close-word') {s.openWord=null;ctx.refresh();return;}
  if(name==='translation') {s.translation=!s.translation;ctx.refresh();return;}
  if(name==='previous'||name==='next') {
    if(name==='previous') s.index=Math.max(0,s.index-1);
    else if(s.index<phrases.length-1) s.index++;
    else {s.index=0;s.finished=true;complete(ctx.data.slug,'phrases');}
    if(!s.favoritesOnly)save(ctx.data.slug,{phraseIndex:s.index});
    s.openWord=null;s.translation=false;ctx.refresh();return;
  }
  if(name==='favorites') {s.favoritesOnly=!s.favoritesOnly;s.index=0;s.openWord=null;ctx.refresh();return;}
  if(name==='all') {s.favoritesOnly=false;s.index=0;ctx.refresh();return;}
  if(name==='favorite') {
    const id=String(p.id);fav.has(id)?fav.delete(id):fav.add(id);
    save(ctx.data.slug,{favorites:[...fav]});ctx.refresh();
  }
}
