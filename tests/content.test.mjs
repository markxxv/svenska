import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const data=new URL('../data/',import.meta.url);
const load=async path=>JSON.parse(await readFile(new URL(path,data),'utf8'));
test('catalog entries resolve to real topic data',async()=>{
  const index=await load('index.json');
  assert.ok(index.topics.length>=15);
  const slugs=new Set();
  for(const t of index.topics){
    assert.ok(!slugs.has(t.slug),t.slug+' duplicate');
    slugs.add(t.slug);
    assert.equal((await load(t.slug+'/meta.json')).title,t.title);
    for(const [name,file] of Object.entries(t.files)){
      const entries=await load(t.slug+'/'+file);
      assert.ok(Array.isArray(entries)&&entries.length>0,t.slug+'/'+file);
      if(name==='quiz') for(const q of entries){
        assert.ok(['choice','order'].includes(q.type));
        if(q.type==='choice') assert.ok(q.options.includes(q.answer),t.slug);
        if(q.type==='order') assert.ok(q.words?.length>=2,t.slug);
      }
      if(name==='phrases') for(const p of entries){
        assert.ok(p.text&&p.translation);
        assert.ok(p.words.every(w=>w.length>=3));
      }
    }
  }
});
test('all 40 original phrases are preserved in the topic folders',async()=>{
  const index=await load('index.json');
  const phrases=(await Promise.all(index.topics.filter(t=>t.files.phrases).map(t=>load(t.slug+'/phrases.json')))).flat();
  for(let id=1;id<=40;id++) assert.equal(phrases.filter(p=>p.id===id).length,1,'legacy phrase '+id);
});
