import {readdir,readFile,writeFile} from 'node:fs/promises';

const root=new URL('../data/',import.meta.url);
const allowed=['theory','examples','cards','quiz'];
const required=['title','group','groupTitle','outcome'];
const ranks={start:1,food:2,life:3,grammar:4,housing:5};
const check=process.argv.includes('--check');

async function readJSON(url){return JSON.parse(await readFile(url,'utf8'));}
async function output(url,value,label){
  const generated=JSON.stringify(value,null,2)+'\n';
  if(check){
    let previous='';
    try{previous=await readFile(url,'utf8');}catch{}
    if(previous!==generated){console.error(label+' needs an update. Run npm run content:sync');process.exitCode=1;}
  }else await writeFile(url,generated,'utf8');
}
const entries=await readdir(root,{withFileTypes:true});
const topics=[];
for(const dir of entries.filter(x=>x.isDirectory()&&!x.name.startsWith('_')&&!['dictionaries','phrases','topics'].includes(x.name))){
  const slug=dir.name;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Invalid lesson slug: '+slug);
  const folder=new URL(slug+'/',root),names=await readdir(folder);
  if(!names.includes('meta.json'))throw Error(slug+': missing meta.json');
  const meta=await readJSON(new URL('meta.json',folder));
  if(meta.slug!==slug)throw Error(slug+': meta.slug must match folder name');
  for(const key of required)if(!meta[key])throw Error(slug+': missing '+key);
  const files={};
  for(const kind of allowed){
    const file=kind+'.json';
    if(!names.includes(file))continue;
    const value=await readJSON(new URL(file,folder));
    if(!Array.isArray(value))throw Error(slug+'/'+file+': expected array');
    if(value.length)files[kind]=file;
  }
  if(!Object.keys(files).length)throw Error(slug+': empty lesson');
  topics.push({...meta,files});
}
topics.sort((a,b)=>(ranks[a.group]||99)-(ranks[b.group]||99)||(a.order||0)-(b.order||0)||a.title.localeCompare(b.title,'ru'));
await output(new URL('index.json',root),{version:1,topics},'data/index.json');

// Отдельный каталог тематических уроков, не смешанный с уроками на главной.
const topicsFolder=new URL('topics/',root);
const topicDirectories=await readdir(topicsFolder,{withFileTypes:true});
const thematic=[];
for(const dir of topicDirectories.filter(x=>x.isDirectory())){
  const slug=dir.name;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Invalid topic slug: '+slug);
  const folder=new URL(slug+'/',topicsFolder),names=await readdir(folder);
  if(!names.includes('meta.json'))throw Error('Topic missing meta.json: '+slug);
  const meta=await readJSON(new URL('meta.json',folder));
  if(meta.slug!==slug)throw Error('Topic slug mismatch: '+slug);
  for(const field of required)if(!meta[field])throw Error('Missing topic field '+field+': '+slug);
  const files={};
  for(const name of allowed){
    const filename=name+'.json';
    if(!names.includes(filename))continue;
    const content=await readJSON(new URL(filename,folder));
    if(!Array.isArray(content))throw Error('Topic content must be an array: '+slug+'/'+name);
    if(content.length)files[name]=filename;
  }
  if(!Object.keys(files).length)throw Error('Empty topic: '+slug);
  thematic.push({...meta,path:'topics/'+slug,files});
}
thematic.sort((a,b)=>(a.order||0)-(b.order||0)||a.title.localeCompare(b.title,'ru'));
await output(new URL('index.json',topicsFolder),{version:1,topics:thematic},'data/topics/index.json');
for(const kind of ['dictionaries','phrases']){
  const folder=new URL(kind+'/',root);
  const entries=await readdir(folder,{withFileTypes:true});
  const collections=[];
  for(const dir of entries.filter(x=>x.isDirectory())){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dir.name))throw Error('Invalid collection slug: '+dir.name);
    const path=new URL(dir.name+'/',folder);
    const meta=await readJSON(new URL('meta.json',path));
    if(meta.slug!==dir.name||!meta.title)throw Error('Invalid '+kind+'/'+dir.name+'/meta.json');
    const data=await readJSON(new URL('items.json',path));
    if(!Array.isArray(data))throw Error(kind+'/'+dir.name+': items must be an array');
    for(const item of data){
      if(kind==='dictionaries'&&(!item.sv||!item.ru))throw Error(kind+'/'+dir.name+': invalid word');
      if(kind==='phrases'&&(!item.text||!item.translation||!Array.isArray(item.words)))throw Error(kind+'/'+dir.name+': invalid phrase');
    }
    collections.push({...meta,file:'items.json',count:data.length});
  }
  collections.sort((a,b)=>(a.order||0)-(b.order||0)||a.title.localeCompare(b.title,'ru'));
  await output(new URL('index.json',folder),{version:1,collections},'data/'+kind+'/index.json');
}
console.log(check&&!process.exitCode?'All catalogs are up to date':'Checked/generated catalogs: lessons, dictionaries, phrases');
