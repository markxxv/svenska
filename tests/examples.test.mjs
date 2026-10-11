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
