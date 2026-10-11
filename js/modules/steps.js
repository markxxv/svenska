import {e,ico,speak,complete,nextLink,sectionTitle} from '../core.js';
export function render(data, state, mode) {
  const list=data[mode] || [], pos=Math.min(state.pos||0,list.length-1), item=list[pos];
  const title=mode==='theory'?'Коротко о главном':'Смотрите, как это звучит';
  if (!item) return '<p>В этом разделе пока нет материалов.</p>';
  let html='<div class="pt-4">'+sectionTitle(mode==='theory'?'Разберём правило':'Живые примеры',title,'Шаг '+(pos+1)+' из '+list.length)+'</div>';
  html+='<div class="mb-5 h-1 overflow-hidden rounded-full bg-zinc-200"><div class="h-full bg-zinc-950" style="width:'+((pos+1)/list.length*100)+'%"></div></div>';
  if (mode==='theory') {
    html+='<article class="surface"><h3 class="text-[22px] font-semibold tracking-tight">'+e(item.title)+'</h3><p class="mt-4 whitespace-pre-line text-[15px] leading-7 text-zinc-700">'+e(item.body)+'</p>';
    if (item.rows?.length) {
      html+='<dl class="mt-5 divide-y divide-zinc-100">';
      for (const row of item.rows) {
        html+='<div class="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">'+
          '<dt lang="sv" class="text-[19px] font-semibold tracking-tight text-zinc-950">'+e(row.sv)+'</dt>'+
          '<dd class="text-right text-[15px] leading-relaxed text-zinc-600">'+e(row.ru)+'</dd>'+
        '</div>';
      }
      html+='</dl>';
    }
    if (item.note) html+='<div class="mt-5 flex items-start gap-2.5 rounded-2xl bg-zinc-100 px-4 py-3.5 text-[13px] leading-relaxed text-zinc-600">'+
      ico('info','mt-0.5 h-4 w-4 shrink-0 text-zinc-500')+'<p>'+e(item.note)+'</p></div>';
    if (item.pattern) html+='<div class="mt-6 rounded-2xl bg-zinc-950 p-4 text-white"><div class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Запомните</div><p class="text-[19px] font-semibold">'+e(item.pattern)+'</p><p class="mt-1 text-[13px] text-zinc-400">'+e(item.translation || '')+'</p><button class="mt-4 text-[13px] font-semibold" data-action="speak" data-sv="'+e(item.pattern)+'">'+ico('volume-2')+' Слушать</button></div>';
    html+='</article>';
  } else {
    html+='<article class="surface"><div class="flex items-start justify-between gap-3"><p class="flex-1 text-[24px] font-semibold leading-snug tracking-tight" lang="sv">'+e(item.sv)+'</p><button class="chip !px-3" data-action="speak" data-sv="'+e(item.sv)+'" aria-label="Прослушать">'+ico('volume-2')+'</button></div>';
    html+='<p class="mt-4 text-[16px] leading-relaxed text-zinc-600">'+e(item.ru)+'</p>';
    if(item.note) html+='<div class="mt-5 rounded-xl bg-zinc-100 p-4 text-[13px] leading-relaxed text-zinc-600">'+e(item.note)+'</div>';
    html+='</article>';
  }
  html+='<div class="mt-6 grid grid-cols-2 gap-2.5"><button class="ghost" data-action="prev" '+(pos===0?'disabled style="opacity:.3"':'')+'>'+ico('arrow-left')+' Назад</button><button class="primary" data-action="next">'+(pos===list.length-1?'Завершить':'Дальше')+' '+ico('arrow-right')+'</button></div>';
  return html;
}
export function action(name, element, ctx) {
  if (name==='speak') { speak(element.dataset.sv); return; }
  if(name==='prev') { ctx.state.pos=Math.max(0,ctx.state.pos-1);ctx.refresh(); }
  if(name==='next') {
    if(ctx.state.pos<(ctx.data[ctx.mode].length-1)) { ctx.state.pos++;ctx.refresh(); }
    else { complete(ctx.data.slug,ctx.mode);ctx.advance(); }
  }
}
