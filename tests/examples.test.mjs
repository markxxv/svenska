import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {shuffleIndices,currentExample,render} from '../js/modules/steps.js';
const load=async()=>JSON.parse(await readFile(new URL('../data/topics/pronouns/examples.json',import.meta.url),'utf8'));
test('50 distinct colloquial examples from multiple settings',async()=>{
  const items=await load();
  assert.equal(items.length,50);
  assert.equal(new Set(items.map(item=>item.sv.toLocaleLowerCase('sv'))).size,50);
  assert.ok(new Set(items.map(item=>item.context)).size>=5);
  for(const item of items)assert.ok(item.sv&&item.ru&&item.context);
});
test('Fisher-Yates yields a permutation without repetitions',()=>{
  for(const n of [0,1,2,7,12,50,75]){
    for(const rng of [()=>0,()=>0.47,()=>0.99999]){
      const indices=shuffleIndices(n,rng);
      assert.equal(indices.length,n);
      assert.deepEqual([...indices].sort((a,b)=>a-b),Array.from({length:n},(_,i)=>i));
    }
  }
  assert.notDeepEqual(shuffleIndices(50,()=>0.47),Array.from({length:50},(_,i)=>i));
});
test('examples traverse one shuffled sequence, preserving backward history',async()=>{
  const items=await load(),state={},seen=[];
  for(let pos=0;pos<items.length;pos++){
    state.pos=pos;
    const item=currentExample(items,state,()=>0.37);
    seen.push(item.sv);
    assert.strictEqual(currentExample(items,state,()=>0.99),item);
  }
  assert.equal(new Set(seen).size,50);
  state.pos=11;
  const previous=currentExample(items,state);
  state.pos=12;
  currentExample(items,state);
  state.pos=11;
  assert.strictEqual(currentExample(items,state),previous);
});
test('separate sessions produce independent randomized sequences',async()=>{
  const items=await load(),a={},b={};
  currentExample(items,a,()=>0);
  currentExample(items,b,()=>0.75);
  assert.notDeepEqual(a.exampleOrder,b.exampleOrder);
  assert.notStrictEqual(a.exampleOrder,b.exampleOrder);
});
test('shared UI shows current shuffled example, context and audio',async()=>{
  const items=await load(),state={};
  const first=render({examples:items},state,'examples');
  assert.equal(state.exampleOrder.length,50);
  assert.ok(first.includes('Шаг 1 из 50'));
  assert.ok(first.includes(items[state.exampleOrder[0]].sv));
  assert.ok(first.includes(items[state.exampleOrder[0]].context));
  assert.ok(first.includes('data-action="speak"'));
  const order=state.exampleOrder;
  const second=render({examples:items},state,'examples');
  assert.strictEqual(state.exampleOrder,order);
  assert.ok(second.includes(items[order[0]].sv));
});


test('swipe thresholds are deliberate and respect first/last example boundaries',async()=>{
  const {swipeDirection}=await import('../js/modules/steps.js');
  assert.equal(swipeDirection(-95,600,360,true,true),1);
  assert.equal(swipeDirection(95,600,360,true,true),-1);
  assert.equal(swipeDirection(-44,600,360,true,true),0);
  assert.equal(swipeDirection(-40,55,360,true,true),1);
  assert.equal(swipeDirection(40,55,360,true,true),-1);
  assert.equal(swipeDirection(-95,600,360,true,false),0);
  assert.equal(swipeDirection(95,600,360,false,true),0);
});
test('swipeable example markup retains pronunciation and buttons, but not theory gestures',async()=>{
  const items=await load(),data={examples:items,theory:[{title:'Правило',body:'Пояснение'}]};
  const example=render(data,{},'examples');
  assert.match(example,/data-example-deck/);
  assert.match(example,/data-example-card/);
  assert.match(example,/touch-action:pan-y/);
  assert.match(example,/data-action="speak"/);
  assert.match(example,/data-action="prev"/);
  assert.match(example,/data-action="next"/);
  const theory=render(data,{},'theory');
  assert.ok(!theory.includes('data-example-deck'));
});


test('gesture binding moves the live card and keeps the same shuffled order in both directions',async()=>{
  const {bind}=await import('../js/modules/steps.js');
  const previousDocument=globalThis.document;
  const created=[];
  globalThis.document={createElement(){
    const element={
      style:{}, firstElementChild:{offsetHeight:180},
      querySelector(){return null;},setAttribute(){},remove(){this.removed=true;}
    };
    created.push(element);
    return element;
  }};
  function setup(state,ctx){
    const listeners=new Map();
    const card={style:{},offsetHeight:180,querySelector(){return null;}};
    const deck={
      style:{},clientWidth:360,isConnected:true,children:[],
      querySelector(name){return name==='[data-example-card]'?card:null;},
      addEventListener(type,cb){listeners.set(type,cb);},
      appendChild(el){this.children.push(el);},
      setPointerCapture(id){this.capture=id;},
      hasPointerCapture(id){return this.capture===id;},
      releasePointerCapture(){this.capture=null;}
    };
    bind({querySelector:()=>deck},{...ctx,state,mode:'examples'});
    return {listeners,deck,card};
  }
  function event(x,y=0){
    return {pointerId:1,isPrimary:true,pointerType:'touch',button:0,
      clientX:x,clientY:y,target:{closest(){return null;}},
      preventDefault(){this.prevented=true;}};
  }
  const data={slug:'pronouns',examples:await load()};
  const state={pos:0,exampleOrder:Array.from({length:data.examples.length},(_,i)=>i)};
  const order=state.exampleOrder;
  let refreshes=0;
  const ctx={data,refresh(){refreshes++;},advance(){}};
  try{
    let {listeners,deck,card}=setup(state,ctx);
    listeners.get('pointerdown')(event(300));
    const move=event(185);
    listeners.get('pointermove')(move);
    assert.equal(move.prevented,true);
    assert.match(card.style.transform,/translate3d\(-115px/);
    assert.ok(created[0].innerHTML.includes(data.examples[1].sv));
    listeners.get('pointerup')(event(185));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(state.pos,1);
    assert.equal(refreshes,1);
    assert.strictEqual(state.exampleOrder,order);

    ({listeners,deck,card}=setup(state,ctx));
    listeners.get('pointerdown')(event(60));
    listeners.get('pointermove')(event(165));
    listeners.get('pointerup')(event(165));
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(state.pos,0);
    assert.equal(refreshes,2);
    assert.strictEqual(state.exampleOrder,order);

    ({listeners,deck,card}=setup(state,ctx));
    listeners.get('pointerdown')(event(80));
    const vertical=event(81,90);
    listeners.get('pointermove')(vertical);
    listeners.get('pointerup')(event(81,90));
    assert.equal(vertical.prevented,undefined);
    assert.equal(state.pos,0);
  }finally{globalThis.document=previousDocument;}
});
