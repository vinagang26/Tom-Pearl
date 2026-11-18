import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.attributes={};this.namespaceURI='http://www.w3.org/2000/svg';}
 append(...values){this.children.push(...values);}
 replaceChildren(...values){this.children=values;}
 setAttribute(key,value){this.attributes[key]=value;}
 addEventListener(){}
 get textContent(){return this.children.map(c=>typeof c==='string'?c:c.textContent||'').join(' ');}
}
const root=new Element(),body=new Element();
const document={body,querySelector:()=>root,createElement:tag=>new Element(tag),createElementNS:(namespace,tag)=>new Element(tag),createTextNode:text=>({textContent:text})};
const context=vm.createContext({document,window:{addEventListener(){}},Node:Element,location:{hash:''},history:{replaceState(){}},localStorage:{getItem(){return null;},setItem(){}},fetch:async()=>{throw Error('Offline test');},AbortSignal,structuredClone,setTimeout,clearTimeout,console,URL,Blob,performance,crypto:globalThis.crypto});
const html=await readFile(new URL('../preview.html',import.meta.url),'utf8');
vm.runInContext(html.split('<script>')[1].split('</script>')[0],context,{timeout:10000});
await new Promise(setImmediate);
assert(root.textContent.includes('Make them yours.'));
assert(root.textContent.includes('Writing test'));
assert(root.textContent.includes('Start a lesson'));
console.log('Standalone app boots offline with its bundled schemas and learning modules.');
