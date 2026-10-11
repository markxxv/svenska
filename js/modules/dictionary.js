import {e,ico,speak,sectionTitle,nextLink} from '../core.js';
export function render(data, state) {
  const entries=data.dictionary||[];
  const cats=[...new Set(entries.map(v=>v.category).filter(Boolean))];
  const filtered=entries.filter(v=>!state.category||v.category===state.category);
  const separate=!!data.collectionType;
  const title=separate?data.meta.title:'Слова для ситуации';
  const subtitle=separate?(data.meta.description||''):'Прочитайте, прослушайте, затем закрепите на карточках.';
  let html='<div class="pt-4">'+sectionTitle('Словарь',title,subtitle)+'</div>';
  html+='<label class="mb-3 flex items-center gap-3 rounded-2xl bg-white px-4">'+ico('search','h-5 w-5 text-zinc-400')+'<input id="dictionarySearch" type="search" class="min-h-12 min-w-0 flex-1 bg-transparent text-[14px] outline-none" placeholder="Найти слово или перевод" value="'+e(state.query||'')+'" aria-label="Поиск по словарю"></label>';
  if(cats.length) html+='<div class="scrollbar-none mb-5 flex gap-2 overflow-x-auto">'+['',...cats].map(c=>'<button class="chip shrink-0 '+((state.category||'')===c?'!bg-zinc-950 !text-white':'')+'" data-action="category" data-category="'+e(c)+'">'+e(c||'Все')+'</button>').join('')+'</div>';
  html+='<div class="space-y-2">';
  html+=filtered.map(item=>'<article data-dictionary-item class="rounded-2xl bg-white p-4"><div class="flex items-center gap-3"><div class="min-w-0 flex-1"><p lang="sv" class="text-[19px] font-semibold tracking-tight">'+e(item.sv)+'</p><p class="mt-1 text-[14px] text-zinc-600">'+e(item.ru)+'</p></div><button class="chip !px-3" data-action="speak" data-sv="'+e(item.sv)+'" aria-label="Озвучить слово">'+ico('volume-2')+'</button></div>'+(item.example?'<p class="mt-3 text-[12px] leading-relaxed text-zinc-400">'+e(item.example)+'</p>':'')+'</article>').join('');
  html+='</div><p id="dictionaryEmpty" class="hidden py-8 text-center text-sm text-zinc-400">Совпадений нет</p>';
  html+='<div class="mt-6">'+(separate?'<a href="#/dictionaries" class="ghost w-full">'+ico('arrow-left')+' Все словари</a>':nextLink(data,'dictionary','Закрепить знания'))+'</div>';
  return html;
}
export function bind(root,ctx) {
  const input=root.querySelector('#dictionarySearch');
  if(!input)return;
  const apply=()=>{
    ctx.state.query=input.value;
    const query=input.value.toLocaleLowerCase('sv').trim();
    let visible=0;
    root.querySelectorAll('[data-dictionary-item]').forEach(row=>{
      const match=row.textContent.toLocaleLowerCase('sv').includes(query);
      row.classList.toggle('hidden',!match);
      if(match)visible++;
    });
    root.querySelector('#dictionaryEmpty')?.classList.toggle('hidden',visible>0);
  };
  input.addEventListener('input',apply);
  apply();
}
export function action(name,el,ctx) {
  if(name==='speak')speak(el.dataset.sv);
  if(name==='category'){ctx.state.category=el.dataset.category;ctx.refresh();}
}
