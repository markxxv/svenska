import {e,ico,route,sectionTitle,progress,completion,stages} from '../core.js';
export function render(data) {
  const meta=data.meta, p=progress(data.slug), done=completion(meta);
  let html='<div class="pt-5">'+sectionTitle(meta.groupTitle||'Урок',meta.title,meta.description||'')+'</div>';
  html+='<div class="surface"><p class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">После урока вы сможете</p><p class="mt-2 text-[21px] font-medium leading-snug tracking-tight">'+e(meta.outcome || meta.title)+'</p><div class="mt-5 flex items-center gap-3"><div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-full bg-black" style="width:'+done+'%"></div></div><span class="text-xs tabular-nums text-zinc-500">'+done+'%</span></div></div>';
  html+='<div class="mt-5 grid grid-cols-2 gap-2.5"><a class="primary" href="'+route(data.slug,meta.files.theory?'theory':'quiz')+'">'+ico('book-open')+'С начала</a><a class="ghost" href="'+route(data.slug,meta.files.quiz?'quiz':'phrases')+'">'+ico('target')+'Тренажёр</a></div>';
  html+='<div class="mt-6"><h3 class="mb-3 text-[15px] font-semibold">Этапы урока</h3><div class="space-y-2">';
  for (const [mode,label] of stages) {
    if (!meta.files[mode]) continue;
    const count=data[mode]?.length || 0;
    html+='<a href="'+route(data.slug,mode)+'" class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100">'+ico(({theory:'book-open',examples:'messages-square',cards:'layers-2',phrases:'message-circle',dictionary:'book-a',quiz:'target'})[mode])+'</div><div class="flex-1"><p class="text-[14px] font-semibold">'+e(label)+'</p><p class="text-[11px] text-zinc-400">'+count+' '+(mode==='quiz'?'заданий':'материалов')+'</p></div>'+ (p.completed?.[mode]?ico('check-circle-2','h-5 w-5 text-emerald-600'):ico('chevron-right','h-4 w-4 text-zinc-400'))+'</a>';
  }
  html+='</div></div>';
  if (p.best) html+='<p class="mt-4 text-center text-[12px] text-zinc-500">Лучший тест: '+p.best+'%</p>';
  return html;
}
