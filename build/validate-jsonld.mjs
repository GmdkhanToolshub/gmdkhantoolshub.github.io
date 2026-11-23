import fs from 'fs'; import path from 'path';
let n=0,bad=[],types={};
(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);const r=path.relative('D:/GM_Claude',p).replace(/\\/g,'/');if(/^(\.git|node_modules|products|build|scripts|assets)(\/|$)/.test(r))continue;if(e.isDirectory())w(p);else if(e.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){n++;try{const o=JSON.parse(m[1]);const t=o['@type'];types[t]=(types[t]||0)+1;if(!o['@context'])bad.push(r+' no context')}catch(x){bad.push(r+' '+x.message)}}}}})('D:/GM_Claude');
console.log('json-ld blocks',n,'invalid',bad.length,bad.slice(0,5),JSON.stringify(types));
