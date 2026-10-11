import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

test('all client modules are covered by cache-busting import map',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/map\.type = 'importmap'/);
  assert.match(html,/import\('\.\/js\/app\.js'\)/);
  assert.ok(!html.includes('<script type="module" src="./js/app.js">'));
  const modules=['app.js','core.js',...(await readdir(new URL('../js/modules/',import.meta.url))).map(name=>'modules/'+name)];
  for(const path of modules)assert.ok(html.includes("'js/"+path+"'"),'Not in import map: '+path);
});
test('JSON fetching is revisioned and not stored in browser cache',async()=>{
  const source=await readFile(new URL('../js/core.js',import.meta.url),'utf8');
  const topics=await readFile(new URL('../js/modules/topics.js',import.meta.url),'utf8');
  assert.match(source,/url\.searchParams\.set\('v', VERSION\)/);
  assert.match(source,/fetch\(url, \{cache:'no-store'\}\)/);
  assert.match(topics,/json\('topics\/index\.json'\)/);
});
