import {e,ico,speak,complete,sectionTitle,nextLink} from '../core.js';
export function render(data, state) {
  const entries=data.dictionary||[];
  const q=(state.query||'').trim().toLowerCase();
  const cats=[...new Set(entries.map(v=>v.category).filter(Boolean))];
  const filtered=entries.filter(v=>(!state.category||v.category===state.category)&&(!q||[v.sv,v.ru,v.example].some(x=>String(x||'').toLowerCase().includes(q))));
  let html='<div class="pt-4">'+sectionTitle('Тематический словарь','Слова для ситуации','Прочитайте, прослушайте, затем закрепите на карточках.')+'</div>';
  html+='<label class="mb-3 flex items-center gap-3 rounded-2xl bg-white px-4">'+ico('search','h-5 w-5 text-zinc-400')+'<input id="dictionarySearch" type="search" class="min-h-12 min-w-0 flex-1 bg-transparent text-[14px] outline-none" placeholder="Найти слово или перевод" value="'+e(state.query||'')+'" aria-label="Поиск по словарю"></label>';
  if(cats.length) html+='<div class="scrollbar-none mb-5 flex gap-2 overflow-x-auto">'+['',...cats].map(c=>'<button class="chip shrink-0 '+((state.category||'')===c?'!bg-zinc-950 !text-white':'')+'" data-action="category" data-category="'+e(c)+'">'+e(c||'Все')+'</button>').join('')+'</div>';
  html+='<div class="space-y-2">';
  html+=filtered.map(item=>'<article class="rounded-2xl bg-white p-4"><div class="flex items-center gap-3"><div class="min-w-0 flex-1"><p lang="sv" class="text-[19px] font-semibold tracking-tight">'+e(item.sv)+'</p><p class="mt-1 text-[14px] text-zinc-600">'+e(item.ru)+'</p></div><button class="chip !px-3" data-action="speak" data-sv="'+e(item.sv)+'" aria-label="Озвучить слово">'+ico('volume-2')+'</button></div>'+(item.example?'<p class="mt-3 text-[12px] leading-relaxed text-zinc-400">'+e(item.example)+'</p>':'')+'</article>').join('');
  html+='</div>'+(filtered.length?'':'<p class="py-8 text-center text-sm text-zinc-400">Совпадений нет</p>');
  html+='<div class="mt-6">'+nextLink(data,'dictionary','Закрепить знания')+'</div>';
  return html;
}
export function bind(root,ctx) {
  root.querySelector('#dictionarySearch')?.addEventListener('input',ev=>{
    ctx.state.query=ev.target.value;
    const list=root.querySelectorAll('article');
    // Обновляем с задержкой не нужно: ввод сохраняется, а курсор не теряется.
    for(const node of list) { /* обновление по Enter или смене категории */ }
  });
  root.querySelector('#dictionarySearch')?.addEventListener('change',ev=>{ctx.state.query=ev.target.value;ctx.refresh();});
  root.querySelector('#dictionarySearch')?.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ctx.state.query=ev.target.value;ctx.refresh();}});
}
export function action(name,el,ctx) {
  if(name==='speak') speak(el.dataset.sv);
  if(name==='category'){ctx.state.category=el.dataset.category;ctx.refresh();}
}
