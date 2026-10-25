import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,readArticles,parseArticle} from './build.mjs';
import {renderMarkdown} from '../assets/markdown.mjs';
const posts=await readArticles();
const home=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
assert(!home.includes('/write/'),'No public writing entry');
await assert.rejects(fs.access(path.join(root,'dist/write/index.html')));
await assert.rejects(fs.access(path.join(root,'dist/assets/editor.mjs')));
assert(!/<script(?![^>]*\bsrc=)[^>]*>/.test(home),'No inline scripts');
const policy=await fs.readFile(path.join(root,'netlify.toml'),'utf8');
assert(policy.includes("script-src 'self'"));
assert(policy.includes("form-action 'none'"));
assert(policy.includes("frame-ancestors 'none'"));
let last=-1;
for(const p of posts){const at=home.indexOf('href="'+p.url+'"');assert(at>last,'Chronology must be preserved');last=at;const article=await fs.readFile(path.join(root,'dist',p.url,'index.html'),'utf8');assert(article.includes('<h1>'+p.title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')+'</h1>'));assert(article.includes('rel="canonical"'));}
const search=JSON.parse(await fs.readFile(path.join(root,'dist/search.json'),'utf8'));assert.deepEqual(search.map(p=>p.id),posts.map(p=>p.id));
const feed=await fs.readFile(path.join(root,'dist/feed.xml'),'utf8');assert.equal((feed.match(/<item>/g)||[]).length,posts.length);assert(!feed.includes('Invalid Date'));
async function verifyLinks(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory()){await verifyLinks(p);continue;}if(!p.endsWith('.html'))continue;const html=await fs.readFile(p,'utf8');for(const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){const url=m[1];const target=path.join(root,'dist',url,url.endsWith('/')?'index.html':'');await fs.access(target).catch(()=>{throw Error('Broken link '+url+' in '+p);});}}}
await verifyLinks(path.join(root,'dist'));
const rendered=renderMarkdown('## One\n\nA **bold** line [source](https://example.com) [^1].\n\n![alt](https://example.com/image.jpg)\n\n[^1]: A note\n\n<script>alert(1)</script>\n\n[bad](javascript:alert)');
assert.equal(rendered.headings.length,1);assert(rendered.html.includes('<strong>bold</strong>'));assert(rendered.html.includes('id="note-1"'));assert(!rendered.html.includes('<script>'));assert(!rendered.html.includes('href="javascript:'));
assert.throws(()=>parseArticle('---\ntitle: "Bad"\ndate: "2026-02-30"\n---\ntext','bad.md'));
console.log('Verified '+posts.length+' articles, chronology, internal links, search, RSS, metadata and Markdown escaping.');
