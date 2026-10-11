import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=new URL('../data/',import.meta.url);
const allowed=['theory','examples','cards','phrases','dictionary','quiz'];
const required=['title','group','groupTitle','outcome'];
const ranks={start:1,food:2,life:3,grammar:4,housing:5};
const entries=await readdir(root,{withFileTypes:true});
const topics=[];
for(const dir of entries.filter(x=>x.isDirectory()&&!x.name.startsWith('_'))) {
  const slug=dir.name;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Invalid slug: '+slug);
  const folder=new URL(slug+'/',root);
  const names=await readdir(folder);
  if(!names.includes('meta.json')) throw Error(slug+': missing meta.json');
  const meta=JSON.parse(await readFile(new URL('meta.json',folder),'utf8'));
  if(meta.slug!==slug) throw Error(slug+': meta.slug must match folder name');
  for(const field of required) if(!meta[field]) throw Error(slug+': missing '+field);
  const files={};
  for(const name of allowed) {
    const filename=name+'.json';
    if(!names.includes(filename)) continue;
    const value=JSON.parse(await readFile(new URL(filename,folder),'utf8'));
    if(!Array.isArray(value)) throw Error(slug+'/'+filename+': expected array');
    if(!value.length) continue;
    files[name]=filename;
  }
  if(!Object.keys(files).length) throw Error(slug+': no lesson content found');
  topics.push({...meta,files});
}
topics.sort((a,b)=>(ranks[a.group]||99)-(ranks[b.group]||99)||(a.order||0)-(b.order||0)||a.title.localeCompare(b.title,'ru'));
const result=JSON.stringify({version:1,topics},null,2)+'\n';
const target=new URL('index.json',root);
if(process.argv.includes('--check')) {
  let before='';
  try{before=await readFile(target,'utf8');}catch{}
  if(before!==result) {console.error('data/index.json is outdated; run npm run content:sync');process.exitCode=1;}
  else console.log('Content index is up to date ('+topics.length+' topics)');
} else {
  await writeFile(target,result,'utf8');
  console.log('Generated data/index.json for '+topics.length+' topics');
}
