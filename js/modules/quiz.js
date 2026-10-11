import {e,ico,complete,progress,save,sectionTitle,route} from '../core.js';
function norm(value) { return String(value||'').toLocaleLowerCase('sv').replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim(); }
export function render(data,state) {
  const quiz=data.quiz||[];
  if(!quiz.length) return '<p>Вопросов пока нет.</p>';
  if(state.index===undefined) {state.index=0;state.score=0;state.sequence=[];state.answered=false;}
  if(state.index>=quiz.length) {
    const percent=Math.round(state.score/quiz.length*100), best=Math.max(percent,progress(data.slug).best||0);
    if(!state.saved) {save(data.slug,{best});complete(data.slug,'quiz');state.saved=true;}
    return '<div class="pt-8 text-center"><div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white">'+ico('check-circle-2','h-10 w-10')+'</div>'+
      sectionTitle('Урок завершён',percent>=80?'Вы справились!':'Закрепим ещё раз','Результат: '+state.score+' из '+quiz.length+' · '+percent+'%. Лучший результат: '+best+'%.')+
      '<a href="'+route(data.slug,'overview')+'" class="primary w-full">К уроку</a><button data-action="restart" class="ghost mt-3 w-full">'+ico('rotate-ccw')+' Повторить тест</button></div>';
  }
  const q=quiz[state.index], selected=state.choice, assembled=(state.sequence||[]).map(i=>q.words[i]).join(' ');
  let html='<div class="pt-4">'+sectionTitle('Проверка','Что осталось в памяти?','Вопрос '+(state.index+1)+' из '+quiz.length)+'</div>';
  html+='<div class="mb-5 h-1 overflow-hidden rounded-full bg-zinc-200"><div class="h-full bg-zinc-950" style="width:'+((state.index+1)/quiz.length*100)+'%"></div></div>';
  html+='<div class="surface"><h3 class="mb-6 text-[21px] font-semibold leading-snug tracking-tight">'+e(q.question || q.prompt)+'</h3>';
  if(q.type==='order') {
    html+='<div class="mb-5 min-h-16 rounded-2xl bg-zinc-100 p-3"><div class="flex flex-wrap gap-2">'+(state.sequence||[]).map((idx,pos)=>'<button class="chip !bg-white" data-action="remove" data-position="'+pos+'">'+e(q.words[idx])+' '+ico('x','h-3 w-3')+'</button>').join('')+'</div></div>';
    html+='<div class="flex flex-wrap gap-2">'+q.words.map((word,i)=>(state.sequence||[]).includes(i)?'':'<button data-action="append" data-token="'+i+'" class="chip !bg-zinc-200">'+e(word)+'</button>').join('')+'</div>';
    if(!state.answered) html+='<button data-action="check" class="primary mt-6 w-full" '+(!state.sequence?.length?'disabled style="opacity:.35"':'')+'>Проверить</button>';
  } else {
    html+='<div class="space-y-2">'+q.options.map((option,i)=>{
      const chosen=selected===i, correct=option===q.answer;
      const cls=state.answered&&correct?'!bg-emerald-50 !text-emerald-900':state.answered&&chosen?'!bg-rose-50 !text-rose-900':chosen?'!bg-zinc-950 !text-white':'';
      return '<button data-action="choose" data-choice="'+i+'" '+(state.answered?'disabled':'')+' class="block w-full rounded-2xl bg-zinc-100 px-4 py-4 text-left text-[15px] font-medium '+cls+'">'+e(option)+'</button>';
    }).join('')+'</div>';
  }
  if(state.answered) {
    const valid=q.type==='order'?norm(assembled)===norm(q.answer):q.options[selected]===q.answer;
    html+='<div class="mt-5 rounded-2xl bg-zinc-100 p-4 text-[13px] leading-relaxed"><p class="font-semibold">'+(valid?'Верно!':'Правильный ответ: '+e(q.answer))+'</p>'+(q.explanation?'<p class="mt-1 text-zinc-600">'+e(q.explanation)+'</p>':'')+'</div>';
    html+='<button class="primary mt-5 w-full" data-action="next">'+(state.index===quiz.length-1?'Результат':'Дальше')+' '+ico('arrow-right')+'</button>';
  }
  html+='</div>';
  return html;
}
export function action(name,el,ctx) {
  const s=ctx.state,q=ctx.data.quiz[s.index];
  if(name==='restart') {Object.keys(s).forEach(k=>delete s[k]);ctx.refresh();return;}
  if(name==='choose'&&!s.answered) {
    s.choice=Number(el.dataset.choice);
    s.answered=true;
    if(q.options[s.choice]===q.answer) s.score++;
    ctx.refresh();return;
  }
  if(name==='append'&&!s.answered) {s.sequence.push(Number(el.dataset.token));ctx.refresh();return;}
  if(name==='remove'&&!s.answered) {s.sequence.splice(Number(el.dataset.position),1);ctx.refresh();return;}
  if(name==='check'&&!s.answered) {
    if(!s.sequence.length) return;
    if(norm(s.sequence.map(i=>q.words[i]).join(' '))===norm(q.answer)) s.score++;
    s.answered=true;ctx.refresh();return;
  }
  if(name==='next'&&s.answered) {
    s.index++;s.sequence=[];s.answered=false;s.choice=undefined;ctx.refresh();
  }
}
