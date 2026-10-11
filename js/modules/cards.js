import {e,ico,speak,complete,progress,save,sectionTitle,nextLink} from '../core.js';
function list(data) { return data.cards || []; }
export function render(data, state) {
  const cards=list(data);
  if(!cards.length) return '<p>Карточек пока нет.</p>';
  if(!state.queue) {
    if(state.weakOnly===undefined) state.weakOnly=true;
    const known=progress(data.slug).reviewed||{};
    const weak=cards.map((card,i)=>!known[card.id||card.sv]?i:null).filter(i=>i!==null);
    state.queue=state.weakOnly&&weak.length?weak:cards.map((_,i)=>i);
    state.position=0;state.flipped=false;
  }
  if(state.position>=state.queue.length) return '<div class="pt-8">'+sectionTitle('Готово','Карточки пройдены','Вы повторили слова. Вернитесь к ним в любое время.')+'<button data-action="card-mode" class="ghost mb-3 w-full">'+ico('rotate-ccw')+' Снова повторить</button>'+nextLink(data,'cards')+'</div>';
  const card=cards[state.queue[state.position]], p=progress(data.slug), known=p.reviewed||{};
  return '<div class="pt-4">'+sectionTitle('Запоминаем','Карточки','Сначала вспомните перевод, затем переверните.')+'</div>'+
  '<div class="mb-4 flex items-center justify-between gap-2 text-xs text-zinc-400"><span>'+(state.position+1)+' / '+state.queue.length+' · '+Object.values(known).filter(Boolean).length+' знакомых</span><button class="chip !min-h-8 !px-2" data-action="card-mode">'+(state.weakOnly?'Все карточки':'Только сложные')+'</button></div>'+
  '<button aria-label="Перевернуть карточку" data-action="flip" class="flip-card block w-full text-left '+(state.flipped?'is-flipped':'')+'"><div class="flip-inner relative h-[285px] w-full"><div class="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-white p-6 text-center"><span class="absolute top-5 text-[11px] text-zinc-400">Шведский</span><span lang="sv" class="text-[32px] font-semibold leading-tight tracking-tight">'+e(card.sv)+'</span><span class="absolute bottom-6 text-[12px] text-zinc-400">'+ico('refresh-cw','inline h-3.5 w-3.5')+' Нажмите для перевода</span></div><div class="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center rounded-[28px] bg-zinc-950 p-6 text-center text-white"><span class="absolute top-5 text-[11px] text-zinc-400">Перевод</span><span class="text-[29px] font-semibold leading-tight tracking-tight">'+e(card.ru)+'</span><span class="mt-3 text-[13px] leading-relaxed text-zinc-400">'+e(card.example || card.hint || '')+'</span></div></div></button>'+
  '<button class="ghost mt-3 w-full" data-action="card-speak">'+ico('volume-2')+' Прослушать</button>'+
  '<div class="mt-6 grid grid-cols-2 gap-3"><button data-action="again" class="ghost" '+(!state.flipped?'disabled style="opacity:.35"':'')+'>'+ico('rotate-ccw')+' Ещё повторить</button><button data-action="known" class="primary" '+(!state.flipped?'disabled style="opacity:.35"':'')+'>'+ico('check')+' Знаю</button></div>'+
  '<p class="mt-4 text-center text-[12px] text-zinc-400">Сложные слова вернутся в конце колоды.</p>';
}
export function action(name, element, ctx) {
  const s=ctx.state, cards=list(ctx.data);
  if(name==='card-mode') {
    s.weakOnly=!s.weakOnly;
    s.queue=null;
    s.position=0;
    s.flipped=false;
    ctx.refresh();
    return;
  }
  if(!s.queue || s.position>=s.queue.length) return;
  const idx=s.queue[s.position], card=cards[idx], id=card.id||card.sv;
  if(name==='flip') {s.flipped=!s.flipped;ctx.refresh();return;}
  if(name==='card-speak') {speak(card.sv);return;}
  if(name==='again'||name==='known') {
    if(!s.flipped) return;
    const old=progress(ctx.data.slug);
    save(ctx.data.slug,{reviewed:{...old.reviewed,[id]:name==='known'}});
    if(name==='again') s.queue.push(idx);
    s.position++;
    s.flipped=false;
    if(s.position>=s.queue.length) complete(ctx.data.slug,'cards');
    ctx.refresh();
  }
}
