import {e,ico,route,sectionTitle,progress,completion,json} from '../core.js';

// Самостоятельный каталог учебных тем. Уроки главной сюда не попадают.
export async function catalog() {
  const data=await json('topics/index.json');
  return data.topics || [];
}
export function render(items) {
  let html='<div class="pt-4">'+sectionTitle('Обучение','Темы','Короткая теория, примеры и упражнения. Выбирайте, что хотите повторить.')+'</div>';
  if(!items.length)return html+'<p class="text-[13px] text-zinc-500">Тем пока нет.</p>';
  html+='<div class="space-y-3">';
  for(const item of items){
    const done=completion(item);
    const p=progress(item.slug);
    html+='<article class="surface"><a href="'+route(item.slug)+'" class="flex items-start gap-3">'+
    '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[22px]">'+e(item.emoji||'📚')+'</span>'+
    '<span class="min-w-0 flex-1"><span class="block text-[16px] font-semibold tracking-tight">'+e(item.title)+'</span>'+
    '<span class="mt-1 block text-[12px] leading-relaxed text-zinc-500">'+e(item.description||item.outcome||'')+'</span></span>'+
    ico('chevron-right','mt-1 h-4 w-4 text-zinc-400')+'</a>'+
    '<div class="mt-4 h-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-full bg-zinc-950" style="width:'+done+'%"></div></div>'+
    '<div class="mt-3 flex flex-wrap gap-2"><a class="chip" href="'+route(item.slug,'theory')+'">'+ico('book-open')+'Теория</a>'+
    (item.files?.examples?'<a class="chip" href="'+route(item.slug,'examples')+'">Примеры</a>':'')+
    (item.files?.quiz?'<a class="chip" href="'+route(item.slug,'quiz')+'">'+ico('target')+'Тест</a>':'')+
    '</div></article>';
  }
  return html+'</div>';
}
