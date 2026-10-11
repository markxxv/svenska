import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as home from '../js/modules/home.js';
import * as topics from '../js/modules/topics.js';
import * as collections from '../js/modules/collections.js';
import * as overview from '../js/modules/overview.js';
import * as steps from '../js/modules/steps.js';
import * as cards from '../js/modules/cards.js';
import * as phrases from '../js/modules/phrases.js';
import * as dictionary from '../js/modules/dictionary.js';
import * as quiz from '../js/modules/quiz.js';
globalThis.localStorage={
  items:new Map(),
  getItem(key){return this.items.get(key)??null;},
  setItem(key,value){this.items.set(key,String(value));}
};
const root=new URL('../data/',import.meta.url);
const load=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
test('lesson and section screens render',async()=>{
  const index=await load('index.json');
  assert.match(home.render(index.topics),/Уроки шведского/);
  for(const meta of index.topics){
    const data={slug:meta.slug,meta};
    for(const [name,file] of Object.entries(meta.files))data[name]=await load(meta.slug+'/'+file);
    assert.match(overview.render(data),/Этапы урока/);
    if(data.theory)assert.ok(steps.render(data,{pos:0},'theory').length>100,meta.slug+' theory');
    if(data.examples)assert.ok(steps.render(data,{pos:0},'examples').length>100,meta.slug+' examples');
    if(data.cards)assert.ok(cards.render(data,{}).includes('data-action="flip"'),meta.slug+' cards');
    if(data.quiz)assert.ok(quiz.render(data,{}).includes('data-action='),meta.slug+' quiz');
  }
  for(const kind of ['dictionaries','phrases']){
    const index=await load(kind+'/index.json');
    const overview=collections.render(kind,index.collections);
    assert.match(overview,kind==='dictionaries'?/Словари/:/Фразы/);
    for(const meta of index.collections){
      assert.ok(overview.includes('#/'+kind+'/'+meta.slug));
      const items=await load(kind+'/'+meta.slug+'/items.json');
      const data={meta,slug:kind+':'+meta.slug,collectionType:kind,
        dictionary:kind==='dictionaries'?items:[],
        phrases:kind==='phrases'?items:[]};
      const rendered=kind==='dictionaries'?dictionary.render(data,{}):phrases.render(data,{});
      assert.ok(rendered.length>100);
      assert.ok(rendered.includes(kind==='dictionaries'?'data-dictionary-item':'data-action="phrase-speak"'));
      assert.ok(rendered.includes(meta.title));
    }
  }
});

test('topics tab renders only pronouns and its lesson stages',async()=>{
  const {topics:items}=await load('topics/index.json');
  const screen=topics.render(items);
  assert.match(screen,/Местоимения/);
  assert.ok(screen.includes('#/topic/pronouns/overview'));
  const entry=items[0], data={slug:entry.slug,meta:entry};
  for(const [name,file] of Object.entries(entry.files))data[name]=await load(entry.path+'/'+file);
  assert.match(overview.render(data),/Этапы урока/);
  assert.ok(steps.render(data,{pos:0},'theory').length>100);
});

test('pronouns theory shows aligned vocabulary rows and a pronunciation note',async()=>{
  const content=await load('topics/pronouns/theory.json');
  const data={slug:'pronouns',theory:content};
  const screen=steps.render(data,{pos:0},'theory');
  assert.ok(screen.includes('<dl class="mt-5 divide-y divide-zinc-100">'));
  assert.ok(screen.includes('<dt lang="sv"'));
  assert.ok(screen.includes('jag</dt>'));
  assert.ok(screen.includes('В разговорной речи de'));
  assert.ok(!screen.includes('jag — я, du — ты'));
});
