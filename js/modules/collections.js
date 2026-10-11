import {e,ico,sectionTitle,collectionRoute,progress} from '../core.js';

// Универсальный список; сами коллекции и данные фраз/словарей не связаны с уроками.
export function render(kind,items) {
  const dictionaries=kind==='dictionaries';
  const title=dictionaries?'Словари':'Фразы';
  const lead=dictionaries
    ? 'Слова, которые пригодятся в конкретной ситуации. Открывайте любую подборку.'
    : 'Готовые разговорные фразы с произношением, переводом и разбором слов.';
  let html='<div class="pt-4">'+sectionTitle(dictionaries?'Коллекции слов':'Коллекции фраз',title,lead)+'</div>';
  if(!items.length) return html+'<p class="rounded-2xl bg-white p-5 text-sm text-zinc-500">Здесь пока нет коллекций.</p>';
  html+='<div class="space-y-3">';
  for(const item of items) {
    const p=progress(kind+':'+item.slug);
    const subtitle=dictionaries?item.count+' слов':item.count+' фраз';
    const last=dictionaries?'Открыть словарь':p.phraseIndex>0?'Продолжить':'Открыть коллекцию';
    html+='<a href="'+collectionRoute(kind,item.slug)+'" class="surface flex items-start gap-4 !p-4">'+
      '<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[24px]">'+e(item.emoji || (dictionaries?'📖':'💬'))+'</span>'+
      '<span class="min-w-0 flex-1"><span class="block text-[16px] font-semibold tracking-tight">'+e(item.title)+'</span>'+
      '<span class="mt-1 block text-[12px] leading-relaxed text-zinc-500">'+e(item.description||'')+'</span>'+
      '<span class="mt-3 flex items-center gap-2 text-[12px] font-medium text-zinc-900">'+e(subtitle)+'<span class="text-zinc-300">·</span>'+e(last)+' '+ico('arrow-up-right','h-3.5 w-3.5')+'</span></span></a>';
  }
  return html+'</div>';
}
