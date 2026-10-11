import {e,ico,route,completion,progress,sectionTitle} from '../core.js';
export function render(catalog) {
  const groups = new Map();
  catalog.forEach(item => {
    const key = item.group || 'other';
    if (!groups.has(key)) groups.set(key, {label:item.groupTitle || 'Другие темы',items:[]});
    groups.get(key).items.push(item);
  });
  let html = '<div class="pt-4">'+sectionTitle('Главная','Уроки шведского','Короткая теория, примеры и задания. Можно сразу перейти к повторению.')+'</div>';
  if (!catalog.length) return html+'<p class="text-sm text-zinc-500">Уроков пока нет.</p>';
  for (const [,group] of groups) {
    html += '<section class="mt-7"><div class="mb-3 flex items-baseline justify-between"><h2 class="text-[15px] font-semibold">'+e(group.label)+'</h2><span class="text-[11px] text-zinc-400">'+group.items.length+' тем</span></div><div class="space-y-3">';
    for (const t of group.items) {
      const done = completion(t), p = progress(t.slug);
      const modes = t.files || {};
      html += '<article class="surface"><a href="'+route(t.slug)+'" class="flex items-start gap-3"><span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[22px]">'+e(t.emoji || '🇸🇪')+'</span><div class="min-w-0 flex-1"><h3 class="text-[16px] font-semibold leading-snug tracking-tight">'+e(t.title)+'</h3><p class="mt-1 text-[12px] leading-relaxed text-zinc-500">'+e(t.outcome || t.description || '')+'</p></div>'+ico('chevron-right','mt-1 h-4 w-4 text-zinc-400')+'</a>';
      html += '<div class="mt-4 h-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-full rounded-full bg-zinc-950" style="width:'+done+'%"></div></div>';
      html += '<div class="mt-3 flex flex-wrap items-center gap-2"><a class="chip" href="'+route(t.slug,modes.theory?'theory':modes.examples?'examples':'overview')+'">'+ico('book-open')+(done?'Повторить':'Начать')+'</a>';
      if (modes.quiz) html += '<a class="chip" href="'+route(t.slug,'quiz')+'">'+ico('target')+'Тренажёр</a>';
      if (modes.examples) html += '<a class="chip" href="'+route(t.slug,'examples')+'">Примеры</a>';
      if (p.last && modes[p.last] && done && done<100) html += '<a href="'+route(t.slug,p.last)+'" class="text-[12px] font-medium text-zinc-500">Продолжить ↗</a>';
      html += '</div></article>';
    }
    html += '</div></section>';
  }
  return html+'<p class="mt-7 text-center text-[11px] leading-relaxed text-zinc-400">Словари и разговорные фразы — в отдельных разделах меню.</p>';
}
