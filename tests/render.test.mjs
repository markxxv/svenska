import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as home from '../js/modules/home.js';
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
async function load(path) {
  return JSON.parse(await readFile(new URL(path,root),'utf8'));
}
test('every lesson renders its available stages',async()=>{
  const index=await load('index.json');
  assert.match(home.render(index.topics),/Заказать пиццу или кебаб/);
  for(const meta of index.topics) {
    const data={slug:meta.slug,meta};
    for(const [name,file] of Object.entries(meta.files)) data[name]=await load(meta.slug+'/'+file);
    assert.match(overview.render(data),/Этапы урока/);
    if(data.theory) assert.ok(steps.render(data,{pos:0},'theory').length>100,meta.slug+' theory');
    if(data.examples) assert.ok(steps.render(data,{pos:0},'examples').length>100,meta.slug+' examples');
    if(data.cards) assert.ok(cards.render(data,{}).includes('data-action="flip"'),meta.slug+' cards');
    if(data.phrases) assert.ok(phrases.render(data,{}).includes('data-action="phrase-speak"'),meta.slug+' phrases');
    if(data.dictionary) assert.ok(dictionary.render(data,{}).includes('data-dictionary-item'),meta.slug+' dictionary');
    if(data.quiz) assert.ok(quiz.render(data,{}).includes('data-action='),meta.slug+' quiz');
  }
});
