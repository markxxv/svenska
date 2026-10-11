import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../data/',import.meta.url);
const load=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
test('lessons contain only learning stages in their manifest',async()=>{
  const index=await load('index.json');
  assert.ok(index.topics.length>0);
  const slugs=new Set();
  for(const t of index.topics){
    assert.ok(!slugs.has(t.slug),t.slug+' duplicate');
    slugs.add(t.slug);
    assert.equal((await load(t.slug+'/meta.json')).title,t.title);
    assert.ok(!t.files.phrases&&!t.files.dictionary,'Mixed content should not appear in lesson navigation');
    for(const [name,file] of Object.entries(t.files)){
      const entries=await load(t.slug+'/'+file);
      assert.ok(Array.isArray(entries)&&entries.length>0,t.slug+'/'+file);
      if(name==='quiz')for(const q of entries){
        assert.ok(['choice','order'].includes(q.type));
        if(q.type==='choice')assert.ok(q.options.includes(q.answer),t.slug);
        if(q.type==='order')assert.ok(q.words?.length>=2,t.slug);
      }
    }
  }
});
test('dictionary and phrase collections are independent and valid',async()=>{
  for(const kind of ['dictionaries','phrases']){
    const catalog=await load(kind+'/index.json');
    assert.ok(catalog.collections.length>=2);
    const ids=new Set();
    for(const entry of catalog.collections){
      assert.ok(!ids.has(entry.slug));ids.add(entry.slug);
      const meta=await load(kind+'/'+entry.slug+'/meta.json');
      assert.equal(meta.title,entry.title);
      const items=await load(kind+'/'+entry.slug+'/items.json');
      assert.equal(items.length,entry.count);
      for(const item of items){
        if(kind==='dictionaries')assert.ok(item.sv&&item.ru);
        else assert.ok(item.text&&item.translation&&Array.isArray(item.words));
      }
    }
  }
});
test('all 40 original phrase IDs are present exactly once in phrase collections',async()=>{
  const catalog=await load('phrases/index.json');
  const all=(await Promise.all(catalog.collections.map(entry=>load('phrases/'+entry.slug+'/items.json')))).flat();
  for(let id=1;id<=40;id++)assert.equal(all.filter(p=>p.id===id).length,1,'original phrase '+id);
});

test('topics are a separate catalog with pronouns as the only entry',async()=>{
  const lessons=await load('index.json');
  const topics=await load('topics/index.json');
  assert.equal(topics.topics.length,1);
  assert.equal(topics.topics[0].slug,'pronouns');
  assert.ok(!topics.topics[0].files.cards);
  assert.ok(!lessons.topics.some(entry=>entry.slug==='pronouns'));
  for(const entry of topics.topics){
    assert.equal(entry.path,'topics/'+entry.slug);
    assert.equal((await load(entry.path+'/meta.json')).title,entry.title);
    for(const file of Object.values(entry.files)){
      const items=await load(entry.path+'/'+file);
      assert.ok(Array.isArray(items)&&items.length>0);
    }
  }
});
