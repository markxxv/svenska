import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as quizEngine from '../js/modules/quiz.js';
import {shuffleIndices} from '../js/core.js';

const load=async path=>JSON.parse(await readFile(new URL('../data/topics/pronouns/'+path,import.meta.url),'utf8'));
globalThis.localStorage={storage:new Map(),getItem(k){return this.storage.get(k)||null;},setItem(k,v){this.storage.set(k,v)}};
test('all 50 quiz questions have answers in the taught material',async()=>{
  const [questions,examples,theory]=await Promise.all([load('quiz.json'),load('examples.json'),load('theory.json')]);
  const taught=new Set([...examples.map(p=>p.sv),...theory.flatMap(t=>(t.rows||[]).map(r=>r.sv))]);
  assert.equal(questions.length,50);
  assert.equal(new Set(questions.map(q=>q.question||q.prompt)).size,50);
  assert.equal(questions.filter(q=>q.type==='choice').length,38);
  assert.equal(questions.filter(q=>q.type==='order').length,12);
  for(const q of questions){
    assert.ok(taught.has(q.source),'Question not derived from taught material: '+q.source);
    if(q.type==='choice'){
      assert.equal(q.options.length,4);
      assert.equal(new Set(q.options).size,4);
      assert.equal(q.options.filter(v=>v===q.answer).length,1);
    }else{
      assert.deepEqual([...q.words].sort(),q.answer.split(' ').sort());
    }
  }
});
test('quiz shuffles every question once and does not repeat any question during a run',async()=>{
  const questions=await load('quiz.json');
  const state={};
  const data={slug:'pronouns',quiz:questions};
  const first=quizEngine.render(data,state);
  assert.match(first,/Вопрос 1 из 50/);
  assert.deepEqual([...state.questionOrder].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i));
  const permutation=state.questionOrder;
  const ctx={data,state,refresh:()=>quizEngine.render(data,state)};
  for(let n=0;n<50;n++){
    const q=questions[state.questionOrder[state.index]];
    if(q.type==='choice'){
      quizEngine.action('choose',{dataset:{choice:String(q.options.indexOf(q.answer))}},ctx);
    }else{
      const used=new Set();
      for(const word of q.answer.split(' ')){
        const ix=q.words.findIndex((t,i)=>t===word&&!used.has(i));
        assert.ok(ix>=0);
        used.add(ix);
        quizEngine.action('append',{dataset:{token:String(ix)}},ctx);
      }
      quizEngine.action('check',{},ctx);
    }
    assert.equal(state.score,n+1,'Expected learned answer to pass: '+n);
    quizEngine.action('next',{},ctx);
  }
  assert.strictEqual(state.questionOrder,permutation);
  assert.equal(state.index,50);
  assert.match(quizEngine.render(data,state),/Результат: 50 из 50/);
  quizEngine.action('restart',{},ctx);
  assert.deepEqual([...state.questionOrder].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i));
  assert.notStrictEqual(state.questionOrder,permutation);
});
test('quiz shuffle works for other collections and variable counts',()=>{
  for(const size of [1,2,10,50,70]){
    const order=shuffleIndices(size,()=>0.37);
    assert.equal(new Set(order).size,size);
    assert.deepEqual([...order].sort((a,b)=>a-b),Array.from({length:size},(_,i)=>i));
  }
});
