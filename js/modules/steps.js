import {e,ico,speak,complete,nextLink,sectionTitle,shuffleIndices} from '../core.js';
// Общая для всех уроков последовательность: один случайный порядок на прохождение.
export {shuffleIndices};
export function currentExample(list,state,random=Math.random) {
  if(!Array.isArray(state.exampleOrder)||state.exampleOrder.length!==list.length){
    state.exampleOrder=shuffleIndices(list.length,random);
    state.pos=0;
  }
  return list[state.exampleOrder[state.pos]];
}


// The same card renderer is used for the live card and its incoming swipe preview.
function exampleCard(item) {
  let html='<article data-example-card class="surface relative select-none" style="will-change:transform;touch-action:pan-y">';
  if(item.context)html+='<p class="mb-4 text-[12px] font-semibold text-zinc-500">'+e(item.context)+'</p>';
  html+='<div class="flex items-start justify-between gap-3"><p class="flex-1 text-[24px] font-semibold leading-snug tracking-tight" lang="sv">'+e(item.sv)+'</p>'+
    '<button class="chip !px-3" data-action="speak" data-sv="'+e(item.sv)+'" aria-label="Прослушать">'+ico('volume-2')+'</button></div>';
  html+='<p class="mt-4 text-[16px] leading-relaxed text-zinc-600">'+e(item.ru)+'</p>';
  if(item.note)html+='<div class="mt-5 rounded-xl bg-zinc-100 p-4 text-[13px] leading-relaxed text-zinc-600">'+e(item.note)+'</div>';
  return html+'</article>';
}

// dx < 0 means next; dx > 0 means previous. Velocity enables short, decisive flicks.
export function swipeDirection(dx,elapsed,width,canPrevious,canNext) {
  const distance=Math.abs(dx);
  const committed=distance>Math.max(50,width*.20) ||
    (distance>28 && distance/Math.max(1,elapsed)>.55);
  if(!committed)return 0;
  if(dx<0&&canNext)return 1;
  if(dx>0&&canPrevious)return -1;
  return 0;
}

export function bind(root,ctx) {
  if(ctx.mode!=='examples')return;
  const deck=root.querySelector('[data-example-deck]');
  const card=deck?.querySelector('[data-example-card]');
  if(!deck||!card)return;
  const list=ctx.data.examples||[];
  const state=ctx.state;
  let gesture=null,animating=false,preview=null,previewDir=0;

  function neighbor(dir) {
    const index=(state.pos||0)+dir;
    return index>=0&&index<list.length?list[state.exampleOrder[index]]:null;
  }
  function clearPreview() {
    preview?.remove();
    preview=null;previewDir=0;
    deck.style.minHeight='';
  }
  function incoming(dir) {
    if(preview&&previewDir===dir)return preview;
    clearPreview();
    const next=neighbor(dir);
    if(!next)return null;
    preview=document.createElement('div');
    preview.className='absolute inset-x-0 top-0';
    preview.setAttribute('aria-hidden','true');
    preview.inert=true;
    preview.style.pointerEvents='none';
    preview.innerHTML=exampleCard(next);
    // Copy the already rendered Lucide icon to avoid a reflow during a drag.
    const svg=card.querySelector('svg');
    const placeholder=preview.querySelector('[data-lucide]');
    if(svg&&placeholder)placeholder.replaceWith(svg.cloneNode(true));
    deck.appendChild(preview);
    previewDir=dir;
    deck.style.minHeight=Math.max(card.offsetHeight,preview.firstElementChild.offsetHeight)+'px';
    return preview;
  }
  function position(dx,dir) {
    const width=deck.clientWidth||320;
    const available=!!neighbor(dir);
    const drag=available?dx:dx*.22;
    card.style.transform='translate3d('+drag+'px,0,0)';
    card.style.opacity=String(1-Math.min(Math.abs(drag)/width,1)*.13);
    const next=available?incoming(dir):null;
    if(!available)clearPreview();
    if(next){
      next.style.transform='translate3d('+(drag+dir*(width+12))+'px,0,0)';
      next.style.opacity=String(.72+Math.min(Math.abs(drag)/width,1)*.28);
    }
  }
  function animate(el,from,to,duration) {
    if(!el)return Promise.resolve();
    if(!duration||typeof el.animate!=='function'){
      el.style.transform=to.transform;
      el.style.opacity=String(to.opacity);
      return Promise.resolve();
    }
    const animation=el.animate([from,to],{
      duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'
    });
    return animation.finished.then(()=>{
      // WAAPI fill-forwards otherwise masks future pointer-driven transforms.
      el.style.transform=to.transform;
      el.style.opacity=String(to.opacity);
      animation.cancel();
    }).catch(()=>{});
  }
  async function transition(dir,dx=0) {
    if(animating||!deck.isConnected)return;
    const next=neighbor(dir);
    if(!next){
      if(dir===1) {complete(ctx.data.slug,'examples');ctx.advance();}
      return;
    }
    animating=true;
    const width=deck.clientWidth||320;
    const fromX=dir?dx:0;
    const nextCard=incoming(dir);
    if(!nextCard){animating=false;return;}
    // An incoming card starts just beyond the edge, without layout shifts.
    const incomingX=fromX+dir*(width+12);
    const reduce=typeof window!=='undefined'&&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration=reduce?0:Math.max(190,Math.min(310,280-Math.abs(dx)*.2));
    card.style.transform='translate3d('+fromX+'px,0,0)';
    nextCard.style.transform='translate3d('+incomingX+'px,0,0)';
    const outgoingOpacity=Number(card.style.opacity||1);
    const incomingOpacity=Number(nextCard.style.opacity||.72);
    await Promise.all([
      animate(card,{transform:'translate3d('+fromX+'px,0,0)',opacity:outgoingOpacity},
        {transform:'translate3d('+(-dir*(width+12))+'px,0,0)',opacity:.66},duration),
      animate(nextCard,{transform:'translate3d('+incomingX+'px,0,0)',opacity:incomingOpacity},
        {transform:'translate3d(0px,0,0)',opacity:1},duration)
    ]);
    if(!deck.isConnected)return;
    state.pos+=dir;
    ctx.refresh();
  }
  async function bounce(dx=0) {
    if(animating)return;
    animating=true;
    const duration=typeof window!=='undefined'&&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:210;
    const dir=dx<0?1:-1,other=preview;
    const width=deck.clientWidth||320;
    await Promise.all([
      animate(card,{transform:'translate3d('+dx+'px,0,0)',opacity:card.style.opacity||1},
        {transform:'translate3d(0px,0,0)',opacity:1},duration),
      animate(other,{transform:'translate3d('+(dx+dir*(width+12))+'px,0,0)',opacity:.72},
        {transform:'translate3d('+(dir*(width+12))+'px,0,0)',opacity:.72},duration)
    ]);
    if(!deck.isConnected)return;
    card.style.transform='';card.style.opacity='';
    clearPreview();
    animating=false;
  }
  state.slide=dir=>transition(dir);
  deck.addEventListener('pointerdown',event=>{
    if(animating||!event.isPrimary||event.pointerType==='mouse'&&event.button!==0)return;
    if(event.target.closest('button,a,input,textarea,[data-action]'))return;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now(),dx:0,locked:false};
  });
  deck.addEventListener('pointermove',event=>{
    const g=gesture;
    if(!g||event.pointerId!==g.id||animating)return;
    const dx=event.clientX-g.x,dy=event.clientY-g.y;
    if(!g.locked){
      if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
      if(Math.abs(dx)<9||Math.abs(dx)<Math.abs(dy)*1.2)return;
      g.locked=true;
      if(deck.setPointerCapture)deck.setPointerCapture(g.id);
    }
    event.preventDefault();
    g.dx=dx;
    position(dx,dx<0?1:-1);
  });
  function finish(event,cancel=false) {
    const g=gesture;
    if(!g||event.pointerId!==g.id)return;
    gesture=null;
    if(deck.hasPointerCapture?.(g.id))deck.releasePointerCapture(g.id);
    if(!g.locked)return;
    const width=deck.clientWidth||320;
    const dx=event.clientX-g.x;
    const move=cancel?0:swipeDirection(dx,performance.now()-g.at,width,
      !!neighbor(-1),!!neighbor(1));
    if(move)transition(move,dx);
    else bounce(card.style.transform?Number(card.style.transform.match(/-?[\d.]+(?=px)/)?.[0]||0):0);
  }
  deck.addEventListener('pointerup',event=>finish(event));
  deck.addEventListener('pointercancel',event=>finish(event,true));
}

export function render(data, state, mode) {
  const list=data[mode] || [];
  const item=mode==='examples'?currentExample(list,state):list[state.pos||0];
  const pos=Math.max(0,Math.min(state.pos||0,list.length-1));
  const title=mode==='theory'?'Коротко о главном':'Смотрите, как это звучит';
  if (!item) return '<p>В этом разделе пока нет материалов.</p>';
  let html='<div class="pt-4">'+sectionTitle(mode==='theory'?'Разберём правило':'Живые примеры',title,'Шаг '+(pos+1)+' из '+list.length)+'</div>';
  html+='<div class="mb-5 h-1 overflow-hidden rounded-full bg-zinc-200"><div class="h-full bg-zinc-950" style="width:'+((pos+1)/list.length*100)+'%"></div></div>';
  if (mode==='theory') {
    html+='<article class="surface"><h3 class="text-[22px] font-semibold tracking-tight">'+e(item.title)+'</h3><p class="mt-4 whitespace-pre-line text-[15px] leading-7 text-zinc-700">'+e(item.body)+'</p>';
    if (item.rows?.length) {
      html+='<dl class="mt-5 divide-y divide-zinc-100">';
      for (const row of item.rows) {
        html+='<div class="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">'+
          '<dt lang="sv" class="min-w-0 text-[19px] font-semibold tracking-tight text-zinc-950">'+e(row.sv)+'</dt>'+
          '<dd class="ml-auto flex shrink-0 items-center gap-2.5 text-right">'+
            '<span class="text-[15px] leading-relaxed text-zinc-600">'+e(row.ru)+'</span>'+
            '<button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition active:scale-95 active:bg-zinc-200" data-action="speak" data-sv="'+e(row.sv)+'" aria-label="Прослушать '+e(row.sv)+'" title="Прослушать">'+ico('volume-2','h-[17px] w-[17px]')+'</button>'+
          '</dd>'+
        '</div>';
      }
      html+='</dl>';
    }
    if (item.note) html+='<div class="mt-5 flex items-start gap-2.5 rounded-2xl bg-zinc-100 px-4 py-3.5 text-[13px] leading-relaxed text-zinc-600">'+
      ico('info','mt-0.5 h-4 w-4 shrink-0 text-zinc-500')+'<p>'+e(item.note)+'</p></div>';
    if (item.pattern) html+='<div class="mt-6 rounded-2xl bg-zinc-950 p-4 text-white"><div class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Запомните</div><p class="text-[19px] font-semibold">'+e(item.pattern)+'</p><p class="mt-1 text-[13px] text-zinc-400">'+e(item.translation || '')+'</p><button class="mt-4 text-[13px] font-semibold" data-action="speak" data-sv="'+e(item.pattern)+'">'+ico('volume-2')+' Слушать</button></div>';
    html+='</article>';
  } else {
    html+='<div data-example-deck class="relative overflow-hidden rounded-[26px]" style="touch-action:pan-y">'+exampleCard(item)+'</div>';
    html+='<p class="mt-3 flex items-center justify-center gap-2 text-[11px] text-zinc-400" aria-hidden="true">'+
      ico('move-horizontal','h-3.5 w-3.5')+' Смахните влево или вправо</p>';
  }
  html+='<div class="mt-6 grid grid-cols-2 gap-2.5"><button class="ghost" data-action="prev" '+(pos===0?'disabled style="opacity:.3"':'')+'>'+ico('arrow-left')+' Назад</button><button class="primary" data-action="next">'+(pos===list.length-1?'Завершить':'Дальше')+' '+ico('arrow-right')+'</button></div>';
  return html;
}
export function action(name, element, ctx) {
  if (name==='speak') { speak(element.dataset.sv); return; }
  if(ctx.mode==='examples'&&(name==='prev'||name==='next')&&ctx.state.slide){
    ctx.state.slide(name==='next'?1:-1);
    return;
  }
  if(name==='prev') { ctx.state.pos=Math.max(0,ctx.state.pos-1);ctx.refresh(); }
  if(name==='next') {
    if(ctx.state.pos<(ctx.data[ctx.mode].length-1)) { ctx.state.pos++;ctx.refresh(); }
    else { complete(ctx.data.slug,ctx.mode);ctx.advance(); }
  }
}
